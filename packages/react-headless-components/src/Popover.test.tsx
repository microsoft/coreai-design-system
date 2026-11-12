// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, beforeEach, expect, expectTypeOf, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import {
  PopoverSurface as PrimitivePopoverSurface,
  PopoverTrigger as PrimitivePopoverTrigger,
  usePopoverContext as primitiveUsePopoverContext,
  usePopoverContextValues as primitiveUsePopoverContextValues,
  type PopoverProps as PrimitivePopoverProps,
  type PopoverSurfaceSlots as PrimitivePopoverSurfaceSlots,
} from '@fluentui/react-headless-components-preview/popover';
import type { PositioningImperativeRef } from '@fluentui/react-headless-components-preview/positioning';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { ComparisonProvider as CoreAIFluentProvider } from '../../../apps/storybook/src/stories/experiments/ComparisonProvider.js';
import {
  PopoverAnchorFlow,
  PopoverComparison,
  PopoverContextFlow,
  PopoverControlledFlow,
  PopoverNestedFlow,
  popoverConsumerExample,
  popoverExamples,
  type PopoverExample,
} from '../../../apps/storybook/src/stories/experiments/PopoverComparison.js';
import { ComparisonWithReport } from '../../../apps/storybook/src/stories/experiments/PopoverComparisonReport.js';
import {
  capturePopoverNativeContract,
  capturePopoverPlacement,
  capturePopoverStyles,
  comparePopoverStyles,
  getComparisonPopover,
  getComparisonPopoverTrigger,
  getPopoverArrow,
  settlePopoverStyles,
} from '../../../apps/storybook/src/stories/experiments/comparePopoverStyles.js';
import {
  Popover,
  usePopoverContext,
  usePopoverContextValues,
  type PopoverProps,
} from './Popover.js';
import {
  PopoverSurface,
  popoverSurfaceClassNames,
  type PopoverSurfaceProps,
  type PopoverSurfaceSlots,
} from './PopoverSurface.js';
import { PopoverTrigger } from './PopoverTrigger.js';

let documentDirection: string | null = null;
beforeEach(() => {
  documentDirection = document.documentElement.getAttribute('dir');
});

afterEach(async () => {
  await cleanup();
  if (documentDirection === null) document.documentElement.removeAttribute('dir');
  else document.documentElement.setAttribute('dir', documentDirection);
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

function requireHTMLElement(element: Element): HTMLElement {
  if (!(element instanceof HTMLElement)) {
    throw new Error('Expected the current native HTML branch');
  }
  return element;
}

test('1440x1000 comparison refreshes ancestor-only relocation and keeps the published report stable', async () => {
  const previousViewport = { width: innerWidth, height: innerHeight };
  await page.viewport(1440, 1000);
  const initial: { reportHeight?: number; triggerWidth?: number; triggerHeight?: number } = {};
  function RelocatingReport() {
    const [relocated, setRelocated] = React.useState(false);
    React.useLayoutEffect(() => {
      const report = document.querySelector('[aria-label="Popover style report"]');
      const trigger = document.querySelector('[data-popover-trigger="legacy"]');
      initial.reportHeight = report?.getBoundingClientRect().height;
      initial.triggerWidth = trigger?.getBoundingClientRect().width;
      initial.triggerHeight = trigger?.getBoundingClientRect().height;
    }, []);
    React.useEffect(() => {
      const frame = requestAnimationFrame(() => setRelocated(true));
      return () => cancelAnimationFrame(frame);
    }, []);
    return (
      <div
        data-testid="relocating-report"
        data-relocated={relocated ? 'true' : 'false'}
        style={{ paddingBlockStart: relocated ? '20px' : '0px' }}
      >
        <ComparisonWithReport />
      </div>
    );
  }
  try {
    expect([innerWidth, innerHeight]).toEqual([1440, 1000]);
    const screen = await render(
      <CoreAIFluentProvider theme={coreaiLightTheme}>
        <RelocatingReport />
      </CoreAIFluentProvider>,
    );
    const report = screen.getByRole('status', { name: 'Popover style report' });
    await expect
      .element(screen.getByTestId('relocating-report'))
      .toHaveAttribute('data-relocated', 'true');
    await expect.element(report).toHaveAttribute('data-popover-report-example', 'Default surface');
    await expect.element(report).toHaveAttribute('data-popover-report-state', 'ready');
    expect(
      report.element().getAttribute('data-popover-unexpected-count'),
      report.element().textContent ?? '',
    ).toBe('0');
    await expect
      .element(report)
      .toHaveTextContent('No unexpected differences in the selected properties.');
    expect(initial.reportHeight).toBe(448);
    expect(report.element().getBoundingClientRect().height).toBe(initial.reportHeight);
    const legacy = getComparisonPopover(screen.container, 'legacy');
    const trigger = getComparisonPopoverTrigger(screen.container, 'legacy');
    expect(trigger.getBoundingClientRect().width).toBe(initial.triggerWidth);
    expect(trigger.getBoundingClientRect().height).toBe(initial.triggerHeight);
    expect(capturePopoverPlacement(legacy, trigger)).toEqual({
      'anchor.side': 'above',
      'anchor.gap': '0',
      'anchor.cross-offset': '0',
    });
    await userEvent.selectOptions(
      screen.getByLabelText('Popover visual fixture'),
      'Inverted arrow above',
    );
    await expect
      .element(report)
      .toHaveAttribute('data-popover-report-example', 'Inverted arrow above');
    await expect.element(report).toHaveAttribute('data-popover-unexpected-count', '0');
    await expect.element(report).toHaveTextContent('native-arrow-gap');
    expect(report.element().getBoundingClientRect().height).toBe(initial.reportHeight);
  } finally {
    await cleanup();
    await page.viewport(previousViewport.width, previousViewport.height);
  }
});

async function renderPair(
  example: PopoverExample,
  theme = coreaiLightTheme,
  dir: 'ltr' | 'rtl' = 'ltr',
  withComponentDefaults = true,
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} dir={dir} withComponentDefaults={withComponentDefaults}>
      <PopoverComparison example={example} />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('Legacy Portal / Popper', { exact: true }));
  const legacy = getComparisonPopover(screen.container, 'legacy');
  const headless = getComparisonPopover(screen.container, 'headless');
  await Promise.all([settlePopoverStyles(legacy), settlePopoverStyles(headless)]);
  const legacyTrigger = getComparisonPopoverTrigger(screen.container, 'legacy');
  const headlessTrigger = getComparisonPopoverTrigger(screen.container, 'headless');
  const differences = comparePopoverStyles(
    capturePopoverStyles(legacy, legacyTrigger),
    capturePopoverStyles(headless, headlessTrigger),
    example.props?.withArrow ? (example.props.size === 'small' ? 6 : 8) : undefined,
  );
  return { screen, legacy, headless, legacyTrigger, headlessTrigger, differences };
}

function NativeFixture({
  asDiv = false,
  autoFocus = false,
  ...props
}: Omit<PopoverProps, 'children'> & { asDiv?: boolean; autoFocus?: boolean }) {
  const autofocusRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      // Set the native attribute, not React 18's early imperative autoFocus call.
      if (node) node.autofocus = autoFocus;
    },
    [autoFocus],
  );
  const children = (
    <>
      <button type="button" ref={autofocusRef}>
        First native action
      </button>
      <button type="button">Last native action</button>
    </>
  );
  return (
    <CoreAIFluentProvider>
      <div>
        <button type="button">Before native popover</button>
        <Popover positioning={{ position: 'below', offset: 10 }} {...props}>
          <PopoverTrigger>
            <button type="button">Native popover trigger</button>
          </PopoverTrigger>
          {asDiv ? (
            <PopoverSurface as="div" aria-label="Native popover">
              {children}
            </PopoverSurface>
          ) : (
            <PopoverSurface aria-label="Native popover">{children}</PopoverSurface>
          )}
        </Popover>
        <button type="button">Outside native popover</button>
      </div>
    </CoreAIFluentProvider>
  );
}

test('preserves the pinned public native surface, refs, context helpers, and behavior-only trigger', () => {
  expectTypeOf<typeof PopoverSurface>().toEqualTypeOf<ForwardRefComponent<PopoverSurfaceProps>>();
  expectTypeOf<React.ComponentProps<typeof PopoverSurface>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitivePopoverSurface>['ref']
  >();
  expectTypeOf<PopoverSurfaceSlots>().toEqualTypeOf<PrimitivePopoverSurfaceSlots>();
  expectTypeOf<PopoverSurfaceProps['as']>().toEqualTypeOf<'dialog' | 'div' | undefined>();
  expectTypeOf<Omit<PopoverProps, 'appearance' | 'size'>>().toEqualTypeOf<PrimitivePopoverProps>();
  expectTypeOf<
    Extract<
      keyof PopoverProps,
      | 'inline'
      | 'mountNode'
      | 'legacyTrapFocus'
      | 'surfaceMotion'
      | 'closeOnScroll'
      | 'unstable_disableAutoFocus'
    >
  >().toEqualTypeOf<never>();
  expect(PopoverTrigger === PrimitivePopoverTrigger).toBe(true);
  expect(usePopoverContext === primitiveUsePopoverContext).toBe(true);
  expect(usePopoverContextValues === primitiveUsePopoverContextValues).toBe(true);
});

for (const [mode, theme] of themes) {
  test.each(popoverExamples)(
    `matches $name surface/trigger/arrow styles and comparable placement in ${mode}`,
    async (example) => {
      const { legacy, headless, headlessTrigger, differences } = await renderPair(example, theme);
      expect(
        differences.filter((difference) => difference.kind === 'unexpected'),
        `Viewport ${innerWidth}x${innerHeight}; native anchor ${JSON.stringify(
          headlessTrigger.getBoundingClientRect().toJSON(),
        )}; surface ${JSON.stringify(headless.getBoundingClientRect().toJSON())}`,
      ).toEqual([]);
      expect(differences.filter((difference) => difference.kind === 'native-arrow-gap')).toEqual(
        example.props?.withArrow
          ? [
              {
                property: 'anchor.gap',
                legacy: String(10 + (example.props.size === 'small' ? 6 : 8)),
                headless: '10',
                kind: 'native-arrow-gap',
              },
            ]
          : [],
      );
      expect(headless.tagName).toBe('DIALOG');
      expect(headless.matches(':popover-open')).toBe(true);
      expect(headless.matches(':modal')).toBe(false);
      expect(headless.hasAttribute('open')).toBe(false);
      expect(headless).toHaveAttribute('popover', 'auto');
      expect(headless).toHaveAttribute('data-open', '');
      expect(headless).toHaveAttribute('role', 'group');
      expect(headless).toHaveClass(popoverSurfaceClassNames.root);
      expect(headlessTrigger).toHaveAttribute('aria-details', headless.id);
      expect(headless.closest('[data-popover-comparison]') !== null).toBe(true);
      expect(legacy.closest('[data-popover-comparison]') === null).toBe(true);
      expect(getComputedStyle(headless, '::backdrop').backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(Boolean(getPopoverArrow(headless))).toBe(Boolean(example.props?.withArrow));
    },
  );

  test.each(
    popoverExamples.filter((example) =>
      ['Default surface', 'Arrow: small', 'Inverted arrow above', 'Brand arrow below'].includes(
        example.name,
      ),
    ),
  )(`retains stock Fluent borders for $name with defaults disabled in ${mode}`, async (example) => {
    const { legacy, headless, differences } = await renderPair(example, theme, 'ltr', false);
    expect(differences.filter((difference) => difference.kind === 'unexpected')).toEqual([]);
    expect(headless.hasAttribute('data-coreai-defaults')).toBe(false);
    expect(getComputedStyle(headless).borderTopColor).toBe(getComputedStyle(legacy).borderTopColor);
    const arrow = getPopoverArrow(headless);
    const legacyArrow = getPopoverArrow(legacy);
    if (arrow && legacyArrow) {
      expect(getComputedStyle(arrow, '::before').borderTopColor).toBe(
        getComputedStyle(legacyArrow, '::before').borderTopColor,
      );
    }
  });
}

test.each(popoverExamples)(
  'keeps bounded visual/anchor parity for $name in RTL',
  async (example) => {
    const { headless, differences } = await renderPair(example, coreaiLightTheme, 'rtl');
    expect(differences.filter((difference) => difference.kind === 'unexpected')).toEqual([]);
    expect(getComputedStyle(headless).direction).toBe('rtl');
  },
);

test('keeps explicitly undefined size unpadded instead of confusing it with the omitted medium default', async () => {
  const omitted = await renderPair(popoverExamples[0]);
  expect(getComputedStyle(omitted.headless).paddingTop).toBe('16px');
  await cleanup();
  const explicit = await renderPair({
    name: 'Explicitly undefined size',
    props: { size: undefined },
  });
  expect(explicit.headless.hasAttribute('data-size')).toBe(false);
  expect(getComputedStyle(explicit.headless).paddingTop).toBe('0px');
  expect(explicit.differences).toEqual([]);
});

test('ordinary consumer CSS and arrow pseudo-element styles override both Fluent and CoreAI layers', async () => {
  const { headless } = await renderPair(popoverConsumerExample);
  const computed = getComputedStyle(headless);
  expect(computed.paddingTop).toBe('9px');
  expect(computed.borderTopWidth).toBe('3px');
  expect(computed.borderTopStyle).toBe('dashed');
  expect(computed.borderTopColor).toBe('rgb(98, 42, 139)');
  expect(computed.borderRadius).toBe('3px');
  expect(computed.backgroundColor).toBe('rgb(237, 232, 247)');
  expect(computed.color).toBe('rgb(80, 40, 120)');
  const arrow = getPopoverArrow(headless);
  if (!arrow) throw new Error('Missing public arrow');
  expect(getComputedStyle(arrow).backgroundColor).toBe(computed.backgroundColor);
  expect(getComputedStyle(arrow, '::before').borderTopWidth).toBe('3px');
  expect(getComputedStyle(arrow, '::before').borderTopStyle).toBe('dashed');
});

test('keeps CSS, offsets, and non-arrow dimensions exact with bounded rotated-arrow rectangle noise', () => {
  for (const property of [
    'surface.rect.width',
    'surface.rect.height',
    'surface.padding-top',
    'arrow::before.margin-top',
    'anchor.cross-offset',
  ]) {
    expect(comparePopoverStyles({ [property]: '100' }, { [property]: '100.01' }, 8)).toEqual([
      { property, legacy: '100', headless: '100.01', kind: 'unexpected' },
    ]);
  }
  expect(comparePopoverStyles({ 'anchor.gap': '18' }, { 'anchor.gap': '10' }, 8)[0].kind).toBe(
    'native-arrow-gap',
  );
  expect(comparePopoverStyles({ 'anchor.gap': '18.01' }, { 'anchor.gap': '10' }, 8)[0].kind).toBe(
    'unexpected',
  );
  expect(comparePopoverStyles({ 'anchor.gap': '18' }, { 'anchor.gap': '10' })[0].kind).toBe(
    'unexpected',
  );
  for (const property of ['arrow.rect.width', 'arrow.rect.height']) {
    expect(comparePopoverStyles({ [property]: '12' }, { [property]: '12.5' })).toEqual([]);
    expect(comparePopoverStyles({ [property]: '12' }, { [property]: '12.51' })[0].kind).toBe(
      'unexpected',
    );
  }
  expect(
    comparePopoverStyles({ 'arrow.width': '8.484px' }, { 'arrow.width': '8.485px' })[0].kind,
  ).toBe('unexpected');
  expect(
    comparePopoverStyles(
      { 'anchor.side': 'below', 'arrow.translate': 'none' },
      { 'anchor.side': 'below', 'arrow.translate': '-50%' },
    )[0].kind,
  ).toBe('native-arrow-centering');
  expect(
    comparePopoverStyles(
      { 'anchor.side': 'below', 'arrow.translate': 'none' },
      { 'anchor.side': 'below', 'arrow.translate': '-49%' },
    )[0].kind,
  ).toBe('unexpected');
});

for (const as of ['dialog', 'div'] as const) {
  test(`closed standalone ${as} surfaces stay UA-hidden despite visual styles`, async () => {
    const dialogRef = React.createRef<HTMLDialogElement>();
    const divRef = React.createRef<HTMLDivElement>();
    const screen = await render(
      <CoreAIFluentProvider>
        {as === 'dialog' ? (
          <PopoverSurface as="dialog" ref={dialogRef} aria-label="Closed standalone surface">
            <button type="button">Hidden action</button>
          </PopoverSurface>
        ) : (
          <PopoverSurface as="div" ref={divRef} aria-label="Closed standalone surface">
            <button type="button">Hidden action</button>
          </PopoverSurface>
        )}
      </CoreAIFluentProvider>,
    );
    const surface = dialogRef.current ?? divRef.current;
    if (!surface) throw new Error('Standalone surface ref was not preserved');
    expect(surface.tagName).toBe(as.toUpperCase());
    expect(getComputedStyle(surface).display).toBe('none');
    expect(surface.getBoundingClientRect().width).toBe(0);
    expect(surface.getBoundingClientRect().height).toBe(0);
    expect(surface.getClientRects().length).toBe(0);
    expect(screen.getByRole('button', { name: 'Hidden action' }).query()).toBeNull();
  });
}

test('uncontrolled click/toggle state, ids, ARIA, and callback event identity remain native', async () => {
  const changes = vi.fn<NonNullable<PopoverProps['onOpenChange']>>();
  const screen = await render(<NativeFixture id="native-details" onOpenChange={changes} />);
  const trigger = screen.getByRole('button', { name: 'Native popover trigger' });
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(screen.getByRole('group', { name: 'Native popover' }).query()).toBeNull();
  await userEvent.click(trigger);
  const surface = screen.getByRole('group', { name: 'Native popover' });
  await expect.element(surface).toBeVisible();
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.element(trigger).not.toHaveAttribute('aria-haspopup');
  await expect.element(trigger).toHaveAttribute('aria-details', 'native-details');
  await expect.element(trigger).toHaveAttribute('aria-controls', 'native-details');
  await expect.element(surface).toHaveAttribute('id', 'native-details');
  await expect.element(surface).not.toHaveAttribute('aria-modal');
  expect(surface.element().matches(':popover-open')).toBe(true);
  expect(
    changes.mock.calls.map(([event, data]) => [event === data.event, data.type, data.open]),
  ).toEqual([[true, 'click', true]]);
  await userEvent.click(trigger);
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(() => surface.query() === null).toBe(true);
  expect(changes.mock.calls.map(([, data]) => [data.type, data.open])).toEqual([
    ['click', true],
    ['click', false],
  ]);
});

test('defaultOpen starts in the top layer without synthesizing an open callback', async () => {
  const changes = vi.fn<NonNullable<PopoverProps['onOpenChange']>>();
  const screen = await render(<NativeFixture defaultOpen onOpenChange={changes} />);
  const surface = screen.getByRole('group', { name: 'Native popover' });
  await expect.element(surface).toBeVisible();
  expect(surface.element().matches(':popover-open')).toBe(true);
  expect(changes).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Native popover trigger' }));
  await expect.poll(() => surface.query() === null).toBe(true);
  expect(changes.mock.calls.map(([, data]) => data.open)).toEqual([false]);
});

test('Enter and Space use the native trigger, and Escape restores focus after a native close', async () => {
  const changes = vi.fn<NonNullable<PopoverProps['onOpenChange']>>();
  const screen = await render(<NativeFixture autoFocus onOpenChange={changes} />);
  const start = screen.getByRole('button', { name: 'Before native popover' });
  const trigger = screen.getByRole('button', { name: 'Native popover trigger' });
  await userEvent.hover(start);
  await userEvent.click(start);
  await userEvent.keyboard('{Tab}');
  await expect.element(trigger).toHaveFocus();
  expect(trigger.element().matches(':hover')).toBe(false);
  expect(trigger.element().matches(':focus-visible')).toBe(true);
  await userEvent.keyboard('{Enter}');
  await expect.element(screen.getByRole('button', { name: 'First native action' })).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  await expect
    .poll(() => screen.getByRole('group', { name: 'Native popover' }).query() === null)
    .toBe(true);
  await expect.element(trigger).toHaveFocus();
  await userEvent.keyboard(' ');
  await expect.element(screen.getByRole('group', { name: 'Native popover' })).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.element(trigger).toHaveFocus();
  expect(changes.mock.calls.map(([, data]) => [data.type, data.open])).toEqual([
    ['click', true],
    ['toggle', false],
    ['click', true],
    ['toggle', false],
  ]);
});

test('a non-modal div does not acquire an invented autofocus or focus trap', async () => {
  const screen = await render(<NativeFixture asDiv />);
  const trigger = screen.getByRole('button', { name: 'Native popover trigger' });
  await userEvent.click(trigger);
  const surface = screen.getByRole('group', { name: 'Native popover' });
  await expect.element(surface).toBeVisible();
  expect(surface.element().tagName).toBe('DIV');
  await expect.element(trigger).toHaveFocus();
  await userEvent.keyboard('{Tab}');
  await expect.element(screen.getByRole('button', { name: 'First native action' })).toHaveFocus();
  await userEvent.keyboard('{Tab}');
  await expect.element(screen.getByRole('button', { name: 'Last native action' })).toHaveFocus();
  await userEvent.keyboard('{Tab}');
  await expect
    .element(screen.getByRole('button', { name: 'Outside native popover' }))
    .toHaveFocus();
  expect(surface.element().matches(':popover-open')).toBe(true);
});

test('trusted outside clicks light-dismiss and report native toggle without stealing outside focus', async () => {
  const changes = vi.fn<NonNullable<PopoverProps['onOpenChange']>>();
  const screen = await render(<NativeFixture asDiv autoFocus onOpenChange={changes} />);
  await userEvent.click(screen.getByRole('button', { name: 'Native popover trigger' }));
  await expect.element(screen.getByRole('button', { name: 'First native action' })).toHaveFocus();
  const surface = screen.getByRole('group', { name: 'Native popover' }).element();
  let closedDisplay: string | undefined;
  surface.addEventListener('toggle', () => {
    if (!surface.matches(':popover-open')) closedDisplay = getComputedStyle(surface).display;
  });
  const outside = screen.getByRole('button', { name: 'Outside native popover' });
  await userEvent.click(outside);
  await expect
    .poll(() => screen.getByRole('group', { name: 'Native popover' }).query() === null)
    .toBe(true);
  await expect.element(outside).toHaveFocus();
  expect(closedDisplay).toBe('none');
  expect(
    changes.mock.calls.map(([event, data]) => [event === data.event, data.type, data.open]),
  ).toEqual([
    [true, 'click', true],
    [true, 'toggle', false],
  ]);
});

test('controlled false only requests opening and never opens against the owner state', async () => {
  const changes = vi.fn<NonNullable<PopoverProps['onOpenChange']>>();
  const screen = await render(<NativeFixture open={false} onOpenChange={changes} />);
  const trigger = screen.getByRole('button', { name: 'Native popover trigger' });
  await userEvent.click(trigger);
  await userEvent.click(trigger);
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(screen.getByRole('group', { name: 'Native popover' }).query()).toBeNull();
  expect(changes.mock.calls.map(([, data]) => data.open)).toEqual([true, true]);
});

test('controlled owner state follows trigger, context close, native Escape, and native outside-dismiss requests', async () => {
  const changes = vi.fn<NonNullable<PopoverProps['onOpenChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <PopoverControlledFlow onOpenChange={changes} />
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Open access details' });
  await userEvent.click(trigger);
  await expect
    .element(screen.getByRole('status', { name: 'Access details state' }))
    .toHaveTextContent('Open');
  await userEvent.click(screen.getByRole('button', { name: 'Close access details' }));
  await expect
    .element(screen.getByRole('status', { name: 'Access details state' }))
    .toHaveTextContent('Closed');
  await userEvent.click(trigger);
  await userEvent.keyboard('{Escape}');
  await expect
    .element(screen.getByRole('status', { name: 'Access details events' }))
    .toHaveTextContent('toggle:closed');
  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole('button', { name: 'Outside access details' }));
  await expect
    .element(screen.getByRole('status', { name: 'Access details state' }))
    .toHaveTextContent('Closed');
  expect(changes.mock.calls.map(([, data]) => data.open)).toEqual([
    true,
    false,
    true,
    false,
    true,
    false,
  ]);
});

test('inertTrapFocus uses showModal, native inertness, transparent backdrop, and spec focus restoration', async () => {
  const changes = vi.fn<NonNullable<PopoverProps['onOpenChange']>>();
  const screen = await render(<NativeFixture inertTrapFocus onOpenChange={changes} />);
  const trigger = screen.getByRole('button', { name: 'Native popover trigger' });
  const outside = requireHTMLElement(
    screen.getByRole('button', { name: 'Outside native popover' }).element(),
  );
  await userEvent.click(trigger);
  const surface = screen.getByRole('dialog', { name: 'Native popover' });
  await expect.element(surface).toBeVisible();
  const root = surface.element();
  expect(root instanceof HTMLDialogElement).toBe(true);
  expect(root.matches(':modal')).toBe(true);
  expect(root.matches(':popover-open')).toBe(false);
  await expect.element(surface).toHaveAttribute('open', '');
  await expect.element(surface).not.toHaveAttribute('popover');
  await expect.element(surface).not.toHaveAttribute('aria-modal');
  await expect.element(screen.getByRole('button', { name: 'First native action' })).toHaveFocus();
  outside.focus();
  expect(document.activeElement === outside).toBe(false);
  await userEvent.keyboard('{Tab}');
  await expect.element(screen.getByRole('button', { name: 'Last native action' })).toHaveFocus();
  await userEvent.keyboard('{Tab}');
  expect(document.activeElement === outside).toBe(false);
  expect(root.matches(':modal')).toBe(true);
  expect(capturePopoverNativeContract(root)['backdrop.background-color']).toBe('rgba(0, 0, 0, 0)');
  requireHTMLElement(screen.getByRole('button', { name: 'First native action' }).element()).focus();
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => surface.query() === null).toBe(true);
  await expect.element(trigger).toHaveFocus();
  expect(changes.mock.calls.map(([, data]) => [data.type, data.open])).toEqual([
    ['click', true],
    ['close', false],
  ]);
});

test('nested native popovers retain the parent and Escape dismisses only the topmost surface', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <PopoverNestedFlow />
    </CoreAIFluentProvider>,
  );
  const outerTrigger = screen.getByRole('button', { name: 'Open project permissions' });
  await userEvent.click(outerTrigger);
  const outer = screen.getByRole('group', { name: 'Project permissions' });
  const innerTrigger = screen.getByRole('button', { name: 'Open editor permissions' });
  await userEvent.click(innerTrigger);
  const inner = screen.getByRole('group', { name: 'Editor permissions' });
  await expect.element(inner).toBeVisible();
  expect(outer.element().contains(inner.element())).toBe(true);
  expect(outer.element().matches(':popover-open')).toBe(true);
  expect(inner.element().matches(':popover-open')).toBe(true);
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => inner.query() === null).toBe(true);
  expect(outer.element().matches(':popover-open')).toBe(true);
  await expect.element(innerTrigger).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => outer.query() === null).toBe(true);
  await expect.element(outerTrigger).toHaveFocus();
  await userEvent.click(outerTrigger);
  await userEvent.click(screen.getByRole('button', { name: 'Open editor permissions' }));
  await userEvent.click(screen.getByRole('button', { name: 'Outside permissions' }));
  await expect.poll(() => outer.query() === null && inner.query() === null).toBe(true);
});

test('native auto popover peers dismiss each other instead of retaining a legacy overlay stack', async () => {
  const firstChanges = vi.fn<NonNullable<PopoverProps['onOpenChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <Popover onOpenChange={firstChanges}>
        <PopoverTrigger>
          <button type="button">First peer trigger</button>
        </PopoverTrigger>
        <PopoverSurface as="div" aria-label="First peer">
          First peer content
        </PopoverSurface>
      </Popover>
      <Popover>
        <PopoverTrigger>
          <button type="button">Second peer trigger</button>
        </PopoverTrigger>
        <PopoverSurface as="div" aria-label="Second peer">
          Second peer content
        </PopoverSurface>
      </Popover>
    </CoreAIFluentProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'First peer trigger' }));
  await expect.element(screen.getByRole('group', { name: 'First peer' })).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Second peer trigger' }));
  await expect.element(screen.getByRole('group', { name: 'Second peer' })).toBeVisible();
  await expect
    .poll(() => screen.getByRole('group', { name: 'First peer' }).query() === null)
    .toBe(true);
  await expect
    .element(screen.getByRole('button', { name: 'First peer trigger' }))
    .toHaveAttribute('aria-expanded', 'false');
  expect(firstChanges.mock.calls.map(([, data]) => [data.type, data.open])).toEqual([
    ['click', true],
    ['toggle', false],
  ]);
});

test('hover opens across the trigger/surface boundary and leaves through the current delayed close path', async () => {
  const changes = vi.fn<NonNullable<PopoverProps['onOpenChange']>>();
  const screen = await render(
    <NativeFixture asDiv openOnHover mouseLeaveDelay={60} onOpenChange={changes} />,
  );
  const trigger = screen.getByRole('button', { name: 'Native popover trigger' });
  await userEvent.hover(trigger);
  const surface = screen.getByRole('group', { name: 'Native popover' });
  await expect.element(surface).toBeVisible();
  await userEvent.hover(surface);
  expect(surface.element().matches(':hover')).toBe(true);
  await expect.element(surface).toBeVisible();
  await userEvent.hover(screen.getByRole('button', { name: 'Outside native popover' }));
  await expect.poll(() => surface.query() === null).toBe(true);
  expect(changes.mock.calls.some(([, data]) => data.type === 'mouseenter' && data.open)).toBe(true);
  expect(changes.mock.calls.some(([, data]) => data.type === 'mouseleave' && !data.open)).toBe(
    true,
  );
});

// 0.4.1 still waits for pointerup after contextmenu. Windows Chromium emits
// pointerup first; the controlled native context-menu case below is safe usage.
// This Browser Mode project runs Chromium. Only Windows uses expected-failure
// semantics; other platforms must pass the same first-right-click assertion.
const testFirstContextClick = /\bWindows\b/.test(navigator.userAgent) ? test.fails : test;
testFirstContextClick(
  'upstream openOnContext opens on the first Chromium right-click',
  async () => {
    const screen = await render(<NativeFixture asDiv openOnContext />);
    const trigger = screen.getByRole('button', { name: 'Native popover trigger' });
    await userEvent.click(trigger);
    expect(screen.getByRole('group', { name: 'Native popover' }).query()).toBeNull();
    await userEvent.click(trigger, { button: 'right' });
    const surface = screen.getByRole('group', { name: 'Native popover' });
    const opened = surface.query() !== null;
    try {
      expect(opened).toBe(true);
    } finally {
      // Consume the upstream one-shot document listener before unmounting this fixture.
      if (!opened) await userEvent.click(trigger);
    }
  },
);

test('a controlled native context menu opens on the first right-click and retains anchor, ARIA, Escape, and callback semantics', async () => {
  const changes = vi.fn<NonNullable<PopoverProps['onOpenChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <PopoverContextFlow onOpenChange={changes} />
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Right-click project actions' });
  await userEvent.click(trigger, { button: 'right' });
  const surface = screen.getByRole('group', { name: 'Project context actions' });
  await expect.element(surface).toBeVisible();
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.element(trigger).toHaveAttribute('aria-details', 'project-context-actions');
  expect(surface.element().style.getPropertyValue('position-anchor')).toBe(
    trigger.element().style.getPropertyValue('anchor-name'),
  );
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => surface.query() === null).toBe(true);
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(changes.mock.calls.map(([, data]) => [data.type, data.open])).toEqual([['toggle', false]]);
});

type DialogRootProps = Extract<ExtractSlotProps<PopoverSurfaceSlots['root']>, { as?: 'dialog' }>;
type DivRootProps = Extract<ExtractSlotProps<PopoverSurfaceSlots['root']>, { as: 'div' }>;

test('custom triggers and typed dialog root render functions preserve refs, classes, data, handlers, and the public arrow', async () => {
  const triggerRef = React.createRef<HTMLButtonElement>();
  const surfaceRef = React.createRef<HTMLDialogElement>();
  const clicks = vi.fn<React.MouseEventHandler<HTMLButtonElement>>();
  const enters = vi.fn<React.MouseEventHandler<HTMLDialogElement>>();
  const rendered: { className?: string; surfaceData: string | undefined }[] = [];
  type CustomTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    'data-caller-trigger': string;
  };
  const CustomTrigger = React.forwardRef<HTMLButtonElement, CustomTriggerProps>(
    function CustomTrigger(props, ref) {
      return <button {...props} ref={ref} />;
    },
  );
  const renderSurface: SlotRenderFunction<DialogRootProps & { 'data-caller-surface'?: string }> = (
    Component,
    props,
  ) => {
    rendered.push({
      className: props.className,
      surfaceData: props['data-caller-surface'],
    });
    return (
      <Component {...props} data-caller-rendered="">
        {props.children}
        <button type="button">Caller native action</button>
      </Component>
    );
  };
  const surfaceProps: DialogRootProps & { 'data-caller-surface': string } = {
    as: 'dialog',
    ref: surfaceRef,
    className: 'caller-surface',
    'aria-label': 'Caller surface',
    'data-caller-surface': 'kept',
    onMouseEnter: enters,
    children: renderSurface,
  };
  const screen = await render(
    <CoreAIFluentProvider>
      <div data-native-host="">
        <Popover withArrow id="caller-popover" positioning={{ position: 'below', offset: 10 }}>
          <PopoverTrigger>
            <CustomTrigger
              ref={triggerRef}
              type="button"
              onClick={clicks}
              className="caller-trigger"
              data-caller-trigger="kept"
            >
              Caller trigger
            </CustomTrigger>
          </PopoverTrigger>
          <PopoverSurface {...surfaceProps} />
        </Popover>
      </div>
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Caller trigger' });
  await userEvent.click(trigger);
  const surface = screen.getByRole('group', { name: 'Caller surface' });
  await expect.element(surface).toBeVisible();
  expect(triggerRef.current === trigger.element()).toBe(true);
  expect(surfaceRef.current === surface.element()).toBe(true);
  await expect.element(trigger).toHaveClass('caller-trigger');
  await expect.element(trigger).toHaveAttribute('data-caller-trigger', 'kept');
  await expect.element(surface).toHaveClass('caller-surface', popoverSurfaceClassNames.root);
  await expect.element(surface).toHaveAttribute('data-caller-surface', 'kept');
  await expect.element(surface).toHaveAttribute('data-caller-rendered', '');
  await expect.element(surface).toHaveAttribute('id', 'caller-popover');
  expect(rendered.some((props) => props.surfaceData === 'kept')).toBe(true);
  expect(rendered.some((props) => props.className?.includes('caller-surface'))).toBe(true);
  expect(clicks).toHaveBeenCalledTimes(1);
  const arrow = surface.element().querySelector<HTMLElement>(':scope > [data-arrow]');
  expect(arrow !== null).toBe(true);
  expect(arrow?.className).toBe('');
  expect(surface.element().parentElement === trigger.element().parentElement).toBe(true);
  expect(screen.container.querySelector('.fui-Popover, .fui-PopoverTrigger') === null).toBe(true);
  await userEvent.hover(surface);
  expect(enters.mock.calls.length > 0).toBe(true);
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => surface.query() === null).toBe(true);
  await expect.element(trigger).toHaveFocus();
});

test('a typed div root renderer keeps caller role, native ref, and inline style priority', async () => {
  const surfaceRef = React.createRef<HTMLDivElement>();
  const renderedRoots: unknown[] = [];
  const renderSurface: SlotRenderFunction<DivRootProps> = (Component, props) => {
    renderedRoots.push(Component);
    return (
      <div {...props} data-native-rendered-div="">
        {props.children}
        <button type="button">Div action</button>
      </div>
    );
  };
  const surfaceProps: DivRootProps & { 'data-caller-div': string } = {
    as: 'div',
    ref: surfaceRef,
    role: 'region',
    'aria-label': 'Native div region',
    'data-caller-div': 'kept',
    className: 'caller-div',
    style: { padding: '7px', border: '5px dotted rgb(0, 0, 255)', color: 'rgb(12, 34, 56)' },
    children: renderSurface,
  };
  const screen = await render(
    <CoreAIFluentProvider>
      <Popover defaultOpen>
        <PopoverTrigger>
          <button type="button">Div region trigger</button>
        </PopoverTrigger>
        <PopoverSurface {...surfaceProps} />
      </Popover>
    </CoreAIFluentProvider>,
  );
  const surface = screen.getByRole('region', { name: 'Native div region' });
  await expect.element(surface).toBeVisible();
  expect(surfaceRef.current === surface.element()).toBe(true);
  expect(surface.element().tagName).toBe('DIV');
  expect(renderedRoots.includes('div')).toBe(true);
  await expect.element(surface).toHaveAttribute('data-caller-div', 'kept');
  await expect.element(surface).toHaveAttribute('data-native-rendered-div', '');
  const computed = getComputedStyle(surface.element());
  expect(computed.paddingTop).toBe('7px');
  expect(computed.borderTopWidth).toBe('5px');
  expect(computed.borderTopStyle).toBe('dotted');
  expect(computed.color).toBe('rgb(12, 34, 56)');
});

test('button enhancement supports a non-button trigger while native disabled triggers remain inactive', async () => {
  const disabledClicks = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <button type="button">Before enhanced trigger</button>
      <Popover>
        <PopoverTrigger>
          <span>Enhanced project trigger</span>
        </PopoverTrigger>
        <PopoverSurface as="div" aria-label="Enhanced trigger content">
          Enhanced trigger content
        </PopoverSurface>
      </Popover>
      <Popover>
        <PopoverTrigger>
          <button type="button" disabled onClick={disabledClicks}>
            Disabled trigger
          </button>
        </PopoverTrigger>
        <PopoverSurface aria-label="Disabled surface">Cannot be opened.</PopoverSurface>
      </Popover>
      <button type="button">After disabled trigger</button>
    </CoreAIFluentProvider>,
  );
  const start = screen.getByRole('button', { name: 'Before enhanced trigger' });
  await userEvent.hover(start);
  await userEvent.click(start);
  await userEvent.keyboard('{Tab}');
  const enhanced = screen.getByRole('button', { name: 'Enhanced project trigger' });
  await expect.element(enhanced).toHaveFocus();
  await userEvent.keyboard(' ');
  await expect
    .element(screen.getByRole('group', { name: 'Enhanced trigger content' }))
    .toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect
    .poll(() => screen.getByRole('group', { name: 'Enhanced trigger content' }).query() === null)
    .toBe(true);
  requireHTMLElement(
    screen.getByRole('button', { name: 'Disabled trigger', exact: true }).element(),
  ).click();
  expect(disabledClicks).not.toHaveBeenCalled();
  expect(screen.getByRole('group', { name: 'Disabled surface' }).query()).toBeNull();
  await userEvent.keyboard('{Tab}');
  await expect
    .element(screen.getByRole('button', { name: 'After disabled trigger' }))
    .toHaveFocus();
});

test('text-only named/described surfaces retain native keyboard focus-visible and focus restoration', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <button type="button">Before named information</button>
      <Popover>
        <PopoverTrigger>
          <button type="button">Open named information</button>
        </PopoverTrigger>
        <PopoverSurface
          tabIndex={-1}
          aria-labelledby="access-heading"
          aria-describedby="access-body"
        >
          <h3 id="access-heading">Atlas information</h3>
          <p id="access-body">Only editors can publish changes.</p>
        </PopoverSurface>
      </Popover>
    </CoreAIFluentProvider>,
  );
  const start = screen.getByRole('button', { name: 'Before named information' });
  await userEvent.hover(start);
  await userEvent.click(start);
  await userEvent.keyboard('{Tab}{Enter}');
  const surface = screen.getByRole('group', { name: 'Atlas information' });
  await expect.element(surface).toHaveAccessibleName('Atlas information');
  await expect.element(surface).toHaveAccessibleDescription('Only editors can publish changes.');
  await expect.element(surface).toHaveFocus();
  expect(surface.element().matches(':focus-visible')).toBe(true);
  await userEvent.keyboard('{Escape}');
  await expect
    .element(screen.getByRole('button', { name: 'Open named information' }))
    .toHaveFocus();
});

for (const dir of ['ltr', 'rtl'] as const) {
  for (const position of ['above', 'below', 'before', 'after'] as const) {
    test(`CSS anchors and the public arrow follow physical ${position} placement in ${dir}`, async () => {
      document.documentElement.dir = dir;
      const screen = await render(
        <CoreAIFluentProvider dir={dir}>
          <div style={{ display: 'grid', placeItems: 'center', height: '400px' }}>
            <Popover defaultOpen withArrow positioning={{ position, offset: 10, pinned: true }}>
              <PopoverTrigger>
                <button type="button" style={{ width: '80px', height: '48px' }}>
                  Positioned trigger
                </button>
              </PopoverTrigger>
              <PopoverSurface
                aria-label="Positioned surface"
                style={{ minWidth: '80px', maxWidth: '80px' }}
              >
                Positioned content.
              </PopoverSurface>
            </Popover>
          </div>
        </CoreAIFluentProvider>,
      );
      const surface = screen.getByRole('group', { name: 'Positioned surface' }).element();
      const trigger = screen.getByRole('button', { name: 'Positioned trigger' }).element();
      await settlePopoverStyles(surface);
      const physical =
        dir === 'rtl' && position === 'before'
          ? 'after'
          : dir === 'rtl' && position === 'after'
            ? 'before'
            : position;
      await expect.poll(() => surface.dataset.placement).toBe(physical);
      const placement = capturePopoverPlacement(surface, trigger);
      expect(placement['anchor.side']).toBe(physical);
      expect(placement['anchor.gap']).toBe('10');
      expect(placement['anchor.cross-offset']).toBe('0');
      expect(surface.style.getPropertyValue('position')).toBe('fixed');
      expect(surface.style.getPropertyValue('inset')).toBe('auto');
      expect(surface.style.getPropertyValue('position-anchor')).toBe(
        trigger.style.getPropertyValue('anchor-name'),
      );
      expect(surface.style.getPropertyValue('position-try-fallbacks')).toBe('');
      const arrow = getPopoverArrow(surface);
      if (!arrow) throw new Error('Missing positioned arrow');
      const angle = { above: '-45deg', below: '135deg', before: '225deg', after: '45deg' }[
        physical
      ];
      expect(getComputedStyle(arrow).getPropertyValue('--fui-positioning-arrow-angle').trim()).toBe(
        angle,
      );
      const arrowRect = arrow.getBoundingClientRect();
      const anchorRect = trigger.getBoundingClientRect();
      if (physical === 'above' || physical === 'below') {
        expect((arrowRect.left + arrowRect.right) / 2).toBe(
          (anchorRect.left + anchorRect.right) / 2,
        );
      } else {
        expect((arrowRect.top + arrowRect.bottom) / 2).toBe(
          (anchorRect.top + anchorRect.bottom) / 2,
        );
      }
    });
  }
}

test('a fractional native target retains exact surface-centered pointers and Chromium anchor quantization', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <div style={{ display: 'grid', placeItems: 'center', height: '320px' }}>
        <Popover
          defaultOpen
          withArrow
          positioning={{ position: 'below', offset: 10, pinned: true }}
        >
          <PopoverTrigger>
            <button type="button" style={{ width: '80.015625px', height: '48px' }}>
              Fractional anchor
            </button>
          </PopoverTrigger>
          <PopoverSurface
            aria-label="Fractional anchored surface"
            style={{ minWidth: '80px', maxWidth: '80px' }}
          >
            Native layout.
          </PopoverSurface>
        </Popover>
      </div>
    </CoreAIFluentProvider>,
  );
  const surface = screen.getByRole('group', { name: 'Fractional anchored surface' }).element();
  const target = screen.getByRole('button', { name: 'Fractional anchor' }).element();
  await settlePopoverStyles(surface);
  const arrow = getPopoverArrow(surface);
  if (!arrow) throw new Error('Missing fractional-target pointer');
  const a = arrow.getBoundingClientRect();
  const r = surface.getBoundingClientRect();
  expect((a.left + a.right) / 2).toBe((r.left + r.right) / 2);
  expect(capturePopoverPlacement(surface, target)['anchor.cross-offset']).toBe('0.0078125');
});

test('provider-only RTL retains the viewport containing-block axes for native anchor placement', async () => {
  document.documentElement.dir = 'ltr';
  const screen = await render(
    <CoreAIFluentProvider dir="rtl">
      <div style={{ display: 'grid', placeItems: 'center', height: '320px' }}>
        <Popover defaultOpen positioning={{ position: 'before', offset: 10, pinned: true }}>
          <PopoverTrigger>
            <button type="button" style={{ width: '80px', height: '48px' }}>
              Provider RTL anchor
            </button>
          </PopoverTrigger>
          <PopoverSurface
            aria-label="Provider RTL surface"
            style={{ minWidth: '80px', maxWidth: '80px' }}
          >
            Viewport axes.
          </PopoverSurface>
        </Popover>
      </div>
    </CoreAIFluentProvider>,
  );
  const surface = screen.getByRole('group', { name: 'Provider RTL surface' }).element();
  const anchor = screen.getByRole('button', { name: 'Provider RTL anchor' }).element();
  await settlePopoverStyles(surface);
  expect(getComputedStyle(surface).direction).toBe('rtl');
  expect(capturePopoverPlacement(surface, anchor)['anchor.side']).toBe('before');
  expect(capturePopoverPlacement(surface, anchor)['anchor.gap']).toBe('10');
});

test('equal-width native boxes retain the pinned observer start label despite geometric centering', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <div style={{ display: 'grid', placeItems: 'center', height: '320px' }}>
        <Popover defaultOpen withArrow positioning={{ position: 'above', offset: 10 }}>
          <PopoverTrigger>
            <button type="button" style={{ width: '160px', height: '32px' }}>
              Equal-width anchor
            </button>
          </PopoverTrigger>
          <PopoverSurface
            aria-label="Equal-width surface"
            style={{ minWidth: '160px', maxWidth: '160px', boxSizing: 'border-box' }}
          >
            Same width.
          </PopoverSurface>
        </Popover>
      </div>
    </CoreAIFluentProvider>,
  );
  const surface = screen.getByRole('group', { name: 'Equal-width surface' }).element();
  const anchor = screen.getByRole('button', { name: 'Equal-width anchor' }).element();
  await expect.poll(() => surface.dataset.placement).toBe('above-start');
  expect(capturePopoverPlacement(surface, anchor)['anchor.cross-offset']).toBe('0');
  const arrow = getPopoverArrow(surface);
  if (!arrow) throw new Error('Missing equal-width pointer');
  expect(getComputedStyle(arrow).left).toBe('8px');
});

for (const dir of ['ltr', 'rtl'] as const) {
  test.each([
    { position: 'above', align: 'start', edge: 'left' },
    { position: 'below', align: 'end', edge: 'right' },
    { position: 'before', align: 'start', edge: 'top' },
    { position: 'after', align: 'end', edge: 'bottom' },
  ] as const)(
    `edge-aligned $position/$align arrows point within the native target in ${dir}`,
    async ({ position, align, edge }) => {
      document.documentElement.dir = dir;
      const screen = await render(
        <CoreAIFluentProvider dir={dir}>
          <div style={{ display: 'grid', placeItems: 'center', height: '400px' }}>
            <Popover
              defaultOpen
              withArrow
              positioning={{ position, align, offset: 10, pinned: true }}
            >
              <PopoverTrigger>
                <button type="button" style={{ width: '80px', height: '48px' }}>
                  Edge arrow target
                </button>
              </PopoverTrigger>
              <PopoverSurface
                aria-label="Edge arrow surface"
                style={{ minWidth: '80px', maxWidth: '80px' }}
              >
                Edge-aligned pointer.
              </PopoverSurface>
            </Popover>
          </div>
        </CoreAIFluentProvider>,
      );
      const surface = screen.getByRole('group', { name: 'Edge arrow surface' }).element();
      const target = screen.getByRole('button', { name: 'Edge arrow target' }).element();
      await settlePopoverStyles(surface);
      const expectedEdge =
        dir === 'rtl' && edge === 'left'
          ? 'right'
          : dir === 'rtl' && edge === 'right'
            ? 'left'
            : edge;
      const arrow = getPopoverArrow(surface);
      if (!arrow) throw new Error('Missing edge-aligned arrow');
      await expect.poll(() => getComputedStyle(arrow).getPropertyValue(expectedEdge)).toBe('8px');
      const a = arrow.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      const crossCenter =
        position === 'above' || position === 'below'
          ? (a.left + a.right) / 2
          : (a.top + a.bottom) / 2;
      const start = position === 'above' || position === 'below' ? t.left : t.top;
      const end = position === 'above' || position === 'below' ? t.right : t.bottom;
      expect(crossCenter >= start && crossCenter <= end).toBe(true);
    },
  );
}

test('native position-try flipping updates placement and arrow orientation at the viewport edge', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <Popover defaultOpen withArrow positioning={{ position: 'below', offset: 10 }}>
        <PopoverTrigger>
          <button
            type="button"
            style={{ position: 'fixed', bottom: '8px', left: '45%', width: '160px' }}
          >
            Viewport edge trigger
          </button>
        </PopoverTrigger>
        <PopoverSurface aria-label="Flipped native surface" style={{ width: '160px' }}>
          Browser-flipped content.
        </PopoverSurface>
      </Popover>
    </CoreAIFluentProvider>,
  );
  const surface = screen.getByRole('group', { name: 'Flipped native surface' }).element();
  const trigger = screen.getByRole('button', { name: 'Viewport edge trigger' }).element();
  await expect.poll(() => surface.dataset.placement).toBe('above');
  await settlePopoverStyles(surface);
  expect(capturePopoverPlacement(surface, trigger)['anchor.side']).toBe('above');
  expect(capturePopoverPlacement(surface, trigger)['anchor.gap']).toBe('10');
  expect(surface.style.getPropertyValue('position-try-fallbacks')).toBe(
    'flip-block, flip-inline, flip-block flip-inline',
  );
  const arrow = getPopoverArrow(surface);
  if (!arrow) throw new Error('Missing flipped arrow');
  expect(getComputedStyle(arrow).getPropertyValue('--fui-positioning-arrow-angle').trim()).toBe(
    '-45deg',
  );
});

test('coverTarget preserves the native center position-area and self-alignment instead of adding legacy positioning machinery', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <div style={{ display: 'grid', placeItems: 'center', height: '320px' }}>
        <Popover defaultOpen positioning={{ coverTarget: true, position: 'below', align: 'start' }}>
          <PopoverTrigger>
            <button type="button" style={{ width: '180px', height: '48px' }}>
              Covered target
            </button>
          </PopoverTrigger>
          <PopoverSurface
            aria-label="Covering native surface"
            style={{ width: '100px', height: '24px', padding: 0 }}
          >
            Covered
          </PopoverSurface>
        </Popover>
      </div>
    </CoreAIFluentProvider>,
  );
  const surface = screen.getByRole('group', { name: 'Covering native surface' }).element();
  const trigger = screen.getByRole('button', { name: 'Covered target' }).element();
  await settlePopoverStyles(surface);
  expect(surface.style.getPropertyValue('position-area')).toBe('center');
  expect(surface.style.getPropertyValue('align-self')).toBe('start');
  expect(surface.style.getPropertyValue('justify-self')).toBe('start');
  expect(surface.style.getPropertyValue('position-try-fallbacks')).toBe('');
  expect(surface.getBoundingClientRect().top).toBe(trigger.getBoundingClientRect().top);
  expect(surface.getBoundingClientRect().left).toBe(trigger.getBoundingClientRect().left);
  expect(getPopoverArrow(surface) === null).toBe(true);
});

test('custom target and matchTargetSize use native anchor-size with caller-selected border-box sizing', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <PopoverAnchorFlow />
    </CoreAIFluentProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Toggle custom anchor' }));
  const surface = screen.getByRole('group', { name: 'Custom anchored information' }).element();
  const target = screen.getByRole('button', { name: 'Atlas anchor' }).element();
  await settlePopoverStyles(surface);
  expect(surface.style.getPropertyValue('width')).toBe('anchor-size(width)');
  expect(surface.getBoundingClientRect().width).toBe(target.getBoundingClientRect().width);
  expect(capturePopoverPlacement(surface, target)['anchor.gap']).toBe('10');
  expect(surface.style.getPropertyValue('position-anchor')).toBe(
    target.style.getPropertyValue('anchor-name'),
  );
});

test('the public positioning ref reanchors without JS coordinates and preserves consumer anchor names on cleanup', async () => {
  const positioningRef = React.createRef<PositioningImperativeRef>();
  const secondRef = React.createRef<HTMLButtonElement>();
  function ImperativeAnchor() {
    const [target, setTarget] = React.useState<HTMLButtonElement | null>(null);
    return (
      <CoreAIFluentProvider>
        <div style={{ display: 'flex', justifyContent: 'space-evenly', paddingTop: '120px' }}>
          <button type="button" ref={setTarget}>
            First imperative anchor
          </button>
          <button type="button" ref={secondRef}>
            Second imperative anchor
          </button>
          <Popover open positioning={{ target, position: 'below', offset: 10, positioningRef }}>
            <PopoverSurface aria-label="Imperatively anchored surface">
              Native positioning handle
            </PopoverSurface>
          </Popover>
        </div>
      </CoreAIFluentProvider>
    );
  }
  const screen = await render(<ImperativeAnchor />);
  const surface = screen.getByRole('group', { name: 'Imperatively anchored surface' }).element();
  const first = screen.getByRole('button', { name: 'First imperative anchor' }).element();
  const second = secondRef.current;
  if (!second || !positioningRef.current) throw new Error('Missing current positioning refs');
  const anchorName = surface.style.getPropertyValue('position-anchor');
  first.style.setProperty('anchor-name', `${anchorName}, --consumer-anchor`);
  positioningRef.current.setTarget(second);
  await expect.poll(() => second.style.getPropertyValue('anchor-name')).toBe(anchorName);
  positioningRef.current.updatePosition();
  await settlePopoverStyles(surface);
  expect(first.style.getPropertyValue('anchor-name')).toBe('--consumer-anchor');
  expect(capturePopoverPlacement(surface, second)['anchor.gap']).toBe('10');
  await cleanup();
  expect(second.style.getPropertyValue('anchor-name')).toBe('');
  expect(first.style.getPropertyValue('anchor-name')).toBe('--consumer-anchor');
});

test('native top-layer surfaces inherit the local theme and reset nested visual choices rather than inheriting parent appearance/size', async () => {
  const screen = await render(
    <CoreAIFluentProvider
      withComponentDefaults
      theme={{
        ...coreaiLightTheme,
        colorNeutralBackground1: 'rgb(11, 22, 33)',
        colorNeutralForeground1: 'rgb(230, 231, 232)',
        colorNeutralStroke3: 'rgb(51, 61, 71)',
      }}
    >
      <Popover appearance="brand" size="small">
        <PopoverTrigger>
          <button type="button">Themed outer trigger</button>
        </PopoverTrigger>
        <PopoverSurface aria-label="Themed outer surface">
          <Popover>
            <PopoverTrigger>
              <button type="button">Themed nested trigger</button>
            </PopoverTrigger>
            <PopoverSurface aria-label="Themed nested surface">
              Nested default visual choices
            </PopoverSurface>
          </Popover>
        </PopoverSurface>
      </Popover>
    </CoreAIFluentProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Themed outer trigger' }));
  const outer = screen.getByRole('group', { name: 'Themed outer surface' });
  await expect.element(outer).toHaveAttribute('data-size', 'small');
  await expect.element(outer).toHaveAttribute('data-appearance', 'brand');
  await userEvent.click(screen.getByRole('button', { name: 'Themed nested trigger' }));
  const inner = screen.getByRole('group', { name: 'Themed nested surface' });
  await expect.element(inner).toHaveAttribute('data-size', 'medium');
  await expect.element(inner).not.toHaveAttribute('data-appearance');
  expect(outer.element().contains(inner.element())).toBe(true);
  expect(getComputedStyle(inner.element()).backgroundColor).toBe('rgb(11, 22, 33)');
  expect(getComputedStyle(inner.element()).color).toBe('rgb(230, 231, 232)');
  expect(getComputedStyle(inner.element()).borderTopColor).toBe('rgb(51, 61, 71)');
});
