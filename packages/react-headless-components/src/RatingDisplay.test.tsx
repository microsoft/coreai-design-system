// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
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
  RatingDisplayComparison,
  RatingSummaryFlow,
  ratingDisplayConsumerExample,
  ratingDisplayExamples,
  type RatingDisplayExample,
} from '../../../apps/storybook/src/stories/experiments/RatingDisplayComparison.js';
import {
  captureRatingDisplayStyles,
  compareRatingDisplayStyles,
  getComparisonRatingDisplay,
} from '../../../apps/storybook/src/stories/experiments/compareRatingDisplayStyles.js';
import {
  assertRatingGeometry,
  getRatingItems,
  settleRatingStyles,
} from '../../../apps/storybook/src/stories/experiments/compareRatingStyles.js';
import { Rating } from './Rating.js';
import {
  RatingDisplay,
  ratingDisplayClassNames,
  type RatingDisplayProps,
  type RatingDisplaySlots,
} from './RatingDisplay.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

async function renderPair(
  example: RatingDisplayExample,
  theme = coreaiLightTheme,
  dir: 'ltr' | 'rtl' = 'ltr',
  withComponentDefaults = true,
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} dir={dir} withComponentDefaults={withComponentDefaults}>
      <RatingDisplayComparison examples={[example]} />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('Case', { exact: true }));
  const legacy = getComparisonRatingDisplay(screen.container, 'legacy');
  const headless = getComparisonRatingDisplay(screen.container, 'headless');
  await Promise.all([settleRatingStyles(legacy), settleRatingStyles(headless)]);
  assertRatingGeometry(legacy);
  assertRatingGeometry(headless);
  return { screen, legacy, headless };
}

for (const [mode, theme] of themes) {
  test.each(ratingDisplayExamples)(`matches $name at rest in ${mode} mode`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(
      compareRatingDisplayStyles(
        captureRatingDisplayStyles(legacy),
        captureRatingDisplayStyles(headless),
      ),
    ).toEqual([]);
    expect(headless.getAttribute('role')).toBe('img');
    expect(headless.querySelectorAll('input').length).toBe(0);
    for (const name of ['valueText', 'countText'] as const) {
      expect(headless.querySelector(`.fui-RatingDisplay__${name}`)?.textContent).toBe(
        legacy.querySelector(`.fui-RatingDisplay__${name}`)?.textContent,
      );
    }
    expect(
      getRatingItems(headless).every((item) => item.getAttribute('aria-hidden') === 'true'),
    ).toBe(true);
  });
}

test.each(['small', 'medium', 'large', 'extra-large'] as const)(
  'matches RTL half-filled icons and logical labels at size %s',
  async (size) => {
    const { legacy, headless } = await renderPair(
      { name: size, props: { value: 2.5, count: 1160, size, color: 'marigold' } },
      coreaiLightTheme,
      'rtl',
    );
    expect(
      compareRatingDisplayStyles(
        captureRatingDisplayStyles(legacy),
        captureRatingDisplayStyles(headless),
      ),
    ).toEqual([]);
    const label = headless.querySelector('.fui-RatingDisplay__valueText');
    if (!label) throw new Error('Missing RTL average label');
    expect(label.getBoundingClientRect().right).toBeLessThan(
      getRatingItems(headless)[0].getBoundingClientRect().right,
    );
  },
);

test('preserves the current public component and native ref contract', () => {
  expectTypeOf(RatingDisplay).toMatchTypeOf<ForwardRefComponent<RatingDisplayProps>>();
  expectTypeOf<React.ComponentPropsWithRef<typeof RatingDisplay>['ref']>().toEqualTypeOf<
    React.Ref<HTMLDivElement> | undefined
  >();
});

test('renders five owned default items with real geometry when children are omitted', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <RatingDisplay value={4} />
    </CoreAIFluentProvider>,
  );
  const root = screen.getByRole('img', { name: '4', exact: true }).element();
  const items = getRatingItems(root);
  expect(items.length).toBe(5);
  expect(items.map((item) => item.dataset.appearance)).toEqual([
    'filled',
    'filled',
    'filled',
    'filled',
    'outline',
  ]);
  for (const item of items) {
    expect(item.getBoundingClientRect().width).toBe(16);
    expect(item.getBoundingClientRect().height).toBe(16);
    expect(item.querySelectorAll('svg').length).toBe(1);
    expect(item.getAttribute('aria-hidden')).toBe('true');
  }
  expect(root.querySelectorAll('input').length).toBe(0);
});

test('keeps original numeric text, nearest-half fill and locale-formatted count accessible', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <RatingDisplay value={3.7} count={1160} />
    </CoreAIFluentProvider>,
  );
  // Chromium includes the count slot's generated divider in its native accessible name.
  const root = screen
    .getByRole('img', { name: `3.7 · ${(1160).toLocaleString()}`, exact: true })
    .element();
  expect(root.querySelector('.fui-RatingDisplay__valueText')?.textContent).toBe('3.7');
  expect(root.querySelector('.fui-RatingDisplay__countText')?.textContent).toBe(
    (1160).toLocaleString(),
  );
  expect(getRatingItems(root).map((item) => item.dataset.appearance)).toEqual([
    'filled',
    'filled',
    'filled',
    'filled-half',
    'outline',
  ]);
  expect(getRatingItems(root).map((item) => item.dataset.iconAppearance)).toEqual([
    'filled',
    'filled',
    'filled',
    'filled',
    'filled',
  ]);
  const ids = root.getAttribute('aria-labelledby')?.split(' ') ?? [];
  expect(ids.length).toBe(2);
  expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual([
    '3.7',
    (1160).toLocaleString(),
  ]);
  expect(root.querySelectorAll('input').length).toBe(0);
});

test('renders compact as one fully filled item and keeps numeric value and count unchanged', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <RatingDisplay compact value={0.5} count={0} />
    </CoreAIFluentProvider>,
  );
  const root = screen.getByRole('img', { name: '0.5 · 0', exact: true }).element();
  expect(getRatingItems(root).length).toBe(1);
  expect(getRatingItems(root)[0].dataset.appearance).toBe('filled');
  expect(root.querySelectorAll('input').length).toBe(0);
  expect(root.querySelector('.fui-RatingDisplay__countText')?.textContent).toBe('0');
});

test('allows count-only labels and null text slots without adding a dangling divider', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <RatingDisplay value={2.5} count={1160} valueText={null} />
    </CoreAIFluentProvider>,
  );
  const root = screen.getByRole('img', { name: (1160).toLocaleString(), exact: true }).element();
  expect(root.querySelector('.fui-RatingDisplay__valueText')).toBeNull();
  const count = root.querySelector('.fui-RatingDisplay__countText');
  if (!count) throw new Error('Missing count-only label');
  expect(getComputedStyle(count, '::before').content).toBe('none');
  expect(root.getAttribute('aria-labelledby')).toBe(count.id);
});

test('honors explicit root naming rather than overriding it with text-slot IDs', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <RatingDisplay aria-label="Average template satisfaction" value={4.5} count={42} />
    </CoreAIFluentProvider>,
  );
  const root = screen
    .getByRole('img', { name: 'Average template satisfaction', exact: true })
    .element();
  expect(root.hasAttribute('aria-labelledby')).toBe(false);
});

test('preserves text refs, classes, data attributes and current slot render functions', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const valueRef = React.createRef<HTMLSpanElement>();
  const countRef = React.createRef<HTMLSpanElement>();
  const valueRender: SlotRenderFunction<ExtractSlotProps<RatingDisplaySlots['valueText']>> = (
    Component,
    props,
  ) => <Component {...props} data-rendered-rating-value="" />;
  const countRender: SlotRenderFunction<ExtractSlotProps<RatingDisplaySlots['countText']>> = (
    Component,
    props,
  ) => <Component {...props} data-rendered-rating-count="" />;
  const valueText: ExtractSlotProps<RatingDisplaySlots['valueText']> & {
    'data-consumer-value': string;
  } = {
    ref: valueRef,
    className: 'consumer-value',
    children: valueRender,
    'data-consumer-value': 'kept',
  };
  const countText: ExtractSlotProps<RatingDisplaySlots['countText']> & {
    'data-consumer-count': string;
  } = {
    ref: countRef,
    className: 'consumer-count',
    children: countRender,
    'data-consumer-count': 'kept',
  };
  const rootRender: SlotRenderFunction<ExtractSlotProps<RatingDisplaySlots['root']>> = (
    Component,
    props,
  ) => <Component {...props} data-rendered-rating-display="" />;
  const screen = await render(
    <CoreAIFluentProvider>
      <RatingDisplay
        ref={rootRef}
        className="consumer-display"
        data-consumer-display="kept"
        value={0.5}
        count={42}
        valueText={valueText}
        countText={countText}
      >
        {rootRender}
      </RatingDisplay>
    </CoreAIFluentProvider>,
  );
  const root = screen.getByRole('img', { name: '0.5 · 42', exact: true }).element();
  expect(rootRef.current).toBe(root);
  expect(root.classList.contains(ratingDisplayClassNames.root)).toBe(true);
  expect(root.classList.contains('consumer-display')).toBe(true);
  expect(root.dataset.consumerDisplay).toBe('kept');
  expect(root.dataset.renderedRatingDisplay).toBe('');
  expect(getRatingItems(root).length).toBe(5);
  expect(getRatingItems(root)[0].dataset.appearance).toBe('filled-half');
  expect(getComputedStyle(getRatingItems(root)[0]).width).toBe('16px');
  for (const [element, marker, consumer, dataKey, renderKey] of [
    [
      valueRef.current,
      ratingDisplayClassNames.valueText,
      'consumer-value',
      'consumerValue',
      'renderedRatingValue',
    ],
    [
      countRef.current,
      ratingDisplayClassNames.countText,
      'consumer-count',
      'consumerCount',
      'renderedRatingCount',
    ],
  ] as const) {
    expect(element?.classList.contains(marker)).toBe(true);
    expect(element?.classList.contains(consumer)).toBe(true);
    expect(element?.dataset[dataKey]).toBe('kept');
    expect(element?.dataset[renderKey]).toBe('');
    expect(element?.getAttribute('aria-hidden')).toBe('true');
  }
  expect(valueRef.current?.textContent).toBe('0.5');
  expect(countRef.current?.textContent).toBe('42');
});

test('does not overwrite explicit empty children with default items', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <RatingDisplay value={2.5} count={42}>
        {[]}
      </RatingDisplay>
    </CoreAIFluentProvider>,
  );
  const root = screen.getByRole('img', { name: '2.5 · 42', exact: true }).element();
  expect(getRatingItems(root).length).toBe(0);
  expect(root.querySelector('.fui-RatingDisplay__valueText')?.textContent).toBe('2.5');
});

test('shares the RatingItem foundation without leaking interactive behavior or visual context', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <Rating
        aria-label="Input rating"
        color="brand"
        size="extra-large"
        defaultValue={2.5}
        step={0.5}
      />
      <RatingDisplay
        aria-label="Read-only average"
        color="marigold"
        size="small"
        value={2.5}
        count={42}
      />
      <RatingDisplay aria-label="Default average" value={3} />
      <Rating aria-label="Default input" />
    </CoreAIFluentProvider>,
  );
  const input = screen.getByRole('radiogroup', { name: 'Input rating', exact: true }).element();
  const display = screen.getByRole('img', { name: 'Read-only average', exact: true }).element();
  const defaultDisplay = screen
    .getByRole('img', { name: 'Default average', exact: true })
    .element();
  const defaultInput = screen
    .getByRole('radiogroup', { name: 'Default input', exact: true })
    .element();
  expect(getRatingItems(input)[0].dataset.size).toBe('extra-large');
  expect(getRatingItems(input)[0].dataset.color).toBe('brand');
  expect(getComputedStyle(getRatingItems(input)[0]).width).toBe('28px');
  expect(getRatingItems(display)[0].dataset.size).toBe('small');
  expect(getRatingItems(display)[0].dataset.color).toBe('marigold');
  expect(getComputedStyle(getRatingItems(display)[0]).width).toBe('12px');
  expect(display.querySelectorAll('input').length).toBe(0);
  expect(input.querySelectorAll('input').length).toBe(10);
  expect(getRatingItems(defaultDisplay)[0].dataset.size).toBe('medium');
  expect(getRatingItems(defaultDisplay)[0].dataset.color).toBe('neutral');
  expect(getRatingItems(defaultInput)[0].dataset.size).toBe('extra-large');
  expect(getRatingItems(defaultInput)[0].dataset.color).toBe('neutral');
});

test('updates the read-only review summary and preserves the current accessible text', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <RatingSummaryFlow />
    </CoreAIFluentProvider>,
  );
  const initialName = `3.7 · ${(1160).toLocaleString()}`;
  await expect.element(screen.getByRole('img', { name: initialName, exact: true })).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Show recent reviews', exact: true }));
  const recent = screen.getByRole('img', { name: '4.2 · 204', exact: true }).element();
  expect(getRatingItems(recent).map((item) => item.dataset.appearance)).toEqual([
    'filled',
    'filled',
    'filled',
    'filled',
    'outline',
  ]);
  expect(recent.querySelectorAll('input').length).toBe(0);
  await userEvent.click(screen.getByRole('button', { name: 'Show all reviews', exact: true }));
  await expect.element(screen.getByRole('img', { name: initialName, exact: true })).toBeVisible();
  await expect
    .element(screen.getByRole('status', { name: 'Review sample', exact: true }))
    .toHaveTextContent('All reviews');
});

test('has no CoreAI defaults to opt out of and preserves unlayered consumer label priority', async () => {
  const pair = await renderPair(ratingDisplayExamples[0], coreaiLightTheme, 'ltr', false);
  expect(
    compareRatingDisplayStyles(
      captureRatingDisplayStyles(pair.legacy),
      captureRatingDisplayStyles(pair.headless),
    ),
  ).toEqual([]);
  expect(pair.headless.dataset.size).toBe('medium');
  await cleanup();
  const { headless } = await renderPair(ratingDisplayConsumerExample);
  const value = headless.querySelector('.fui-RatingDisplay__valueText');
  const count = headless.querySelector('.fui-RatingDisplay__countText');
  if (!value || !count) throw new Error('Missing consumer labels');
  expect(getComputedStyle(headless).gap).toBe('3px');
  expect(getComputedStyle(value).fontSize).toBe('18px');
  expect(getComputedStyle(value).lineHeight).toBe('26px');
  expect(getComputedStyle(value).marginInlineStart).toBe('10px');
  expect(getComputedStyle(value).color).toBe('rgb(100, 40, 120)');
  expect(getComputedStyle(count).color).toBe('rgb(20, 90, 110)');
  expect(getComputedStyle(count, '::before').content).toBe('"/ "');
});
