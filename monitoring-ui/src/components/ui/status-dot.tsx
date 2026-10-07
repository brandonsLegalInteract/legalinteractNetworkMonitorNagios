import type { HTMLAttributes } from 'react';

import { AVAILABILITY_LABEL, type AvailabilityState } from '@/domain/types';
import { cn } from '@/lib/utils';

const DOT_COLOR: Record<AvailabilityState, string> = {
  up: 'bg-status-up',
  warning: 'bg-status-warning',
  critical: 'bg-status-critical',
  unknown: 'bg-status-unknown',
  pending: 'bg-status-pending',
};

const RING_COLOR: Record<AvailabilityState, string> = {
  up: 'ring-status-up/30',
  warning: 'ring-status-warning/30',
  critical: 'ring-status-critical/30',
  unknown: 'ring-status-unknown/30',
  pending: 'ring-status-pending/30',
};

export interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
  state: AvailabilityState;
  /** Adds a pulsing halo for states that are actively failing. */
  pulse?: boolean;
}

/**
 * Status is conveyed by colour *and* text, so it is never colour-only for
 * colour-blind users or screen readers.
 */
export function StatusDot({ state, pulse = false, className, ...props }: StatusDotProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)} {...props}>
      <span
        aria-hidden="true"
        className={cn(
          'size-2.5 shrink-0 rounded-full ring-4',
          DOT_COLOR[state],
          RING_COLOR[state],
          pulse && state === 'critical' && 'animate-pulse',
        )}
      />
      <span className="sr-only">{AVAILABILITY_LABEL[state]}</span>
    </span>
  );
}
