import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/** jsdom and a few embedded webviews lack the native modal API; degrade safely. */
const NATIVE_DIALOG_SUPPORTED =
  typeof HTMLDialogElement !== 'undefined' &&
  typeof HTMLDialogElement.prototype.showModal === 'function';

/**
 * Modal wrapper. Uses the native `<dialog>` element when available (focus
 * trapping, inert background and Escape come from the platform); falls back to
 * a `fixed` panel with its own Escape handling and backdrop otherwise, so the
 * interface never stops working in a constrained host.
 */
export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (open) {
      element.setAttribute('open', '');
      if (NATIVE_DIALOG_SUPPORTED) {
        try {
          element.showModal();
        } catch {
          // Attribute fallback already applied; keep the dialog usable.
        }
      }
      element.focus();
    } else {
      if (NATIVE_DIALOG_SUPPORTED && element.open) {
        element.close();
      }
      element.removeAttribute('open');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  return (
    <>
      {open && !NATIVE_DIALOG_SUPPORTED ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/60"
          onClick={onClose}
        />
      ) : null}

      <dialog
        ref={ref}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'm-auto w-[min(44rem,calc(100vw-2rem))] rounded-xl border border-border bg-card text-card-foreground backdrop:bg-black/60',
          !NATIVE_DIALOG_SUPPORTED &&
            'pointer-events-auto fixed inset-0 z-50 h-fit max-h-[90vh]',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-sm font-semibold">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="text-xs text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
            <X />
          </Button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
      </dialog>
    </>
  );
}