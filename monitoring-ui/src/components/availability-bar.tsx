import { AVAILABILITY_LABEL, type AvailabilityState } from '@/domain/types';
import { cn } from '@/lib/utils';

const SEGMENT_COLOR: Record<AvailabilityState, string> = {
  critical: 'bg-status-critical',
  warning: 'bg-status-warning',
  unknown: 'bg-status-unknown',
  pending: 'bg-status-pending',
  up: 'bg-status-up',
};

const ORDER: readonly AvailabilityState[] = ['up', 'warning', 'pending', 'unknown', 'critical'];

export interface AvailabilityBarProps {
  counts: Record<AvailabilityState, number>;
  className?: string;
}

/**
 * Proportional fleet-health bar. Every state is labelled in the legend so the
 * chart is never the only way to read the data.
 */
export function AvailabilityBar({ counts, className }: AvailabilityBarProps) {
  const total = ORDER.reduce((sum, state) => sum + counts[state], 0);
  const present = ORDER.filter((state) => counts[state] > 0);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div
        role="img"
        aria-label={`Availability breakdown across ${String(total)} targets`}
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
      >
        {total === 0 ? null : (
          present.map((state) => (
            <div
              key={state}
              className={cn('h-full', SEGMENT_COLOR[state])}
              style={{ width: `${String((counts[state] / total) * 100)}%` }}
            />
          ))
        )}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
        {ORDER.map((state) => (
          <li key={state} className="flex items-center gap-1.5 text-xs">
            <span
              aria-hidden="true"
              className={cn('size-2.5 rounded-full', SEGMENT_COLOR[state])}
            />
            <span className="text-muted-foreground">{AVAILABILITY_LABEL[state]}</span>
            <span className="font-medium tabular-nums">{counts[state]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
