import { useCallback, useState } from 'react';

import { seedTargets } from '@/domain/targets';
import type { Target } from '@/domain/types';

const TARGETS_KEY = 'monitoring.targets';

function readTargets(): Target[] {
  try {
    const raw = localStorage.getItem(TARGETS_KEY);
    if (!raw) return seedTargets();

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return seedTargets();

    return parsed.filter(isTarget);
  } catch {
    return seedTargets();
  }
}

function isTarget(value: unknown): value is Target {
  if (value === null || typeof value !== 'object') return false;
  const candidate = value as Partial<Target>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.address === 'string' &&
    typeof candidate.check === 'string' &&
    typeof candidate.kind === 'string'
  );
}

function persist(targets: readonly Target[]): void {
  try {
    localStorage.setItem(TARGETS_KEY, JSON.stringify(targets));
  } catch {
    // Storage unavailable; the session keeps working from memory.
  }
}

export interface UseTargetsResult {
  targets: Target[];
  addTarget: (target: Target) => void;
  updateTarget: (target: Target) => void;
  removeTarget: (id: string) => void;
  replaceAll: (targets: Target[]) => void;
  resetToSeed: () => void;
}

export function useTargets(): UseTargetsResult {
  const [targets, setTargets] = useState<Target[]>(readTargets);

  const commit = useCallback((producer: (current: Target[]) => Target[]) => {
    setTargets((current) => {
      const next = producer(current);
      persist(next);
      return next;
    });
  }, []);

  const addTarget = useCallback(
    (target: Target) => commit((current) => [...current, target]),
    [commit],
  );

  const updateTarget = useCallback(
    (target: Target) =>
      commit((current) => current.map((item) => (item.id === target.id ? target : item))),
    [commit],
  );

  const removeTarget = useCallback(
    (id: string) => commit((current) => current.filter((item) => item.id !== id)),
    [commit],
  );

  const replaceAll = useCallback((next: Target[]) => commit(() => next), [commit]);

  const resetToSeed = useCallback(() => commit(() => seedTargets()), [commit]);

  return { targets, addTarget, updateTarget, removeTarget, replaceAll, resetToSeed };
}
