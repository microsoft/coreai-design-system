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
  const chunks = outputs.flatMap(({ output }) => output.filter((item) => item.type === 'chunk'));
  return {
    modules: new Set(chunks.flatMap((chunk) => Object.keys(chunk.modules))),
    imports: new Set(chunks.flatMap((chunk) => chunk.imports)),
  };
};

const normalizeModuleId = (moduleId) => moduleId.replaceAll('\\', '/');
const includesModule = (moduleIds, fragment) =>
  [...moduleIds].some((moduleId) => normalizeModuleId(moduleId).includes(fragment));

const { modules: buttonModules } = await bundleExport('Button');
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

const { modules: tagPickerModules } = await bundleExport('TagPicker');
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

const { modules: illiconModules, imports: illiconImports } = await bundleExport('Illicon');
assert.equal(includesModule(illiconModules, '/dist/components/Illicon.js'), true);
assert.equal(includesModule(illiconModules, '/dist/illicons/dotGridGeometry.js'), true);
assert.equal(
  includesModule(illiconModules, '/dist/illicons/iconToDotGrid.js'),
  false,
  'Rendering saved Illicons must not bundle the browser converter',
);

const { modules: svgExportModules, imports: svgExportImports } = await bundleExport('dotGridToSvg');
assert.equal(includesModule(svgExportModules, '/dist/illicons/dotGridToSvg.js'), true);
assert.equal(
  includesModule(svgExportModules, '/dist/components/Illicon.js'),
  false,
  'Standalone SVG export must not bundle the React renderer',
);
assert.equal(includesModule(svgExportModules, '/dist/illicons/iconToDotGrid.js'), false);

for (const [name, imports] of [
  ['Illicon', illiconImports],
  ['dotGridToSvg', svgExportImports],
]) {
  assert.equal(
    [...imports].some((id) => id.startsWith('react-dom/server')),
    false,
    `${name} must not retain an unused React static serializer import`,
  );
}

const { modules: converterModules } = await bundleExport('iconToDotGrid');
assert.equal(includesModule(converterModules, '/dist/illicons/iconToDotGrid.js'), true);
assert.equal(includesModule(converterModules, '/dist/components/Illicon.js'), false);
