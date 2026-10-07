import { useId } from 'react';

import { Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CHECK_KIND_LABEL, defaultPortFor } from '@/domain/checks';
import { slugify } from '@/domain/naming';
import {
  TARGET_KIND_DEFAULT_CHECK,
  TARGET_KIND_DESCRIPTION,
  TARGET_KIND_LABEL,
  type TargetDraft,
  type ValidationErrors,
} from '@/domain/targets';
import { CHECK_KINDS, TARGET_KINDS, type CheckKind, type DnsRecordType } from '@/domain/types';

const DNS_RECORD_TYPES: readonly DnsRecordType[] = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS'];

export interface TargetFormProps {
  draft: TargetDraft;
  errors: ValidationErrors;
  onChange: (patch: Partial<TargetDraft>) => void;
  idPrefix?: string;
}

function toNumberOrNull(value: string): number | null {
  if (value.trim().length === 0) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

export function TargetForm({ draft, errors, onChange, idPrefix }: TargetFormProps) {
  const generatedId = useId();
  const prefix = idPrefix ?? generatedId;
  const fieldId = (name: string) => `${prefix}-${name}`;

  const portPlaceholder = String(
    draft.port ?? defaultPortFor({ check: draft.check, secure: draft.secure }),
  );

  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Name"
          htmlFor={fieldId('name')}
          required
          error={errors.name}
          hint="Shown in the interface and used as the Nagios service description."
        >
          <Input
            id={fieldId('name')}
            value={draft.name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder="Intranet portal"
            aria-invalid={errors.name ? true : undefined}
            autoComplete="off"
          />
        </Field>

        <Field
          label="Kind"
          htmlFor={fieldId('kind')}
          hint={TARGET_KIND_DESCRIPTION[draft.kind]}
        >
          <Select
            id={fieldId('kind')}
            value={draft.kind}
            onChange={(event) => {
              const kind = event.target.value as TargetDraft['kind'];
              onChange({
                kind,
                check: TARGET_KIND_DEFAULT_CHECK[kind],
                port: null,
              });
            }}
          >
            {TARGET_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {TARGET_KIND_LABEL[kind]}
              </option>
            ))}
          </Select>
        </Field>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Address"
          htmlFor={fieldId('address')}
          required
          error={errors.address}
          hint="Hostname or IP address. Devices sharing an address share one Nagios host."
        >
          <Input
            id={fieldId('address')}
            value={draft.address}
            onChange={(event) => onChange({ address: event.target.value })}
            placeholder="10.20.1.10 or api.example.com"
            aria-invalid={errors.address ? true : undefined}
            autoComplete="off"
            spellCheck={false}
          />
        </Field>

        <Field
          label="Check"
          htmlFor={fieldId('check')}
          hint="What Nagios runs to decide whether this is available."
        >
          <Select
            id={fieldId('check')}
            value={draft.check}
            onChange={(event) => {
              const check = event.target.value as CheckKind;
              onChange({ check, port: null });
            }}
          >
            {CHECK_KINDS.map((check) => (
              <option key={check} value={check}>
                {CHECK_KIND_LABEL[check]}
              </option>
            ))}
          </Select>
        </Field>
      </section>

      {draft.check === 'tcp' ? (
        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="Port" htmlFor={fieldId('port')} required error={errors.port}>
            <Input
              id={fieldId('port')}
              type="number"
              inputMode="numeric"
              min={1}
              max={65535}
              value={draft.port ?? ''}
              onChange={(event) => onChange({ port: toNumberOrNull(event.target.value) })}
              placeholder="5432"
              aria-invalid={errors.port ? true : undefined}
            />
          </Field>
        </section>
      ) : null}

      {draft.check === 'http' ? (
        <section className="grid gap-4 sm:grid-cols-3">
          <Field label="Port" htmlFor={fieldId('http-port')} error={errors.port}>
            <Input
              id={fieldId('http-port')}
              type="number"
              inputMode="numeric"
              min={1}
              max={65535}
              value={draft.port ?? ''}
              onChange={(event) => onChange({ port: toNumberOrNull(event.target.value) })}
              placeholder={portPlaceholder}
              aria-invalid={errors.port ? true : undefined}
            />
          </Field>

          <Field label="Path" htmlFor={fieldId('path')} error={errors.path}>
            <Input
              id={fieldId('path')}
              value={draft.path}
              onChange={(event) => onChange({ path: event.target.value })}
              placeholder="/health"
              aria-invalid={errors.path ? true : undefined}
              spellCheck={false}
            />
          </Field>

          <Field
            label="Expected status"
            htmlFor={fieldId('expect-status')}
            error={errors.expectStatus}
          >
            <Input
              id={fieldId('expect-status')}
              type="number"
              inputMode="numeric"
              min={100}
              max={599}
              value={draft.expectStatus ?? ''}
              onChange={(event) => onChange({ expectStatus: toNumberOrNull(event.target.value) })}
              placeholder="200"
              aria-invalid={errors.expectStatus ? true : undefined}
            />
          </Field>

          <label className="flex items-center gap-2 text-sm sm:col-span-3">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={draft.secure}
              onChange={(event) =>
                onChange({
                  secure: event.target.checked,
                  port: draft.port === null ? null : draft.port,
                })
              }
            />
            Use TLS (https)
          </label>
        </section>
      ) : null}

      {draft.check === 'dns' ? (
        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="Record type" htmlFor={fieldId('record-type')}>
            <Select
              id={fieldId('record-type')}
              value={draft.dnsRecordType}
              onChange={(event) =>
                onChange({ dnsRecordType: event.target.value as DnsRecordType })
              }
            >
              {DNS_RECORD_TYPES.map((recordType) => (
                <option key={recordType} value={recordType}>
                  {recordType}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Expected value"
            htmlFor={fieldId('expect-value')}
            error={errors.expectValue}
            hint="Optional. Leave blank to only require that the name resolves."
          >
            <Input
              id={fieldId('expect-value')}
              value={draft.expectValue}
              onChange={(event) => onChange({ expectValue: event.target.value })}
              placeholder="10.20.1.10"
              spellCheck={false}
            />
          </Field>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Check interval (min)"
          htmlFor={fieldId('check-interval')}
          error={errors.checkIntervalMinutes}
        >
          <Input
            id={fieldId('check-interval')}
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            value={draft.checkIntervalMinutes}
            onChange={(event) =>
              onChange({ checkIntervalMinutes: toNumberOrNull(event.target.value) ?? 0 })
            }
            aria-invalid={errors.checkIntervalMinutes ? true : undefined}
          />
        </Field>

        <Field
          label="Retry interval (min)"
          htmlFor={fieldId('retry-interval')}
          error={errors.retryIntervalMinutes}
        >
          <Input
            id={fieldId('retry-interval')}
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            value={draft.retryIntervalMinutes}
            onChange={(event) =>
              onChange({ retryIntervalMinutes: toNumberOrNull(event.target.value) ?? 0 })
            }
            aria-invalid={errors.retryIntervalMinutes ? true : undefined}
          />
        </Field>

        <Field
          label="Attempts before alert"
          htmlFor={fieldId('max-attempts')}
          error={errors.maxAttempts}
          hint="Soft-state retries before Nagios declares a hard failure."
        >
          <Input
            id={fieldId('max-attempts')}
            type="number"
            inputMode="numeric"
            min={1}
            max={10}
            value={draft.maxAttempts}
            onChange={(event) => onChange({ maxAttempts: toNumberOrNull(event.target.value) ?? 0 })}
            aria-invalid={errors.maxAttempts ? true : undefined}
          />
        </Field>
      </section>

      <Field
        label="Notes"
        htmlFor={fieldId('notes')}
        hint="Optional context for whoever investigates an alert."
      >
        <Textarea
          id={fieldId('notes')}
          value={draft.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
          placeholder="Owner, purpose, what to check first."
        />
      </Field>

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={draft.enabled}
            onChange={(event) => onChange({ enabled: event.target.checked })}
          />
          Enabled
        </label>
        <p className="text-xs text-muted-foreground">
          Disabled targets are kept in the registry but excluded from generated configuration and
          from the availability figures.
        </p>
      </div>

      <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3">
        <p className="text-xs font-medium text-muted-foreground">Generated Nagios identity</p>
        <dl className="grid gap-1 text-xs sm:grid-cols-2">
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">host_name:</dt>
            <dd className="font-mono">{slugify(draft.address, '') || '—'}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted-foreground">service_description:</dt>
            <dd className="font-mono">{draft.name.trim() || '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
