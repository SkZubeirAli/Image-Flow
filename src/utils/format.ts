export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatDimensions(width: number, height: number): string {
  return `${width} \u00d7 ${height}`;
}

export function compressionPercent(originalBytes: number, outputBytes: number): number {
  if (!originalBytes) return 0;
  return Math.max(0, Math.round((1 - outputBytes / originalBytes) * 1000) / 10);
}

export function formatEta(seconds: number | null): string {
  if (seconds === null) return '--';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}
