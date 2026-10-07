import {
  Check,
  CircleX,
  Loader2,
  PlugZap,
  RotateCcw,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { useMonitor } from '@/app/monitor-context';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { probeConnection } from '@/data/nagiosClient';
import { describeSource } from '@/data/monitorRepository';
import type { MockScenario, Settings } from '@/domain/types';

type ProbeState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; message: string }
  | { status: 'error'; message: string };

export function SettingsPage() {
  const { settings, updateSettings, sourceKind, targets, resetToSeed } = useMonitor();

  const [draft, setDraft] = useState<Settings>(settings);
  const [probe, setProbe] = useState<ProbeState>({ status: 'idle' });
  const [resetOpen, setResetOpen] = useState(false);

  const dirty = useMemo(
    () =>
      draft.nagiosBaseUrl !== settings.nagiosBaseUrl ||
      draft.username !== settings.username ||
      draft.password !== settings.password ||
      draft.pollSeconds !== settings.pollSeconds ||
      draft.mockScenario !== settings.mockScenario,
    [draft, settings],
  );

  const patch = (partial: Partial<Settings>) => setDraft((current) => ({ ...current, ...partial }));

  const save = () => {
    updateSettings(draft);
  };

  const testConnection = async () => {
    setProbe({ status: 'loading' });
    try {
      const result = await probeConnection({
        baseUrl: draft.nagiosBaseUrl,
        username: draft.username,
        password: draft.password,
      });
      setProbe({ status: 'ok', message: result.message });
    } catch (error) {
      setProbe({
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection test failed.',
      });
    }
  };

  const connected = sourceKind === 'live';
  const idPrefix = 'settings';

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Where availability data comes from, and how often it refreshes.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="gap-1">
            <CardTitle>Nagios Core connection</CardTitle>
            <CardDescription>
              Currently using <span className="font-medium">{describeSource(settings)}</span>.
              {connected
                ? ' The JSON CGIs are queried on every refresh.'
                : ' Enter a Nagios host to leave simulated mode.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field
              label="Base URL"
              htmlFor={`${idPrefix}-base-url`}
              hint="Leave empty for simulated data, enter / when Nagios is served through this app's own proxy, or use http://host:port for a direct backend."
            >
              <Input
                id={`${idPrefix}-base-url`}
                value={draft.nagiosBaseUrl}
                onChange={(event) => patch({ nagiosBaseUrl: event.target.value })}
                placeholder="'/' or http://localhost:8080"
                autoComplete="off"
                spellCheck={false}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Username" htmlFor={`${idPrefix}-username`}>
                <Input
                  id={`${idPrefix}-username`}
                  value={draft.username}
                  onChange={(event) => patch({ username: event.target.value })}
                  placeholder="nagiosadmin"
                  autoComplete="username"
                />
              </Field>

              <Field
                label="Password"
                htmlFor={`${idPrefix}-password`}
                hint="Kept in session memory only — it is never written to disk."
              >
                <Input
                  id={`${idPrefix}-password`}
                  type="password"
                  value={draft.password}
                  onChange={(event) => patch({ password: event.target.value })}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Refresh interval (seconds)"
                htmlFor={`${idPrefix}-poll`}
                hint="How often the interface asks Nagios for fresh status."
              >
                <Input
                  id={`${idPrefix}-poll`}
                  type="number"
                  inputMode="numeric"
                  min={2}
                  max={3600}
                  value={draft.pollSeconds}
                  onChange={(event) =>
                    patch({ pollSeconds: Math.max(2, Number(event.target.value) || 15) })
                  }
                />
              </Field>

              <Field label="Status" hint="The source the interface is reading from.">
                <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
                  {connected ? (
                    <>
                      <Wifi className="size-4 text-status-up" aria-hidden="true" />
                      <span className="text-status-up-foreground">Live: {draft.nagiosBaseUrl}</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="size-4 text-status-warning" aria-hidden="true" />
                      <span className="text-status-warning-foreground">Simulated data</span>
                    </>
                  )}
                </div>
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => void testConnection()} disabled={probe.status === 'loading'}>
                {probe.status === 'loading' ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <PlugZap aria-hidden="true" />
                )}
                {probe.status === 'loading' ? 'Testing…' : 'Test connection'}
              </Button>

              <Button onClick={save} disabled={!dirty}>
                <Check aria-hidden="true" />
                Save & apply
              </Button>
            </div>

            {probe.status === 'ok' ? (
              <p className="flex items-start gap-2 rounded-lg border border-status-up/30 bg-status-up-subtle p-3 text-xs text-status-up-foreground">
                <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {probe.message}
              </p>
            ) : null}

            {probe.status === 'error' ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-status-critical/30 bg-status-critical-subtle p-3 text-xs text-status-critical-foreground"
              >
                <CircleX className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {probe.message}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="gap-1">
              <CardTitle>Simulated data</CardTitle>
              <CardDescription>
                Only used while no Nagios base URL is configured — useful for local testing and for
                rehearsing how the interface behaves in an outage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Field label="Scenario" htmlFor={`${idPrefix}-scenario`}>
                <Select
                  id={`${idPrefix}-scenario`}
                  value={draft.mockScenario}
                  disabled={connected}
                  onChange={(event) => patch({ mockScenario: event.target.value as MockScenario })}
                >
                  <option value="mixed">Mixed — mostly healthy with a few failures</option>
                  <option value="healthy">All available</option>
                  <option value="outage">One critical outage plus degradation</option>
                </Select>
              </Field>
              <p className="mt-2 text-xs text-muted-foreground">
                {connected
                  ? 'A live connection takes precedence; the scenario resumes when the base URL is cleared.'
                  : 'State changes every five minutes so polling is visibly alive.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-1">
              <CardTitle>Target registry</CardTitle>
              <CardDescription>
                {targets.length} target{targets.length === 1 ? '' : 's'} stored in this browser,{' '}
                {targets.filter((target) => target.enabled).length} enabled.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => setResetOpen(true)} disabled={targets.length === 0}>
                <RotateCcw aria-hidden="true" />
                Restore starter targets
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-1">
              <CardTitle>How this works</CardTitle>
              <CardDescription>
                The interface is the operator surface; Nagios Core is the engine. Targets are
                rendered into Nagios object files, and availability comes from the JSON CGIs (
                <code className="font-mono">statusjson.cgi</code>).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                The password is never persisted to disk; it lives in session memory for the life of
                the tab.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Restore starter targets"
        description="This replaces the current registry with the starter set. Changes made since then are lost — export a JSON backup first if you want to keep them."
        confirmLabel="Restore"
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          resetToSeed();
          setResetOpen(false);
        }}
      />
    </div>
  );
}