// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { App } from '@/App';
import { demoTargets } from '@/domain/targets';

/**
 * End-to-end smoke test over the real component tree, in jsdom, with the
 * simulated monitor source forced to the deterministic `outage` scenario:
 * one critical application, one warning service, everything else up.
 */
const OUTAGE_SETTINGS = {
  nagiosBaseUrl: '',
  username: 'nagiosadmin',
  pollSeconds: 2,
  mockScenario: 'outage',
};

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('monitoring.settings', JSON.stringify(OUTAGE_SETTINGS));
  // Seed the registry explicitly with the demo fixture. The app's own seed now
  // comes from data/seedTargets.json, which is deployment-specific — these
  // assertions must not move every time an operator edits their target list.
  localStorage.setItem('monitoring.targets', JSON.stringify(demoTargets()));
});

describe('Availability Monitor app', () => {
  it('renders the overview with availability figures from the simulated source', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeDefined();

    // 8 starter targets, 1 disabled -> 7 monitored.
    await waitFor(() => {
      expect(screen.getByText('7')).toBeDefined();
    });

    // Outage scenario: 6 available (one warning counts), 1 unavailable.
    expect(screen.getByText('85.7%')).toBeDefined();
    expect(screen.getByText('Needs attention')).toBeDefined();
    expect(screen.getByText('Fleet health')).toBeDefined();

    // The outage victim and the degraded service both appear in "Attention required".
    await screen.findByText('Intranet portal');
    await screen.findByText('Primary PostgreSQL');

    // The simulated source label is visible in the header.
    expect(screen.getByText('Simulated data')).toBeDefined();
  });

  it('lists targets, filters them, and opens the deploy dialog', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('link', { name: 'Targets' }));

    expect(await screen.findByRole('heading', { name: 'Targets' })).toBeDefined();
    await screen.findByText('Core switch');
    await screen.findByText('Public API');

    // Search narrows the table.
    await user.type(screen.getByRole('textbox', { name: 'Search targets' }), 'postgres');
    await waitFor(() => {
      expect(screen.getByText('Primary PostgreSQL')).toBeDefined();
      expect(screen.queryByText('Core switch')).toBeNull();
    });

    await user.click(screen.getByRole('button', { name: 'Deploy configuration' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('hosts.cfg')).toBeDefined();
    expect(within(dialog).getByText('services.cfg')).toBeDefined();
    expect(within(dialog).getByText('Apply to Nagios')).toBeDefined();
  });

  it('opens a target detail page and shows its generated Nagios objects', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('link', { name: 'Targets' }));
    await user.click(await screen.findByRole('link', { name: 'Intranet portal' }));

    expect(await screen.findByRole('heading', { name: 'Intranet portal' })).toBeDefined();
    await screen.findByText('Current availability');
    await screen.findByText('Generated Nagios objects');

    // The snippet for this HTTPS application names the right command.
    const snippet = screen.getByText(/define service \{/);
    expect(snippet.textContent).toContain('monitor-https!443!/health!200');
  });

  it('exposes connection settings and the test connection action', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('link', { name: 'Settings' }));

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeDefined();
    expect(screen.getByRole('textbox', { name: /base url/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /test connection/i })).toBeDefined();

    // The settings screen explains that simulated mode is active.
    expect(screen.getAllByText('Simulated data').length).toBeGreaterThan(0);
  });
});