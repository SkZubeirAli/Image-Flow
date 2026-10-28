// Run with: node --test tests/
// This file tests plain-JS logic ported inline so it has zero build
// dependency; src/utils/format.ts contains the authoritative TypeScript
// version used by the React UI (kept in sync with the assertions below).
import test from 'node:test';
import assert from 'node:assert/strict';

function formatBytes(bytes) {
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

function compressionPercent(originalBytes, outputBytes) {
  if (!originalBytes) return 0;
  return Math.max(0, Math.round((1 - outputBytes / originalBytes) * 1000) / 10);
}

test('formatBytes renders MB for large sizes', () => {
  assert.equal(formatBytes(4.8 * 1024 * 1024), '4.8 MB');
});

test('formatBytes renders KB for small sizes', () => {
  assert.equal(formatBytes(780 * 1024), '780.0 KB');
});

test('compressionPercent computes reduction correctly', () => {
  const originalBytes = 4.8 * 1024 * 1024;
  const outputBytes = 780 * 1024;
  assert.equal(compressionPercent(originalBytes, outputBytes), 84.1);
});

test('compressionPercent never goes negative', () => {
  assert.equal(compressionPercent(100, 150), 0);
});
