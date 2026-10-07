import { useCallback, useState } from 'react';

import { DEFAULT_SETTINGS, type Settings } from '@/domain/types';

const SETTINGS_KEY = 'monitoring.settings';
const SECRET_KEY = 'monitoring.secret';

/** What the deployment baked in ('' = simulated, '/' = same-origin proxy). */
const DEFAULT_BASE_URL = import.meta.env.VITE_DEFAULT_BASE_URL ?? '';

function readSettings(): Settings {
  let stored: Partial<Settings> = {};

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) stored = JSON.parse(raw) as Partial<Settings>;
  } catch {
    stored = {};
  }

  // The password is deliberately kept out of localStorage: it lives in
  // sessionStorage so it dies with the tab and never lands on disk.
  let password = '';
  try {
    password = sessionStorage.getItem(SECRET_KEY) ?? '';
  } catch {
    password = '';
  }

  return { ...DEFAULT_SETTINGS, nagiosBaseUrl: DEFAULT_BASE_URL, ...stored, password };
}

export interface UseSettingsResult {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<Settings>(readSettings);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next: Settings = { ...current, ...patch };

      try {
        // The password is intentionally excluded — see SECRET_KEY handling below.
        const persistable = {
          nagiosBaseUrl: next.nagiosBaseUrl,
          username: next.username,
          pollSeconds: next.pollSeconds,
          mockScenario: next.mockScenario,
        };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(persistable));
      } catch {
        // Storage unavailable (private mode, quota). Settings stay in memory.
      }

      if (patch.password !== undefined) {
        try {
          if (next.password.length > 0) {
            sessionStorage.setItem(SECRET_KEY, next.password);
          } else {
            sessionStorage.removeItem(SECRET_KEY);
          }
        } catch {
          // As above: in-memory only.
        }
      }

      return next;
    });
  }, []);

  return { settings, updateSettings };
}
