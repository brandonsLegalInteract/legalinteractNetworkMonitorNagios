import { useCallback, useEffect, useRef, useState } from 'react';

import type { MonitorSnapshot, MonitorSource } from '@/domain/types';

export interface MonitorSnapshotState {
  snapshot: MonitorSnapshot | null;
  error: string | null;
  isLoading: boolean;
  refresh: () => void;
}

/**
 * Poll a monitor source on an interval.
 *
 * Guarantees: at most one request is ever in flight (a slow Nagios never queues
 * up behind itself), and the previous request is aborted when the source or
 * interval changes so a stale response can never overwrite a fresh one.
 */
export function useMonitorSnapshot(
  source: MonitorSource,
  pollSeconds: number,
): MonitorSnapshotState {
  const [snapshot, setSnapshot] = useState<MonitorSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const inFlight = useRef(false);

  const refresh = useCallback(() => {
    setRefreshNonce((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const load = async () => {
      if (inFlight.current) return;
      inFlight.current = true;

      try {
        const next = await source.fetchSnapshot(controller.signal);
        if (cancelled) return;
        setSnapshot(next);
        setError(null);
      } catch (caught) {
        if (cancelled) return;
        if (caught instanceof DOMException && caught.name === 'AbortError') return;
        setError(caught instanceof Error ? caught.message : 'The monitoring request failed.');
      } finally {
        inFlight.current = false;
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    const intervalMs = Math.max(2, pollSeconds) * 1000;
    const timer = setInterval(() => {
      void load();
    }, intervalMs);

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(timer);
      inFlight.current = false;
    };
  }, [source, pollSeconds, refreshNonce]);

  return { snapshot, error, isLoading, refresh };
}
