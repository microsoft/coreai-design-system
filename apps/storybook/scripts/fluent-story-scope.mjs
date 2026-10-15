// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'node:fs';
import path from 'node:path';

export const excludedFluentPackages = new Set([
  'react-headless-components-preview',
  'react-nav',
  'react-provider',
  'react-divider',
  'react-aria',
  'react-motion',
  'react-motion-components-preview',
  'react-positioning',
  'react-migration-v0-v9',
  'react-migration-v8-v9',
  'react-components',
  'eslint-plugin-react-components',
  'babel-preset-global-context',
  'babel-preset-storybook-full-source',
  'global-context',
  'keyboard-keys',
  'priority-overflow',
  'react-conformance-griffel',
  'react-context-selector',
  'react-jsx-runtime',
  'react-shared-contexts',
  'react-storybook-addon',
  'react-storybook-addon-export-to-sandbox',
  'react-utilities',
  'react-utilities-compat',
  'theme-designer',
  'recipes',
  'deprecated',
  'component-selector-preview',
]);

export function includedFluentPackages(root) {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        !excludedFluentPackages.has(entry.name) &&
        fs.existsSync(path.join(root, entry.name, 'stories', 'src')),
    )
    .map((entry) => entry.name)
    .sort();
}
