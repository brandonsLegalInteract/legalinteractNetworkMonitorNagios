import { ArrowRight, CircleCheck, CircleHelp, TriangleAlert } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useMonitor } from '@/app/monitor-context';
import { AvailabilityBar } from '@/components/availability-bar';
import { StatCard } from '@/components/stat-card';
import { StatusBadge } from '@/components/status-badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusDot } from '@/components/ui/status-dot';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { checkLabel } from '@/domain/checks';
import { availabilityPercent, countStates, worstState } from '@/domain/status';
import { TARGET_KIND_LABEL } from '@/domain/targets';
import { TARGET_KINDS } from '@/domain/types';
import { formatRelativeTime } from '@/lib/format';
import {
  buildTargetRows,
  enabledRows,
  sortRowsWorstFirst,
  type TargetRow,
} from '@/features/targets/target-rows';

export function OverviewPage() {
  const { targets, resolver, snapshot, isLoading } = useMonitor();

  const rows = useMemo(
    () => buildTargetRows(targets, resolver, snapshot),
    [targets, resolver, snapshot],
  );

  const active = enabledRows(rows);
  const states = active.map((row) => row.status.state);
  const counts = countStates(states);
  const availability = availabilityPercent(states);
  const disabledCount = rows.length - active.length;

  const attention = sortRowsWorstFirst(active).filter((row) => row.status.state !== 'up');

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Availability across every device, application and service you are monitoring.
        </p>
      </header>

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Availability"
          value={`${String(availability)}%`}
          tone={availability >= 99 ? 'up' : availability >= 90 ? 'warning' : 'critical'}
          hint={`${String(counts.up)} of ${String(active.length)} targets available`}
        />
        <StatCard
          label="Needs attention"
          value={counts.critical + counts.warning}
          tone={counts.critical > 0 ? 'critical' : counts.warning > 0 ? 'warning' : 'up'}
          hint={`${String(counts.critical)} unavailable, ${String(counts.warning)} degraded`}
        />
        <StatCard
          label="Unknown or pending"
          value={counts.unknown + counts.pending}
          tone={counts.unknown + counts.pending > 0 ? 'unknown' : 'neutral'}
          hint="Awaiting a result, or a check that could not be interpreted"
        />
        <StatCard
          label="Monitored targets"
          value={active.length}
          hint={
            disabledCount > 0
              ? `${String(disabledCount)} disabled and excluded`
              : 'All configured targets are enabled'
          }
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Fleet health</CardTitle>
          <CardDescription>
            {active.length === 0
              ? 'No enabled targets yet.'
              : `${String(active.length)} enabled target${active.length === 1 ? '' : 's'} across ${String(new Set(active.map((row) => row.hostName)).size)} hosts.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvailabilityBar counts={counts} />
        </CardContent>
      </Card>

      <section aria-label="Attention required">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle>Attention required</CardTitle>
              <CardDescription>
                Targets that are not available, worst first. Nothing to do when this list is empty.
              </CardDescription>
            </div>
            <Link to="/targets" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              All targets
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 pb-1">
            {isLoading && rows.length === 0 ? (
              <p className="px-5 pb-5 text-sm text-muted-foreground">
                Loading availability data…
              </p>
            ) : attention.length === 0 ? (
              <div className="flex items-center gap-2.5 px-5 pb-5 text-sm text-muted-foreground">
                <CircleCheck className="size-4 text-status-up" aria-hidden="true" />
                Everything is up. No action required.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Target</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Check</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Output</TableHead>
                    <TableHead className="text-right">Last check</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attention.map((row) => (
                    <AttentionRow key={row.target.id} row={row} />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <section aria-label="Coverage by kind" className="grid gap-4 sm:grid-cols-3">
        {TARGET_KINDS.map((kind) => {
          const kindRows = active.filter((row) => row.target.kind === kind);
          const kindStates = kindRows.map((row) => row.status.state);

          return (
            <Card key={kind}>
              <CardHeader className="gap-1">
                <CardTitle>{TARGET_KIND_LABEL[kind]}</CardTitle>
                <CardDescription>
                  {kindRows.length === 0
                    ? 'Nothing configured for this kind yet.'
                    : `${String(availabilityPercent(kindStates))}% available`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                {kindRows.length === 0 ? (
                  <CircleHelp className="size-5 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <>
                    <StatusDot state={worstState(kindStates)} pulse />
                    <span className="text-sm">
                      {kindRows.length} target{kindRows.length === 1 ? '' : 's'}
                    </span>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}

function AttentionRow({ row }: { row: TargetRow }) {
  const { target, status } = row;

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link className="hover:underline" to={`/targets/${target.id}`}>
          {target.name}
        </Link>
        <span className="block text-xs text-muted-foreground">{target.address}</span>
      </TableCell>
      <TableCell className="text-muted-foreground">{TARGET_KIND_LABEL[target.kind]}</TableCell>
      <TableCell className="text-muted-foreground">{checkLabel(target)}</TableCell>
      <TableCell>
        <StatusBadge state={status.state} />
      </TableCell>
      <TableCell className="max-w-md">
        <div className="flex items-start gap-2">
          <TriangleAlert
            className="mt-0.5 size-3.5 shrink-0 text-status-critical"
            aria-hidden="true"
          />
          <span className="line-clamp-2 text-xs text-muted-foreground">
            {status.service?.pluginOutput || 'No output recorded.'}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
        {formatRelativeTime(status.service?.lastCheck ?? status.host?.lastCheck ?? 0)}
      </TableCell>
    </TableRow>
  );
}
