// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Root } from 'hast';
import type { Plugin } from 'unified';
import { afterEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import {
  MarkdownComparison,
  MarkdownFlow,
  markdownConsumerExample,
  markdownExamples,
  markdownExtendedExample,
  markdownFlowSource,
  markdownGfmSource,
  type MarkdownExample,
} from '../../../apps/storybook/src/stories/experiments/MarkdownComparison.js';
import {
  captureMarkdownStyles,
  compareMarkdownStyles,
  getComparisonMarkdown,
  settleMarkdownStyles,
} from '../../../apps/storybook/src/stories/experiments/MarkdownComparisonStyles.js';
import { CoreAIFluentProvider } from './CoreAIFluentProvider.js';
import { coreaiDarkTheme, coreaiLightTheme } from './theme.js';
import { Markdown, markdownClassNames } from './Markdown.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

function TestProvider({ children }: { children: React.ReactNode }) {
  return <CoreAIFluentProvider theme={coreaiLightTheme}>{children}</CoreAIFluentProvider>;
}

function getElement(root: ParentNode, selector: string): HTMLElement {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Missing Markdown content: ${selector}`);
  return element;
}

async function renderPair(
  example: MarkdownExample,
  theme = coreaiLightTheme,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(<MarkdownComparison examples={[example]} theme={theme} dir={dir} />);
  await userEvent.hover(screen.getByTestId('markdown-pointer-parking'));
  const legacy = getComparisonMarkdown(screen.container, 'legacy');
  const headless = getComparisonMarkdown(screen.container, 'headless');
  expect(legacy.matches(':hover')).toBe(false);
  expect(headless.matches(':hover')).toBe(false);
  await Promise.all([settleMarkdownStyles(legacy), settleMarkdownStyles(headless)]);
  expect(legacy.getBoundingClientRect().height).toBeGreaterThan(0);
  expect(headless.getBoundingClientRect().height).toBeGreaterThan(0);
  return { legacy, headless, screen };
}

test.each([
  { direction: 'ltr', logical: 'start', physical: 'left' },
  { direction: 'rtl', logical: 'start', physical: 'right' },
  { direction: 'ltr', logical: 'end', physical: 'right' },
  { direction: 'rtl', logical: 'end', physical: 'left' },
])(
  'compares equivalent $logical and $physical alignment in $direction without changing captures',
  ({ direction, logical, physical }) => {
    const legacy = { 'a.text-align': physical, 'a.direction': direction };
    const headless = { 'a.text-align': logical, 'a.direction': direction };
    expect(compareMarkdownStyles(legacy, headless)).toEqual([]);
    expect(compareMarkdownStyles(headless, legacy)).toEqual([]);
    expect(legacy['a.text-align']).toBe(physical);
    expect(headless['a.text-align']).toBe(logical);
  },
);

test('keeps genuine physical and logical alignment differences observable', () => {
  expect(
    compareMarkdownStyles(
      { 'a.text-align': 'left', 'a.direction': 'ltr' },
      { 'a.text-align': 'end', 'a.direction': 'ltr' },
    ),
  ).toEqual([{ property: 'a.text-align', legacy: 'left', headless: 'end' }]);
  expect(
    compareMarkdownStyles(
      { 'a.text-align': 'left', 'a.direction': 'rtl' },
      { 'a.text-align': 'right', 'a.direction': 'rtl' },
    ),
  ).toEqual([{ property: 'a.text-align', legacy: 'left', headless: 'right' }]);
});

test('keeps direction differences observable even when both alignments use the same logical value', () => {
  expect(
    compareMarkdownStyles(
      { 'a.text-align': 'start', 'a.direction': 'ltr' },
      { 'a.text-align': 'start', 'a.direction': 'rtl' },
    ),
  ).toEqual([
    { property: 'a.text-align', legacy: 'start', headless: 'start' },
    { property: 'a.direction', legacy: 'ltr', headless: 'rtl' },
  ]);
});

test('keeps missing and empty alignment values and missing direction observable', () => {
  expect(
    compareMarkdownStyles(
      { 'a.text-align': 'left', 'a.direction': 'ltr' },
      { 'a.direction': 'ltr' },
    ),
  ).toEqual([{ property: 'a.text-align', legacy: 'left', headless: null }]);
  expect(
    compareMarkdownStyles(
      { 'a.direction': 'ltr' },
      { 'a.text-align': 'start', 'a.direction': 'ltr' },
    ),
  ).toEqual([{ property: 'a.text-align', legacy: null, headless: 'start' }]);
  expect(
    compareMarkdownStyles(
      { 'a.text-align': '', 'a.direction': 'ltr' },
      { 'a.text-align': 'start', 'a.direction': 'ltr' },
    ),
  ).toEqual([{ property: 'a.text-align', legacy: '', headless: 'start' }]);
  expect(
    compareMarkdownStyles(
      { 'a.text-align': 'left', 'a.direction': 'ltr' },
      { 'a.text-align': 'start' },
    ),
  ).toEqual([
    { property: 'a.text-align', legacy: 'left', headless: 'start' },
    { property: 'a.direction', legacy: 'ltr', headless: null },
  ]);
});

test('does not resolve alignment without a known captured direction or change other alignment values', () => {
  expect(compareMarkdownStyles({ 'a.text-align': 'left' }, { 'a.text-align': 'start' })).toEqual([
    { property: 'a.text-align', legacy: 'left', headless: 'start' },
  ]);
  expect(
    compareMarkdownStyles(
      { 'a.text-align': 'left', 'a.direction': 'unknown' },
      { 'a.text-align': 'start', 'a.direction': 'unknown' },
    ),
  ).toEqual([{ property: 'a.text-align', legacy: 'left', headless: 'start' }]);
  expect(
    compareMarkdownStyles(
      { 'a.text-align': 'left', 'a.direction': 'ltr' },
      { 'a.text-align': 'match-parent', 'a.direction': 'ltr' },
    ),
  ).toEqual([{ property: 'a.text-align', legacy: 'left', headless: 'match-parent' }]);
});

test('keeps geometry differences observable alongside equivalent logical and physical alignment', () => {
  expect(
    compareMarkdownStyles(
      { 'a.text-align': 'left', 'a.direction': 'ltr', 'a.width': '40.00' },
      { 'a.text-align': 'start', 'a.direction': 'ltr', 'a.width': '44.00' },
    ),
  ).toEqual([{ property: 'a.width', legacy: '40.00', headless: '44.00' }]);
});

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(markdownExamples)(`matches $name in ${mode}`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(
      compareMarkdownStyles(captureMarkdownStyles(legacy), captureMarkdownStyles(headless)),
    ).toEqual([]);
  });
}

test.each(markdownExamples.slice(0, 3))(
  'matches $name with native RTL content',
  async (example) => {
    const { legacy, headless } = await renderPair(example, coreaiLightTheme, 'rtl');
    expect(
      compareMarkdownStyles(captureMarkdownStyles(legacy), captureMarkdownStyles(headless)),
    ).toEqual([]);
  },
);

test('gives ordinary consumer CSS priority over typography, native table and inline-code styles', async () => {
  const { headless } = await renderPair(markdownConsumerExample);
  expect(getComputedStyle(headless).fontSize).toBe('17px');
  expect(getComputedStyle(headless).lineHeight).toBe('25px');
  expect(getComputedStyle(headless).color).toBe('rgb(20, 90, 160)');
  expect(getComputedStyle(getElement(headless, 'h2')).fontSize).toBe('21px');
  expect(getComputedStyle(getElement(headless, 'h2')).color).toBe('rgb(120, 40, 100)');
  expect(getComputedStyle(getElement(headless, 'table')).borderCollapse).toBe('collapse');
  expect(getComputedStyle(getElement(headless, 'p code')).fontSize).toBe('13px');
});

test('publishes its wrapper marker without stamping classes on native Markdown children', async () => {
  expect(markdownClassNames).toEqual({ root: 'fui-Markdown' });
  const screen = await render(
    <Markdown
      className="consumer-marker"
      content={'# Heading\n\nA paragraph with `code`.\n\n| Name |\n| --- |\n| CoreAI |'}
    />,
    { wrapper: TestProvider },
  );
  const root = getElement(screen.container, `.${markdownClassNames.root}`);
  expect(root).toHaveClass('consumer-marker');
  for (const selector of ['h1', 'p', 'p code', 'table', 'th', 'td']) {
    expect(getElement(root, selector)).not.toHaveAttribute('class');
  }
  expect(root.querySelector('[class*="fui-Markdown__"]')).toBeNull();
});

test('renders semantic heading levels and slugs from formatted visible text', async () => {
  const screen = await render(
    <Markdown
      content={[
        '# Hello *CoreAI* & friends',
        '## Read [the guide](#guide) and `API`',
        '### Third\n\n#### Fourth\n\n##### Fifth\n\n###### Sixth',
        '## !!!',
      ].join('\n\n')}
    />,
    { wrapper: TestProvider },
  );
  expect(screen.getByRole('heading', { level: 1, name: 'Hello CoreAI & friends' })).toHaveAttribute(
    'id',
    'hello-coreai-friends',
  );
  expect(screen.getByRole('heading', { level: 2, name: 'Read the guide and API' })).toHaveAttribute(
    'id',
    'read-the-guide-and-api',
  );
  for (const [level, name] of [
    [3, 'Third'],
    [4, 'Fourth'],
    [5, 'Fifth'],
    [6, 'Sixth'],
  ] as const) {
    expect(screen.getByRole('heading', { level, name })).toHaveAttribute('id', name.toLowerCase());
  }
  expect(screen.getByRole('heading', { level: 2, name: '!!!' })).not.toHaveAttribute('id');
});

test('retains native GFM table structure, alignment, task states and horizontal table scrolling', async () => {
  const screen = await render(
    <>
      <Markdown content={markdownGfmSource} />
      <div style={{ width: 280 }}>
        <Markdown
          content={`| Description | State |\n| --- | --- |\n| ${'A_long_description_'.repeat(20)} | Ready |`}
        />
      </div>
    </>,
    { wrapper: TestProvider },
  );
  const tables = screen.getByRole('table').all();
  expect(tables).toHaveLength(2);
  const table = tables[0].element();
  expect(table.tagName).toBe('TABLE');
  expect(getElement(table, 'thead').tagName).toBe('THEAD');
  expect(getElement(table, 'tbody').tagName).toBe('TBODY');
  // Vitest's current aria-query locator misclassifies scopeless th elements.
  // Standalone Playwright verified columnheader roles in both live Storybook implementations.
  const countHeader = getElement(table, 'thead > tr > th:nth-child(3)');
  expect(countHeader.tagName).toBe('TH');
  expect(countHeader.textContent).toBe('Count');
  expect(countHeader).toHaveAttribute('style', 'text-align: right;');
  expect(getComputedStyle(countHeader).textAlign).toBe('right');
  expect(screen.getByRole('cell', { name: 'CoreAI' })).toBeInTheDocument();
  const tasks = screen.getByRole('checkbox').all();
  expect(tasks).toHaveLength(2);
  expect(tasks[0]).toBeChecked();
  expect(tasks[1]).not.toBeChecked();
  expect(tasks[0]).toBeDisabled();
  expect(tasks[1]).toBeDisabled();
  const wideTable = tables[1].element();
  const scroll = wideTable.parentElement;
  if (!scroll) throw new Error('Missing native table scroll wrapper');
  expect(getComputedStyle(scroll).overflowX).toBe('auto');
  expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
  expect(scroll.clientWidth).toBeLessThanOrEqual(280);
  const beforeScroll = wideTable.getBoundingClientRect().left;
  scroll.scrollLeft = scroll.scrollWidth;
  expect(scroll.scrollLeft).toBeGreaterThan(0);
  expect(wideTable.getBoundingClientRect().left).toBeLessThan(beforeScroll);
});

test('composes local Link navigation defaults while keeping fragment links in the current page', async () => {
  const onLinkClick = vi.fn();
  const screen = await render(
    <div
      onClick={(event) => {
        const anchor = event.target instanceof Element ? event.target.closest('a') : null;
        if (anchor) {
          event.preventDefault();
          onLinkClick(anchor.getAttribute('href'), event.type);
        }
      }}
    >
      <Markdown
        content={
          '[External](https://example.com) [Local route](/guide) [Section](#details)\n\n## Details'
        }
      />
    </div>,
    { wrapper: TestProvider },
  );
  const external = screen.getByRole('link', { name: 'External' });
  const localRoute = screen.getByRole('link', { name: 'Local route' });
  const fragment = screen.getByRole('link', { name: 'Section' });
  for (const link of [external, localRoute]) {
    expect(link.element().tagName).toBe('A');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link.element().querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  }
  expect(fragment).not.toHaveAttribute('target');
  expect(fragment).not.toHaveAttribute('rel');
  expect(fragment.element().querySelector('svg')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Details' })).toHaveAttribute('id', 'details');
  fragment.element().focus();
  await userEvent.keyboard('{Enter}');
  expect(onLinkClick).toHaveBeenCalledExactlyOnceWith('#details', 'click');
  await userEvent.click(external);
  expect(onLinkClick).toHaveBeenLastCalledWith('https://example.com', 'click');
});

test('renders fenced code through the new CodeBlock and copies raw text with one trailing newline removed', async () => {
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  const source = 'const ready = true;\n';
  const screen = await render(<Markdown content={`\`\`\`typescript\n${source}\n\`\`\``} />, {
    wrapper: TestProvider,
  });
  const block = getElement(screen.container, '.fui-CodeBlock');
  const code = getElement(block, 'code');
  expect(code).toHaveClass('language-typescript', 'hljs');
  expect(code.textContent).toBe(source);
  expect(getElement(code, '.hljs-keyword')).toHaveTextContent('const');
  const copy = screen.getByRole('button', { name: 'Copy code' });
  expect(copy).toHaveAttribute('data-shape', 'circular');
  await userEvent.click(copy);
  expect(writeText).toHaveBeenCalledExactlyOnceWith(source);
  await expect.element(screen.getByText('Copied', { exact: true })).toBeVisible();
  expect(code.textContent).toBe(source);
});

test('preserves no-language and inline code instead of guessing grammars or wrapping inline content', async () => {
  const screen = await render(
    <Markdown content={'An `inline` value.\n\n```\nconst looksLikeCode = true;\n```'} />,
    { wrapper: TestProvider },
  );
  const inline = getElement(screen.container, 'p code');
  const fenced = getElement(screen.container, '.fui-CodeBlock code');
  expect(inline.textContent).toBe('inline');
  expect(inline.closest('.fui-CodeBlock')).toBeNull();
  expect(fenced.textContent).toBe('const looksLikeCode = true;');
  expect(fenced.querySelector('[class^="hljs-"]')).toBeNull();
  expect(screen.getByRole('button', { name: 'Copy code' }).all()).toHaveLength(1);
});

test('applies remark and rehype transforms while merging consumer renderers with default CodeBlock rendering', async () => {
  const screen = await render(<Markdown {...markdownExtendedExample.props} />, {
    wrapper: TestProvider,
  });
  expect(
    screen.getByRole('heading', { level: 2, name: 'Extended Consumer heading' }),
  ).toBeInTheDocument();
  expect(screen.getByText('Remark extension content.')).toBeVisible();
  expect(screen.getByText('Rehype extension content.')).toBeVisible();
  const link = screen.getByRole('link', { name: 'Consumer link' });
  expect(link).toHaveAttribute('data-renderer', 'consumer-link');
  expect(link).toHaveAttribute('href', '#consumer');
  expect(link.element().querySelector('svg')).toBeNull();
  expect(getElement(screen.container, '.fui-CodeBlock code')).toHaveTextContent(
    'const extended = true;',
  );
  expect(screen.getByRole('button', { name: 'Copy code' })).toBeVisible();
});

test('preserves renderer-owned native props, refs and activation callbacks', async () => {
  const ref = React.createRef<HTMLAnchorElement>();
  const activate = vi.fn();
  const screen = await render(
    <Markdown
      className="consumer-markdown"
      content="[Consumer action](#consumer)"
      components={{
        a: ({ children, href, node }) => (
          <a
            ref={ref}
            className="consumer-anchor"
            href={href}
            data-node-name={node?.tagName}
            onClick={(event) => {
              event.preventDefault();
              activate(event.currentTarget, event.type);
            }}
          >
            {children}
          </a>
        ),
      }}
    />,
    { wrapper: TestProvider },
  );
  expect(getElement(screen.container, '.fui-Markdown')).toHaveClass('consumer-markdown');
  const link = screen.getByRole('link', { name: 'Consumer action' });
  expect(ref.current).toBe(link.element());
  expect(link).toHaveClass('consumer-anchor');
  expect(link).toHaveAttribute('data-node-name', 'a');
  link.element().focus();
  await userEvent.keyboard('{Enter}');
  expect(activate).toHaveBeenCalledExactlyOnceWith(link.element(), 'click');
});

test('lets consumer renderers replace pre/code and native table output intentionally', async () => {
  const screen = await render(
    <Markdown
      content={'```js\nconst custom = true;\n```\n\n| Name |\n| --- |\n| CoreAI |'}
      components={{
        pre: ({ children }) => <section aria-label="Consumer code">{children}</section>,
        table: ({ children }) => <table aria-label="Consumer table">{children}</table>,
      }}
    />,
    { wrapper: TestProvider },
  );
  expect(screen.getByRole('region', { name: 'Consumer code' })).toHaveTextContent(
    'const custom = true;',
  );
  expect(screen.getByRole('table', { name: 'Consumer table' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Copy code' }).query()).toBeNull();
  expect(screen.container.querySelector('.fui-CodeBlock')).toBeNull();
});

test('uses a plain native pre fallback when a rehype plugin produces pre content without code', async () => {
  const plainPre: Plugin<[], Root> = () => (tree) => {
    tree.children.push({
      type: 'element',
      tagName: 'pre',
      properties: {},
      children: [{ type: 'text', value: 'Plugin-provided pre text' }],
    });
  };
  const screen = await render(<Markdown content="" rehypePlugins={[plainPre]} />, {
    wrapper: TestProvider,
  });
  expect(getElement(screen.container, '.fui-Markdown > pre').textContent).toBe(
    'Plugin-provided pre text',
  );
  expect(screen.container.querySelector('.fui-CodeBlock')).toBeNull();
  expect(screen.getByRole('button', { name: 'Copy code' }).query()).toBeNull();
});

test('keeps safe react-markdown URL and raw-HTML defaults without adding math or HTML plugins', async () => {
  const observedHref = vi.fn();
  const screen = await render(
    <Markdown
      content={[
        '[Unsafe](javascript:alert%281%29)',
        '<script>globalThis.markdownRan = true</script>',
        'Inline $x^2$ and $$y = x + 1$$.',
      ].join('\n\n')}
      components={{
        a: ({ href, children }) => {
          observedHref(href);
          return <a href={href}>{children}</a>;
        },
      }}
    />,
    { wrapper: TestProvider },
  );
  expect(observedHref).toHaveBeenCalledWith('');
  const root = getElement(screen.container, '.fui-Markdown');
  expect(root.querySelector('a[href^="javascript:"]')).toBeNull();
  expect(root.querySelector('script')).toBeNull();
  expect(root).toHaveTextContent('<script>globalThis.markdownRan = true</script>');
  expect(root).toHaveTextContent('Inline $x^2$ and $$y = x + 1$$.');
  expect(root.querySelector('.katex')).toBeNull();
});

test('forwards filtering, URL transforms, skipHtml and native table properties supplied by plugins', async () => {
  const tagTable: Plugin<[], Root> = () => (tree) => {
    const table = tree.children.find(
      (child) => child.type === 'element' && child.tagName === 'table',
    );
    if (table?.type === 'element') {
      table.properties.ariaLabel = 'Plugin table';
      table.properties.id = 'plugin-table';
    }
  };
  const allowElement = vi.fn(() => true);
  const urlTransform = vi.fn(() => '#transformed');
  const screen = await render(
    <Markdown
      content={
        '# Removed heading\n\n[Mapped link](https://example.com)\n\n<div>Omitted HTML</div>\n\n| Name |\n| --- |\n| CoreAI |'
      }
      skipHtml
      disallowedElements={['h1']}
      unwrapDisallowed
      allowElement={allowElement}
      urlTransform={urlTransform}
      rehypePlugins={[tagTable]}
    />,
    { wrapper: TestProvider },
  );
  expect(screen.getByRole('heading').query()).toBeNull();
  expect(screen.getByText('Removed heading')).toBeVisible();
  expect(screen.getByText('Omitted HTML').query()).toBeNull();
  expect(screen.getByRole('link', { name: 'Mapped link' })).toHaveAttribute('href', '#transformed');
  const table = screen.getByRole('table', { name: 'Plugin table' });
  expect(table).toHaveAttribute('id', 'plugin-table');
  expect(table.element().parentElement?.tagName).toBe('DIV');
  expect(allowElement).toHaveBeenCalled();
  expect(urlTransform).toHaveBeenCalledWith(
    'https://example.com',
    'href',
    expect.objectContaining({ tagName: 'a' }),
  );
});

test('uses the new provider for nested code palettes and CopyButton defaults without an old provider', async () => {
  const screen = await render(
    <CoreAIFluentProvider theme={coreaiDarkTheme} withComponentDefaults={false}>
      <Markdown content={'[Guide](https://example.com)\n\n```js\nconst ready = true;\n```'} />
    </CoreAIFluentProvider>,
  );
  const keyword = getElement(screen.container, '.hljs-keyword');
  await expect.poll(() => getComputedStyle(keyword).color).toBe('rgb(86, 156, 214)');
  expect(screen.getByRole('button', { name: 'Copy code' })).toHaveAttribute(
    'data-shape',
    'rounded',
  );
  expect(screen.getByRole('link', { name: 'Guide' })).toHaveAttribute('target', '_blank');
  expect(screen.getByRole('link', { name: 'Guide' }).element().querySelector('svg')).not.toBeNull();
});

test('updates native content, link callbacks, form submission and nested copy actions while editing', async () => {
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  const screen = await render(<MarkdownFlow />, { wrapper: TestProvider });
  await userEvent.click(screen.getByRole('link', { name: 'External guide' }));
  expect(screen.getByRole('status', { name: 'Markdown link result' })).toHaveTextContent(
    'https://example.com',
  );
  expect(screen.getByRole('heading', { name: 'Release details' })).toHaveAttribute(
    'id',
    'release-details',
  );
  expect(screen.getByRole('link', { name: 'Jump to release details' })).not.toHaveAttribute(
    'target',
  );
  await userEvent.click(screen.getByRole('button', { name: 'Copy code' }));
  expect(writeText).toHaveBeenLastCalledWith('const version = "1.0";');
  expect(screen.getByRole('status', { name: 'Markdown form result' })).toHaveTextContent(
    'No submission',
  );
  await userEvent.click(screen.getByRole('button', { name: 'Save Markdown' }));
  expect(screen.getByRole('status', { name: 'Markdown form result' }).element().textContent).toBe(
    markdownFlowSource,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Load new document' }));
  expect(screen.getByRole('heading', { name: 'Updated content' })).toHaveAttribute(
    'id',
    'updated-content',
  );
  expect(screen.getByRole('button', { name: 'Copy code' }).query()).toBeNull();
  await userEvent.clear(screen.getByRole('textbox', { name: 'Markdown source' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Markdown source' }), '# Typed heading');
  expect(screen.getByRole('heading', { name: 'Typed heading' })).toHaveAttribute(
    'id',
    'typed-heading',
  );
  await userEvent.click(screen.getByRole('button', { name: 'Save Markdown' }));
  expect(screen.getByRole('status', { name: 'Markdown form result' })).toHaveTextContent(
    '# Typed heading',
  );
});
