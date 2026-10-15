// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { loadCsf } from 'storybook/internal/csf-tools';
import { storyNameFromExport, toId } from 'storybook/internal/csf';
import { excludedFluentPackages, includedFluentPackages } from './fluent-story-scope.mjs';

const appRoot = fileURLToPath(new URL('../', import.meta.url));

async function walk(dir, predicate) {
  const files = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(file, predicate)));
    } else if (entry.isFile() && predicate(entry.name)) {
      files.push(file);
    }
  }
  return files.sort();
}

function relative(root, file) {
  return path.relative(root, file).split(path.sep).join('/');
}

async function resolveModule(file, specifier) {
  if (!specifier.startsWith('.')) {
    throw new Error(
      `Story implementation must resolve to a relative source: ${file}: ${specifier}`,
    );
  }
  const base = path.resolve(path.dirname(file), specifier);
  for (const candidate of [
    base,
    `${base}.tsx`,
    `${base}.ts`,
    path.join(base, 'index.tsx'),
    path.join(base, 'index.ts'),
  ]) {
    try {
      if ((await fs.stat(candidate)).isFile()) {
        return candidate;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  throw new Error(`Cannot resolve story implementation: ${file}: ${specifier}`);
}

function unwrap(node) {
  while (
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isParenthesizedExpression(node)
  ) {
    node = node.expression;
  }
  return node;
}

async function parseFile(file, origin, root) {
  const source = await fs.readFile(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (ast.parseDiagnostics.length) throw new Error(`Cannot parse story source: ${file}`);
  const csf = loadCsf(source, {
    fileName: file,
    makeTitle: (title) => {
      if (!title) throw new Error(`Inventory requires an explicit component title: ${file}`);
      return title;
    },
  }).parse();
  if (!csf.meta.title) throw new Error(`Inventory requires an explicit component title: ${file}`);
  const imports = ast.statements.filter(ts.isImportDeclaration).map((node) => ({
    specifier: node.moduleSpecifier.text,
    typeOnly: node.importClause?.isTypeOnly ?? false,
    source: node.getText(ast),
  }));
  const declarations = new Map();
  const exported = new Map();
  for (const node of ast.statements) {
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          declarations.set(declaration.name.text, declaration);
          exported.set(declaration.name.text, node);
        }
      }
    } else if (ts.isFunctionDeclaration(node) && node.name) {
      exported.set(node.name.text, node);
    }
  }
  const defaultExport = ast.statements.find(ts.isExportAssignment);
  if (!defaultExport) throw new Error(`Missing CSF default export: ${file}`);
  let meta = unwrap(defaultExport.expression);
  if (ts.isIdentifier(meta)) meta = unwrap(declarations.get(meta.text)?.initializer ?? meta);
  if (!ts.isObjectLiteralExpression(meta))
    throw new Error(`Unsupported CSF metadata expression: ${file}`);
  const metadata = Object.fromEntries(
    meta.properties.map((property) => [
      ts.isSpreadAssignment(property)
        ? `...${property.expression.getText(ast)}`
        : property.name.getText(ast),
      ts.isPropertyAssignment(property) ? property.initializer.getText(ast) : property.getText(ast),
    ]),
  );
  const sourceFile = relative(root, file);
  const result = {
    origin,
    sourceFile,
    componentId: csf.meta.id ?? toId(csf.meta.title),
    title: csf.meta.title,
    metadata,
    metadataSource: meta.getText(ast),
    documentation: ts.getJSDocCommentsAndTags(defaultExport).map((comment) => comment.getText(ast)),
    imports,
    stories: [],
  };
  for (const [exportName, story] of Object.entries(csf._stories)) {
    let implementationFile = file;
    let implementationExport = exportName;
    const reexport = ast.statements.find(
      (node) =>
        ts.isExportDeclaration(node) &&
        node.exportClause &&
        ts.isNamedExports(node.exportClause) &&
        node.exportClause.elements.some((item) => item.name.text === exportName),
    );
    if (reexport) {
      const item = reexport.exportClause.elements.find((item) => item.name.text === exportName);
      implementationExport = item.propertyName?.text ?? item.name.text;
      if (reexport.moduleSpecifier) {
        implementationFile = await resolveModule(file, reexport.moduleSpecifier.text);
      }
    }
    const implementationSource = await fs.readFile(implementationFile, 'utf8');
    const implementationAst = ts.createSourceFile(
      implementationFile,
      implementationSource,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    let name = story.name;
    if (reexport) {
      const hasMeta = implementationAst.statements.some(ts.isExportAssignment);
      const implementationCsf = loadCsf(
        hasMeta
          ? implementationSource
          : `${implementationSource}\nexport default { title: ${JSON.stringify(csf.meta.title)} };`,
        { fileName: implementationFile, makeTitle: (title) => title },
      ).parse();
      const annotations = implementationCsf._storyAnnotations[implementationExport];
      const explicitName = annotations?.name ?? annotations?.storyName;
      name =
        explicitName?.type === 'StringLiteral'
          ? explicitName.value
          : storyNameFromExport(exportName);
    }
    const dependencies = implementationAst.statements
      .filter(ts.isImportDeclaration)
      .map((node) => ({
        specifier: node.moduleSpecifier.text,
        typeOnly: node.importClause?.isTypeOnly ?? false,
        source: node.getText(implementationAst),
      }));
    const node = exported.get(exportName);
    const annotations = ast.statements
      .filter(
        (statement) =>
          ts.isExpressionStatement(statement) &&
          ts.isBinaryExpression(statement.expression) &&
          statement.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
          ts.isPropertyAccessExpression(statement.expression.left) &&
          ts.isIdentifier(statement.expression.left.expression) &&
          statement.expression.left.expression.text === exportName,
      )
      .map((statement) => statement.getText(ast));
    result.stories.push({
      id: story.id,
      name,
      exportName,
      origin,
      sourceFile,
      implementationFile: relative(root, implementationFile),
      implementationExport,
      declaration: node?.getText(ast),
      documentation: node
        ? ts.getJSDocCommentsAndTags(node).map((comment) => comment.getText(ast))
        : [],
      annotations,
      dependencies,
      tags: story.tags ?? [],
    });
  }
  return result;
}

export async function createStoryInventory({ root = appRoot, localFiles, fluentFiles } = {}) {
  root = path.resolve(root);
  const fluentRoot = path.join(root, 'fluent-stories', 'packages', 'react-components');
  const packages = fluentFiles ? [] : includedFluentPackages(fluentRoot);
  localFiles ??= await walk(path.join(root, 'src', 'stories', 'components'), (name) =>
    /\.stories\.(ts|tsx)$/.test(name),
  );
  fluentFiles ??= (
    await Promise.all(
      packages.map((name) =>
        walk(path.join(fluentRoot, name, 'stories', 'src'), (file) =>
          /^index\.stories\.(ts|tsx)$/.test(file),
        ),
      ),
    )
  ).flat();
  const sources = await Promise.all([
    ...[...fluentFiles].sort().map((file) => parseFile(file, 'fluent', root)),
    ...[...localFiles].sort().map((file) => parseFile(file, 'local', root)),
  ]);
  const components = new Map();
  const storyComponents = new Map();
  for (const source of sources) {
    const id = source.componentId;
    let component = components.get(id);
    if (!component) {
      component = { id, title: source.title, sources: [], stories: new Map() };
      components.set(id, component);
    }
    if (component.title !== source.title) {
      throw new Error(`Component ID collision: ${id}: "${component.title}" and "${source.title}"`);
    }
    component.sources.push(source);
    for (const story of source.stories) {
      const previousComponent = storyComponents.get(story.id);
      if (previousComponent && previousComponent !== id) {
        throw new Error(
          `Story ID collision across components: ${story.id}: ${previousComponent} and ${id}`,
        );
      }
      storyComponents.set(story.id, id);
      const existing = component.stories.get(story.id);
      if (existing?.origin === story.origin) {
        throw new Error(
          `Conflicting ${story.origin} story ${story.id}: ${existing.sourceFile} and ${story.sourceFile}`,
        );
      }
      component.stories.set(story.id, existing ? { ...story, overridden: existing } : story);
    }
  }
  return {
    version: 1,
    scope: {
      local: 'src/stories/components',
      fluentPackages: packages,
      excludedFluentPackages: [...excludedFluentPackages].sort(),
    },
    components: [...components.values()]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((component) => ({
        ...component,
        stories: [...component.stories.values()].sort((a, b) => a.id.localeCompare(b.id)),
      })),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const inventory = await createStoryInventory();
  const output = path.join(appRoot, '.storybook', '.cache', 'story-inventory.json');
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, `${JSON.stringify(inventory, null, 2)}\n`);
  const stories = inventory.components.flatMap((component) => component.stories);
  console.log(
    `Inventoried ${inventory.components.length} components and ${stories.length} stories (${stories.filter((story) => story.origin === 'local').length} local, ${stories.filter((story) => story.origin === 'fluent').length} Fluent, ${stories.filter((story) => story.overridden).length} overrides).\n${output}`,
  );
}
