import { AVAILABILITY_RANK, type AvailabilityState } from '@/domain/types';

/**
 * Nagios JSON CGIs report host states as up/down/unreachable/pending and service
 * states as ok/warning/critical/unknown/pending. Both collapse into the app's
 * single availability vocabulary here, at the boundary, so no component has to
 * know about two state machines.
 */
const HOST_STATE_MAP: Record<string, AvailabilityState> = {
  up: 'up',
  down: 'critical',
  unreachable: 'unknown',
  pending: 'pending',
};

const SERVICE_STATE_MAP: Record<string, AvailabilityState> = {
  ok: 'up',
  warning: 'warning',
  critical: 'critical',
  unknown: 'unknown',
  pending: 'pending',
};

function mapState(map: Record<string, AvailabilityState>, raw: unknown): AvailabilityState {
  if (typeof raw !== 'string') return 'pending';
  return map[raw.toLowerCase()] ?? 'pending';
}

export function hostStateFromNagios(raw: unknown): AvailabilityState {
  return mapState(HOST_STATE_MAP, raw);
}

export function serviceStateFromNagios(raw: unknown): AvailabilityState {
  return mapState(SERVICE_STATE_MAP, raw);
}

/** Return the most severe of the supplied states. Empty input is `pending`. */
export function worstState(states: readonly AvailabilityState[]): AvailabilityState {
  let worst: AvailabilityState | undefined;

  for (const state of states) {
    if (worst === undefined || AVAILABILITY_RANK[state] < AVAILABILITY_RANK[worst]) {
      worst = state;
    }
  }

  return worst ?? 'pending';
}

/** Count states into the buckets the overview surfaces report on. */
export function countStates(
  states: readonly AvailabilityState[],
): Record<AvailabilityState, number> {
  const counts: Record<AvailabilityState, number> = {
    critical: 0,
    warning: 0,
    unknown: 0,
    pending: 0,
    up: 0,
  };

  for (const state of states) {
    counts[state] += 1;
  }

  return counts;
}

/**
 * Availability percentage over the states that are actually resolvable.
 * `up` counts as available, `warning` as available-but-degraded.
 */
export function availabilityPercent(states: readonly AvailabilityState[]): number {
  if (states.length === 0) return 100;

  let available = 0;
  for (const state of states) {
    if (state === 'up' || state === 'warning') available += 1;
  }

  return Math.round((available / states.length) * 1000) / 10;
}
