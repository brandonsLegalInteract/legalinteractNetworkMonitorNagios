import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/**
 * Native select rather than a custom listbox: keyboard semantics, mobile
 * behaviour and screen-reader support come for free.
 */
export function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          'h-9 w-full appearance-none rounded-md border border-input bg-background pr-8 pl-3 text-sm text-foreground transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
