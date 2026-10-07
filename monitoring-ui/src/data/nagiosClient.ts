import { hostStateFromNagios, serviceStateFromNagios } from '@/domain/status';
import {
  serviceKey,
  type HostStatus,
  type MonitorSnapshot,
  type MonitorSource,
  type ServiceStatus,
} from '@/domain/types';

/**
 * Client for the Nagios Core JSON CGIs.
 *
 * Contract verified against the source in this tree:
 *   - envelope:      `{ format_version, result, data }` (cgi/statusjson.c)
 *   - success:       `result.type_code === 0` (RESULT_SUCCESS, include/jsonutils.h)
 *   - enumerations:  `formatoptions=enumerate` yields strings, not bit values
 *                    (cgi/jsonutils.c: JSON_FORMAT_ENUMERATE)
 *   - booleans:      literal `true` / `false` (cgi/jsonutils.c:parse_boolean_cgivar)
 *   - list shapes:   `data.hostlist[host]` and `data.servicelist[host][service]`
 */
export interface NagiosConnection {
  /** Nagios root, e.g. `http://nagios:80`. CGIs are expected under `/cgi-bin/`. */
  baseUrl: string;
  username?: string;
  password?: string;
}

export class NagiosError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'NagiosError';
    this.status = status;
  }
}

interface NagiosEnvelope {
  format_version?: number;
  result?: {
    type_code?: number;
    type_text?: string;
    message?: string;
    query?: string;
    query_status?: string;
  };
  data?: unknown;
}

const CGI_PATH = '/cgi-bin';

function buildCgiUrl(baseUrl: string, cgi: string, params: Record<string, string>): string {
  // '/' means “same origin” (the deployment proxies /cgi-bin/ itself).
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  const url =
    trimmed === ''
      ? new URL(`${CGI_PATH}/${cgi}`, window.location.origin)
      : new URL(`${trimmed}${CGI_PATH}/${cgi}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

/** UTF-8 safe Basic auth encoding; `btoa` alone corrupts non-Latin passwords. */
function toBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

async function queryCgi(
  connection: NagiosConnection,
  cgi: string,
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<unknown> {
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (connection.username) {
    headers.Authorization = `Basic ${toBase64(`${connection.username}:${connection.password ?? ''}`)}`;
  }

  let response: Response;
  try {
    response = await fetch(buildCgiUrl(connection.baseUrl, cgi, params), {
      headers,
      credentials: 'omit',
      ...(signal ? { signal } : {}),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new NagiosError(
      `Could not reach Nagios at ${connection.baseUrl}. Check the base URL and that the host is up.`,
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new NagiosError(
      'Nagios rejected the credentials. Check the username and password in Settings.',
      response.status,
    );
  }

  if (!response.ok) {
    throw new NagiosError(`Nagios CGI ${cgi} returned HTTP ${response.status}.`, response.status);
  }

  let payload: NagiosEnvelope;
  try {
    payload = (await response.json()) as NagiosEnvelope;
  } catch {
    throw new NagiosError(
      `Nagios CGI ${cgi} did not return JSON. Confirm the CGIs are enabled and the URL points at Nagios Core.`,
    );
  }

  const typeCode = payload.result?.type_code;
  if (typeof typeCode === 'number' && typeCode !== 0) {
    const message = payload.result?.message?.trim();
    throw new NagiosError(message && message.length > 0 ? message : `Nagios CGI ${cgi} reported an error.`);
  }

  return payload.data;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

/**
 * The JSON CGIs report every timestamp in milliseconds (`query_time` and
 * friends are all `...000`), but the app's formatters take epoch seconds.
 * Convert here, at the wire boundary, so no component has to know which unit
 * Nagios happened to use. A missing or zero timestamp stays zero, which the
 * formatters render as "never".
 */
function epochSeconds(value: unknown): number {
  const ms = num(value);
  return ms > 0 ? Math.floor(ms / 1000) : 0;
}

function bool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return fallback;
}

function parseHosts(data: unknown): Record<string, HostStatus> {
  const hosts: Record<string, HostStatus> = {};
  const list = asRecord(asRecord(data)?.hostlist);
  if (!list) return hosts;

  for (const [key, raw] of Object.entries(list)) {
    const details = asRecord(raw);
    if (!details) continue;

    const name = str(details.name, key);
    hosts[name] = {
      name,
      state: hostStateFromNagios(details.status),
      pluginOutput: str(details.plugin_output),
      lastCheck: epochSeconds(details.last_check),
      nextCheck: epochSeconds(details.next_check),
      lastStateChange: epochSeconds(details.last_state_change),
      currentAttempt: num(details.current_attempt, 1),
      maxAttempts: num(details.max_attempts, 1),
      executionTime: num(details.execution_time),
      latency: num(details.latency),
      isFlapping: bool(details.is_flapping),
      scheduledDowntimeDepth: num(details.scheduled_downtime_depth),
      acknowledged: bool(details.problem_has_been_acknowledged),
      checksEnabled: bool(details.checks_enabled, true),
    };
  }

  return hosts;
}

function parseServices(data: unknown): Record<string, ServiceStatus> {
  const services: Record<string, ServiceStatus> = {};
  const list = asRecord(asRecord(data)?.servicelist);
  if (!list) return services;

  for (const [hostKey, rawServices] of Object.entries(list)) {
    const perHost = asRecord(rawServices);
    if (!perHost) continue;

    for (const [descriptionKey, raw] of Object.entries(perHost)) {
      const details = asRecord(raw);
      if (!details) continue;

      const hostName = str(details.host_name, hostKey);
      const description = str(details.description, descriptionKey);

      services[serviceKey(hostName, description)] = {
        hostName,
        description,
        state: serviceStateFromNagios(details.status),
        pluginOutput: str(details.plugin_output),
        lastCheck: epochSeconds(details.last_check),
        nextCheck: epochSeconds(details.next_check),
        lastStateChange: epochSeconds(details.last_state_change),
        currentAttempt: num(details.current_attempt, 1),
        maxAttempts: num(details.max_attempts, 1),
        executionTime: num(details.execution_time),
        latency: num(details.latency),
        isFlapping: bool(details.is_flapping),
        scheduledDowntimeDepth: num(details.scheduled_downtime_depth),
        acknowledged: bool(details.problem_has_been_acknowledged),
        checksEnabled: bool(details.checks_enabled, true),
      };
    }
  }

  return services;
}

export function createLiveSource(connection: NagiosConnection): MonitorSource {
  return {
    kind: 'live',
    async fetchSnapshot(signal?: AbortSignal): Promise<MonitorSnapshot> {
      const params = { details: 'true', formatoptions: 'enumerate' };

      const [hostData, serviceData] = await Promise.all([
        queryCgi(connection, 'statusjson.cgi', { query: 'hostlist', ...params }, signal),
        queryCgi(connection, 'statusjson.cgi', { query: 'servicelist', ...params }, signal),
      ]);

      return {
        fetchedAt: Date.now(),
        source: 'live',
        hosts: parseHosts(hostData),
        services: parseServices(serviceData),
      };
    },
  };
}

export interface ConnectionProbeResult {
  reachable: boolean;
  hostCount: number;
  serviceCount: number;
  message: string;
}

/**
 * Cheap round trip used by the settings screen. Queries the count endpoints so
 * the operator gets "connected, N hosts / M services" rather than a bare OK.
 */
export async function probeConnection(
  connection: NagiosConnection,
): Promise<ConnectionProbeResult> {
  const [hostData, serviceData] = await Promise.all([
    queryCgi(connection, 'statusjson.cgi', {
      query: 'hostcount',
      formatoptions: 'enumerate',
    }),
    queryCgi(connection, 'statusjson.cgi', {
      query: 'servicecount',
      formatoptions: 'enumerate',
    }),
  ]);

  const hostCount = (asRecord(asRecord(hostData)?.count) ?? {}) satisfies Record<string, unknown>;
  const serviceCount = (asRecord(asRecord(serviceData)?.count) ?? {}) satisfies Record<
    string,
    unknown
  >;

  const sum = (counts: Record<string, unknown>): number =>
    Object.values(counts).reduce<number>((total, value) => total + num(value), 0);

  const hosts = sum(hostCount);
  const services = sum(serviceCount);

  return {
    reachable: true,
    hostCount: hosts,
    serviceCount: services,
    message: `Connected. Nagios reports ${hosts} host(s) and ${services} service(s).`,
  };
}
