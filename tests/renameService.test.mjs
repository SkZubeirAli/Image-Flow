// Run with: npm run build && node --test tests/
// (uses the compiled output in dist-electron so no extra test tooling is required)
import test from 'node:test';
import assert from 'node:assert/strict';
import { computeOutputBaseName, dedupeBaseNames } from '../dist-electron/services/renameService.js';

test('keep mode preserves the original base name', () => {
  const name = computeOutputBaseName('IMG_001.jpg', 0, {
    mode: 'keep', replaceWith: '', prefix: '', suffix: '',
    sequenceStart: 1, sequencePadding: 3, findText: '', replaceText: ''
  });
  assert.equal(name, 'IMG_001');
});

test('prefix + suffix + sequence numbering', () => {
  const rename = {
    mode: 'sequence', replaceWith: 'portfolio_', prefix: '', suffix: '',
    sequenceStart: 1, sequencePadding: 3, findText: '', replaceText: ''
  };
  assert.equal(computeOutputBaseName('a.jpg', 0, rename), 'portfolio_001');
  assert.equal(computeOutputBaseName('b.jpg', 1, rename), 'portfolio_002');
});

test('find and replace', () => {
  const rename = {
    mode: 'keep', replaceWith: '', prefix: '', suffix: '',
    sequenceStart: 1, sequencePadding: 3, findText: 'IMG_', replaceText: 'Product_'
  };
  assert.equal(computeOutputBaseName('IMG_001.jpg', 0, rename), 'Product_001');
});

test('duplicate base names are deduped safely', () => {
  const result = dedupeBaseNames(['photo', 'photo', 'photo']);
  assert.deepEqual(result, ['photo', 'photo_1', 'photo_2']);
});
