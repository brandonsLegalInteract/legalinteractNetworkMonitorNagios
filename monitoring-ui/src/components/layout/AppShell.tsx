import {
  Activity,
  LayoutDashboard,
  Moon,
  RefreshCw,
  Sun,
  Target as TargetIcon,
  TriangleAlert,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

import type { MonitorContextValue } from '@/app/monitor-context';
import { Button } from '@/components/ui/button';
import { displayNagiosTarget } from '@/data/monitorRepository';
import type { Theme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/targets', label: 'Targets', icon: TargetIcon, end: false },
  { to: '/settings', label: 'Settings', icon: Activity, end: false },
] as const;

export interface AppShellProps {
  value: MonitorContextValue;
  theme: Theme;
  onToggleTheme: () => void;
}

export function AppShell({ value, theme, onToggleTheme }: AppShellProps) {
  const { sourceKind, snapshot, error, isLoading, refresh } = value;
  const simulated = sourceKind === 'mock';

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="border-b border-border bg-card/40 lg:border-r lg:border-b-0">
        <div className="flex items-center gap-2.5 px-5 py-4">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wifi className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Availability Monitor</p>
            <p className="truncate text-xs text-muted-foreground">Nagios Core interface</p>
          </div>
        </div>

        <nav aria-label="Sections" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground',
                )
              }
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/85 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            {simulated ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-status-warning/40 bg-status-warning-subtle px-2.5 py-0.5 text-xs font-medium text-status-warning-foreground">
                <WifiOff className="size-3.5" aria-hidden="true" />
                Simulated data
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-status-up/40 bg-status-up-subtle px-2.5 py-0.5 text-xs font-medium text-status-up-foreground">
                <Wifi className="size-3.5" aria-hidden="true" />
                Live · {displayNagiosTarget(value.settings)}
              </span>
            )}
            {snapshot ? (
              <span className="text-xs text-muted-foreground">
                Updated{' '}
                {new Date(snapshot.fetchedAt).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
              aria-label="Refresh availability data"
            >
              <RefreshCw className={cn(isLoading && 'animate-spin')} aria-hidden="true" />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </Button>
          </div>
        </header>

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 border-b border-status-critical/30 bg-status-critical-subtle px-5 py-3 text-sm text-status-critical-foreground"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">Monitoring data could not be refreshed</p>
              <p className="text-xs">{error}</p>
            </div>
          </div>
        ) : null}

        <main className="flex-1 px-5 py-6">
          <Outlet context={value} />
        </main>
      </div>
    </div>
  );
}
