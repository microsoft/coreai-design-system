// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import matter from 'gray-matter';
import ts from 'typescript';
import { guidanceMarkdown, renderGuidance } from '../../../shared/guidance.mjs';
import { extractStorySource } from './sources/story-source.mjs';
import { readStoryDescriptions } from './sources/story-descriptions.mjs';
import { assertFluentStoryVersion } from './sources/fluent-story-version.mjs';
import {
  readReferencePages,
  standaloneRendererNames,
  wholePageRendererNames,
} from './read-reference-pages.mjs';
import { readSourceCatalog } from './sources/catalog.mjs';
import { createComponentApiReader, componentApiMarkdown } from './sources/component-api.mjs';
import {
  expandStandaloneMarkdown,
  rewriteDocumentationLinks,
  tokenSwatches,
} from './standalone-markdown.mjs';
import { standaloneSections, readFoundationData } from './standalone-sections.mjs';
import {
  escapeHtml,
  codeFence,
  pageGuidanceParts,
  pageTemplateHeader,
  pageTemplateResources,
  homeHeroFallback,
  workInProgressFallback,
} from './page-template.mjs';
import { stripPresentationMarkers } from './standalone-markdown.mjs';
import { groupNavigationEntries } from '../src/reference-proof/navigation.mjs';
export { escapeHtml, codeFence } from './page-template.mjs';

export const appRoot = fileURLToPath(new URL('../', import.meta.url));
export const outputDirectory = path.join(appRoot, 'dist-reference-proof');
const storyRoot = path.resolve(appRoot, '../storybook');
const repositoryRoot = path.resolve(appRoot, '../..');
const require = createRequire(import.meta.url);

export const providerSource = `import * as React from 'react';
import { CoreAIFluentProvider, coreaiLightTheme } from '@coreai-ds/react-components';
import '@coreai-ds/react-components/fonts/fonts.css';
import Example from './Example';

export default function App() {
  return (
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <Example />
    </CoreAIFluentProvider>
  );
}
`;

export function normalizeBase(value = '/') {
  if (
    !/^\/(?:[A-Za-z0-9._~-]+\/?)*$/.test(value) ||
    value.split('/').some((segment) => segment === '.' || segment === '..')
  ) {
    throw new Error('Base path must be / or an absolute URL path such as /coreai-design-system/.');
  }
  return value.endsWith('/') ? value : `${value}/`;
}

export function normalizeSource(source) {
  return source.replace(/\r\n?/g, '\n');
}

export function scopeExampleIds(source, exampleId) {
  const ast = ts.createSourceFile(
    'example.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const ids = new Set();
  const templateIds = new Set();
  const collect = (node) => {
    if (
      ts.isJsxAttribute(node) &&
      node.name.getText(ast) === 'id' &&
      node.initializer &&
      ts.isStringLiteral(node.initializer)
    )
      ids.add(node.initializer.text);
    if (
      ts.isJsxAttribute(node) &&
      node.name.getText(ast) === 'id' &&
      node.initializer &&
      ts.isJsxExpression(node.initializer) &&
      node.initializer.expression &&
      ts.isTemplateExpression(node.initializer.expression)
    ) {
      templateIds.add(node.initializer.expression.getText(ast));
    }
    ts.forEachChild(node, collect);
  };
  collect(ast);
  if (!ids.size && !templateIds.size) return source;
  const result = ts.transform(ast, [
    (context) => {
      const visit = (node) => {
        if (
          ts.isJsxAttribute(node) &&
          [
            'id',
            'htmlFor',
            'aria-controls',
            'aria-labelledby',
            'aria-describedby',
            'aria-owns',
            'aria-activedescendant',
          ].includes(node.name.getText(ast)) &&
          node.initializer &&
          ts.isJsxExpression(node.initializer) &&
          node.initializer.expression &&
          ts.isTemplateExpression(node.initializer.expression) &&
          templateIds.has(node.initializer.expression.getText(ast))
        ) {
          const expression = node.initializer.expression;
          return ts.factory.updateJsxAttribute(
            node,
            node.name,
            ts.factory.updateJsxExpression(
              node.initializer,
              ts.factory.updateTemplateExpression(
                expression,
                ts.factory.createTemplateHead(`${exampleId}-${expression.head.text}`),
                expression.templateSpans,
              ),
            ),
          );
        }
        if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
          const name = node.name.getText(ast);
          const value = node.initializer.text;
          const reference = [
            'id',
            'htmlFor',
            'aria-controls',
            'aria-labelledby',
            'aria-describedby',
            'aria-owns',
            'aria-activedescendant',
          ].includes(name);
          const next = reference
            ? value
                .split(' ')
                .map((id) => (ids.has(id) ? `${exampleId}-${id}` : id))
                .join(' ')
            : name === 'href' && value.startsWith('#') && ids.has(value.slice(1))
              ? `#${exampleId}-${value.slice(1)}`
              : value;
          if (next !== value)
            return ts.factory.updateJsxAttribute(
              node,
              node.name,
              ts.factory.createStringLiteral(next),
            );
        }
        return ts.visitEachChild(node, visit, context);
      };
      return (node) => ts.visitNode(node, visit);
    },
  ]);
  try {
    return ts.createPrinter({ newLine: ts.NewLineKind.LineFeed }).printFile(result.transformed[0]);
  } finally {
    result.dispose();
  }
}

function unwrap(node) {
  while (
    node &&
    (ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isParenthesizedExpression(node))
  ) {
    node = node.expression;
  }
  return node;
}

export function assertSimpleStory(source, exportName, metadata = {}, label = exportName) {
  const unsupported = new Set([
    'args',
    'decorators',
    'loaders',
    'globals',
    'beforeEach',
    'afterEach',
    'render',
  ]);
  const fail = (field) => {
    throw new Error(
      `${label}: ${field} needs an explicit fixed-example adaptation or exclusion. ` +
        'The reference proof does not emulate Storybook setup.',
    );
  };
  for (const key of Object.keys(metadata)) {
    if (unsupported.has(key)) fail(`component ${key}`);
  }
  const ast = ts.createSourceFile('example.tsx', source, ts.ScriptTarget.Latest, true);
  if (ast.parseDiagnostics.length) throw new Error(`${label}: invalid TSX source.`);
  let implementation;
  for (const statement of ast.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === exportName) {
      implementation = statement;
    }
    if (ts.isVariableStatement(statement)) {
      const declaration = statement.declarationList.declarations.find(
        (item) => ts.isIdentifier(item.name) && item.name.text === exportName,
      );
      if (declaration) implementation = unwrap(declaration.initializer);
    }
    if (
      ts.isExpressionStatement(statement) &&
      ts.isBinaryExpression(statement.expression) &&
      ts.isPropertyAccessExpression(statement.expression.left) &&
      statement.expression.left.expression.getText(ast) === exportName &&
      unsupported.has(statement.expression.left.name.text)
    ) {
      fail(`example ${statement.expression.left.name.text}`);
    }
  }
  if (implementation && ts.isObjectLiteralExpression(implementation)) {
    for (const property of implementation.properties) {
      if (ts.isSpreadAssignment(property)) fail('spread story metadata');
      if (unsupported.has(property.name?.getText(ast)) && property.name.getText(ast) !== 'render') {
        fail(`example ${property.name.getText(ast)}`);
      }
    }
    implementation = unwrap(
      implementation.properties.find(
        (property) => ts.isPropertyAssignment(property) && property.name.getText(ast) === 'render',
      )?.initializer,
    );
  }
  if (
    !implementation ||
    !(
      ts.isArrowFunction(implementation) ||
      ts.isFunctionExpression(implementation) ||
      ts.isFunctionDeclaration(implementation)
    ) ||
    implementation.parameters.length > 1
  ) {
    fail('non-function render or Storybook context');
  }
}

export function accountForStories(component, selectedNames, exclusions = {}) {
  const chosen = new Map(component.stories.map((story) => [story.id, story]));
  if (selectedNames) {
    for (const name of selectedNames) {
      if (!component.stories.some((story) => story.exportName === name)) {
        throw new Error(`${component.id}: selected example ${name} does not exist.`);
      }
    }
  }
  for (const name of Object.keys(exclusions)) {
    if (!component.stories.some((story) => story.exportName === name)) {
      throw new Error(`${component.id}: excluded example ${name} does not exist.`);
    }
  }
  return component.sources.flatMap((source) =>
    source.stories.map((story) => {
      const owner = chosen.get(story.id);
      const included =
        (!selectedNames || selectedNames.includes(owner.exportName)) &&
        !exclusions[owner.exportName];
      const replaced = owner.origin !== story.origin || owner.sourceFile !== story.sourceFile;
      return {
        id: story.id,
        origin: story.origin,
        source: story.implementationFile,
        status: !included ? 'excluded' : replaced ? 'replaced' : 'included',
        reason: !included
          ? (exclusions[owner.exportName] ??
            'Outside the representative proof set; not a statement of component support.')
          : replaced
            ? 'Replaced by the matching CoreAI example.'
            : undefined,
      };
    }),
  );
}

function packageManifest(name) {
  const filename =
    name === '@coreai-ds/react-components'
      ? path.join(repositoryRoot, 'packages/react-components/package.json')
      : require.resolve(`${name}/package.json`);
  return JSON.parse(require('node:fs').readFileSync(filename, 'utf8'));
}

function packageName(specifier) {
  return specifier
    .split('/')
    .slice(0, specifier.startsWith('@') ? 2 : 1)
    .join('/');
}

function git(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function exampleHeading(example) {
  return `## ${example.name}\n\nSource: ${example.origin === 'fluent' ? 'Fluent, adapted for CoreAI' : 'CoreAI'}.\n\n${example.description}`.trim();
}

export function exampleHeadingHtml(example) {
  return renderGuidance(exampleHeading(example))
    .html.replaceAll('id="guidance-', `id="${example.id}-`)
    .replaceAll('href="#guidance-', `href="#${example.id}-`);
}

function implementationMarkdown(page, metadata, extension = '.md') {
  return [
    `## Implementation\n\nCoreAI ${metadata.versions['@coreai-ds/react-components']}; Fluent ${metadata.versions['@fluentui/react-components']}.\n\n[Setup and dependencies](${metadata.basePath}guides/package${extension}).`,
    page.kind === 'templates'
      ? 'Copy this template into your app. It is not an npm export. Adapt actions and navigation to your product.'
      : 'Import components from `@coreai-ds/react-components`. CoreAI guidance above takes precedence over API demonstration examples.',
    ...(page.notes ?? []).map((note) => `Note: ${note}`),
  ].join('\n\n');
}

export function pageMarkdown(page, metadata) {
  if (page.standalone) return stripPresentationMarkers(page.guidance);
  const parts = pageGuidanceParts(page.guidance, page.resources);
  const basic = page.examples.find((example) => example.id === page.defaultExampleId);
  const exampleMarkdown = (example) =>
    [
      exampleHeading(example),
      `[Download source](${metadata.basePath}${example.sourcePath})`,
      codeFence(example.source),
    ].join('\n\n');
  return [
    parts.introduction,
    ...(basic ? [exampleMarkdown(basic)] : []),
    componentApiMarkdown(page.api),
    parts.body,
    implementationMarkdown(page, metadata),
    ...page.examples.filter((example) => example !== basic).map(exampleMarkdown),
    ...page.templateSources.map((source) =>
      [
        `## Template source: ${source.name}`,
        `[Download ${source.name}](${metadata.basePath}${source.path})`,
        codeFence(source.source),
      ].join('\n\n'),
    ),
    parts.resourcesMarkdown,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export async function resolveStandalonePage(page, { pages, basePath, generated, allExamples }) {
  const examples = [];
  const guidance = await expandStandaloneMarkdown(page.guidance, {
    route: page.route,
    pages,
    basePath,
    generated: Object.fromEntries(
      Object.entries(generated).map(([key, content]) => [
        key,
        (page.renderer === 'colors' && ['colors', 'data-visualization'].includes(key)) ||
        (page.renderer === 'typography' && ['font-families', 'typography'].includes(key))
          ? `<!-- view:${key} -->\n\n${content}\n\n<!-- /view:${key} -->`
          : content,
      ]),
    ),
    fence: codeFence,
    sourceFile: `apps/docsite/${page.guidanceSource}`,
    renderExample(id) {
      const example = allExamples.get(id);
      if (!example) throw new Error(`${page.route}: unknown embedded example ${id}`);
      if (examples.some((item) => item.id === id))
        throw new Error(`${page.route}: duplicate embedded example ${id}`);
      examples.push(example);
      return `${exampleHeading(example)}\n\n<!-- live-example:${id} -->\n\n[Download source](/${example.sourcePath})\n\n${codeFence(example.source)}`;
    },
  });
  return { guidance, examples };
}

export function standalonePageHtml(page, metadata) {
  const markdown = rewriteDocumentationLinks(page.guidance, {
    route: page.route,
    pages: metadata.pages,
    basePath: metadata.basePath,
    html: true,
  });
  const parts = pageGuidanceParts(markdown, page.resources);
  if (page.renderer === 'work-in-progress') {
    return `<div class="reference-page-introduction reference-work-in-progress">${pageTemplateHeader(page, metadata, parts)}${workInProgressFallback(page, metadata, true)}</div>`;
  }
  const bodyMarkdown = wholePageRendererNames.includes(page.renderer)
    ? `<!-- view:${page.renderer} -->\n\n${parts.body}\n\n<!-- /view:${page.renderer} -->`
    : parts.body;
  const body = renderGuidance(bodyMarkdown, {
    sections: true,
    examples: Object.fromEntries(page.examples.map((example) => [example.id, example])),
    views: Object.fromEntries([
      ...standaloneRendererNames.map((name) => [name, true]),
      ['data-visualization', true],
      ['font-families', true],
    ]),
  }).html;
  return `<div class="reference-page-introduction${page.renderer === 'home' ? ' reference-home-introduction' : ''}${page.layout ? ` reference-page--${page.layout}` : ''}">${pageTemplateHeader(page, metadata, parts)}${pageTemplateResources(page, metadata)}${page.renderer === 'home' ? homeHeroFallback(page, metadata, parts) : `<article class="standalone-guidance">${tokenSwatches(body)}</article>`}</div>`;
}

export function componentPageGuidanceHtml(page, metadata) {
  const parts = pageGuidanceParts(page.guidance, page.resources);
  const basic = page.examples?.find((example) => example.id === page.defaultExampleId);
  const api = componentApiMarkdown(page.api);
  const unfinished = page.status === 'under-construction';
  const body = unfinished
    ? parts.body.replace(/^## Status\n\nPage under construction\.\n*/, '')
    : parts.body;
  return `<div class="reference-page-introduction${page.layout ? ` reference-page--${page.layout}` : ''}">${pageTemplateHeader(page, metadata, parts)}${basic ? exampleHtml(basic, metadata.basePath, true) : ''}${pageTemplateResources(page, metadata)}${unfinished ? workInProgressFallback(page, metadata) : ''}<div class="component-markdown">${renderGuidance(body).html}</div>${api ? `<section class="reference-api"><details><summary><strong>API reference</strong><span>Generated CoreAI prop and type summaries</span></summary><div class="reference-api__content">${renderGuidance(api).html}</div></details></section>` : ''}</div>`;
}

export function initialThemeStyles(themes, stylesheets) {
  const referencedTokens = [...stylesheets.matchAll(/var\(--([\w-]+)/g)].map((match) => match[1]);
  function declarations(mode) {
    const theme = themes[mode];
    const pending = [
      ...referencedTokens,
      'colorNeutralBackground1',
      'colorNeutralBackground6',
      'colorNeutralForeground2',
    ];
    const resolved = new Map();
    for (const token of pending) {
      if (resolved.has(token) || !(token in theme)) continue;
      const value = String(theme[token]);
      resolved.set(token, value);
      pending.push(...[...value.matchAll(/var\(--([\w-]+)/g)].map((match) => match[1]));
    }
    return [
      ...[...resolved].map(([token, value]) => `--${token}:${value}`),
      `background:var(--colorNeutralBackground${mode === 'dark' ? 6 : 1})`,
      'color:var(--colorNeutralForeground2)',
      `color-scheme:${mode}`,
    ].join(';');
  }
  const light = declarations('light');
  const dark = declarations('dark');
  return `:root{${light}}:root[data-theme="dark"]{${dark}}@media(prefers-color-scheme:dark){:root:not([data-theme]){${dark}}}`;
}

function shell(title, body, metadata, assets, navigation, currentPath = '') {
  const home = currentPath === '';
  const logo = `<span class="app-sidenav__search-logo-static" data-shell-fallback><svg viewBox="-0.74 -0.59 44 44" aria-hidden="true" focusable="false"><path d="M27.43 2.896H39.77V15.236H27.43V2.896Z" fill="currentColor"></path><path d="M2.749 2.896H15.089V15.236H2.749V2.896Z" fill="currentColor"></path><path d="M15.09 15.236H27.431V27.576H15.09V15.236Z" fill="currentColor"></path><path d="M2.749 27.576H15.089V39.916H2.749V27.576Z" fill="currentColor"></path><path d="M27.43 27.576H39.77V39.916H27.43V27.576Z" fill="currentColor"></path></svg></span>`;
  const settings = `<span class="reference-theme-fallback" data-shell-fallback aria-hidden="true"><svg fill="currentColor" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M1.91 7.38A8.5 8.5 0 0 1 3.7 4.3a.5.5 0 0 1 .54-.13l1.92.68a1 1 0 0 0 1.32-.76l.36-2a.5.5 0 0 1 .4-.4 9 9 0 0 1 3.55 0q.32.08.38.4l.37 2a1 1 0 0 0 1.32.76l1.92-.68a.5.5 0 0 1 .54.13 8.5 8.5 0 0 1 1.78 3.08q.08.31-.15.54l-1.56 1.32a1 1 0 0 0 0 1.52l1.56 1.32a.5.5 0 0 1 .15.54 8.5 8.5 0 0 1-1.78 3.08.5.5 0 0 1-.54.13l-1.92-.68a1 1 0 0 0-1.32.76l-.37 2a.5.5 0 0 1-.38.4 8.5 8.5 0 0 1-3.56 0 .5.5 0 0 1-.39-.4l-.36-2a1 1 0 0 0-1.32-.76l-1.92.68a.5.5 0 0 1-.54-.13 8.5 8.5 0 0 1-1.78-3.08.5.5 0 0 1 .15-.54l1.56-1.32a1 1 0 0 0 0-1.52L2.06 7.92a.5.5 0 0 1-.15-.54m1.06 0 1.3 1.1a2 2 0 0 1 0 3.04l-1.3 1.1q.45 1.19 1.25 2.16l1.6-.58a2 2 0 0 1 2.63 1.53l.3 1.67a8 8 0 0 0 2.5 0l.3-1.67a2 2 0 0 1 2.64-1.53l1.6.58a8 8 0 0 0 1.24-2.16l-1.3-1.1a2 2 0 0 1 0-3.04l1.3-1.1a8 8 0 0 0-1.25-2.16l-1.6.58a2 2 0 0 1-2.63-1.53l-.3-1.67a8 8 0 0 0-2.5 0l-.3 1.67A2 2 0 0 1 5.81 5.8l-1.6-.58a8 8 0 0 0-1.24 2.16M7.5 10a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0m1 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0" fill="currentColor"></path></svg></span>`;
  const search = `<div class="reference-search-fallback" data-shell-fallback aria-hidden="true"><span>Search</span><span class="app-sidenav__search-shortcut"><span class="app-sidenav__search-shortcut-command">⌘</span><span class="app-sidenav__search-shortcut-key">K</span></span></div>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} | CoreAI design system</title>
<link rel="icon" href="data:,">
<style>${assets.initialThemeStyles}</style>
<script>
(() => {
  const root = document.documentElement;
  let stored;
  try { stored = localStorage.getItem('coreai-docsite-theme'); } catch { stored = null; }
  root.dataset.theme = stored === 'light' || stored === 'dark'
    ? stored
    : matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
})();
</script>
${assets.css.map((file) => `<link rel="stylesheet" href="${metadata.basePath}${file}">`).join('\n')}
</head><body><div id="reference-root"><div id="reference-content"><div class="app-shell reference-shell"><a class="skip-link" href="#main">Skip to content</a>
<div class="app-body"><aside class="app-sidenav" id="app-navigation" aria-label="Site navigation">
<div class="app-sidenav__header"><div class="app-sidenav__search-row"><a class="app-sidenav__search-logo" data-shell-logo href="${metadata.basePath}" aria-label="CoreAI home">${logo}</a>
<div data-shell-search>${search}</div><div data-shell-theme>${settings}</div><button type="button" class="app-sidenav__dismiss" data-close-navigation aria-label="Close navigation"><span></span><span></span><span></span></button></div></div>
<nav class="app-sidenav__nav" id="app-navigation-links" aria-label="Documentation">${navigation}</nav>
<div class="app-sidenav__footer"><a class="app-sidenav__link" href="https://github.com/microsoft/coreai-design-system/issues">Questions?</a><a class="app-sidenav__link" href="https://github.com/microsoft/coreai-design-system/issues/new">Feedback</a></div></aside>
<div class="app-content${home ? ' app-content--home' : ''}"><div data-shell-header></div><div class="app-page${home ? ' app-page--home' : ''}"><main class="site-main" id="main" tabindex="-1">${body}
<footer class="reference-footer${currentPath === '' ? ' sr-only' : ''}">CoreAI ${escapeHtml(metadata.versions['@coreai-ds/react-components'])}; Fluent ${escapeHtml(metadata.versions['@fluentui/react-components'])}.
<a href="${metadata.basePath}llms.txt">Agent index</a> · <a href="${metadata.basePath}llms/index.json">Coverage and provenance</a> · <a href="${metadata.basePath}THIRD-PARTY-NOTICES.txt">License</a></footer>
</main></div></div></div></div><div class="copy-toast" role="status"></div></div></div><script type="module" src="${metadata.basePath}${assets.entry}"></script></body></html>\n`;
}

function sourceHtml(source, id, downloadPath, base) {
  return `<div class="source-actions"><button type="button" data-copy-source="${id}">Copy source</button>
<a href="${base}${downloadPath}">Download source</a><span role="status" data-copy-status="${id}"></span></div>
<pre><code id="${id}">${escapeHtml(source)}</code></pre>`;
}

function exampleHtml(example, basePath, basic = false) {
  const source = sourceHtml(example.source, `source-${example.id}`, example.sourcePath, basePath);
  return `<section class="example${basic ? ' reference-basic-example' : ''}" id="${example.id}"${basic ? ' data-basic-example' : ''}>${exampleHeadingHtml(example)}
<div class="preview" data-example-id="${example.id}" aria-label="${escapeHtml(example.name)} preview">
<p>Loading interactive example. Full source is available below.</p></div>
<noscript>Enable JavaScript for the interactive preview. Guidance and source do not require JavaScript.</noscript>
${basic ? `<details class="reference-basic-source"><summary>View example source</summary>${source}</details>` : source}</section>`;
}

export async function buildReferenceProof({ basePath = '/', outDir = outputDirectory } = {}) {
  basePath = normalizeBase(basePath);
  const pageScope = await readReferencePages(path.join(appRoot, 'content'));
  const checkout = path.join(storyRoot, 'fluent-stories');
  const fluentRef = git(['rev-parse', 'HEAD'], checkout);
  const sourceVersion = JSON.parse(
    git(['show', 'HEAD:packages/react-components/react-components/package.json'], checkout),
  ).version;
  assertFluentStoryVersion(sourceVersion, packageManifest('@fluentui/react-components').version);
  const inventory = await readSourceCatalog();
  const apiReader = createComponentApiReader();
  const cacheDirectory = path.join(appRoot, '.cache/reference-proof');
  const exampleDirectory = path.join(cacheDirectory, 'examples');
  await fs.mkdir(exampleDirectory, { recursive: true });
  const pages = [];
  const coverage = [];
  const sourceCache = new Map();
  const registry = ["import type { ComponentType } from 'react';"];
  const imports = [];
  const loaders = [];
  const dependencies = new Set([
    '@coreai-ds/react-components',
    '@fluentui/react-components',
    '@fluentui/react-icons',
    'react',
    'react-dom',
  ]);

  for (const scope of pageScope) {
    const component = scope.component
      ? inventory.components.find((component) => component.id === scope.component)
      : undefined;
    if (scope.component && !component)
      throw new Error(`Missing proof component: ${scope.component}`);
    if (component) coverage.push(...accountForStories(component, scope.examples, scope.exclude));
    const guidancePath = path.join(appRoot, 'content', scope.guidance);
    const { data, content } = matter(await fs.readFile(guidancePath, 'utf8'));
    const page = {
      id: scope.id,
      title: data.title,
      summary: data.summary,
      kind: scope.kind ?? 'components',
      route: scope.route,
      label: scope.label ?? data.title,
      standalone: !scope.component,
      renderer: scope.renderer,
      status: scope.status,
      layout: scope.layout,
      hideSummary: scope.hideSummary,
      resources: data.resources ?? [],
      aliases: scope.aliases ?? [],
      legacyIds: [
        ...(scope.legacyIds ?? []),
        ...(scope.kind === 'templates' && scope.component
          ? [`${scope.component}--source-code`]
          : []),
      ],
      migratedFrom: scope.migratedFrom ?? [],
      guidanceSource: `content/${scope.guidance}`,
      guidance: guidanceMarkdown({ ...data, body: content.trim() }),
      examples: [],
      templateSources: [],
      notes: [
        scope.omitDecorators,
        scope.singlePreview,
        ...Object.entries(scope.exclude ?? {}).map(
          ([name, reason]) => `${name} is excluded: ${reason}`,
        ),
      ].filter(Boolean),
      singlePreview: Boolean(scope.singlePreview),
      api:
        component && scope.kind === 'components'
          ? apiReader.readComponent(component, scope.api)
          : [],
    };
    const pageImports = [];
    const pageBindings = [];
    for (const story of component?.stories ?? []) {
      if (scope.examples && !scope.examples.includes(story.exportName)) continue;
      if (scope.exclude?.[story.exportName]) continue;
      const implementationFile = path.join(storyRoot, story.implementationFile);
      const owner = component.sources.find((source) => source.sourceFile === story.sourceFile);
      assertSimpleStory(
        await fs.readFile(implementationFile, 'utf8'),
        story.implementationExport,
        scope.omitDecorators
          ? Object.fromEntries(
              Object.entries(owner.metadata).filter(([key]) => key !== 'decorators'),
            )
          : owner.metadata,
        story.id,
      );
      const extracted = await extractStorySource(story, { root: storyRoot, cache: sourceCache });
      for (const dependency of extracted.requirements) dependencies.add(packageName(dependency));
      const source = normalizeSource(
        `// Copyright (c) Microsoft Corporation.\n// Licensed under the MIT license.\n\n${scopeExampleIds(extracted.snippet, story.id).trim()}\n\nexport default ${story.implementationExport};\n`,
      );
      const filename = `${story.id}.tsx`;
      await fs.writeFile(path.join(exampleDirectory, filename), source);
      const binding = `Example${imports.length}`;
      pageImports.push(`import ${binding} from '../examples/${story.id}';`);
      pageBindings.push(`${JSON.stringify(story.id)}: ${binding}`);
      imports.push(`${JSON.stringify(story.id)}: ${binding}`);
      const description = await readStoryDescriptions(
        implementationFile,
        story.implementationExport,
      );
      page.examples.push({
        id: story.id,
        exportName: story.exportName,
        name: story.name,
        origin: story.origin,
        originalSource: story.implementationFile,
        description: description.description || extracted.description,
        sourcePath: `source/examples/${filename}`,
        source,
        sha256: createHash('sha256').update(source).digest('hex'),
        dependencies: extracted.requirements,
      });
    }
    if (component) {
      const defaults = page.examples.filter((example) => example.exportName === 'Default');
      if (defaults.length !== 1)
        throw new Error(
          `${scope.component}: expected one selected Default example, found ${defaults.length}.`,
        );
      page.defaultExampleId = defaults[0].id;
      page.examples = [defaults[0], ...page.examples.filter((example) => example !== defaults[0])];
    }
    const pageModuleDirectory = path.join(cacheDirectory, 'pages');
    await fs.mkdir(pageModuleDirectory, { recursive: true });
    if (component)
      await fs.writeFile(
        path.join(pageModuleDirectory, `${scope.component}.ts`),
        `import type { ComponentType } from 'react';\n${pageImports.join('\n')}\nexport const examples = {${pageBindings.join(',')}} satisfies Record<string, ComponentType>;\n`,
      );
    if (component)
      loaders.push(
        `${JSON.stringify(scope.component)}: () => import('./pages/${scope.component}')`,
      );
    for (const source of scope.sources ?? []) {
      const name = path.basename(source);
      page.templateSources.push({
        name,
        path: `source/templates/${scope.id}/${name}`,
        source: normalizeSource(await fs.readFile(path.join(storyRoot, source), 'utf8')),
      });
    }
    pages.push(page);
  }
  registry.push(
    `export const loadExamples = {${loaders.join(',')}} satisfies Record<string, () => Promise<{ examples: Record<string, ComponentType> }>>;`,
  );
  const registryFile = path.join(cacheDirectory, 'registry.ts');
  await fs.writeFile(registryFile, `${registry.join('\n')}\n`);
  if (dependencies.has('react-window')) dependencies.add('@types/react-window');
  const metadata = {
    schemaVersion: 1,
    agentPrompt: (
      await fs.readFile(path.join(appRoot, 'content/data/agent-prompt.md'), 'utf8')
    ).trim(),
    basePath,
    versions: Object.fromEntries(
      [...dependencies].sort().map((name) => [name, packageManifest(name).version]),
    ),
    fluentSource: { repository: 'https://github.com/microsoft/fluentui', ref: fluentRef },
    coreaiSourceRef: git(['rev-parse', 'HEAD'], repositoryRoot),
    runtimePackages: {},
    scope: pageScope.map((page) => page.component).filter(Boolean),
    excludedFluentPackages: inventory.scope.excludedFluentPackages,
    coverage,
  };
  const allExamples = new Map(
    pages.flatMap((page) => page.examples).map((example) => [example.id, example]),
  );
  const foundationData = await readFoundationData(appRoot);
  const foundationDataFile = path.join(cacheDirectory, 'foundation-data.ts');
  await fs.writeFile(
    foundationDataFile,
    `import type { FoundationData } from '../../src/reference-proof/foundation-types';\nexport const foundationData = ${JSON.stringify(foundationData, null, 2)} satisfies FoundationData;\n`,
  );
  const generated = await standaloneSections({
    appRoot,
    pages,
    versions: metadata.versions,
    providerSource,
    fence: codeFence,
    foundationData,
  });
  for (const page of pages.filter((page) => page.standalone)) {
    Object.assign(
      page,
      await resolveStandalonePage(page, { pages, basePath, generated, allExamples }),
    );
  }
  await build({
    configFile: false,
    root: appRoot,
    base: basePath,
    publicDir: false,
    plugins: [
      react(),
      {
        name: 'coreai:reference-proof-examples',
        resolveId(id) {
          if (id === 'virtual:reference-proof-examples') return registryFile;
          if (id === 'virtual:reference-foundation-data') return foundationDataFile;
        },
      },
      {
        name: 'coreai:reference-proof-runtime-peers',
        async generateBundle() {
          const modules = [...this.getModuleIds()].filter((id) => !id.startsWith('\0'));
          if (
            modules.some((id) =>
              /\/node_modules\/(?:@storybook\/|storybook\/)/.test(id.replaceAll('\\', '/')),
            )
          ) {
            this.error('Storybook runtime code must not ship in the reference proof.');
          }
          for (const name of ['react', 'react-dom', '@fluentui/react-components']) {
            const marker = `/node_modules/${name}/`;
            const roots = new Set(
              modules
                .map((id) => id.replaceAll('\\', '/'))
                .filter((id) => id.includes(marker))
                .map((id) =>
                  path.normalize(id.slice(0, id.lastIndexOf(marker) + marker.length - 1)),
                ),
            );
            if (roots.size !== 1) {
              this.error(`Expected one bundled ${name} installation; found ${roots.size}.`);
            }
            const [root] = roots;
            const { version } = JSON.parse(
              await fs.readFile(path.join(root, 'package.json'), 'utf8'),
            );
            if (version !== metadata.versions[name]) {
              this.error(`Bundled ${name}@${version} differs from the documentation version.`);
            }
            metadata.runtimePackages[name] = { version, installations: roots.size };
          }
        },
      },
    ],
    resolve: {
      dedupe: ['react', 'react-dom', '@fluentui/react-components', '@fluentui/react-icons'],
    },
    build: {
      outDir,
      emptyOutDir: true,
      manifest: true,
      rollupOptions: { input: path.join(appRoot, 'src/reference-proof/main.tsx') },
    },
  });
  const manifest = JSON.parse(await fs.readFile(path.join(outDir, '.vite/manifest.json'), 'utf8'));
  const entry = Object.values(manifest).find((entry) => entry.isEntry);
  if (!entry) throw new Error('Reference proof bundle has no entry point.');
  const assets = { entry: entry.file, css: entry.css ?? [] };
  const { coreaiLightTheme, coreaiDarkTheme } = await import('@coreai-ds/react-components');
  const stylesheets = await Promise.all(
    assets.css.map((filename) => fs.readFile(path.join(outDir, filename), 'utf8')),
  );
  assets.initialThemeStyles = initialThemeStyles(
    { light: coreaiLightTheme, dark: coreaiDarkTheme },
    stylesheets.join('\n'),
  );
  const write = async (filename, content) => {
    const target = path.join(outDir, filename);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content);
  };
  const navigationGroups = groupNavigationEntries(
    pages.map((page) => ({
      path: `/${page.route}${page.route ? '/' : ''}`,
      title: page.id.startsWith('react-router-') ? `React Router / ${page.label}` : page.label,
      page,
    })),
  );
  const orderedPages = navigationGroups.flatMap((group) => group.items.map((entry) => entry.page));
  const navigation = (currentPath) =>
    navigationGroups
      .map((group) => {
        const active = group.items.some(
          ({ page }) => `${page.route}${page.route ? '/' : ''}` === currentPath,
        );
        const open = group.value === 'getting-started' || active;
        return (
          `<details${open ? ' open' : ''} class="reference-nav-group" data-shell-fallback><summary>${group.label}<svg class="reference-nav-chevron" fill="currentColor" aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M7.65 4.15c.2-.2.5-.2.7 0l5.49 5.46c.21.22.21.57 0 .78l-5.49 5.47a.5.5 0 0 1-.7-.71L12.8 10 7.65 4.85a.5.5 0 0 1 0-.7" fill="currentColor"></path></svg></summary>` +
          group.items
            .map(({ page, title }) => {
              const pagePath = `${page.route}${page.route ? '/' : ''}`;
              return `<a class="reference-nav-link" data-navigation-entry data-navigation-summary="${escapeHtml(page.summary)}"${pagePath === currentPath ? ' aria-current="page"' : ''} href="${basePath}${pagePath}"><span>${escapeHtml(title)}</span></a>`;
            })
            .join('') +
          '</details>'
        );
      })
      .join('');
  const indexPages = [];
  for (const page of orderedPages) {
    const markdown = pageMarkdown(page, metadata);
    const markdownPath = page.route ? `${page.route}.md` : 'index.md';
    const htmlPath = page.route ? `${page.route}/` : '';
    let body = `${page.singlePreview ? '<div data-single-preview></div>' : ''}`;
    body += page.standalone
      ? standalonePageHtml(page, { ...metadata, pages })
      : `${componentPageGuidanceHtml(page, { ...metadata, pages })}\n${renderGuidance(implementationMarkdown(page, metadata, '/')).html}`;
    for (const example of page.standalone ? [] : page.examples) {
      if (example.id !== page.defaultExampleId) body += exampleHtml(example, basePath);
      await write(example.sourcePath, example.source);
    }
    for (const [index, source] of page.templateSources.entries()) {
      body += `<section class="reference-template-source"><h2>Template source: ${escapeHtml(source.name)}</h2><p>Copy this file into your app. Do not import this template from the package.</p>
${sourceHtml(source.source, `template-${page.id}-${index}`, source.path, basePath)}</section>`;
      await write(source.path, source.source);
    }
    await write(markdownPath, markdown);
    await write(
      `${htmlPath}index.html`,
      shell(page.title, body, metadata, assets, navigation(htmlPath), htmlPath),
    );
    for (const alias of page.aliases) {
      const destination = `${basePath}${htmlPath}`;
      await write(
        `${alias.slice(1)}index.html`,
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${destination}"><link rel="canonical" href="${destination}"><title>${escapeHtml(page.title)}</title></head><body><a href="${destination}">Continue to ${escapeHtml(page.title)}</a></body></html>`,
      );
      await write(`${alias.slice(1, -1)}.md`, markdown);
    }
    for (const id of page.legacyIds) await write(`llms/${id}.md`, markdown);
    indexPages.push({
      ...page,
      guidance: undefined,
      htmlPath,
      markdownPath,
      examples: page.examples.map((example) => ({ ...example, source: undefined })),
      templateSources: page.templateSources.map((source) => ({ ...source, source: undefined })),
    });
  }
  await write('source/setup/App.tsx', providerSource);
  await write('agent-prompt.txt', metadata.agentPrompt);
  await write(
    'source/package/SKILL.md',
    await fs.readFile(path.join(repositoryRoot, 'packages/react-components/agent/SKILL.md')),
  );
  for (const mode of ['light', 'dark']) {
    await write(
      `assets/material-1-${mode}.png`,
      await fs.readFile(path.join(appRoot, `public/assets/material-1-${mode}.png`)),
    );
  }
  await write(
    'assets/favicon.svg',
    await fs.readFile(path.join(appRoot, 'public/assets/favicon.svg')),
  );
  for (const frame of [
    'single-logo-effect1-white.png',
    'single-logo-effect2-white.png',
    'single-logo-effect3-white.png',
    'single-logo-effect4-white.png',
  ]) {
    await write(
      `logo-effects/${frame}`,
      await fs.readFile(path.join(appRoot, 'public/logo-effects', frame)),
    );
  }
  const listing = navigationGroups
    .map(
      (group) =>
        `### ${group.label}\n\n${group.items
          .map(
            ({ page, title }) =>
              `- [${title}](${basePath}${page.route ? `${page.route}.md` : 'index.md'}): ${page.summary}`,
          )
          .join('\n')}`,
    )
    .join('\n');
  const introduction = `# CoreAI design system\n\nHelp designers code and help engineers design.\n\nExplore component guidance, working examples, and copy-and-adapt templates. This staged reference catalog contains ${pages.length} pages and ${imports.length} examples. Pages marked under construction still need CoreAI UX guidance review.\n\n[Get started](${basePath}guides/package.md)\n\n${listing}\n`;
  await write(
    'llms.txt',
    `# CoreAI documentation for agents\n\nUse ordinary HTTPS GET to read these static Markdown files. No installation or login is needed.\n\n## Start here\n\n- [Agent workflow](${basePath}guides/agent-workflow.md): targeted retrieval, version checks, imports, and fallbacks.\n- [Build with your agent](${basePath}guides/use-with-agents.md): starter prompt and optional setup.\n- [Reusable skill](${basePath}source/package/SKILL.md): review before saving in a consuming repository.\n- [Starter prompt](${basePath}agent-prompt.txt): add the user's task and paste into an agent.\n- [Exact routes and source metadata](${basePath}llms/index.json): use only when needed; do not fetch every page.\n\nFetch this index once per task. Choose the relevant pages below; reuse fetched documents. Human directory URLs map to .md files, preserving ${basePath}; the homepage maps to ${basePath}index.md. CoreAI UX guidance overrides upstream demonstrations. Check installed package versions before implementing. Templates are copy-and-adapt source, not package exports. Report retrieval failures; never invent APIs.\n\n${introduction}\n## Build versions\n\n${Object.entries(
      metadata.versions,
    )
      .map(([name, version]) => `- ${name}: ${version}`)
      .join(
        '\n',
      )}\n\nFluent source: ${metadata.fluentSource.repository}/tree/${fluentRef}\n\n[Coverage and provenance](${basePath}llms/index.json)\n\nCoreAI guidance takes precedence over upstream API examples. Templates are copyable source, not package exports.\n`,
  );
  await write(
    'llms/index.json',
    `${JSON.stringify({ ...metadata, pages: indexPages }, null, 2)}\n`,
  );
  await write('.nojekyll', '');
  await write(
    'THIRD-PARTY-NOTICES.txt',
    `Examples include Microsoft Fluent UI source from ${metadata.fluentSource.repository}/tree/${fluentRef}.\nCoreAI and Fluent UI examples are licensed under the MIT license.\n\n${await fs.readFile(path.join(path.dirname(require.resolve('@fluentui/react-components/package.json')), 'LICENSE'), 'utf8')}`,
  );
  console.log(
    `Reference proof: ${pages.length} pages, ${imports.length} executable examples, base ${basePath}\n${outDir}`,
  );
  return { ...metadata, pages: indexPages };
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const { values } = parseArgs({ options: { base: { type: 'string', default: '/' } } });
  await buildReferenceProof({ basePath: values.base });
}
