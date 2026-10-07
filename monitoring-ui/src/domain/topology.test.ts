import { describe, expect, it } from 'vitest';

import {
  buildTargetHostMap,
  createTargetResolver,
  planHosts,
} from '@/domain/topology';
import type {
  HostStatus,
  MonitorSnapshot,
  ServiceStatus,
  Target,
} from '@/domain/types';

function makeTarget(overrides: Partial<Target> & { id: string }): Target {
  return {
    name: overrides.id,
    kind: 'device',
    address: '10.0.0.1',
    check: 'ping',
    checkIntervalMinutes: 5,
    retryIntervalMinutes: 1,
    maxAttempts: 3,
    enabled: true,
    ...overrides,
  };
}

function makeHostStatus(name: string, state: HostStatus['state']): HostStatus {
  return {
    name,
    state,
    pluginOutput: '',
    lastCheck: 1000,
    nextCheck: 1000,
    lastStateChange: 0,
    currentAttempt: 1,
    maxAttempts: 3,
    executionTime: 0,
    latency: 0,
    isFlapping: false,
    scheduledDowntimeDepth: 0,
    acknowledged: false,
    checksEnabled: true,
  };
}

function makeServiceStatus(
  hostName: string,
  description: string,
  state: ServiceStatus['state'],
): ServiceStatus {
  return {
    hostName,
    description,
    state,
    pluginOutput: '',
    lastCheck: 1000,
    nextCheck: 1000,
    lastStateChange: 0,
    currentAttempt: 1,
    maxAttempts: 3,
    executionTime: 0,
    latency: 0,
    isFlapping: false,
    scheduledDowntimeDepth: 0,
    acknowledged: false,
    checksEnabled: true,
  };
}

function emptySnapshot(): MonitorSnapshot {
  return { fetchedAt: 0, source: 'mock', hosts: {}, services: {} };
}

describe('planHosts', () => {
  it('groups targets sharing an address onto a single host', () => {
    const plans = planHosts([
      makeTarget({ id: 'a', address: '10.0.0.5' }),
      makeTarget({ id: 'b', address: '10.0.0.5', name: 'Database port' }),
      makeTarget({ id: 'c', address: '10.0.0.9', name: 'Other box' }),
    ]);

    expect(plans).toHaveLength(2);
    const shared = plans.find((plan) => plan.address === '10.0.0.5');
    expect(shared?.targetIds).toEqual(expect.arrayContaining(['a', 'b']));
  });

  it('is case-insensitive on addresses', () => {
    const plans = planHosts([
      makeTarget({ id: 'a', address: 'api.example.com' }),
      makeTarget({ id: 'b', address: 'API.EXAMPLE.COM' }),
    ]);

    expect(plans).toHaveLength(1);
    expect(plans[0]?.targetIds).toHaveLength(2);
  });

  it('resolves slug collisions deterministically', () => {
    const plans = planHosts([
      makeTarget({ id: 'a', address: '10.0.0-1' }),
      makeTarget({ id: 'b', address: '10.0.0.1' }),
    ]);

    expect(plans).toHaveLength(2);
    const names = plans.map((plan) => plan.hostName).sort();
    expect(names[0]).toBe('10-0-0-1');
    expect(names[1]).toBe('10-0-0-1-2');
  });

  it('skips targets without an address', () => {
    const plans = planHosts([makeTarget({ id: 'a', address: '   ' })]);
    expect(plans).toHaveLength(0);
  });

  it('records every distinct kind on a host', () => {
    const plans = planHosts([
      makeTarget({ id: 'a', address: '10.0.0.7', kind: 'device' }),
      makeTarget({ id: 'b', address: '10.0.0.7', kind: 'application' }),
    ]);

    expect(plans[0]?.kinds).toEqual(expect.arrayContaining(['device', 'application']));
  });
});

describe('buildTargetHostMap', () => {
  it('resolves every target id to its planned host name', () => {
    const map = buildTargetHostMap(planHosts([
      makeTarget({ id: 'a', address: '10.0.0.5' }),
      makeTarget({ id: 'b', address: '10.0.0.5' }),
    ]));

    expect(map.get('a')).toBe('10-0-0-5');
    expect(map.get('b')).toBe('10-0-0-5');
  });
});

describe('createTargetResolver', () => {
  const targets = [
    makeTarget({ id: 'ping-box', name: 'Ping box', address: '10.0.0.8', check: 'ping' }),
    makeTarget({
      id: 'web-app',
      name: 'Web app',
      address: 'web.example.com',
      check: 'http',
    }),
  ];
  const resolver = createTargetResolver(targets);

  it('is pending when Nagios has no data at all', () => {
    const status = resolver.statusFor(targets[0]!, emptySnapshot());
    expect(status.known).toBe(false);
    expect(status.state).toBe('pending');
  });

  it('reads the service state when present', () => {
    // Hosts are keyed by their slugified Nagios name, not the raw address.
    const snapshot: MonitorSnapshot = {
      ...emptySnapshot(),
      services: {
        'web-example-com\u0000Web app': makeServiceStatus(
          'web-example-com',
          'Web app',
          'warning',
        ),
      },
    };
    const status = resolver.statusFor(targets[1]!, snapshot);
    expect(status.state).toBe('warning');
  });

  it('falls back to the host state when only the host exists', () => {
    const snapshot: MonitorSnapshot = {
      ...emptySnapshot(),
      hosts: { '10-0-0-8': makeHostStatus('10-0-0-8', 'unknown') },
    };
    const status = resolver.statusFor(targets[0]!, snapshot);
    expect(status.state).toBe('unknown');
  });

  it('escalates to critical when the host is down even if the service checks fine', () => {
    const snapshot: MonitorSnapshot = {
      ...emptySnapshot(),
      hosts: { 'web-example-com': makeHostStatus('web-example-com', 'critical') },
      services: {
        'web-example-com\u0000Web app': makeServiceStatus('web-example-com', 'Web app', 'up'),
      },
    };
    const status = resolver.statusFor(targets[1]!, snapshot);
    expect(status.state).toBe('critical');
  });
});