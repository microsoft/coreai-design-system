// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, beforeEach, expect, expectTypeOf, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import {
  TeachingPopover as RawTeachingPopover,
  TeachingPopoverCarousel as RawCarousel,
  TeachingPopoverCarouselCard as RawCard,
  TeachingPopoverCarouselFooterButton as RawFooterButton,
  TeachingPopoverSurface as RawSurface,
  TeachingPopoverTitle as RawTitle,
  TeachingPopoverTrigger as RawTrigger,
} from '@fluentui/react-headless-components-preview/teaching-popover';
import type { PositioningImperativeRef } from '@fluentui/react-headless-components-preview/positioning';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { ComparisonProvider as CoreAIFluentProvider } from '../../../apps/storybook/src/stories/experiments/ComparisonProvider.js';
import {
  TeachingPopoverComparison,
  TeachingPopoverNativeFlow,
  TeachingPopoverTourFlow,
  teachingPopoverConsumerExample,
  teachingPopoverExamples,
  type TeachingPopoverExample,
} from '../../../apps/storybook/src/stories/experiments/TeachingPopoverComparison.js';
import { TeachingPopoverComparisonWithReport } from '../../../apps/storybook/src/stories/experiments/TeachingPopoverComparisonReport.js';
import {
  capturePopoverNativeContract,
  captureTeachingPopoverStyles,
  compareTeachingPopoverStyles,
  getTeachingPopoverSurface,
  getTeachingPopoverTrigger,
  prepareTeachingPopoverComparison,
  refreshTeachingPopoverPositioning,
  settleTeachingPopoverStyles,
} from '../../../apps/storybook/src/stories/experiments/compareTeachingPopoverStyles.js';
import {
  TeachingPopover,
  TeachingPopoverBody,
  TeachingPopoverCarousel,
  TeachingPopoverCarouselCard,
  TeachingPopoverCarouselFooter,
  TeachingPopoverCarouselFooterButton,
  TeachingPopoverCarouselNav,
  TeachingPopoverCarouselNavButton,
  TeachingPopoverCarouselPageCount,
  TeachingPopoverFooter,
  TeachingPopoverHeader,
  TeachingPopoverSurface,
  TeachingPopoverTitle,
  TeachingPopoverTrigger,
  teachingPopoverBodyClassNames,
  teachingPopoverCarouselFooterClassNames,
  teachingPopoverHeaderClassNames,
  type TeachingPopoverBodySlots,
  type TeachingPopoverCarouselFooterProps,
  type TeachingPopoverCarouselFooterSlots,
  type TeachingPopoverHeaderSlots,
  type TeachingPopoverProps,
  type TeachingPopoverSurfaceProps,
  type TeachingPopoverSurfaceSlots,
} from './TeachingPopover.js';

let originalDirection: string | null = null;
let originalHash = '';
let originalViewport = { width: 414, height: 896 };

beforeEach(() => {
  originalDirection = document.documentElement.getAttribute('dir');
  originalHash = location.hash;
  originalViewport = { width: innerWidth, height: innerHeight };
});

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
  if (originalDirection === null) document.documentElement.removeAttribute('dir');
  else document.documentElement.setAttribute('dir', originalDirection);
  if (location.hash !== originalHash)
    history.replaceState(null, '', location.pathname + location.search + originalHash);
  if (innerWidth !== originalViewport.width || innerHeight !== originalViewport.height) {
    await page.viewport(originalViewport.width, originalViewport.height);
  }
});

function html(element: Element): HTMLElement {
  if (!(element instanceof HTMLElement)) throw new Error('Expected the public native HTML branch');
  return element;
}

function withProvider(
  children: React.ReactNode,
  theme = coreaiLightTheme,
  dir: 'ltr' | 'rtl' = 'ltr',
  defaults = true,
) {
  return (
    <CoreAIFluentProvider theme={theme} dir={dir} withComponentDefaults={defaults}>
      {children}
    </CoreAIFluentProvider>
  );
}

async function comparePair(
  example: TeachingPopoverExample,
  theme = coreaiLightTheme,
  dir: 'ltr' | 'rtl' = 'ltr',
  defaults = true,
) {
  await page.viewport(1440, 1000);
  const legacyPositioning = React.createRef<PositioningImperativeRef>();
  const headlessPositioning = React.createRef<PositioningImperativeRef>();
  const screen = await render(
    withProvider(
      <TeachingPopoverComparison
        example={example}
        legacyPositioningRef={legacyPositioning}
        headlessPositioningRef={headlessPositioning}
      />,
      theme,
      dir,
      defaults,
    ),
  );
  await userEvent.hover(screen.getByText('Current CoreAI / Griffel', { exact: true }));
  const legacy = getTeachingPopoverSurface(screen.container, 'legacy');
  const headless = getTeachingPopoverSurface(screen.container, 'headless');
  prepareTeachingPopoverComparison(screen.container);
  await Promise.all([settleTeachingPopoverStyles(legacy), settleTeachingPopoverStyles(headless)]);
  if (!legacyPositioning.current || !headlessPositioning.current) {
    throw new Error('Missing current public positioning handles');
  }
  await refreshTeachingPopoverPositioning(
    legacy,
    getTeachingPopoverTrigger(screen.container, 'legacy'),
    headless,
    getTeachingPopoverTrigger(screen.container, 'headless'),
    legacyPositioning.current,
    headlessPositioning.current,
  );
  const before = captureTeachingPopoverStyles(
    legacy,
    getTeachingPopoverTrigger(screen.container, 'legacy'),
  );
  const after = captureTeachingPopoverStyles(
    headless,
    getTeachingPopoverTrigger(screen.container, 'headless'),
  );
  const differences = compareTeachingPopoverStyles(
    before,
    after,
    example.props?.withArrow === false ? undefined : example.props?.size === 'small' ? 6 : 8,
  );
  return { screen, legacy, headless, before, after, differences };
}

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(teachingPopoverExamples)(
    `${mode}: $name retains the selected family styles and geometry`,
    async (example) => {
      const { differences, headless, after, screen } = await comparePair(example, theme);
      expect(
        differences.filter((difference) => difference.kind === 'unexpected'),
        JSON.stringify({
          viewport: [innerWidth, innerHeight],
          scroll: [scrollX, scrollY],
          surface: headless.getBoundingClientRect().toJSON(),
          trigger: getTeachingPopoverTrigger(screen.container, 'headless')
            .getBoundingClientRect()
            .toJSON(),
          style: headless.getAttribute('style'),
        }),
      ).toEqual([]);
      expect(headless.matches(':popover-open')).toBe(true);
      expect(headless.matches(':modal')).toBe(false);
      expect(after['surface.rect.width']).toBe('320');
      expect(after['surface.padding-top']).toBe('16px');
      expect(after['surface.border-radius']).toBe('8px');
      expect(after['surface.border-top-color']).toBe('rgba(0, 0, 0, 0)');
      if (example.carousel) {
        expect(after['selected.rect.width']).toBe('16');
        expect(after['unselected.rect.width']).toBe('8');
        expect(headless.querySelector('[role="tablist"]')?.hasAttribute('focusgroup')).toBe(false);
      }
    },
  );
}

test.each(
  teachingPopoverExamples.filter((example) =>
    [
      'Small arrow',
      'Brand content',
      'Title dismissal',
      'Carousel brand',
      'Carousel offset',
      'Vertical footer',
    ].includes(example.name),
  ),
)('RTL: $name preserves logical spacing and current native placement', async (example) => {
  document.documentElement.dir = 'rtl';
  const { differences, headless } = await comparePair(example, coreaiDarkTheme, 'rtl');
  expect(differences.filter((difference) => difference.kind === 'unexpected')).toEqual([]);
  expect(getComputedStyle(headless).direction).toBe('rtl');
});

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(['previous', 'next'] as const)(
    `${mode}: brand carousel %s hover preserves family recipes over the composed Button reset`,
    async (action) => {
      const example = teachingPopoverExamples.find(
        (candidate) => candidate.name === 'Carousel brand',
      );
      if (!example) throw new Error('Missing shared brand carousel example');
      const { legacy, headless, screen } = await comparePair(example, theme);
      const legacyAction = legacy.querySelector(
        `.${teachingPopoverCarouselFooterClassNames[action]}`,
      );
      const headlessAction = headless.querySelector(
        `.${teachingPopoverCarouselFooterClassNames[action]}`,
      );
      if (!legacyAction || !headlessAction) throw new Error('Missing current carousel action');
      await userEvent.hover(html(legacyAction));
      await settleTeachingPopoverStyles(legacy);
      const before = captureTeachingPopoverStyles(
        legacy,
        getTeachingPopoverTrigger(screen.container, 'legacy'),
      );
      await userEvent.hover(html(headlessAction));
      await settleTeachingPopoverStyles(headless);
      expect(headlessAction.matches(':hover')).toBe(true);
      const after = captureTeachingPopoverStyles(
        headless,
        getTeachingPopoverTrigger(screen.container, 'headless'),
      );
      expect(
        compareTeachingPopoverStyles(before, after, 8).filter(
          (difference) => difference.kind === 'unexpected',
        ),
      ).toEqual([]);
    },
  );
}

test('offset layout changes only visual order while preserving current previous-first native DOM order', async () => {
  const example = teachingPopoverExamples.find((candidate) => candidate.name === 'Carousel offset');
  if (!example) throw new Error('Missing shared offset carousel example');
  const { headless } = await comparePair(example);
  const footer = headless.querySelector(`.${teachingPopoverCarouselFooterClassNames.root}`);
  const previous = headless.querySelector(`.${teachingPopoverCarouselFooterClassNames.previous}`);
  const next = headless.querySelector(`.${teachingPopoverCarouselFooterClassNames.next}`);
  const nav = headless.querySelector('[data-teaching-slot="nav"]');
  if (!footer || !previous || !next || !nav) throw new Error('Missing current offset slots');
  expect(footer.firstElementChild).toBe(previous);
  expect(previous.getBoundingClientRect().left).toBeGreaterThan(nav.getBoundingClientRect().right);
  expect(next.getBoundingClientRect().left).toBeGreaterThan(previous.getBoundingClientRect().right);
});

test('defaults opt-out does not inject generic Overlay or CoreAI Button defaults into delegated family styles', async () => {
  const example = teachingPopoverExamples.find(
    (candidate) => candidate.name === 'Carousel centered',
  );
  if (!example) throw new Error('Missing shared carousel example');
  const { differences, headless } = await comparePair(example, coreaiLightTheme, 'ltr', false);
  expect(differences.filter((difference) => difference.kind === 'unexpected')).toEqual([]);
  expect(getComputedStyle(headless).borderTopColor).toBe('rgba(0, 0, 0, 0)');
  const next = headless.querySelector(`.${teachingPopoverCarouselFooterClassNames.next}`);
  if (!next) throw new Error('Missing styled carousel action');
  expect(getComputedStyle(next).minWidth).toBe('96px');
  expect(getComputedStyle(next).borderRadius).toBe('4px');
});

test('unlayered consumer CSS wins without hiding legacy priority differences', async () => {
  const { differences, headless, legacy } = await comparePair(teachingPopoverConsumerExample);
  expect(getComputedStyle(headless).paddingTop).toBe('9px');
  expect(getComputedStyle(headless).borderTopWidth).toBe('3px');
  expect(getComputedStyle(headless).borderRadius).toBe('3px');
  expect(getComputedStyle(headless).backgroundColor).toBe('rgb(237, 232, 247)');
  expect(getComputedStyle(legacy).paddingTop).toBe('16px');
  expect(differences.some((difference) => difference.property === 'surface.padding-top')).toBe(
    true,
  );
  const arrow = headless.querySelector(':scope > [data-arrow]');
  if (!arrow) throw new Error('Missing native arrow');
  expect(getComputedStyle(arrow, '::before').borderTopWidth).toBe('3px');
});

test('native subpixel-centering classification rejects actual placement drift', () => {
  const capture = {
    'anchor.side': 'below',
    'anchor.cross-offset': '0',
    'surface.rect.width': '320',
    'trigger.rect.width': '160',
  };
  expect(
    compareTeachingPopoverStyles({ ...capture, 'anchor.cross-offset': '0.5' }, capture)[0]?.kind,
  ).toBe('native-subpixel-centering');
  expect(
    compareTeachingPopoverStyles({ ...capture, 'anchor.cross-offset': '0.51' }, capture)[0]?.kind,
  ).toBe('unexpected');
  expect(
    compareTeachingPopoverStyles(capture, { ...capture, 'anchor.cross-offset': '0.5' })[0]?.kind,
  ).toBe('unexpected');
});

test('published reports retain fixture-specific readiness, counts and final geometry after ancestor relocation', async () => {
  const previous = { width: innerWidth, height: innerHeight };
  await page.viewport(1440, 1000);
  function RelocatedReport() {
    const [relocated, setRelocated] = React.useState(false);
    React.useEffect(() => {
      const frame = requestAnimationFrame(() => setRelocated(true));
      return () => cancelAnimationFrame(frame);
    }, []);
    return (
      <div style={{ paddingBlockStart: relocated ? '20px' : '0px' }} data-relocated={relocated}>
        <TeachingPopoverComparisonWithReport />
      </div>
    );
  }
  try {
    const screen = await render(withProvider(<RelocatedReport />));
    const report = screen.getByRole('status', { name: 'TeachingPopover style report' });
    await expect.element(report).toHaveAttribute('data-teaching-report-state', 'ready');
    await expect
      .element(report)
      .toHaveAttribute('data-teaching-report-example', 'Default teaching content');
    expect(
      report.element().getAttribute('data-teaching-unexpected-count'),
      report.element().textContent ?? '',
    ).toBe('0');
    const height = report.element().getBoundingClientRect().height;
    await userEvent.selectOptions(
      screen.getByLabelText('TeachingPopover visual fixture'),
      'Carousel brand',
    );
    await expect.element(report).toHaveAttribute('data-teaching-report-example', 'Carousel brand');
    await expect.element(report).toHaveAttribute('data-teaching-unexpected-count', '0');
    expect(report.element().getBoundingClientRect().height).toBe(height);
    const surface = getTeachingPopoverSurface(screen.container, 'headless');
    expect(surface.getBoundingClientRect().width).toBe(320);
    expect(surface.getBoundingClientRect().height).toBeGreaterThan(100);
    expect(capturePopoverNativeContract(surface)['popover-open']).toBe('true');
  } finally {
    await cleanup();
    await page.viewport(previous.width, previous.height);
  }
});

test('modal native focus, inertness, native submission, dismissal and trigger restoration remain intact', async () => {
  const screen = await render(withProvider(<TeachingPopoverNativeFlow />));
  const trigger = screen.getByRole('button', { name: 'Open project guide', exact: true });
  await userEvent.click(trigger);
  const surface = screen.getByRole('dialog', { name: 'Project guide', exact: true });
  await expect.element(surface).toBeVisible();
  expect(surface.element().matches(':modal')).toBe(true);
  const close = screen.getByRole('button', { name: 'Close guide', exact: true });
  await expect.element(close).toHaveFocus();
  html(
    screen.getByRole('button', { name: 'After teaching content', exact: true }).element(),
  ).focus();
  await expect.element(close).toHaveFocus();
  await userEvent.hover(screen.getByRole('heading', { name: 'Invite a reviewer', exact: true }));
  await userEvent.keyboard('{Tab}{Shift>}{Tab}{/Shift}');
  await expect.element(close).toHaveFocus();
  expect(close.element().matches(':focus-visible')).toBe(true);
  expect(close.element().matches(':hover')).toBe(false);
  expect(getComputedStyle(close.element()).outlineWidth).toBe('2px');
  await userEvent.clear(screen.getByRole('textbox', { name: 'Reviewer', exact: true }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Reviewer', exact: true }), 'Taylor');
  await userEvent.click(screen.getByRole('button', { name: 'Invite reviewer', exact: true }));
  await expect
    .element(screen.getByRole('status', { name: 'Guide submission' }))
    .toHaveTextContent('Taylor:invite');
  await userEvent.keyboard('{Escape}');
  await expect.element(surface).not.toBeInTheDocument();
  await expect.element(trigger).toHaveFocus();
  await expect
    .element(screen.getByRole('status', { name: 'Guide open changes' }))
    .toHaveTextContent('false');
  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole('button', { name: 'Got it', exact: true }));
  await expect.element(surface).not.toBeInTheDocument();
  await expect.element(trigger).toHaveFocus();
});

test('controlled carousel accepts/rejects requests, exposes page count, retains native tab navigation and finishes', async () => {
  const screen = await render(withProvider(<TeachingPopoverTourFlow />));
  const trigger = screen.getByRole('button', { name: 'Start Atlas tour', exact: true });
  await userEvent.click(screen.getByRole('checkbox', { name: 'Keep current step' }));
  await userEvent.click(trigger);
  await expect
    .element(screen.getByRole('group', { name: 'Atlas tour', exact: true }))
    .toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Next', exact: true }));
  await expect
    .element(screen.getByRole('status', { name: 'Tour selected step' }))
    .toHaveTextContent('welcome');
  await expect
    .element(screen.getByRole('status', { name: 'Tour value changes' }))
    .toHaveTextContent('click:review:button');
  await userEvent.click(screen.getByRole('button', { name: 'Close Atlas tour', exact: true }));
  await userEvent.click(screen.getByRole('checkbox', { name: 'Keep current step' }));
  await userEvent.click(trigger);
  const first = screen.getByRole('tab', { name: 'Step welcome', exact: true });
  const second = screen.getByRole('tab', { name: 'Step review', exact: true });
  const last = screen.getByRole('tab', { name: 'Step ready', exact: true });
  html(first.element()).focus();
  await userEvent.hover(screen.getByRole('heading', { name: 'Welcome to Atlas', exact: true }));
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(first).toHaveFocus();
  expect(first.element().closest('[role="tablist"]')?.hasAttribute('focusgroup')).toBe(false);
  await userEvent.keyboard('{Tab}');
  await expect.element(second).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  await expect.element(second).toHaveAttribute('aria-selected', 'true');
  await expect.element(screen.getByRole('heading', { name: 'Review together' })).toBeVisible();
  expect(screen.container.textContent).not.toContain('Keep project updates in one workspace.');
  await userEvent.click(last);
  await expect.element(screen.getByLabelText('Tour page count')).toHaveTextContent('3 of 3');
  await userEvent.click(screen.getByRole('button', { name: 'Previous', exact: true }));
  await expect.element(second).toHaveAttribute('aria-selected', 'true');
  await userEvent.click(last);
  await userEvent.click(screen.getByRole('button', { name: 'Finish tour', exact: true }));
  await expect
    .element(screen.getByRole('group', { name: 'Atlas tour', exact: true }))
    .not.toBeInTheDocument();
  await expect
    .element(screen.getByRole('status', { name: 'Tour finish count' }))
    .toHaveTextContent('1');
  await expect.element(trigger).toHaveFocus();
});

test('narrow controlled-tour callback logs wrap without moving native navigation outside the viewport', async () => {
  await page.viewport(375, 720);
  const screen = await render(withProvider(<TeachingPopoverTourFlow />));
  await userEvent.click(screen.getByRole('button', { name: 'Start Atlas tour', exact: true }));
  const group = screen.getByRole('group', { name: 'Atlas tour', exact: true });
  for (let index = 0; index < 12; index += 1) {
    await userEvent.click(
      screen.getByRole('tab', {
        name: index % 2 === 0 ? 'Step ready' : 'Step welcome',
        exact: true,
      }),
    );
  }
  const changes = screen.getByRole('status', { name: 'Tour value changes', exact: true });
  expect(changes.element().textContent?.split('|')).toHaveLength(12);
  const bounds = group.element().getBoundingClientRect();
  expect(bounds.left).toBeGreaterThanOrEqual(0);
  expect(bounds.right).toBeLessThanOrEqual(innerWidth);
  const navigation = screen.getByRole('tab', { name: 'Step ready', exact: true });
  expect(navigation.element().getBoundingClientRect().right).toBeLessThanOrEqual(innerWidth);
});

test('non-modal div surfaces preserve native links, ARIA relationships, outside dismissal and caller refs', async () => {
  const surfaceRef = React.createRef<HTMLDivElement>();
  const triggerRef = React.createRef<HTMLButtonElement>();
  const changes = vi.fn<NonNullable<TeachingPopoverProps['onOpenChange']>>();
  const screen = await render(
    withProvider(
      <div>
        <TeachingPopover onOpenChange={changes} withArrow={false}>
          <TeachingPopoverTrigger>
            <button type="button" ref={triggerRef}>
              Open native help
            </button>
          </TeachingPopoverTrigger>
          <TeachingPopoverSurface as="div" role="region" aria-label="Native help" ref={surfaceRef}>
            <a href="#teaching-native-link">Help destination</a>
          </TeachingPopoverSurface>
        </TeachingPopover>
        <button type="button">Outside guide</button>
        <div id="teaching-native-link">Destination</div>
      </div>,
    ),
  );
  const trigger = screen.getByRole('button', { name: 'Open native help', exact: true });
  await userEvent.click(trigger);
  const surface = screen.getByRole('region', { name: 'Native help', exact: true });
  expect(surface.element()).toBe(surfaceRef.current);
  expect(trigger.element()).toBe(triggerRef.current);
  expect(surface.element() instanceof HTMLDivElement).toBe(true);
  expect(surface.element().matches(':popover-open')).toBe(true);
  expect(trigger.element().getAttribute('aria-controls')).toBe(surface.element().id);
  expect(trigger.element().getAttribute('aria-details')).toBe(surface.element().id);
  await userEvent.click(screen.getByRole('link', { name: 'Help destination', exact: true }));
  expect(location.hash).toBe('#teaching-native-link');
  await userEvent.click(screen.getByRole('button', { name: 'Outside guide', exact: true }));
  await expect.element(surface).not.toBeInTheDocument();
  const call = changes.mock.calls.at(-1);
  expect(call?.[1].open).toBe(false);
  expect(call?.[1].event).toBe(call?.[0]);
});

type DialogRootProps = Extract<
  ExtractSlotProps<TeachingPopoverSurfaceSlots['root']>,
  { as?: 'dialog' }
>;
const renderRoot: SlotRenderFunction<DialogRootProps> = (Component, props) => (
  <Component {...props} data-rendered-surface="">
    {props.children}
  </Component>
);
const renderIcon: SlotRenderFunction<ExtractSlotProps<TeachingPopoverHeaderSlots['icon']>> = (
  Component,
  props,
) => (
  <Component {...props} data-rendered-icon="">
    Tip
  </Component>
);
const renderMedia: SlotRenderFunction<ExtractSlotProps<TeachingPopoverBodySlots['media']>> = (
  Component,
  props,
) => (
  <Component {...props} data-rendered-media="">
    Rendered media
  </Component>
);
type FooterButtonProps = Extract<
  ExtractSlotProps<TeachingPopoverCarouselFooterSlots['next']>,
  { as?: 'button' }
>;
test('public slot renderers retain native nodes, classes, refs, default action content and event identity', async () => {
  expectTypeOf(TeachingPopoverSurface).toExtend<ForwardRefComponent<TeachingPopoverSurfaceProps>>();
  expectTypeOf<TeachingPopoverProps>().toHaveProperty('appearance');
  expectTypeOf<TeachingPopoverCarouselFooterProps>().toHaveProperty('layout');
  const surfaceRef = React.createRef<HTMLDialogElement>();
  const headerRef = React.createRef<HTMLDivElement>();
  const titleRef = React.createRef<HTMLHeadingElement>();
  const iconRef = React.createRef<HTMLDivElement>();
  const mediaRef = React.createRef<HTMLSpanElement>();
  const carouselRef = React.createRef<HTMLDivElement>();
  const cardRef = React.createRef<HTMLDivElement>();
  const navRef = React.createRef<HTMLDivElement>();
  const countRef = React.createRef<HTMLDivElement>();
  const nextRef = React.createRef<HTMLButtonElement>();
  const footerRef = React.createRef<HTMLDivElement>();
  // The props-object slot has no ref; its renderer can use the public forward-ref component.
  const renderNext: SlotRenderFunction<FooterButtonProps> = (_Component, props) => (
    <TeachingPopoverCarouselFooterButton {...props} as="button" ref={nextRef} data-rendered-next="">
      {props.children ?? 'Next'}
    </TeachingPopoverCarouselFooterButton>
  );
  let callbackTarget: EventTarget | null = null;
  const changes = vi.fn<
    NonNullable<React.ComponentProps<typeof TeachingPopoverCarousel>['onValueChange']>
  >((event) => {
    callbackTarget = event.currentTarget;
  });
  const screen = await render(
    withProvider(
      <TeachingPopover defaultOpen>
        <TeachingPopoverSurface
          as="dialog"
          ref={surfaceRef}
          aria-label="Rendered slots"
          className="caller-surface"
        >
          {
            ((Component, props) =>
              renderRoot(Component, {
                ...props,
                children: (
                  <TeachingPopoverCarousel
                    defaultValue="first"
                    ref={carouselRef}
                    onValueChange={changes}
                  >
                    <TeachingPopoverCarouselCard
                      value="first"
                      ref={cardRef}
                      className="caller-card"
                    >
                      <TeachingPopoverHeader
                        ref={headerRef}
                        className="caller-header"
                        icon={{ ref: iconRef, className: 'caller-icon', children: renderIcon }}
                        dismissButton={null}
                      >
                        Slot tips
                      </TeachingPopoverHeader>
                      <TeachingPopoverBody
                        media={{ ref: mediaRef, className: 'caller-media', children: renderMedia }}
                      >
                        <TeachingPopoverTitle ref={titleRef}>
                          First rendered page
                        </TeachingPopoverTitle>
                      </TeachingPopoverBody>
                    </TeachingPopoverCarouselCard>
                    <TeachingPopoverCarouselCard value="second">
                      Second rendered page
                    </TeachingPopoverCarouselCard>
                    <TeachingPopoverCarouselFooter
                      next={{
                        as: 'button',
                        navType: 'next',
                        altText: 'Finish',
                        type: 'button',
                        children: renderNext,
                        className: 'caller-next',
                      }}
                    >
                      <TeachingPopoverCarouselNav ref={navRef} aria-label="Rendered navigation">
                        {(value) => (
                          <TeachingPopoverCarouselNavButton
                            as="button"
                            aria-label={`Rendered ${value}`}
                          />
                        )}
                      </TeachingPopoverCarouselNav>
                      <TeachingPopoverCarouselPageCount ref={countRef}>
                        {(current, total) => `${current}/${total}`}
                      </TeachingPopoverCarouselPageCount>
                    </TeachingPopoverCarouselFooter>
                    <TeachingPopoverFooter ref={footerRef}>
                      Consumer footer content
                    </TeachingPopoverFooter>
                  </TeachingPopoverCarousel>
                ),
              })) satisfies SlotRenderFunction<DialogRootProps>
          }
        </TeachingPopoverSurface>
      </TeachingPopover>,
    ),
  );
  await expect.element(screen.getByText('First rendered page', { exact: true })).toBeVisible();
  for (const reference of [
    surfaceRef,
    headerRef,
    titleRef,
    iconRef,
    mediaRef,
    carouselRef,
    cardRef,
    navRef,
    countRef,
    nextRef,
    footerRef,
  ])
    expect(reference.current?.isConnected).toBe(true);
  expect(surfaceRef.current?.dataset.renderedSurface).toBe('');
  expect(iconRef.current?.classList.contains(teachingPopoverHeaderClassNames.icon)).toBe(true);
  expect(mediaRef.current?.classList.contains(teachingPopoverBodyClassNames.media)).toBe(true);
  expect(mediaRef.current?.classList.contains('caller-media')).toBe(true);
  const next = nextRef.current;
  if (!next) throw new Error('Missing rendered current action');
  expect(next.classList.contains('caller-next')).toBe(true);
  expect(next.classList.contains(teachingPopoverCarouselFooterClassNames.next)).toBe(true);
  expect(next.dataset.renderedNext).toBe('');
  await userEvent.click(screen.getByRole('button', { name: 'Next', exact: true }));
  await expect.element(screen.getByText('Second rendered page', { exact: true })).toBeVisible();
  expect(nextRef.current).toBe(next);
  expect(next.textContent).toBe('Finish');
  expect(callbackTarget).toBe(next);
  expect(changes.mock.calls[0]?.[1].event).toBe(changes.mock.calls[0]?.[0]);
  expect(changes.mock.calls[0]?.[1].value).toBe('second');
  await cleanup();
  expect(surfaceRef.current).toBeNull();
  expect(nextRef.current).toBeNull();
});

test('carousel footer anchor-slot adapters preserve caller renderers, required navigation props and native links', async () => {
  type AnchorProps = Extract<
    ExtractSlotProps<TeachingPopoverCarouselFooterSlots['next']>,
    { as: 'a' }
  >;
  const renderAnchor: SlotRenderFunction<AnchorProps> = (Component, props) => (
    <Component {...props} as="a" data-rendered-anchor="">
      {props.children ?? 'Rendered next link'}
    </Component>
  );
  const changed = vi.fn();
  const screen = await render(
    withProvider(
      <TeachingPopover defaultOpen withArrow={false}>
        <TeachingPopoverSurface aria-label="Anchor slot guide">
          <TeachingPopoverCarousel defaultValue="first" onValueChange={changed}>
            <TeachingPopoverCarouselCard value="first">
              Anchor slot first page
            </TeachingPopoverCarouselCard>
            <TeachingPopoverCarouselCard value="second">
              Anchor slot second page
            </TeachingPopoverCarouselCard>
            <TeachingPopoverCarouselFooter
              previous={{
                as: 'a',
                href: '#teaching-previous-link',
                navType: 'prev',
                altText: 'Skip linked guide',
                children: 'Previous linked page',
              }}
              next={{
                as: 'a',
                href: '#teaching-next-link',
                navType: 'next',
                altText: 'Finish linked guide',
                children: renderAnchor,
                className: 'caller-anchor',
              }}
            />
          </TeachingPopoverCarousel>
        </TeachingPopoverSurface>
      </TeachingPopover>,
    ),
  );
  const next = screen.getByRole('link', { name: 'Rendered next link', exact: true });
  const element = next.element();
  expect(element instanceof HTMLAnchorElement).toBe(true);
  expect(element.getAttribute('href')).toBe('#teaching-next-link');
  expect(element.classList.contains('caller-anchor')).toBe(true);
  expect(element.getAttribute('data-rendered-anchor')).toBe('');
  await expect
    .element(screen.getByRole('link', { name: 'Skip linked guide', exact: true }))
    .toBeVisible();
  await userEvent.click(next);
  await expect.element(screen.getByText('Anchor slot second page', { exact: true })).toBeVisible();
  expect(location.hash).toBe('#teaching-next-link');
  expect(changed.mock.calls[0]?.[1].value).toBe('second');
  expect(screen.getByRole('link', { name: 'Finish linked guide', exact: true }).element()).toBe(
    element,
  );
});

for (const implementation of ['raw', 'styled'] as const) {
  const Popover = implementation === 'raw' ? RawTeachingPopover : TeachingPopover;
  const Surface = implementation === 'raw' ? RawSurface : TeachingPopoverSurface;
  const Trigger = implementation === 'raw' ? RawTrigger : TeachingPopoverTrigger;
  const Title = implementation === 'raw' ? RawTitle : TeachingPopoverTitle;
  const Carousel = implementation === 'raw' ? RawCarousel : TeachingPopoverCarousel;
  const Card = implementation === 'raw' ? RawCard : TeachingPopoverCarouselCard;
  const FooterButton =
    implementation === 'raw' ? RawFooterButton : TeachingPopoverCarouselFooterButton;

  test(`${implementation}: controlled content updates during outside clicks light-dismiss and reopen with updated content`, async () => {
    function OutsideUpdates() {
      const [open, setOpen] = React.useState(false);
      const [version, setVersion] = React.useState(0);
      return (
        <div>
          <Popover
            open={open}
            withArrow={false}
            positioning={{ position: 'below', offset: 8 }}
            onOpenChange={(_event, data) => setOpen(data.open)}
          >
            <Trigger>
              <button type="button">Open outside update guide</button>
            </Trigger>
            <Surface aria-label="Outside update guide">
              <Title>Content version {version}</Title>
              <button type="button">Inside update guide</button>
            </Surface>
          </Popover>
          <div style={{ marginBlockStart: '360px' }}>
            <button type="button" onClick={() => setVersion((previous) => previous + 1)}>
              Update outside content
            </button>
            <button type="button">Plain outside target</button>
            <button
              type="button"
              onClick={() => {
                setVersion(0);
                setOpen(false);
              }}
            >
              Explicit controlled reset
            </button>
          </div>
        </div>
      );
    }
    const screen = await render(withProvider(<OutsideUpdates />));
    const trigger = screen.getByRole('button', { name: 'Open outside update guide', exact: true });
    await userEvent.click(trigger);
    const surface = screen.getByRole('group', { name: 'Outside update guide', exact: true });
    await expect.element(surface).toBeVisible();
    // 0.4.1 light-dismisses on any outside click, including one that also updates content,
    // and unmounts the surface a microtask after the native close.
    await userEvent.click(
      screen.getByRole('button', { name: 'Update outside content', exact: true }),
    );
    await expect.element(surface).not.toBeInTheDocument();
    await userEvent.click(trigger);
    await settleTeachingPopoverStyles(surface.element());
    await expect
      .element(screen.getByRole('heading', { name: 'Content version 1', exact: true }))
      .toBeVisible();
    expect(surface.element().matches(':popover-open')).toBe(true);
    const plain = screen.getByRole('button', { name: 'Plain outside target', exact: true });
    await userEvent.click(plain);
    await expect.element(surface).not.toBeInTheDocument();
    await expect.element(plain).toHaveFocus();
    await userEvent.click(trigger);
    const reset = screen.getByRole('button', { name: 'Explicit controlled reset', exact: true });
    await userEvent.click(reset);
    await expect.element(surface).not.toBeInTheDocument();
    await expect.element(reset).toHaveFocus();
  });

  test(`${implementation}: title dismissal keeps the inherited hidden default and supports an explicitly accessible button`, async () => {
    const screen = await render(
      withProvider(
        <Popover>
          <Trigger>
            <button type="button">Open title guide</button>
          </Trigger>
          <Surface aria-label="Title guide">
            <Title dismissButton={{ type: 'button', 'aria-label': 'Inherited title close' }}>
              Inherited title
            </Title>
            <Title
              dismissButton={{
                type: 'button',
                'aria-label': 'Accessible title close',
                'aria-hidden': false,
              }}
            >
              Accessible title
            </Title>
          </Surface>
        </Popover>,
      ),
    );
    const trigger = screen.getByRole('button', { name: 'Open title guide', exact: true });
    await userEvent.click(trigger);
    await expect
      .element(screen.getByRole('group', { name: 'Title guide', exact: true }))
      .toBeVisible();
    const inherited = screen.container.querySelector('[aria-label="Inherited title close"]');
    expect(inherited?.getAttribute('aria-hidden')).toBe('true');
    const safe = screen.getByRole('button', { name: 'Accessible title close', exact: true });
    await expect.element(safe).toBeVisible();
    expect(safe.element().getAttribute('aria-hidden')).toBe('false');
    await userEvent.click(safe);
    await expect
      .element(screen.getByRole('group', { name: 'Title guide', exact: true }))
      .not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  test(`${implementation}: carousel native form buttons need an explicit type and retain callback cancellation ordering`, async () => {
    const submitted = vi.fn();
    const changed = vi.fn();
    const clicked = vi.fn<React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>>((event) =>
      event.preventDefault(),
    );
    const screen = await render(
      withProvider(
        <Popover defaultOpen withArrow={false}>
          <Surface aria-label="Current form boundary">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitted();
              }}
            >
              <Carousel defaultValue="first" onValueChange={changed}>
                <Card value="first">Current first page</Card>
                <Card value="second">Current second page</Card>
                <FooterButton navType="next" altText="Done" onClick={clicked}>
                  Native default action
                </FooterButton>
                <FooterButton navType="prev" altText="Skip" type="button">
                  Safe previous action
                </FooterButton>
              </Carousel>
            </form>
          </Surface>
        </Popover>,
      ),
    );
    const next = screen.getByRole('button', { name: 'Native default action', exact: true });
    const nextElement = next.element();
    expect(nextElement.getAttribute('type')).toBeNull();
    expect(nextElement instanceof HTMLButtonElement && nextElement.type).toBe('submit');
    await userEvent.click(next);
    await expect.element(screen.getByText('Current second page', { exact: true })).toBeVisible();
    expect(changed).toHaveBeenCalledTimes(1);
    expect(clicked).toHaveBeenCalledTimes(1);
    expect(changed.mock.calls[0]?.[0]).toBe(clicked.mock.calls[0]?.[0]);
    expect(changed.mock.calls[0]?.[1].value).toBe('second');
    expect(submitted).not.toHaveBeenCalled();
    const safe = screen.getByRole('button', { name: 'Safe previous action', exact: true });
    expect(safe.element().getAttribute('type')).toBe('button');
    await userEvent.click(safe);
    await expect.element(screen.getByText('Current first page', { exact: true })).toBeVisible();
    expect(submitted).not.toHaveBeenCalled();
  });

  test(`${implementation}: carousel anchor actions retain native navigation, refs and callback targets`, async () => {
    const anchorRef = React.createRef<HTMLAnchorElement>();
    let target: EventTarget | null = null;
    const changed = vi.fn<
      NonNullable<React.ComponentProps<typeof TeachingPopoverCarousel>['onValueChange']>
    >((event) => {
      target = event.currentTarget;
    });
    const clicked = vi.fn();
    const screen = await render(
      withProvider(
        <Popover defaultOpen withArrow={false}>
          <Surface aria-label="Native carousel link">
            <Carousel defaultValue="first" onValueChange={changed}>
              <Card value="first">Link first page</Card>
              <Card value="second">Link second page</Card>
              <FooterButton
                as="a"
                href="#teaching-carousel-link"
                ref={anchorRef}
                navType="next"
                altText="Completed link"
                onClick={clicked}
              >
                Next linked page
              </FooterButton>
            </Carousel>
          </Surface>
        </Popover>,
      ),
    );
    const link = screen.getByRole('link', { name: 'Next linked page', exact: true });
    expect(link.element()).toBe(anchorRef.current);
    expect(link.element().tagName).toBe('A');
    expect(link.element().getAttribute('href')).toBe('#teaching-carousel-link');
    await userEvent.click(link);
    await expect.element(screen.getByText('Link second page', { exact: true })).toBeVisible();
    expect(location.hash).toBe('#teaching-carousel-link');
    expect(target).toBe(anchorRef.current);
    expect(changed.mock.calls[0]?.[1].event).toBe(clicked.mock.calls[0]?.[0]);
  });
}
