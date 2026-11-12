// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../../apps/storybook/src/stories/experiments/HeadlessTestUtils.js';
import { Slider } from './Slider.js';
import {
  RangeSlider,
  rangeSliderClassNames,
  type RangeSliderOnChangeData,
  type RangeSliderProps,
} from './RangeSlider.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

function getSlots(container: HTMLElement) {
  const get = (className: string) => {
    const element = container.querySelector<HTMLElement>(`.${className}`);
    if (!element) throw new Error(`Missing ${className}`);
    return element;
  };
  return {
    root: get(rangeSliderClassNames.root),
    rail: get(rangeSliderClassNames.rail),
    startThumb: get(rangeSliderClassNames.startThumb),
    endThumb: get(rangeSliderClassNames.endThumb),
    startInput: get(rangeSliderClassNames.startInput) as HTMLInputElement,
    endInput: get(rangeSliderClassNames.endInput) as HTMLInputElement,
  };
}

async function renderRangeSlider(
  props: RangeSliderProps = {},
  {
    dir = 'ltr',
    theme = coreaiLightTheme,
  }: { dir?: 'ltr' | 'rtl'; theme?: typeof coreaiLightTheme } = {},
) {
  const screen = await renderCoreAIComponent(
    <>
      <button type="button">Before range</button>
      <RangeSlider
        aria-label="Range"
        startInput={{ 'aria-label': 'Minimum' }}
        endInput={{ 'aria-label': 'Maximum' }}
        {...props}
        style={props.vertical ? { height: 180 } : { width: 240 }}
      />
    </>,
    { providerProps: { theme, dir } },
  );
  return { screen, ...getSlots(screen.container) };
}

function thumbCenter(thumb: HTMLElement) {
  const box = thumb.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

/** Distance of the thumb center from the rail's start edge, in the visual direction of travel. */
function thumbOffset(rail: HTMLElement, thumb: HTMLElement, vertical: boolean, rtl: boolean) {
  const railBox = rail.getBoundingClientRect();
  const center = thumbCenter(thumb);
  if (vertical) return railBox.bottom - center.y;
  return rtl ? railBox.right - center.x : center.x - railBox.left;
}

function expectedOffset(travel: number, progress: number, innerRadius: number) {
  return Math.min(travel - innerRadius, Math.max(innerRadius, (travel * progress) / 100));
}

test('renders the headless slots in order with class names, roles, and native inputs', async () => {
  const { root, rail, startThumb, endThumb, startInput, endInput } = await renderRangeSlider({
    defaultValue: { start: 20, end: 70 },
    name: 'price',
  });

  expect(root.getAttribute('role')).toBe('group');
  expect(root.getAttribute('aria-label')).toBe('Range');
  expect([...root.children]).toEqual([rail, startThumb, endThumb]);
  expect(startThumb.firstElementChild).toBe(startInput);
  expect(endThumb.firstElementChild).toBe(endInput);
  expect(startThumb.getAttribute('role')).toBe('presentation');
  for (const input of [startInput, endInput]) {
    expect(input.type).toBe('range');
    expect(input.name).toBe('price');
  }
  expect(startInput.getAttribute('aria-label')).toBe('Minimum');
  expect(endInput.getAttribute('aria-label')).toBe('Maximum');
  expect([startInput.min, startInput.max, startInput.value]).toEqual(['0', '70', '20']);
  expect([endInput.min, endInput.max, endInput.value]).toEqual(['20', '100', '70']);
  expect(root.getAttribute('data-size')).toBe('medium');
  for (const [slot, element] of Object.entries({
    root,
    rail,
    startThumb,
    endThumb,
    startInput,
    endInput,
  })) {
    expect(element.classList).toContain(
      rangeSliderClassNames[slot as keyof typeof rangeSliderClassNames],
    );
  }
});

test('exposes headless data attributes and resolved progress variables', async () => {
  const { root, startThumb, endThumb } = await renderRangeSlider({
    min: 0,
    max: 10,
    step: 2,
    defaultValue: { start: 2, end: 6 },
  });

  expect(root.style.getPropertyValue('--fui-RangeSlider--start-progress')).toBe('20%');
  expect(root.style.getPropertyValue('--fui-RangeSlider--end-progress')).toBe('60%');
  expect(root.style.getPropertyValue('--fui-RangeSlider--steps-percent')).toBe('20%');
  expect(root.style.getPropertyValue('--fui-RangeSlider--direction')).toBe('90deg');
  expect(root.hasAttribute('data-disabled')).toBe(false);
  expect(root.hasAttribute('data-vertical')).toBe(false);
  expect(root.hasAttribute('data-thumbs-overlap')).toBe(false);
  expect(startThumb.hasAttribute('data-active')).toBe(true);
  expect(endThumb.hasAttribute('data-active')).toBe(false);
  expect(getComputedStyle(root).touchAction).toBe('none');
  expect(getComputedStyle(root).cursor).toBe('pointer');
});

test.each([
  ['medium', false, 'ltr', 20, 6, 4, 32],
  ['small', false, 'ltr', 16, 5, 2, 24],
  ['medium', false, 'rtl', 20, 6, 4, 32],
  ['medium', true, 'ltr', 20, 6, 4, 120],
  ['small', true, 'rtl', 16, 5, 2, 120],
] as const)(
  'positions %s thumbs (vertical=%s, %s) within the rail',
  async (size, vertical, dir, thumbSize, innerRadius, railSize, minBlock) => {
    for (const [start, end] of [
      [0, 100],
      [25, 60],
    ]) {
      const { rail, root, startThumb, endThumb, startInput } = await renderRangeSlider(
        { size, vertical, value: { start, end } },
        { dir },
      );
      const railBox = rail.getBoundingClientRect();
      const travel = vertical ? railBox.height : railBox.width;
      expect(vertical ? railBox.width : railBox.height).toBe(railSize);
      expect(Number.parseFloat(getComputedStyle(root).minHeight)).toBe(minBlock);
      for (const [thumb, progress] of [
        [startThumb, start],
        [endThumb, end],
      ] as const) {
        const box = thumb.getBoundingClientRect();
        expect(box.width).toBe(thumbSize);
        expect(box.height).toBe(thumbSize);
        expect(thumbOffset(rail, thumb, vertical, dir === 'rtl')).toBeCloseTo(
          expectedOffset(travel, progress, innerRadius),
          1,
        );
      }
      if (vertical) {
        expect(getComputedStyle(startInput).writingMode).toBe('vertical-lr');
        expect(getComputedStyle(startInput).direction).toBe('rtl');
      }
      await cleanup();
    }
  },
);

test.each(themes)(
  'shares rail and thumb tokens with the headless Slider in %s theme',
  async (_name, theme) => {
    const screen = await renderCoreAIComponent(
      <>
        <RangeSlider
          aria-label="Range"
          defaultValue={{ start: 0, end: 50 }}
          style={{ width: 240 }}
        />
        <Slider aria-label="Single" defaultValue={50} style={{ width: 240 }} />
        <RangeSlider
          aria-label="Disabled range"
          disabled
          defaultValue={{ start: 0, end: 50 }}
          style={{ width: 240 }}
          className="disabled-range"
        />
        <Slider
          aria-label="Disabled single"
          disabled
          defaultValue={50}
          style={{ width: 240 }}
          className="disabled-single"
        />
      </>,
      { providerProps: { theme } },
    );
    const range = getSlots(screen.container);
    const sliderThumb = screen.container.querySelector<HTMLElement>('.fui-Slider__thumb')!;
    const sliderRail = screen.container.querySelector<HTMLElement>('.fui-Slider__rail')!;
    const thumbProperties = ['background-color', 'box-shadow', 'border-radius', 'width', 'height'];
    for (const property of thumbProperties) {
      expect(getComputedStyle(range.endThumb).getPropertyValue(property), property).toBe(
        getComputedStyle(sliderThumb).getPropertyValue(property),
      );
    }
    expect(getComputedStyle(range.endThumb, '::before').borderTopColor).toBe(
      getComputedStyle(sliderThumb, '::before').borderTopColor,
    );
    for (const property of ['border-radius', 'height', 'outline-color', 'outline-width']) {
      expect(getComputedStyle(range.rail).getPropertyValue(property), property).toBe(
        getComputedStyle(sliderRail).getPropertyValue(property),
      );
    }
    // With start at 0, the range gradient's progress then rail segments match the single slider.
    const sliderColors = getComputedStyle(sliderRail).backgroundImage.match(/rgba?\([^)]+\)/g);
    const rangeColors = getComputedStyle(range.rail).backgroundImage.match(/rgba?\([^)]+\)/g);
    expect(rangeColors?.slice(2)).toEqual(sliderColors?.slice(0, 3));

    const disabledRoot = screen.container.querySelector<HTMLElement>('.disabled-range')!;
    const disabledSliderThumb = screen.container.querySelector<HTMLElement>(
      '.disabled-single .fui-Slider__thumb',
    )!;
    const disabledStartThumb = disabledRoot.querySelector<HTMLElement>(
      `.${rangeSliderClassNames.startThumb}`,
    )!;
    expect(getComputedStyle(disabledStartThumb).backgroundColor).toBe(
      getComputedStyle(disabledSliderThumb).backgroundColor,
    );
    expect(getComputedStyle(disabledStartThumb, '::before').borderTopColor).toBe(
      getComputedStyle(disabledSliderThumb, '::before').borderTopColor,
    );
    expect(getComputedStyle(disabledRoot).cursor).toBe('default');
  },
);

test('keeps the native inputs hidden and out of pointer hit testing', async () => {
  const { startInput, endInput, startThumb } = await renderRangeSlider();
  for (const input of [startInput, endInput]) {
    const style = getComputedStyle(input);
    expect(style.pointerEvents).toBe('none');
    expect(style.opacity).toBe('0');
    expect(style.position).toBe('absolute');
    expect(input.getBoundingClientRect().width).toBe(startThumb.getBoundingClientRect().width);
  }
  expect(getComputedStyle(startThumb).pointerEvents).toBe('auto');
  const { x, y } = thumbCenter(startThumb);
  expect(document.elementFromPoint(x, y)).toBe(startThumb);
});

test('steps each thumb with the keyboard and keeps the thumbs ordered', async () => {
  const onChange = vi.fn<(event: unknown, data: RangeSliderOnChangeData) => void>();
  const { screen, startInput, endInput } = await renderRangeSlider({
    defaultValue: { start: 20, end: 30 },
    step: 5,
    onChange,
  });

  await userEvent.click(screen.getByRole('button', { name: 'Before range' }));
  await userEvent.tab();
  expect(document.activeElement).toBe(startInput);
  await userEvent.keyboard('{ArrowRight}');
  expect(onChange).toHaveBeenLastCalledWith(
    expect.anything(),
    expect.objectContaining({ type: 'change', value: { start: 25, end: 30 } }),
  );
  await userEvent.keyboard('{End}');
  expect(startInput.value).toBe('30');
  expect(onChange.mock.lastCall?.[1].value).toEqual({ start: 30, end: 30 });

  await userEvent.tab();
  expect(document.activeElement).toBe(endInput);
  await userEvent.keyboard('{ArrowLeft}');
  expect(endInput.value).toBe('30');
  await userEvent.keyboard('{End}');
  expect(endInput.value).toBe('100');
  await userEvent.keyboard('{Home}');
  expect(endInput.value).toBe('30');
  expect(onChange.mock.lastCall?.[1].value).toEqual({ start: 30, end: 30 });
});

test('draws the focus indicator around the keyboard-focused thumb only', async () => {
  const { screen, startThumb, endThumb, startInput } = await renderRangeSlider({
    defaultValue: { start: 20, end: 70 },
  });
  expect(getComputedStyle(startThumb, '::after').content).toBe('none');

  await userEvent.click(screen.getByRole('button', { name: 'Before range' }));
  await userEvent.tab();
  expect(startInput.matches(':focus-visible')).toBe(true);
  const after = getComputedStyle(startThumb, '::after');
  expect(after.content).toBe('""');
  expect(after.borderTopWidth).toBe('2px');
  expect(after.borderTopStyle).toBe('solid');
  expect(after.top).toBe('-2px');
  expect(after.left).toBe('-2px');
  expect(after.pointerEvents).toBe('none');
  expect(getComputedStyle(endThumb, '::after').content).toBe('none');
});

test.each(['ltr', 'rtl'] as const)(
  'moves the closest thumb on a rail press and drags a thumb with real pointer events in %s',
  async (dir) => {
    const onChange = vi.fn<(event: unknown, data: RangeSliderOnChangeData) => void>();
    const { root, rail, startThumb, endThumb, startInput, endInput } = await renderRangeSlider(
      { defaultValue: { start: 20, end: 60 }, onChange },
      { dir },
    );
    const rootBox = root.getBoundingClientRect();
    const railBox = rail.getBoundingClientRect();
    const xForValue = (value: number) => {
      const offset = (railBox.width * value) / 100;
      return (dir === 'rtl' ? railBox.right - offset : railBox.left + offset) - rootBox.left;
    };
    const y = rootBox.height / 2;

    await userEvent.click(root, { position: { x: xForValue(80), y } });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ type: 'pointer', value: { start: 20, end: 80 } }),
    );
    expect(document.activeElement).toBe(endInput);
    expect(endThumb.hasAttribute('data-active')).toBe(true);
    expect(startThumb.hasAttribute('data-active')).toBe(false);

    await userEvent.click(root, { position: { x: xForValue(10), y } });
    expect(onChange.mock.lastCall?.[1].value).toEqual({ start: 10, end: 80 });
    expect(document.activeElement).toBe(startInput);

    const thumbBox = startThumb.getBoundingClientRect();
    await userEvent.dragAndDrop(startThumb, root, {
      sourcePosition: { x: thumbBox.width / 2, y: thumbBox.height / 2 },
      targetPosition: { x: xForValue(40), y },
    });
    expect(onChange.mock.lastCall?.[1]).toEqual(
      expect.objectContaining({ type: 'pointer', value: { start: 40, end: 80 } }),
    );
    expect(startInput.value).toBe('40');
    expect(root.style.getPropertyValue('--fui-RangeSlider--start-progress')).toBe('40%');
  },
);

test('raises the active thumb only while the thumbs overlap', async () => {
  const { root, startThumb, endThumb, screen } = await renderRangeSlider({
    defaultValue: { start: 50, end: 50 },
  });
  expect(root.hasAttribute('data-thumbs-overlap')).toBe(true);
  expect(getComputedStyle(startThumb).zIndex).toBe('1');
  expect(getComputedStyle(endThumb).zIndex).toBe('auto');

  await userEvent.click(screen.getByRole('button', { name: 'Before range' }));
  await userEvent.tab();
  await userEvent.tab();
  await userEvent.keyboard('{ArrowRight}');
  expect(root.hasAttribute('data-thumbs-overlap')).toBe(false);
  expect(endThumb.hasAttribute('data-active')).toBe(true);
  expect(getComputedStyle(endThumb).zIndex).toBe('auto');
});

test('disables the whole slider or a single thumb', async () => {
  const onChange = vi.fn();
  const disabled = await renderRangeSlider({
    disabled: true,
    defaultValue: { start: 20, end: 60 },
    onChange,
  });
  expect(disabled.root.hasAttribute('data-disabled')).toBe(true);
  expect(disabled.startInput.disabled).toBe(true);
  expect(disabled.endInput.disabled).toBe(true);
  expect(disabled.startThumb.hasAttribute('data-disabled')).toBe(true);
  expect(getComputedStyle(disabled.startInput).cursor).toBe('default');
  await userEvent.click(disabled.root, { position: { x: 200, y: 16 }, force: true });
  expect(onChange).not.toHaveBeenCalled();
  await cleanup();

  const single = await renderRangeSlider({
    defaultValue: { start: 20, end: 60 },
    startInput: { 'aria-label': 'Minimum', disabled: true },
    onChange,
  });
  expect(single.root.hasAttribute('data-disabled')).toBe(false);
  expect(single.startThumb.hasAttribute('data-disabled')).toBe(true);
  expect(single.endThumb.hasAttribute('data-disabled')).toBe(false);
  expect(single.startInput.getAttribute('aria-disabled')).toBe('true');
  expect(getComputedStyle(single.startInput).cursor).toBe('default');
  expect(getComputedStyle(single.endInput).cursor).toBe('pointer');
  expect(getComputedStyle(single.startThumb).backgroundColor).not.toBe(
    getComputedStyle(single.endThumb).backgroundColor,
  );
  const railBox = single.rail.getBoundingClientRect();
  const rootBox = single.root.getBoundingClientRect();
  await userEvent.click(single.root, {
    position: { x: railBox.left - rootBox.left + railBox.width * 0.1, y: rootBox.height / 2 },
  });
  expect(onChange).toHaveBeenLastCalledWith(
    expect.anything(),
    expect.objectContaining({ value: { start: 20, end: 20 } }),
  );
});

test('applies consumer classes after the module classes', async () => {
  const { root, rail, startThumb, endInput } = await renderRangeSlider({
    className: 'consumer-root',
    rail: { className: 'consumer-rail' },
    startThumb: { className: 'consumer-thumb' },
    endInput: { className: 'consumer-input', 'aria-label': 'Maximum' },
  });
  expect(root.classList[0]).toBe(rangeSliderClassNames.root);
  expect(root.classList).toContain('consumer-root');
  expect([...rail.classList].at(-1)).toBe('consumer-rail');
  expect([...startThumb.classList].at(-1)).toBe('consumer-thumb');
  expect([...endInput.classList].at(-1)).toBe('consumer-input');
});
