import { useMemo } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import type { MonitorContextValue } from '@/app/monitor-context';
import { AppShell } from '@/components/layout/AppShell';
import { createMonitorSource } from '@/data/monitorRepository';
import { createTargetResolver } from '@/domain/topology';
import { useMonitorSnapshot } from '@/hooks/useMonitorSnapshot';
import { useSettings } from '@/hooks/useSettings';
import { useTargets } from '@/hooks/useTargets';
import { useTheme } from '@/hooks/useTheme';
import { NotFoundPage } from '@/features/not-found/NotFoundPage';
import { OverviewPage } from '@/features/overview/OverviewPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { TargetDetailPage } from '@/features/targets/TargetDetailPage';
import { TargetsPage } from '@/features/targets/TargetsPage';

export function App() {
  const { settings, updateSettings } = useSettings();
  const { targets, addTarget, updateTarget, removeTarget, replaceAll, resetToSeed } = useTargets();
  const { theme, toggleTheme } = useTheme();

  // The source only changes identity when settings or targets change; keeping it
  // memoised means the poll loop in useMonitorSnapshot restarts only then.
  const source = useMemo(
    () => createMonitorSource(settings, targets),
    [settings, targets],
  );

  const resolver = useMemo(() => createTargetResolver(targets), [targets]);

  const { snapshot, error, isLoading, refresh } = useMonitorSnapshot(
    source,
    settings.pollSeconds,
  );

  const value: MonitorContextValue = {
    targets,
    resolver,
    snapshot,
    error,
    isLoading,
    sourceKind: source.kind,
    settings,
    updateSettings,
    refresh,
    addTarget,
    updateTarget,
    removeTarget,
    replaceAll,
    resetToSeed,
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell value={value} theme={theme} onToggleTheme={toggleTheme} />}>
          <Route index element={<OverviewPage />} />
          <Route path="targets" element={<TargetsPage />} />
          <Route path="targets/:targetId" element={<TargetDetailPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}