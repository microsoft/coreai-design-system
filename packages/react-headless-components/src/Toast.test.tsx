// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import {
  Toast as PrimitiveToast,
  ToastBody as PrimitiveToastBody,
  ToastContainer as PrimitiveToastContainer,
  ToastFooter as PrimitiveToastFooter,
  ToastTitle as PrimitiveToastTitle,
  Toaster as PrimitiveToaster,
  useToastController as primitiveController,
  useToastContainerContext as primitiveContext,
  type ToastBodySlots as PrimitiveToastBodySlots,
  type ToastContainerProps as PrimitiveToastContainerProps,
  type ToastContainerSlots as PrimitiveToastContainerSlots,
  type ToastFooterSlots as PrimitiveToastFooterSlots,
  type ToastSlots as PrimitiveToastSlots,
  type ToastTitleSlots as PrimitiveToastTitleSlots,
  type ToasterProps as PrimitiveToasterProps,
} from '@fluentui/react-headless-components-preview/toast';
import {
  AriaLiveAnnouncer,
  CoreAIFluentProvider,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import {
  BackgroundAppearanceProvider,
  useAnnounce,
  useBackgroundAppearance,
} from '@fluentui/react-shared-contexts';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import {
  ToastComparison,
  ToastControllerFlow,
  ToastNativeFormFlow,
  toastConsumerExample,
  toastExamples,
  toastPositions,
  type ToastExample,
} from '../../../apps/storybook/src/stories/experiments/ToastComparison.js';
import { FocusgroupConsumer } from '../../../apps/storybook/src/stories/experiments/FocusgroupConsumer.js';
import {
  captureToastStyles,
  compareToastStyles,
  getComparisonToast,
  getToastSlots,
  settleToastStyles,
} from '../../../apps/storybook/src/stories/experiments/compareToastStyles.js';
import {
  Toast,
  toastClassNames,
  type ToastImperativeRef,
  type ToastProps,
  type ToastSlots,
} from './Toast.js';
import {
  ToastBody,
  toastBodyClassNames,
  type ToastBodyProps,
  type ToastBodySlots,
} from './ToastBody.js';
import {
  ToastContainer,
  toastContainerClassNames,
  useToastContainerContext,
  type ToastContainerProps,
  type ToastContainerSlots,
} from './ToastContainer.js';
import {
  ToastFooter,
  toastFooterClassNames,
  type ToastFooterProps,
  type ToastFooterSlots,
} from './ToastFooter.js';
import {
  ToastTitle,
  toastTitleClassNames,
  type ToastTitleProps,
  type ToastTitleSlots,
} from './ToastTitle.js';
import { Toaster, toasterClassNames, useToastController, type ToasterProps } from './Toaster.js';
import { Button } from './Button.js';
import { Link } from './Link.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

function html(element: Element | null | undefined): HTMLElement {
  if (!(element instanceof HTMLElement)) throw new Error('Expected a native HTML element');
  return element;
}

async function renderPair(
  example: ToastExample,
  theme = coreaiLightTheme,
  dir: 'ltr' | 'rtl' = 'ltr',
  withComponentDefaults = true,
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} dir={dir} withComponentDefaults={withComponentDefaults}>
      <ToastComparison examples={[example]} />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('Toast fixtures', { exact: true }));
  const legacy = getComparisonToast(screen.container, 'legacy');
  const headless = getComparisonToast(screen.container, 'headless');
  await Promise.all([settleToastStyles(legacy), settleToastStyles(headless)]);
  expect(legacy.matches(':hover')).toBe(false);
  expect(headless.matches(':hover')).toBe(false);
  return { screen, legacy, headless };
}

type Controller = ReturnType<typeof useToastController>;

function ControllerHarness({
  controllerRef,
  raw = false,
  options,
}: {
  controllerRef: React.Ref<Controller>;
  raw?: boolean;
  options?: Omit<ToasterProps, 'toasterId'>;
}) {
  const toasterId = React.useId();
  const controller = useToastController(toasterId);
  React.useImperativeHandle(controllerRef, () => controller, [controller]);
  const Root = raw ? PrimitiveToaster : Toaster;
  return (
    <FocusgroupConsumer>
      <button type="button">Before notifications</button>
      <Root
        {...options}
        toasterId={toasterId}
        shortcuts={{ focus: (event) => event.key === 'F6' }}
        data-toast-test-toaster
      />
      <button type="button">After notifications</button>
    </FocusgroupConsumer>
  );
}

function ApplicationAnnouncementHarness({
  controllerRef,
  raw,
}: {
  controllerRef: React.Ref<Controller>;
  raw: boolean;
}) {
  const { announce } = useAnnounce();
  const suppressedRef = React.useRef(false);
  const [suppressed, setSuppressed] = React.useState(false);
  const narrate = React.useCallback<NonNullable<ToasterProps['announce']>>(
    (message, options) => {
      if (suppressedRef.current) return;
      const assertive = options.politeness === 'assertive';
      announce(message, { polite: !assertive, alert: assertive });
    },
    [announce],
  );
  return (
    <>
      <button
        type="button"
        onClick={() => {
          suppressedRef.current = !suppressedRef.current;
          setSuppressed(suppressedRef.current);
        }}
      >
        {suppressed ? 'Resume announcements' : 'Suppress announcements'}
      </button>
      <output aria-label="Application announcement suppression">{String(suppressed)}</output>
      <ControllerHarness controllerRef={controllerRef} raw={raw} options={{ announce: narrate }} />
    </>
  );
}

async function renderController({
  raw = false,
  options,
  dir = 'ltr',
}: {
  raw?: boolean;
  options?: Omit<ToasterProps, 'toasterId'>;
  dir?: 'ltr' | 'rtl';
} = {}) {
  const ref = React.createRef<Controller>();
  const screen = await render(
    <CoreAIFluentProvider dir={dir}>
      <ControllerHarness controllerRef={ref} raw={raw} options={options} />
    </CoreAIFluentProvider>,
  );
  if (!ref.current) throw new Error('The public Toast controller has not mounted');
  return { screen, controller: ref.current };
}

function NotificationContent({ title = 'Saved notification' }: { title?: string }) {
  const { close } = useToastContainerContext();
  return (
    <Toast>
      <ToastTitle
        action={
          <Button type="button" size="small" onClick={close}>
            Close notification
          </Button>
        }
      >
        {title}
      </ToastTitle>
      <ToastBody subtitle="Project activity">Saved project detail</ToastBody>
      <ToastFooter>
        <Link href="#toast-test-history">Open history</Link>
      </ToastFooter>
    </Toast>
  );
}

test('preserves all six current public contracts without legacy trigger, timer, or portal aliases', () => {
  expectTypeOf<typeof Toast>().toEqualTypeOf<ForwardRefComponent<ToastProps>>();
  expectTypeOf<typeof ToastTitle>().toEqualTypeOf<ForwardRefComponent<ToastTitleProps>>();
  expectTypeOf<typeof ToastBody>().toEqualTypeOf<ForwardRefComponent<ToastBodyProps>>();
  expectTypeOf<typeof ToastFooter>().toEqualTypeOf<ForwardRefComponent<ToastFooterProps>>();
  expectTypeOf<typeof ToastContainer>().toEqualTypeOf<ForwardRefComponent<ToastContainerProps>>();
  expectTypeOf<ToastContainerProps>().toEqualTypeOf<PrimitiveToastContainerProps>();
  expectTypeOf<ToasterProps>().toEqualTypeOf<PrimitiveToasterProps>();
  expectTypeOf<ToastSlots>().toEqualTypeOf<PrimitiveToastSlots>();
  expectTypeOf<ToastTitleSlots>().toEqualTypeOf<PrimitiveToastTitleSlots>();
  expectTypeOf<ToastBodySlots>().toEqualTypeOf<PrimitiveToastBodySlots>();
  expectTypeOf<ToastFooterSlots>().toEqualTypeOf<PrimitiveToastFooterSlots>();
  expectTypeOf<ToastContainerSlots>().toEqualTypeOf<PrimitiveToastContainerSlots>();
  expectTypeOf<React.ComponentProps<typeof Toast>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveToast>['ref']
  >();
  expectTypeOf<React.ComponentProps<typeof ToastTitle>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveToastTitle>['ref']
  >();
  expectTypeOf<React.ComponentProps<typeof ToastBody>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveToastBody>['ref']
  >();
  expectTypeOf<React.ComponentProps<typeof ToastFooter>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveToastFooter>['ref']
  >();
  expectTypeOf<React.ComponentProps<typeof ToastContainer>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveToastContainer>['ref']
  >();
  expectTypeOf<ToastProps['appearance']>().toEqualTypeOf<'brand' | 'inverted' | undefined>();
  expectTypeOf<
    Extract<keyof ToasterProps, 'mountNode' | 'inline' | 'children' | 'ref'>
  >().toEqualTypeOf<never>();
  expectTypeOf<Extract<keyof ToastContainerSlots, 'timer'>>().toEqualTypeOf<never>();
  expect(useToastController).toBe(primitiveController);
  expect(useToastContainerContext).toBe(primitiveContext);
});

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(toastExamples)(
    `matches $name and resolved slot geometry in ${mode}`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(compareToastStyles(captureToastStyles(legacy), captureToastStyles(headless))).toEqual(
        [],
      );
      expect(headless.tagName).toBe('DIV');
      expect(headless).not.toHaveAttribute('appearance');
      expect(headless).not.toHaveAttribute('aria-live');
      expect(headless).toHaveAttribute('focusgroup', 'none');
      expect(headless).toHaveClass(toastClassNames.root);
      if (example.props?.appearance) {
        expect(headless).toHaveAttribute('data-appearance', example.props.appearance);
      }
      const slots = getToastSlots(headless);
      expect(slots.title).toHaveClass(toastTitleClassNames.root);
      if (!example.noContext) {
        const container = html(headless.closest('[role="listitem"]'));
        expect(container).toHaveAttribute('aria-labelledby', html(slots.title).id);
        if (slots.body) expect(container).toHaveAttribute('aria-describedby', slots.body.id);
        expect(headless).toHaveAttribute('data-intent', example.intent ?? 'info');
      } else {
        expect(headless).not.toHaveAttribute('data-intent');
        expect(slots.media).toBeNull();
      }
      const glyph = slots.media?.querySelector('svg');
      if (glyph) {
        expect(glyph).toHaveAttribute('aria-hidden', 'true');
        expect(glyph.querySelector('path')?.getAttribute('d')).toBe(
          getToastSlots(legacy).media?.querySelector('path')?.getAttribute('d'),
        );
      }
      if (example.renderedSlots) {
        for (const name of ['root', 'title', 'media', 'action', 'body', 'subtitle', 'footer']) {
          expect(
            headless.matches(`[data-toast-rendered-${name}]`) ||
              Boolean(headless.querySelector(`[data-toast-rendered-${name}]`)),
          ).toBe(true);
        }
      }
    },
  );
}

test.each(['ltr', 'rtl'] as const)(
  'retains the Fluent visual contract with defaults disabled in %s',
  async (dir) => {
    const { legacy, headless } = await renderPair(
      { name: 'Defaults disabled', intent: 'warning', props: { appearance: 'inverted' } },
      coreaiDarkTheme,
      dir,
      false,
    );
    expect(compareToastStyles(captureToastStyles(legacy), captureToastStyles(headless))).toEqual(
      [],
    );
    expect(getComputedStyle(html(getToastSlots(headless).media)).paddingInlineEnd).toBe('8px');
    expect(getComputedStyle(html(getToastSlots(headless).action)).paddingInlineStart).toBe('12px');
  },
);

test('lets ordinary consumer CSS override every owned visual surface', async () => {
  const { legacy, headless } = await renderPair(toastConsumerExample);
  const slots = getToastSlots(headless);
  expect(getComputedStyle(headless).borderTopWidth).toBe('3px');
  expect(getComputedStyle(headless).borderRadius).toBe('3px');
  expect(getComputedStyle(headless).paddingTop).toBe('17px');
  expect(getComputedStyle(headless).backgroundColor).toBe('rgb(237, 232, 247)');
  expect(getComputedStyle(html(slots.title)).color).toBe('rgb(80, 40, 120)');
  expect(getComputedStyle(html(slots.media)).paddingInlineEnd).toBe('11px');
  expect(getComputedStyle(html(slots.action)).paddingInlineStart).toBe('7px');
  expect(getComputedStyle(html(slots.body)).paddingTop).toBe('9px');
  expect(getComputedStyle(html(slots.subtitle)).paddingTop).toBe('7px');
  expect(getComputedStyle(html(slots.footer)).columnGap).toBe('7px');
  expect(
    compareToastStyles(captureToastStyles(legacy), captureToastStyles(headless)).length,
  ).toBeGreaterThan(0);
});

test('keeps current native slots, refs, caller renderers, ARIA, and explicit visual context', async () => {
  const refs = {
    container: React.createRef<HTMLDivElement>(),
    root: React.createRef<HTMLDivElement>(),
    title: React.createRef<HTMLDivElement>(),
    media: React.createRef<HTMLDivElement>(),
    action: React.createRef<HTMLDivElement>(),
    body: React.createRef<HTMLDivElement>(),
    subtitle: React.createRef<HTMLDivElement>(),
    footer: React.createRef<HTMLDivElement>(),
  };
  const imperativeRef = React.createRef<ToastImperativeRef>();
  const close = vi.fn();
  function ContextProbe() {
    const context = useToastContainerContext();
    const appearance = useBackgroundAppearance();
    return (
      <output aria-label="Toast context">{`${context.intent}:${appearance}:${context.titleId}:${context.bodyId}`}</output>
    );
  }
  const bodyRenderer: SlotRenderFunction<ExtractSlotProps<ToastBodySlots['root']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-caller-body>
      Reference detail
    </Component>
  );
  const containerProps: ToastContainerProps = {
    visible: true,
    toastId: 'standalone-notification',
    toasterId: undefined,
    intent: 'warning',
    content: null,
    timeout: -1,
    position: 'top',
    priority: 0,
    order: 0,
    updateId: 0,
    pauseOnHover: false,
    pauseOnWindowBlur: false,
    data: {},
    onStatusChange: undefined,
    imperativeRef,
    close,
    remove: () => undefined,
    tryRestoreFocus: () => undefined,
  };
  const screen = await render(
    <CoreAIFluentProvider>
      <ToastContainer {...containerProps} ref={refs.container} className="caller-container">
        <Toast ref={refs.root} appearance="inverted" className="caller-toast">
          <ToastTitle
            ref={refs.title}
            className="caller-title"
            media={{ ref: refs.media, className: 'caller-media' }}
            action={{
              ref: refs.action,
              className: 'caller-action',
              children: (
                <button type="button" onClick={close}>
                  Caller action
                </button>
              ),
            }}
          >
            Reference title
          </ToastTitle>
          <ToastBody
            ref={refs.body}
            className="caller-body"
            subtitle={{
              ref: refs.subtitle,
              className: 'caller-subtitle',
              children: 'Reference subtitle',
            }}
          >
            {bodyRenderer}
          </ToastBody>
          <ToastFooter ref={refs.footer} className="caller-footer">
            <ContextProbe />
          </ToastFooter>
        </Toast>
      </ToastContainer>
    </CoreAIFluentProvider>,
  );
  for (const [name, ref] of Object.entries(refs)) {
    expect(ref.current?.tagName).toBe('DIV');
    expect(ref.current).toHaveClass(`caller-${name === 'root' ? 'toast' : name}`);
  }
  expect(refs.container.current).toHaveClass(toastContainerClassNames.root);
  expect(refs.media.current).toHaveClass(toastTitleClassNames.media);
  expect(refs.action.current).toHaveClass(toastTitleClassNames.action);
  expect(refs.body.current).toHaveClass(toastBodyClassNames.root);
  expect(refs.subtitle.current).toHaveClass(toastBodyClassNames.subtitle);
  expect(refs.footer.current).toHaveClass(toastFooterClassNames.root);
  expect(refs.body.current).toHaveAttribute('data-caller-body');
  expect(refs.container.current).toHaveAttribute('aria-labelledby', refs.title.current?.id);
  expect(refs.container.current).toHaveAttribute('aria-describedby', refs.body.current?.id);
  expect(screen.getByRole('status', { name: 'Toast context' })).toHaveTextContent(
    `warning:inverted:${refs.title.current?.id}:${refs.body.current?.id}`,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Caller action', exact: true }));
  expect(close).toHaveBeenCalledTimes(1);
  imperativeRef.current?.focus();
  await expect.element(screen.getByRole('listitem', { name: 'Reference title' })).toHaveFocus();
});

test('does not inherit a surrounding background appearance when Toast appearance is omitted', async () => {
  function Probe() {
    return <output aria-label="Appearance probe">{useBackgroundAppearance() ?? 'unset'}</output>;
  }
  const screen = await render(
    <CoreAIFluentProvider>
      <BackgroundAppearanceProvider value="inverted">
        <Toast>
          <ToastTitle>Default background</ToastTitle>
          <ToastBody>
            <Probe />
          </ToastBody>
        </Toast>
      </BackgroundAppearanceProvider>
    </CoreAIFluentProvider>,
  );
  expect(screen.getByRole('status', { name: 'Appearance probe' })).toHaveTextContent('unset');
  const root = html(screen.container.querySelector('.fui-Toast'));
  expect(root).not.toHaveAttribute('data-appearance');
  expect(getComputedStyle(root).backgroundColor).toBe('rgb(255, 255, 255)');
});

test.each(['ltr', 'rtl'] as const)(
  'positions all six native top-layer stacks and per-position offsets in %s',
  async (dir) => {
    const { screen, controller } = await renderController({
      dir,
      options: {
        offset: {
          top: { horizontal: 11, vertical: 23 },
          'top-start': { horizontal: 17, vertical: 29 },
          'bottom-end': { horizontal: 31, vertical: 37 },
        },
      },
    });
    for (const position of toastPositions) {
      await React.act(() => {
        controller.dispatchToast(<NotificationContent title={`Position ${position}`} />, {
          position,
          timeout: -1,
          toastId: position,
          intent: 'info',
        });
      });
    }
    await expect
      .poll(() => screen.container.querySelectorAll('[data-toaster-position]').length)
      .toBe(6);
    for (const position of toastPositions) {
      const root = html(screen.container.querySelector(`[data-toaster-position="${position}"]`));
      await settleToastStyles(root);
      expect(root.matches(':popover-open')).toBe(true);
      expect(root).toHaveClass(toasterClassNames.root);
      expect(root).toHaveAttribute('popover', 'manual');
      expect(root).toHaveAttribute('focusgroup', 'toolbar block itemcontrols');
      expect(root.querySelector('[data-tabster]')).toBeNull();
      const rect = root.getBoundingClientRect();
      const offset =
        position === 'top'
          ? { horizontal: 11, vertical: 23 }
          : position === 'top-start'
            ? { horizontal: 17, vertical: 29 }
            : position === 'bottom-end'
              ? { horizontal: 31, vertical: 37 }
              : { horizontal: position === 'bottom' ? 0 : 20, vertical: 16 };
      expect(rect.width).toBe(292);
      if (position.startsWith('top')) expect(rect.top).toBeCloseTo(offset.vertical, 1);
      else expect(window.innerHeight - rect.bottom).toBeCloseTo(offset.vertical, 1);
      if (position === 'top' || position === 'bottom') {
        expect(rect.left + rect.width / 2).toBeCloseTo(
          window.innerWidth / 2 + offset.horizontal,
          1,
        );
      } else if (position.endsWith(dir === 'ltr' ? 'start' : 'end')) {
        expect(rect.left).toBeCloseTo(offset.horizontal, 1);
      } else {
        expect(window.innerWidth - rect.right).toBeCloseTo(offset.horizontal, 1);
      }
      const item = html(root.querySelector(':scope > [role="listitem"]'));
      expect(getComputedStyle(item).marginTop).toBe('16px');
      expect(getComputedStyle(item).borderRadius).toBe(coreaiLightTheme.borderRadiusMedium);
      expect(getComputedStyle(item).pointerEvents).toBe('all');
    }
    await React.act(() => controller.dismissAllToasts());
    await expect
      .poll(() => screen.container.querySelectorAll('[data-toaster-position]').length)
      .toBe(0);
  },
);

test('keeps stable ids, native root ref/event identity, updates, duplicate-id policy, and lifecycle payloads', async () => {
  const status = vi.fn();
  const ref = React.createRef<HTMLDivElement>();
  const keyEvents: { current: EventTarget; target: EventTarget; native: KeyboardEvent }[] = [];
  const mouseEnter = vi.fn();
  const mouseLeave = vi.fn();
  const { screen, controller } = await renderController();
  const rootData = { 'data-toast-owned-root': '' };
  await React.act(() =>
    controller.dispatchToast(<NotificationContent />, {
      toastId: 'stable-notification',
      intent: 'warning',
      timeout: -1,
      root: {
        ...rootData,
        id: 'stable-notification-dom',
        ref,
        className: 'caller-notification',
        onKeyDown: (event) =>
          keyEvents.push({
            current: event.currentTarget,
            target: event.target,
            native: event.nativeEvent,
          }),
        onMouseEnter: mouseEnter,
        onMouseLeave: mouseLeave,
      },
      onStatusChange: status,
    }),
  );
  await expect.poll(() => status.mock.calls.map(([, data]) => data.status)).toContain('visible');
  const item = html(ref.current);
  expect(item).toBe(screen.getByRole('listitem', { name: 'Saved notification' }).element());
  expect(item).toHaveAttribute('id', 'stable-notification-dom');
  expect(item).toHaveClass('caller-notification');
  await userEvent.hover(item);
  await userEvent.hover(screen.getByRole('button', { name: 'Before notifications', exact: true }));
  expect(mouseEnter).toHaveBeenCalledTimes(1);
  expect(mouseLeave).toHaveBeenCalledTimes(1);
  item.focus();
  await userEvent.keyboard('a');
  expect(keyEvents).toHaveLength(1);
  expect(keyEvents[0].current).toBe(item);
  expect(keyEvents[0].target).toBe(item);
  expect(keyEvents[0].native.key).toBe('a');
  await React.act(() => {
    controller.dispatchToast(<Toast>Duplicate must not replace content</Toast>, {
      toastId: 'stable-notification',
    });
    controller.updateToast({
      toastId: 'stable-notification',
      content: <NotificationContent title="Updated notification" />,
      intent: 'success',
      root: { ...rootData, id: 'stable-notification-dom', ref, className: 'caller-notification' },
    });
  });
  await expect
    .element(screen.getByRole('listitem', { name: 'Updated notification' }))
    .toBeVisible();
  expect(ref.current).toBe(item);
  expect(item).toHaveAttribute('id', 'stable-notification-dom');
  expect(item.querySelector('.fui-Toast')).toHaveAttribute('data-intent', 'success');
  expect(item).not.toHaveTextContent('Duplicate must not replace content');
  await React.act(() => controller.dismissToast('stable-notification'));
  await expect.poll(() => item.isConnected).toBe(false);
  expect(status.mock.calls.map(([, data]) => data.status)).toEqual([
    'queued',
    'visible',
    'visible',
    'dismissed',
    'unmounted',
  ]);
  expect(
    status.mock.calls.every(
      ([event, data]) =>
        event === null &&
        data.toastId === 'stable-notification' &&
        typeof data.updateId === 'number' &&
        typeof data.close === 'function' &&
        typeof data.remove === 'function',
    ),
  ).toBe(true);
  expect(status.mock.calls.at(-1)?.[1].updateId).toBe(1);
});

test('uses public close context, native Tab navigation, Delete, Escape, and focus restoration', async () => {
  const { screen, controller } = await renderController();
  const trigger = screen.getByRole('button', { name: 'Before notifications', exact: true });
  await userEvent.click(trigger);
  await React.act(() => {
    controller.dispatchToast(<NotificationContent title="First notification" />, {
      toastId: 'first',
      timeout: -1,
      intent: 'info',
    });
    controller.dispatchToast(<NotificationContent title="Second notification" />, {
      toastId: 'second',
      timeout: -1,
      intent: 'success',
    });
  });
  await expect.element(screen.getByRole('listitem', { name: 'Second notification' })).toBeVisible();
  await userEvent.hover(trigger);
  await userEvent.keyboard('{F6}');
  await expect.element(screen.getByRole('listitem', { name: 'Second notification' })).toHaveFocus();
  const first = screen.getByRole('listitem', { name: 'First notification' });
  await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
  await expect.element(first.getByRole('link', { name: 'Open history' })).toHaveFocus();
  await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
  await expect.element(first.getByRole('button', { name: 'Close notification' })).toHaveFocus();
  await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
  await expect.element(screen.getByRole('listitem', { name: 'First notification' })).toHaveFocus();
  await userEvent.keyboard('{Delete}');
  await expect
    .element(screen.getByRole('listitem', { name: 'First notification' }))
    .not.toBeInTheDocument();
  await expect.element(screen.getByRole('listitem', { name: 'Second notification' })).toHaveFocus();
  await userEvent.keyboard('{Tab}');
  await expect
    .element(screen.getByRole('button', { name: 'Close notification', exact: true }))
    .toHaveFocus();
  await userEvent.keyboard('{Enter}');
  await expect
    .element(screen.getByRole('listitem', { name: 'Second notification' }))
    .not.toBeInTheDocument();
  await expect.element(trigger).toHaveFocus();
  await React.act(() => {
    controller.dispatchToast(<NotificationContent title="Escape first" />, {
      toastId: 'escape-first',
      timeout: -1,
      intent: 'info',
    });
    controller.dispatchToast(<NotificationContent title="Escape second" />, {
      toastId: 'escape-second',
      timeout: -1,
      intent: 'info',
    });
  });
  await userEvent.keyboard('{F6}');
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => screen.container.querySelectorAll('[role="listitem"]').length).toBe(0);
  await expect.element(trigger).toHaveFocus();
});

test.each([false, true])(
  'records the current native/polyfill arrow boundary without altering Toast opt-out roots (raw=%s)',
  async (raw) => {
    const { screen, controller } = await renderController({ raw });
    const Root = raw ? PrimitiveToast : Toast;
    const Title = raw ? PrimitiveToastTitle : ToastTitle;
    await React.act(() => {
      controller.dispatchToast(
        <Root>
          <Title>Arrow first</Title>
        </Root>,
        {
          toastId: 'arrow-first',
          timeout: -1,
        },
      );
      controller.dispatchToast(
        <Root>
          <Title>Arrow second</Title>
        </Root>,
        {
          toastId: 'arrow-second',
          timeout: -1,
        },
      );
    });
    await expect.element(screen.getByRole('listitem', { name: 'Arrow second' })).toBeVisible();
    await userEvent.keyboard('{F6}');
    await expect.element(screen.getByRole('listitem', { name: 'Arrow second' })).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    const native = 'focusGroup' in HTMLElement.prototype;
    // The pinned Toast opts its subtree out with focusgroup="none". Current native
    // Chromium does not move between these wrappers; the actual consumer polyfill does.
    await expect
      .element(
        screen.getByRole('listitem', {
          name: native ? 'Arrow second' : 'Arrow first',
        }),
      )
      .toHaveFocus();
    const stack = html(screen.container.querySelector('[data-toast-test-toaster]'));
    expect(stack).toHaveAttribute('focusgroup', 'toolbar block itemcontrols');
    expect(stack.querySelectorAll('[focusgroup="none"]')).toHaveLength(2);
  },
);

test.each([false, true])(
  'preserves current Delete bubbling and the supported consumer editor event boundary (raw=%s)',
  async (raw) => {
    const { screen, controller } = await renderController({ raw });
    const Root = raw ? PrimitiveToast : Toast;
    const Title = raw ? PrimitiveToastTitle : ToastTitle;
    const protectEditor = vi.fn((event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Delete') event.stopPropagation();
    });
    const content = (protectedEditor: boolean) => (
      <Root>
        <Title>Editable notification</Title>
        <input
          aria-label="Notification editor"
          defaultValue="Original text"
          onKeyDown={protectedEditor ? protectEditor : undefined}
        />
      </Root>
    );
    await React.act(() =>
      controller.dispatchToast(content(false), {
        toastId: 'unprotected-editor',
        timeout: -1,
      }),
    );
    await expect
      .element(screen.getByRole('textbox', { name: 'Notification editor' }))
      .toBeVisible();
    await userEvent.click(screen.getByRole('textbox', { name: 'Notification editor' }));
    await userEvent.keyboard('{Delete}');
    await expect.poll(() => screen.container.querySelector('[role="listitem"]')).toBeNull();
    await React.act(() =>
      controller.dispatchToast(content(true), {
        toastId: 'protected-editor',
        timeout: -1,
      }),
    );
    const editor = screen.getByRole('textbox', { name: 'Notification editor' });
    await expect.element(editor).toBeVisible();
    await userEvent.clear(editor);
    await expect.element(editor).toHaveValue('');
    await userEvent.type(editor, 'Native edit');
    await expect.element(editor).toHaveValue('Native edit');
    expect(screen.getByRole('listitem', { name: 'Editable notification' })).toBeVisible();
    expect(
      protectEditor.mock.calls.some(
        ([event]) =>
          event.key === 'Delete' && event.isPropagationStopped() && !event.defaultPrevented,
      ),
    ).toBe(true);
  },
);

test('renders scoped consumer classes on every position without mutating native stack callbacks', async () => {
  const keyDown = vi.fn();
  const { screen, controller } = await renderController({
    options: {
      className: 'consumer-toaster',
      style: { width: '310px', borderRadius: '3px' },
      onKeyDown: keyDown,
    },
  });
  await React.act(() =>
    controller.dispatchToast(<NotificationContent />, {
      timeout: -1,
      root: { role: 'group' },
    }),
  );
  const item = screen.getByRole('group', { name: 'Saved notification' });
  const root = html(screen.container.querySelector('[data-toast-test-toaster]'));
  expect(root).toHaveClass('consumer-toaster');
  expect(getComputedStyle(root).width).toBe('310px');
  expect(item).toHaveAttribute('role', 'group');
  expect(getComputedStyle(html(item.element())).marginTop).toBe('16px');
  expect(getComputedStyle(html(item.element())).pointerEvents).toBe('all');
  html(item.element()).focus();
  await userEvent.keyboard('a');
  expect(keyDown).toHaveBeenCalledTimes(1);
  expect(keyDown.mock.calls[0][0].nativeEvent.key).toBe('a');
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => root.isConnected).toBe(false);
  expect(keyDown).toHaveBeenCalledTimes(2);
});

test('uses the native countdown across imperative pause/resume and timeout updates without a timer DOM slot', async () => {
  const { screen, controller } = await renderController();
  const status = vi.fn();
  await React.act(() =>
    controller.dispatchToast(<NotificationContent title="Timed notification" />, {
      toastId: 'timed',
      timeout: 500,
      onStatusChange: status,
    }),
  );
  await expect.element(screen.getByRole('listitem', { name: 'Timed notification' })).toBeVisible();
  await React.act(() => controller.pauseToast('timed'));
  await new Promise<void>((resolve) => setTimeout(resolve, 650));
  expect(screen.getByRole('listitem', { name: 'Timed notification' })).toBeVisible();
  expect(screen.container.querySelector('.fui-ToastContainer__timer')).toBeNull();
  await React.act(() => controller.playToast('timed'));
  await expect
    .poll(() => screen.container.querySelector('[role="listitem"]'), { timeout: 2000 })
    .toBeNull();
  expect(status.mock.calls.some(([, data]) => data.status === 'unmounted')).toBe(true);
  await React.act(() =>
    controller.dispatchToast(<NotificationContent title="Updated timeout" />, {
      toastId: 'update-timeout',
      timeout: -1,
    }),
  );
  await expect.element(screen.getByRole('listitem', { name: 'Updated timeout' })).toBeVisible();
  await React.act(() => controller.updateToast({ toastId: 'update-timeout', timeout: 180 }));
  await expect
    .poll(() => screen.container.querySelector('[role="listitem"]'), { timeout: 2000 })
    .toBeNull();
});

test('preserves hover, stack-focus, and window-blur timer pauses without resetting elapsed time', async () => {
  const { screen, controller } = await renderController({
    options: { pauseOnHover: true, pauseOnWindowBlur: true },
  });
  const before = screen.getByRole('button', { name: 'Before notifications', exact: true });
  await userEvent.hover(before);
  await React.act(() =>
    controller.dispatchToast(<NotificationContent title="Pause sources" />, {
      toastId: 'pause-sources',
      timeout: 600,
    }),
  );
  const item = screen.getByRole('listitem', { name: 'Pause sources' });
  await expect.element(item).toBeVisible();
  await userEvent.hover(item);
  await new Promise<void>((resolve) => setTimeout(resolve, 700));
  expect(item).toBeVisible();
  html(item.element()).focus();
  await userEvent.hover(before);
  await new Promise<void>((resolve) => setTimeout(resolve, 700));
  expect(item).toBeVisible();
  window.dispatchEvent(new Event('blur'));
  await userEvent.click(before);
  await new Promise<void>((resolve) => setTimeout(resolve, 700));
  expect(item).toBeVisible();
  window.dispatchEvent(new Event('focus'));
  await expect
    .poll(() => screen.container.querySelector('[role="listitem"]'), { timeout: 2000 })
    .toBeNull();
});

test.each([false, true])(
  'records the raw-current limit boundary and supported sequential dispatch (raw=%s)',
  async (raw) => {
    const { screen, controller } = await renderController({ raw, options: { limit: 1 } });
    const queued = vi.fn();
    const Root = raw ? PrimitiveToast : Toast;
    const Title = raw ? PrimitiveToastTitle : ToastTitle;
    await React.act(() => {
      controller.dispatchToast(
        <Root>
          <Title>Visible notification</Title>
        </Root>,
        { toastId: 'visible', timeout: -1 },
      );
      controller.dispatchToast(
        <Root>
          <Title>Queued notification</Title>
        </Root>,
        {
          toastId: 'queued',
          timeout: -1,
          onStatusChange: queued,
        },
      );
    });
    await expect
      .poll(() => queued.mock.calls.map(([, data]) => data.status))
      .toContain('unmounted');
    expect(queued.mock.calls.map(([, data]) => data.status)).toEqual([
      'queued',
      'dismissed',
      'unmounted',
    ]);
    expect(screen.getByRole('listitem', { name: 'Visible notification' })).toBeVisible();
    expect(screen.getByRole('listitem', { name: 'Queued notification' })).not.toBeInTheDocument();
    // Both current public Toasters remove an initially invisible queued container.
    // Consumers can dispatch the next notification after the preceding one unmounts.
    await React.act(() => controller.dismissAllToasts());
    await expect.poll(() => screen.container.querySelectorAll('[role="listitem"]').length).toBe(0);
    await React.act(() =>
      controller.dispatchToast(
        <Root>
          <Title>Sequential notification</Title>
        </Root>,
        {
          toastId: 'queued',
          timeout: -1,
        },
      ),
    );
    await expect
      .element(screen.getByRole('listitem', { name: 'Sequential notification' }))
      .toBeVisible();
  },
);

test.each([false, true])(
  'supports limit matched to bounded dispatch and another dispatch after unmount (raw=%s)',
  async (raw) => {
    const { screen, controller } = await renderController({ raw, options: { limit: 2 } });
    const firstStatus = vi.fn();
    const Root = raw ? PrimitiveToast : Toast;
    const Title = raw ? PrimitiveToastTitle : ToastTitle;
    await React.act(() => {
      controller.dispatchToast(
        <Root>
          <Title>Bounded first</Title>
        </Root>,
        { toastId: 'bounded-first', timeout: -1, onStatusChange: firstStatus },
      );
      controller.dispatchToast(
        <Root>
          <Title>Bounded second</Title>
        </Root>,
        { toastId: 'bounded-second', timeout: -1 },
      );
    });
    await expect.element(screen.getByRole('listitem', { name: 'Bounded first' })).toBeVisible();
    await expect.element(screen.getByRole('listitem', { name: 'Bounded second' })).toBeVisible();
    expect(screen.container.querySelectorAll('[role="listitem"]')).toHaveLength(2);
    await React.act(() => controller.dismissToast('bounded-first'));
    await expect
      .poll(() => firstStatus.mock.calls.map(([, data]) => data.status))
      .toContain('unmounted');
    await expect.poll(() => screen.container.querySelectorAll('[role="listitem"]').length).toBe(1);
    await React.act(() =>
      controller.dispatchToast(
        <Root>
          <Title>Bounded third</Title>
        </Root>,
        { toastId: 'bounded-third', timeout: -1 },
      ),
    );
    await expect.element(screen.getByRole('listitem', { name: 'Bounded third' })).toBeVisible();
    expect(screen.getByRole('listitem', { name: 'Bounded second' })).toBeVisible();
    expect(screen.container.querySelectorAll('[role="listitem"]')).toHaveLength(2);
    expect(firstStatus.mock.calls.map(([, data]) => data.status)).toEqual([
      'queued',
      'visible',
      'dismissed',
      'unmounted',
    ]);
  },
);

test.each([false, true])(
  'preserves explicit politeness and updated text through the supported announce callback (raw=%s)',
  async (raw) => {
    const announce = vi.fn();
    const { screen, controller } = await renderController({ raw, options: { announce } });
    const Root = raw ? PrimitiveToast : Toast;
    const Title = raw ? PrimitiveToastTitle : ToastTitle;
    for (const intent of ['info', 'success', 'warning', 'error'] as const) {
      await React.act(() =>
        controller.dispatchToast(
          <Root>
            <Title>Announcement {intent}</Title>
          </Root>,
          {
            toastId: intent,
            timeout: -1,
            intent,
          },
        ),
      );
    }
    await expect.poll(() => announce.mock.calls.length).toBe(4);
    expect(announce.mock.calls).toEqual([
      ['Announcement info', { politeness: 'polite' }],
      ['Announcement success', { politeness: 'assertive' }],
      ['Announcement warning', { politeness: 'assertive' }],
      ['Announcement error', { politeness: 'assertive' }],
    ]);
    await React.act(() =>
      controller.updateToast({
        toastId: 'error',
        content: (
          <Root>
            <Title>Updated announcement</Title>
          </Root>
        ),
        politeness: 'polite',
      }),
    );
    await expect.poll(() => announce.mock.calls.length).toBe(5);
    expect(announce).toHaveBeenLastCalledWith('Updated announcement', { politeness: 'polite' });
    const updated = html(screen.getByRole('listitem', { name: 'Updated announcement' }).element());
    updated.focus();
    await React.act(() =>
      controller.updateToast({
        toastId: 'error',
        content: (
          <Root>
            <Title>Focused update</Title>
          </Root>
        ),
      }),
    );
    await expect.element(screen.getByRole('listitem', { name: 'Focused update' })).toBeVisible();
    expect(announce).toHaveBeenCalledTimes(5);
    html(
      screen.getByRole('button', { name: 'Before notifications', exact: true }).element(),
    ).focus();
    await React.act(() =>
      controller.updateToast({
        toastId: 'error',
        content: (
          <Root>
            <Title>Unfocused update</Title>
          </Root>
        ),
        politeness: 'assertive',
      }),
    );
    await expect.poll(() => announce.mock.calls.length).toBe(6);
    expect(announce).toHaveBeenLastCalledWith('Unfocused update', { politeness: 'assertive' });
  },
);

test.each([false, true])(
  'documents the current native ariaNotify priority mapping without adding an announcer (raw=%s)',
  async (raw) => {
    const original = Object.getOwnPropertyDescriptor(document, 'ariaNotify');
    const notify = vi.fn();
    Object.defineProperty(document, 'ariaNotify', { configurable: true, value: notify });
    try {
      const { controller } = await renderController({ raw });
      const Root = raw ? PrimitiveToast : Toast;
      const Title = raw ? PrimitiveToastTitle : ToastTitle;
      await React.act(() => {
        controller.dispatchToast(
          <Root>
            <Title>Polite native notification</Title>
          </Root>,
          { toastId: 'polite', timeout: -1, politeness: 'polite' },
        );
        controller.dispatchToast(
          <Root>
            <Title>Assertive native notification</Title>
          </Root>,
          { toastId: 'assertive', timeout: -1, politeness: 'assertive' },
        );
      });
      await expect.poll(() => notify.mock.calls.length).toBe(2);
      expect(notify.mock.calls).toEqual([
        ['Polite native notification', { priority: 'normal' }],
        ['Assertive native notification', { priority: 'normal' }],
      ]);
    } finally {
      if (original) Object.defineProperty(document, 'ariaNotify', original);
      else Reflect.deleteProperty(document, 'ariaNotify');
    }
  },
);

test.each([false, true])(
  'uses one application announcer for custom high/normal priority and suppression (raw=%s)',
  async (raw) => {
    const original = Object.getOwnPropertyDescriptor(document, 'ariaNotify');
    const notify = vi.fn();
    Object.defineProperty(document, 'ariaNotify', { configurable: true, value: notify });
    try {
      const ref = React.createRef<Controller>();
      const screen = await render(
        <CoreAIFluentProvider>
          <AriaLiveAnnouncer>
            <ApplicationAnnouncementHarness controllerRef={ref} raw={raw} />
          </AriaLiveAnnouncer>
        </CoreAIFluentProvider>,
      );
      const controller = ref.current;
      if (!controller) throw new Error('The application announcement controller did not mount');
      const Root = raw ? PrimitiveToast : Toast;
      const Title = raw ? PrimitiveToastTitle : ToastTitle;
      await React.act(() => {
        controller.dispatchToast(
          <Root>
            <Title>Application info</Title>
          </Root>,
          { toastId: 'application-info', timeout: -1, intent: 'info' },
        );
        controller.dispatchToast(
          <Root>
            <Title>Application error</Title>
          </Root>,
          { toastId: 'application-error', timeout: -1, intent: 'error' },
        );
      });
      await expect
        .poll(() => notify.mock.calls)
        .toEqual([
          ['Application info', { priority: 'normal' }],
          ['Application error', { priority: 'high' }],
        ]);
      await userEvent.click(
        screen.getByRole('button', { name: 'Suppress announcements', exact: true }),
      );
      await expect
        .element(screen.getByRole('status', { name: 'Application announcement suppression' }))
        .toHaveTextContent('true');
      await React.act(() => {
        controller.dispatchToast(
          <Root>
            <Title>Suppressed warning</Title>
          </Root>,
          { toastId: 'application-suppressed', timeout: -1, intent: 'warning' },
        );
        controller.updateToast({
          toastId: 'application-error',
          content: (
            <Root>
              <Title>Suppressed update</Title>
            </Root>
          ),
        });
      });
      await expect
        .element(screen.getByRole('listitem', { name: 'Suppressed warning' }))
        .toBeVisible();
      await expect
        .element(screen.getByRole('listitem', { name: 'Suppressed update' }))
        .toBeVisible();
      expect(notify).toHaveBeenCalledTimes(2);
      await userEvent.click(
        screen.getByRole('button', { name: 'Resume announcements', exact: true }),
      );
      await React.act(() =>
        controller.dispatchToast(
          <Root>
            <Title>Application restored</Title>
          </Root>,
          { toastId: 'application-restored', timeout: -1, intent: 'warning' },
        ),
      );
      await expect.poll(() => notify.mock.calls.length).toBe(3);
      expect(notify).toHaveBeenLastCalledWith('Application restored', { priority: 'high' });
    } finally {
      if (original) Object.defineProperty(document, 'ariaNotify', original);
      else Reflect.deleteProperty(document, 'ariaNotify');
    }
  },
);

test('isolates controller ids and keeps focusable containers native without a production polyfill dependency', async () => {
  const firstRef = React.createRef<Controller>();
  const secondRef = React.createRef<Controller>();
  const screen = await render(
    <CoreAIFluentProvider>
      <ControllerHarness controllerRef={firstRef} />
      <ControllerHarness controllerRef={secondRef} />
    </CoreAIFluentProvider>,
  );
  const first = firstRef.current;
  const second = secondRef.current;
  if (!first || !second) throw new Error('The isolated controllers did not mount');
  await React.act(() => {
    first.dispatchToast(<NotificationContent title="First toaster" />, {
      toastId: 'same-id',
      timeout: -1,
    });
    second.dispatchToast(<NotificationContent title="Second toaster" />, {
      toastId: 'same-id',
      timeout: -1,
    });
  });
  await expect.element(screen.getByRole('listitem', { name: 'First toaster' })).toBeVisible();
  await expect.element(screen.getByRole('listitem', { name: 'Second toaster' })).toBeVisible();
  await React.act(() => first.dismissAllToasts());
  await expect
    .element(screen.getByRole('listitem', { name: 'First toaster' }))
    .not.toBeInTheDocument();
  expect(screen.getByRole('listitem', { name: 'Second toaster' })).toBeVisible();
  expect(screen.container.querySelector('[data-tabster]')).toBeNull();
});

test('shares the controller fixture with real dispatch/update/dismiss state and stable DOM identity', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <ToastControllerFlow />
    </CoreAIFluentProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Dispatch persistent', exact: true }));
  const result = screen.getByRole('status', { name: 'Toast controller result' });
  await expect.element(result).toHaveAttribute('data-visible-count', '1');
  const item = html(screen.container.querySelector('[data-toast-controller-root]'));
  const id = item.id;
  await userEvent.click(screen.getByRole('button', { name: 'Update active', exact: true }));
  await expect
    .element(screen.getByRole('listitem', { name: 'Project notification 1 updated' }))
    .toBeVisible();
  expect(screen.container.querySelector('[data-toast-controller-root]')).toBe(item);
  expect(item.id).toBe(id);
  await userEvent.click(screen.getByRole('button', { name: 'Dismiss active', exact: true }));
  await expect.element(result).toHaveAttribute('data-visible-count', '0');
  expect(result).toHaveTextContent('"eventIsNull":true');
  expect(item.isConnected).toBe(false);
});

test('submits native FormData through a footer submitter, preserves link navigation, and restores focus', async () => {
  const previous = window.location.href;
  const screen = await render(
    <CoreAIFluentProvider>
      <ToastNativeFormFlow />
    </CoreAIFluentProvider>,
  );
  try {
    const trigger = screen.getByRole('button', { name: 'Open rename notification', exact: true });
    await userEvent.click(trigger);
    await expect.element(screen.getByRole('listitem', { name: 'Rename project' })).toBeVisible();
    await userEvent.keyboard('{F6}');
    await expect.element(screen.getByRole('listitem', { name: 'Rename project' })).toHaveFocus();
    await userEvent.click(screen.getByRole('link', { name: 'Project history', exact: true }));
    expect(window.location.hash).toBe('#toast-project-history');
    const input = screen.getByRole('textbox', { name: 'Project name', exact: true });
    await userEvent.clear(input);
    await userEvent.type(input, 'Native project');
    await userEvent.click(screen.getByRole('button', { name: 'Save name', exact: true }));
    await expect
      .element(screen.getByRole('status', { name: 'Toast form result' }))
      .toHaveTextContent('Native project:save');
    await expect
      .element(screen.getByRole('status', { name: 'Toast form result' }))
      .toHaveAttribute('data-status', 'unmounted');
    await expect
      .element(screen.getByRole('listitem', { name: 'Rename project' }))
      .not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  } finally {
    window.history.replaceState(null, '', previous);
  }
});
