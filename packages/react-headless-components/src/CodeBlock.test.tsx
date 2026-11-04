// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import {
  CodeBlockComparison,
  CodeBlockFlow,
  codeBlockConsumerExample,
  codeBlockExamples,
  codeBlockLongSource,
  codeBlockSource,
  type CodeBlockExample,
} from '../../../apps/storybook/src/stories/experiments/CodeBlockComparison.js';
import {
  captureCodeBlockStyles,
  compareCodeBlockStyles,
  getComparisonCodeBlock,
  settleCodeBlockStyles,
} from '../../../apps/storybook/src/stories/experiments/CodeBlockComparisonStyles.js';
import { CoreAIFluentProvider } from './CoreAIFluentProvider.js';
import { coreaiDarkTheme, coreaiLightTheme } from './theme.js';
import { CodeBlock, codeBlockClassNames } from './CodeBlock.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

function TestProvider({ children }: { children: React.ReactNode }) {
  return <CoreAIFluentProvider theme={coreaiLightTheme}>{children}</CoreAIFluentProvider>;
}

function getPart(root: ParentNode, selector: string): HTMLElement {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLElement)) throw new Error(`Missing CodeBlock part: ${selector}`);
  return element;
}

async function renderPair(
  example: CodeBlockExample,
  theme = coreaiLightTheme,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(<CodeBlockComparison examples={[example]} theme={theme} dir={dir} />);
  await userEvent.hover(screen.getByTestId('code-block-pointer-parking'));
  const legacy = getComparisonCodeBlock(screen.container, 'legacy');
  const headless = getComparisonCodeBlock(screen.container, 'headless');
  expect(legacy.matches(':hover')).toBe(false);
  expect(headless.matches(':hover')).toBe(false);
  await Promise.all([settleCodeBlockStyles(legacy), settleCodeBlockStyles(headless)]);
  expect(legacy.getBoundingClientRect().height).toBeGreaterThan(0);
  expect(headless.getBoundingClientRect().height).toBeGreaterThan(0);
  return { legacy, headless, screen };
}

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(codeBlockExamples)(`matches $name in ${mode}`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(
      compareCodeBlockStyles(captureCodeBlockStyles(legacy), captureCodeBlockStyles(headless)),
    ).toEqual([]);
  });
}

test('preserves RTL header space and inline-end copy placement', async () => {
  const { legacy, headless } = await renderPair(codeBlockExamples[1], coreaiLightTheme, 'rtl');
  expect(
    compareCodeBlockStyles(captureCodeBlockStyles(legacy), captureCodeBlockStyles(headless)),
  ).toEqual([]);
  const rootRect = headless.getBoundingClientRect();
  const copyRect = getPart(headless, '.fui-CodeBlock__CopyButton').getBoundingClientRect();
  expect(copyRect.left - rootRect.left).toBeLessThan(12);
  expect(getComputedStyle(getPart(headless, '.fui-CodeBlock__header')).paddingLeft).toBe('46px');
});

test('lets ordinary caller classes override the root, header and footer layers', async () => {
  const { headless } = await renderPair(codeBlockConsumerExample);
  const values = captureCodeBlockStyles(headless);
  expect(values['root.border-radius']).toBe('3px');
  expect(values['root.background-color']).toBe('rgb(230, 240, 250)');
  expect(values['header.padding-top']).toBe('3px');
  expect(values['header.padding-right']).toBe('7px');
  expect(values['footer.padding-top']).toBe('5px');
  expect(values['footer.padding-left']).toBe('9px');
  expect(values['footer.gap']).toBe('12px');
});

test('publishes the existing root and owned-part markers for code and fallback content', async () => {
  expect(codeBlockClassNames).toEqual({
    root: 'fui-CodeBlock',
    pre: 'fui-CodeBlock__pre',
    header: 'fui-CodeBlock__header',
    footer: 'fui-CodeBlock__footer',
    fallbackContent: 'fui-CodeBlock__fallbackContent',
    copyButton: 'fui-CodeBlock__CopyButton',
  });
  const screen = await render(
    <CodeBlock code={codeBlockSource} header="Source" footer="End" className="consumer-marker" />,
    { wrapper: TestProvider },
  );
  const root = getPart(screen.container, `.${codeBlockClassNames.root}`);
  expect(root).toHaveClass('consumer-marker');
  expect(getPart(root, `.${codeBlockClassNames.pre}`).tagName).toBe('PRE');
  expect(getPart(root, `.${codeBlockClassNames.header}`)).toHaveTextContent('Source');
  expect(getPart(root, `.${codeBlockClassNames.footer}`)).toHaveTextContent('End');
  expect(getPart(root, `.${codeBlockClassNames.copyButton}`)).toBe(
    screen.getByRole('button', { name: 'Copy code' }).element(),
  );

  await screen.rerender(<CodeBlock fallbackContent="Loading" />);
  expect(getPart(root, `.${codeBlockClassNames.fallbackContent}`)).toHaveTextContent('Loading');
});

test('renders source as native pre/code text without autodetection or HTML execution', async () => {
  const source = '<script>globalThis.codeRan = true</script>\n& < >\n';
  const screen = await render(<CodeBlock code={source} />, { wrapper: TestProvider });
  const pre = getPart(screen.container, '.fui-CodeBlock__pre');
  const code = getPart(pre, 'code');
  expect(pre.tagName).toBe('PRE');
  expect(code.textContent).toBe(source);
  expect(code.querySelector('script')).toBeNull();
  expect(code.querySelector('[class^="hljs-"]')).toBeNull();
  expect(code.classList.contains('hljs')).toBe(false);
  expect(screen.getByRole('button', { name: 'Copy code' })).toBeVisible();
});

test.each([
  { name: 'empty', code: '' },
  { name: 'omitted', code: undefined },
])('uses actionable fallback content for $name code without a copy action', async ({ code }) => {
  const retry = vi.fn();
  const screen = await render(
    <CodeBlock
      code={code}
      header={0}
      footer={0}
      fallbackContent={<button onClick={retry}>Retry loading code</button>}
    />,
    { wrapper: TestProvider },
  );
  expect(screen.container.querySelector('.fui-CodeBlock__pre')).toBeNull();
  expect(screen.getByRole('button', { name: 'Copy code' }).query()).toBeNull();
  expect(getPart(screen.container, '.fui-CodeBlock__header')).toHaveTextContent('0');
  expect(getPart(screen.container, '.fui-CodeBlock__footer')).toHaveTextContent('0');
  await userEvent.click(screen.getByRole('button', { name: 'Retry loading code' }));
  expect(retry).toHaveBeenCalledOnce();
});

test('updates code, language, copy visibility and fallback while preserving the native root ref', async () => {
  const ref = React.createRef<HTMLDivElement>();
  const screen = await render(<CodeBlock ref={ref} fallbackContent="Loading" />, {
    wrapper: TestProvider,
  });
  const root = getPart(screen.container, '.fui-CodeBlock');
  expect(ref.current).toBe(root);
  expect(root).toHaveTextContent('Loading');

  await screen.rerender(
    <CodeBlock
      ref={ref}
      code='const ready = "yes";'
      language="js"
      fallbackContent="Loading"
      hideCopybutton
    />,
  );
  expect(ref.current).toBe(root);
  expect(root.querySelector('.fui-CodeBlock__fallbackContent')).toBeNull();
  expect(getPart(root, 'code')).toHaveClass('language-js', 'hljs');
  expect(getPart(root, '.hljs-keyword')).toHaveTextContent('const');
  expect(screen.getByRole('button', { name: 'Copy code' }).query()).toBeNull();

  await screen.rerender(<CodeBlock ref={ref} code="Unclassified text" />);
  expect(ref.current).toBe(root);
  expect(getPart(root, 'code').textContent).toBe('Unclassified text');
  expect(root.querySelector('.hljs-keyword')).toBeNull();
  expect(screen.getByRole('button', { name: 'Copy code' })).toBeVisible();

  await screen.rerender(<CodeBlock ref={ref} code="" fallbackContent={0} />);
  expect(ref.current).toBe(root);
  expect(getPart(root, '.fui-CodeBlock__fallbackContent').textContent).toBe('0');
  expect(root.querySelector('pre')).toBeNull();
  expect(screen.getByRole('button', { name: 'Copy code' }).query()).toBeNull();
});

test('forwards root native attributes, inline priority, caller classes and event identity', async () => {
  const ref = React.createRef<HTMLDivElement>();
  const headerRef = React.createRef<HTMLInputElement>();
  const keydown = vi.fn();
  let clickedRoot: EventTarget | null = null;
  const screen = await render(
    <CodeBlock
      ref={ref}
      code={codeBlockSource}
      role="region"
      aria-label="Named source example"
      aria-describedby="code-description"
      tabIndex={0}
      className="consumer-code"
      headerClassName="consumer-code-header"
      footerClassName="consumer-code-footer"
      header={<input ref={headerRef} aria-label="Header input" defaultValue="Native input" />}
      footer={<span id="code-description">Source description</span>}
      style={{ borderRadius: 6 }}
      onKeyDown={keydown}
      onClick={(event) => {
        clickedRoot = event.currentTarget;
      }}
    />,
    { wrapper: TestProvider },
  );
  const root = screen.getByRole('region', { name: 'Named source example' }).element();
  expect(ref.current).toBe(root);
  expect(root).toHaveClass('consumer-code');
  expect(root).toHaveAttribute('aria-describedby', 'code-description');
  expect(getComputedStyle(root).borderRadius).toBe('6px');
  expect(getPart(root, '.fui-CodeBlock__header')).toHaveClass('consumer-code-header');
  expect(getPart(root, '.fui-CodeBlock__footer')).toHaveClass('consumer-code-footer');
  expect(headerRef.current).toBe(screen.getByRole('textbox', { name: 'Header input' }).element());
  root.focus();
  await userEvent.keyboard('{ArrowRight}');
  expect(keydown).toHaveBeenCalledOnce();
  expect(keydown.mock.calls[0][0].key).toBe('ArrowRight');
  await userEvent.click(screen.getByRole('textbox', { name: 'Header input' }));
  expect(clickedRoot).toBe(root);
});

test('scrolls code inside a constrained surface without moving its copy action, header or footer', async () => {
  const screen = await render(
    <CodeBlock
      code={`${codeBlockLongSource}\n${'A wide code line '.repeat(60)}`}
      header="Long example"
      footer="End of example"
      style={{ height: 200, width: 360 }}
    />,
    { wrapper: TestProvider },
  );
  const root = getPart(screen.container, '.fui-CodeBlock');
  const pre = getPart(root, '.fui-CodeBlock__pre');
  const copy = getPart(root, '.fui-CodeBlock__CopyButton');
  const before = copy.getBoundingClientRect();
  const headerTop = getPart(root, '.fui-CodeBlock__header').getBoundingClientRect().top;
  const footerTop = getPart(root, '.fui-CodeBlock__footer').getBoundingClientRect().top;
  expect(root.scrollHeight).toBeLessThanOrEqual(root.clientHeight);
  expect(pre.scrollHeight).toBeGreaterThan(pre.clientHeight);
  expect(pre.scrollWidth).toBeGreaterThan(pre.clientWidth);
  expect(getComputedStyle(pre).overflowY).toBe('auto');
  pre.scrollTop = 100;
  pre.scrollLeft = 100;
  expect(pre.scrollTop).toBe(100);
  expect(pre.scrollLeft).toBe(100);
  expect(copy.getBoundingClientRect().top).toBe(before.top);
  expect(copy.getBoundingClientRect().right).toBe(before.right);
  expect(getPart(root, '.fui-CodeBlock__header').getBoundingClientRect().top).toBe(headerTop);
  expect(getPart(root, '.fui-CodeBlock__footer').getBoundingClientRect().top).toBe(footerTop);
});

test('reads changing light/dark palettes from the new provider without an old provider', async () => {
  const screen = await render(
    <CoreAIFluentProvider theme={coreaiDarkTheme}>
      <CodeBlock code={codeBlockSource} language="js" />
    </CoreAIFluentProvider>,
  );
  const keyword = () => getPart(screen.container, '.hljs-keyword');
  const string = () => getPart(screen.container, '.hljs-string');
  const comment = () => getPart(screen.container, '.hljs-comment');
  await expect.poll(() => getComputedStyle(keyword()).color).toBe('rgb(86, 156, 214)');
  expect(getComputedStyle(string()).color).toBe('rgb(214, 157, 133)');
  expect(getComputedStyle(comment()).color).toBe('rgb(87, 166, 74)');
  expect(getComputedStyle(comment()).fontStyle).toBe('italic');
  expect(screen.getByRole('button', { name: 'Copy code' })).toHaveAttribute(
    'data-shape',
    'circular',
  );

  await screen.rerender(
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <CodeBlock code={codeBlockSource} language="js" />
    </CoreAIFluentProvider>,
  );
  await expect.poll(() => getComputedStyle(keyword()).color).toBe('rgb(0, 0, 255)');
  expect(getComputedStyle(string()).color).toBe('rgb(163, 21, 21)');
  expect(getComputedStyle(comment()).color).toBe('rgb(0, 128, 0)');
  expect(getComputedStyle(comment()).fontStyle).toBe('normal');
});

test('copies the current raw source and preserves header/footer forms and root callbacks', async () => {
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  const screen = await render(<CodeBlockFlow />, { wrapper: TestProvider });
  expect(screen.getByRole('status', { name: 'Code root ref' })).toHaveTextContent('DIV');
  const copy = screen.getByRole('button', { name: 'Copy code' });
  expect(copy).toHaveAttribute('type', 'button');
  copy.element().focus();
  await userEvent.keyboard('{Enter}');
  expect(writeText).toHaveBeenLastCalledWith(codeBlockSource);
  await expect.element(screen.getByText('Copied', { exact: true })).toBeVisible();
  expect(screen.getByRole('status', { name: 'Code copy clicks' })).toHaveTextContent(
    '1 copy clicks',
  );
  expect(screen.getByRole('status', { name: 'Code form result' })).toHaveTextContent(
    'No submission',
  );

  await userEvent.click(screen.getByRole('button', { name: 'Load alternative' }));
  await userEvent.click(copy);
  expect(writeText).toHaveBeenLastCalledWith('const updated = "New content";');
  expect(screen.getByRole('status', { name: 'Code copy clicks' })).toHaveTextContent(
    '2 copy clicks',
  );
  await userEvent.clear(screen.getByRole('textbox', { name: 'Example title' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Example title' }), 'saved.js');
  await userEvent.click(screen.getByRole('button', { name: 'Save example' }));
  expect(screen.getByRole('status', { name: 'Code form result' })).toHaveTextContent(
    'saved.js | const updated = "New content"; | save',
  );

  await userEvent.clear(screen.getByRole('textbox', { name: 'Source code' }));
  await expect.element(screen.getByText('Enter source code')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Copy code' }).query()).toBeNull();
  await userEvent.type(
    screen.getByRole('textbox', { name: 'Source code' }),
    'const input = "Typed source";',
  );
  await userEvent.click(screen.getByRole('button', { name: 'Copy code' }));
  expect(writeText).toHaveBeenLastCalledWith('const input = "Typed source";');
  expect(screen.getByRole('status', { name: 'Code root ref' })).toHaveTextContent('DIV');
});
