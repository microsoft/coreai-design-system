// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BRAND_STEPS,
  contrastRatio,
  createBrandRamp,
  normalizeHex,
} from '../src/utils/BrandRamp.mjs';

test('normalizeHex accepts short and long hex and rejects other input', () => {
  assert.equal(normalizeHex('#abc'), '#AABBCC');
  assert.equal(normalizeHex('0f6cbd'), '#0F6CBD');
  assert.equal(normalizeHex('#12345'), undefined);
  assert.equal(normalizeHex(null), undefined);
});

test('custom ramps keep CoreAI brand token contrast for any key color', () => {
  for (const color of [
    '#8251EE',
    '#0F6CBD',
    '#FFFF00',
    '#FFF3B0',
    '#00FF66',
    '#101010',
    '#FFFFFF',
  ]) {
    const ramp = createBrandRamp(color);
    assert.deepEqual(Object.keys(ramp).map(Number), BRAND_STEPS);
    // Light theme brand fill (70) and dark theme brand fill (80) carry white text.
    assert.ok(contrastRatio(ramp[70], '#FFFFFF') >= 4.5, `${color} step 70`);
    assert.ok(contrastRatio(ramp[80], '#FFFFFF') >= 4.5, `${color} step 80`);
    // Dark theme brand foreground (110) sits on the dark page background.
    assert.ok(contrastRatio(ramp[110], '#1F1F1F') >= 4.5, `${color} step 110`);
    for (let index = 1; index < BRAND_STEPS.length; index += 1) {
      const darker = ramp[BRAND_STEPS[index - 1]];
      const lighter = ramp[BRAND_STEPS[index]];
      assert.ok(contrastRatio(darker, '#000000') <= contrastRatio(lighter, '#000000'));
    }
  }
});

test('a key color that fits step 80 is used exactly', () => {
  const ramp = createBrandRamp('#0F6CBD');
  assert.equal(ramp[80], '#0F6CBD');
  assert.notEqual(createBrandRamp('#FFFF00')[80], '#FFFF00');
});
