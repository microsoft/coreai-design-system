// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import test from 'node:test';
import { addLicenseHeader, getLicenseHeaderStatus, isEligibleSource } from './license-headers.mjs';

const slashHeader =
  '// Copyright (c) Microsoft Corporation.\n// Licensed under the MIT license.\n\n';
const hashHeader = '# Copyright (c) Microsoft Corporation.\n# Licensed under the MIT license.\n\n';
const blockHeader =
  '/*\n * Copyright (c) Microsoft Corporation.\n * Licensed under the MIT license.\n */\n\n';
const htmlHeader =
  '<!--\n  Copyright (c) Microsoft Corporation.\n  Licensed under the MIT license.\n-->\n\n';

test('selects supported source files and excludes external or generated paths', () => {
  for (const filename of [
    'src/index.ts',
    'src/types.d.mts',
    'src/view.tsx',
    'scripts/build.mjs',
    'scripts/build.sh',
    'styles/app.css',
    'infra/main.bicep',
    'infra/main.bicepparam',
  ]) {
    assert.equal(isEligibleSource(filename), true, filename);
  }
  for (const filename of [
    'README.md',
    'package.json',
    'dist/index.js',
    'apps/docsite/src/assets/vendor/library.js',
    'apps/storybook/fluent-stories/Button.stories.tsx',
  ]) {
    assert.equal(isEligibleSource(filename), false, filename);
  }
});

test('adds and recognizes JavaScript license headers', () => {
  const source = 'export const value = 1;\n';
  const fixed = addLicenseHeader('src/value.ts', source);
  assert.equal(fixed, `${slashHeader}${source}`);
  assert.equal(getLicenseHeaderStatus('src/value.ts', fixed), 'valid');
  assert.equal(addLicenseHeader('src/value.ts', fixed), fixed);
});

test('preserves shebangs and CRLF newlines', () => {
  const source = '#!/usr/bin/env node\r\nconsole.log("ok");\r\n';
  const fixed = addLicenseHeader('scripts/example.mjs', source);
  assert.equal(
    fixed,
    `#!/usr/bin/env node\r\n${slashHeader.replaceAll('\n', '\r\n')}console.log("ok");\r\n`,
  );
  assert.equal(getLicenseHeaderStatus('scripts/example.mjs', fixed), 'valid');
});

test('uses hash comments after shell shebangs', () => {
  const source = '#!/usr/bin/env bash\nset -euo pipefail\n';
  const fixed = addLicenseHeader('scripts/example.sh', source);
  assert.equal(fixed, `#!/usr/bin/env bash\n${hashHeader}set -euo pipefail\n`);
  assert.equal(getLicenseHeaderStatus('scripts/example.sh', fixed), 'valid');
});

test('uses slash comments for TypeScript modules and Bicep files', () => {
  for (const filename of ['src/types.d.mts', 'infra/main.bicep', 'infra/main.bicepparam']) {
    const source = 'export const value = 1;\n';
    const fixed = addLicenseHeader(filename, source);
    assert.equal(fixed, `${slashHeader}${source}`, filename);
    assert.equal(getLicenseHeaderStatus(filename, fixed), 'valid', filename);
  }
});

test('uses block comments for stylesheets', () => {
  const source = ':root { color: black; }\n';
  const fixed = addLicenseHeader('styles/app.css', source);
  assert.equal(fixed, `${blockHeader}${source}`);
  assert.equal(getLicenseHeaderStatus('styles/app.css', fixed), 'valid');
});

test('keeps the HTML doctype first', () => {
  const source = '<!doctype html>\n<html lang="en"></html>\n';
  const fixed = addLicenseHeader('index.html', source);
  assert.equal(fixed, `<!doctype html>\n${htmlHeader}<html lang="en"></html>\n`);
  assert.equal(getLicenseHeaderStatus('index.html', fixed), 'valid');
});

test('reports malformed headers instead of duplicating them', () => {
  const source = '// Copyright (c) Microsoft Corporation.\nexport const value = 1;\n';
  assert.equal(getLicenseHeaderStatus('src/value.ts', source), 'malformed');
  assert.throws(() => addLicenseHeader('src/value.ts', source), /malformed or misplaced/);
});
