import type { TargetResolver, TargetStatus } from '@/domain/topology';
import { AVAILABILITY_RANK, type MonitorSnapshot, type Target } from '@/domain/types';

export interface TargetRow {
  target: Target;
  hostName: string;
  status: TargetStatus;
}

const EMPTY_SNAPSHOT: MonitorSnapshot = {
  fetchedAt: 0,
  source: 'mock',
  hosts: {},
  services: {},
};

/** Join the target registry to the latest availability data. */
export function buildTargetRows(
  targets: readonly Target[],
  resolver: TargetResolver,
  snapshot: MonitorSnapshot | null,
): TargetRow[] {
  const effective = snapshot ?? EMPTY_SNAPSHOT;

  return targets.map((target) => ({
    target,
    hostName: resolver.hostNameFor(target),
    status: resolver.statusFor(target, effective),
  }));
}

/** Worst first, then alphabetical — the top of the list is always the problem. */
export function sortRowsWorstFirst(rows: readonly TargetRow[]): TargetRow[] {
  return [...rows].sort((left, right) => {
    const byRank = AVAILABILITY_RANK[left.status.state] - AVAILABILITY_RANK[right.status.state];
    if (byRank !== 0) return byRank;

    return left.target.name.localeCompare(right.target.name);
  });
}

/** Availability considered for the fleet view: enabled targets only. */
export function enabledRows(rows: readonly TargetRow[]): TargetRow[] {
  return rows.filter((row) => row.target.enabled);
}
