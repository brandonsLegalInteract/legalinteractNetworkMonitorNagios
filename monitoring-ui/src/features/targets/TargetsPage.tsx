import { Pencil, Plus, Search, Share2, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useMonitor } from '@/app/monitor-context';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { checkLabel } from '@/domain/checks';
import {
  draftToTarget,
  TARGET_KIND_LABEL,
  type TargetDraft,
} from '@/domain/targets';
import {
  AVAILABILITY_LABEL,
  TARGET_KINDS,
  type AvailabilityState,
  type Target,
  type TargetKind,
} from '@/domain/types';
import { formatRelativeTime } from '@/lib/format';
import { ExportDialog } from '@/features/targets/ExportDialog';
import { TargetEditorDialog } from '@/features/targets/TargetEditorDialog';
import { buildTargetRows, sortRowsWorstFirst } from '@/features/targets/target-rows';

const STATE_OPTIONS: readonly AvailabilityState[] = [
  'critical',
  'warning',
  'unknown',
  'pending',
  'up',
];

export function TargetsPage() {
  const { targets, resolver, snapshot, addTarget, updateTarget, removeTarget, replaceAll } =
    useMonitor();

  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | TargetKind>('all');
  const [stateFilter, setStateFilter] = useState<'all' | AvailabilityState>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Target | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Target | null>(null);

  const rows = useMemo(
    () => buildTargetRows(targets, resolver, snapshot),
    [targets, resolver, snapshot],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    const matching = rows.filter((row) => {
      if (kindFilter !== 'all' && row.target.kind !== kindFilter) return false;
      if (stateFilter !== 'all' && row.status.state !== stateFilter) return false;
      if (query.length === 0) return true;

      return (
        row.target.name.toLowerCase().includes(query) ||
        row.target.address.toLowerCase().includes(query) ||
        row.hostName.includes(query) ||
        checkLabel(row.target).toLowerCase().includes(query)
      );
    });

    return sortRowsWorstFirst(matching);
  }, [rows, search, kindFilter, stateFilter]);

  const filtersActive = search.trim().length > 0 || kindFilter !== 'all' || stateFilter !== 'all';

  const openAdd = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (target: Target) => {
    setEditing(target);
    setEditorOpen(true);
  };

  const handleSubmit = (draft: TargetDraft) => {
    if (editing) {
      updateTarget(draftToTarget(draft, editing.id));
    } else {
      addTarget(draftToTarget(draft));
    }
    setEditorOpen(false);
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold tracking-tight">Targets</h1>
          <p className="text-sm text-muted-foreground">
            Every device, application and service you have told Nagios to watch.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            <Share2 aria-hidden="true" />
            Deploy configuration
          </Button>
          <Button onClick={openAdd}>
            <Plus aria-hidden="true" />
            Add target
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            {filteredRows.length} of {rows.length} target{rows.length === 1 ? '' : 's'} shown.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, address or check"
              aria-label="Search targets"
            />
          </div>

          <Select
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value as 'all' | TargetKind)}
            aria-label="Filter by kind"
          >
            <option value="all">All kinds</option>
            {TARGET_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {TARGET_KIND_LABEL[kind]}
              </option>
            ))}
          </Select>

          <Select
            value={stateFilter}
            onChange={(event) => setStateFilter(event.target.value as 'all' | AvailabilityState)}
            aria-label="Filter by state"
          >
            <option value="all">All states</option>
            {STATE_OPTIONS.map((state) => (
              <option key={state} value={state}>
                {AVAILABILITY_LABEL[state]}
              </option>
            ))}
          </Select>

          {filtersActive ? (
            <Button
              variant="ghost"
              className="justify-self-start"
              onClick={() => {
                setSearch('');
                setKindFilter('all');
                setStateFilter('all');
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 py-1">
          {rows.length === 0 ? (
            <div className="flex flex-col items-start gap-3 px-5 py-8">
              <p className="text-sm text-muted-foreground">
                Nothing is being monitored yet. Add a device, application or service to begin.
              </p>
              <Button onClick={openAdd}>
                <Plus aria-hidden="true" />
                Add your first target
              </Button>
            </div>
          ) : filteredRows.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">
              No targets match the current filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Check</TableHead>
                  <TableHead>Nagios host</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">Last check</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.target.id}>
                    <TableCell>
                      <Link
                        to={`/targets/${row.target.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.target.name}
                      </Link>
                      <span className="block text-xs text-muted-foreground">
                        {row.target.address}
                        {row.target.enabled ? null : ' · disabled'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {TARGET_KIND_LABEL[row.target.kind]}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {checkLabel(row.target)}
                    </TableCell>
                    <TableCell>
                      <code className="font-mono text-xs text-muted-foreground">
                        {row.hostName}
                      </code>
                    </TableCell>
                    <TableCell>
                      <StatusBadge state={row.status.state} />
                    </TableCell>
                    <TableCell className="text-right text-xs whitespace-nowrap text-muted-foreground">
                      {formatRelativeTime(
                        row.status.service?.lastCheck ?? row.status.host?.lastCheck ?? 0,
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(row.target)}
                          aria-label={`Edit ${row.target.name}`}
                        >
                          <Pencil aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPendingDelete(row.target)}
                          aria-label={`Delete ${row.target.name}`}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TargetEditorDialog
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
        targets={targets}
        editing={editing}
        onSubmit={handleSubmit}
      />

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        targets={targets}
        onImport={(imported) => {
          replaceAll(imported);
          setExportOpen(false);
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete target"
        description={
          pendingDelete
            ? `“${pendingDelete.name}” will be removed from the registry and from the next generated configuration.`
            : ''
        }
        confirmLabel="Delete target"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removeTarget(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
