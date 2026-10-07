import type { ReactNode } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  /** Semantic status accent for the value, when the metric has a severity. */
  tone?: 'neutral' | 'up' | 'warning' | 'critical' | 'unknown';
  className?: string;
}

const TONE_CLASS: Record<NonNullable<StatCardProps['tone']>, string> = {
  neutral: 'text-foreground',
  up: 'text-status-up-foreground',
  warning: 'text-status-warning-foreground',
  critical: 'text-status-critical-foreground',
  unknown: 'text-status-unknown-foreground',
};

export function StatCard({ label, value, hint, tone = 'neutral', className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="gap-0 p-4 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className={cn('text-2xl font-semibold tabular-nums', TONE_CLASS[tone])}>{value}</p>
        {hint ? <CardDescription className="mt-1">{hint}</CardDescription> : null}
      </CardContent>
    </Card>
  );
}
