// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import {
  Tooltip as PrimitiveTooltip,
  type TooltipSlots,
} from '@fluentui/react-headless-components-preview/tooltip';
import {
  useMergedRefs,
  type ExtractSlotProps,
  type ForwardRefComponent,
  type SlotRenderFunction,
} from '@fluentui/react-utilities';
import type { PositioningImperativeRef } from '@fluentui/react-headless-components-preview/positioning';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { ComparisonProvider as CoreAIFluentProvider } from '../../../apps/storybook/src/stories/experiments/ComparisonProvider.js';
import {
  TooltipComparison,
  TooltipHelpFlow,
  tooltipConsumerExample,
  tooltipExamples,
  type TooltipExample,
} from '../../../apps/storybook/src/stories/experiments/TooltipComparison.js';
import {
  captureTooltipNativeContract,
  captureTooltipStyles,
  compareTooltipStyles,
  getComparisonTooltip,
  getComparisonTooltipTrigger,
  getTooltipArrow,
  refreshTooltipComparisonPositioning,
  settleTooltipStyles,
} from '../../../apps/storybook/src/stories/experiments/compareTooltipStyles.js';
import fixtureStyles from '../../../apps/storybook/src/stories/experiments/TooltipComparison.module.css';
import {
  Tooltip,
  tooltipClassNames,
  type TooltipProps,
  type TooltipTriggerProps,
} from './Tooltip.js';
import { AvatarGroup } from './AvatarGroup.js';
import { AvatarGroupItem } from './AvatarGroupItem.js';
import { AvatarGroupPopover, avatarGroupPopoverClassNames } from './AvatarGroupPopover.js';
import { Button } from './Button.js';
import { Popover } from './Popover.js';
import { PopoverSurface } from './PopoverSurface.js';
import { PopoverTrigger } from './PopoverTrigger.js';
import tooltipStyles from './Tooltip.module.css';

afterEach(cleanup);

async function renderPair(
  example: TooltipExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const legacyPositioning = React.createRef<PositioningImperativeRef>();
  const headlessPositioning = React.createRef<PositioningImperativeRef>();
  const screen = await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <span data-testid="tooltip-pointer-rest">Rest pointer here</span>
      <TooltipComparison
        example={example}
        legacyPositioningRef={legacyPositioning}
        headlessPositioningRef={headlessPositioning}
      />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByTestId('tooltip-pointer-rest'));
  const legacy = getComparisonTooltip(screen.container, 'legacy');
  const headless = getComparisonTooltip(screen.container, 'headless');
  const legacyTrigger = getComparisonTooltipTrigger(screen.container, 'legacy');
  const headlessTrigger = getComparisonTooltipTrigger(screen.container, 'headless');
  await Promise.all([settleTooltipStyles(legacy), settleTooltipStyles(headless)]);
  if (!legacyPositioning.current || !headlessPositioning.current)
    throw new Error('Missing Tooltip positioning handles');
  await refreshTooltipComparisonPositioning(
    legacy,
    legacyTrigger,
    headless,
    headlessTrigger,
    legacyPositioning.current,
    headlessPositioning.current,
  );
  return { legacy, headless, legacyTrigger, headlessTrigger, screen };
}

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(tooltipExamples)(
    `matches $name selected content, arrow and placement styles in ${mode}`,
    async (example) => {
      const { legacy, headless, legacyTrigger, headlessTrigger } = await renderPair(example, theme);
      const values = captureTooltipStyles(headless, headlessTrigger);
      const differences = compareTooltipStyles(
        captureTooltipStyles(legacy, legacyTrigger),
        values,
        example,
      );
      expect(differences.filter((difference) => difference.kind === 'unexpected')).toEqual([]);
      expect(Object.keys(values).length).toBeGreaterThan(30);
      expect(headless).toHaveClass(tooltipClassNames.content);
      expect(headless).toHaveAttribute('popover', 'hint');
      expect(headless.matches(':popover-open')).toBe(true);
      expect(headless.getBoundingClientRect().width).toBeGreaterThan(0);
      expect(headlessTrigger).toHaveAttribute('aria-describedby', headless.id);
      expect(getComputedStyle(headless).getPropertyValue('position-anchor')).not.toBe('auto');
      expect(headless).not.toHaveAttribute('appearance');
      if (example.props?.withArrow) {
        expect(getTooltipArrow(headless)).not.toBeNull();
        expect(
          Number(captureTooltipNativeContract(headless, headlessTrigger)['arrow.cross-offset']),
        ).toBeCloseTo(0, 4);
      }
    },
  );
}

test.each([true, false])(
  'keeps normal/inverted defaults, RTL typography and real CoreAI borders with defaults=%s',
  async (enabled) => {
    const example = tooltipExamples.find((candidate) => candidate.name === 'Inverted content');
    if (!example) throw new Error('Missing inverted Tooltip fixture');
    const { legacy, headless, legacyTrigger, headlessTrigger } = await renderPair(
      example,
      coreaiLightTheme,
      enabled,
      'rtl',
    );
    expect(
      compareTooltipStyles(
        captureTooltipStyles(legacy, legacyTrigger),
        captureTooltipStyles(headless, headlessTrigger),
        example,
      ).filter((difference) => difference.kind === 'unexpected'),
    ).toEqual([]);
    expect(getComputedStyle(headless).direction).toBe('rtl');
    expect(headless.hasAttribute('data-coreai-defaults')).toBe(enabled);
    expect(getComputedStyle(headless).borderTopColor === 'rgba(0, 0, 0, 0)').toBe(!enabled);
  },
);

test('ordinary consumer CSS outranks the Fluent/CoreAI layers for content and its real arrow', async () => {
  const { legacy, headless, legacyTrigger, headlessTrigger } =
    await renderPair(tooltipConsumerExample);
  const values = captureTooltipStyles(headless, headlessTrigger);
  const differences = compareTooltipStyles(
    captureTooltipStyles(legacy, legacyTrigger),
    values,
    tooltipConsumerExample,
  );
  expect(differences.filter((difference) => difference.kind === 'unexpected')).toEqual([]);
  expect(differences.some((difference) => difference.kind === 'consumer-cascade')).toBe(true);
  expect(values['content.padding-top']).toBe('9px');
  expect(values['content.border-top-width']).toBe('3px');
  expect(values['content.border-radius']).toBe('3px');
  expect(values['content.rect.width']).toBe('192');
  expect(values['arrow::before.border-top-style']).toBe('dashed');
});

test('keeps report allowances limited to exact native gaps and rotated-arrow capture noise', () => {
  const example = tooltipExamples[0];
  expect(compareTooltipStyles({ 'anchor.gap': '4' }, { 'anchor.gap': '0' }, example)[0].kind).toBe(
    'native-gap',
  );
  expect(compareTooltipStyles({ 'anchor.gap': '5' }, { 'anchor.gap': '0' }, example)[0].kind).toBe(
    'unexpected',
  );
  expect(
    compareTooltipStyles({ 'arrow.rect.width': '12' }, { 'arrow.rect.width': '12.5' }, example),
  ).toEqual([]);
  expect(
    compareTooltipStyles({ 'arrow.rect.width': '12' }, { 'arrow.rect.width': '12.501' }, example)[0]
      .kind,
  ).toBe('unexpected');
  expect(
    compareTooltipStyles(
      { 'content.rect.width': '200' },
      { 'content.rect.width': '200.01' },
      example,
    )[0].kind,
  ).toBe('unexpected');
});

test('restores only the supported visual appearance, without a root ref or removed overlay API', () => {
  expectTypeOf<React.ComponentProps<typeof Tooltip>>().toEqualTypeOf<TooltipProps>();
  expectTypeOf<NonNullable<TooltipProps['appearance']>>().toEqualTypeOf<'normal' | 'inverted'>();
  expectTypeOf<TooltipProps>().not.toHaveProperty('ref');
  expectTypeOf<TooltipProps>().not.toHaveProperty('mountNode');
  expectTypeOf<TooltipProps>().not.toHaveProperty('defaultVisible');
  expectTypeOf<TooltipProps>().not.toHaveProperty('inline');
  expectTypeOf<TooltipProps>().not.toHaveProperty('disabled');
});

test.each([
  ['raw current', PrimitiveTooltip],
  ['ported', Tooltip],
] as const)(
  'retains the %s observer start-label boundary for centered surfaces within 2px of both edges',
  async (_, Hint) => {
    type ContentProps = ExtractSlotProps<TooltipSlots['content']>;
    const ref = React.createRef<HTMLDivElement>();
    const positioning = React.createRef<PositioningImperativeRef>();
    const content: ContentProps & {
      'data-tooltip-content': string;
      'data-appearance': string;
    } = {
      ref,
      className: `${tooltipStyles.Tooltip__content} ${fixtureStyles.nearEqualContent}`,
      children: 'Edit access',
      'data-tooltip-content': '',
      'data-appearance': 'normal',
    };
    const screen = await render(
      <CoreAIFluentProvider withComponentDefaults={false}>
        <div className={fixtureStyles.stage}>
          <Hint
            content={content}
            relationship="description"
            visible
            withArrow
            positioning={{
              position: 'before',
              offset: 8,
              pinned: true,
              positioningRef: positioning,
            }}
          >
            <button type="button" style={{ width: 140, height: 32, padding: 0, border: 0 }}>
              Near-equal target edges
            </button>
          </Hint>
        </div>
      </CoreAIFluentProvider>,
    );
    await expect.poll(() => ref.current?.matches(':popover-open')).toBe(true);
    const surface = ref.current;
    if (!surface || !positioning.current) throw new Error('Missing native placement probe');
    await settleTooltipStyles(surface);
    positioning.current.updatePosition();
    await expect.poll(() => surface.getAttribute('data-placement')).toBe('before-top');
    const arrow = getTooltipArrow(surface);
    if (!arrow) throw new Error('Missing native placement arrow');
    const trigger = screen.getByRole('button', { name: 'Near-equal target edges' }).element();
    const relativeTop = surface.getBoundingClientRect().top - trigger.getBoundingClientRect().top;
    expect(relativeTop).toBeGreaterThan(0);
    expect(relativeTop).toBeLessThanOrEqual(2);
    expect(getComputedStyle(arrow).top).toBe('8px');
    expect(getComputedStyle(arrow).translate).toBe('none');
    const crossOffset = Number(
      captureTooltipNativeContract(surface, trigger)['arrow.cross-offset'],
    );
    expect(crossOffset).toBeLessThan(0);
    expect(crossOffset).toBeGreaterThan(-2);
  },
);

test.each([
  ['string label', 'label', 'Edit Atlas', 'aria-label', false],
  ['rich label', 'label', <strong key="name">Edit Atlas</strong>, 'aria-labelledby', true],
  ['description', 'description', 'Editors can invite reviewers.', 'aria-describedby', true],
  ['inaccessible', 'inaccessible', 'Already available nearby.', null, false],
] as const)(
  'preserves current %s association and closed mounting without a visibility shim',
  async (_, relationship, children, association, mounted) => {
    const contentRef = React.createRef<HTMLDivElement>();
    const screen = await render(
      <CoreAIFluentProvider>
        <Tooltip relationship={relationship} content={{ ref: contentRef, children }}>
          <button type="button">Visible trigger text</button>
        </Tooltip>
      </CoreAIFluentProvider>,
    );
    const trigger = screen.getByRole('button');
    if (association === 'aria-label') {
      expect(trigger.element()).toHaveAttribute(association, 'Edit Atlas');
    } else if (association) {
      expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
      expect(trigger.element()).toHaveAttribute(association, contentRef.current?.id);
    } else {
      expect(trigger.element()).not.toHaveAttribute('aria-label');
      expect(trigger.element()).not.toHaveAttribute('aria-labelledby');
      expect(trigger.element()).not.toHaveAttribute('aria-describedby');
    }
    expect(Boolean(contentRef.current)).toBe(mounted);
    if (contentRef.current) {
      expect(contentRef.current.matches(':popover-open')).toBe(false);
      expect(getComputedStyle(contentRef.current).display).toBe('none');
    }
  },
);

const CustomTrigger: ForwardRefComponent<React.ComponentPropsWithRef<'button'>> = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<'button'>
>(function CustomTrigger(props, ref) {
  return <button {...props} ref={ref} />;
});

test('preserves ordinary trigger identity, content renderers, refs, caller classes and event targets', async () => {
  type ContentProps = ExtractSlotProps<TooltipSlots['content']>;
  const triggerRef = React.createRef<HTMLButtonElement>();
  const contentRef = React.createRef<HTMLDivElement>();
  const renderer = vi.fn();
  const triggerTargets: EventTarget[] = [];
  const pointer = vi.fn<React.PointerEventHandler<HTMLButtonElement>>((event) =>
    triggerTargets.push(event.currentTarget),
  );
  const targets: EventTarget[] = [];
  const renderContent: SlotRenderFunction<ContentProps> = (Component, props) => {
    renderer(Component, props);
    return (
      <Component {...props} data-caller-tooltip="">
        {props.children}
        <strong>Custom guidance</strong>
      </Component>
    );
  };
  const content = {
    id: 'caller-tooltip',
    ref: contentRef,
    className: 'caller-content',
    children: renderContent,
    onPointerEnter: (event: React.PointerEvent<HTMLDivElement>) =>
      targets.push(event.currentTarget),
  };
  const screen = await render(
    <CoreAIFluentProvider>
      <Tooltip
        relationship="description"
        content={content}
        showDelay={0}
        withArrow
        appearance="inverted"
      >
        <CustomTrigger
          ref={triggerRef}
          type="button"
          className="caller-trigger"
          aria-describedby="caller-description"
          onPointerEnter={pointer}
        >
          Custom access trigger
        </CustomTrigger>
      </Tooltip>
      <span id="caller-description">Caller association wins.</span>
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Custom access trigger', exact: true });
  expect(triggerRef.current).toBe(trigger.element());
  expect(trigger.element()).toHaveClass('caller-trigger');
  expect(trigger.element()).toHaveAttribute('aria-describedby', 'caller-description');
  const identity = trigger.element();
  await userEvent.hover(trigger);
  await expect.poll(() => contentRef.current?.matches(':popover-open')).toBe(true);
  expect(trigger.element()).toBe(identity);
  expect(contentRef.current).toHaveClass(tooltipClassNames.content, 'caller-content');
  expect(contentRef.current).toHaveAttribute('id', 'caller-tooltip');
  expect(contentRef.current).toHaveAttribute('data-caller-tooltip', '');
  expect(contentRef.current).toHaveAttribute('data-appearance', 'inverted');
  expect(content.children).toBe(renderContent);
  expect(content.className).toBe('caller-content');
  expect(renderer.mock.calls[0][0]).toBe('div');
  expect(pointer).toHaveBeenCalledTimes(1);
  expect(triggerTargets).toEqual([identity]);
  const surface = contentRef.current;
  if (!surface) throw new Error('Missing custom Tooltip content');
  expect(getTooltipArrow(surface)).not.toBeNull();
  await userEvent.hover(surface);
  expect(targets).toEqual([surface]);
  expect(triggerRef.current).toBe(identity);
});

function RenderedTrigger({
  triggerProps,
  elementRef,
}: {
  triggerProps: TooltipTriggerProps;
  elementRef: React.Ref<HTMLButtonElement>;
}) {
  const ref = useMergedRefs<unknown>(triggerProps.ref, elementRef);
  return (
    <CustomTrigger {...triggerProps} ref={ref} type="button">
      Rendered trigger
    </CustomTrigger>
  );
}

test.each([
  ['raw current', PrimitiveTooltip],
  ['ported', Tooltip],
] as const)(
  'supports the %s public trigger render callback and preserves its ref',
  async (_, Hint) => {
    const triggerRef = React.createRef<HTMLButtonElement>();
    const callback = vi.fn();
    const screen = await render(
      <CoreAIFluentProvider>
        <Hint content="Rendered access" relationship="label" showDelay={0}>
          {(props) => {
            callback(props);
            return <RenderedTrigger triggerProps={props} elementRef={triggerRef} />;
          }}
        </Hint>
      </CoreAIFluentProvider>,
    );
    const trigger = screen.getByRole('button', { name: 'Rendered access', exact: true });
    expect(triggerRef.current).toBe(trigger.element());
    expect(callback.mock.calls[0][0]['aria-label']).toBe('Rendered access');
    expect(callback.mock.calls[0][0].onPointerUp).toBeTypeOf('function');
    await userEvent.hover(trigger);
    await expect.element(screen.getByRole('tooltip')).toBeVisible();
  },
);

test('shared family styles retain Tooltip sizing and do not add the historical first-div beak', async () => {
  type ContentProps = ExtractSlotProps<TooltipSlots['content']>;
  const ref = React.createRef<HTMLDivElement>();
  const content: ContentProps & { 'data-size': string } = {
    ref,
    'data-size': 'large',
    children: <div data-testid="ordinary-tooltip-content">Ordinary rich content.</div>,
  };
  const screen = await render(
    <CoreAIFluentProvider>
      <Popover size="large">
        <PopoverTrigger>
          <button type="button">Unopened large Popover</button>
        </PopoverTrigger>
        <PopoverSurface>Large family foundation</PopoverSurface>
      </Popover>
      <Tooltip content={content} relationship="description" visible>
        <button type="button">Rich content trigger</button>
      </Tooltip>
    </CoreAIFluentProvider>,
  );
  await expect.poll(() => ref.current?.matches(':popover-open')).toBe(true);
  const surface = ref.current;
  if (!surface) throw new Error('Missing rich Tooltip');
  const computed = getComputedStyle(surface);
  expect([computed.paddingTop, computed.paddingRight, computed.paddingBottom]).toEqual([
    '4px',
    '11px',
    '6px',
  ]);
  expect(computed.getPropertyValue('--fui-positioning-arrow-height')).toBe('8.484px');
  expect(
    getComputedStyle(screen.getByTestId('ordinary-tooltip-content').element(), '::before').content,
  ).toBe('none');
  expect(getTooltipArrow(surface)).toBeNull();
});

test('keeps configured show/hide delays and the trigger-to-content hover handoff', async () => {
  const contentRef = React.createRef<HTMLDivElement>();
  const transitions: { visible: boolean; elapsed: number; type?: string }[] = [];
  let entered = 0;
  let left = 0;
  const screen = await render(
    <CoreAIFluentProvider>
      <span data-testid="delay-pointer-rest">Rest pointer here</span>
      <Tooltip
        content={{
          children: 'Delayed access guidance',
          ref: contentRef,
          onPointerLeave: () => {
            left = performance.now();
          },
        }}
        relationship="description"
        showDelay={100}
        hideDelay={180}
        positioning={{ position: 'below', offset: 12 }}
        onVisibleChange={(event, data) =>
          transitions.push({
            visible: data.visible,
            elapsed: performance.now() - (data.visible ? entered : left),
            type: event?.type,
          })
        }
      >
        <button
          type="button"
          onPointerEnter={() => {
            entered = performance.now();
          }}
          onPointerLeave={() => {
            left = performance.now();
          }}
        >
          Delayed trigger
        </button>
      </Tooltip>
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByTestId('delay-pointer-rest'));
  await userEvent.hover(screen.getByRole('button', { name: 'Delayed trigger' }));
  await expect.poll(() => contentRef.current?.matches(':popover-open')).toBe(true);
  expect(transitions[0]).toMatchObject({ visible: true, type: 'pointerenter' });
  expect(transitions[0].elapsed).toBeGreaterThanOrEqual(90);
  const content = contentRef.current;
  if (!content) throw new Error('Missing delayed Tooltip');
  await userEvent.hover(content);
  await new Promise((resolve) => window.setTimeout(resolve, 210));
  expect(content.matches(':popover-open')).toBe(true);
  expect(transitions).toHaveLength(1);
  await userEvent.hover(screen.getByTestId('delay-pointer-rest'));
  await expect.poll(() => content.matches(':popover-open')).toBe(false);
  expect(transitions[1]).toMatchObject({ visible: false, type: 'pointerleave' });
  expect(transitions[1].elapsed).toBeGreaterThanOrEqual(150);
});

test('native keyboard focus opens, Escape dismisses without moving focus, and blur closes', async () => {
  const ref = React.createRef<HTMLDivElement>();
  const changes = vi.fn<NonNullable<TooltipProps['onVisibleChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <button type="button">Before guidance</button>
      <Tooltip
        content={{ children: 'Keyboard guidance', ref }}
        relationship="description"
        showDelay={0}
        onVisibleChange={changes}
      >
        <button type="button">Keyboard trigger</button>
      </Tooltip>
      <button type="button">After guidance</button>
    </CoreAIFluentProvider>,
  );
  const before = screen.getByRole('button', { name: 'Before guidance' });
  const trigger = screen.getByRole('button', { name: 'Keyboard trigger' });
  await userEvent.click(before);
  await userEvent.keyboard('{Tab}');
  expect(trigger.element().matches(':hover')).toBe(false);
  expect(trigger.element().matches(':focus-visible')).toBe(true);
  await expect.poll(() => ref.current?.matches(':popover-open')).toBe(true);
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => ref.current?.matches(':popover-open')).toBe(false);
  await expect.element(trigger).toHaveFocus();
  expect(changes.mock.calls[0][0]?.type).toBe('focus');
  await expect.poll(() => changes.mock.calls.at(-1)).toEqual([undefined, { visible: false }]);
  await userEvent.keyboard('{Tab}{Shift>}{Tab}{/Shift}');
  await expect.poll(() => ref.current?.matches(':popover-open')).toBe(true);
  await userEvent.keyboard('{Tab}');
  await expect.poll(() => ref.current?.matches(':popover-open')).toBe(false);
  await expect.element(screen.getByRole('button', { name: 'After guidance' })).toHaveFocus();
});

test.each([
  ['raw current', PrimitiveTooltip],
  ['ported', Tooltip],
] as const)(
  'retains the %s controlled/native dismissal boundary until the owner changes visible',
  async (_, Hint) => {
    const ref = React.createRef<HTMLDivElement>();
    const changes = vi.fn<NonNullable<TooltipProps['onVisibleChange']>>();
    const fixture = (visible: boolean) => (
      <CoreAIFluentProvider>
        <Hint
          content={{ children: 'Controlled guidance', ref }}
          relationship="description"
          visible={visible}
          onVisibleChange={changes}
        >
          <button type="button">Controlled trigger</button>
        </Hint>
        <button type="button">Outside controlled tooltip</button>
      </CoreAIFluentProvider>
    );
    const screen = await render(fixture(true));
    await expect.poll(() => ref.current?.matches(':popover-open')).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'Outside controlled tooltip' }));
    await expect.poll(() => ref.current?.matches(':popover-open')).toBe(false);
    await expect.poll(() => changes.mock.calls.length).toBe(1);
    expect(changes.mock.calls[0]).toEqual([undefined, { visible: false }]);
    if (Hint === Tooltip) expect(ref.current).toHaveAttribute('data-open', '');
    await screen.rerender(fixture(true));
    expect(ref.current?.matches(':popover-open')).toBe(false);
    await screen.rerender(fixture(false));
    await screen.rerender(fixture(true));
    await expect.poll(() => ref.current?.matches(':popover-open')).toBe(true);
  },
);

test('the controlled example rejects requests when disabled and records native dismissal callbacks', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <TooltipHelpFlow />
    </CoreAIFluentProvider>,
  );
  await screen.getByRole('button', { name: 'Show access hint', exact: true }).click();
  await expect
    .element(screen.getByRole('tooltip', { name: 'Project access guidance' }))
    .toBeVisible();
  await screen.getByRole('button', { name: 'Outside access hints', exact: true }).click();
  await expect
    .element(screen.getByRole('status', { name: 'Tooltip visibility events' }))
    .toHaveTextContent('native-toggle:false');
  await screen.getByRole('checkbox', { name: 'Allow access hints' }).click();
  await userEvent.hover(screen.getByRole('button', { name: 'Access policy', exact: true }));
  await expect
    .element(screen.getByRole('status', { name: 'Tooltip visibility events' }))
    .toHaveTextContent('pointerenter:true');
  expect(screen.getByRole('tooltip', { name: 'Project access guidance' }).query()).toBeNull();
});

test('keeps disabled native targets unfocusable and permits the supported disabledFocusable Button pattern', async () => {
  const activate = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <button type="button">Before disabled actions</button>
      <Tooltip content="Unavailable natively" relationship="description" showDelay={0}>
        <button type="button" disabled onClick={activate}>
          Native disabled action
        </button>
      </Tooltip>
      <Tooltip content="Ask an owner for access." relationship="description" showDelay={0}>
        <Button as="button" type="button" disabledFocusable onClick={activate}>
          Request access
        </Button>
      </Tooltip>
    </CoreAIFluentProvider>,
  );
  await screen.getByRole('button', { name: 'Before disabled actions' }).click();
  await userEvent.keyboard('{Tab}');
  const native = screen.getByRole('button', { name: 'Native disabled action' });
  const focusable = screen.getByRole('button', { name: 'Request access' });
  expect(native.element()).toHaveAttribute('disabled');
  expect(native.element()).not.toHaveAttribute('tabindex');
  await expect.element(focusable).toHaveFocus();
  await expect.element(screen.getByRole('tooltip')).toHaveTextContent('Ask an owner for access.');
  await userEvent.keyboard('{Enter}');
  expect(activate).not.toHaveBeenCalled();
});

test('preserves public trigger metadata when Tooltip is nested in a current PopoverTrigger', async () => {
  const triggerRef = React.createRef<HTMLButtonElement>();
  const screen = await render(
    <CoreAIFluentProvider>
      <Popover>
        <PopoverTrigger>
          <Tooltip content="Open project access" relationship="label" showDelay={0}>
            <button type="button" ref={triggerRef}>
              Open access
            </button>
          </Tooltip>
        </PopoverTrigger>
        <PopoverSurface aria-label="Project access details">Review access settings.</PopoverSurface>
      </Popover>
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Open project access', exact: true });
  const identity = trigger.element();
  await userEvent.hover(trigger);
  await expect.element(screen.getByRole('tooltip')).toBeVisible();
  await trigger.click();
  await expect.element(screen.getByRole('group', { name: 'Project access details' })).toBeVisible();
  expect(triggerRef.current).toBe(identity);
  expect(trigger.element()).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('tooltip').query()).toBeNull();
});

test.each([true, false])(
  'AvatarGroupPopover reuses the same content/arrow visuals and preserves renderer/ref metadata with defaults=%s',
  async (enabled) => {
    type ContentProps = ExtractSlotProps<TooltipSlots['content']>;
    const contentRef = React.createRef<HTMLDivElement>();
    const triggerRef = React.createRef<HTMLButtonElement>();
    const renderer = vi.fn();
    const renderContent: SlotRenderFunction<ContentProps> = (Component, props) => {
      renderer(Component);
      return (
        <Component {...props} data-shared-tooltip="">
          <span>Review project access.</span>
          {props.children}
        </Component>
      );
    };
    const content = { ref: contentRef, className: fixtureStyles.content, children: renderContent };
    const screen = await render(
      <CoreAIFluentProvider withComponentDefaults={enabled}>
        <div className={fixtureStyles.stage}>
          <AvatarGroup>
            <AvatarGroupItem name="Ada Lovelace" />
            <AvatarGroupPopover
              count={2}
              triggerButton={{ ref: triggerRef }}
              tooltip={{
                relationship: 'description',
                content,
                withArrow: true,
                visible: true,
                positioning: { position: 'below', offset: 12 },
              }}
            >
              <AvatarGroupItem name="Grace Hopper" />
              <AvatarGroupItem name="Katherine Johnson" />
            </AvatarGroupPopover>
          </AvatarGroup>
        </div>
      </CoreAIFluentProvider>,
    );
    await expect.poll(() => contentRef.current?.matches(':popover-open')).toBe(true);
    const grouped = contentRef.current;
    const trigger = triggerRef.current;
    if (!grouped || !trigger) throw new Error('Missing AvatarGroup tooltip slots');
    await settleTooltipStyles(grouped);
    const groupedStyles = captureTooltipStyles(grouped, trigger);
    expect(grouped).toHaveClass(tooltipClassNames.content, avatarGroupPopoverClassNames.tooltip);
    expect(grouped).toHaveAttribute('data-avatar-group-tooltip', '');
    expect(grouped).toHaveAttribute('data-shared-tooltip', '');
    expect(renderer.mock.calls[0][0]).toBe('div');
    expect(content.children).toBe(renderContent);
    expect(grouped.hasAttribute('data-coreai-defaults')).toBe(enabled);
    await screen.rerender(
      <CoreAIFluentProvider withComponentDefaults={enabled}>
        <div className={fixtureStyles.stage}>
          <Tooltip
            content={content}
            relationship="description"
            visible
            withArrow
            positioning={{ position: 'below', offset: 12 }}
          >
            <button
              type="button"
              ref={triggerRef}
              style={{ width: 32, height: 32 }}
              aria-label="Standalone access"
            >
              Open
            </button>
          </Tooltip>
        </div>
      </CoreAIFluentProvider>,
    );
    await expect.poll(() => contentRef.current?.matches(':popover-open')).toBe(true);
    const standalone = contentRef.current;
    if (!standalone || !triggerRef.current) throw new Error('Missing standalone Tooltip slots');
    await settleTooltipStyles(standalone);
    const standaloneStyles = captureTooltipStyles(standalone, triggerRef.current);
    const visualOnly = (values: Record<string, string>) =>
      Object.fromEntries(
        Object.entries(values).filter(
          ([key]) => !key.startsWith('anchor.') && !key.startsWith('trigger.'),
        ),
      );
    expect(
      compareTooltipStyles(
        visualOnly(groupedStyles),
        visualOnly(standaloneStyles),
        tooltipExamples[0],
      ),
    ).toEqual([]);
    expect(standalone).toHaveAttribute('data-shared-tooltip', '');
  },
);
