import { describe, expect, it } from 'vitest';

import { createMockSource } from '@/data/mockSource';
import type { Target } from '@/domain/types';

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

function fixedNow(): () => number {
  let current = 1_700_000_000_000;
  return () => current;
}

describe('createMockSource', () => {
  it('reports everything available under the healthy scenario', async () => {
    const source = createMockSource(
      [
        makeTarget({ id: 'a', address: '10.0.0.1' }),
        makeTarget({ id: 'b', address: '10.0.0.2', check: 'tcp', port: 5432 }),
        makeTarget({ id: 'c', address: '10.0.0.3', check: 'http', secure: true }),
      ],
      { scenario: 'healthy', now: fixedNow() },
    );

    const snapshot = await source.fetchSnapshot();

    expect(Object.values(snapshot.hosts).every((host) => host.state === 'up')).toBe(true);
    expect(Object.values(snapshot.services).every((service) => service.state === 'up')).toBe(true);
  });

  it('never emits hosts or services for disabled targets', async () => {
    const source = createMockSource(
      [makeTarget({ id: 'a', address: '10.0.0.1', enabled: false })],
      { scenario: 'mixed', now: fixedNow() },
    );

    const snapshot = await source.fetchSnapshot();
    expect(snapshot.hosts).toEqual({});
    expect(snapshot.services).toEqual({});
  });

  it('produces exactly one critical target under the outage scenario', async () => {
    const source = createMockSource(
      [
        makeTarget({ id: 'ping', address: '10.0.0.1' }),
        makeTarget({ id: 'app', address: '10.0.0.2', check: 'http' }),
        makeTarget({ id: 'db', address: '10.0.0.3', check: 'tcp', port: 5432 }),
      ],
      { scenario: 'outage', now: fixedNow() },
    );

    const snapshot = await source.fetchSnapshot();
    const critical = Object.values(snapshot.services).filter(
      (service) => service.state === 'critical',
    );

    expect(critical).toHaveLength(1);
    // The outage victim is the first non-ping target: the http application.
    expect(critical[0]?.description).toBe('app');
  });

  it('is deterministic within a time bucket', async () => {
    const clock = fixedNow();
    const targets = [
      makeTarget({ id: 'a', address: '10.0.0.1' }),
      makeTarget({ id: 'b', address: '10.0.0.2', check: 'tcp', port: 25 }),
      makeTarget({ id: 'c', address: '10.0.0.3', check: 'dns' }),
    ];
    const source = createMockSource(targets, { scenario: 'mixed', now: clock });

    const first = await source.fetchSnapshot();
    const second = await source.fetchSnapshot();

    expect(first.services).toEqual(second.services);
    expect(first.hosts).toEqual(second.hosts);
  });
});