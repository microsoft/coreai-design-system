// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { iconFilledClassName, iconRegularClassName } from '@fluentui/react-icons';
import { tokens, typographyStyles } from '@fluentui/react-theme';
import { shorthands } from '@griffel/core';
import { format } from 'prettier';
import ts from 'typescript';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const sourceRequire = createRequire(
  path.join(repoRoot, 'packages', 'react-headless-components', 'package.json'),
);
const makeStyles = Symbol('makeStyles');
const makeResetStyles = Symbol('makeResetStyles');
const bindings = {
  '@griffel/react': { makeStyles, makeResetStyles, shorthands },
  '@fluentui/react-components': {
    makeStyles,
    makeResetStyles,
    shorthands,
    tokens,
    typographyStyles,
  },
  '@fluentui/react-theme': { tokens, typographyStyles },
  '@fluentui/react-icons': { iconFilledClassName, iconRegularClassName },
};
const allowedFunctions = new Set(Object.values(shorthands));
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const has = (object, key) => Object.hasOwn(object, key);

class Unsupported extends Error {
  constructor(node, message) {
    super(message);
    this.node = node;
  }
}

function nestedSelector(selector) {
  const parts = [];
  let start = 0;
  let depth = 0;
  let quote = '';
  for (let index = 0; index < selector.length; index += 1) {
    const char = selector[index];
    if (char === '\\') {
      index += 1;
    } else if (quote) {
      if (char === quote) quote = '';
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '(' || char === '[') {
      depth += 1;
    } else if (char === ')' || char === ']') {
      depth -= 1;
    } else if (char === ',' && depth === 0) {
      parts.push(selector.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(selector.slice(start));
  return parts
    .map((part) => {
      const trimmed = part.trim().replace(/\.fui-[\w-]+/g, (name) => `:global(${name})`);
      if (!trimmed) throw new Error(`Empty selector in ${selector}`);
      return trimmed.includes('&') ? trimmed : `&${trimmed.startsWith(':') ? '' : ' '}${trimmed}`;
    })
    .join(', ');
}

export function convertStyleSource(source, { component, filename = 'styles.ts' } = {}) {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(component ?? '')) {
    throw new Error('Provide a PascalCase --component, such as Button or Input.');
  }
  const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  if (ast.parseDiagnostics.length) {
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(ast.parseDiagnostics, {
        getCurrentDirectory: () => repoRoot,
        getCanonicalFileName: (name) => name,
        getNewLine: () => '\n',
      }),
    );
  }
  const imports = new Map();
  const constants = new Map();
  const resolving = new Set();
  const diagnostics = [];
  const blocks = [];

  function diagnose(error, context) {
    if (!(error instanceof Unsupported)) throw error;
    const position = error.node.getStart(ast);
    const existing = diagnostics.find(
      (item) => item.offset === position && item.message === error.message,
    );
    if (existing) {
      if (!existing.contexts.includes(context)) existing.contexts.push(context);
      return;
    }
    const { line, character } = ast.getLineAndCharacterOfPosition(position);
    diagnostics.push({
      offset: position,
      line: line + 1,
      column: character + 1,
      contexts: [context],
      message: error.message,
      expression: error.node.getText(ast),
    });
  }

  function evaluate(node, context) {
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isTypeAssertionExpression(node)
    ) {
      return evaluate(node.expression, context);
    }
    if (ts.isStringLiteralLike(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (ts.isIdentifier(node)) {
      if (imports.has(node.text)) return imports.get(node.text);
      if (constants.has(node.text)) {
        if (resolving.has(node.text)) throw new Unsupported(node, 'Circular constant reference.');
        resolving.add(node.text);
        try {
          return evaluate(constants.get(node.text), context);
        } finally {
          resolving.delete(node.text);
        }
      }
      throw new Unsupported(node, `Unresolved identifier: ${node.text}.`);
    }
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      const target = evaluate(node.expression, context);
      const key = ts.isPropertyAccessExpression(node)
        ? node.name.text
        : evaluate(node.argumentExpression, context);
      if (!isObject(target) || !has(target, key)) {
        throw new Unsupported(node, `Unresolved property: ${String(key)}.`);
      }
      return target[key];
    }
    if (ts.isTemplateExpression(node)) {
      let result = node.head.text;
      for (const span of node.templateSpans) {
        const value = evaluate(span.expression, context);
        if (!['string', 'number'].includes(typeof value)) {
          throw new Unsupported(span.expression, 'Template interpolation is not a scalar.');
        }
        result += value + span.literal.text;
      }
      return result;
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const left = evaluate(node.left, context);
      const right = evaluate(node.right, context);
      if ([left, right].every((value) => ['string', 'number'].includes(typeof value))) {
        return left + right;
      }
    }
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
      const value = evaluate(node.operand, context);
      if (typeof value === 'number') return -value;
    }
    if (ts.isArrayLiteralExpression(node)) {
      return node.elements.map((element) => evaluate(element, context));
    }
    if (ts.isCallExpression(node)) {
      let helper;
      try {
        helper = evaluate(node.expression, context);
      } catch (error) {
        if (!(error instanceof Unsupported)) throw error;
      }
      if (!allowedFunctions.has(helper)) {
        throw new Unsupported(
          node,
          `Unsupported helper: ${node.expression.getText(ast)}. Review its output manually.`,
        );
      }
      return helper(...node.arguments.map((argument) => evaluate(argument, context)));
    }
    if (ts.isObjectLiteralExpression(node)) {
      const result = {};
      for (const property of node.properties) {
        try {
          if (ts.isSpreadAssignment(property)) {
            const value = evaluate(property.expression, context);
            if (!isObject(value))
              throw new Unsupported(property, 'Spread is not a resolved object.');
            Object.assign(result, value);
          } else if (ts.isPropertyAssignment(property)) {
            const key = ts.isComputedPropertyName(property.name)
              ? evaluate(property.name.expression, context)
              : property.name.text;
            if (typeof key !== 'string')
              throw new Unsupported(property.name, 'Non-string property key.');
            Object.defineProperty(result, key, {
              value: evaluate(property.initializer, context),
              enumerable: true,
              configurable: true,
              writable: true,
            });
          } else {
            throw new Unsupported(property, 'Unsupported object member.');
          }
        } catch (error) {
          diagnose(error, context);
        }
      }
      return result;
    }
    throw new Unsupported(node, `Unsupported expression: ${ts.SyntaxKind[node.kind]}.`);
  }

  for (const statement of ast.statements) {
    if (ts.isImportDeclaration(statement)) {
      const moduleBindings = bindings[statement.moduleSpecifier.text];
      const named = statement.importClause?.namedBindings;
      if (moduleBindings && named && ts.isNamedImports(named)) {
        for (const specifier of named.elements) {
          const imported = (specifier.propertyName ?? specifier.name).text;
          if (has(moduleBindings, imported))
            imports.set(specifier.name.text, moduleBindings[imported]);
        }
      }
    }
    if (ts.isVariableStatement(statement) && statement.declarationList.flags & ts.NodeFlags.Const) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.initializer) {
          constants.set(declaration.name.text, declaration.initializer);
        }
      }
    }
  }

  let factories = 0;
  for (const [hook, initializer] of constants) {
    if (!ts.isCallExpression(initializer) || !ts.isIdentifier(initializer.expression)) continue;
    const factory = imports.get(initializer.expression.text);
    if (factory !== makeStyles && factory !== makeResetStyles) continue;
    factories += 1;
    const argument = initializer.arguments[0];
    if (!argument) throw new Error(`${hook} has no style object.`);
    const entries =
      factory === makeResetStyles
        ? [['', argument]]
        : ts.isObjectLiteralExpression(argument)
          ? argument.properties.map((property) => {
              if (!ts.isPropertyAssignment(property) || ts.isComputedPropertyName(property.name)) {
                throw new Error(
                  `${hook}: style-table keys must be literal names in this experiment.`,
                );
              }
              return [property.name.text, property.initializer];
            })
          : (() => {
              throw new Error(`${hook}: makeStyles requires a literal table in this experiment.`);
            })();

    for (const [variant, expression] of entries) {
      const context = variant ? `${hook}.${variant}` : hook;
      const className = `${component}__${hook}${variant ? `__${variant}` : ''}`;
      if (!/^[A-Za-z_][\w-]*$/.test(className))
        throw new Error(`Unsupported draft class name: ${className}`);
      let styles = {};
      try {
        const value = evaluate(expression, context);
        if (!isObject(value)) throw new Unsupported(expression, 'Style block is not an object.');
        styles = value;
      } catch (error) {
        diagnose(error, context);
      }
      blocks.push({
        hook,
        variant: variant || null,
        className,
        line: ast.getLineAndCharacterOfPosition(expression.getStart(ast)).line + 1,
        styles,
        declarations: 0,
      });
    }
  }
  if (!factories) throw new Error('No supported makeStyles/makeResetStyles factories found.');

  function serialize(styles, block, indent) {
    const lines = [];
    for (const [key, value] of Object.entries(styles)) {
      if (isObject(value)) {
        if (!'@:&>+~.#*['.includes(key.trimStart()[0])) {
          throw new Error(`${block.hook}: unsupported nested selector ${key}`);
        }
        if (key.startsWith('@') && !/^@(media|supports|container)\b/.test(key)) {
          throw new Error(`${block.hook}: unsupported at-rule ${key}`);
        }
        lines.push(`${indent}${key.startsWith('@') ? key : nestedSelector(key)} {`);
        lines.push(...serialize(value, block, `${indent}  `));
        lines.push(`${indent}}`);
      } else {
        const property = key.startsWith('--')
          ? key
          : key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/^ms-/, '-ms-');
        for (const item of Array.isArray(value) ? value : [value]) {
          if (!['string', 'number'].includes(typeof item)) {
            throw new Error(`${block.hook}: unsupported CSS value for ${key}`);
          }
          lines.push(`${indent}${property}: ${item};`);
          block.declarations += 1;
        }
      }
    }
    return lines;
  }

  const rules = blocks.map((block) => {
    const incomplete = diagnostics.some((item) =>
      item.contexts.includes(block.variant ? `${block.hook}.${block.variant}` : block.hook),
    );
    return [
      `  /* ${block.hook}${block.variant ? `.${block.variant}` : ''}, source line ${block.line}${incomplete ? '; INCOMPLETE: see report' : ''} */`,
      `  .${block.className} {`,
      ...serialize(block.styles, block, '    '),
      '  }',
    ].join('\n');
  });
  const css = [
    '/*',
    ' * Copyright (c) Microsoft Corporation.',
    ' * Licensed under the MIT license.',
    ' * GENERATED DRAFT ONLY: no state/slot wiring, merge precedence, or RTL conversion.',
    ` * Source: ${filename.replaceAll('*/', '')}`,
    ` * SHA-256: ${createHash('sha256').update(source).digest('hex')}`,
    ' */',
    '',
    '@layer coreai-fluent {',
    rules.join('\n\n'),
    '}',
    '',
  ].join('\n');
  return {
    css,
    blocks,
    report: {
      component,
      source: filename,
      sha256: createHash('sha256').update(source).digest('hex'),
      status: diagnostics.length ? 'partial-draft' : 'draft',
      summary: {
        factories,
        blocks: blocks.length,
        declarations: blocks.reduce((sum, block) => sum + block.declarations, 0),
        unsupportedExpressions: diagnostics.length,
      },
      blocks: blocks.map(({ hook, variant, className, line, declarations }) => ({
        hook,
        variant,
        className,
        line,
        declarations,
      })),
      diagnostics,
      manualReview: [
        'Map source blocks to slots and data-state selectors; source hook names are preserved, not interpreted.',
        'Resolve mergeClasses precedence; applying all draft classes does not reproduce Griffel merging.',
        'Translate legacy focus helpers to native focus-visible; unsupported expressions are omitted, not replaced.',
        'Review physical left/right rules, RTL flipping, and any noflip comments before use.',
        'Review global icon rules and cascade layers; imported icon CSS may be unlayered.',
        'This is declaration transcription, not rendered or accessibility parity.',
      ],
    },
  };
}

export async function readInstalledStyleSource(packageName, component) {
  if (!/^@fluentui\/react-[\w-]+$/.test(packageName ?? ''))
    throw new Error('Provide a Fluent --package.');
  if (!/^[A-Z][A-Za-z0-9]*$/.test(component ?? ''))
    throw new Error('Provide a PascalCase --component.');
  const manifestPath = sourceRequire.resolve(`${packageName}/package.json`);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const relativePath = path.join(
    'lib',
    'components',
    component,
    `use${component}Styles.styles.raw.js`,
  );
  const filename = path.join(path.dirname(manifestPath), relativePath);
  return {
    filename,
    source: await readFile(filename, 'utf8'),
    provenance: {
      package: packageName,
      version: manifest.version,
      path: relativePath.replaceAll('\\', '/'),
    },
  };
}

async function main() {
  const { values } = parseArgs({
    options: {
      package: { type: 'string' },
      component: { type: 'string' },
      'out-dir': { type: 'string' },
      overwrite: { type: 'boolean', default: false },
    },
  });
  if (!values['out-dir']) throw new Error('Provide --out-dir for separate draft artifacts.');
  const input = await readInstalledStyleSource(values.package, values.component);
  const result = convertStyleSource(input.source, {
    component: values.component,
    filename: `${input.provenance.package}@${input.provenance.version}/${input.provenance.path}`,
  });
  result.report.provenance = input.provenance;
  const directory = path.resolve(values['out-dir']);
  await mkdir(directory, { recursive: true });
  const cssPath = path.join(directory, `${values.component}.draft.module.css`);
  const reportPath = path.join(directory, `${values.component}.draft.json`);
  const options = { flag: values.overwrite ? 'w' : 'wx' };
  await writeFile(cssPath, await format(result.css, { parser: 'css' }), options);
  await writeFile(reportPath, `${JSON.stringify(result.report, null, 2)}\n`, options);
  console.log(`${result.report.source}: ${JSON.stringify(result.report.summary)}`);
  console.log(`Draft CSS: ${cssPath}\nReport: ${reportPath}`);
  for (const diagnostic of result.report.diagnostics) {
    console.warn(`REVIEW ${diagnostic.line}:${diagnostic.column}: ${diagnostic.message}`);
  }
  if (result.report.diagnostics.length) process.exitCode = 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
