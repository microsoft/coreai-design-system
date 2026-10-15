// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { publicMarkdown } from './public-markdown.mjs';

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

function unwrap(node) {
  while (
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isParenthesizedExpression(node)
  )
    node = node.expression;
  return node;
}

function declaredNames(node) {
  if (ts.isVariableStatement(node)) {
    return node.declarationList.declarations.map((item) => {
      if (!ts.isIdentifier(item.name))
        throw new Error('Destructured module declarations require explicit source support');
      return item.name.text;
    });
  }
  return node.name && ts.isIdentifier(node.name) ? [node.name.text] : [];
}

function references(node) {
  const result = new Set();
  function visit(item) {
    if (ts.isIdentifier(item)) result.add(item.text);
    ts.forEachChild(item, visit);
  }
  visit(node);
  return result;
}

function adaptFluentPartialProps(node, bindings) {
  const transformed = ts.transform(node, [
    (context) => {
      const visit = (item) => {
        if (
          ts.isTypeReferenceNode(item) &&
          ts.isIdentifier(item.typeName) &&
          item.typeName.text === 'Partial' &&
          item.typeArguments?.length === 1
        ) {
          const argument = item.typeArguments[0];
          const binding =
            ts.isTypeReferenceNode(argument) && ts.isIdentifier(argument.typeName)
              ? bindings.get(argument.typeName.text)
              : undefined;
          if (
            binding?.statement.moduleSpecifier.text === '@fluentui/react-components' &&
            ['ComboboxProps', 'DropdownProps'].includes(binding.exported)
          ) {
            const omitted = ts.factory.createTypeReferenceNode('Omit', [
              argument,
              ts.factory.createUnionTypeNode(
                ['label', 'dynamicWidth'].map((name) =>
                  ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(name)),
                ),
              ),
            ]);
            return ts.factory.updateTypeReferenceNode(item, item.typeName, [omitted]);
          }
        }
        return ts.visitEachChild(item, visit, context);
      };
      return (root) => ts.visitNode(root, visit);
    },
  ]);
  try {
    return transformed.transformed[0];
  } finally {
    transformed.dispose();
  }
}

async function resolveRelative(file, specifier) {
  const target = path.resolve(path.dirname(file), specifier);
  for (const candidate of [
    target,
    `${target}.tsx`,
    `${target}.ts`,
    path.join(target, 'index.ts'),
    path.join(target, 'index.tsx'),
  ]) {
    try {
      if ((await fs.stat(candidate)).isFile()) return candidate;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  throw new Error(`Cannot resolve example dependency ${specifier} from ${file}`);
}

export async function extractStorySource(story, { root, cache = new Map() }) {
  const imports = new Map();
  const definitions = [];
  const emitted = new Map();
  const active = new Set();
  const requirements = new Set();
  const descriptions = [];

  async function moduleFile(file) {
    if (!cache.has(file)) {
      const source = await fs.readFile(file, 'utf8');
      const ast = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      if (ast.parseDiagnostics.length) throw new Error(`Cannot parse example source: ${file}`);
      cache.set(file, { source, ast });
    }
    return cache.get(file);
  }

  function addDefinition(name, file, text) {
    const previous = emitted.get(name);
    if (previous && previous.file !== file) {
      throw new Error(
        `Example dependency name collision "${name}" in ${previous.file} and ${file}`,
      );
    }
    if (!previous) {
      emitted.set(name, { file, text });
      definitions.push(text);
    }
  }

  async function select(file, exportName, isStory = false) {
    const key = `${file}#${exportName}`;
    if (active.has(key)) throw new Error(`Circular example dependency: ${key}`);
    if (emitted.has(exportName) && emitted.get(exportName).file === file) return;
    active.add(key);
    try {
      const { ast } = await moduleFile(file);
      const declarations = new Map();
      const bindings = new Map();
      for (const statement of ast.statements) {
        if (ts.isImportDeclaration(statement)) {
          const clause = statement.importClause;
          if (clause?.name)
            bindings.set(clause.name.text, { statement, exported: 'default', kind: 'default' });
          if (clause?.namedBindings) {
            if (ts.isNamespaceImport(clause.namedBindings)) {
              bindings.set(clause.namedBindings.name.text, {
                statement,
                exported: '*',
                kind: 'namespace',
              });
            } else {
              for (const item of clause.namedBindings.elements) {
                bindings.set(item.name.text, {
                  statement,
                  exported: item.propertyName?.text ?? item.name.text,
                  kind: 'named',
                  typeOnly: item.isTypeOnly,
                });
              }
            }
          }
        } else {
          for (const name of declaredNames(statement)) declarations.set(name, statement);
        }
      }
      let declaration = declarations.get(exportName);
      if (!declaration) {
        const reexport = ast.statements.find(
          (item) =>
            ts.isExportDeclaration(item) &&
            item.exportClause &&
            ts.isNamedExports(item.exportClause) &&
            item.exportClause.elements.some((entry) => entry.name.text === exportName),
        );
        if (reexport?.moduleSpecifier) {
          const entry = reexport.exportClause.elements.find(
            (item) => item.name.text === exportName,
          );
          await select(
            await resolveRelative(file, reexport.moduleSpecifier.text),
            entry.propertyName?.text ?? entry.name.text,
            isStory,
          );
          return;
        }
        throw new Error(`Missing example declaration ${exportName} in ${file}`);
      }
      let output = declaration;
      const argsAssignments = isStory
        ? ast.statements.filter(
            (item) =>
              ts.isExpressionStatement(item) &&
              ts.isBinaryExpression(item.expression) &&
              item.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
              ts.isPropertyAccessExpression(item.expression.left) &&
              ts.isIdentifier(item.expression.left.expression) &&
              item.expression.left.expression.text === exportName &&
              item.expression.left.name.text === 'args',
          )
        : [];
      if (isStory && ts.isVariableStatement(declaration)) {
        const variable = declaration.declarationList.declarations.find(
          (item) => item.name.text === exportName,
        );
        const initializer = unwrap(variable.initializer);
        if (ts.isObjectLiteralExpression(initializer)) {
          const render = initializer.properties.find(
            (property) =>
              ts.isPropertyAssignment(property) && property.name.getText(ast) === 'render',
          );
          if (!render) throw new Error(`Story ${exportName} in ${file} has no explicit render`);
          output = ts.factory.createVariableStatement(
            [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            ts.factory.createVariableDeclarationList(
              [
                ts.factory.createVariableDeclaration(
                  exportName,
                  undefined,
                  undefined,
                  render.initializer,
                ),
              ],
              ts.NodeFlags.Const,
            ),
          );
        }
      }
      if (story.origin === 'fluent') {
        output = adaptFluentPartialProps(output, bindings);
      }
      const refs = references(output);
      for (const assignment of argsAssignments) {
        for (const name of references(assignment.expression.right)) refs.add(name);
      }
      for (const name of declaredNames(declaration)) refs.delete(name);
      for (const name of refs) {
        if (declarations.has(name)) {
          await select(file, name);
        } else if (bindings.has(name)) {
          const binding = bindings.get(name);
          const specifier = binding.statement.moduleSpecifier.text;
          if (specifier.startsWith('.')) {
            const target = await resolveRelative(file, specifier);
            if (target.endsWith('.md')) {
              const content = publicMarkdown(await fs.readFile(target, 'utf8'), target);
              descriptions.push(content);
              addDefinition(name, file, `const ${name} = ${JSON.stringify(content)};`);
            } else {
              if (binding.kind !== 'named')
                throw new Error(
                  `Unsupported relative ${binding.kind} dependency ${name} in ${file}`,
                );
              await select(target, binding.exported);
              if (binding.exported !== name)
                addDefinition(name, file, `const ${name} = ${binding.exported};`);
            }
          } else {
            const rewritten =
              specifier === '@fluentui/react-components'
                ? '@coreai-ds/react-components'
                : specifier;
            if (rewritten.startsWith('@storybook/') || rewritten.startsWith('storybook')) {
              throw new Error(
                `Storybook-only dependency ${rewritten} leaks into example ${story.id}`,
              );
            }
            requirements.add(rewritten);
            const typeOnly = binding.typeOnly || binding.statement.importClause.isTypeOnly;
            const importText =
              binding.kind === 'namespace'
                ? `import ${typeOnly ? 'type ' : ''}* as ${name} from ${JSON.stringify(rewritten)};`
                : binding.kind === 'default'
                  ? `import ${typeOnly ? 'type ' : ''}${name} from ${JSON.stringify(rewritten)};`
                  : `import ${typeOnly ? 'type ' : ''}{ ${binding.exported}${binding.exported !== name ? ` as ${name}` : ''} } from ${JSON.stringify(rewritten)};`;
            const previous = imports.get(name);
            if (previous && previous !== importText)
              throw new Error(`Conflicting example import ${name}: ${previous} vs ${importText}`);
            imports.set(name, importText);
          }
        }
      }
      // Namespace React is needed by the classic JSX transform even without explicit references.
      if (isStory && bindings.has('React')) {
        const binding = bindings.get('React');
        if (binding.statement.moduleSpecifier.text === 'react') {
          imports.set('React', "import * as React from 'react';");
          requirements.add('react');
        }
      }
      const modifiers = output.modifiers?.filter(
        (item) => ![ts.SyntaxKind.ExportKeyword, ts.SyntaxKind.DefaultKeyword].includes(item.kind),
      );
      if (!isStory) {
        if (ts.isVariableStatement(output))
          output = ts.factory.updateVariableStatement(output, modifiers, output.declarationList);
        else if (ts.isFunctionDeclaration(output))
          output = ts.factory.updateFunctionDeclaration(
            output,
            modifiers,
            output.asteriskToken,
            output.name,
            output.typeParameters,
            output.parameters,
            output.type,
            output.body,
          );
        else if (ts.isTypeAliasDeclaration(output))
          output = ts.factory.updateTypeAliasDeclaration(
            output,
            modifiers,
            output.name,
            output.typeParameters,
            output.type,
          );
        else if (ts.isInterfaceDeclaration(output))
          output = ts.factory.updateInterfaceDeclaration(
            output,
            modifiers,
            output.name,
            output.typeParameters,
            output.heritageClauses,
            output.members,
          );
      }
      addDefinition(exportName, file, printer.printNode(ts.EmitHint.Unspecified, output, ast));
      for (const assignment of argsAssignments) {
        definitions.push(printer.printNode(ts.EmitHint.Unspecified, assignment, ast));
      }
    } finally {
      active.delete(key);
    }
  }

  await select(path.join(root, story.implementationFile), story.implementationExport, true);
  return {
    snippet: `${[...imports.values()].join('\n')}\n\n${definitions.join('\n\n')}\n`,
    requirements: [...requirements].sort(),
    description: descriptions.join('\n\n'),
  };
}
