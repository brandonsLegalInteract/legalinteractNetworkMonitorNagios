import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground transition-colors',
        'placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors',
        'placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
