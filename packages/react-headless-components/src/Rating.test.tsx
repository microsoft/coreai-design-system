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
  RatingComparison,
  RatingInputFlow,
  ratingColors,
  ratingConsumerExample,
  ratingExamples,
  type RatingExample,
} from '../../../apps/storybook/src/stories/experiments/RatingComparison.js';
import {
  assertRatingGeometry,
  captureRatingStyles,
  compareRatingStyles,
  getComparisonRating,
  getRatingItems,
  settleRatingStyles,
} from '../../../apps/storybook/src/stories/experiments/compareRatingStyles.js';
import { Rating, ratingClassNames, type RatingProps, type RatingSlots } from './Rating.js';
import {
  RatingItem,
  ratingItemClassNames,
  type RatingItemProps,
  type RatingItemSlots,
} from './RatingItem.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

async function renderPair(
  example: RatingExample,
  theme = coreaiLightTheme,
  dir: 'ltr' | 'rtl' = 'ltr',
  withComponentDefaults = true,
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} dir={dir} withComponentDefaults={withComponentDefaults}>
      <RatingComparison examples={[example]} />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('Case', { exact: true }));
  const legacy = getComparisonRating(screen.container, 'legacy');
  const headless = getComparisonRating(screen.container, 'headless');
  await Promise.all([settleRatingStyles(legacy), settleRatingStyles(headless)]);
  assertRatingGeometry(legacy);
  assertRatingGeometry(headless);
  return { screen, legacy, headless };
}

function radio(root: ParentNode, value: number): HTMLInputElement {
  const input = root.querySelector<HTMLInputElement>(`input[type="radio"][value="${value}"]`);
  if (!input) throw new Error(`Missing native rating radio ${value}`);
  return input;
}

for (const [mode, theme] of themes) {
  test.each(ratingExamples)(`matches $name at rest in ${mode} mode`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(compareRatingStyles(captureRatingStyles(legacy), captureRatingStyles(headless))).toEqual(
      [],
    );
    expect(headless.getAttribute('role')).toBe('radiogroup');
    const oldInputs = [...legacy.querySelectorAll<HTMLInputElement>('input')];
    const inputs = [...headless.querySelectorAll<HTMLInputElement>('input')];
    expect(
      inputs.map((input) => [
        input.value,
        input.checked,
        input.disabled,
        input.getAttribute('aria-label'),
      ]),
    ).toEqual(
      oldInputs.map((input) => [
        input.value,
        input.checked,
        input.disabled,
        input.getAttribute('aria-label'),
      ]),
    );
    expect(inputs[0].name).not.toBe(oldInputs[0].name);
  });

  test.each(ratingColors)(
    `matches %s pointer hover without committing in ${mode}`,
    async (color) => {
      const { screen, legacy, headless } = await renderPair(
        { name: color, props: { color, step: 0.5, defaultValue: 2.5 } },
        theme,
      );
      await userEvent.hover(radio(legacy, 4));
      expect(radio(legacy, 4).matches(':hover')).toBe(true);
      await settleRatingStyles(legacy);
      const hovered = captureRatingStyles(legacy);
      await userEvent.hover(radio(headless, 4));
      expect(radio(headless, 4).matches(':hover')).toBe(true);
      await settleRatingStyles(headless);
      expect(compareRatingStyles(hovered, captureRatingStyles(headless))).toEqual([]);
      expect(radio(headless, 2.5).checked).toBe(true);
      expect(radio(headless, 4).checked).toBe(false);
      expect(getRatingItems(headless)[3].dataset.appearance).toBe('filled');
      await userEvent.hover(screen.getByText('Case', { exact: true }));
      expect(headless.matches(':hover')).toBe(false);
      expect(getRatingItems(headless)[2].dataset.appearance).toBe('filled-half');
      expect(getRatingItems(headless)[3].dataset.appearance).toBe('outline');
    },
  );

  test(`matches keyboard-focus and combined hover focus in ${mode}`, async () => {
    const { screen, legacy, headless } = await renderPair(
      { name: 'Focused half rating', props: { defaultValue: 2.5, step: 0.5 } },
      theme,
    );
    const parking = screen.getByText('Case', { exact: true });
    // The first Tab can enter Browser Mode's iframe before legacy Keyborg sees a keydown.
    // Traverse inside the document before comparing its keyboard-only focus-within outline.
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    expect(document.activeElement).toBe(radio(legacy, 2.5));
    expect(legacy.matches(':hover')).toBe(false);
    expect(radio(legacy, 2.5).matches(':focus-visible')).toBe(true);
    await settleRatingStyles(legacy);
    const focused = captureRatingStyles(legacy);
    expect(focused['item[2].after.content']).toBe('""');
    await userEvent.hover(radio(legacy, 2.5));
    await settleRatingStyles(legacy);
    const focusedHover = captureRatingStyles(legacy);

    await userEvent.hover(parking);
    await userEvent.tab();
    expect(document.activeElement).toBe(radio(headless, 2.5));
    expect(headless.matches(':hover')).toBe(false);
    expect(radio(headless, 2.5).matches(':focus-visible')).toBe(true);
    await settleRatingStyles(headless);
    expect(compareRatingStyles(focused, captureRatingStyles(headless))).toEqual([]);
    await userEvent.hover(radio(headless, 2.5));
    expect(headless.matches(':hover')).toBe(true);
    expect(radio(headless, 2.5).matches(':focus-visible')).toBe(true);
    await settleRatingStyles(headless);
    const nativeFocusedHover = captureRatingStyles(headless);
    expect(compareRatingStyles(focused, nativeFocusedHover)).toEqual([]);
    expect(compareRatingStyles(focusedHover, nativeFocusedHover)).toEqual([]);
    expect(nativeFocusedHover['item[2].after.content']).toBe('""');
  });
}

test.each(ratingColors)(
  'keeps logical half-hit targets and glyph clipping in RTL: %s',
  async (color) => {
    const { legacy, headless } = await renderPair(
      { name: color, props: { color, size: 'large', defaultValue: 2.5, step: 0.5 } },
      coreaiLightTheme,
      'rtl',
    );
    expect(compareRatingStyles(captureRatingStyles(legacy), captureRatingStyles(headless))).toEqual(
      [],
    );
    const half = radio(headless, 2.5).getBoundingClientRect();
    const full = radio(headless, 3).getBoundingClientRect();
    expect(half.left).toBeGreaterThan(full.left);
    await userEvent.click(radio(headless, 3.5));
    expect(radio(headless, 3.5).checked).toBe(true);
    expect(getRatingItems(headless)[3].dataset.appearance).toBe('filled-half');
  },
);

test('preserves current public ForwardRefComponent and native slot types', () => {
  expectTypeOf(Rating).toMatchTypeOf<ForwardRefComponent<RatingProps>>();
  expectTypeOf(RatingItem).toMatchTypeOf<ForwardRefComponent<RatingItemProps>>();
  expectTypeOf<React.ComponentPropsWithRef<typeof Rating>['ref']>().toEqualTypeOf<
    React.Ref<HTMLDivElement> | undefined
  >();
  expectTypeOf<React.ComponentPropsWithRef<typeof RatingItem>['ref']>().toEqualTypeOf<
    React.Ref<HTMLSpanElement> | undefined
  >();
});

test('commits uncontrolled native radios and preserves the exact public change payload', async () => {
  const onChange = vi.fn<NonNullable<RatingProps['onChange']>>();
  const onMouseOver = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <span>Pointer parking</span>
      <Rating
        aria-label="Rate documentation"
        name="documentation-rating"
        defaultValue={2}
        itemLabel={(value) => `${value} points`}
        onChange={onChange}
        onMouseOver={onMouseOver}
      />
    </CoreAIFluentProvider>,
  );
  const group = screen
    .getByRole('radiogroup', { name: 'Rate documentation', exact: true })
    .element();
  expect(radio(group, 2).checked).toBe(true);
  await userEvent.hover(screen.getByText('Pointer parking', { exact: true }));
  await userEvent.hover(radio(group, 5));
  expect(onMouseOver).toHaveBeenCalled();
  expect(onChange).not.toHaveBeenCalled();
  expect(radio(group, 2).checked).toBe(true);
  await userEvent.click(screen.getByRole('radio', { name: '4 points', exact: true }));
  expect(onChange).toHaveBeenCalledTimes(1);
  const [event, data] = onChange.mock.calls[0];
  expect(Object.keys(data).sort()).toEqual(['event', 'type', 'value']);
  expect(data.type).toBe('change');
  expect(data.value).toBe(4);
  expect(data.event).toBe(event);
  expect(event.target).toBe(radio(group, 4));
  expect(radio(group, 4).checked).toBe(true);
  expect(radio(group, 2).checked).toBe(false);
  expect(radio(group, 4).name).toBe('documentation-rating');
});

test('keeps half-precision keyboard selection native and reports every arrow transition', async () => {
  const onChange = vi.fn<NonNullable<RatingProps['onChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <span>Pointer parking</span>
      <Rating aria-label="Keyboard rating" defaultValue={2.5} step={0.5} onChange={onChange} />
    </CoreAIFluentProvider>,
  );
  const root = screen.getByRole('radiogroup', { name: 'Keyboard rating', exact: true }).element();
  await userEvent.hover(screen.getByText('Pointer parking', { exact: true }));
  await userEvent.tab();
  expect(document.activeElement).toBe(radio(root, 2.5));
  expect(root.matches(':hover')).toBe(false);
  for (const [key, value] of [
    ['{ArrowRight}', 3],
    ['{ArrowDown}', 3.5],
    ['{ArrowLeft}', 3],
    ['{ArrowUp}', 2.5],
  ] as const) {
    await userEvent.keyboard(key);
    expect(document.activeElement).toBe(radio(root, value));
    expect(radio(root, value).checked).toBe(true);
    expect(onChange.mock.lastCall?.[1].value).toBe(value);
  }
  expect(onChange.mock.calls.map((call) => call[1].value)).toEqual([3, 3.5, 3, 2.5]);
  expect(root.hasAttribute('focusgroup')).toBe(false);
  expect(getRatingItems(root)[2].dataset.appearance).toBe('filled-half');
});

test('keeps controlled values, native form data and application clearing in one model', async () => {
  const onChange = vi.fn<NonNullable<RatingProps['onChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <RatingInputFlow onChange={onChange} />
    </CoreAIFluentProvider>,
  );
  await userEvent.click(screen.getByRole('radio', { name: '4.5 out of 5', exact: true }));
  await expect
    .element(screen.getByRole('status', { name: 'Your rating', exact: true }))
    .toHaveTextContent('Your rating: 4.5 / 5');
  expect(onChange.mock.calls.map((call) => call[1].value)).toEqual([4.5]);
  await userEvent.click(screen.getByRole('button', { name: 'Send rating', exact: true }));
  await expect
    .element(screen.getByRole('status', { name: 'Submitted rating', exact: true }))
    .toHaveTextContent('Submitted rating: 4.5');
  await userEvent.click(screen.getByRole('button', { name: 'Clear rating', exact: true }));
  const group = screen
    .getByRole('radiogroup', { name: 'Rate this template', exact: true })
    .element();
  expect(
    [...group.querySelectorAll<HTMLInputElement>('input')].every((input) => !input.checked),
  ).toBe(true);
  expect(getRatingItems(group).every((item) => item.dataset.appearance === 'outline')).toBe(true);
  expect(onChange).toHaveBeenCalledTimes(1);
});

test('does not replace a controlled value when its owner declines the change', async () => {
  const onChange = vi.fn<NonNullable<RatingProps['onChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <Rating aria-label="Controlled rating" value={1} onChange={onChange} />
    </CoreAIFluentProvider>,
  );
  await userEvent.click(screen.getByRole('radio', { name: '4', exact: true }));
  const root = screen.getByRole('radiogroup', { name: 'Controlled rating', exact: true }).element();
  expect(onChange.mock.calls.map((call) => call[1].value)).toEqual([4]);
  expect(radio(root, 1).checked).toBe(true);
  expect(radio(root, 4).checked).toBe(false);
});

test('honors native disabled item slots without inventing a root disabled prop', async () => {
  const onChange = vi.fn<NonNullable<RatingProps['onChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <span>Pointer parking</span>
      <Rating aria-label="Partially disabled rating" defaultValue={1} onChange={onChange}>
        <RatingItem value={1} />
        <RatingItem value={2} fullValueInput={{ disabled: true }} />
        <RatingItem value={3} />
      </Rating>
    </CoreAIFluentProvider>,
  );
  const root = screen
    .getByRole('radiogroup', { name: 'Partially disabled rating', exact: true })
    .element();
  expect(radio(root, 2).disabled).toBe(true);
  await userEvent.hover(screen.getByText('Pointer parking', { exact: true }));
  await userEvent.tab();
  expect(document.activeElement).toBe(radio(root, 1));
  await userEvent.keyboard('{ArrowRight}');
  expect(document.activeElement).toBe(radio(root, 3));
  expect(radio(root, 3).checked).toBe(true);
  expect(onChange.mock.calls.map((call) => call[1].value)).toEqual([3]);
});

test('preserves resolved refs, render functions, data attributes and consumer slot classes', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const itemRef = React.createRef<HTMLSpanElement>();
  const selectedRef = React.createRef<HTMLDivElement>();
  const unselectedRef = React.createRef<HTMLDivElement>();
  const halfRef = React.createRef<HTMLInputElement>();
  const fullRef = React.createRef<HTMLInputElement>();
  const inputChange = vi.fn();
  const onChange = vi.fn<NonNullable<RatingProps['onChange']>>();
  const rootRender: SlotRenderFunction<ExtractSlotProps<RatingSlots['root']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-rendered-rating-root="">
      <RatingItem
        ref={itemRef}
        value={1}
        className="consumer-item"
        selectedIcon={selected}
        unselectedIcon={{
          className: 'consumer-unselected',
          ref: unselectedRef,
          children: iconRender,
        }}
        halfValueInput={half}
        fullValueInput={{ ref: fullRef, className: 'consumer-full', onChange: inputChange }}
        data-consumer-item="kept"
        children={itemRender}
      />
    </Component>
  );
  const iconRender: SlotRenderFunction<ExtractSlotProps<RatingItemSlots['selectedIcon']>> = (
    Component,
    props,
  ) => <Component {...props} data-rendered-rating-icon="" />;
  const itemRender: SlotRenderFunction<ExtractSlotProps<RatingItemSlots['root']>> = (
    Component,
    props,
  ) => <Component {...props} data-rendered-rating-item="" />;
  const selected: ExtractSlotProps<RatingItemSlots['selectedIcon']> & {
    'data-consumer-selected': string;
  } = {
    ref: selectedRef,
    className: 'consumer-selected',
    'data-consumer-selected': 'kept',
    children: iconRender,
  };
  const half: ExtractSlotProps<RatingItemSlots['halfValueInput']> & {
    'data-consumer-half': string;
  } = { ref: halfRef, className: 'consumer-half', 'data-consumer-half': 'kept' };
  const screen = await render(
    <CoreAIFluentProvider>
      <Rating
        ref={rootRef}
        aria-label="Slot contract"
        step={0.5}
        value={0.5}
        className="consumer-root"
        onChange={onChange}
        data-consumer-root="kept"
      >
        {rootRender}
      </Rating>
    </CoreAIFluentProvider>,
  );
  const root = screen.getByRole('radiogroup', { name: 'Slot contract', exact: true }).element();
  expect(rootRef.current).toBe(root);
  expect(root.classList.contains(ratingClassNames.root)).toBe(true);
  expect(root.classList.contains('consumer-root')).toBe(true);
  expect(root.dataset.consumerRoot).toBe('kept');
  expect(root.dataset.renderedRatingRoot).toBe('');
  const item = getRatingItems(root)[0];
  expect(itemRef.current).toBe(item);
  expect(item.classList.contains(ratingItemClassNames.root)).toBe(true);
  expect(item.classList.contains('consumer-item')).toBe(true);
  expect(item.dataset.consumerItem).toBe('kept');
  expect(item.dataset.renderedRatingItem).toBe('');
  expect(selectedRef.current?.dataset.consumerSelected).toBe('kept');
  expect(selectedRef.current?.dataset.renderedRatingIcon).toBe('');
  expect(unselectedRef.current?.dataset.renderedRatingIcon).toBe('');
  expect(halfRef.current).toBe(radio(root, 0.5));
  expect(fullRef.current).toBe(radio(root, 1));
  expect(halfRef.current?.dataset.consumerHalf).toBe('kept');
  for (const [element, marker, consumer] of [
    [selectedRef.current, ratingItemClassNames.selectedIcon, 'consumer-selected'],
    [unselectedRef.current, ratingItemClassNames.unselectedIcon, 'consumer-unselected'],
    [halfRef.current, ratingItemClassNames.halfValueInput, 'consumer-half'],
    [fullRef.current, ratingItemClassNames.fullValueInput, 'consumer-full'],
  ] as const) {
    expect(element?.classList.contains(marker)).toBe(true);
    expect(element?.classList.contains(consumer)).toBe(true);
  }
  await userEvent.click(radio(root, 1));
  expect(inputChange).toHaveBeenCalledTimes(1);
  expect(onChange.mock.calls.map((call) => call[1].value)).toEqual([1]);
});

test('keeps custom glyphs caller-owned and applies no private glyph classes to them', async () => {
  function ConsumerIcon() {
    return <svg className="consumer-glyph" data-consumer-glyph="" width="1em" height="1em" />;
  }
  const screen = await render(
    <CoreAIFluentProvider>
      <div>Pointer parking</div>
      <Rating
        aria-label="Custom symbols"
        value={1.5}
        step={0.5}
        iconFilled={ConsumerIcon}
        iconOutline={ConsumerIcon}
      />
    </CoreAIFluentProvider>,
  );
  const root = screen.getByRole('radiogroup', { name: 'Custom symbols' }).element();
  if (!(root instanceof HTMLElement)) throw new Error('Expected a native Rating root');
  await userEvent.hover(radio(root, 1));
  await settleRatingStyles(root);
  expect(root.querySelector('[data-appearance="filled-half"]')).toBeNull();
  await userEvent.hover(screen.getByText('Pointer parking', { exact: true }));
  expect(root.matches(':hover')).toBe(false);
  await settleRatingStyles(root);
  expect(root.querySelector('[data-appearance="filled-half"]')).not.toBeNull();
  const glyphs = [...screen.container.querySelectorAll<SVGElement>('[data-consumer-glyph]')];
  expect(glyphs.length).toBe(6);
  expect(glyphs.every((glyph) => glyph.getAttribute('class') === 'consumer-glyph')).toBe(true);
});

test('keeps native Rating interactive without an onChange handler', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <Rating aria-label="Unobserved rating" />
    </CoreAIFluentProvider>,
  );
  await userEvent.click(screen.getByRole('radio', { name: '3', exact: true }));
  await expect.element(screen.getByRole('radio', { name: '3', exact: true })).toBeChecked();
});

test('has no CoreAI defaults to disable and lets ordinary consumer CSS win', async () => {
  const pair = await renderPair(ratingExamples[2], coreaiLightTheme, 'ltr', false);
  expect(
    compareRatingStyles(captureRatingStyles(pair.legacy), captureRatingStyles(pair.headless)),
  ).toEqual([]);
  expect(pair.headless.dataset.size).toBe('extra-large');
  await cleanup();
  const { headless } = await renderPair(ratingConsumerExample);
  expect(getComputedStyle(headless).gap).toBe('6px');
  const items = getRatingItems(headless);
  expect(getComputedStyle(items[0]).width).toBe('34px');
  expect(getComputedStyle(items[0]).height).toBe('34px');
  const selected = items[0].querySelector('.fui-RatingItem__selectedIcon');
  const unselected = items[2].querySelector('.fui-RatingItem__unselectedIcon');
  if (!selected || !unselected) throw new Error('Missing consumer icon slots');
  expect(getComputedStyle(selected).color).toBe('rgb(120, 40, 80)');
  expect(getComputedStyle(unselected).color).toBe('rgb(20, 90, 110)');
  expect(getComputedStyle(radio(headless, 1)).cursor).toBe('crosshair');
});

test('keeps tiny geometry differences, CSS strings, offsets and missing slots observable', () => {
  expect(
    compareRatingStyles(
      {
        'root.rect.width': '28.00',
        'item.offset-left': '0.00',
        color: 'rgb(0, 0, 0)',
        missing: '',
      },
      { 'root.rect.width': '28.01', 'item.offset-left': '0.01', color: 'rgb(1, 0, 0)' },
    ).map((difference) => difference.property),
  ).toEqual(['root.rect.width', 'item.offset-left', 'color', 'missing']);
});
