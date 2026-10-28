import path from 'node:path';
import { RenameSettings } from '../types';

/**
 * Computes the output base filename (without extension) for a single item
 * at a given index within the whole batch. Extension is applied separately
 * once the output format is known, since format conversion can change it.
 */
export function computeOutputBaseName(
  originalFileName: string,
  index: number,
  rename: RenameSettings
): string {
  const originalExt = path.extname(originalFileName);
  let base = originalFileName.slice(0, originalFileName.length - originalExt.length);

  if (rename.findText) {
    base = base.split(rename.findText).join(rename.replaceText ?? '');
  }

  switch (rename.mode) {
    case 'keep':
      return base;
    case 'replace':
      return rename.replaceWith || base;
    case 'prefix':
      return `${rename.prefix}${base}`;
    case 'suffix':
      return `${base}${rename.suffix}`;
    case 'sequence': {
      const num = rename.sequenceStart + index;
      const padded = String(num).padStart(rename.sequencePadding, '0');
      const stem = rename.replaceWith || base;
      return `${stem}${padded}`;
    }
    default:
      return base;
  }
}

/** Ensures uniqueness of base names within a single batch before hitting disk. */
export function dedupeBaseNames(baseNames: string[]): string[] {
  const seen = new Map<string, number>();
  return baseNames.map((name) => {
    const count = seen.get(name) ?? 0;
    seen.set(name, count + 1);
    return count === 0 ? name : `${name}_${count}`;
  });
}
