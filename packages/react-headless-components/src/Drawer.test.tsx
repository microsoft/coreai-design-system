// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import * as primitiveDrawer from '@fluentui/react-headless-components-preview/drawer';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import {
  CoreAIFluentProvider,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import {
  DrawerComparison,
  DrawerFormFlow,
  DrawerNestedFlow,
  InlineDrawerFlow,
  OverlayDrawerFlow,
  drawerConsumerExample,
  drawerExamples,
  type DrawerExample,
  type DrawerImplementation,
} from '../../../apps/storybook/src/stories/experiments/DrawerComparison.js';
import { DrawerComparisonWithReport } from '../../../apps/storybook/src/stories/experiments/DrawerComparisonReport.js';
import {
  DRAWER_COMPARISON_PROPERTY_COUNT,
  captureDrawerNativeContract,
  captureDrawerStyles,
  compareDrawerStyles,
  getComparisonDrawer,
  settleDrawerStyles,
} from '../../../apps/storybook/src/stories/experiments/compareDrawerStyles.js';
import {
  Drawer,
  drawerClassNames,
  DrawerProvider,
  useDrawerContext,
  useDrawerContextValue,
  type DrawerProps,
} from './Drawer.js';
import {
  OverlayDrawer,
  overlayDrawerClassNames,
  type OverlayDrawerProps,
} from './OverlayDrawer.js';
import { InlineDrawer, inlineDrawerClassNames, type InlineDrawerProps } from './InlineDrawer.js';
import { DrawerBody, drawerBodyClassNames, type DrawerBodyProps } from './DrawerBody.js';
import { DrawerHeader, drawerHeaderClassNames, type DrawerHeaderProps } from './DrawerHeader.js';
import { DrawerFooter, drawerFooterClassNames, type DrawerFooterProps } from './DrawerFooter.js';
import {
  DrawerHeaderTitle,
  drawerHeaderTitleClassNames,
  type DrawerHeaderTitleProps,
  type DrawerHeaderTitleSlots,
} from './DrawerHeaderTitle.js';
import {
  DrawerHeaderNavigation,
  drawerHeaderNavigationClassNames,
  type DrawerHeaderNavigationProps,
} from './DrawerHeaderNavigation.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

function requireDialog(element: Element): HTMLDialogElement {
  if (!(element instanceof HTMLDialogElement)) throw new Error('Expected native dialog');
  return element;
}

function requireHTML(element: Element): HTMLElement {
  if (!(element instanceof HTMLElement)) throw new Error('Expected HTML element');
  return element;
}

function NativeFixture({
  primitive = false,
  controlledOpen,
  onOpenChange,
  ...props
}: Omit<OverlayDrawerProps, 'size' | 'open' | 'children'> & {
  primitive?: boolean;
  controlledOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const descriptionId = React.useId();
  const Root = primitive ? primitiveDrawer.OverlayDrawer : OverlayDrawer;
  const Header = primitive ? primitiveDrawer.DrawerHeader : DrawerHeader;
  const Title = primitive ? primitiveDrawer.DrawerHeaderTitle : DrawerHeaderTitle;
  const Body = primitive ? primitiveDrawer.DrawerBody : DrawerBody;
  const Footer = primitive ? primitiveDrawer.DrawerFooter : DrawerFooter;
  return (
    <CoreAIFluentProvider>
      <div>
        <button type="button">Before drawer</button>
        <button type="button" onClick={() => setOpen(true)}>
          Native drawer trigger
        </button>
        <Root
          {...props}
          open={controlledOpen ?? open}
          aria-describedby={descriptionId}
          data-testid="native-drawer"
          onOpenChange={(event, data) => {
            onOpenChange?.(event, data);
            if (!event.defaultPrevented) setOpen(data.open);
          }}
        >
          <Header>
            <Title>Native drawer</Title>
          </Header>
          <Body>
            <p id={descriptionId}>Review native drawer semantics.</p>
            <button type="button">First native drawer action</button>
            <button type="button">Last native drawer action</button>
          </Body>
          <Footer>
            <button type="button" onClick={() => setOpen(false)}>
              Close native drawer
            </button>
          </Footer>
        </Root>
        <button
          type="button"
          aria-label="Outside native drawer"
          style={{
            position: 'fixed',
            insetInlineStart: props.position === 'end' ? 4 : undefined,
            insetInlineEnd: props.position === 'end' ? undefined : 4,
            insetBlockStart: props.position === 'bottom' ? 4 : undefined,
            insetBlockEnd: props.position === 'bottom' ? undefined : 4,
            boxSizing: 'border-box',
            width: 40,
          }}
        >
          Page
        </button>
      </div>
    </CoreAIFluentProvider>
  );
}

async function renderPair(
  example: DrawerExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const fixtureId = 'selected-drawer-comparison';
  const fixture = (openImplementation?: DrawerImplementation) => (
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <DrawerComparison
        fixtureId={fixtureId}
        example={example}
        openImplementation={openImplementation}
      />
    </CoreAIFluentProvider>
  );
  const screen = await render(fixture('legacy'));
  const legacy = getComparisonDrawer(fixtureId, 'legacy');
  await userEvent.hover(legacy, { position: { x: 2, y: 2 } });
  await settleDrawerStyles(legacy);
  const legacyStyles = captureDrawerStyles(legacy);
  const legacyNative = captureDrawerNativeContract(legacy);
  await screen.rerender(fixture());
  await expect.poll(() => legacy.isConnected).toBe(false);
  await screen.rerender(fixture('headless'));
  const headless = getComparisonDrawer(fixtureId, 'headless');
  await userEvent.hover(headless, { position: { x: 2, y: 2 } });
  await settleDrawerStyles(headless);
  const headlessStyles = captureDrawerStyles(headless);
  const differences = compareDrawerStyles(legacyStyles, headlessStyles, example);
  return { screen, headless, legacyStyles, headlessStyles, legacyNative, differences };
}

test('exposes the actual current family, supported helpers, native refs and visual-only additions', () => {
  expectTypeOf<OverlayDrawerProps>().toEqualTypeOf<
    primitiveDrawer.OverlayDrawerProps & { size?: 'small' | 'medium' | 'large' | 'full' }
  >();
  expectTypeOf<OverlayDrawerProps['onChange']>().toEqualTypeOf<
    React.FormEventHandler<HTMLDialogElement> | undefined
  >();
  expectTypeOf<OverlayDrawerProps['onOpenChange']>().toEqualTypeOf<
    primitiveDrawer.OverlayDrawerProps['onOpenChange']
  >();
  expectTypeOf<InlineDrawerProps>().toEqualTypeOf<
    primitiveDrawer.InlineDrawerProps & {
      size?: 'small' | 'medium' | 'large' | 'full';
      separator?: boolean;
    }
  >();
  expectTypeOf<DrawerBodyProps>().toEqualTypeOf<primitiveDrawer.DrawerBodyProps>();
  expectTypeOf<DrawerHeaderProps>().toEqualTypeOf<primitiveDrawer.DrawerHeaderProps>();
  expectTypeOf<DrawerHeaderTitleProps>().toEqualTypeOf<primitiveDrawer.DrawerHeaderTitleProps>();
  expectTypeOf<DrawerHeaderNavigationProps>().toEqualTypeOf<primitiveDrawer.DrawerHeaderNavigationProps>();
  expectTypeOf<DrawerFooterProps>().toEqualTypeOf<primitiveDrawer.DrawerFooterProps>();
  expectTypeOf<typeof Drawer>().toEqualTypeOf<ForwardRefComponent<DrawerProps>>();
  expectTypeOf<typeof OverlayDrawer>().toEqualTypeOf<ForwardRefComponent<OverlayDrawerProps>>();
  expectTypeOf<typeof InlineDrawer>().toEqualTypeOf<ForwardRefComponent<InlineDrawerProps>>();
  expectTypeOf<typeof DrawerHeaderTitle>().toEqualTypeOf<
    ForwardRefComponent<DrawerHeaderTitleProps>
  >();
  expectTypeOf<OverlayDrawerProps>().not.toHaveProperty('defaultOpen');
  expectTypeOf<OverlayDrawerProps>().not.toHaveProperty('backdrop');
  expectTypeOf<OverlayDrawerProps>().not.toHaveProperty('mountNode');
  expectTypeOf<OverlayDrawerProps>().not.toHaveProperty('surfaceMotion');
  expectTypeOf<OverlayDrawerProps>().not.toHaveProperty('inertTrapFocus');
  expectTypeOf<OverlayDrawerProps>().not.toHaveProperty('appearance');
  expectTypeOf<InlineDrawerProps>().not.toHaveProperty('onOpenChange');
  expectTypeOf<InlineDrawerProps>().not.toHaveProperty('orientation');
  expect('DrawerOverlay' in primitiveDrawer).toBe(false);
  expect('DrawerInline' in primitiveDrawer).toBe(false);
  expect(DrawerProvider).toBe(primitiveDrawer.DrawerProvider);
  expect(useDrawerContext).toBe(primitiveDrawer.useDrawerContext);
  expect(useDrawerContextValue).toBe(primitiveDrawer.useDrawerContextValue);
});

for (const [themeName, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  for (const example of drawerExamples) {
    test(`${themeName}: sequential ${example.name} preserves the bounded visual contract`, async () => {
      const { headless, headlessStyles, legacyNative, differences } = await renderPair(
        example,
        theme,
      );
      expect(
        differences.filter((difference) => difference.kind === 'unexpected'),
        JSON.stringify({
          differences,
          legacy: legacyNative,
          native: captureDrawerNativeContract(headless),
        }),
      ).toEqual([]);
      expect(Object.keys(headlessStyles).length).toBe(DRAWER_COMPARISON_PROPERTY_COUNT);
      expect(headless.ownerDocument.fonts.status).toBe('loaded');
      expect(headlessStyles['heading.font-size']).toBe('20px');
      expect(headlessStyles['body.padding-left']).toBe('24px');
      expect(headlessStyles['footer.column-gap']).toBe('8px');
      expect(headless.hasAttribute('data-open')).toBe(true);
      if (example.kind === 'overlay') {
        expect(headless instanceof HTMLDialogElement).toBe(true);
        expect(headless.matches(':modal')).toBe(true);
        expect(getComputedStyle(headless).animationName).toBe('none');
        expect(headless.getBoundingClientRect().width).toBe(
          example.props?.position === 'bottom'
            ? document.documentElement.getBoundingClientRect().width
            : Math.min(
                { small: 320, medium: 592, large: 940, full: innerWidth }[
                  example.props?.size ?? 'small'
                ],
                document.documentElement.getBoundingClientRect().width,
              ),
        );
      } else {
        expect(headless.tagName).toBe('DIV');
        expect(getComputedStyle(headless).position).toBe('relative');
      }
      if (example.longContent) {
        const body = headless.querySelector<HTMLElement>('[data-drawer-body]');
        if (!body) throw new Error('Missing scrollable Drawer body');
        expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
        expect(headlessStyles['header.separator.opacity']).toBe('0');
        expect(headlessStyles['footer.separator.opacity']).toBe('1');
      }
    });
  }
}

for (const dir of ['ltr', 'rtl'] as const) {
  for (const kind of ['overlay', 'inline'] as const) {
    test(`${kind} has no CoreAI defaults or overrides to disable in ${dir}`, async () => {
      const example: DrawerExample = {
        name: 'Defaults opt-out',
        kind,
        props: { position: 'end', separator: true },
        navigation: true,
      };
      const { headless, differences, headlessStyles } = await renderPair(
        example,
        coreaiLightTheme,
        false,
        dir,
      );
      expect(
        differences.filter((difference) => difference.kind === 'unexpected'),
        JSON.stringify(differences),
      ).toEqual([]);
      expect(getComputedStyle(headless).direction).toBe(dir);
      expect(headlessStyles['header.padding-left']).toBe('24px');
      expect(headlessStyles['navigation.margin-left']).toBe('-16px');
      expect(headless.hasAttribute('data-coreai-defaults')).toBe(false);
      const border = dir === 'ltr' ? 'border-left-width' : 'border-right-width';
      expect(headlessStyles[`surface.${border}`]).toBe('1px');
    });
  }
}

test('consumer CSS and inline styles retain ordinary priority over Drawer and delegated title CSS', async () => {
  const { headless, headlessStyles } = await renderPair(drawerConsumerExample);
  expect(headless.getBoundingClientRect().width).toBe(280);
  expect(headlessStyles['surface.border-top-width']).toBe('3px');
  expect(headlessStyles['surface.border-left-width']).toBe('3px');
  expect(headlessStyles['surface.border-radius']).toBe('3px');
  expect(headlessStyles['header.padding-top']).toBe('12px');
  expect(headlessStyles['body.padding-top']).toBe('9px');
  expect(headlessStyles['body.padding-left']).toBe('9px');
  expect(headlessStyles['heading.font-size']).toBe('22px');
  expect(headlessStyles['navigation.margin-left']).toBe('0px');
  expect(headlessStyles['footer.column-gap']).toBe('11px');
  headless.style.width = '271px';
  expect(headless.getBoundingClientRect().width).toBe(271);
});

for (const position of ['start', 'end', 'bottom'] as const) {
  for (const size of ['small', 'medium', 'large', 'full'] as const) {
    test(`${position}/${size} native overlay fits the exact viewport across its sizing threshold`, async () => {
      const previousViewport = { width: innerWidth, height: innerHeight };
      const dimension = { small: 320, medium: 592, large: 940, full: 720 }[size];
      const thresholds = size === 'full' ? [375, 1440] : [dimension - 1, dimension, dimension + 1];
      try {
        for (const threshold of thresholds) {
          await page.viewport(
            position === 'bottom' ? 700 : threshold,
            position === 'bottom' ? threshold : 720,
          );
          const screen = await render(
            <CoreAIFluentProvider>
              <OverlayDrawer open position={position} size={size} aria-label="Exact drawer size">
                <DrawerBody>Exact viewport fit</DrawerBody>
              </OverlayDrawer>
            </CoreAIFluentProvider>,
          );
          const surface = requireDialog(
            screen.getByRole('dialog', { name: 'Exact drawer size' }).element(),
          );
          await settleDrawerStyles(surface);
          const rect = surface.getBoundingClientRect();
          const width = document.documentElement.getBoundingClientRect().width;
          const target =
            size === 'full' ? (position === 'bottom' ? innerHeight : innerWidth) : dimension;
          expect(rect.width).toBe(position === 'bottom' ? width : Math.min(target, width));
          expect(rect.height).toBe(
            position === 'bottom' ? Math.min(target, innerHeight) : innerHeight,
          );
          expect(rect.left).toBe(position === 'end' ? width - rect.width : 0);
          expect(rect.bottom).toBe(innerHeight);
          expect(rect.top).toBe(position === 'bottom' ? innerHeight - rect.height : 0);
          await cleanup();
        }
      } finally {
        await cleanup();
        await page.viewport(previousViewport.width, previousViewport.height);
      }
    });
  }
}

test('comparison classification accepts only exact native boundaries and derived scrollbar offsets', () => {
  const example: DrawerExample = {
    name: 'End full',
    kind: 'overlay',
    props: { position: 'end', size: 'full' },
  };
  const legacy = {
    'viewport.width': '685',
    'viewport.inner-width': '700',
    'surface.direction': 'ltr',
    'surface.max-width': '700px',
    'surface.rect.width': '700',
    'surface.viewport.left': '-15',
    'surface.viewport.right': '15',
    'body.rect.width': '699',
    'action.offset.left': '600',
  };
  const native = {
    ...legacy,
    'viewport.width': '700',
    'surface.max-width': '100%',
    'surface.viewport.left': '0',
    'surface.viewport.right': '0',
  };
  expect(compareDrawerStyles(legacy, native, example).map((difference) => difference.kind)).toEqual(
    [
      'native-scrollbar-viewport',
      'native-viewport-boundary',
      'native-scrollbar-viewport',
      'native-scrollbar-viewport',
    ],
  );
  for (const [property, value] of [
    ['surface.rect.width', '700.01'],
    ['surface.viewport.left', '0.01'],
    ['body.rect.width', '699.01'],
    ['action.offset.left', '600.01'],
    ['surface.max-width', '99%'],
  ]) {
    expect(
      compareDrawerStyles(legacy, { ...native, [property]: value }, example).find(
        (difference) => difference.property === property,
      )?.kind,
    ).toBe('unexpected');
  }
  expect(
    compareDrawerStyles(legacy, native, { ...example, kind: 'inline' }).every(
      (difference) => difference.kind === 'unexpected',
    ),
  ).toBe(true);
  const rtlBottomExample: DrawerExample = {
    name: 'RTL bottom',
    kind: 'overlay',
    props: { position: 'bottom', size: 'medium' },
  };
  const rtlLegacy = { ...legacy, 'surface.direction': 'rtl' };
  const rtlNative = { ...native, 'surface.direction': 'rtl' };
  expect(
    compareDrawerStyles(rtlLegacy, rtlNative, rtlBottomExample).map(
      (difference) => difference.kind,
    ),
  ).toEqual([
    'native-scrollbar-viewport',
    'native-viewport-boundary',
    'native-scrollbar-viewport',
    'native-scrollbar-viewport',
  ]);
  expect(
    compareDrawerStyles(
      rtlLegacy,
      { ...rtlNative, 'surface.viewport.left': '0.01' },
      rtlBottomExample,
    ).find((difference) => difference.property === 'surface.viewport.left')?.kind,
  ).toBe('unexpected');
});

for (const [width, height] of [
  [1440, 1000],
  [375, 720],
] as const) {
  test(`${width}x${height} report captures its full bounded set with stable reserved geometry`, async () => {
    const previousViewport = { width: innerWidth, height: innerHeight };
    await page.viewport(width, height);
    try {
      const screen = await render(
        <CoreAIFluentProvider>
          <DrawerComparisonWithReport />
        </CoreAIFluentProvider>,
      );
      const report = screen.getByRole('status', { name: 'Drawer style report' });
      for (const name of [
        'Overlay start small',
        'With navigation',
        'Overlay bottom medium',
        'Inline end separator',
        'Scrollable overlay',
      ]) {
        if (name !== 'Overlay start small') {
          await userEvent.selectOptions(screen.getByLabelText('Drawer visual fixture'), name);
        }
        await expect.element(report).toHaveAttribute('data-drawer-report-example', name);
        await expect.element(report).toHaveAttribute('data-drawer-report-state', 'ready');
        await expect.element(report).toHaveAttribute('data-drawer-report-phase', 'idle');
        await expect.element(report).toHaveAttribute('data-drawer-unexpected-count', '0');
        await expect
          .element(report)
          .toHaveAttribute(
            'data-drawer-comparison-count',
            String(DRAWER_COMPARISON_PROPERTY_COUNT),
          );
        expect(report.element().getBoundingClientRect().height).toBe(384);
        expect(document.querySelector('dialog:modal, dialog:popover-open')).toBeNull();
      }
      const inspect = screen.getByRole('button', { name: 'Inspect native drawer' });
      await userEvent.click(inspect);
      const surface = screen.getByRole('dialog', { name: 'Project access' });
      expect(requireDialog(surface.element()).matches(':modal')).toBe(true);
      expect(requireHTML(inspect.element()).hasAttribute('disabled')).toBe(false);
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => surface.query()).toBeNull();
      await expect.element(inspect).toHaveFocus();
      await expect.element(report).toHaveAttribute('data-drawer-report-phase', 'idle');
    } finally {
      await cleanup();
      await page.viewport(previousViewport.width, previousViewport.height);
    }
  });
}

test('default closed overlays unmount without a portal wrapper, fake backdrop, or legacy motion', async () => {
  const screen = await render(<NativeFixture />);
  expect(screen.getByTestId('native-drawer').query()).toBeNull();
  const trigger = screen.getByRole('button', { name: 'Native drawer trigger' });
  await userEvent.click(trigger);
  const surface = requireDialog(screen.getByTestId('native-drawer').element());
  expect(surface.parentElement?.contains(trigger.element())).toBe(true);
  expect(surface.querySelector('.fui-OverlayDrawer__backdrop')).toBeNull();
  expect(surface.querySelector('.fui-DrawerHeaderTitle__action')).toBeNull();
  expect(getComputedStyle(surface).animationName).toBe('none');
  expect(surface.getAttribute('aria-describedby')).toBe(
    surface.querySelector('p')?.getAttribute('id'),
  );
  expect(surface.getAttribute('aria-labelledby')).toBe(
    surface.querySelector('h2')?.getAttribute('id'),
  );
  await userEvent.click(screen.getByRole('button', { name: 'Close native drawer' }));
  await expect.poll(() => surface.isConnected).toBe(false);
  await expect.element(trigger).toHaveFocus();
});

for (const modalType of ['modal', 'non-modal', 'alert'] as const) {
  test(`kept-mounted ${modalType} overlays remain UA-hidden before and after repeated opens`, async () => {
    const screen = await render(<NativeFixture modalType={modalType} unmountOnClose={false} />);
    const surface = requireDialog(screen.getByTestId('native-drawer').element());
    expect(getComputedStyle(surface).display).toBe('none');
    expect(surface.getBoundingClientRect().width).toBe(0);
    const trigger = screen.getByRole('button', { name: 'Native drawer trigger' });
    for (let cycle = 0; cycle < 2; cycle += 1) {
      await userEvent.click(trigger);
      expect(getComputedStyle(surface).display).toBe('flex');
      expect(surface.matches(':modal')).toBe(modalType !== 'non-modal');
      expect(surface.matches(':popover-open')).toBe(modalType === 'non-modal');
      await userEvent.click(screen.getByRole('button', { name: 'Close native drawer' }));
      await expect.poll(() => getComputedStyle(surface).display).toBe('none');
      expect(surface.hasAttribute('data-open')).toBe(false);
      expect(surface.isConnected).toBe(true);
      expect(surface.getBoundingClientRect().height).toBe(0);
      await expect.element(trigger).toHaveFocus();
    }
  });
}

for (const modalType of ['modal', 'alert'] as const) {
  test(`${modalType} keeps native inertness, the current Tab boundary, Escape callbacks and restoration`, async () => {
    for (const primitive of [false, true]) {
      const changes = vi.fn<NonNullable<OverlayDrawerProps['onOpenChange']>>();
      const screen = await render(
        <NativeFixture primitive={primitive} modalType={modalType} onOpenChange={changes} />,
      );
      const trigger = screen.getByRole('button', { name: 'Native drawer trigger' });
      await userEvent.hover(screen.getByRole('button', { name: 'Before drawer' }));
      await userEvent.click(trigger);
      const surface = requireDialog(screen.getByTestId('native-drawer').element());
      const outside = requireHTML(
        screen.getByRole('button', { name: 'Outside native drawer' }).element(),
      );
      expect(surface.matches(':modal')).toBe(true);
      expect(surface.getAttribute('aria-modal')).toBe('true');
      expect(surface.getAttribute('role')).toBe(modalType === 'alert' ? 'alertdialog' : null);
      await expect
        .element(screen.getByRole('button', { name: 'First native drawer action' }))
        .toHaveFocus();
      outside.focus();
      expect(document.activeElement === outside).toBe(false);
      await userEvent.keyboard('{Tab}');
      await expect
        .element(screen.getByRole('button', { name: 'Last native drawer action' }))
        .toHaveFocus();
      await userEvent.keyboard('{Tab}');
      await expect
        .element(screen.getByRole('button', { name: 'Close native drawer' }))
        .toHaveFocus();
      await userEvent.keyboard('{Tab}');
      // Chromium can move to browser/iframe host UI, never an inert app control.
      // The pinned public primitive has the identical native boundary.
      expect(document.activeElement === document.body).toBe(true);
      expect(document.hasFocus()).toBe(false);
      outside.focus();
      expect(document.activeElement === outside).toBe(false);
      await userEvent.click(screen.getByRole('button', { name: 'First native drawer action' }));
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => surface.isConnected).toBe(false);
      await expect.element(trigger).toHaveFocus();
      expect(changes).toHaveBeenCalledTimes(1);
      const [event, data] = changes.mock.calls[0];
      expect(event).toBe(data.event);
      expect(data.type).toBe('escapeKeyDown');
      expect(data.open).toBe(false);
      if (data.type !== 'escapeKeyDown') throw new Error('Expected keyboard Escape');
      expect(data.event.nativeEvent.isTrusted).toBe(true);
      await cleanup();
    }
  });
}

test('trusted modal backdrop clicks dismiss, while an interior click stays open', async () => {
  const changes = vi.fn<NonNullable<OverlayDrawerProps['onOpenChange']>>();
  const screen = await render(<NativeFixture onOpenChange={changes} />);
  const trigger = screen.getByRole('button', { name: 'Native drawer trigger' });
  await userEvent.click(trigger);
  const locator = screen.getByRole('dialog', { name: 'Native drawer' });
  const surface = requireDialog(locator.element());
  await userEvent.click(locator, { position: { x: 2, y: 2 } });
  expect(surface.open).toBe(true);
  expect(changes).not.toHaveBeenCalled();
  expect(innerWidth - surface.getBoundingClientRect().right).toBeGreaterThan(4);
  await userEvent.click(locator, {
    position: { x: surface.getBoundingClientRect().width + 4, y: 4 },
  });
  await expect.poll(() => surface.isConnected).toBe(false);
  await expect.element(trigger).toHaveFocus();
  expect(changes).toHaveBeenCalledTimes(1);
  const [event, data] = changes.mock.calls[0];
  expect(event).toBe(data.event);
  expect(data.type).toBe('backdropClick');
  expect(data.open).toBe(false);
  if (data.type !== 'backdropClick') throw new Error('Expected backdrop pointer event');
  expect(data.event.nativeEvent.isTrusted).toBe(true);
});

test('alert ignores trusted backdrop clicks but the current Escape path remains dismissible', async () => {
  const changes = vi.fn<NonNullable<OverlayDrawerProps['onOpenChange']>>();
  const screen = await render(<NativeFixture modalType="alert" onOpenChange={changes} />);
  await userEvent.click(screen.getByRole('button', { name: 'Native drawer trigger' }));
  const locator = screen.getByRole('alertdialog', { name: 'Native drawer' });
  const surface = requireDialog(locator.element());
  await userEvent.click(locator, {
    position: { x: surface.getBoundingClientRect().width + 4, y: 4 },
  });
  expect(surface.open).toBe(true);
  expect(changes).not.toHaveBeenCalled();
  requireHTML(screen.getByRole('button', { name: 'First native drawer action' }).element()).focus();
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => surface.isConnected).toBe(false);
  expect(changes.mock.calls[0][1].type).toBe('escapeKeyDown');
});

test('non-modal manual popovers allow outside focus and Tab escape without light dismissal', async () => {
  const screen = await render(<NativeFixture modalType="non-modal" />);
  const trigger = screen.getByRole('button', { name: 'Native drawer trigger' });
  await userEvent.click(trigger);
  const surface = requireDialog(screen.getByTestId('native-drawer').element());
  expect(surface.open).toBe(false);
  expect(surface.matches(':popover-open')).toBe(true);
  expect(surface.getAttribute('popover')).toBe('manual');
  expect(surface.getAttribute('aria-modal')).toBeNull();
  const outside = screen.getByRole('button', { name: 'Outside native drawer' });
  const outsideElement = requireHTML(outside.element());
  const outsideRect = outsideElement.getBoundingClientRect();
  expect(
    document.elementFromPoint(
      outsideRect.left + outsideRect.width / 2,
      outsideRect.top + outsideRect.height / 2,
    ),
  ).toBe(outsideElement);
  await userEvent.click(outside);
  await expect.element(outside).toHaveFocus();
  expect(surface.matches(':popover-open')).toBe(true);
  requireHTML(screen.getByRole('button', { name: 'Close native drawer' }).element()).focus();
  await userEvent.keyboard('{Tab}');
  expect(surface.contains(document.activeElement)).toBe(false);
  surface.focus();
  await userEvent.keyboard('{Tab}');
  await expect
    .element(screen.getByRole('button', { name: 'First native drawer action' }))
    .toHaveFocus();
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => surface.isConnected).toBe(false);
  await expect.element(trigger).toHaveFocus();
});

test('controlled close refusal and consumer Escape cancellation remain authoritative', async () => {
  const changes = vi.fn<NonNullable<OverlayDrawerProps['onOpenChange']>>();
  const keys = vi.fn<NonNullable<OverlayDrawerProps['onKeyDown']>>();
  const screen = await render(
    <NativeFixture controlledOpen onOpenChange={changes} onKeyDown={keys} />,
  );
  const surface = requireDialog(screen.getByTestId('native-drawer').element());
  await userEvent.keyboard('{Escape}');
  expect(changes).toHaveBeenCalledTimes(1);
  expect(keys).toHaveBeenCalledTimes(1);
  expect(surface.matches(':modal')).toBe(true);
  await screen.rerender(
    <NativeFixture
      controlledOpen
      onOpenChange={changes}
      onKeyDown={(event) => {
        keys(event);
        event.preventDefault();
      }}
    />,
  );
  await userEvent.keyboard('{Escape}');
  expect(changes).toHaveBeenCalledTimes(1);
  expect(keys).toHaveBeenCalledTimes(2);
  expect(surface.matches(':modal')).toBe(true);
  await screen.rerender(<NativeFixture controlledOpen={false} onOpenChange={changes} />);
  await expect.poll(() => surface.isConnected).toBe(false);
});

test('open-change preventDefault and native cancel preserve controlled native state', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <OverlayDrawerFlow />
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Open project drawer' });
  await userEvent.click(trigger);
  const surface = requireDialog(screen.getByRole('dialog', { name: 'Project drawer' }).element());
  const cancel = new Event('cancel', { bubbles: false, cancelable: true });
  surface.dispatchEvent(cancel);
  expect(cancel.defaultPrevented).toBe(true);
  expect(surface.open).toBe(true);
  await userEvent.click(screen.getByRole('checkbox', { name: 'Prevent dismissal' }));
  await userEvent.keyboard('{Escape}');
  expect(surface.matches(':modal')).toBe(true);
  await expect
    .element(screen.getByLabelText('Drawer changes'))
    .toHaveTextContent('escapeKeyDown:false:keydown');
  await userEvent.click(screen.getByRole('checkbox', { name: 'Prevent dismissal' }));
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => surface.isConnected).toBe(false);
  await expect.element(trigger).toHaveFocus();
});

test('the installed non-modal dialog.show fallback stays styled without a library polyfill', async () => {
  const prototype = HTMLDialogElement.prototype;
  const showDescriptor = Object.getOwnPropertyDescriptor(prototype, 'showPopover');
  const hideDescriptor = Object.getOwnPropertyDescriptor(prototype, 'hidePopover');
  Object.defineProperty(prototype, 'showPopover', { configurable: true, value: undefined });
  Object.defineProperty(prototype, 'hidePopover', { configurable: true, value: undefined });
  try {
    const screen = await render(<NativeFixture modalType="non-modal" />);
    await userEvent.click(screen.getByRole('button', { name: 'Native drawer trigger' }));
    const surface = requireDialog(screen.getByTestId('native-drawer').element());
    expect(surface.open).toBe(true);
    expect(surface.matches(':modal')).toBe(false);
    expect(surface.matches(':popover-open')).toBe(false);
    expect(getComputedStyle(surface).display).toBe('flex');
    await userEvent.click(screen.getByRole('button', { name: 'Close native drawer' }));
    await expect.poll(() => surface.isConnected).toBe(false);
  } finally {
    await cleanup();
    if (showDescriptor) Object.defineProperty(prototype, 'showPopover', showDescriptor);
    else Reflect.deleteProperty(prototype, 'showPopover');
    if (hideDescriptor) Object.defineProperty(prototype, 'hidePopover', hideDescriptor);
    else Reflect.deleteProperty(prototype, 'hidePopover');
  }
});

test('inline navigation stays in layout, preserves mounted input state and keeps main actions usable', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <InlineDrawerFlow />
    </CoreAIFluentProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Show navigation' }));
  const drawer = requireHTML(screen.getByRole('complementary', { name: 'Projects' }).element());
  expect(drawer.tagName).toBe('ASIDE');
  expect(drawer.closest('dialog')).toBeNull();
  expect(getComputedStyle(drawer).position).toBe('relative');
  expect(drawer.getBoundingClientRect().height).toBe(360);
  await userEvent.click(screen.getByRole('link', { name: 'Activity' }));
  await expect
    .element(screen.getByRole('link', { name: 'Activity' }))
    .toHaveAttribute('aria-current', 'page');
  await userEvent.type(screen.getByRole('textbox', { name: 'Filter projects' }), 'Atlas');
  await userEvent.click(screen.getByRole('button', { name: 'Refresh main content' }));
  await expect.element(screen.getByLabelText('Refresh count')).toHaveTextContent('1');
  await userEvent.click(screen.getByRole('button', { name: 'Hide navigation' }));
  expect(drawer.isConnected).toBe(true);
  expect(drawer.getAttribute('aria-hidden')).toBe('true');
  expect(getComputedStyle(drawer).visibility).toBe('hidden');
  expect(drawer.getBoundingClientRect().width).toBe(0);
  expect(screen.getByRole('textbox', { name: 'Filter projects' }).query()).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Show navigation' }));
  await expect
    .element(screen.getByRole('textbox', { name: 'Filter projects' }))
    .toHaveValue('Atlas');
});

for (const position of ['start', 'end', 'bottom'] as const) {
  test(`kept-mounted inline ${position} collapses only its current layout axis`, async () => {
    const fixture = (open: boolean) => (
      <CoreAIFluentProvider>
        <div
          style={{
            display: 'flex',
            height: 480,
            flexDirection: position === 'bottom' ? 'column' : 'row',
          }}
        >
          <InlineDrawer
            open={open}
            unmountOnClose={false}
            position={position}
            separator
            data-testid="inline-axis"
          >
            <DrawerBody>
              <button type="button">Inline axis action</button>
            </DrawerBody>
          </InlineDrawer>
        </div>
      </CoreAIFluentProvider>
    );
    const screen = await render(fixture(true));
    const surface = requireHTML(screen.getByTestId('inline-axis').element());
    expect(surface.getBoundingClientRect().width).toBeGreaterThan(0);
    expect(surface.getBoundingClientRect().height).toBe(position === 'bottom' ? 320 : 480);
    await screen.rerender(fixture(false));
    expect(surface.isConnected).toBe(true);
    expect(getComputedStyle(surface).visibility).toBe('hidden');
    expect(
      position === 'bottom'
        ? surface.getBoundingClientRect().height
        : surface.getBoundingClientRect().width,
    ).toBe(0);
    expect(
      position === 'bottom'
        ? surface.getBoundingClientRect().width
        : surface.getBoundingClientRect().height,
    ).toBeGreaterThan(0);
    expect(getComputedStyle(surface).borderTopWidth).toBe('0px');
    expect(getComputedStyle(surface).borderLeftWidth).toBe('0px');
    expect(getComputedStyle(surface).borderRightWidth).toBe('0px');
  });
}

test('default inline close unmounts and resets local native state on the next mount', async () => {
  const fixture = (open: boolean) => (
    <CoreAIFluentProvider>
      <InlineDrawer open={open}>
        <DrawerBody>
          <label>
            Unmounted note <input defaultValue="Initial" />
          </label>
        </DrawerBody>
      </InlineDrawer>
    </CoreAIFluentProvider>
  );
  const screen = await render(fixture(true));
  await userEvent.fill(screen.getByRole('textbox', { name: 'Unmounted note' }), 'Changed');
  await screen.rerender(fixture(false));
  expect(screen.getByRole('textbox', { name: 'Unmounted note' }).query()).toBeNull();
  expect(screen.container.querySelector('.fui-InlineDrawer')).toBeNull();
  await screen.rerender(fixture(true));
  await expect
    .element(screen.getByRole('textbox', { name: 'Unmounted note' }))
    .toHaveValue('Initial');
});

test('body scroll context controls exact header/footer separator states without another state owner', async () => {
  const example = drawerExamples.find((candidate) => candidate.name === 'Scrollable overlay');
  if (!example) throw new Error('Missing scrolling fixture');
  const { headless } = await renderPair(example);
  const body = headless.querySelector<HTMLElement>('[data-drawer-body]');
  const header = headless.querySelector<HTMLElement>('[data-drawer-header]');
  const footer = headless.querySelector<HTMLElement>('[data-drawer-footer]');
  if (!body || !header || !footer) throw new Error('Missing scroll-state slots');
  expect(header.getAttribute('data-scroll-state')).toBe('top');
  expect(getComputedStyle(header, '::after').opacity).toBe('0');
  expect(getComputedStyle(footer, '::before').opacity).toBe('1');
  body.scrollTop = Math.floor((body.scrollHeight - body.clientHeight) / 2);
  body.dispatchEvent(new Event('scroll'));
  await expect.poll(() => header.getAttribute('data-scroll-state')).toBe('middle');
  await settleDrawerStyles(headless);
  expect(getComputedStyle(header, '::after').opacity).toBe('1');
  expect(getComputedStyle(footer, '::before').opacity).toBe('1');
  body.scrollTop = body.scrollHeight;
  body.dispatchEvent(new Event('scroll'));
  await expect.poll(() => footer.getAttribute('data-scroll-state')).toBe('bottom');
  await settleDrawerStyles(headless);
  expect(getComputedStyle(header, '::after').opacity).toBe('1');
  expect(getComputedStyle(footer, '::before').opacity).toBe('0');
});

test('the actual public DrawerProvider remains usable with controlled scroll context', async () => {
  const setScrollState = vi.fn();
  function Probe() {
    return <output aria-label="Drawer scroll context">{useDrawerContext().scrollState}</output>;
  }
  const screen = await render(
    <CoreAIFluentProvider>
      <DrawerProvider value={{ scrollState: 'middle', setScrollState }}>
        <DrawerHeader data-testid="provided-header">
          <DrawerHeaderTitle>Controlled context</DrawerHeaderTitle>
          <Probe />
        </DrawerHeader>
        <DrawerFooter data-testid="provided-footer">Footer</DrawerFooter>
      </DrawerProvider>
    </CoreAIFluentProvider>,
  );
  await expect.element(screen.getByLabelText('Drawer scroll context')).toHaveTextContent('middle');
  expect(screen.getByTestId('provided-header').element().getAttribute('data-scroll-state')).toBe(
    'middle',
  );
  expect(screen.getByTestId('provided-footer').element().getAttribute('data-scroll-state')).toBe(
    'middle',
  );
  expect(setScrollState).not.toHaveBeenCalled();
});

test('real native form validation, FormData and the external footer submitter remain intact', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <DrawerFormFlow />
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Open sharing form' });
  await userEvent.click(trigger);
  const input = screen.getByRole('textbox', { name: 'Project name' });
  await userEvent.clear(input);
  await userEvent.click(screen.getByRole('button', { name: 'Share project', exact: true }));
  expect(requireDialog(screen.getByRole('dialog', { name: 'Share project' }).element()).open).toBe(
    true,
  );
  const control = input.element();
  expect(control instanceof HTMLInputElement && control.validity.valueMissing).toBe(true);
  await expect.element(screen.getByLabelText('Drawer form result')).toHaveTextContent('');
  await userEvent.type(input, 'Atlas v2');
  await userEvent.click(screen.getByRole('button', { name: 'Share project', exact: true }));
  await expect
    .element(screen.getByLabelText('Drawer form result'))
    .toHaveTextContent('Atlas v2|share|SubmitEvent');
  await expect.poll(() => screen.getByRole('dialog', { name: 'Share project' }).query()).toBeNull();
  await expect.element(trigger).toHaveFocus();
});

test('bare method=dialog keeps the inherited native-close versus controlled-open boundary', async () => {
  const changes = vi.fn<NonNullable<OverlayDrawerProps['onOpenChange']>>();
  const closes = vi.fn<NonNullable<OverlayDrawerProps['onClose']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <OverlayDrawer
        open
        unmountOnClose={false}
        aria-label="Bare native form"
        onOpenChange={changes}
        onClose={closes}
      >
        <DrawerBody>
          <form method="dialog">
            <button type="submit" value="saved">
              Finish bare form
            </button>
          </form>
        </DrawerBody>
      </OverlayDrawer>
    </CoreAIFluentProvider>,
  );
  const surface = requireDialog(screen.getByRole('dialog', { name: 'Bare native form' }).element());
  await userEvent.click(screen.getByRole('button', { name: 'Finish bare form' }));
  await expect.poll(() => surface.open).toBe(false);
  expect(surface.returnValue).toBe('saved');
  expect(surface.hasAttribute('data-open')).toBe(true);
  expect(getComputedStyle(surface).display).toBe('none');
  expect(changes).not.toHaveBeenCalled();
  await expect.poll(() => closes.mock.calls.length).toBe(1);
});

test('nested native Popover/Dialog preserve top-layer order, Escape isolation and focus restoration', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <DrawerNestedFlow />
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Open nested drawer' });
  await userEvent.click(trigger);
  const drawer = requireDialog(screen.getByRole('dialog', { name: 'Nested drawer' }).element());
  const helpTrigger = screen.getByRole('button', { name: 'Open drawer help' });
  await userEvent.click(helpTrigger);
  const help = requireHTML(screen.getByRole('group', { name: 'Drawer help' }).element());
  expect(help.matches(':popover-open')).toBe(true);
  expect(drawer.matches(':modal')).toBe(true);
  requireHTML(screen.getByRole('button', { name: 'Close drawer help' }).element()).focus();
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => help.matches(':popover-open')).toBe(false);
  expect(drawer.matches(':modal')).toBe(true);
  await expect.element(helpTrigger).toHaveFocus();
  const confirmationTrigger = screen.getByRole('button', { name: 'Open drawer confirmation' });
  await userEvent.click(confirmationTrigger);
  const confirmation = requireDialog(
    screen.getByRole('dialog', { name: 'Drawer confirmation' }).element(),
  );
  expect(confirmation.matches(':modal')).toBe(true);
  expect(drawer.matches(':modal')).toBe(true);
  expect(confirmation.hasAttribute('data-dialog-nested')).toBe(true);
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => confirmation.isConnected).toBe(false);
  expect(drawer.matches(':modal')).toBe(true);
  await expect.element(confirmationTrigger).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => drawer.isConnected).toBe(false);
  await expect.element(trigger).toHaveFocus();
});

test('family refs, native heading/action render functions, classes and data attributes survive styling', async () => {
  const refs = {
    root: React.createRef<HTMLDialogElement>(),
    header: React.createRef<HTMLElement>(),
    title: React.createRef<HTMLDivElement>(),
    heading: React.createRef<HTMLHeadingElement>(),
    action: React.createRef<HTMLDivElement>(),
    navigation: React.createRef<HTMLElement>(),
    body: React.createRef<HTMLDivElement>(),
    footer: React.createRef<HTMLElement>(),
  };
  type HeadingProps = Extract<ExtractSlotProps<DrawerHeaderTitleSlots['heading']>, { as?: 'h2' }>;
  type ActionProps = ExtractSlotProps<DrawerHeaderTitleSlots['action']>;
  const headingRender = vi.fn<SlotRenderFunction<HeadingProps>>((Component, props) => (
    <Component {...props} data-heading-rendered="">
      Caller heading
    </Component>
  ));
  const actionRender = vi.fn<SlotRenderFunction<ActionProps>>((Component, props) => (
    <Component {...props} data-action-rendered="">
      <button type="button">Caller action</button>
    </Component>
  ));
  const screen = await render(
    <CoreAIFluentProvider>
      <OverlayDrawer
        open
        ref={refs.root}
        className="caller-root"
        data-testid="caller-drawer"
        data-consumer="root"
        aria-describedby="caller-description"
      >
        <DrawerHeader ref={refs.header} className="caller-header">
          <DrawerHeaderNavigation
            ref={refs.navigation}
            className="caller-navigation"
            aria-label="Caller navigation"
          >
            <a href="#caller-target">Caller target</a>
          </DrawerHeaderNavigation>
          <DrawerHeaderTitle
            ref={refs.title}
            className="caller-title"
            heading={{
              as: 'h2',
              ref: refs.heading,
              className: 'caller-heading',
              children: headingRender,
            }}
            action={{ ref: refs.action, className: 'caller-action', children: actionRender }}
          >
            Replaced title
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody ref={refs.body} className="caller-body" id="caller-description">
          Caller description
        </DrawerBody>
        <DrawerFooter ref={refs.footer} className="caller-footer">
          Caller footer
        </DrawerFooter>
      </OverlayDrawer>
    </CoreAIFluentProvider>,
  );
  const root = requireDialog(screen.getByRole('dialog', { name: 'Caller heading' }).element());
  expect(refs.root.current).toBe(root);
  expect(root.dataset.consumer).toBe('root');
  expect(root.classList.contains(overlayDrawerClassNames.root)).toBe(true);
  expect(root.classList.contains('caller-root')).toBe(true);
  expect(root.getAttribute('size')).toBeNull();
  expect(root.getAttribute('aria-describedby')).toBe('caller-description');
  expect(root.getAttribute('aria-labelledby')).toBe(refs.heading.current?.id);
  for (const [name, tag, marker] of [
    ['header', 'HEADER', drawerHeaderClassNames.root],
    ['title', 'DIV', drawerHeaderTitleClassNames.root],
    ['heading', 'H2', drawerHeaderTitleClassNames.heading],
    ['action', 'DIV', drawerHeaderTitleClassNames.action],
    ['navigation', 'NAV', drawerHeaderNavigationClassNames.root],
    ['body', 'DIV', drawerBodyClassNames.root],
    ['footer', 'FOOTER', drawerFooterClassNames.root],
  ] as const) {
    const element = refs[name].current;
    expect(element?.tagName).toBe(tag);
    expect(element?.classList.contains(marker)).toBe(true);
    expect(element?.classList.contains(`caller-${name}`)).toBe(true);
  }
  expect(refs.heading.current?.hasAttribute('data-heading-rendered')).toBe(true);
  expect(refs.action.current?.hasAttribute('data-action-rendered')).toBe(true);
  expect(headingRender).toHaveBeenCalled();
  expect(actionRender).toHaveBeenCalled();
});

test('supported root render functions preserve native metadata instead of replacing compatibility registries', async () => {
  const rootRef = React.createRef<HTMLDialogElement>();
  const bodyRef = React.createRef<HTMLDivElement>();
  const headerRef = React.createRef<HTMLElement>();
  const footerRef = React.createRef<HTMLElement>();
  const navigationRef = React.createRef<HTMLElement>();
  const renderHeader: SlotRenderFunction<
    ExtractSlotProps<primitiveDrawer.DrawerHeaderSlots['root']>
  > = (Header, headerProps) => (
    <Header {...headerProps} data-header-rendered="">
      <DrawerHeaderTitle>Root rendering</DrawerHeaderTitle>
    </Header>
  );
  const renderNavigation: SlotRenderFunction<
    ExtractSlotProps<primitiveDrawer.DrawerHeaderNavigationSlots['root']>
  > = (Navigation, navigationProps) => (
    <Navigation {...navigationProps} data-navigation-rendered="">
      <a href="#rendered">Rendered link</a>
    </Navigation>
  );
  const renderBody: SlotRenderFunction<
    ExtractSlotProps<primitiveDrawer.DrawerBodySlots['root']>
  > = (Body, bodyProps) => (
    <Body {...bodyProps} data-body-rendered="">
      Rendered body
    </Body>
  );
  const renderFooter: SlotRenderFunction<
    ExtractSlotProps<primitiveDrawer.DrawerFooterSlots['root']>
  > = (Footer, footerProps) => (
    <Footer {...footerProps} data-footer-rendered="">
      Rendered footer
    </Footer>
  );
  const renderRoot: SlotRenderFunction<
    ExtractSlotProps<primitiveDrawer.OverlayDrawerSlots['root']>
  > = (Component, props) => (
    <Component {...props} data-root-rendered="">
      <DrawerHeader ref={headerRef}>{renderHeader}</DrawerHeader>
      <DrawerHeaderNavigation ref={navigationRef} aria-label="Rendered navigation">
        {renderNavigation}
      </DrawerHeaderNavigation>
      <DrawerBody ref={bodyRef}>{renderBody}</DrawerBody>
      <DrawerFooter ref={footerRef}>{renderFooter}</DrawerFooter>
    </Component>
  );
  const screen = await render(
    <CoreAIFluentProvider>
      <OverlayDrawer open ref={rootRef} aria-label="Caller root">
        {renderRoot}
      </OverlayDrawer>
    </CoreAIFluentProvider>,
  );
  const root = requireDialog(screen.getByRole('dialog', { name: 'Caller root' }).element());
  expect(rootRef.current).toBe(root);
  expect(root.hasAttribute('data-root-rendered')).toBe(true);
  expect(root.matches(':modal')).toBe(true);
  for (const [ref, tag, marker] of [
    [headerRef, 'HEADER', 'data-header-rendered'],
    [navigationRef, 'NAV', 'data-navigation-rendered'],
    [bodyRef, 'DIV', 'data-body-rendered'],
    [footerRef, 'FOOTER', 'data-footer-rendered'],
  ] as const) {
    expect(ref.current?.tagName).toBe(tag);
    expect(ref.current?.hasAttribute(marker)).toBe(true);
  }
});

test('current Drawer convenience dispatch retains variant-specific native refs without deprecated state access', async () => {
  const ref = React.createRef<HTMLElement>();
  const screen = await render(
    <CoreAIFluentProvider>
      <Drawer open ref={ref} aria-label="Convenience overlay">
        <DrawerBody>Overlay body</DrawerBody>
      </Drawer>
    </CoreAIFluentProvider>,
  );
  expect(ref.current instanceof HTMLDialogElement).toBe(true);
  expect(ref.current?.matches(':modal')).toBe(true);
  expect(ref.current?.classList.contains(overlayDrawerClassNames.root)).toBe(true);
  expect(ref.current?.classList.contains(drawerClassNames.root)).toBe(true);
  await screen.rerender(
    <CoreAIFluentProvider>
      <Drawer type="inline" as="aside" open ref={ref} separator aria-label="Convenience inline">
        <DrawerBody>Inline body</DrawerBody>
      </Drawer>
    </CoreAIFluentProvider>,
  );
  expect(ref.current?.tagName).toBe('ASIDE');
  expect(ref.current?.classList.contains(inlineDrawerClassNames.root)).toBe(true);
  expect(ref.current?.classList.contains(drawerClassNames.root)).toBe(true);
  expect(ref.current?.getAttribute('type')).toBeNull();
  expect(ref.current?.getAttribute('separator')).toBeNull();
  expect(ref.current?.hasAttribute('data-separator')).toBe(true);
});

test('body-only drawers retain the exact first/last-child padding rules', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <InlineDrawer open>
        <DrawerBody data-testid="only-drawer-body">Only body</DrawerBody>
      </InlineDrawer>
    </CoreAIFluentProvider>,
  );
  const body = screen.getByTestId('only-drawer-body').element();
  expect(getComputedStyle(body).paddingTop).toBe('25px');
  expect(getComputedStyle(body).paddingBottom).toBe('25px');
  expect(getComputedStyle(body).paddingLeft).toBe('24px');
  expect(getComputedStyle(body).paddingRight).toBe('24px');
});

for (const modalType of ['modal', 'non-modal', 'alert'] as const) {
  test(`${modalType} retains the native body's scroll lock without modifying host document styles`, async () => {
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    const screen = await render(<NativeFixture modalType={modalType} />);
    await userEvent.click(screen.getByRole('button', { name: 'Native drawer trigger' }));
    expect(document.body.style.overflow).toBe(
      modalType === 'non-modal' ? bodyOverflow : 'visible clip',
    );
    expect(document.documentElement.style.overflow).toBe(rootOverflow);
    await userEvent.click(screen.getByRole('button', { name: 'Close native drawer' }));
    await expect.poll(() => document.body.style.overflow).toBe(bodyOverflow);
    expect(document.documentElement.style.overflow).toBe(rootOverflow);
  });
}

test('live theme changes reach the connected native surface through its existing provider', async () => {
  const fixture = (theme: typeof coreaiLightTheme) => (
    <CoreAIFluentProvider theme={theme}>
      <OverlayDrawer open aria-label="Themed drawer">
        <DrawerBody>Themed content</DrawerBody>
      </OverlayDrawer>
    </CoreAIFluentProvider>
  );
  const screen = await render(fixture(coreaiLightTheme));
  const surface = requireDialog(screen.getByRole('dialog', { name: 'Themed drawer' }).element());
  const provider = surface.closest('.fui-FluentProvider');
  const background = getComputedStyle(surface).backgroundColor;
  expect(provider).not.toBeNull();
  expect(screen.container.contains(surface)).toBe(true);
  await screen.rerender(fixture(coreaiDarkTheme));
  expect(surface.isConnected).toBe(true);
  expect(surface.closest('.fui-FluentProvider')).toBe(provider);
  expect(getComputedStyle(surface).backgroundColor).not.toBe(background);
});

test('explicit names and supported div headings retain native ARIA without inventing title actions', async () => {
  const headingRef = React.createRef<HTMLDivElement>();
  const screen = await render(
    <CoreAIFluentProvider>
      <OverlayDrawer open aria-label="Explicit drawer name">
        <DrawerHeader>
          <DrawerHeaderTitle
            heading={{ as: 'div', role: 'heading', 'aria-level': 4, ref: headingRef }}
          >
            Div heading
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>Complex content without an automatic description.</DrawerBody>
      </OverlayDrawer>
    </CoreAIFluentProvider>,
  );
  const surface = requireDialog(
    screen.getByRole('dialog', { name: 'Explicit drawer name' }).element(),
  );
  expect(surface.getAttribute('aria-labelledby')).toBeNull();
  expect(surface.getAttribute('aria-describedby')).toBeNull();
  expect(headingRef.current?.tagName).toBe('DIV');
  expect(headingRef.current?.getAttribute('aria-level')).toBe('4');
  expect(headingRef.current).toBe(screen.getByRole('heading', { name: 'Div heading' }).element());
  expect(surface.querySelector('.fui-DrawerHeaderTitle__action')).toBeNull();
  expect(getComputedStyle(requireHTML(headingRef.current ?? surface)).fontSize).toBe('20px');
});
