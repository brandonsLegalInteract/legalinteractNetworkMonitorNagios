import { Badge } from '@/components/ui/badge';
import { AVAILABILITY_LABEL, type AvailabilityState } from '@/domain/types';

const VARIANT: Record<AvailabilityState, 'up' | 'warning' | 'critical' | 'unknown' | 'pending'> = {
  up: 'up',
  warning: 'warning',
  critical: 'critical',
  unknown: 'unknown',
  pending: 'pending',
};

export function StatusBadge({ state }: { state: AvailabilityState }) {
  return <Badge variant={VARIANT[state]}>{AVAILABILITY_LABEL[state]}</Badge>;
}
