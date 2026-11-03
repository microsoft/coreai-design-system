// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import test from 'node:test';
import matter from 'gray-matter';
import ts from 'typescript';
import {
  readReferencePages,
  standaloneRendererNames,
  wholePageRendererNames,
} from '../scripts/read-reference-pages.mjs';
import {
  expandStandaloneMarkdown,
  rewriteDocumentationLinks,
  tokenSwatches,
  stripPresentationMarkers,
  currentReleaseNotes,
} from '../scripts/standalone-markdown.mjs';
import {
  appRoot,
  codeFence,
  standalonePageHtml,
  componentPageGuidanceHtml,
  pageMarkdown,
} from '../scripts/build-reference-proof.mjs';
import {
  pageGuidanceParts,
  pageTemplateHeader,
  pageTemplateResources,
  presentationResources,
} from '../scripts/page-template.mjs';
import { readFoundationData, standaloneSections } from '../scripts/standalone-sections.mjs';
import { guidanceMarkdown, renderGuidance } from '../../../shared/guidance.mjs';
import { publicMarkdown } from '../scripts/sources/public-markdown.mjs';
import {
  generateStandaloneDocs,
  standaloneDocsRoot,
} from '../../storybook/scripts/generate-standalone-docs.mjs';

test('Showcase keeps its interactive hero without displaying the agent catalog appendix', () => {
  const page = {
    route: '',
    title: 'CoreAI Design System',
    renderer: 'home',
    guidance: '# CoreAI Design System\n\nShared components.\n\n## Components\n\nCatalog appendix.',
    resources: [],
    examples: [],
  };
  const html = standalonePageHtml(page, { basePath: '/', pages: [], agentPrompt: 'Use CoreAI.' });
  assert.match(html, /data-page-widget="home"/);
  assert.match(html, /home-visual/);
  assert.doesNotMatch(
    html,
    /Catalog appendix|home-documentation|home-resource-links|Build with your agent|Give your coding agent/,
  );
  assert.match(html, /<\/header><div class="home-agent-content"><section class="home-agent-entry"/);
  assert.match(html, /<\/section><details class="home-agent-preview" hidden>/);
  assert.match(html, /page-header__title-row"><h1[^>]*>CoreAI Design System<\/h1><\/div>/);
  assert.match(page.guidance, /Catalog appendix/);
  const guidanceHtml = standalonePageHtml(
    { ...page, renderer: undefined },
    { basePath: '/', pages: [] },
  );
  assert.match(guidanceHtml, /Catalog appendix/);
});

test('unfinished status restores standalone states without replacing explicit views or examples', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'coreai-unfinished-pages-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const records = [
    { id: 'unfinished', status: 'under-construction' },
    { id: 'finished', status: 'complete' },
    { id: 'rich', status: 'under-construction', renderer: 'resources' },
    { id: 'component', status: 'under-construction', component: 'button' },
  ];
  for (const { id, status, ...reference } of records) {
    await fs.writeFile(
      path.join(directory, `${id}.md`),
      matter.stringify('Guidance.', {
        id,
        title: id,
        summary: 'A page summary.',
        status,
        reference: { route: `guides/${id}`, ...reference },
      }),
    );
  }
  const pages = await readReferencePages(directory);
  assert.equal(pages.find(({ id }) => id === 'unfinished').renderer, 'work-in-progress');
  assert.equal(pages.find(({ id }) => id === 'finished').renderer, undefined);
  assert.equal(pages.find(({ id }) => id === 'rich').renderer, 'resources');
  assert.equal(pages.find(({ id }) => id === 'component').renderer, undefined);
  assert.equal(pages.find(({ id }) => id === 'component').status, 'under-construction');
  const file = path.join(directory, 'unfinished.md');
  await fs.writeFile(file, (await fs.readFile(file, 'utf8')).replace('under-construction', 'typo'));
  await assert.rejects(
    readReferencePages(directory),
    /status must be complete or under-construction/,
  );
});

test('component and template Markdown cannot silently fall out of the catalog', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'coreai-reference-required-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const components = path.join(directory, 'components');
  await fs.mkdir(components);
  await fs.writeFile(
    path.join(components, 'MissingReference.md'),
    matter.stringify('Guidance.', {
      id: 'missing-reference',
      title: 'Missing reference',
      summary: 'A page summary.',
      status: 'complete',
    }),
  );
  await assert.rejects(readReferencePages(directory), /require reference metadata/);
});

test('unfinished standalone pages retain agent content and native fallback without a duplicate visible title', async () => {
  const pages = await readReferencePages(path.join(appRoot, 'content'));
  assert.deepEqual(
    pages.filter(({ renderer }) => renderer === 'work-in-progress').map(({ route }) => route),
    ['foundations/layout', 'foundations/spacing', 'templates/page-header', 'templates/top-nav'],
  );
  const page = {
    id: 'spacing',
    route: 'foundations/spacing',
    title: 'Spacing',
    standalone: true,
    renderer: 'work-in-progress',
    resources: [],
    guidance: '# Spacing\n\nCoreAI spacing guidance.\n\n## Useful links\n\nKeep this for agents.',
  };
  const metadata = { basePath: '/repo/', pages: [] };
  const html = standalonePageHtml(page, metadata);
  assert.match(html, /class="page-header" hidden[^>]*data-page-title="Spacing"/);
  assert.match(html, /data-markdown-url="\/repo\/foundations\/spacing.md"/);
  assert.match(html, /data-under-construction="true"/);
  assert.match(html, /data-page-widget="work-in-progress"/);
  assert.match(html, /<h1[^>]*>Page under construction<\/h1>/);
  assert.match(html, /src="\/repo\/assets\/favicon.svg"/);
  assert.match(html, /Share a suggestion/);
  assert.doesNotMatch(html, /Keep this for agents/);
  assert.match(pageMarkdown(page, metadata), /Keep this for agents/);
});

test('unfinished component guidance restores the original inline state without losing examples or authored guidance', () => {
  const page = {
    id: 'button',
    route: 'components/button',
    title: 'Button',
    status: 'under-construction',
    summary: 'A button.',
    body: '## Usage\n\nKeep authored guidance.',
    resources: [],
    defaultExampleId: 'button--default',
    examples: [
      {
        id: 'button--default',
        name: 'Default',
        source: '<Button />',
        sourcePath: 'source/button--default.tsx',
      },
    ],
  };
  page.guidance = guidanceMarkdown(page);
  const html = componentPageGuidanceHtml(page, { basePath: '/' });
  assert.match(html, /data-example-id="button--default"/);
  assert.match(html, /data-page-widget="work-in-progress"/);
  assert.match(html, /<h2[^>]*>Page under construction<\/h2>/);
  assert.doesNotMatch(html, /work-in-progress--page|>Status<\/h2>/);
  assert.match(html, /Keep authored guidance/);
  const finished = componentPageGuidanceHtml({ ...page, status: 'complete' }, { basePath: '/' });
  assert.doesNotMatch(finished, /data-page-widget="work-in-progress"/);
});

test('restored component and template pages retain reviewed guidance and legacy routes', async () => {
  const pages = await readReferencePages(path.join(appRoot, 'content'));
  const byId = new Map(pages.map((page) => [page.id, page]));
  assert.equal(byId.get('page-header').route, 'templates/page-header');
  assert.equal(byId.get('page-header').kind, 'templates');
  assert.equal(byId.get('top-nav').route, 'templates/top-nav');
  assert.equal(byId.get('top-nav').kind, 'templates');
  assert.equal(byId.get('status-indicator').route, 'components/status-indicator');
  assert.equal(byId.get('status-indicator').status, 'complete');

  for (const id of [
    'avatar-group',
    'compound-button',
    'info-button',
    'interaction-tag',
    'presence-badge',
    'split-button',
    'to-mount-node-props',
  ]) {
    assert.equal(byId.get(id).status, 'complete', `${id} should use reviewed guidance`);
  }

  const routes = new Set(pages.flatMap((page) => [`/${page.route}/`, ...(page.aliases ?? [])]));
  for (const route of [
    '/avatar-pie/',
    '/data-grid-cell-action-header/',
    '/data-grid-cell-large/',
    '/data-grid-cell-small/',
    '/data-grid-cell-smaller/',
    '/data-grid-content-header/',
    '/empty-states/',
    '/left-nav/',
    '/list-content/',
    '/menu-item/',
    '/menu-section/',
    '/menu-split-item/',
    '/radio/',
    '/static-progress-bar/',
    '/swatch/',
    '/horizontal-tab/',
    '/vertical-tab/',
    '/vertical-tab-list/',
    '/tag-picker-dropdown/',
    '/tag-picker-item/',
    '/tag-picker-secondary-action/',
  ]) {
    assert.ok(routes.has(route), `Missing legacy route ${route}`);
  }
  for (const page of pages.filter(({ kind }) => ['components', 'templates'].includes(kind))) {
    assert.ok(
      routes.has(`/${page.id}/`),
      `Missing root alias /${page.id}/ for ${page.guidanceSource}`,
    );
  }

  const utility = await fs.readFile(
    path.join(appRoot, 'content/components/to-mount-node-props.md'),
    'utf8',
  );
  assert.match(utility, /Utility function that normalizes/);
  assert.match(utility, /from '@coreai-ds\/react-components'/);
  assert.doesNotMatch(utility, /from '@fluentui\/react-components'/);
});

test('deleted pages are absent from canonical routes, aliases and legacy document IDs', async () => {
  const pages = await readReferencePages(path.join(appRoot, 'content'));
  const routes = new Set(pages.flatMap((page) => [`/${page.route}/`, ...(page.aliases ?? [])]));
  for (const route of [
    '/components/using-components/',
    '/templates/using-templates/',
    '/guides/prototyping/',
    '/guides/react-grab/',
    '/patterns/web-ui-guidelines/',
    '/guides/setup/',
    '/prototyping/',
    '/react-grab/',
    '/web-ui-guidelines/',
  ]) {
    assert.ok(!routes.has(route), `${route} was removed, not hidden`);
  }
  assert.ok(!pages.some((page) => page.legacyIds?.includes('docs-react-grab--docs')));
});

test('retained legacy standalone routes have a Markdown-owned page or alias', async () => {
  const pages = await readReferencePages(path.join(appRoot, 'content'));
  const registry = JSON.parse(await fs.readFile(path.join(appRoot, 'site-registry.json'), 'utf8'));
  const routes = new Set(
    pages.flatMap((page) => [`/${page.route}${page.route ? '/' : ''}`, ...(page.aliases ?? [])]),
  );
  for (const page of registry.pages) {
    if (page.id === 'prototyping') {
      assert.ok(!routes.has(page.slug), 'Prototyping was explicitly removed');
    } else {
      assert.ok(routes.has(page.slug), `Missing migrated route ${page.slug}`);
    }
  }
  for (const redirect of registry.redirects.filter((redirect) =>
    registry.pages.some((page) => page.slug === redirect.to),
  )) {
    assert.ok(routes.has(redirect.from), `Missing legacy redirect ${redirect.from}`);
  }
  assert.ok(pages.some((page) => page.kind === 'foundations'));
  assert.ok(pages.some((page) => page.kind === 'patterns'));
  const ids = new Set(
    pages.flatMap((page) => [
      ...(page.legacyIds ?? []),
      ...(page.kind === 'templates' && page.component ? [`${page.component}--source-code`] : []),
    ]),
  );
  assert.equal(ids.size, 18, 'Retain standalone Storybook document endpoints except React Grab');
  for (const id of [
    'docs-theming--docs',
    'docs-styling-with-css-modules--docs',
    'templates-react-router-router-link-slots--source-code',
  ])
    assert.ok(ids.has(id));
});

test('Markdown includes and generated sections expand without evaluating code fences', async () => {
  const input =
    '## Colors\n\n<!-- generated: colors -->\n\n```md\n<!-- generated: unknown -->\n```\n\n<!-- include: router-link-slots -->';
  const output = await expandStandaloneMarkdown(input, {
    route: 'foundations/colors',
    pages: [],
    basePath: '/repo/',
    generated: { colors: 'A real token table.' },
    renderExample: () => {
      throw new Error('Unexpected example');
    },
    fence: codeFence,
  });
  assert.match(output, /A real token table/);
  assert.match(output, /<!-- generated: unknown -->/);
  assert.match(output, /export function useRouterLinkSlot/);
  assert.match(output, /registerPlugin|useRouterNavLinkSlot/);
  await assert.rejects(
    expandStandaloneMarkdown('<!-- include: secrets -->', { fence: codeFence }),
    /Unknown included/,
  );
  await assert.rejects(
    expandStandaloneMarkdown('<!-- include: constructor -->', { fence: codeFence }),
    /Unknown included/,
  );
  await assert.rejects(
    expandStandaloneMarkdown('<!-- generated: unknown -->', { generated: {} }),
    /Unknown generated/,
  );
  await assert.rejects(expandStandaloneMarkdown('<!-- include: ../outside -->', {}), /Malformed/);
});

test('agent handoff and skill use HTTP discovery without requiring installation', async () => {
  const skillPath = path.resolve(appRoot, '../../packages/react-components/agent/SKILL.md');
  const source = await fs.readFile(skillPath, 'utf8');
  const skill = matter(source);
  assert.equal(skill.data.name, 'coreai-ds-fluentui-react');
  assert.ok(skill.data.description.length > 0 && skill.data.description.length <= 1024);
  assert.match(skill.data.description, /HTTPS/);
  assert.match(source, /llms\.txt/);
  assert.match(source, /llms\/index\.json/);
  assert.match(source, /once per task/);
  assert.match(source, /Get the user's\s+approval/);
  assert.doesNotMatch(source, /\bMCP\b|docs-list|docs-show|azurewebsites/i);
  const prompt = (
    await fs.readFile(path.join(appRoot, 'content/data/agent-prompt.md'), 'utf8')
  ).trim();
  assert.match(prompt, /No installation is needed/);
  assert.match(prompt, /without overwriting existing instructions/);
  const expanded = await expandStandaloneMarkdown('<!-- include: agent-prompt -->', {
    route: 'guides/use-with-agents',
    pages: [],
    basePath: '/repo/',
    fence: codeFence,
  });
  assert.ok(expanded.includes(prompt));
  const pages = await readReferencePages(path.join(appRoot, 'content'));
  assert.equal(
    pages.find((page) => page.route === 'guides/mcp-setup'),
    undefined,
  );
  const entry = pages.find((page) => page.route === 'guides/use-with-agents');
  assert.ok(entry.aliases.includes('/mcp-server/'));
  assert.ok(entry.aliases.includes('/guides/mcp-setup/'));
});

test('site release notes omit retired integration entries without changing package history', () => {
  const source =
    '# History\n\n## 1.0\n\n### Changed\n\n- Keep component behavior.\n- MCP client setup changed.\n- Keep package install.\n\n### Added\n\n- MCP endpoint.\n';
  const filtered = currentReleaseNotes(source);
  assert.match(filtered, /Keep component behavior/);
  assert.match(filtered, /Keep package install/);
  assert.doesNotMatch(filtered, /\bMCP\b/);
  assert.match(source, /MCP client setup changed/);
});
test('links use canonical routes, base paths and HTML heading IDs without changing code samples', () => {
  const pages = [
    {
      route: 'foundations/theming',
      aliases: ['/theming/'],
      legacyIds: ['docs-theming--docs'],
      guidanceSource: 'content/foundations/theming.md',
    },
    { route: 'components/field', guidanceSource: 'content/components/Field.md' },
  ];
  const input =
    '[Theme](../foundations/theming.md#set-up-aptos)\n\n[Field](../components/Field.md)\n\n[Old](/theming.md)\n\n[Storybook](https://coreai-ds-storybook.azurewebsites.net/?path=/docs/docs-theming--docs)\n\n```md\n[Example](../do-not-rewrite.md)\n```';
  const options = {
    route: 'guides/package',
    pages,
    basePath: '/repo/',
    sourceFile: 'apps/docsite/content/guides/package.md',
  };
  const markdown = rewriteDocumentationLinks(input, options);
  assert.match(markdown, /\/repo\/foundations\/theming\.md#set-up-aptos/);
  assert.match(markdown, /\/repo\/components\/field\.md/);
  assert.doesNotMatch(markdown, /azurewebsites\.net/);
  assert.match(markdown, /\[Example\]\(\.\.\/do-not-rewrite\.md\)/);
  const html = rewriteDocumentationLinks(markdown, { ...options, html: true });
  assert.match(html, /\/repo\/foundations\/theming\/#guidance-set-up-aptos/);
  assert.doesNotMatch(html, /\/repo\/repo\//);
  assert.equal(
    tokenSwatches('<td>#ff00aa</td>'),
    '<td><span class="reference-color-swatch" style="background-color:#ff00aa" aria-hidden="true"></span><code>#ff00aa</code></td>',
  );
  assert.match(
    tokenSwatches('<td>hsl(0, 0%, 6%)</td>'),
    /style="background-color:hsl\(0, 0%, 6%\)"/,
  );
  assert.match(tokenSwatches('<td>rgba(0, 0, 0, 0.5)</td>'), /class="reference-color-swatch"/);
  assert.equal(
    tokenSwatches('<td>hsl(0, 0%, 6%); color:red</td>'),
    '<td>hsl(0, 0%, 6%); color:red</td>',
  );
});

test('only registered live examples become preview slots in authored guidance', () => {
  const html = renderGuidance('# Guide\n\n<!-- live-example:components-text--presets -->', {
    examples: { 'components-text--presets': { id: 'components-text--presets', name: 'Presets' } },
  }).html;
  assert.match(html, /data-example-id="components-text--presets"/);
  assert.match(html, /class="preview"/);
  assert.throws(() => renderGuidance('<!-- live-example:unknown -->'), /Missing live example/);
  assert.throws(() => renderGuidance('<!-- live-example:constructor -->'), /Missing live example/);
  const referenced = renderGuidance(
    '## [Unreleased]\n\n[Unreleased]: #unreleased\n\n[Top](#)\n\n[Already scoped](#guidance-unreleased)',
  ).html;
  assert.match(referenced, /href="#guidance-unreleased"/);
  assert.doesNotMatch(referenced, /href="#unreleased"|guidance-guidance/);
  assert.match(referenced, /href="#"/);
});

test('page templates preserve rich summaries and present canonical resources as separate links', () => {
  const resources = [
    { label: 'Components', url: '/index.md#components' },
    { label: 'Figma & design', url: 'https://www.figma.com/' },
  ];
  const guidance =
    '# CoreAI\n\nUse **CoreAI** with `React`.\n\n## Setup\n\nKeep this guidance.\n\n## Resources\n\n- [Components](/index.md#components)';
  const parts = pageGuidanceParts(guidance, resources);
  assert.equal(parts.headingId, 'guidance-coreai');
  assert.match(parts.summaryHtml, /<strong>CoreAI<\/strong>.*<code>React<\/code>/);
  assert.match(parts.body, /Keep this guidance/);
  assert.doesNotMatch(parts.body, /## Resources/);
  const page = { title: 'CoreAI', route: '', resources };
  const metadata = { basePath: '/repo/', pages: [{ route: '' }] };
  assert.deepEqual(presentationResources(page, metadata), [
    { label: 'Components', href: '/repo/#guidance-components' },
    { label: 'Figma & design', href: 'https://www.figma.com/' },
  ]);
  assert.match(pageTemplateHeader(page, metadata, parts), /data-markdown-url="\/repo\/index.md"/);
  const html = pageTemplateResources(page, metadata);
  assert.match(html, /class="component-resource-card"/);
  assert.match(html, /Figma &amp; design/);
  assert.throws(() => pageGuidanceParts('# Missing summary'), /title and summary/);
  assert.throws(
    () =>
      presentationResources(
        { ...page, resources: [{ label: 'Invalid', url: 'javascript:alert(1)' }] },
        metadata,
      ),
    /Unsupported page resource/,
  );
});

test('registered custom views keep readable fallbacks, heading IDs and code-fenced markers', () => {
  const markdown =
    '## Palette\n\n<!-- view:colors -->\n\n### Brand ramps\n\nFallback content.\n\n<!-- /view:colors -->\n\n```md\n<!-- view:colors -->\n<!-- /view:colors -->\n```';
  const { html } = renderGuidance(markdown, { views: { colors: true } });
  assert.match(html, /data-page-widget="colors"/);
  assert.match(html, /id="guidance-brand-ramps"/);
  assert.match(html, /Fallback content/);
  assert.match(html, /&#x3C;!-- view:colors -->/);
  const stripped = stripPresentationMarkers(markdown);
  assert.match(stripped, /Fallback content/);
  assert.equal(
    stripped.split('<!-- view:colors -->').length,
    2,
    'Keep the code-fenced example only',
  );
  assert.throws(() => renderGuidance(markdown), /Unknown page view/);
  assert.throws(
    () => renderGuidance('<!-- view:colors -->', { views: { colors: true } }),
    /Unclosed page view/,
  );
  assert.throws(() => renderGuidance('<!-- view:constructor -->'), /Unknown page view/);
});

test('standalone renderers stay bounded and whole-page views are explicit', () => {
  assert.deepEqual(standaloneRendererNames, [
    'home',
    'colors',
    'typography',
    'materials',
    'resources',
    'faqs',
    'package',
    'changelog',
    'package-skill',
    'agent-workflow',
    'content',
    'work-in-progress',
  ]);
  assert.ok(wholePageRendererNames.every((name) => standaloneRendererNames.includes(name)));
  assert.ok(!wholePageRendererNames.includes('home'));
  assert.ok(!wholePageRendererNames.includes('colors'));
});

test('overview pages opt into their Markdown-backed rich views', async () => {
  const pages = await readReferencePages(path.join(appRoot, 'content'));
  const introduction = pages.find((page) => page.route === 'overview/introduction');
  const introductionSource = matter(
    await fs.readFile(path.join(appRoot, 'content', introduction.guidance), 'utf8'),
  );
  const introductionGuidance = guidanceMarkdown({
    ...introductionSource.data,
    body: introductionSource.content.trim(),
  });
  assert.ok(introduction?.aliases.includes('/overview/resources/'));
  assert.ok(introduction?.aliases.includes('/resources/'));
  assert.doesNotMatch(introductionGuidance, /Why CoreAI has a shared design system/);
  assert.match(introductionGuidance, /<!-- view:resources -->/);
  assert.match(
    standalonePageHtml(
      {
        ...introduction,
        ...introductionSource.data,
        guidance: introductionGuidance,
        examples: [],
      },
      { basePath: '/', pages },
    ),
    /data-page-widget="resources".*id="guidance-assets"/s,
  );
  assert.equal(
    pages.find((page) => page.route === 'overview/resources'),
    undefined,
  );
  assert.equal(pages.find((page) => page.route === 'overview/faq')?.renderer, 'faqs');
});

test('package guidance opts into its Markdown-backed setup view', async () => {
  const pages = await readReferencePages(path.join(appRoot, 'content'));
  const page = pages.find((candidate) => candidate.route === 'guides/package');
  assert.ok(page);
  assert.equal(page.renderer, 'package');
  const guidance = await fs.readFile(path.join(appRoot, 'content', page.guidance), 'utf8');
  assert.match(guidance, /## Let your agent handle setup/);
  assert.match(guidance, /<!-- include: package-readme -->/);
});

test('release and skill pages opt into scanning views without duplicating their sources', async () => {
  const pages = await readReferencePages(path.join(appRoot, 'content'));
  const changelog = pages.find((candidate) => candidate.route === 'overview/changelog');
  const skill = pages.find((candidate) => candidate.route === 'guides/package-skill');
  assert.equal(changelog?.renderer, 'changelog');
  assert.equal(skill?.renderer, 'package-skill');
  const changelogSource = await fs.readFile(
    path.join(appRoot, 'content', changelog.guidance),
    'utf8',
  );
  const skillSource = await fs.readFile(path.join(appRoot, 'content', skill.guidance), 'utf8');
  assert.match(changelogSource, /<!-- include: package-release-notes -->/);
  assert.match(skillSource, /<!-- include: package-skill -->/);
});

test('workflow and content pages use bounded views backed by their complete Markdown', async () => {
  const pages = await readReferencePages(path.join(appRoot, 'content'));
  const workflow = pages.find((candidate) => candidate.route === 'guides/agent-workflow');
  const content = pages.find((candidate) => candidate.route === 'foundations/content');
  assert.equal(workflow?.renderer, 'agent-workflow');
  assert.equal(content?.renderer, 'content');
  const workflowSource = await fs.readFile(
    path.join(appRoot, 'content', workflow.guidance),
    'utf8',
  );
  const contentSource = await fs.readFile(path.join(appRoot, 'content', content.guidance), 'utf8');
  assert.match(workflowSource, /\*\*Find the index\.\*\*/);
  assert.match(contentSource, /\*\*Bad:\*\*[\s\S]*\*\*Better:\*\*/);
  assert.match(contentSource, /## Get help/);
});

test('custom foundation views and published Markdown share authored tokens, presets and fonts', async () => {
  const data = await readFoundationData(appRoot);
  const sections = await standaloneSections({
    appRoot,
    pages: [],
    versions: {},
    providerSource: '',
    fence: codeFence,
    foundationData: data,
  });
  const themes = await import('@coreai-ds/react-components');
  for (const row of data.colors) {
    assert.ok(sections.colors.includes(row.token));
    assert.ok(sections.colors.includes(row.description));
    for (const theme of [
      'coreaiLightTheme',
      'coreaiDarkTheme',
      'azureLightTheme',
      'azureDarkTheme',
    ])
      assert.ok(sections.colors.includes(themes[theme][row.token]));
  }
  for (const row of data.dataViz) assert.ok(sections['data-visualization'].includes(row.value));
  for (const row of data.typography) assert.ok(sections.typography.includes(row.strongPreset));
  assert.equal(data.fonts.length, 2);
  for (const font of data.fonts) {
    assert.ok(sections['font-families'].includes(font.name));
    assert.ok(sections['font-families'].includes(font.token));
    assert.ok(sections['font-families'].includes(font.download));
  }
});

test('Storybook snapshots embed canonical Markdown for manifest-only readers without a second authored copy', async () => {
  const mirrors = await generateStandaloneDocs();
  assert.equal(mirrors.length, 4);
  assert.ok(!mirrors.includes('ReactGrab.mdx'));
  const pages = await readReferencePages(path.join(appRoot, 'content'));
  for (const filename of ['Theming', 'VariationsFromFluent', 'StylingWithCssModules', 'MCPSetup']) {
    const snapshot = await fs.readFile(path.join(standaloneDocsRoot, `${filename}.mdx`), 'utf8');
    const page = pages.find((page) =>
      page.migratedFrom?.some((source) => source.endsWith(`/docs/${filename}.mdx`)),
    );
    const sourceFile = path.join(appRoot, 'content', page.guidance);
    assert.ok(snapshot.includes(publicMarkdown(await fs.readFile(sourceFile, 'utf8'), sourceFile)));
    assert.doesNotMatch(snapshot, /import content from/);
  }
  const file = path.join(appRoot, 'content/foundations/theming.md');
  const mirror = publicMarkdown(await fs.readFile(file, 'utf8'), file);
  assert.doesNotMatch(mirror, /migratedFrom:|legacyIds:/);
  assert.match(mirror, /Open live example/);
  assert.match(mirror, /Only Microsoft-hosted projects/);
});

test('content principles, workflow, examples and support details survive migration in full', async () => {
  const source = await fs.readFile(path.join(appRoot, 'src/pages/Content.tsx'), 'utf8');
  const markdown = (
    await fs.readFile(path.join(appRoot, 'content/foundations/content.md'), 'utf8')
  ).replace(/\s+/g, ' ');
  const ast = ts.createSourceFile(
    'Content.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let checked = 0;
  for (const statement of ast.statements.filter(ts.isVariableStatement)) {
    for (const declaration of statement.declarationList.declarations) {
      if (
        !['principles', 'contentDesignSteps', 'supportSteps', 'editingChecklist'].includes(
          declaration.name.getText(ast),
        )
      )
        continue;
      const visit = (node) => {
        if (ts.isStringLiteralLike(node)) {
          assert.ok(
            markdown.includes(node.text.replace(/\s+/g, ' ')),
            `Missing original content: ${node.text}`,
          );
          checked++;
        }
        ts.forEachChild(node, visit);
      };
      visit(declaration.initializer);
    }
  }
  assert.ok(checked > 40, 'Check original details, not only section headings');
});
