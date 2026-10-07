/**
 * Domain vocabulary for the monitoring interface.
 *
 * Nagios Core has two separate state machines: hosts are up/down/unreachable,
 * services are ok/warning/critical/unknown. The UI normalises both into a single
 * `AvailabilityState` so every surface sorts, colours and counts the same way.
 */

export type TargetKind = 'device' | 'application' | 'service';

export type CheckKind = 'ping' | 'tcp' | 'http' | 'dns';

export type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS';

/** Normalised severity used everywhere in the UI. Worst-first ordering. */
export type AvailabilityState = 'critical' | 'warning' | 'unknown' | 'pending' | 'up';

/** Ascending rank = descending severity, so `sort((a, b) => rank[a] - rank[b])` is worst-first. */
export const AVAILABILITY_RANK: Record<AvailabilityState, number> = {
  critical: 0,
  warning: 1,
  unknown: 2,
  pending: 3,
  up: 4,
};

export const AVAILABILITY_LABEL: Record<AvailabilityState, string> = {
  critical: 'Unavailable',
  warning: 'Degraded',
  unknown: 'Unknown',
  pending: 'Pending',
  up: 'Available',
};

export const TARGET_KINDS: readonly TargetKind[] = ['device', 'application', 'service'];

export const CHECK_KINDS: readonly CheckKind[] = ['ping', 'tcp', 'http', 'dns'];

/**
 * A monitored thing the operator "points at".
 *
 * Every target becomes exactly one Nagios service object on the host object for
 * its address. Devices use a ping service; applications and services use a more
 * specific check. Keeping one check per target means one target maps to one row
 * of availability, which is what the UI promises.
 */
export interface Target {
  id: string;
  /** Operator-facing name. Used as the Nagios `service_description`. */
  name: string;
  kind: TargetKind;
  /** Hostname or IP. Becomes the Nagios `address`. */
  address: string;
  check: CheckKind;
  /** TCP port, for `check === 'tcp'`. */
  port?: number;
  /** Path for HTTP checks, e.g. `/health`. Ignored for other checks. */
  path?: string;
  /** Use TLS for HTTP checks. */
  secure?: boolean;
  /** Expected HTTP status code. */
  expectStatus?: number;
  /** Record type for DNS checks. */
  dnsRecordType?: DnsRecordType;
  /** Expected value for DNS checks. */
  expectValue?: string;
  checkIntervalMinutes: number;
  retryIntervalMinutes: number;
  maxAttempts: number;
  notes?: string;
  enabled: boolean;
}

export interface HostStatus {
  name: string;
  state: AvailabilityState;
  pluginOutput: string;
  lastCheck: number;
  nextCheck: number;
  lastStateChange: number;
  currentAttempt: number;
  maxAttempts: number;
  executionTime: number;
  latency: number;
  isFlapping: boolean;
  scheduledDowntimeDepth: number;
  acknowledged: boolean;
  checksEnabled: boolean;
}

export interface ServiceStatus {
  hostName: string;
  description: string;
  state: AvailabilityState;
  pluginOutput: string;
  lastCheck: number;
  nextCheck: number;
  lastStateChange: number;
  currentAttempt: number;
  maxAttempts: number;
  executionTime: number;
  latency: number;
  isFlapping: boolean;
  scheduledDowntimeDepth: number;
  acknowledged: boolean;
  checksEnabled: boolean;
}

export interface MonitorSnapshot {
  fetchedAt: number;
  source: MonitorSourceKind;
  hosts: Record<string, HostStatus>;
  services: Record<string, ServiceStatus>;
  /** Set when a fetch failed; the snapshot may still hold the last good data. */
  error?: string;
}

export type MonitorSourceKind = 'live' | 'mock';

export interface MonitorSource {
  readonly kind: MonitorSourceKind;
  fetchSnapshot(signal?: AbortSignal): Promise<MonitorSnapshot>;
}

/**
 * Simulated fleet condition, so an operator can rehearse a response before a
 * real outage teaches them the interface.
 */
export type MockScenario = 'healthy' | 'mixed' | 'outage';

export interface Settings {
  /** Nagios Core base URL, e.g. `http://nagios:80`. Empty means "no backend". */
  nagiosBaseUrl: string;
  username: string;
  password: string;
  pollSeconds: number;
  /** Only used while no Nagios backend is configured. */
  mockScenario: MockScenario;
}

export const DEFAULT_SETTINGS: Settings = {
  nagiosBaseUrl: '',
  username: 'nagiosadmin',
  password: '',
  pollSeconds: 15,
  mockScenario: 'mixed',
};

/** Stable composite key for a service within a snapshot. */
export function serviceKey(hostName: string, description: string): string {
  return `${hostName}\u0000${description}`;
}
