// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { publicMarkdown } from './public-markdown.mjs';

function unwrap(node) {
  while (
    node &&
    (ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isParenthesizedExpression(node))
  )
    node = node.expression;
  return node;
}

function jsDoc(node) {
  const docs = node ? ts.getJSDocCommentsAndTags(node).filter(ts.isJSDoc) : [];
  const text = (comment) =>
    typeof comment === 'string' ? comment : (comment?.map((part) => part.text).join('') ?? '');
  return {
    description: docs
      .map((doc) => text(doc.comment))
      .filter(Boolean)
      .join('\n\n'),
    summary: docs
      .flatMap((doc) => doc.tags ?? [])
      .filter((tag) => tag.tagName.text === 'summary')
      .map((tag) => text(tag.comment))
      .join('\n'),
  };
}

export async function readStoryDescriptions(file, exportName) {
  const source = await fs.readFile(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declarations = new Map();
  const imports = new Map();
  for (const statement of ast.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const item of statement.declarationList.declarations) {
        if (ts.isIdentifier(item.name))
          declarations.set(item.name.text, { value: item.initializer, statement });
      }
    }
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      declarations.set(statement.name.text, { value: statement, statement });
    }
    if (ts.isImportDeclaration(statement) && statement.importClause?.name) {
      imports.set(statement.importClause.name.text, statement.moduleSpecifier.text);
    }
  }

  async function evaluate(node, active = new Set()) {
    node = unwrap(node);
    if (!node) return undefined;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isIdentifier(node)) {
      if (active.has(node.text)) return undefined;
      const next = new Set([...active, node.text]);
      if (declarations.has(node.text)) return evaluate(declarations.get(node.text).value, next);
      const imported = imports.get(node.text);
      if (imported?.startsWith('.') && imported.endsWith('.md')) {
        const markdownFile = path.resolve(path.dirname(file), imported);
        return publicMarkdown(await fs.readFile(markdownFile, 'utf8'), markdownFile);
      }
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const left = await evaluate(node.left, active);
      const right = await evaluate(node.right, active);
      if (typeof left === 'string' && typeof right === 'string') return left + right;
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'join' &&
      ts.isArrayLiteralExpression(node.expression.expression)
    ) {
      const values = await Promise.all(
        node.expression.expression.elements.map((item) => evaluate(item, active)),
      );
      const separator = node.arguments.length ? await evaluate(node.arguments[0], active) : ',';
      if (values.every((value) => typeof value === 'string') && typeof separator === 'string')
        return values.join(separator);
    }
    return undefined;
  }

  function property(node, names) {
    node = unwrap(node);
    if (node && ts.isIdentifier(node)) node = unwrap(declarations.get(node.text)?.value);
    for (const name of names) {
      if (!node || !ts.isObjectLiteralExpression(node)) return undefined;
      const item = node.properties.find(
        (item) =>
          ts.isPropertyAssignment(item) &&
          (ts.isIdentifier(item.name) || ts.isStringLiteral(item.name)) &&
          item.name.text === name,
      );
      node = unwrap(item?.initializer);
    }
    return node;
  }

  const defaultExport = ast.statements.find(ts.isExportAssignment);
  const declaration = exportName ? declarations.get(exportName) : undefined;
  const metaDeclaration =
    defaultExport && ts.isIdentifier(unwrap(defaultExport.expression))
      ? declarations.get(unwrap(defaultExport.expression).text)
      : undefined;
  const docs = jsDoc(exportName ? declaration?.statement : defaultExport);
  const fallbackDocs = exportName ? {} : jsDoc(metaDeclaration?.statement);
  const object = exportName ? declaration?.value : defaultExport?.expression;
  let parameter = property(object, [
    'parameters',
    'docs',
    'description',
    exportName ? 'story' : 'component',
  ]);
  if (exportName) {
    const assignment = ast.statements.find(
      (statement) =>
        ts.isExpressionStatement(statement) &&
        ts.isBinaryExpression(statement.expression) &&
        statement.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isPropertyAccessExpression(statement.expression.left) &&
        ts.isIdentifier(statement.expression.left.expression) &&
        statement.expression.left.expression.text === exportName &&
        statement.expression.left.name.text === 'parameters',
    );
    parameter ??= property(assignment?.expression.right, ['docs', 'description', 'story']);
  }
  return {
    description: docs.description || fallbackDocs.description || (await evaluate(parameter)) || '',
    summary: docs.summary || fallbackDocs.summary || '',
  };
}

export function descriptionComment({ description, summary }) {
  if (!description && !summary) return '';
  const content = [description, summary ? `@summary ${summary}` : ''].filter(Boolean).join('\n\n');
  return `/**\n${content
    .replace(/\*\//g, '* /')
    .split('\n')
    .map((line) => ` * ${line}`)
    .join('\n')}\n */`;
}
