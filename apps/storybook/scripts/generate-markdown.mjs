// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import {
  parseReactComponentMeta,
  parseReactDocgen,
  parseReactDocgenTypescript,
  resolveComponentEntry,
  resolveDocEntry,
} from 'storybook/internal/toolsets-docs';
import { assertExpectedManifestProblems } from './verify-manifest-problems.mjs';

const defaultBuildDirectory = fileURLToPath(new URL('../storybook-static/', import.meta.url));
const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function assertId(id) {
  if (
    typeof id !== 'string' ||
    !/^[a-z0-9][a-z0-9-]*$/.test(id) ||
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/.test(id) ||
    id.length > 200
  ) {
    throw new Error(`Unsafe or malformed Storybook ID: ${JSON.stringify(id)}`);
  }
  return id;
}

function assertInside(root, target) {
  const relative = path.relative(root, target);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Unsafe path outside build directory: ${target}`);
  }
}

function assertReferences(value, root, resolved = false) {
  if (!value || typeof value !== 'object') return;
  if (Object.hasOwn(value, '$ref')) {
    if (resolved) throw new Error(`Unresolved reference: ${value.$ref}`);
    const ref = value.$ref;
    if (typeof ref !== 'string' || !ref) throw new Error('Malformed manifest reference');
    const [filename, fragment = '', ...extra] = ref.split('#');
    if (
      extra.length ||
      !filename ||
      /^[\\/]/.test(filename) ||
      /[:\\?%\0]/.test(filename) ||
      (fragment && !fragment.startsWith('/')) ||
      /~(?![01])/.test(fragment)
    ) {
      throw new Error(`Unsafe or malformed manifest reference: ${ref}`);
    }
    assertInside(root, path.resolve(root, 'manifests', filename));
  }
  for (const child of Object.values(value)) assertReferences(child, root, resolved);
}

function assertRecord(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid ${name}: expected an object`);
  }
}

function manifestEntries(manifest, key) {
  assertRecord(manifest, `${key} manifest`);
  if (manifest.v !== 0 && manifest.v !== 1) {
    throw new Error(`Unsupported ${key} manifest version: ${manifest.v}`);
  }
  assertRecord(manifest[key], `${key} manifest entries`);
  return Object.entries(manifest[key]).map(([id, entry]) => {
    assertId(id);
    assertRecord(entry, `${key} entry ${id}`);
    assertId(entry.id);
    if (id !== entry.id) throw new Error(`Manifest key/ID mismatch: ${id} / ${entry.id}`);
    return entry;
  });
}

function parsedMetadata(component) {
  if (component.reactComponentMeta) return parseReactComponentMeta(component.reactComponentMeta);
  if (component.reactDocgenTypescript) {
    return parseReactDocgenTypescript(component.reactDocgenTypescript);
  }
  if (component.reactDocgen) return parseReactDocgen(component.reactDocgen);
  return { props: {} };
}

function mergeTags(...sources) {
  const tags = {};
  for (const source of sources) {
    for (const [name, values] of Object.entries(source ?? {})) {
      const strings = (Array.isArray(values) ? values : [values]).map((value) =>
        value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value),
      );
      tags[name] = [...new Set([...(tags[name] ?? []), ...strings])];
    }
  }
  return tags;
}

function declarationJsDoc(node, ast) {
  const docs = ts.getJSDocCommentsAndTags(node).filter(ts.isJSDoc);
  const descriptions = [];
  const tags = {};
  for (const doc of docs) {
    const text =
      typeof doc.comment === 'string'
        ? doc.comment
        : (doc.comment
            ?.map((part) => (part.kind === ts.SyntaxKind.JSDocText ? part.text : part.getText(ast)))
            .join('') ?? '');
    if (text.trim()) descriptions.push(text.trim());
    for (const tag of doc.tags ?? []) {
      // Raw AST tag ranges retain @see targets, typed tags and inline links that
      // tag.comment alone omits. Strip only the JSDoc line prefixes.
      const value = tag
        .getText(ast)
        .replace(/^@\S+[ \t]*/, '')
        .replace(/\r\n?/g, '\n')
        .replace(/^[\t ]*\* ?/gm, '')
        .trim();
      const name = tag.tagName.text;
      tags[name] = [...new Set([...(tags[name] ?? []), value])];
    }
  }
  return { descriptions, tags };
}

function declarationOwners(ast) {
  const owners = new Map();
  function visit(statements, namespace = []) {
    for (const node of statements) {
      if (ts.isModuleDeclaration(node)) {
        let body = node;
        const names = [...namespace];
        while (body && ts.isModuleDeclaration(body)) {
          names.push(body.name.text);
          body = body.body;
        }
        if (body && ts.isModuleBlock(body)) visit(body.statements, names);
      } else if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
        const name = node.name.text;
        const entry = { node, qualifiedName: [...namespace, name].join('.') };
        owners.set(name, [...(owners.get(name) ?? []), entry]);
      }
    }
  }
  visit(ast.statements);
  return owners;
}

function ownPropertyDeclarations(node, name) {
  if (ts.isInterfaceDeclaration(node) || ts.isTypeLiteralNode(node)) {
    return node.members.filter((member) => {
      if (!ts.isPropertySignature(member) && !ts.isMethodSignature(member)) return false;
      const key = ts.isComputedPropertyName(member.name) ? member.name.expression : member.name;
      return (
        (ts.isIdentifier(key) || ts.isStringLiteral(key) || ts.isNumericLiteral(key)) &&
        key.text === name
      );
    });
  }
  if (ts.isTypeAliasDeclaration(node) || ts.isParenthesizedTypeNode(node)) {
    return ownPropertyDeclarations(node.type, name);
  }
  if (ts.isIntersectionTypeNode(node) || ts.isUnionTypeNode(node)) {
    return node.types.flatMap((type) => ownPropertyDeclarations(type, name));
  }
  if (ts.isConditionalTypeNode(node)) {
    return [node.trueType, node.falseType].flatMap((type) => ownPropertyDeclarations(type, name));
  }
  // Do not search nested property types, generic arguments or unrelated declarations.
  return [];
}

async function recoverPropertyDocumentation(components, buildRoot) {
  const allowedRoot = await fs.realpath(repositoryRoot);
  const cache = new Map();
  const metadata = new WeakMap();
  const stats = { declared: 0, matched: 0, descriptions: 0, tagged: 0, unmatched: 0 };
  async function readDeclaration(filename) {
    if (typeof filename !== 'string' || !filename || filename.includes('\0')) {
      throw new Error(`Malformed prop declaration source: ${JSON.stringify(filename)}`);
    }
    if (!/\.(?:[cm]?ts|tsx|[cm]?js|jsx)$/i.test(filename)) {
      throw new Error(`Unsupported prop declaration source extension: ${filename}`);
    }
    const target = path.resolve(path.dirname(buildRoot), filename);
    const assertSourceInside = (candidate) => {
      const relative = path.relative(allowedRoot, candidate);
      if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
        throw new Error(`Unsafe prop declaration source outside repository: ${filename}`);
      }
    };
    assertSourceInside(target);
    const realTarget = await fs.realpath(target);
    assertSourceInside(realTarget);
    if (!cache.has(realTarget)) {
      const text = await fs.readFile(realTarget, 'utf8');
      const ast = ts.createSourceFile(
        realTarget,
        text,
        ts.ScriptTarget.Latest,
        true,
        realTarget.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
      if (ast.parseDiagnostics.length) {
        throw new Error(
          `Cannot parse prop declaration source ${filename}: ${ts.flattenDiagnosticMessageText(
            ast.parseDiagnostics[0].messageText,
            '\n',
          )}`,
        );
      }
      cache.set(realTarget, { ast, owners: declarationOwners(ast) });
    }
    return cache.get(realTarget);
  }
  for (const component of components) {
    for (const item of [component, ...Object.values(component.subcomponents ?? {})]) {
      const parsed = parsedMetadata(item);
      const raw = item.reactComponentMeta ?? item.reactDocgenTypescript ?? item.reactDocgen;
      const caveats = [];
      for (const [name, prop] of Object.entries(parsed.props)) {
        const original = raw?.props?.[name] ?? {};
        const sources = [original.parent, ...(original.declarations ?? [])].filter(
          (source) => source?.fileName !== undefined,
        );
        prop.tags = mergeTags(original.tags, original.jsDocTags);
        if (!sources.length) continue;
        stats.declared++;
        const matches = [];
        let ambiguous = false;
        for (const source of sources) {
          let declaration;
          try {
            declaration = await readDeclaration(source.fileName);
          } catch (error) {
            throw new Error(
              `Cannot read declaration for ${component.id}/${item.name}/${name}: ${error.message}`,
              { cause: error },
            );
          }
          if (!source.name || source.name === 'TypeLiteral') continue;
          const candidates = (declaration.owners.get(source.name.split('.').at(-1)) ?? []).filter(
            (owner) => !source.name.includes('.') || owner.qualifiedName === source.name,
          );
          if (new Set(candidates.map((owner) => owner.qualifiedName)).size > 1) {
            ambiguous = true;
            continue;
          }
          for (const { node } of candidates) {
            for (const member of ownPropertyDeclarations(node, name)) {
              matches.push(declarationJsDoc(member, declaration.ast));
            }
          }
        }
        if (!matches.length) {
          stats.unmatched++;
          caveats.push(
            `> Current source extraction caveat: ${JSON.stringify(name)} has ${
              ambiguous ? 'ambiguous' : 'no exact named'
            } owner/property declaration match; only manifest metadata is available.`,
          );
          continue;
        }
        stats.matched++;
        const sourceDescriptions = [...new Set(matches.flatMap((match) => match.descriptions))];
        const descriptions = [
          ...new Set([prop.description, ...sourceDescriptions].filter(Boolean)),
        ];
        if (sourceDescriptions.some((text) => !prop.description?.includes(text))) {
          stats.descriptions++;
        }
        prop.description = descriptions.join('\n\n');
        const sourceTags = mergeTags(...matches.map((match) => match.tags));
        if (Object.keys(sourceTags).length) stats.tagged++;
        prop.tags = mergeTags(prop.tags, sourceTags);
      }
      metadata.set(item, { ...parsed, caveats });
    }
  }
  return { metadata, stats, sourceFiles: cache.size };
}

function fence(source, language = '') {
  const longest = Math.max(0, ...(source.match(/`+/g) ?? []).map((run) => run.length));
  const marker = '`'.repeat(Math.max(3, longest + 1));
  return `${marker}${language}\n${source}${source.endsWith('\n') ? '' : '\n'}${marker}`;
}

function tableCell(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\\/g, '&#92;')
    .replace(/\|/g, '&#124;')
    .replace(/`/g, '&#96;')
    .replace(/\r\n|\r|\n/g, '<br>');
}

const mdxParser = unified().use(remarkParse).use(remarkGfm).use(remarkMdx);

function inlineCode(value) {
  const marker = '`'.repeat(
    Math.max(1, ...(value.match(/`+/g) ?? []).map((run) => run.length + 1)),
  );
  return `${marker} ${value} ${marker}`;
}

async function staticDocMarkdown(doc, buildRoot) {
  const source = doc.content;
  let tree;
  try {
    tree = mdxParser.parse(source);
  } catch (error) {
    throw new Error(`Cannot parse MDX documentation ${doc.id}: ${error.message}`, { cause: error });
  }
  const imports = new Map();
  const declarations = new Map();
  const blocks = new Map();
  for (const node of tree.children) {
    if (node.type !== 'mdxjsEsm') continue;
    for (const statement of node.data?.estree?.body ?? []) {
      if (statement.type === 'ImportDeclaration') {
        for (const specifier of statement.specifiers) {
          const imported = specifier.imported?.name ?? specifier.imported?.value;
          imports.set(specifier.local.name, {
            source: statement.source.value,
            imported,
            statement: node.value,
          });
          if (
            statement.source.value === '@storybook/addon-docs/blocks' ||
            statement.source.value === '@storybook/blocks'
          ) {
            blocks.set(specifier.local.name, imported);
          }
        }
      }
      const declaration =
        statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
      if (declaration?.type === 'VariableDeclaration') {
        for (const entry of declaration.declarations) {
          if (entry.id.type === 'Identifier') declarations.set(entry.id.name, entry.init);
        }
      }
    }
  }
  async function evaluate(expression, active = new Set()) {
    if (!expression) return undefined;
    if (expression.type === 'Literal') {
      return ['string', 'number', 'boolean'].includes(typeof expression.value)
        ? expression.value
        : undefined;
    }
    if (expression.type === 'TemplateLiteral') {
      let result = expression.quasis[0].value.cooked ?? expression.quasis[0].value.raw;
      for (const [i, item] of expression.expressions.entries()) {
        const value = await evaluate(item, active);
        if (value === undefined) return undefined;
        result +=
          value + (expression.quasis[i + 1].value.cooked ?? expression.quasis[i + 1].value.raw);
      }
      return result;
    }
    if (expression.type === 'BinaryExpression' && expression.operator === '+') {
      const left = await evaluate(expression.left, active);
      const right = await evaluate(expression.right, active);
      if (left !== undefined && right !== undefined) return left + right;
    }
    if (expression.type === 'Identifier' && !active.has(expression.name)) {
      const next = new Set([...active, expression.name]);
      if (declarations.has(expression.name))
        return evaluate(declarations.get(expression.name), next);
      const imported = imports.get(expression.name);
      if (imported?.source.endsWith('?raw') && /^\.\.?\//.test(imported.source)) {
        if (!doc.path) throw new Error(`Missing source path for raw MDX import in ${doc.id}`);
        const sourcePath = path.resolve(path.dirname(buildRoot), doc.path);
        const target = path.resolve(path.dirname(sourcePath), imported.source.slice(0, -4));
        if (!/\.(?:[cm]?[jt]sx?|css|json|html|md)$/i.test(target)) {
          throw new Error(`Unsupported raw MDX source import in ${doc.id}: ${imported.source}`);
        }
        const allowed = await fs.realpath(repositoryRoot);
        assertInside(allowed, sourcePath);
        assertInside(allowed, target);
        const realTarget = await fs.realpath(target);
        assertInside(allowed, realTarget);
        return fs.readFile(realTarget, 'utf8');
      }
    }
    return undefined;
  }
  const expressionOf = (node) =>
    node?.data?.estree?.body?.find((item) => item.type === 'ExpressionStatement')?.expression;
  async function attribute(node, name) {
    const item = node.attributes.find((entry) => entry.name === name);
    return typeof item?.value === 'string' ? item.value : evaluate(expressionOf(item?.value));
  }
  const slice = (node) => source.slice(node.position.start.offset, node.position.end.offset);
  async function renderRange(node, start, end) {
    let result = '';
    let cursor = start;
    for (const child of node.children ?? []) {
      result += source.slice(cursor, child.position.start.offset) + (await render(child));
      cursor = child.position.end.offset;
    }
    return result + source.slice(cursor, end);
  }
  async function children(node) {
    if (!node.children?.length) return '';
    return renderRange(
      node,
      node.children[0].position.start.offset,
      node.children.at(-1).position.end.offset,
    );
  }
  async function render(node) {
    if (node.type === 'code' || node.type === 'inlineCode') return slice(node);
    if (node.type === 'mdxjsEsm') {
      const statements = node.data?.estree?.body ?? [];
      const nonImports = statements.filter((item) => item.type !== 'ImportDeclaration');
      if (!nonImports.length) return '';
      return (
        '> Static extraction notice: MDX module declarations are not executed.\n\n' +
        fence(nonImports.map((item) => source.slice(item.start, item.end)).join('\n'), 'tsx')
      );
    }
    if (node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') {
      if (!node.data?.estree?.body?.length) return '';
      const value = await evaluate(expressionOf(node));
      return value !== undefined
        ? String(value)
        : `Static MDX expression (not evaluated):\n\n${fence(slice(node), 'tsx')}`;
    }
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      const block = blocks.get(node.name);
      if (block === 'Meta') return '';
      if (block === 'Source') {
        const code = await attribute(node, 'code');
        if (typeof code === 'string') {
          const language = await attribute(node, 'language');
          return fence(
            code,
            typeof language === 'string' && /^\w+$/.test(language) ? language : 'tsx',
          );
        }
      }
      if (block === 'Canvas' || block === 'Story') {
        const reference = node.attributes.find((entry) => entry.name === 'of');
        const target =
          typeof reference?.value === 'string' ? reference.value : reference?.value?.value;
        const content = await children(node);
        return [
          `> Interactive Storybook example reference: ${inlineCode(target ?? node.name)} (not expanded).`,
          content,
        ]
          .filter(Boolean)
          .join('\n\n');
      }
      const content = await children(node);
      if (!node.name) return content;
      if (node.name === 'table') {
        const rows = [];
        async function collect(item) {
          if (item.name === 'tr') {
            const cells = [];
            function collectCells(child) {
              if (child.name === 'td' || child.name === 'th') cells.push(child);
              else if (child.name !== 'tr' && child.name !== 'table') {
                for (const nested of child.children ?? []) collectCells(nested);
              }
            }
            for (const child of item.children ?? []) collectCells(child);
            rows.push(
              await Promise.all(
                cells.map(async (cell) =>
                  tableCell((await children(cell)).replace(/\s+/g, ' ').trim()),
                ),
              ),
            );
          } else {
            for (const child of item.children ?? []) await collect(child);
          }
        }
        await collect(node);
        if (rows.length) {
          const width = Math.max(...rows.map((row) => row.length));
          const line = (row) =>
            `| ${Array.from({ length: width }, (_, i) => row[i] ?? '').join(' | ')} |`;
          return [line(rows[0]), line(Array(width).fill('---')), ...rows.slice(1).map(line)].join(
            '\n',
          );
        }
      }
      if (node.name === 'code') return inlineCode(content);
      if (node.name === 'br') return '\n';
      if (node.name === 'hr') return '\n---\n';
      if (node.name === 'strong' || node.name === 'b') return `**${content}**`;
      if (node.name === 'em' || node.name === 'i') return `*${content}*`;
      if (/^h[1-6]$/.test(node.name)) return `${'#'.repeat(Number(node.name[1]))} ${content}`;
      if (node.name === 'a') {
        const href = await attribute(node, 'href');
        if (typeof href === 'string') return `[${content}](${href})`;
      }
      if (node.name === 'img') {
        const src = await attribute(node, 'src');
        const alt = await attribute(node, 'alt');
        if (typeof src === 'string') return `![${alt ?? ''}](${src})`;
      }
      if (node.name === 'li') return `- ${content.trim()}`;
      if (node.name === 'blockquote')
        return content
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n');
      if (
        [
          'p',
          'div',
          'span',
          'section',
          'article',
          'main',
          'header',
          'footer',
          'aside',
          'ul',
          'ol',
          'thead',
          'tbody',
          'tr',
          'th',
          'td',
        ].includes(node.name)
      ) {
        return content;
      }
      const imported = imports.get(node.name.split('.')[0]);
      return [
        content,
        `> Current static extraction caveat: ${inlineCode(node.name)} is not evaluated; its JSX source is retained below.`,
        fence([imported?.statement, slice(node)].filter(Boolean).join('\n\n'), 'tsx'),
      ]
        .filter(Boolean)
        .join('\n\n');
    }
    return renderRange(node, node.position.start.offset, node.position.end.offset);
  }
  return renderRange(tree, 0, source.length);
}

function tagsFor(component, parsed) {
  return mergeTags(
    parsed.tags,
    component.reactComponentMeta?.jsDocTags,
    component.reactDocgenTypescript?.jsDocTags,
    component.reactDocgen?.tags,
    component.jsDocTags,
  );
}

function describe(component, propsHeading, metadata) {
  const parsed = metadata.get(component);
  const parts = [];
  const metadataDescription =
    component.reactComponentMeta?.description ??
    component.reactDocgenTypescript?.description ??
    component.reactDocgen?.description;
  for (const text of new Set([component.summary, component.description, metadataDescription])) {
    if (text) parts.push(text);
  }
  for (const [tag, values] of Object.entries(tagsFor(component, parsed)).sort(([a], [b]) =>
    compare(a, b),
  )) {
    for (const value of values) {
      parts.push(
        tag === 'example' || tag === 'import'
          ? `**@${tag}**\n\n${fence(value, 'tsx')}`
          : `**@${tag}**${value ? `\n\n${value}` : ''}`,
      );
    }
  }
  if (component.import) parts.push(fence(component.import, 'tsx'));
  if (component.error) {
    parts.push(
      `> Extraction notice: ${component.error.name}. API metadata could not be extracted.`,
      fence(component.error.message ?? ''),
    );
    return parts;
  }
  if (component.apiDescription) parts.push(component.apiDescription);
  parts.push(...parsed.caveats);
  parts.push(
    propsHeading,
    [
      '| Name | Type | Required | Default | Description |',
      '| --- | --- | --- | --- | --- |',
      ...Object.entries(parsed.props)
        .sort(([a], [b]) => compare(a, b))
        .map(([name, prop]) => {
          const cells = [
            name,
            prop.type,
            prop.required === undefined ? '' : prop.required ? 'Yes' : 'No',
            prop.defaultValue,
            [
              prop.description,
              ...Object.entries(prop.tags)
                .sort(([a], [b]) => compare(a, b))
                .flatMap(([tag, values]) =>
                  values.map((value) => `**@${tag}**${value ? ` ${value}` : ''}`),
                ),
            ]
              .filter(Boolean)
              .join('\n\n'),
          ];
          return `| ${cells.map(tableCell).join(' | ')} |`;
        }),
    ].join('\n'),
  );
  return parts;
}

function assertDoc(doc, key) {
  assertRecord(doc, `docs entry ${key}`);
  assertId(doc.id);
  if (doc.id !== key) throw new Error(`Docs key/ID mismatch: ${key} / ${doc.id}`);
  if (doc.error) throw new Error(`Docs extraction problem: ${doc.id}: ${doc.error.message}`);
  if (typeof doc.content !== 'string' || !doc.content.trim()) {
    throw new Error(`Missing or empty standalone doc content: ${doc.id}`);
  }
}

function componentMarkdown(component, title, entries, metadata) {
  const parts = [`# ${title}`, `ID: ${component.id}`, ...describe(component, '## Props', metadata)];
  const subcomponents = Object.entries(component.subcomponents ?? {}).sort(([a], [b]) =>
    compare(a, b),
  );
  if (subcomponents.length) {
    parts.push('## Subcomponents');
    for (const [key, subcomponent] of subcomponents) {
      if (subcomponent.error) {
        throw new Error(`Subcomponent extraction problem: ${component.id}/${key}`);
      }
      parts.push(
        `### ${subcomponent.name ?? key}`,
        ...describe(subcomponent, '#### Props', metadata),
      );
    }
  }
  const docs = Object.entries(component.docs ?? {}).sort(([a], [b]) => compare(a, b));
  if (docs.length) {
    parts.push('## Attached docs');
    for (const [id, doc] of docs) {
      assertDoc(doc, id);
      parts.push(`### ${entries[id]?.title ?? doc.title ?? doc.name}`, doc.content);
    }
  }
  if (component.stories?.length) {
    parts.push('## Examples');
    for (const story of component.stories) {
      parts.push(`### ${entries[story.id]?.name ?? story.name}`, `Story ID: ${story.id}`);
      if (story.summary) parts.push(story.summary);
      if (story.description) parts.push(story.description);
      if (story.jsDocTags) {
        for (const [tag, values] of Object.entries(story.jsDocTags)) {
          for (const value of values) {
            parts.push(tag === 'example' ? fence(value, 'tsx') : `**@${tag}**\n\n${value}`);
          }
        }
      }
      if (typeof story.snippet === 'string' && story.snippet.trim()) {
        parts.push(fence(story.snippet, 'tsx'));
      } else {
        parts.push('This docs-only entry has no code snippet.');
      }
    }
  }
  return `${parts.join('\n\n')}\n`;
}

async function writeIfChanged(filename, content) {
  try {
    if ((await fs.readFile(filename, 'utf8')) === content) return;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await fs.writeFile(filename, content, 'utf8');
}

/**
 * Export the built Storybook's complete manifest documentation without network access.
 * Only stale Markdown paths recorded in the previous exporter index are removed.
 */
export async function generateMarkdown({ buildDirectory = defaultBuildDirectory } = {}) {
  const root = await fs.realpath(path.resolve(buildDirectory));
  const manifestProvider = async (_request, filename) => {
    if (typeof filename !== 'string' || /[:\\?%#\0]/.test(filename)) {
      throw new Error(`Unsafe manifest path: ${filename}`);
    }
    const target = path.resolve(root, filename);
    assertInside(root, target);
    const realTarget = await fs.realpath(target);
    assertInside(root, realTarget);
    const text = await fs.readFile(realTarget, 'utf8');
    assertReferences(JSON.parse(text), root);
    return text;
  };
  const [storybookIndex, componentManifest, docsManifest] = await Promise.all(
    ['./index.json', './manifests/components.json', './manifests/docs.json'].map(async (filename) =>
      JSON.parse(await manifestProvider(undefined, filename)),
    ),
  );
  assertRecord(storybookIndex.entries, 'Storybook index entries');
  const entries = storybookIndex.entries;
  const indexStories = new Map();
  const indexedIds = new Set();
  for (const [key, entry] of Object.entries(entries)) {
    assertId(key);
    assertId(entry.id);
    if (indexedIds.has(entry.id)) throw new Error(`Duplicate index ID: ${entry.id}`);
    indexedIds.add(entry.id);
    if (key !== entry.id) throw new Error(`Index key/ID mismatch: ${key} / ${entry.id}`);
    if (entry.type === 'story' && (!entry.tags || entry.tags.includes('manifest')))
      indexStories.set(entry.id, entry);
  }
  const components = [];
  for (const component of manifestEntries(componentManifest, 'components')) {
    components.push(await resolveComponentEntry(component, undefined, manifestProvider));
  }
  const docs = [];
  for (const doc of manifestEntries(docsManifest, 'docs')) {
    const resolved = await resolveDocEntry(doc, undefined, manifestProvider);
    if (resolved.id !== doc.id) {
      throw new Error(`Resolved docs key/ID mismatch: ${doc.id} / ${resolved.id}`);
    }
    docs.push(resolved);
  }
  assertReferences({ components, docs }, root, true);
  assertExpectedManifestProblems(components);
  const { metadata, stats, sourceFiles } = await recoverPropertyDocumentation(components, root);
  for (const doc of [
    ...docs,
    ...components.flatMap((component) => Object.values(component.docs ?? {})),
  ]) {
    assertDoc(doc, doc.id);
    doc.content = await staticDocMarkdown(doc, root);
    if (!doc.content.trim())
      throw new Error(`Empty static documentation after MDX cleanup: ${doc.id}`);
  }

  const documents = [];
  const output = new Map();
  const documentIds = new Set();
  const storyIds = new Set();
  function addDocument(item, kind, title, ids, markdown) {
    assertId(item.id);
    if (documentIds.has(item.id)) throw new Error(`Duplicate document ID: ${item.id}`);
    documentIds.add(item.id);
    documents.push({ id: item.id, title, kind, path: `llms/${item.id}.md`, storyIds: ids });
    output.set(`${item.id}.md`, markdown);
  }
  for (const component of components.sort((a, b) => compare(a.id, b.id))) {
    const stories = component.stories ?? [];
    if (!Array.isArray(stories)) throw new Error(`Invalid stories: ${component.id}`);
    for (const story of stories) {
      assertId(story.id);
      if (storyIds.has(story.id)) throw new Error(`Duplicate story ID: ${story.id}`);
      storyIds.add(story.id);
      if (
        !(story.docsOnly || indexStories.get(story.id)?.docsOnly) &&
        (typeof story.snippet !== 'string' || !story.snippet.trim())
      ) {
        throw new Error(`Missing snippet for story: ${story.id}`);
      }
    }
    component.stories = [...stories].sort((a, b) => compare(a.id, b.id));
    const title =
      entries[component.id]?.title ??
      component.stories.map((story) => entries[story.id]?.title).find(Boolean) ??
      entries[`${component.id}--docs`]?.title ??
      component.name ??
      component.title;
    addDocument(
      component,
      'component',
      title,
      component.stories.map((story) => story.id),
      componentMarkdown(component, title, entries, metadata),
    );
  }
  for (const id of indexStories.keys()) {
    if (!storyIds.has(id)) {
      throw new Error(`Indexed story is missing from component manifests: ${id}`);
    }
  }
  for (const doc of docs) {
    assertDoc(doc, doc.id);
    const title = entries[doc.id]?.title ?? doc.title ?? doc.name;
    addDocument(doc, 'docs', title, [], `# ${title}\n\n${doc.content}\n`);
  }
  const index = { version: 1, documents: documents.sort((a, b) => compare(a.id, b.id)) };
  const directory = path.join(root, 'llms');
  await fs.mkdir(directory, { recursive: true });
  if ((await fs.lstat(directory)).isSymbolicLink()) {
    throw new Error('Unsafe exported directory symlink: llms');
  }
  const realDirectory = await fs.realpath(directory);
  assertInside(root, realDirectory);
  const assertNotSymlink = async (filename) => {
    try {
      if ((await fs.lstat(path.join(directory, filename))).isSymbolicLink()) {
        throw new Error(`Unsafe exported file symlink: ${filename}`);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  };
  await assertNotSymlink('index.json');
  let previous;
  try {
    previous = JSON.parse(await fs.readFile(path.join(directory, 'index.json'), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  // Refuse existing symlinks before writing or deleting even a known generated filename.
  const stale = (
    previous?.version === 1 && Array.isArray(previous.documents) ? previous.documents : []
  ).filter((doc) => {
    try {
      assertId(doc?.id);
    } catch {
      return false;
    }
    return (
      (doc.kind === 'component' || doc.kind === 'docs') &&
      doc.path === `llms/${doc.id}.md` &&
      !output.has(`${doc.id}.md`)
    );
  });
  const filenames = [...output.keys(), ...stale.map((doc) => `${doc.id}.md`), 'index.json'];
  for (const filename of filenames) await assertNotSymlink(filename);
  for (const [filename, content] of output) {
    await writeIfChanged(path.join(directory, filename), content);
  }
  for (const doc of stale) await fs.rm(path.join(directory, `${doc.id}.md`), { force: true });
  await writeIfChanged(path.join(directory, 'index.json'), `${JSON.stringify(index, null, 2)}\n`);
  if (stats.declared) {
    console.info(
      `Prop declaration JSDoc: ${stats.matched}/${stats.declared} exact matches across ` +
        `${sourceFiles} source files; ${stats.descriptions} recovered descriptions, ` +
        `${stats.tagged} source-tagged props, ${stats.unmatched} explicit extraction caveats.`,
    );
  }
  return index;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const index = await generateMarkdown();
  const components = index.documents.filter((doc) => doc.kind === 'component');
  const docs = index.documents.filter((doc) => doc.kind === 'docs');
  const stories = components.reduce((count, doc) => count + doc.storyIds.length, 0);
  console.log(
    `Generated Markdown for ${components.length} components, ${docs.length} docs, ${stories} stories.`,
  );
}
