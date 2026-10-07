import { describe, expect, it } from 'vitest';

import { generateNagiosConfig, generateTargetSnippet } from '@/domain/nagios-config';
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

describe('generateNagiosConfig', () => {
  it('emits one host per shared address and one service per enabled target', () => {
    const bundle = generateNagiosConfig(
      [
        makeTarget({ id: 'a', name: 'Router', address: '10.0.0.1' }),
        makeTarget({
          id: 'b',
          name: 'Postgres',
          kind: 'service',
          address: '10.0.0.1',
          check: 'tcp',
          port: 5432,
        }),
        makeTarget({ id: 'c', name: 'Other', address: '10.0.0.2' }),
      ],
      { generatedAt: '2026-01-01T00:00:00.000Z' },
    );

    expect(bundle.hostCount).toBe(2);
    expect(bundle.serviceCount).toBe(3);
    expect(bundle.hosts).toContain('define host {');
    expect(bundle.hosts).toContain('define hostgroup {');
    expect(bundle.services).toContain('monitor-tcp!5432');
  });

  it('excludes disabled targets and lists them in the disabled set', () => {
    const bundle = generateNagiosConfig(
      [
        makeTarget({ id: 'on', name: 'Enabled box', address: '10.0.0.3' }),
        makeTarget({ id: 'off', name: 'Disabled box', address: '10.0.0.4', enabled: false }),
      ],
      { generatedAt: '2026-01-01T00:00:00.000Z' },
    );

    expect(bundle.hostCount).toBe(1);
    expect(bundle.serviceCount).toBe(1);
    expect(bundle.disabled.map((target) => target.id)).toEqual(['off']);
    expect(bundle.hosts).not.toContain('10.0.0.4');
    expect(bundle.services).toContain('Disabled box');
    // ... as a comment, not as a definition
    expect(bundle.services).toContain('# Disabled box @ 10.0.0.4');
  });

  it('selects the right check command per kind and option', () => {
    const bundle = generateNagiosConfig(
      [
        makeTarget({ id: 'ping', name: 'Ping', address: '10.0.0.1' }),
        makeTarget({ id: 'tcp', name: 'TCP', address: '10.0.0.1', check: 'tcp', port: 3306 }),
        makeTarget({
          id: 'http',
          name: 'HTTP',
          address: '10.0.0.1',
          check: 'http',
          port: 8080,
          path: '/health',
          expectStatus: 204,
        }),
        makeTarget({
          id: 'https',
          name: 'HTTPS',
          address: '10.0.0.1',
          check: 'http',
          secure: true,
        }),
        makeTarget({
          id: 'dns',
          name: 'DNS',
          address: '10.0.0.1',
          check: 'dns',
          dnsRecordType: 'MX',
          expectValue: 'mail.example.com',
        }),
      ],
      { generatedAt: '2026-01-01T00:00:00.000Z' },
    );

    expect(bundle.services).toContain('monitor-ping');
    expect(bundle.services).toContain('monitor-tcp!3306');
    expect(bundle.services).toContain('monitor-http!8080!/health!204');
    expect(bundle.services).toContain('monitor-https!443!/!200');
    expect(bundle.services).toContain('monitor-dns-expected!mail.example.com');
  });

  it('omits the DNS expectation when none was supplied', () => {
    const bundle = generateNagiosConfig(
      [
        makeTarget({
          id: 'dns',
          name: 'DNS',
          address: 'mail.example.com',
          check: 'dns',
        }),
      ],
      { generatedAt: '2026-01-01T00:00:00.000Z' },
    );

    expect(bundle.services).toContain('monitor-dns');
    expect(bundle.services).not.toContain('-expected');
  });

  it('scrubs characters that would corrupt generated config', () => {
    const bundle = generateNagiosConfig(
      [
        makeTarget({
          id: 'evil',
          name: 'Semi;colon!bang',
          address: '10.0.0.9',
          check: 'tcp',
          port: 22,
          notes: 'note with ; semicolon',
        }),
      ],
      { generatedAt: '2026-01-01T00:00:00.000Z' },
    );

    expect(bundle.services).not.toMatch(/Semi;colon!bang/);
    expect(bundle.services).not.toMatch(/note with ;/);
  });

  it('assigns hosts to groups matching their target kinds', () => {
    const bundle = generateNagiosConfig(
      [
        makeTarget({ id: 'a', name: 'Device', address: '10.0.0.1', kind: 'device' }),
        makeTarget({
          id: 'b',
          name: 'App',
          address: '10.0.0.2',
          kind: 'application',
          check: 'http',
        }),
      ],
      { generatedAt: '2026-01-01T00:00:00.000Z' },
    );

    expect(bundle.hosts).toContain('hostgroup_name    monitoring-devices');
    expect(bundle.hosts).toContain('hostgroup_name    monitoring-applications');
    expect(bundle.hosts).toMatch(/hostgroups\s+monitoring-devices/);
    expect(bundle.hosts).toMatch(/hostgroups\s+monitoring-applications/);
  });

  it('renders a complete host + service pair for a single target', () => {
    const snippet = generateTargetSnippet(
      makeTarget({
        id: 'solo',
        name: 'Solo box',
        address: '10.99.0.1',
        check: 'tcp',
        port: 443,
      }),
    );

    expect(snippet).toMatch(/host_name\s+10-99-0-1/);
    expect(snippet).toMatch(/address\s+10\.99\.0\.1/);
    expect(snippet).toMatch(/service_description\s+Solo box/);
    expect(snippet).toContain('monitor-tcp!443');
  });
});