// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { toString } from 'mdast-util-to-string';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const parser = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkStringify, { bullet: '-', fences: true, listItemIndent: 'one' });
export const includedSources = {
  'package-readme': 'packages/react-components/README.md',
  'package-changelog': 'packages/react-components/CHANGELOG.md',
  'package-release-notes': 'packages/react-components/CHANGELOG.md',
  'package-skill': 'packages/react-components/agent/SKILL.md',
  'agent-prompt': 'apps/docsite/content/data/agent-prompt.md',
  'router-link-notes': 'apps/docsite/content/data/router-link-notes.md',
  'router-link-slots': 'apps/storybook/src/stories/templates/react-router/RouterLinkSlots.tsx',
};

export function rewriteDocumentationLinks(
  markdown,
  { route, pages, basePath, html = false, sourceFile },
) {
  const tree = parser.parse(markdown);
  const routes = new Map();
  for (const page of pages) {
    const target = page.route ? `${page.route}${html ? '/' : '.md'}` : html ? '' : 'index.md';
    routes.set(`/${page.route}${page.route ? '/' : ''}`, target);
    routes.set(page.route ? `/${page.route}.md` : '/index.md', target);
    for (const alias of page.aliases ?? []) {
      routes.set(alias, target);
      routes.set(`${alias.slice(0, -1)}.md`, target);
    }
    for (const origin of page.migratedFrom ?? [])
      if (/\.mdx?$/.test(origin)) routes.set(origin.replaceAll('\\', '/'), target);
    if (page.guidanceSource) routes.set(`apps/docsite/${page.guidanceSource}`, target);
    for (const id of page.legacyIds ?? []) routes.set(`storybook:${id}`, target);
  }
  function visit(node) {
    if (
      (node.type === 'link' || node.type === 'definition' || node.type === 'image') &&
      node.url &&
      !node.url.startsWith('#')
    ) {
      const url = new URL(node.url, `https://documentation.invalid/${route || 'index'}.md`);
      let key = url.pathname;
      const hash =
        html && url.hash && !/^#(?:guidance-|components-|templates-)/.test(url.hash)
          ? `#guidance-${url.hash.slice(1)}`
          : url.hash;
      const storybookId = url.searchParams.get('path')?.replace(/^\/docs\//, '');
      if (
        storybookId &&
        /^(?:coreai-ds-storybook\.azurewebsites\.net|documentation\.invalid)$/.test(url.hostname) &&
        routes.has(`storybook:${storybookId}`)
      ) {
        node.url = `${basePath}${routes.get(`storybook:${storybookId}`)}${hash}`;
      } else if (url.origin === 'https://documentation.invalid') {
        if (basePath !== '/' && key.startsWith(basePath)) key = `/${key.slice(basePath.length)}`;
        if (!routes.has(key) && routes.has(key.toLowerCase())) key = key.toLowerCase();
        if (sourceFile && !node.url.startsWith('/')) {
          const target = path.posix.normalize(
            path.posix.join(path.posix.dirname(sourceFile), node.url.split('#')[0]),
          );
          node.url = routes.has(target)
            ? `${basePath}${routes.get(target)}${hash}`
            : `https://github.com/microsoft/coreai-design-system/blob/main/${target}${url.hash}`;
        } else {
          if (!routes.has(key) && routes.has(`${key}/`)) key += '/';
          node.url = routes.has(key)
            ? `${basePath}${routes.get(key)}${url.search}${hash}`
            : `${basePath}${key.slice(1)}${url.search}${url.hash}`;
        }
      }
    }
    node.children?.forEach(visit);
  }
  visit(tree);
  return parser.stringify(tree).trim();
}

export async function expandStandaloneMarkdown(
  markdown,
  { route, pages, basePath, generated, renderExample, fence, sourceFile },
) {
  const tree = parser.parse(markdown);
  const replacements = [];
  for (const node of tree.children) {
    if (node.type !== 'html') continue;
    const directive = node.value.match(/^<!--\s*(include|generated|example):\s*([\w-]+)\s*-->$/);
    if (!directive) {
      if (/<!--\s*(include|generated|example):/.test(node.value))
        throw new Error(`Malformed Markdown directive in ${route}`);
      continue;
    }
    const [, kind, key] = directive;
    let replacement;
    if (kind === 'include') {
      if (!Object.hasOwn(includedSources, key))
        throw new Error(`Unknown included Markdown source: ${key}`);
      const source = includedSources[key];
      const raw = await fs.readFile(path.join(repositoryRoot, source), 'utf8');
      const text = key === 'package-release-notes' ? currentReleaseNotes(raw) : raw;
      replacement = ['router-link-slots', 'package-skill', 'agent-prompt'].includes(key)
        ? fence(raw, key === 'package-skill' ? 'markdown' : key === 'agent-prompt' ? 'text' : 'tsx')
        : rewriteDocumentationLinks(matter(text).content.replace(/^# .+\r?\n/, ''), {
            route,
            pages,
            basePath,
            sourceFile: source,
          });
    } else if (kind === 'generated') {
      if (!Object.hasOwn(generated, key))
        throw new Error(`Unknown generated Markdown section: ${key}`);
      replacement = generated[key];
    } else {
      replacement = renderExample(key);
    }
    replacements.push({
      start: node.position.start.offset,
      end: node.position.end.offset,
      replacement,
    });
  }
  let result = markdown;
  for (const { start, end, replacement } of replacements.reverse())
    result = result.slice(0, start) + replacement + result.slice(end);
  return rewriteDocumentationLinks(result, { route, pages, basePath, sourceFile });
}

export function currentReleaseNotes(markdown) {
  const tree = parser.parse(markdown);
  function visit(node) {
    if (!node.children) return;
    node.children = node.children.filter(
      (child) => child.type !== 'listItem' || !/\bMCP\b|\/mcp\b/i.test(toString(child)),
    );
    node.children.forEach(visit);
    node.children = node.children.filter(
      (child) => child.type !== 'list' || child.children.length > 0,
    );
  }
  visit(tree);
  return parser.stringify(tree);
}

export function tokenSwatches(html) {
  return html.replace(
    /<td>(#[\da-f]{6}|#[\da-f]{8}|(?:hsl|hsla|rgb|rgba)\([\d.%+,\s/-]+\))<\/td>/gi,
    (_match, color) =>
      `<td><span class="reference-color-swatch" style="background-color:${color}" aria-hidden="true"></span><code>${color}</code></td>`,
  );
}

export function stripPresentationMarkers(markdown) {
  const tree = parser.parse(markdown);
  let result = markdown;
  for (const node of [...tree.children].reverse()) {
    if (
      node.type === 'html' &&
      /^<!-- (?:live-example:[\w-]+|\/?view:[\w-]+) -->$/.test(node.value)
    ) {
      result = result.slice(0, node.position.start.offset) + result.slice(node.position.end.offset);
    }
  }
  return result;
}
