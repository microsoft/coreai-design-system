// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build, normalizePath } from 'vite';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageEntry = normalizePath(path.join(packageRoot, 'dist', 'index.js'));

const bundleExport = async (exportName) => {
  const virtualEntry = `virtual:coreai-${exportName.toLowerCase()}`;
  const resolvedVirtualEntry = `\0${virtualEntry}`;
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    plugins: [
      {
        name: 'coreai-tree-shaking-fixture',
        enforce: 'pre',
        resolveId(id) {
          if (id === virtualEntry) {
            return resolvedVirtualEntry;
          }

          if (id === '@coreai-ds/react-components') {
            return { id: packageEntry, external: false };
          }
        },
        load(id) {
          if (id === resolvedVirtualEntry) {
            return `export { ${exportName} } from '@coreai-ds/react-components';`;
          }
        },
      },
    ],
    build: {
      minify: false,
      rollupOptions: {
        input: virtualEntry,
        preserveEntrySignatures: 'strict',
        external: (id) =>
          id === 'react' ||
          id.startsWith('react/') ||
          id === 'react-dom' ||
          id.startsWith('react-dom/'),
      },
      write: false,
    },
  });

  const outputs = Array.isArray(result) ? result : [result];
  return new Set(
    outputs.flatMap(({ output }) =>
      output.flatMap((item) => (item.type === 'chunk' ? Object.keys(item.modules) : [])),
    ),
  );
};

const normalizeModuleId = (moduleId) => moduleId.replaceAll('\\', '/');
const includesModule = (moduleIds, fragment) =>
  [...moduleIds].some((moduleId) => normalizeModuleId(moduleId).includes(fragment));

const buttonModules = await bundleExport('Button');
const forbiddenButtonModules = [
  '/@fluentui/react-swatch-picker/',
  '/@fluentui/react-tag-picker/',
  '/@fluentui/react-tags/',
  '/@fluentui/react-textarea/',
  '/dist/components/CopyButton.js',
  '/dist/components/DateTimePicker.js',
  '/dist/components/SwatchPicker.js',
  '/dist/components/TagPicker.js',
  '/dist/components/Textarea.js',
];

for (const moduleFragment of forbiddenButtonModules) {
  assert.equal(
    includesModule(buttonModules, moduleFragment),
    false,
    `Button bundle unexpectedly includes ${moduleFragment}`,
  );
}

const tagPickerModules = await bundleExport('TagPicker');
const tagPickerModuleSummary = [...tagPickerModules]
  .map(normalizeModuleId)
  .filter((moduleId) => moduleId.toLowerCase().includes('tag'))
  .join('\n');
assert.equal(
  includesModule(tagPickerModules, '/dist/components/TagPicker.js'),
  true,
  `TagPicker bundle does not include the CoreAI TagPicker wrapper:\n${tagPickerModuleSummary}`,
);
assert.equal(
  includesModule(tagPickerModules, '/@fluentui/react-tag-picker/'),
  true,
  'TagPicker bundle does not include Fluent TagPicker',
);
