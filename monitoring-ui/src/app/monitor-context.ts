import { useOutletContext } from 'react-router-dom';

import type { TargetResolver } from '@/domain/topology';
import type { MonitorSnapshot, MonitorSourceKind, Settings, Target } from '@/domain/types';

/**
 * Everything a page needs to render availability, supplied by `AppShell` through
 * the router's outlet context. Routing through the outlet keeps polling state
 * alive across navigation instead of restarting it on every route change.
 */
export interface MonitorContextValue {
  targets: Target[];
  resolver: TargetResolver;
  snapshot: MonitorSnapshot | null;
  error: string | null;
  isLoading: boolean;
  sourceKind: MonitorSourceKind;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  refresh: () => void;
  addTarget: (target: Target) => void;
  updateTarget: (target: Target) => void;
  removeTarget: (id: string) => void;
  replaceAll: (targets: Target[]) => void;
  resetToSeed: () => void;
}

export function useMonitor(): MonitorContextValue {
  return useOutletContext<MonitorContextValue>();
}
