import {
  DEFAULT_DNS_RECORD_TYPE,
  DEFAULT_HTTP_PATH,
  DEFAULT_HTTP_STATUS,
  defaultPortFor,
} from '@/domain/checks';
import { slugify } from '@/domain/naming';
import type { CheckKind, DnsRecordType, Target, TargetKind } from '@/domain/types';
import seedFile from '@/data/seedTargets.json';

export const TARGET_KIND_LABEL: Record<TargetKind, string> = {
  device: 'Device',
  application: 'Application',
  service: 'Service',
};

export const TARGET_KIND_DESCRIPTION: Record<TargetKind, string> = {
  device: 'Physical or virtual hardware you expect to answer on the network.',
  application: 'A deployed application or API you reach over HTTP(S) or a port.',
  service: 'An infrastructure service such as a database, queue or directory.',
};

export const TARGET_KIND_DEFAULT_CHECK: Record<TargetKind, CheckKind> = {
  device: 'ping',
  application: 'http',
  service: 'tcp',
};

/** Form-shaped target. Numeric inputs are held as numbers, blanks as `null`. */
export interface TargetDraft {
  name: string;
  kind: TargetKind;
  address: string;
  check: CheckKind;
  port: number | null;
  path: string;
  secure: boolean;
  expectStatus: number | null;
  dnsRecordType: DnsRecordType;
  expectValue: string;
  checkIntervalMinutes: number;
  retryIntervalMinutes: number;
  maxAttempts: number;
  notes: string;
  enabled: boolean;
}

export const DEFAULT_MAX_ATTEMPTS = 3;
export const DEFAULT_CHECK_INTERVAL_MINUTES = 5;
export const DEFAULT_RETRY_INTERVAL_MINUTES = 1;

export function createEmptyDraft(kind: TargetKind = 'device'): TargetDraft {
  return {
    name: '',
    kind,
    address: '',
    check: TARGET_KIND_DEFAULT_CHECK[kind],
    port: null,
    path: DEFAULT_HTTP_PATH,
    secure: false,
    expectStatus: DEFAULT_HTTP_STATUS,
    dnsRecordType: DEFAULT_DNS_RECORD_TYPE,
    expectValue: '',
    checkIntervalMinutes: DEFAULT_CHECK_INTERVAL_MINUTES,
    retryIntervalMinutes: DEFAULT_RETRY_INTERVAL_MINUTES,
    maxAttempts: DEFAULT_MAX_ATTEMPTS,
    notes: '',
    enabled: true,
  };
}

export function targetToDraft(target: Target): TargetDraft {
  return {
    name: target.name,
    kind: target.kind,
    address: target.address,
    check: target.check,
    port: target.port ?? null,
    path: target.path ?? DEFAULT_HTTP_PATH,
    secure: target.secure ?? false,
    expectStatus: target.expectStatus ?? DEFAULT_HTTP_STATUS,
    dnsRecordType: target.dnsRecordType ?? DEFAULT_DNS_RECORD_TYPE,
    expectValue: target.expectValue ?? '',
    checkIntervalMinutes: target.checkIntervalMinutes,
    retryIntervalMinutes: target.retryIntervalMinutes,
    maxAttempts: target.maxAttempts,
    notes: target.notes ?? '',
    enabled: target.enabled,
  };
}

/** Strip fields that do not apply to the chosen check so exports stay tidy. */
export function draftToTarget(draft: TargetDraft, id?: string): Target {
  const target: Target = {
    id: id ?? crypto.randomUUID(),
    name: draft.name.trim(),
    kind: draft.kind,
    address: draft.address.trim(),
    check: draft.check,
    checkIntervalMinutes: draft.checkIntervalMinutes,
    retryIntervalMinutes: draft.retryIntervalMinutes,
    maxAttempts: draft.maxAttempts,
    enabled: draft.enabled,
  };

  if (draft.notes.trim().length > 0) {
    target.notes = draft.notes.trim();
  }

  if (draft.check === 'tcp') {
    target.port = draft.port ?? defaultPortFor(draft);
  }

  if (draft.check === 'http') {
    target.port = draft.port ?? defaultPortFor(draft);
    target.path = draft.path.trim() || DEFAULT_HTTP_PATH;
    target.secure = draft.secure;
    target.expectStatus = draft.expectStatus ?? DEFAULT_HTTP_STATUS;
  }

  if (draft.check === 'dns') {
    target.dnsRecordType = draft.dnsRecordType;
    if (draft.expectValue.trim().length > 0) {
      target.expectValue = draft.expectValue.trim();
    }
  }

  return target;
}

export type TargetField =
  | 'name'
  | 'address'
  | 'port'
  | 'path'
  | 'expectStatus'
  | 'expectValue'
  | 'checkIntervalMinutes'
  | 'retryIntervalMinutes'
  | 'maxAttempts';

export type ValidationErrors = Partial<Record<TargetField, string>>;

const HOSTNAME_PATTERN = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;

function isPlausibleAddress(value: string): boolean {
  if (value.length === 0 || value.length > 253) return false;
  if (/\s/.test(value)) return false;
  if (value.includes(':')) return true; // IPv6 or host:port style, accepted leniently
  return HOSTNAME_PATTERN.test(value);
}

function isPort(value: number | null): boolean {
  return value !== null && Number.isInteger(value) && value >= 1 && value <= 65535;
}

/**
 * Validate a draft against the rules Nagios and the generated config rely on.
 * Returns an empty object when the draft can be saved.
 */
export function validateTargetDraft(
  draft: TargetDraft,
  existing: readonly Target[] = [],
  editingId?: string,
): ValidationErrors {
  const errors: ValidationErrors = {};

  const name = draft.name.trim();
  if (name.length === 0) {
    errors.name = 'A name is required.';
  } else if (slugify(name, '') === '') {
    errors.name = 'Use at least one letter or number.';
  } else {
    const clash = existing.some(
      (target) => target.id !== editingId && target.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (clash) {
      errors.name = 'Another target already uses this name.';
    }
  }

  const address = draft.address.trim();
  if (address.length === 0) {
    errors.address = 'An address is required.';
  } else if (!isPlausibleAddress(address)) {
    errors.address = 'Enter a hostname or IP address without spaces or a scheme.';
  }

  if (draft.check === 'tcp' && !isPort(draft.port)) {
    errors.port = 'Enter a port between 1 and 65535.';
  }

  if (draft.check === 'http') {
    if (draft.port !== null && !isPort(draft.port)) {
      errors.port = 'Enter a port between 1 and 65535.';
    }
    const path = draft.path.trim();
    if (path.length > 0 && !path.startsWith('/')) {
      errors.path = 'Path must start with a forward slash.';
    }
    if (
      draft.expectStatus !== null &&
      (!Number.isInteger(draft.expectStatus) ||
        draft.expectStatus < 100 ||
        draft.expectStatus > 599)
    ) {
      errors.expectStatus = 'Expected status must be between 100 and 599.';
    }
  }

  if (draft.check === 'dns' && draft.expectValue.trim().length > 200) {
    errors.expectValue = 'Expected value is too long.';
  }

  if (
    !Number.isInteger(draft.checkIntervalMinutes) ||
    draft.checkIntervalMinutes < 1 ||
    draft.checkIntervalMinutes > 1440
  ) {
    errors.checkIntervalMinutes = 'Check interval must be 1 to 1440 minutes.';
  }

  if (
    !Number.isInteger(draft.retryIntervalMinutes) ||
    draft.retryIntervalMinutes < 1 ||
    draft.retryIntervalMinutes > 1440
  ) {
    errors.retryIntervalMinutes = 'Retry interval must be 1 to 1440 minutes.';
  }

  if (!Number.isInteger(draft.maxAttempts) || draft.maxAttempts < 1 || draft.maxAttempts > 10) {
    errors.maxAttempts = 'Attempts must be between 1 and 10.';
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * The targets a fresh browser starts with, read from `data/seedTargets.json`.
 *
 * The registry itself lives in this browser's localStorage, so it does not
 * survive a cleared cache and does not follow the operator to another machine.
 * The seed file is the deployment's answer to that: edit it, commit, redeploy,
 * and any browser with an empty registry picks the set up. Entries that do not
 * parse are dropped rather than taking the whole app down with them.
 */
export function seedTargets(): Target[] {
  const entries = Array.isArray(seedFile.targets) ? seedFile.targets : [];
  const valid: Target[] = [];

  for (const entry of entries) {
    if (isSeedTarget(entry)) {
      valid.push(entry);
    } else {
      console.warn('seedTargets.json: skipping malformed entry', entry);
    }
  }

  return valid;
}

const TARGET_KINDS: readonly string[] = ['device', 'application', 'service'];
const CHECK_KINDS: readonly string[] = ['ping', 'tcp', 'http', 'dns'];

function isSeedTarget(value: unknown): value is Target {
  if (value === null || typeof value !== 'object') return false;
  const c = value as Partial<Target>;

  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    typeof c.address === 'string' &&
    typeof c.kind === 'string' &&
    TARGET_KINDS.includes(c.kind) &&
    typeof c.check === 'string' &&
    CHECK_KINDS.includes(c.check) &&
    typeof c.checkIntervalMinutes === 'number' &&
    typeof c.retryIntervalMinutes === 'number' &&
    typeof c.maxAttempts === 'number' &&
    typeof c.enabled === 'boolean'
  );
}

/**
 * The original demo spread: one of every kind and check, including a disabled
 * target. Not what a deployment seeds any more -- it is the fixture the
 * simulated source and the component tests exercise, kept here so those stay
 * independent of whatever a given deployment happens to monitor.
 */
export function demoTargets(): Target[] {
  return [
    {
      id: 'seed-core-switch',
      name: 'Core switch',
      kind: 'device',
      address: '10.20.0.1',
      check: 'ping',
      checkIntervalMinutes: 5,
      retryIntervalMinutes: 1,
      maxAttempts: 3,
      notes: 'Primary distribution switch in the server room.',
      enabled: true,
    },
    {
      id: 'seed-domain-controller',
      name: 'Domain controller 01',
      kind: 'device',
      address: '10.20.1.10',
      check: 'ping',
      checkIntervalMinutes: 5,
      retryIntervalMinutes: 1,
      maxAttempts: 3,
      enabled: true,
    },
    {
      id: 'seed-intranet-portal',
      name: 'Intranet portal',
      kind: 'application',
      address: 'intranet.internal.example',
      check: 'http',
      port: 443,
      path: '/health',
      secure: true,
      expectStatus: 200,
      checkIntervalMinutes: 2,
      retryIntervalMinutes: 1,
      maxAttempts: 3,
      notes: 'Availability endpoint exposed by the portal.',
      enabled: true,
    },
    {
      id: 'seed-public-api',
      name: 'Public API',
      kind: 'application',
      address: 'api.example.com',
      check: 'http',
      port: 443,
      path: '/v1/status',
      secure: true,
      expectStatus: 200,
      checkIntervalMinutes: 2,
      retryIntervalMinutes: 1,
      maxAttempts: 4,
      enabled: true,
    },
    {
      id: 'seed-postgres',
      name: 'Primary PostgreSQL',
      kind: 'service',
      address: '10.20.3.20',
      check: 'tcp',
      port: 5432,
      checkIntervalMinutes: 3,
      retryIntervalMinutes: 1,
      maxAttempts: 3,
      notes: 'Accepts connections on 5432.',
      enabled: true,
    },
    {
      id: 'seed-smtp-relay',
      name: 'Outbound SMTP relay',
      kind: 'service',
      address: 'smtp.example.com',
      check: 'tcp',
      port: 587,
      checkIntervalMinutes: 5,
      retryIntervalMinutes: 1,
      maxAttempts: 2,
      enabled: true,
    },
    {
      id: 'seed-internal-dns',
      name: 'dc01 name resolution',
      kind: 'service',
      address: 'dc01.internal.example',
      check: 'dns',
      dnsRecordType: 'A',
      expectValue: '10.20.1.10',
      checkIntervalMinutes: 10,
      retryIntervalMinutes: 2,
      maxAttempts: 3,
      notes: 'Resolves to 10.20.1.10 through the configured resolver.',
      enabled: true,
    },
    {
      id: 'seed-backup-gateway',
      name: 'Backup gateway',
      kind: 'application',
      address: 'vpn.example.com',
      check: 'http',
      port: 443,
      path: '/',
      secure: true,
      expectStatus: 200,
      checkIntervalMinutes: 15,
      retryIntervalMinutes: 5,
      maxAttempts: 2,
      notes: 'Disabled while the VPN is being replaced.',
      enabled: false,
    },
  ];
}
