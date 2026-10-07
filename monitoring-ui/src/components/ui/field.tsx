import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  className,
  children,
}: FieldProps) {
  const describedBy = error ?? hint;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-foreground">
        {label}
        {required ? (
          <span className="ml-0.5 text-status-critical" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {describedBy ? (
        <p
          className={cn(
            'text-xs',
            error ? 'text-status-critical-foreground' : 'text-muted-foreground',
          )}
        >
          {describedBy}
        </p>
      ) : null}
    </div>
  );
}
