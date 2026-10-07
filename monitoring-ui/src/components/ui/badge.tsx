import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        up: 'border-transparent bg-status-up-subtle text-status-up-foreground',
        warning: 'border-transparent bg-status-warning-subtle text-status-warning-foreground',
        critical: 'border-transparent bg-status-critical-subtle text-status-critical-foreground',
        unknown: 'border-transparent bg-status-unknown-subtle text-status-unknown-foreground',
        pending: 'border-transparent bg-status-pending-subtle text-status-pending-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
