import { createLiveSource } from '@/data/nagiosClient';
import { createMockSource } from '@/data/mockSource';
import type { MonitorSource, Settings, Target } from '@/domain/types';

/**
 * Choose where availability data comes from.
 *
 * A configured base URL means Nagios is the source of truth. No base URL means
 * the app runs against the simulator, so the interface is testable on a
 * workstation with no Nagios present.
 */
/** '/' means “same origin” — the deployment serves the CGIs through its own proxy. */
export function isLiveConfigured(settings: Settings): boolean {
  return settings.nagiosBaseUrl.trim().length > 0;
}

export function createMonitorSource(
  settings: Settings,
  targets: readonly Target[],
): MonitorSource {
  const baseUrl = settings.nagiosBaseUrl.trim();

  if (baseUrl.length === 0) {
    return createMockSource(targets, { scenario: settings.mockScenario });
  }

  return createLiveSource({
    baseUrl: baseUrl === '/' ? '/' : baseUrl,
    username: settings.username,
    password: settings.password,
  });
}

export function describeSource(settings: Settings): string {
  return isLiveConfigured(settings) ? 'Nagios Core' : 'Simulated';
}

export function displayNagiosTarget(settings: Settings): string {
  const base = settings.nagiosBaseUrl.trim();
  if (base === '' || base === '/') return 'this server';
  return base;
}
