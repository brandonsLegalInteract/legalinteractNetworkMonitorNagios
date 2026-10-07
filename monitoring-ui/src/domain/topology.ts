import { slugify } from '@/domain/naming';
import { worstState } from '@/domain/status';
import {
  serviceKey,
  type HostStatus,
  type MonitorSnapshot,
  type ServiceStatus,
  type Target,
  type TargetKind,
} from '@/domain/types';

/**
 * Nagios hosts are addresses; targets are the things we check on them. Several
 * targets can sit on one address (an application and its database port, say),
 * so hosts are planned once per address and targets hang off them as services.
 * This module is the single source of truth for that mapping — the config
 * generator and the UI both read it, which is what keeps the two in step.
 */
export interface HostPlan {
  hostName: string;
  address: string;
  /** Distinct target kinds on this address, for hostgroup membership. */
  kinds: TargetKind[];
  targetIds: string[];
}

function uniqueHostName(candidate: string, used: ReadonlySet<string>): string {
  if (!used.has(candidate)) return candidate;

  let suffix = 2;
  while (used.has(`${candidate}-${suffix}`)) {
    suffix += 1;
  }
  return `${candidate}-${suffix}`;
}

/** Group targets by address, resolving slug collisions deterministically. */
export function planHosts(targets: readonly Target[]): HostPlan[] {
  const plansByAddress = new Map<string, HostPlan>();
  const usedNames = new Set<string>();

  for (const target of targets) {
    const address = target.address.trim();
    if (address.length === 0) continue;

    const key = address.toLowerCase();
    let plan = plansByAddress.get(key);

    if (!plan) {
      const hostName = uniqueHostName(slugify(address), usedNames);
      usedNames.add(hostName);
      plan = { hostName, address, kinds: [], targetIds: [] };
      plansByAddress.set(key, plan);
    }

    plan.targetIds.push(target.id);
    if (!plan.kinds.includes(target.kind)) {
      plan.kinds.push(target.kind);
    }
  }

  return [...plansByAddress.values()];
}

export function buildTargetHostMap(plans: readonly HostPlan[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const plan of plans) {
    for (const targetId of plan.targetIds) {
      map.set(targetId, plan.hostName);
    }
  }

  return map;
}

export interface TargetStatus {
  host: HostStatus | undefined;
  service: ServiceStatus | undefined;
  /** The resolved availability used for sorting, counting and colour. */
  state: AvailabilityStateResolved;
  /** False when Nagios has no status for this target yet. */
  known: boolean;
}

type AvailabilityStateResolved = ReturnType<typeof worstState>;

export interface TargetResolver {
  plans: HostPlan[];
  hostNameFor: (target: Target) => string;
  serviceDescriptionFor: (target: Target) => string;
  statusFor: (target: Target, snapshot: MonitorSnapshot) => TargetStatus;
}

/**
 * Resolution rule, deliberately simple and explainable to an operator:
 *   1. The target's own service is the primary signal.
 *   2. If the host is down, the target is unavailable regardless.
 *   3. With no data from Nagios yet, the target is pending.
 */
export function createTargetResolver(targets: readonly Target[]): TargetResolver {
  const plans = planHosts(targets);
  const hostNames = buildTargetHostMap(plans);

  const hostNameFor = (target: Target): string =>
    hostNames.get(target.id) ?? slugify(target.address);

  const serviceDescriptionFor = (target: Target): string => target.name;

  const statusFor = (target: Target, snapshot: MonitorSnapshot): TargetStatus => {
    const hostName = hostNameFor(target);
    const host = snapshot.hosts[hostName];
    const service = snapshot.services[serviceKey(hostName, serviceDescriptionFor(target))];

    if (!host && !service) {
      return { host: undefined, service: undefined, state: 'pending', known: false };
    }

    if (host && host.state === 'critical') {
      return { host, service, state: 'critical', known: true };
    }

    const state = service?.state ?? host?.state ?? 'pending';
    return { host, service, state, known: true };
  };

  return { plans, hostNameFor, serviceDescriptionFor, statusFor };
}
