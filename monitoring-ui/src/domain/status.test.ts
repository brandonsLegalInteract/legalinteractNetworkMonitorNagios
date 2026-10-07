import { describe, expect, it } from 'vitest';

import {
  availabilityPercent,
  countStates,
  hostStateFromNagios,
  serviceStateFromNagios,
  worstState,
} from '@/domain/status';

describe('hostStateFromNagios', () => {
  it('maps the Nagios host vocabulary onto availability states', () => {
    expect(hostStateFromNagios('up')).toBe('up');
    expect(hostStateFromNagios('down')).toBe('critical');
    expect(hostStateFromNagios('unreachable')).toBe('unknown');
    expect(hostStateFromNagios('pending')).toBe('pending');
  });

  it('tolerates casing and unparseable input', () => {
    expect(hostStateFromNagios('DOWN')).toBe('critical');
    expect(hostStateFromNagios(3)).toBe('pending');
    expect(hostStateFromNagios('banana')).toBe('pending');
  });
});

describe('serviceStateFromNagios', () => {
  it('maps the service vocabulary with ok becoming available', () => {
    expect(serviceStateFromNagios('ok')).toBe('up');
    expect(serviceStateFromNagios('warning')).toBe('warning');
    expect(serviceStateFromNagios('critical')).toBe('critical');
    expect(serviceStateFromNagios('unknown')).toBe('unknown');
    expect(serviceStateFromNagios('pending')).toBe('pending');
  });

  it('falls back to pending for unknown input', () => {
    expect(serviceStateFromNagios(undefined)).toBe('pending');
  });
});

describe('worstState', () => {
  it('picks the most severe of the supplied states', () => {
    expect(worstState(['up'])).toBe('up');
    expect(worstState(['up', 'warning'])).toBe('warning');
    expect(worstState(['warning', 'critical', 'up'])).toBe('critical');
    expect(worstState(['critical', 'pending', 'unknown', 'warning'])).toBe('critical');
  });

  it('returns pending for an empty input', () => {
    expect(worstState([])).toBe('pending');
  });
});

describe('countStates', () => {
  it('counts every state into every bucket', () => {
    expect(countStates(['up', 'up', 'warning', 'critical'])).toEqual({
      critical: 1,
      warning: 1,
      unknown: 0,
      pending: 0,
      up: 2,
    });
  });
});

describe('availabilityPercent', () => {
  it('counts up and warning as available', () => {
    expect(availabilityPercent(['up', 'up', 'warning', 'critical'])).toBe(75);
  });

  it('returns 100 for an empty input', () => {
    expect(availabilityPercent([])).toBe(100);
  });
});