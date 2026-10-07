import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useMonitor } from '@/app/monitor-context';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { StatusBadge } from '@/components/status-badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusDot } from '@/components/ui/status-dot';
import { checkLabel } from '@/domain/checks';
import { generateTargetSnippet } from '@/domain/nagios-config';
import { draftToTarget, TARGET_KIND_DESCRIPTION, TARGET_KIND_LABEL, type TargetDraft } from '@/domain/targets';
import { formatClockTime, formatDuration, formatRelativeTime } from '@/lib/format';
import { TargetEditorDialog } from '@/features/targets/TargetEditorDialog';
import { buildTargetRows } from '@/features/targets/target-rows';

export function TargetDetailPage() {
  const { targetId } = useParams<{ targetId: string }>();
  const navigate = useNavigate();
  const { targets, resolver, snapshot, updateTarget, removeTarget } = useMonitor();

  const [editorOpen, setEditorOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const target = targets.find((item) => item.id === targetId);

  const row = useMemo(() => {
    if (!target) return null;
    return buildTargetRows([target], resolver, snapshot)[0] ?? null;
  }, [target, resolver, snapshot]);

  const snippet = useMemo(() => (target ? generateTargetSnippet(target) : ''), [target]);

  if (!target || !row) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-lg font-semibold">Target not found</h1>
        <p className="text-sm text-muted-foreground">
          This target is no longer in the registry. It may have been deleted or restored from a
          backup.
        </p>
        <Link to="/targets" className={buttonVariants({ variant: 'outline' })}>
          <ArrowLeft aria-hidden="true" />
          Back to targets
        </Link>
      </div>
    );
  }

  const { status } = row;
  const observation = status.service ?? status.host;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          to="/targets"
          className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          All targets
        </Link>

        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <StatusDot state={status.state} pulse className="mt-2" />
            <div className="flex flex-col gap-1">
              <h1 className="text-lg font-semibold tracking-tight">{target.name}</h1>
              <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{target.address}</span>
                <span aria-hidden="true">·</span>
                <span>{TARGET_KIND_LABEL[target.kind]}</span>
                <span aria-hidden="true">·</span>
                <span>{checkLabel(target)}</span>
                {target.enabled ? null : (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-status-warning-foreground">Disabled</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditorOpen(true)}>
              <Pencil aria-hidden="true" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              <Trash2 aria-hidden="true" />
              Delete
            </Button>
          </div>
        </header>
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>Current availability</CardTitle>
            <CardDescription>{TARGET_KIND_DESCRIPTION[target.kind]}</CardDescription>
          </div>
          <StatusBadge state={status.state} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs font-medium text-muted-foreground">Check output</p>
            <p className="mt-1 font-mono text-xs break-words">
              {observation?.pluginOutput || 'No output recorded yet.'}
            </p>
            {!status.known ? (
              <p className="mt-2 text-xs text-status-pending-foreground">
                Nagios has no status for this target yet. It will appear once the first check runs —
                or after the configuration below has been deployed.
              </p>
            ) : null}
          </div>

          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Last check" value={formatRelativeTime(observation?.lastCheck ?? 0)} />
            <Fact label="Next check" value={formatRelativeTime(observation?.nextCheck ?? 0)} />
            <Fact
              label="State since"
              value={
                observation && observation.lastStateChange > 0
                  ? `${formatDuration(Date.now() / 1000 - observation.lastStateChange)} (${formatClockTime(observation.lastStateChange)})`
                  : '—'
              }
            />
            <Fact
              label="Attempt"
              value={observation ? `${observation.currentAttempt} of ${observation.maxAttempts}` : '—'}
            />
            <Fact
              label="Execution time"
              value={observation ? `${observation.executionTime.toFixed(3)}s` : '—'}
            />
            <Fact label="Latency" value={observation ? `${observation.latency.toFixed(3)}s` : '—'} />
            <Fact label="Flapping" value={observation?.isFlapping ? 'Yes' : 'No'} />
            <Fact
              label="Acknowledged"
              value={observation?.acknowledged ? 'Yes' : 'No'}
            />
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Check configuration</CardTitle>
            <CardDescription>What Nagios runs, and how often.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Fact label="Check" value={checkLabel(target)} />
              <Fact label="Check interval" value={`${String(target.checkIntervalMinutes)} min`} />
              <Fact label="Retry interval" value={`${String(target.retryIntervalMinutes)} min`} />
              <Fact label="Attempts before alert" value={String(target.maxAttempts)} />
              {target.check === 'http' ? (
                <>
                  <Fact label="TLS" value={target.secure ? 'Enabled' : 'Disabled'} />
                  <Fact
                    label="Expected status"
                    value={target.expectStatus ? String(target.expectStatus) : 'Any 2xx/3xx'}
                  />
                </>
              ) : null}
              {target.check === 'dns' ? (
                <>
                  <Fact label="Record type" value={target.dnsRecordType ?? 'A'} />
                  <Fact label="Expected value" value={target.expectValue ?? 'Any answer'} />
                </>
              ) : null}
              {target.notes ? (
                <div className="sm:col-span-2">
                  <Fact label="Notes" value={target.notes} />
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Nagios objects</CardTitle>
            <CardDescription>
              host_name <code className="font-mono">{row.hostName}</code>, service{' '}
              <code className="font-mono">{resolver.serviceDescriptionFor(target)}</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
              {snippet}
            </pre>
          </CardContent>
        </Card>
      </div>

      <TargetEditorDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        targets={targets}
        editing={target}
        onSubmit={(draft: TargetDraft) => {
          updateTarget(draftToTarget(draft, target.id));
          setEditorOpen(false);
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete target"
        description={`“${target.name}” will be removed from the registry and from the next generated configuration.`}
        confirmLabel="Delete target"
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          removeTarget(target.id);
          setConfirmOpen(false);
          void navigate('/targets');
        }}
      />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm break-words">{value}</dd>
    </div>
  );
}
