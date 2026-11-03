// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import type { ButtonSlots } from '@fluentui/react-headless-components-preview/button';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  Slot,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import {
  CopyButtonComparison,
  CopyButtonFlow,
  copyButtonConsumerExample,
  copyButtonExamples,
  type CopyButtonExample,
} from '../../../apps/storybook/src/stories/experiments/CopyButtonComparison.js';
import {
  captureCopyButtonStyles,
  compareCopyButtonStyles,
  getComparisonCopyButton,
  settleCopyButtonStyles,
} from '../../../apps/storybook/src/stories/experiments/CopyButtonComparisonStyles.js';
import fixtureStyles from '../../../apps/storybook/src/stories/experiments/CopyButtonComparison.module.css';
import { CoreAIFluentProvider } from './CoreAIFluentProvider.js';
import { coreaiDarkTheme, coreaiLightTheme } from './theme.js';
import { CopyButton, type CopyButtonProps } from './CopyButton.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function TestProvider({ children }: { children: React.ReactNode }) {
  return <CoreAIFluentProvider theme={coreaiLightTheme}>{children}</CoreAIFluentProvider>;
}

async function renderPair(
  example: CopyButtonExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(
    <>
      <span className={fixtureStyles.pointerRest} data-testid="copy-pointer-rest" aria-hidden />
      <CopyButtonComparison
        examples={[example]}
        theme={theme}
        withComponentDefaults={withComponentDefaults}
        dir={dir}
      />
    </>,
  );
  await userEvent.hover(screen.getByTestId('copy-pointer-rest'));
  const legacy = getComparisonCopyButton(screen.container, 'legacy');
  const headless = getComparisonCopyButton(screen.container, 'headless');
  expect(legacy.matches(':hover')).toBe(false);
  expect(headless.matches(':hover')).toBe(false);
  await Promise.all([settleCopyButtonStyles(legacy), settleCopyButtonStyles(headless)]);
  return { legacy, headless, screen };
}

function regularGlyph(root: Element): string {
  const path = root.querySelector('.fui-Icon-regular path')?.getAttribute('d');
  if (!path) throw new Error('Missing CopyButton regular glyph');
  return path;
}

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(copyButtonExamples)(`matches $name at rest in ${mode}`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(
      compareCopyButtonStyles(captureCopyButtonStyles(legacy), captureCopyButtonStyles(headless)),
    ).toEqual([]);
  });

  test(`matches the subtle hover glyph and keeps disabled hover inactive in ${mode}`, async () => {
    const { legacy, headless } = await renderPair(copyButtonExamples[0], theme);
    await userEvent.hover(legacy);
    await settleCopyButtonStyles(legacy);
    const hovered = captureCopyButtonStyles(legacy);
    await userEvent.hover(headless);
    await settleCopyButtonStyles(headless);
    expect(compareCopyButtonStyles(hovered, captureCopyButtonStyles(headless))).toEqual([]);
    // Visible SVGs are direct flex items, so their specified inline display computes to block.
    expect(hovered['presetIcon.filled.display']).toBe('block');
    expect(hovered['presetIcon.regular.display']).toBe('none');
    await cleanup();

    const disabled = await renderPair(
      {
        name: 'Disabled hover',
        props: {
          'aria-label': 'Unavailable copy',
          contentToCopy: 'CoreAI-42',
          disabledFocusable: true,
        },
      },
      theme,
    );
    await userEvent.hover(disabled.headless);
    await settleCopyButtonStyles(disabled.headless);
    const values = captureCopyButtonStyles(disabled.headless);
    expect(values['presetIcon.filled.display']).toBe('none');
    expect(values['presetIcon.regular.display']).toBe('block');
    expect(getComputedStyle(disabled.headless).cursor).toBe('not-allowed');
  });

  test(`keeps the preset appearance while opting out of Button defaults in ${mode}`, async () => {
    const { legacy, headless } = await renderPair(copyButtonExamples[0], theme, false);
    expect(
      compareCopyButtonStyles(captureCopyButtonStyles(legacy), captureCopyButtonStyles(headless)),
    ).toEqual([]);
    expect(headless).toHaveAttribute('data-shape', 'rounded');
    expect(headless).toHaveAttribute('data-appearance', 'subtle');
  });
}

test('preserves RTL spacing for content with an after-content copy icon', async () => {
  const { legacy, headless } = await renderPair(
    {
      name: 'RTL copy',
      props: {
        'aria-label': 'Copy code',
        contentToCopy: 'CoreAI-42',
        children: 'Copy code',
        iconPosition: 'after',
      },
    },
    coreaiLightTheme,
    true,
    'rtl',
  );
  expect(
    compareCopyButtonStyles(captureCopyButtonStyles(legacy), captureCopyButtonStyles(headless)),
  ).toEqual([]);
});

test('lets ordinary caller CSS override the reused root and icon layers', async () => {
  const { headless } = await renderPair(copyButtonConsumerExample);
  const values = captureCopyButtonStyles(headless);
  expect(values['root.min-width']).toBe('144px');
  expect(values['root.border-radius']).toBe('3px');
  expect(values['root.color']).toBe('rgb(20, 90, 160)');
  expect(values['presetIcon.width']).toBe('16px');
  expect(values['presetIcon.font-size']).toBe('16px');
});

test('calls the consumer first and confirms only after a successful clipboard write', async () => {
  let resolveWrite: (() => void) | undefined;
  const pendingWrite = new Promise<void>((resolve) => {
    resolveWrite = resolve;
  });
  const events: string[] = [];
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(() => {
    events.push('write');
    return pendingWrite;
  });
  const onCopyError = vi.fn();
  const ref = React.createRef<HTMLButtonElement>();
  const screen = await render(
    <CopyButton
      ref={ref}
      aria-label="Copy project code"
      contentToCopy="CoreAI-42"
      onClick={() => events.push('click')}
      onCopySuccess={() => events.push('success')}
      onCopyError={onCopyError}
    />,
    { wrapper: TestProvider },
  );
  const button = screen.getByRole('button', { name: 'Copy project code' });
  const initialGlyph = regularGlyph(button.element());
  expect(ref.current).toBe(button.element());
  await userEvent.click(button);
  expect(writeText).toHaveBeenCalledExactlyOnceWith('CoreAI-42');
  expect(events).toEqual(['click', 'write']);
  expect(screen.getByRole('tooltip').query()).toBeNull();
  const finishWrite = resolveWrite;
  if (!finishWrite) throw new Error('Clipboard completion was not captured');
  await React.act(async () => {
    finishWrite();
    await pendingWrite;
  });
  await expect.element(screen.getByText('Copied', { exact: true })).toBeVisible();
  const tooltip = screen.getByRole('tooltip').element();
  expect(tooltip).toHaveAttribute('popover', 'hint');
  expect(tooltip.matches(':popover-open')).toBe(true);
  expect(regularGlyph(button.element())).not.toBe(initialGlyph);
  expect(button).toHaveAttribute('aria-label', 'Copy project code');
  expect(button).not.toHaveAttribute('aria-describedby');
  expect(button).not.toHaveAttribute('aria-labelledby');
  expect(events).toEqual(['click', 'write', 'success']);
  expect(onCopyError).not.toHaveBeenCalled();
});

test.each(['rejection', 'synchronous failure'] as const)(
  'reports clipboard %s without successful feedback',
  async (kind) => {
    const error = new Error('Clipboard unavailable');
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    if (kind === 'rejection') writeText.mockRejectedValue(error);
    else
      writeText.mockImplementation(() => {
        throw error;
      });
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onCopySuccess = vi.fn();
    const onCopyError = vi.fn();
    const screen = await render(
      <CopyButton
        aria-label="Copy project code"
        contentToCopy="CoreAI-42"
        onCopySuccess={onCopySuccess}
        onCopyError={onCopyError}
      />,
      { wrapper: TestProvider },
    );
    const button = screen.getByRole('button', { name: 'Copy project code' });
    const initialGlyph = regularGlyph(button.element());
    await userEvent.click(button);
    await expect.poll(() => onCopyError.mock.calls.length).toBe(1);
    expect(report).toHaveBeenCalledWith('Failed to write to clipboard:', error);
    expect(onCopySuccess).not.toHaveBeenCalled();
    expect(screen.getByRole('tooltip').query()).toBeNull();
    expect(regularGlyph(button.element())).toBe(initialGlyph);
  },
);

test.each(['', undefined])(
  'still calls onClick but skips clipboard outcomes for empty content %s',
  async (contentToCopy) => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const onClick = vi.fn();
    const onCopySuccess = vi.fn();
    const onCopyError = vi.fn();
    const screen = await render(
      <CopyButton
        aria-label="Copy empty content"
        contentToCopy={contentToCopy}
        onClick={onClick}
        onCopySuccess={onCopySuccess}
        onCopyError={onCopyError}
      />,
      { wrapper: TestProvider },
    );
    await userEvent.click(screen.getByRole('button', { name: 'Copy empty content' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(writeText).not.toHaveBeenCalled();
    expect(onCopySuccess).not.toHaveBeenCalled();
    expect(onCopyError).not.toHaveBeenCalled();
    expect(screen.getByRole('tooltip').query()).toBeNull();
  },
);

test('preserves caller icon renderers, slot refs, classes, and visual props during feedback', async () => {
  expectTypeOf(CopyButton).toMatchTypeOf<ForwardRefComponent<CopyButtonProps>>();
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  const iconRef = React.createRef<HTMLSpanElement>();
  const rootRef = React.createRef<HTMLButtonElement>();
  const renderIcon: SlotRenderFunction<ExtractSlotProps<ButtonSlots['icon']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-rendered-icon="">
      <span data-caller-icon="">Custom</span>
    </Component>
  );
  const screen = await render(
    <CopyButton
      ref={rootRef}
      aria-label="Copy with caller icon"
      aria-describedby="copy-help"
      contentToCopy="CoreAI-42"
      appearance="primary"
      shape="square"
      size="small"
      className="consumer-copy"
      icon={{ ref: iconRef, className: 'consumer-copy-icon', children: renderIcon }}
      iconPosition="after"
    >
      Copy code
    </CopyButton>,
    { wrapper: TestProvider },
  );
  const button = screen.getByRole('button', { name: 'Copy with caller icon' }).element();
  expect(rootRef.current).toBe(button);
  expect(button).toHaveClass('fui-CopyButton', 'fui-Button', 'consumer-copy');
  expect(button).toHaveAttribute('aria-describedby', 'copy-help');
  expect(button).toHaveAttribute('data-appearance', 'primary');
  expect(button).toHaveAttribute('data-shape', 'square');
  expect(button).toHaveAttribute('data-size', 'small');
  expect(iconRef.current).toHaveClass('fui-Button__icon', 'consumer-copy-icon');
  expect(iconRef.current).toHaveAttribute('data-rendered-icon', '');
  expect(button.lastElementChild).toBe(iconRef.current);
  for (const prop of ['appearance', 'shape', 'size', 'contenttocopy']) {
    expect(button).not.toHaveAttribute(prop);
  }
  await userEvent.click(button);
  await expect.element(screen.getByText('Copied', { exact: true })).toBeVisible();
  expect(writeText).toHaveBeenCalledExactlyOnceWith('CoreAI-42');
  expect(button.querySelector('[data-caller-icon]')).toHaveTextContent('Custom');
  expect(button.querySelector('svg')).toBeNull();
  expect(button.lastElementChild).toBe(iconRef.current);
});

test('retains the public Button root renderer and anchor ref without suppressing a prevented copy', async () => {
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  const ref = React.createRef<HTMLAnchorElement>();
  const renderRoot: SlotRenderFunction<ExtractSlotProps<Slot<'a'>>> = (Component, props) => (
    <Component {...props} data-rendered-copy-root="">
      {props.children}
      <span>Copy from anchor</span>
    </Component>
  );
  const onClick = vi.fn((event: React.MouseEvent<HTMLAnchorElement>) => {
    expect(event.currentTarget).toBe(ref.current);
    event.preventDefault();
  });
  const screen = await render(
    <CopyButton
      as="a"
      ref={ref}
      href="#copy-destination"
      aria-label="Copy from anchor"
      contentToCopy="CoreAI-42"
      onClick={onClick}
    >
      {renderRoot}
    </CopyButton>,
    { wrapper: TestProvider },
  );
  const anchor = screen.getByRole('link', { name: 'Copy from anchor' });
  expect(ref.current).toBe(anchor.element());
  expect(anchor).toHaveAttribute('data-rendered-copy-root', '');
  expect(anchor).toHaveAttribute('href', '#copy-destination');
  await userEvent.click(anchor);
  expect(onClick).toHaveBeenCalledOnce();
  expect(writeText).toHaveBeenCalledExactlyOnceWith('CoreAI-42');
});

test('keeps native keyboard/form results and blocks disabled clipboard activation', async () => {
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  const screen = await render(<CopyButtonFlow />, { wrapper: TestProvider });
  await userEvent.click(screen.getByRole('textbox', { name: 'Project code' }));
  await userEvent.fill(screen.getByRole('textbox', { name: 'Project code' }), 'CoreAI-84');
  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'Copy code only' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  await expect
    .element(screen.getByRole('status', { name: 'Copy outcomes' }))
    .toHaveTextContent('1 clicks; 1 copied; 0 errors');
  await expect
    .element(screen.getByRole('status', { name: 'Copy form result' }))
    .toHaveTextContent('No submission');
  await userEvent.keyboard(' ');
  await expect
    .element(screen.getByRole('status', { name: 'Copy outcomes' }))
    .toHaveTextContent('2 clicks; 2 copied; 0 errors');
  await userEvent.tab();
  await userEvent.keyboard('{Enter}');
  await expect
    .element(screen.getByRole('status', { name: 'Copy form result' }))
    .toHaveTextContent('Submitted CoreAI-84 (copy)');
  await expect
    .element(screen.getByRole('status', { name: 'Copy outcomes' }))
    .toHaveTextContent('3 clicks; 3 copied; 0 errors');
  await userEvent.tab();
  const focusable = screen.getByRole('button', { name: 'Focusable unavailable copy' });
  await expect.element(focusable).toHaveFocus();
  expect(focusable).toHaveAttribute('aria-disabled', 'true');
  await userEvent.keyboard('{Enter} ');
  await userEvent.click(focusable, { force: true });
  await userEvent.click(screen.getByRole('button', { name: 'Unavailable copy', exact: true }), {
    force: true,
  });
  expect(writeText).toHaveBeenCalledTimes(3);
  expect(writeText).toHaveBeenLastCalledWith('CoreAI-84');
  await expect
    .element(screen.getByRole('status', { name: 'Copy outcomes' }))
    .toHaveTextContent('3 clicks; 3 copied; 0 errors');
});

test('resets the success glyph and tooltip after the existing 1500ms feedback window', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  const screen = await render(<CopyButton aria-label="Timed copy" contentToCopy="CoreAI-42" />, {
    wrapper: TestProvider,
  });
  const button = screen.getByRole('button', { name: 'Timed copy' }).element();
  if (!(button instanceof HTMLButtonElement)) throw new Error('Missing native timed CopyButton');
  const copyGlyph = regularGlyph(button);
  await React.act(async () => {
    button.click();
  });
  const copiedGlyph = regularGlyph(button);
  expect(copiedGlyph).not.toBe(copyGlyph);
  await React.act(async () => {
    await vi.advanceTimersByTimeAsync(1499);
  });
  expect(regularGlyph(button)).toBe(copiedGlyph);
  expect(screen.getByRole('tooltip').query()).not.toBeNull();
  await React.act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(regularGlyph(button)).toBe(copyGlyph);
  expect(screen.getByRole('tooltip').query()).toBeNull();
});

test('does not silently extend the original timer on a second successful copy', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const setTimeout = vi.spyOn(window, 'setTimeout');
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  const onCopySuccess = vi.fn();
  const screen = await render(
    <CopyButton
      aria-label="Repeated copy"
      contentToCopy="CoreAI-42"
      onCopySuccess={onCopySuccess}
    />,
    { wrapper: TestProvider },
  );
  const button = screen.getByRole('button', { name: 'Repeated copy' }).element();
  if (!(button instanceof HTMLButtonElement)) throw new Error('Missing native repeated CopyButton');
  const copyGlyph = regularGlyph(button);
  await React.act(async () => {
    button.click();
  });
  await React.act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
    button.click();
  });
  expect(writeText).toHaveBeenCalledTimes(2);
  expect(onCopySuccess).toHaveBeenCalledTimes(2);
  expect(setTimeout.mock.calls.filter(([, delay]) => delay === 1500)).toHaveLength(1);
  await React.act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });
  expect(regularGlyph(button)).toBe(copyGlyph);
});

test('clears the feedback timer when content changes and when the button unmounts', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const setTimeout = vi.spyOn(window, 'setTimeout');
  const clearTimeout = vi.spyOn(window, 'clearTimeout');
  vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  const ref = React.createRef<HTMLButtonElement>();
  const screen = await render(
    <CopyButton ref={ref} aria-label="Changing copy" contentToCopy="First" />,
    { wrapper: TestProvider },
  );
  const button = screen.getByRole('button', { name: 'Changing copy' }).element();
  if (!(button instanceof HTMLButtonElement)) throw new Error('Missing native changing CopyButton');
  const copyGlyph = regularGlyph(button);
  await React.act(async () => {
    button.click();
  });
  const firstTimerIndex = setTimeout.mock.calls.findIndex(([, delay]) => delay === 1500);
  expect(firstTimerIndex).toBeGreaterThanOrEqual(0);
  const firstTimer = setTimeout.mock.results[firstTimerIndex].value;
  await screen.rerender(<CopyButton ref={ref} aria-label="Changing copy" contentToCopy="Second" />);
  expect(regularGlyph(button)).toBe(copyGlyph);
  expect(screen.getByRole('tooltip').query()).toBeNull();
  expect(clearTimeout).toHaveBeenCalledWith(firstTimer);
  await React.act(async () => {
    button.click();
  });
  const timerIndices = setTimeout.mock.calls
    .map(([, delay], index) => (delay === 1500 ? index : -1))
    .filter((index) => index >= 0);
  expect(timerIndices).toHaveLength(2);
  const secondTimer = setTimeout.mock.results[timerIndices[1]].value;
  await screen.unmount();
  expect(ref.current).toBeNull();
  expect(clearTimeout).toHaveBeenCalledWith(secondTimer);
});
