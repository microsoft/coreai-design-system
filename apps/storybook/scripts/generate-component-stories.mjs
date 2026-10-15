// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { createStoryInventory } from './story-inventory.mjs';
import { readStoryDescriptions, descriptionComment } from './story-descriptions.mjs';

export const appRoot = fileURLToPath(new URL('../', import.meta.url));
export const generatedRoot = path.join(appRoot, '.storybook', '.cache', 'component-stories');

export function generatedStoryIndexer(indexer) {
  return {
    ...indexer,
    async createIndex(file, options) {
      const entries = await indexer.createIndex(file, options);
      if (path.dirname(path.resolve(file)) !== generatedRoot) return entries;
      const inventory = JSON.parse(
        await fs.readFile(path.join(generatedRoot, 'inventory.json'), 'utf8'),
      );
      const component = inventory.components.find(
        (item) => `${item.id}.stories.js` === path.basename(file),
      );
      if (!component) throw new Error(`Generated component missing from inventory: ${file}`);
      return entries.map((entry) => {
        const story = component.stories.find((item) => item.exportName === entry.exportName);
        if (!story)
          throw new Error(`Generated story missing from inventory: ${file}: ${entry.exportName}`);
        // Storybook's parser ignores explicit names on aliased story exports.
        return { ...entry, name: story.name };
      });
    },
  };
}

function importPath(from, target) {
  const relative = path.relative(from, target).split(path.sep).join('/');
  return relative.startsWith('.') ? relative : `./${relative}`;
}

function componentBindings(component) {
  const sources = [...component.sources].reverse();
  const owner = sources.find((source) => source.metadata.component);
  if (!owner) return { imports: [], properties: [] };
  const fields = ['component', 'subcomponents'].map((key) => {
    const source = sources.find((item) => item.metadata[key]);
    return { key, source, expression: source?.metadata[key] };
  });
  const imports = new Map();
  for (const { expression, source } of fields) {
    if (!expression) continue;
    const ast = ts.createSourceFile(
      'metadata.ts',
      `const value = ${expression};`,
      ts.ScriptTarget.Latest,
      true,
    );
    const names = new Set();
    function collect(node) {
      if (ts.isIdentifier(node)) names.add(node.text);
      ts.forEachChild(node, collect);
    }
    collect(ast);
    for (const item of source.imports) {
      const parsed = ts.createSourceFile('import.ts', item.source, ts.ScriptTarget.Latest, true);
      const clause = parsed.statements[0].importClause;
      if (!clause?.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue;
      for (const binding of clause.namedBindings.elements) {
        if (!names.has(binding.name.text)) continue;
        if (
          !['@fluentui/react-components', '@coreai-ds/react-components'].includes(item.specifier)
        ) {
          throw new Error(
            `Unsupported component metadata import in ${source.sourceFile}: ${item.specifier}`,
          );
        }
        const imported = binding.propertyName
          ? `${binding.propertyName.text} as ${binding.name.text}`
          : binding.name.text;
        if (imports.has(binding.name.text) && imports.get(binding.name.text) !== imported) {
          throw new Error(
            `Conflicting component metadata import ${binding.name.text} in ${component.id}`,
          );
        }
        imports.set(binding.name.text, imported);
      }
    }
  }
  if (!imports.has(owner.metadata.component)) {
    throw new Error(
      `Cannot resolve component metadata for ${component.id}: ${owner.metadata.component}`,
    );
  }
  return {
    imports: [`import { ${[...imports.values()].join(', ')} } from '@coreai-ds/react-components';`],
    names: [...imports.keys()],
    properties: fields
      .filter(({ expression }) => expression)
      .map(({ key, expression: value }) => {
        const ast = ts.createSourceFile(
          'expression.ts',
          `const expression = ${value};`,
          ts.ScriptTarget.Latest,
          true,
        );
        const expression = ast.statements[0].declarationList.declarations[0].initializer;
        return `${key}: ${ts.createPrinter().printNode(ts.EmitHint.Expression, expression, ast)}`;
      }),
  };
}

export function generateComponentIndex(
  component,
  { root = appRoot, outputRoot = generatedRoot, documentation } = {},
) {
  const bindings = componentBindings(component);
  const lines = [
    '// Generated from the shared source inventory; do not edit.',
    ...bindings.imports,
    `import { componentMetadata, storyWithMetadata } from ${JSON.stringify(importPath(outputRoot, path.join(root, 'scripts', 'story-metadata.mjs')))};`,
  ];
  const sourceNames = new Map();
  component.sources.forEach((source, index) => {
    const name = `source${index}`;
    sourceNames.set(source.sourceFile, name);
    lines.push(
      `import ${name} from ${JSON.stringify(importPath(outputRoot, path.join(root, source.sourceFile)))};`,
    );
  });
  component.stories.forEach((story, index) => {
    lines.push(
      `import { ${story.exportName} as story${index} } from ${JSON.stringify(importPath(outputRoot, path.join(root, story.sourceFile)))};`,
    );
  });
  if (documentation) lines.push(descriptionComment(documentation));
  lines.push(
    `export default { ...componentMetadata([${[...sourceNames.values()].join(', ')}]), title: ${JSON.stringify(component.title)}, id: ${JSON.stringify(component.id)}, ${bindings.properties.join(', ')} };`,
  );
  component.stories.forEach((story, index) => {
    const conflict = bindings.names?.includes(story.exportName);
    const name = conflict ? `__story${index}` : story.exportName;
    lines.push(
      `${conflict ? '' : 'export '}const ${name} = { ...storyWithMetadata(${sourceNames.get(story.sourceFile)}, story${index}, ${JSON.stringify(story.id)}), name: ${JSON.stringify(story.name)} };`,
    );
    if (conflict) lines.push(`export { ${name} as ${story.exportName} };`);
  });
  return `${lines.join('\n')}\n`;
}

export async function generateComponentStories({
  root = appRoot,
  outputRoot = generatedRoot,
} = {}) {
  const inventory = await createStoryInventory({ root });
  const outputs = await Promise.all(
    inventory.components.map(async (component) => {
      const documentation = { description: '', summary: '' };
      for (const source of [...component.sources].reverse()) {
        const docs = await readStoryDescriptions(path.join(root, source.sourceFile));
        documentation.description ||= docs.description;
        documentation.summary ||= docs.summary;
        if (documentation.description && documentation.summary) break;
      }
      return [
        `${component.id}.stories.js`,
        generateComponentIndex(component, { root, outputRoot, documentation }),
      ];
    }),
  );
  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(
    path.join(outputRoot, 'tsconfig.json'),
    `${JSON.stringify(
      {
        extends: importPath(outputRoot, path.join(root, 'tsconfig.json')),
        include: ['*.stories.js'],
      },
      null,
      2,
    )}\n`,
  );
  const expected = new Set(outputs.map(([name]) => name));
  for (const file of await fs.readdir(outputRoot)) {
    if (file.endsWith('.stories.js') && !expected.has(file)) {
      await fs.unlink(path.join(outputRoot, file));
    }
  }
  for (const [file, content] of outputs) await fs.writeFile(path.join(outputRoot, file), content);
  await fs.writeFile(
    path.join(outputRoot, 'inventory.json'),
    `${JSON.stringify(inventory, null, 2)}\n`,
  );
  return inventory;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const inventory = await generateComponentStories();
  console.log(`Generated ${inventory.components.length} component indexes in ${generatedRoot}`);
}
