import { defaultPortFor } from '@/domain/checks';
import { createTargetResolver } from '@/domain/topology';
import {
  serviceKey,
  type AvailabilityState,
  type HostStatus,
  type MockScenario,
  type MonitorSnapshot,
  type MonitorSource,
  type ServiceStatus,
  type Target,
} from '@/domain/types';

/**
 * Simulated monitor source.
 *
 * Exists so the interface is fully exercisable with no Nagios backend — which is
 * the only way to test on a Windows workstation, and the fastest way to check a
 * UI change without waiting on a five-minute check cycle. States are derived from
 * a hash of the target and a five-minute time bucket, so a burst of polls shows a
 * stable fleet while the data still visibly moves over time.
 */

const BUCKET_MS = 5 * 60_000;

function hash(value: string): number {
  let accumulator = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    accumulator ^= value.charCodeAt(index);
    accumulator = Math.imul(accumulator, 0x01000193) >>> 0;
  }
  return accumulator;
}

function pickOutageTarget(targets: readonly Target[]): Target | undefined {
  const enabled = targets.filter((target) => target.enabled);
  return enabled.find((target) => target.check !== 'ping') ?? enabled[0];
}

function pickWarningTarget(targets: readonly Target[]): Target | undefined {
  const enabled = targets.filter((target) => target.enabled);
  return enabled.find((target) => target.check === 'tcp') ?? enabled[1] ?? enabled[0];
}

function stateFor(
  target: Target,
  scenario: MockScenario,
  bucket: number,
  outageId: string | undefined,
  warningId: string | undefined,
): AvailabilityState {
  if (scenario === 'healthy') return 'up';

  if (scenario === 'outage') {
    if (target.id === outageId) return 'critical';
    if (target.id === warningId && target.id !== outageId) return 'warning';
    return 'up';
  }

  const roll = hash(`${target.id}|${target.address}|${String(bucket)}`) % 100;
  if (roll < 9) return 'critical';
  if (roll < 22) return 'warning';
  if (roll < 27) return 'unknown';
  return 'up';
}

function pluginOutputFor(target: Target, state: AvailabilityState, seed: number): string {
  const port = target.port ?? defaultPortFor(target);
  const rta = (0.2 + (seed % 480) / 100).toFixed(2);
  const responseTime = (0.002 + (seed % 900) / 1000).toFixed(3);

  switch (target.check) {
    case 'ping':
      switch (state) {
        case 'critical':
          return 'PING CRITICAL - Packet loss = 100%';
        case 'warning':
          return `PING WARNING - Packet loss = 30%, RTA = ${rta} ms`;
        case 'unknown':
          return 'PING UNKNOWN - Could not interpret output from the ping command';
        case 'pending':
          return 'PING - awaiting first check result';
        case 'up':
          return `PING OK - Packet loss = 0%, RTA = ${rta} ms`;
      }
      break;

    case 'tcp':
      switch (state) {
        case 'critical':
          return `connect to address ${target.address} and port ${String(port)}: Connection refused`;
        case 'warning':
          return `TCP WARNING - ${responseTime} second response time on ${target.address} port ${String(port)}`;
        case 'unknown':
          return `TCP UNKNOWN - Unexpected response from ${target.address} port ${String(port)}`;
        case 'pending':
          return `TCP - awaiting first check on port ${String(port)}`;
        case 'up':
          return `TCP OK - ${responseTime} second response time on ${target.address} port ${String(port)}`;
      }
      break;

    case 'http': {
      const scheme = target.secure ? 'https' : 'http';
      const path = target.path ?? '/';
      const bytes = 180 + (seed % 6000);

      switch (state) {
        case 'critical':
          return `HTTP CRITICAL: HTTP/1.1 503 Service Unavailable - ${String(bytes)} bytes in ${responseTime} second response time`;
        case 'warning':
          return `HTTP WARNING: HTTP/1.1 200 OK - ${String(bytes)} bytes in 2.410 second response time`;
        case 'unknown':
          return `HTTP UNKNOWN: Invalid HTTP response received from host on port ${String(port)}`;
        case 'pending':
          return `HTTP - awaiting first check of ${scheme}://${target.address}:${String(port)}${path}`;
        case 'up':
          return `HTTP OK: HTTP/1.1 200 OK - ${String(bytes)} bytes in ${responseTime} second response time`;
      }
      break;
    }

    case 'dns':
      switch (state) {
        case 'critical':
          return `DNS CRITICAL - ${responseTime} seconds response time. ${target.address} returns no answer`;
        case 'warning':
          return `DNS WARNING - ${responseTime} seconds response time. ${target.address} returns unexpected value`;
        case 'unknown':
          return `DNS UNKNOWN - Timed out while resolving ${target.address}`;
        case 'pending':
          return `DNS - awaiting first resolution of ${target.address}`;
        case 'up':
          return `DNS OK: ${responseTime} seconds response time. ${target.address} returns ${target.expectValue ?? 'expected value'}|time=${responseTime}s;;;0.000000`;
      }
      break;
  }

  return 'No output recorded.';
}

export interface MockSourceOptions {
  scenario?: MockScenario;
  /** Injectable clock, so tests get deterministic buckets. */
  now?: () => number;
}

export function createMockSource(
  targets: readonly Target[],
  options: MockSourceOptions = {},
): MonitorSource {
  const scenario = options.scenario ?? 'mixed';
  const now = options.now ?? Date.now;
  const resolver = createTargetResolver(targets);
  const outageId = pickOutageTarget(targets)?.id;
  const warningId = pickWarningTarget(targets)?.id;

  return {
    kind: 'mock',
    async fetchSnapshot(): Promise<MonitorSnapshot> {
      const timestamp = now();
      const bucket = Math.floor(timestamp / BUCKET_MS);

      const hosts: Record<string, HostStatus> = {};
      const services: Record<string, ServiceStatus> = {};

      for (const target of targets) {
        if (!target.enabled) continue;

        const hostName = resolver.hostNameFor(target);
        const state = stateFor(target, scenario, bucket, outageId, warningId);
        const seed = hash(`${target.id}|output`);
        const pluginOutput = pluginOutputFor(target, state, seed);
        const lastCheck = Math.floor(timestamp / 1000) - (seed % 240);
        const nextCheck = lastCheck + target.checkIntervalMinutes * 60;

        // A ping target's host *is* the check; other checks can fail while the
        // host itself is perfectly reachable, which is the interesting case.
        const hostState: AvailabilityState = target.check === 'ping' ? state : 'up';

        hosts[hostName] = {
          name: hostName,
          state: hostState,
          pluginOutput:
            hostState === 'up'
              ? 'PING OK - Packet loss = 0%, RTA = 0.31 ms'
              : pluginOutputFor({ ...target, check: 'ping' }, hostState, seed),
          lastCheck,
          nextCheck,
          lastStateChange: lastCheck - (seed % 86_400),
          currentAttempt: state === 'up' ? 1 : 2,
          maxAttempts: target.maxAttempts,
          executionTime: (seed % 400) / 1000,
          latency: (seed % 120) / 1000,
          isFlapping: state !== 'up' && seed % 17 === 0,
          scheduledDowntimeDepth: 0,
          acknowledged: false,
          checksEnabled: true,
        };

        services[serviceKey(hostName, resolver.serviceDescriptionFor(target))] = {
          hostName,
          description: resolver.serviceDescriptionFor(target),
          state,
          pluginOutput,
          lastCheck,
          nextCheck,
          lastStateChange: lastCheck - (seed % 43_200),
          currentAttempt: state === 'up' ? 1 : 2,
          maxAttempts: target.maxAttempts,
          executionTime: (seed % 700) / 1000,
          latency: (seed % 200) / 1000,
          isFlapping: false,
          scheduledDowntimeDepth: 0,
          acknowledged: false,
          checksEnabled: true,
        };
      }

      return { fetchedAt: timestamp, source: 'mock', hosts, services };
    },
  };
}
