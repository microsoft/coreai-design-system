// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { readReferencePages } from '../scripts/read-reference-pages.mjs';
import { readSourceCatalog, storyRoot } from '../scripts/sources/catalog.mjs';
import { serveReferenceProof } from '../scripts/serve-reference-proof.mjs';
import {
  normalizeBase,
  escapeHtml,
  codeFence,
  normalizeSource,
  assertSimpleStory,
  accountForStories,
  pageMarkdown,
  exampleHeadingHtml,
  componentPageGuidanceHtml,
  scopeExampleIds,
  initialThemeStyles,
} from '../scripts/build-reference-proof.mjs';

test('initial paint uses the active CoreAI tokens, including referenced token aliases', () => {
  const light = {
    colorNeutralForeground1: '#102030',
    colorNeutralForeground2: '#304050',
    colorNeutralForeground3: '#506070',
    colorNeutralBackground1: '#f0f1f2',
    colorNeutralBackground4: '#e0e1e2',
    colorNeutralBackground6: '#c0c1c2',
    colorNeutralStrokeSubtle: 'var(--colorNeutralBackground4)',
    colorBrandBackground: '#501090',
  };
  const dark = {
    ...light,
    colorNeutralForeground1: '#f0e0d0',
    colorNeutralForeground2: '#d0c0b0',
    colorNeutralForeground3: '#a09080',
    colorNeutralBackground1: '#202122',
    colorNeutralBackground4: '#101112',
    colorNeutralBackground6: '#000102',
  };
  const styles = initialThemeStyles(
    { coreai: { light, dark } },
    'h1{color:var(--colorNeutralForeground1)}main{border-color:var(--colorNeutralStrokeSubtle);color:var(--mf-text-low)}',
  );
  assert.match(styles, /:root\{[^}]*--colorNeutralForeground1:#102030/);
  assert.match(styles, /:root\{[^}]*--colorNeutralForeground2:#304050/);
  assert.match(styles, /:root\{[^}]*--colorNeutralForeground3:#506070/);
  assert.match(styles, /:root\{[^}]*--colorNeutralBackground4:#e0e1e2/);
  assert.match(styles, /:root\[data-theme="dark"\]\{[^}]*--colorNeutralForeground2:#d0c0b0/);
  assert.match(styles, /:root\[data-theme="dark"\]\{[^}]*--colorNeutralForeground3:#a09080/);
  assert.match(styles, /:root\[data-theme="dark"\]\{[^}]*--colorNeutralBackground4:#101112/);
  assert.match(styles, /background:var\(--colorNeutralBackground1\)/);
  assert.match(styles, /background:var\(--colorNeutralBackground6\)/);
  assert.match(styles, /color:var\(--colorNeutralForeground3\)/);
  assert.match(styles, /@media\(prefers-color-scheme:dark\)\{:root:not\(\[data-theme\]\)/);
  assert.doesNotMatch(styles, /--mf-text-low:|--colorBrandBackground:/);
});

test('initial paint includes each brand in both color modes and the system fallback', () => {
  const themes = Object.fromEntries(
    ['coreai', 'azure'].map((brand) => [
      brand,
      Object.fromEntries(
        ['light', 'dark'].map((mode) => [
          mode,
          {
            colorBrandBackground: `${brand}-${mode}`,
            colorNeutralBackground1: 'neutral-light',
            colorNeutralBackground6: 'neutral-dark',
            colorNeutralForeground2: 'neutral-text',
            colorNeutralForeground3: 'neutral-body',
          },
        ]),
      ),
    ]),
  );
  const styles = initialThemeStyles(themes, 'button{background:var(--colorBrandBackground)}');
  for (const brand of ['coreai', 'azure']) {
    const root = brand === 'coreai' ? ':root' : ':root[data-brand="azure"]';
    const rules = [
      [root, 'light'],
      [`${root}[data-theme="dark"]`, 'dark'],
      [`@media(prefers-color-scheme:dark){${root}:not([data-theme])`, 'dark'],
    ];
    for (const [selector, mode] of rules) {
      const rule = styles.split(`${selector}{`)[1]?.split('}')[0];
      assert.ok(rule, `${brand} ${mode} selector is present`);
      assert.ok(rule.includes(`--colorBrandBackground:${brand}-${mode}`));
      assert.ok(rule.includes('--colorNeutralForeground2:neutral-text'));
      assert.ok(rule.includes('--colorNeutralForeground3:neutral-body'));
      assert.ok(rule.includes('color:var(--colorNeutralForeground3)'));
      assert.ok(
        rule.includes(`background:var(--colorNeutralBackground${mode === 'dark' ? 6 : 1})`),
      );
    }
  }
});

test('local preview retains lazy chunks for open tabs across rebuilds', async () => {
  const outDir = await fs.mkdtemp(path.join(os.tmpdir(), 'reference-preview-'));
  let server;
  try {
    await fs.mkdir(path.join(outDir, 'llms'));
    await fs.mkdir(path.join(outDir, 'assets'));
    await fs.writeFile(
      path.join(outDir, 'llms/index.json'),
      JSON.stringify({ basePath: '/repo/' }),
    );
    const before = path.join(outDir, 'assets/view-before.js');
    await fs.writeFile(before, 'export const view = "before";');
    server = await serveReferenceProof({ port: 0, outDir });
    const origin = `http://127.0.0.1:${server.httpServer.address().port}/repo/assets/`;
    await fs.rm(before);
    await fs.writeFile(path.join(outDir, 'assets/main-after.js'), 'import "./view-after.js";');
    const after = path.join(outDir, 'assets/view-after.js');
    await fs.writeFile(after, 'export const view = "after";');
    assert.equal((await globalThis.fetch(`${origin}main-after.js`)).status, 200);
    await fs.rm(after);
    for (const version of ['before', 'after']) {
      const response = await globalThis.fetch(`${origin}view-${version}.js`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /javascript/);
      assert.equal(await response.text(), `export const view = "${version}";`);
    }
    assert.equal((await globalThis.fetch(`${origin}missing.js`)).status, 404);
  } finally {
    if (server) await new Promise((resolve) => server.httpServer.close(resolve));
    await fs.rm(outDir, { recursive: true, force: true });
  }
});

test('the staged Markdown catalog covers every selected core and template group', async () => {
  const pages = await readReferencePages(path.resolve(storyRoot, '..', 'docsite', 'content'));
  const catalog = await readSourceCatalog();
  assert.deepEqual(
    pages
      .map((page) => page.component)
      .filter(Boolean)
      .sort(),
    catalog.components.map((component) => component.id).sort(),
  );
  assert.ok(!pages.some((page) => page.component === 'components-nav'));
  for (const page of pages) {
    assert.equal(page.examples, undefined, `${page.component}: include all selected examples`);
    if (page.kind === 'templates' && page.component) {
      for (const source of page.sources) await fs.access(path.join(storyRoot, source));
    }
  }
});

test('Markdown owns page routes, scope, and template downloads without a scripted page list', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'reference-pages-'));
  try {
    await fs.mkdir(path.join(root, 'components'));
    await fs.mkdir(path.join(root, 'templates'));
    await fs.mkdir(path.join(root, 'generated'));
    const writePage = (filename, reference) =>
      fs.writeFile(
        path.join(root, filename),
        `---\nid: example\ntitle: Example\nsummary: Useful guidance.\nreference:\n${reference}\n---\n\nGuidance.`,
      );
    await writePage('components/Button.md', '  component: components-button');
    await writePage(
      'templates/Example.md',
      '  component: templates-example\n  sources: [src/stories/templates/Example.tsx]',
    );
    await fs.writeFile(path.join(root, 'generated/ignored.md'), '---\nreference: invalid\n---');
    const pages = await readReferencePages(root);
    assert.deepEqual(
      pages.map((page) => `${page.kind}/${page.id}`),
      ['components/button', 'templates/example'],
    );
    assert.equal(pages[0].examples, undefined, 'All examples are selected by default');
    await writePage('components/Button.md', '  component: components-button\n  examples: []');
    await assert.rejects(readReferencePages(root), /nonempty list/);
    await writePage('components/Button.md', '  component: components-button\n  unknown: true');
    await assert.rejects(readReferencePages(root), /unknown reference field/);
    await writePage(
      'components/Button.md',
      '  component: components-button\n  route: components/../outside',
    );
    await assert.rejects(readReferencePages(root), /reference route/);
    await writePage(
      'components/Button.md',
      '  component: components-button\n  route: templates/example',
    );
    await assert.rejects(readReferencePages(root), /template pages must provide/);
    await writePage('components/Button.md', '  component: components-button');
    await writePage(
      'templates/Example.md',
      '  component: templates-example\n  sources: [src/stories/templates/../private.tsx]',
    );
    await assert.rejects(readReferencePages(root), /reference.sources must name/);
    await writePage(
      'templates/Example.md',
      '  component: templates-example\n  route: components/button',
    );
    await assert.rejects(readReferencePages(root), /Duplicate reference page route/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('base paths preserve a repository prefix and reject unsafe or ambiguous paths', () => {
  assert.equal(normalizeBase(), '/');
  assert.equal(normalizeBase('/coreai-design-system'), '/coreai-design-system/');
  assert.equal(normalizeBase('/docs/v1/'), '/docs/v1/');
  for (const value of [
    'docs',
    'https://example.com/',
    '//example.com/',
    '/docs//',
    '/docs/../',
    '/./',
    '/docs?version=1',
    '/docs#example',
    '/docs\\example',
  ]) {
    assert.throws(() => normalizeBase(value), /Base path/);
  }
});

test('source is HTML-escaped and Markdown fences survive embedded code fences', () => {
  assert.equal(
    escapeHtml('<script>"&\'</script>'),
    '&lt;script&gt;&quot;&amp;&#39;&lt;/script&gt;',
  );
  const source = 'const markdown = "```tsx\\nexample\\n```";\n';
  assert.equal(codeFence(source), `\`\`\`\`tsx\n${source.trimEnd()}\n\`\`\`\``);
});

test('generated source uses LF so browser copy, downloads and Markdown agree on Windows', () => {
  assert.equal(normalizeSource('first\r\nsecond\rthird\n'), 'first\nsecond\nthird\n');
  assert.equal(normalizeSource('const escaped = "\\r\\n";\r\n'), 'const escaped = "\\r\\n";\n');
});

test('co-located examples scope literal and template DOM IDs with matching accessibility references', () => {
  const source =
    'export const Example = () => <><label htmlFor="menu">Menu</label><div id="menu" /><a href="#menu">Jump</a><div id={`card-${index}`} aria-labelledby={`card-${index}`} /><span aria-controls="menu other" /></>;';
  const result = scopeExampleIds(source, 'component--example');
  assert.match(result, /id="component--example-menu"/);
  assert.match(result, /htmlFor="component--example-menu"/);
  assert.match(result, /href="#component--example-menu"/);
  assert.match(result, /aria-controls="component--example-menu other"/);
  assert.match(result, /id=\{`component--example-card-\$\{index\}`\}/);
  assert.match(result, /aria-labelledby=\{`component--example-card-\$\{index\}`\}/);
  assert.equal(
    scopeExampleIds('export const Example = () => <div id={useId("unique")} />;', 'example'),
    'export const Example = () => <div id={useId("unique")} />;',
  );
});

test('example headings cannot collide with authored component headings', () => {
  const html = exampleHeadingHtml({
    id: 'templates-empty-state--default',
    name: 'Empty state',
    origin: 'local',
    description: '[Return to example](#empty-state).',
  });
  assert.match(html, /id="templates-empty-state--default-empty-state"/);
  assert.doesNotMatch(html, /Return to example|Source:/);
  assert.doesNotMatch(html, /id="guidance-empty-state"/);
});

test('working component and template previews do not show construction placeholders', () => {
  for (const kind of ['components', 'templates']) {
    const example = {
      id: 'example--default',
      name: 'Default',
      origin: 'local',
      description: 'Imported story descriptor.',
      sourcePath: 'source/examples/default.tsx',
      source: 'export default function Example() { return null; }\n',
    };
    const page = {
      id: 'example',
      route: `${kind}/example`,
      title: 'Example',
      kind,
      status: 'under-construction',
      guidance: '# Example\n\nThe page summary.\n\n## Behavior\n\nKeep authored guidance.',
      resources: [],
      examples: [example],
      defaultExampleId: example.id,
    };
    const metadata = { basePath: '/' };
    const html = componentPageGuidanceHtml(page, metadata);
    assert.match(html, /data-example-id="example--default"/);
    assert.match(html, /Keep authored guidance\./);
    assert.doesNotMatch(html, /Page under construction|Imported story descriptor\./);
    assert.match(
      componentPageGuidanceHtml({ ...page, examples: [], defaultExampleId: undefined }, metadata),
      /Page under construction/,
    );
  }
});

test('simple function and object examples do not require Storybook runtime', () => {
  for (const source of [
    'export const Default = () => <button>Example</button>;',
    'export function Default(props: { label?: string }) { return <button>{props.label}</button>; }',
    'export const Default: StoryObj = { render: () => <button>Example</button>, parameters: { controls: { disable: true } } };',
    'export const Default = () => null; Default.play = async () => {};',
  ]) {
    assert.doesNotThrow(() => assertSimpleStory(source, 'Default'));
  }
});

test('args, decorators, loaders and context are not silently dropped', () => {
  for (const source of [
    'export const Default = { render: () => null, args: { label: "Fixed" } };',
    'export const Default = () => null; Default.args = { label: "Fixed" };',
    'export const Default = { render: () => null, decorators: [withProvider] };',
    'export const Default = { render: () => null, loaders: [loadData] };',
    'export const Default = { ...baseStory, render: () => null };',
    'export const Default = { args: {} };',
    'export const Default = (args, context) => null;',
  ]) {
    assert.throws(() => assertSimpleStory(source, 'Default'), /adaptation or exclusion/);
  }
  assert.throws(
    () => assertSimpleStory('export const Default = () => null;', 'Default', { decorators: '[]' }),
    /component decorators/,
  );
});

test('coverage accounts for upstream replacements and deliberately unselected examples', () => {
  const upstream = {
    id: 'button--default',
    origin: 'fluent',
    exportName: 'Default',
    sourceFile: 'upstream/index.tsx',
    implementationFile: 'upstream/Default.tsx',
  };
  const local = {
    ...upstream,
    origin: 'local',
    sourceFile: 'local.tsx',
    implementationFile: 'local.tsx',
  };
  const another = { ...upstream, id: 'button--size', exportName: 'Size' };
  const component = {
    id: 'button',
    sources: [{ stories: [upstream, another] }, { stories: [local] }],
    stories: [local, another],
  };
  const report = accountForStories(component, ['Default']);
  assert.deepEqual(
    report.map(({ status }) => status),
    ['replaced', 'excluded', 'included'],
  );
  assert.ok(report.every((entry) => entry.status === 'included' || entry.reason));
  assert.throws(() => accountForStories(component, ['Missing']), /does not exist/);
  const excluded = accountForStories(component, undefined, {
    Size: 'The first pass omits this example.',
  });
  assert.equal(
    excluded.find((entry) => entry.id === 'button--size').reason,
    'The first pass omits this example.',
  );
  assert.throws(
    () => accountForStories(component, undefined, { Missing: 'Unknown' }),
    /does not exist/,
  );
});

test('Markdown includes authored guidance, exact example source, base-aware links and template source', () => {
  const source = 'export default function Example() { return null; }\n';
  const page = {
    guidance: '# Empty state\n\nDo not confuse no results with missing permissions.',
    kind: 'templates',
    examples: [
      {
        name: 'Default',
        origin: 'local',
        description: 'A complete example.',
        sourcePath: 'source/examples/default.tsx',
        source,
      },
    ],
    templateSources: [{ name: 'EmptyState.tsx', path: 'source/templates/EmptyState.tsx', source }],
  };
  const markdown = pageMarkdown(page, {
    basePath: '/repo/',
    versions: { '@coreai-ds/react-components': '0.11.1', '@fluentui/react-components': '9.74.9' },
  });
  assert.match(markdown, /Do not confuse no results with missing permissions/);
  assert.match(markdown, /A complete example\./);
  assert.match(markdown, /not an npm export/);
  assert.match(markdown, /\(\/repo\/guides\/package\.md\)/);
  assert.match(markdown, /\(\/repo\/source\/examples\/default\.tsx\)/);
  assert.equal(markdown.split(codeFence(source)).length - 1, 2);
  assert.doesNotMatch(markdown, /<Example|<ApiTable/);
});
