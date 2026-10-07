import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import {
  createEmptyDraft,
  hasErrors,
  targetToDraft,
  validateTargetDraft,
  type TargetDraft,
  type ValidationErrors,
} from '@/domain/targets';
import type { Target } from '@/domain/types';
import { TargetForm } from '@/features/targets/TargetForm';

export interface TargetEditorDialogProps {
  open: boolean;
  onClose: () => void;
  /** Full registry, used for uniqueness checks. */
  targets: readonly Target[];
  /** Target being edited, or null when adding. */
  editing: Target | null;
  onSubmit: (draft: TargetDraft) => void;
}

export function TargetEditorDialog({
  open,
  onClose,
  targets,
  editing,
  onSubmit,
}: TargetEditorDialogProps) {
  const [draft, setDraft] = useState<TargetDraft>(() =>
    editing ? targetToDraft(editing) : createEmptyDraft(),
  );
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Reset whenever the dialog opens so a cancelled edit never leaks into the next one.
  useEffect(() => {
    if (!open) return;
    setDraft(editing ? targetToDraft(editing) : createEmptyDraft());
    setErrors({});
  }, [open, editing]);

  const handleSubmit = () => {
    const nextErrors = validateTargetDraft(draft, targets, editing?.id);

    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSubmit(draft);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${editing.name}` : 'Point at something new'}
      description={
        editing
          ? 'Changes are saved to the registry and appear in the generated configuration.'
          : 'Describe what should be monitored. It becomes one Nagios host and one service.'
      }
      className="w-[min(48rem,calc(100vw-2rem))]"
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
        noValidate
      >
        <TargetForm
          draft={draft}
          errors={errors}
          onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
        />

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{editing ? 'Save changes' : 'Add target'}</Button>
        </div>
      </form>
    </Dialog>
  );
}
