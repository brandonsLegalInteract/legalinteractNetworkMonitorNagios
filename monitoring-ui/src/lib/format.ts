const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Compact duration, e.g. `3d 4h`, `12m`, `45s`. */
export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '—';

  const seconds = Math.floor(totalSeconds);
  if (seconds < MINUTE) return `${String(seconds)}s`;

  const days = Math.floor(seconds / DAY);
  const hours = Math.floor((seconds % DAY) / HOUR);
  const minutes = Math.floor((seconds % HOUR) / MINUTE);

  if (days > 0) return hours > 0 ? `${String(days)}d ${String(hours)}h` : `${String(days)}d`;
  if (hours > 0) return minutes > 0 ? `${String(hours)}h ${String(minutes)}m` : `${String(hours)}h`;
  return `${String(minutes)}m`;
}

/** Relative time from an epoch-seconds timestamp, e.g. `4m ago`. */
export function formatRelativeTime(epochSeconds: number, nowMs: number = Date.now()): string {
  if (!Number.isFinite(epochSeconds) || epochSeconds <= 0) return 'never';

  const deltaSeconds = Math.floor(nowMs / 1000) - Math.floor(epochSeconds);
  if (deltaSeconds < 0) {
    return `in ${formatDuration(Math.abs(deltaSeconds))}`;
  }
  if (deltaSeconds < 5) return 'just now';

  return `${formatDuration(deltaSeconds)} ago`;
}

export function formatClockTime(epochSeconds: number): string {
  if (!Number.isFinite(epochSeconds) || epochSeconds <= 0) return '—';

  return new Date(epochSeconds * 1000).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
