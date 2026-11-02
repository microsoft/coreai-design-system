// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { renderCoreAIComponent } from '../../react-components/src/test-utils.js';
import {
  CounterBadgeComparison,
  CounterBadgeNotifications,
  counterBadgeConsumerExample,
  counterBadgeExamples,
  counterBadgeNumericZeroExample,
  type CounterBadgeExample,
} from '../../../apps/storybook/src/stories/experiments/CounterBadgeComparison.js';
import {
  BadgeFixtureIcon,
  badgeIconRenderer,
  badgeRootRenderer,
} from '../../../apps/storybook/src/stories/experiments/BadgeComparison.js';
import {
  captureCounterBadgeStyles,
  compareCounterBadgeStyles,
  getComparisonCounterBadge,
  settleCounterBadgeStyles,
} from '../../../apps/storybook/src/stories/experiments/compareCounterBadgeStyles.js';
import { badgeClassNames } from './Badge.js';
import { CounterBadge, counterBadgeClassNames, type CounterBadgeProps } from './CounterBadge.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

async function renderPair(
  example: CounterBadgeExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await renderCoreAIComponent(<CounterBadgeComparison examples={[example]} />, {
    providerProps: { theme, withComponentDefaults, dir },
  });
  const legacy = getComparisonCounterBadge(screen.container, 'legacy');
  const headless = getComparisonCounterBadge(screen.container, 'headless');
  await Promise.all([settleCounterBadgeStyles(legacy), settleCounterBadgeStyles(headless)]);
  return { legacy, headless };
}

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(counterBadgeExamples)(
    `retains $name inherited Badge styles and counter dimensions in ${mode} mode`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(
        compareCounterBadgeStyles(
          captureCounterBadgeStyles(legacy),
          captureCounterBadgeStyles(headless),
        ),
      ).toEqual([]);
    },
  );

  test(`allows consumer CSS to override inherited and variant styles in ${mode} mode`, async () => {
    const { headless } = await renderPair(counterBadgeConsumerExample, theme);
    const values = captureCounterBadgeStyles(headless);
    expect(values['root.min-width']).toBe('60px');
    expect(values['root.height']).toBe('30.00');
    expect(values['root.padding-left']).toBe('10px');
    expect(values['root.border-radius']).toBe('3px');
    expect(values['root.color']).toBe('rgb(25, 55, 85)');
    expect(values['icon.font-size']).toBe('18px');
    expect(values['icon.margin-right']).toBe('2px');
  });
}

test.each([
  {
    name: 'default zero',
    props: {},
    count: 0,
    text: '',
    hidden: true,
    dot: false,
    overflowed: false,
  },
  {
    name: 'shown zero',
    props: { showZero: true },
    count: 0,
    text: '0',
    hidden: false,
    dot: false,
    overflowed: false,
  },
  {
    name: 'positive count',
    props: { count: 5 },
    count: 5,
    text: '5',
    hidden: false,
    dot: false,
    overflowed: false,
  },
  {
    name: 'overflow',
    props: { count: 100 },
    count: 100,
    text: '99+',
    hidden: false,
    dot: false,
    overflowed: true,
  },
  {
    name: 'custom overflow',
    props: { count: 12, overflowCount: 9 },
    count: 12,
    text: '9+',
    hidden: false,
    dot: false,
    overflowed: true,
  },
  {
    name: 'at threshold',
    props: { count: 9, overflowCount: 9 },
    count: 9,
    text: '9',
    hidden: false,
    dot: false,
    overflowed: false,
  },
  {
    name: 'zero threshold',
    props: { count: 1, overflowCount: 0 },
    count: 1,
    text: '0+',
    hidden: false,
    dot: false,
    overflowed: true,
  },
  {
    name: 'dot',
    props: { count: 100, dot: true },
    count: 100,
    text: '',
    hidden: false,
    dot: true,
    overflowed: true,
  },
  {
    name: 'supplied content',
    props: { count: 12, children: 'New' },
    count: 12,
    text: 'New',
    hidden: false,
    dot: false,
    overflowed: false,
  },
  {
    name: 'explicit numeric zero content',
    props: { children: 0 },
    count: 0,
    text: '0',
    hidden: false,
    dot: false,
    overflowed: false,
  },
  {
    name: 'automatic count over falsy content',
    props: { count: 5, children: 0 },
    count: 5,
    text: '5',
    hidden: false,
    dot: false,
    overflowed: false,
  },
  {
    name: 'false content',
    props: { children: false },
    count: 0,
    text: '',
    hidden: true,
    dot: false,
    overflowed: false,
  },
  {
    name: 'icon without count',
    props: { icon: <BadgeFixtureIcon /> },
    count: 0,
    text: '',
    hidden: true,
    dot: false,
    overflowed: false,
  },
  {
    name: 'dot with supplied content',
    props: { dot: true, children: '!' },
    count: 0,
    text: '!',
    hidden: false,
    dot: true,
    overflowed: false,
  },
] satisfies {
  name: string;
  props: CounterBadgeProps;
  count: number;
  text: string;
  hidden: boolean;
  dot: boolean;
  overflowed: boolean;
}[])(
  'styles the public hook’s resolved $name without reimplementing its behavior',
  async ({ name, props, count, text, hidden, dot, overflowed }) => {
    const { headless } = await renderPair({ name, props });
    expect(headless.root.textContent).toBe(text);
    expect(headless.root).toHaveAttribute('data-count', String(count));
    expect(headless.root.hasAttribute('data-hidden')).toBe(hidden);
    expect(headless.root.hasAttribute('data-dot')).toBe(dot);
    expect(headless.root.hasAttribute('data-overflowed')).toBe(overflowed);
    // The shared comparison cell is a flex container, so native CSS blockifies inline-flex.
    expect(getComputedStyle(headless.root).display).toBe(hidden ? 'none' : 'flex');
    if (dot) {
      expect(headless.root.getBoundingClientRect().width).toBe(6);
      expect(headless.root.getBoundingClientRect().height).toBe(6);
      expect(getComputedStyle(headless.root).paddingLeft).toBe('0px');
    }
    expect(headless.root).not.toHaveAttribute('role');
    expect(headless.root).not.toHaveAttribute('aria-live');
  },
);

test('keeps numeric zero children visible per the current hook instead of copying the old falsy hide check', async () => {
  const { legacy, headless } = await renderPair(counterBadgeNumericZeroExample);
  expect(legacy.root.textContent).toBe('0');
  expect(headless.root.textContent).toBe('0');
  expect(getComputedStyle(legacy.root).display).toBe('none');
  expect(getComputedStyle(headless.root).display).toBe('flex');
  expect(headless.root).not.toHaveAttribute('data-hidden');
  expect(
    compareCounterBadgeStyles(
      captureCounterBadgeStyles(legacy),
      captureCounterBadgeStyles(headless),
    ),
  ).toEqual([
    { property: 'root.display', legacy: 'none', headless: 'flex' },
    { property: 'root.width', legacy: '0.00', headless: '20.00' },
    { property: 'root.height', legacy: '0.00', headless: '20.00' },
  ]);
});

test('retains inline-flex in normal flow and native blockification as a flex or grid item', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <div>
        Inbox <CounterBadge data-testid="inline-counter" count={5} />
      </div>
      <div style={{ display: 'flex' }}>
        <CounterBadge data-testid="flex-counter" count={5} />
      </div>
      <div style={{ display: 'grid', justifyItems: 'start' }}>
        <CounterBadge data-testid="grid-counter" count={5} />
      </div>
    </>,
  );
  expect(getComputedStyle(screen.getByTestId('inline-counter').element()).display).toBe(
    'inline-flex',
  );
  expect(getComputedStyle(screen.getByTestId('flex-counter').element()).display).toBe('flex');
  expect(getComputedStyle(screen.getByTestId('grid-counter').element()).display).toBe('flex');
});

test.each([true, false])(
  'adds no defaults with withComponentDefaults=%s',
  async (withComponentDefaults) => {
    const { legacy, headless } = await renderPair(
      {
        name: 'Undefined props',
        props: {
          count: 8,
          size: undefined,
          shape: undefined,
          appearance: undefined,
          color: undefined,
        },
      },
      coreaiLightTheme,
      withComponentDefaults,
    );
    expect(
      compareCounterBadgeStyles(
        captureCounterBadgeStyles(legacy),
        captureCounterBadgeStyles(headless),
      ),
    ).toEqual([]);
    expect(headless.root).toHaveAttribute('data-size', 'medium');
    expect(headless.root).toHaveAttribute('data-shape', 'circular');
    expect(headless.root).toHaveAttribute('data-appearance', 'filled');
    expect(headless.root).toHaveAttribute('data-color', 'brand');
  },
);

test.each(['before', 'after'] as const)(
  'inherits logical icon spacing for %s content in RTL',
  async (iconPosition) => {
    const { legacy, headless } = await renderPair(
      {
        name: 'RTL count',
        props: { count: 8, size: 'extra-large', iconPosition, icon: <BadgeFixtureIcon /> },
      },
      coreaiLightTheme,
      true,
      'rtl',
    );
    expect(
      compareCounterBadgeStyles(
        captureCounterBadgeStyles(legacy),
        captureCounterBadgeStyles(headless),
      ),
    ).toEqual([]);
    expect(headless.root).toHaveAttribute('data-icon-position', iconPosition);
    expect(getComputedStyle(headless.root).direction).toBe('rtl');
  },
);

test('updates count, overflow, dot, zero visibility, and host accessibility in the shared notifications fixture', async () => {
  const screen = await renderCoreAIComponent(<CounterBadgeNotifications />);
  const root = screen.container.querySelector('.fui-CounterBadge');
  if (!(root instanceof HTMLDivElement)) throw new Error('Missing notification badge');
  expect(root).toHaveAttribute('data-hidden', '');
  await userEvent.click(screen.getByRole('button', { name: 'Receive message', exact: true }));
  expect(root.textContent).toBe('1');
  expect(root).not.toHaveAttribute('data-hidden');
  await expect
    .element(screen.getByRole('button', { name: 'Inbox, 1 unread messages' }))
    .toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Receive 100 messages' }));
  expect(root.textContent).toBe('99+');
  expect(root).toHaveAttribute('data-overflowed', '');
  await userEvent.click(screen.getByRole('button', { name: 'Dot only' }));
  expect(root.textContent).toBe('');
  expect(root).toHaveAttribute('data-dot', '');
  await userEvent.click(screen.getByRole('button', { name: 'Clear inbox' }));
  expect(root).toHaveAttribute('data-count', '0');
  expect(root).not.toHaveAttribute('data-hidden');
  await userEvent.click(screen.getByRole('button', { name: 'Dot only' }));
  expect(root).toHaveAttribute('data-hidden', '');
  await userEvent.click(screen.getByRole('button', { name: 'Show zero' }));
  expect(root.textContent).toBe('0');
  expect(root).not.toHaveAttribute('data-hidden');
  expect(root).toHaveAttribute('aria-hidden', 'true');
  expect(root).not.toHaveAttribute('aria-live');
  expect(root.tabIndex).toBe(-1);
});

test('preserves both family markers, refs, consumer content/classes/ARIA, and native events on owned slots', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const iconRef = React.createRef<HTMLSpanElement>();
  const contentRef = React.createRef<HTMLSpanElement>();
  const onClick = vi.fn();
  const onIconClick = vi.fn();
  await renderCoreAIComponent(
    <CounterBadge
      ref={rootRef}
      className="consumer-root"
      aria-label="New team updates"
      aria-live="polite"
      role="status"
      title="Team updates"
      data-consumer=""
      count={125}
      overflowCount={9}
      shape="rounded"
      size="large"
      appearance="ghost"
      color="informative"
      onClick={onClick}
      icon={{
        ref: iconRef,
        className: 'consumer-icon',
        children: <BadgeFixtureIcon />,
        onClick: onIconClick,
      }}
    >
      <span ref={contentRef} className="consumer-content">
        New
      </span>
    </CounterBadge>,
  );
  const root = rootRef.current;
  const icon = iconRef.current;
  if (!root || !icon || !contentRef.current) throw new Error('Missing CounterBadge refs');
  expect(root).toHaveClass(badgeClassNames.root, counterBadgeClassNames.root, 'consumer-root');
  expect(icon).toHaveClass(badgeClassNames.icon, counterBadgeClassNames.icon, 'consumer-icon');
  expect(contentRef.current.className).toBe('consumer-content');
  expect(root).toHaveAccessibleName('New team updates');
  expect(root).toHaveAttribute('role', 'status');
  expect(root).toHaveAttribute('aria-live', 'polite');
  expect(root).toHaveAttribute('data-count', '125');
  expect(root).toHaveAttribute('data-overflowed', '');
  expect(root).toHaveAttribute('data-consumer', '');
  expect(root).toHaveAttribute('title', 'Team updates');
  expect(root.textContent).toBe('New');
  for (const prop of [
    'appearance',
    'color',
    'shape',
    'size',
    'count',
    'overflowCount',
    'showZero',
    'dot',
  ])
    expect(root).not.toHaveAttribute(prop);
  await userEvent.click(icon);
  expect(onIconClick).toHaveBeenCalledOnce();
  expect(onClick).toHaveBeenCalledOnce();
});

test('preserves current slot render functions and permits stable variant-marker consumer overrides', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const iconRef = React.createRef<HTMLSpanElement>();
  await renderCoreAIComponent(
    <div className="counter-consumer">
      <style>{`
        .counter-consumer .fui-CounterBadge { color: rgb(15, 45, 75); border-radius: 7px; }
        .counter-consumer .fui-CounterBadge__icon { font-size: 17px; }
      `}</style>
      <CounterBadge
        ref={rootRef}
        count={8}
        aria-label="Rendered counter"
        className="consumer-root"
        children={badgeRootRenderer}
        icon={{ ref: iconRef, className: 'consumer-icon', children: badgeIconRenderer }}
      />
    </div>,
  );
  const root = rootRef.current;
  const icon = iconRef.current;
  if (!root || !icon) throw new Error('Missing rendered CounterBadge');
  expect(root).toHaveAttribute('data-rendered-root', '');
  expect(root).toHaveAttribute('data-count', '8');
  expect(root).toHaveClass(badgeClassNames.root, counterBadgeClassNames.root, 'consumer-root');
  expect(icon).toHaveAttribute('data-rendered-icon', '');
  expect(icon).toHaveClass(badgeClassNames.icon, counterBadgeClassNames.icon, 'consumer-icon');
  expect(getComputedStyle(root).color).toBe('rgb(15, 45, 75)');
  expect(getComputedStyle(root).borderRadius).toBe('7px');
  expect(getComputedStyle(icon).fontSize).toBe('17px');
  expect(root.querySelector('[data-consumer-root-child]')?.getAttribute('class')).toBeNull();
  expectTypeOf(CounterBadge).toEqualTypeOf<ForwardRefComponent<CounterBadgeProps>>();
});
