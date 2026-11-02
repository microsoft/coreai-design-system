// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import { Slider as PrimitiveSlider } from '@fluentui/react-headless-components-preview/slider';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import { Field, coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../react-components/src/test-utils.js';
import {
  SliderComparison,
  SliderVolumeForm,
  sliderConsumerExample,
  sliderExamples,
  sliderRangeExamples,
  type SliderExample,
} from '../../../apps/storybook/src/stories/experiments/SliderComparison.js';
import {
  captureSliderStyles,
  compareSliderStyles,
  getComparisonSlider,
  getSliderSlots,
  settleSliderStyles,
  sliderVerticalRtlDirectionDifference,
  type ComparisonSlider,
} from '../../../apps/storybook/src/stories/experiments/compareSliderStyles.js';
import { Slider, sliderClassNames, type SliderProps, type SliderSlots } from './Slider.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

async function renderPair(
  example: SliderExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await renderCoreAIComponent(<SliderComparison examples={[example]} />, {
    providerProps: { theme, withComponentDefaults, dir },
  });
  const legacy = getComparisonSlider(screen.container, 'legacy');
  const headless = getComparisonSlider(screen.container, 'headless');
  await userEvent.hover(screen.getByRole('button', { name: 'Before sliders' }));
  expect(legacy.root.matches(':hover')).toBe(false);
  expect(headless.root.matches(':hover')).toBe(false);
  await Promise.all([settleSliderStyles(legacy), settleSliderStyles(headless)]);
  return { screen, legacy, headless };
}

function expectThumbGeometry(
  { root, rail, thumb }: ComparisonSlider,
  progress: number,
  vertical: boolean,
  rtl: boolean,
  size: 'small' | 'medium',
) {
  const railRect = rail.getBoundingClientRect();
  const thumbRect = thumb.getBoundingClientRect();
  const thumbSize = size === 'small' ? 16 : 20;
  const innerRadius = size === 'small' ? 5 : 6;
  const travel = vertical ? railRect.height : railRect.width;
  const position = Math.min(travel - innerRadius, Math.max(innerRadius, (travel * progress) / 100));
  const actual = vertical
    ? railRect.bottom - (thumbRect.top + thumbRect.height / 2)
    : rtl
      ? railRect.right - (thumbRect.left + thumbRect.width / 2)
      : thumbRect.left + thumbRect.width / 2 - railRect.left;
  expect(actual).toBeCloseTo(position, 1);
  expect(thumbRect.width).toBe(thumbSize);
  expect(thumbRect.height).toBe(thumbSize);
  expect(vertical ? railRect.height : railRect.width).toBe(
    (vertical ? root.getBoundingClientRect().height : root.getBoundingClientRect().width) -
      thumbSize,
  );
}

test('exposes the current public native-input, slot, and ForwardRefComponent contracts', () => {
  expectTypeOf<React.ComponentProps<typeof Slider>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveSlider>['ref']
  >();
  expectTypeOf<SliderProps['as']>().toEqualTypeOf<'input' | undefined>();
  expectTypeOf<React.ComponentRef<typeof Slider>>().toEqualTypeOf<HTMLInputElement>();
  expectTypeOf<NonNullable<SliderProps['input']>['children']>().toEqualTypeOf<undefined>();
});

for (const [mode, theme] of themes) {
  test.each(sliderExamples)(
    `matches $name root/input/rail/thumb styles, pseudo-elements, and geometry in ${mode}`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(
        compareSliderStyles(captureSliderStyles(legacy), captureSliderStyles(headless)),
      ).toEqual([]);
      for (const slot of ['root', 'input', 'rail', 'thumb'] as const) {
        expect(headless[slot]).toHaveClass(sliderClassNames[slot]);
      }
      expect(headless.input).toHaveAccessibleName(example.field ? 'Output volume' : example.name);
      expect(headless.input).toHaveAttribute('type', 'range');
      expect(headless.input).toHaveAttribute(
        'aria-orientation',
        example.props.vertical ? 'vertical' : 'horizontal',
      );
      expect(headless.root).toHaveAttribute('data-size', example.props.size ?? 'medium');
      expect(headless.root.hasAttribute('data-disabled')).toBe(Boolean(example.props.disabled));
      expect(headless.root.hasAttribute('data-vertical')).toBe(Boolean(example.props.vertical));
      expect(headless.input).not.toHaveAttribute('size');
      expect(headless.root).not.toHaveAttribute('size');
      expect(headless.root.getAnimations({ subtree: true })).toHaveLength(0);
      const progress = Number.parseFloat(
        headless.root.style.getPropertyValue('--fui-Slider--progress'),
      );
      expectThumbGeometry(
        headless,
        progress,
        Boolean(example.props.vertical),
        false,
        example.props.size ?? 'medium',
      );
    },
  );

  test(`lets ordinary consumer CSS override layered size, rail, thumb, and pseudo styles in ${mode}`, async () => {
    const { legacy, headless } = await renderPair(sliderConsumerExample, theme);
    const styles = captureSliderStyles(headless);
    expect(styles['root.min-height']).toBe('44px');
    expect(styles['root.height']).toBe('44.00');
    expect(styles['input.height']).toBe('28.00');
    expect(styles['rail.height']).toBe('8.00');
    expect(styles['rail.border-top-left-radius']).toBe('1px');
    expect(styles['rail.background-image']).toBe('none');
    expect(styles['thumb.width']).toBe('28.00');
    expect(styles['thumb.height']).toBe('28.00');
    expect(styles['thumb.border-top-left-radius']).toBe('3px');
    expect(styles['thumb.box-shadow']).toBe('none');
    expect(styles['thumb::before.border-top-style']).toBe('solid');
    if (!matchMedia('(forced-colors: active)').matches) {
      expect(styles['rail.background-color']).toBe('rgb(210, 230, 240)');
      expect(styles['thumb.background-color']).toBe('rgb(30, 120, 160)');
      expect(styles['thumb::before.border-top-color']).toBe('rgb(10, 20, 30)');
    }
    expect(compareSliderStyles(captureSliderStyles(legacy), styles).length).toBeGreaterThan(0);
  });
}

test.each(sliderRangeExamples)(
  'preserves headless progress and native range sanitization separately for $name',
  async (example) => {
    const { legacy, headless } = await renderPair(example);
    const primitiveInput = React.createRef<HTMLInputElement>();
    const primitiveRoot = React.createRef<HTMLDivElement>();
    await renderCoreAIComponent(
      <PrimitiveSlider
        {...example.props}
        ref={primitiveInput}
        root={{ ref: primitiveRoot }}
        aria-label="Primitive range"
      />,
    );
    if (!primitiveInput.current || !primitiveRoot.current)
      throw new Error('Missing primitive refs');
    expect(compareSliderStyles(captureSliderStyles(legacy), captureSliderStyles(headless))).toEqual(
      [],
    );
    for (const { root, input } of [legacy, headless]) {
      expect(input.valueAsNumber).toBe(example.expectedInputValue);
      expect(input.value).toBe(primitiveInput.current.value);
      expect(root.style.getPropertyValue('--fui-Slider--progress')).toBe(
        primitiveRoot.current.style.getPropertyValue('--fui-Slider--progress'),
      );
      expect(Number.parseFloat(root.style.getPropertyValue('--fui-Slider--progress'))).toBeCloseTo(
        example.expectedProgress,
      );
      expect(root.style.getPropertyValue('--fui-Slider--steps-percent')).toBe(
        primitiveRoot.current.style.getPropertyValue('--fui-Slider--steps-percent'),
      );
    }
    expectThumbGeometry(headless, example.expectedProgress, false, false, 'medium');
  },
);

for (const dir of ['ltr', 'rtl'] as const) {
  for (const vertical of [false, true]) {
    test(`preserves native ${vertical ? 'vertical' : 'horizontal'} keyboard direction, callbacks, and geometry in ${dir}`, async () => {
      const changes = vi.fn<NonNullable<SliderProps['onChange']>>();
      const { screen, legacy, headless } = await renderPair(
        { name: 'Direction', props: { defaultValue: 50, step: 5, vertical, onChange: changes } },
        coreaiLightTheme,
        true,
        dir,
      );
      expect(
        compareSliderStyles(captureSliderStyles(legacy), captureSliderStyles(headless)),
      ).toEqual(vertical && dir === 'rtl' ? [sliderVerticalRtlDirectionDifference] : []);
      expectThumbGeometry(headless, 50, vertical, dir === 'rtl', 'medium');
      if (vertical) {
        expect(CSS.supports('writing-mode', 'vertical-lr')).toBe(true);
        expect(getComputedStyle(headless.input).writingMode).toBe('vertical-lr');
        expect(getComputedStyle(headless.input).direction).toBe('rtl');
      } else {
        expect(getComputedStyle(headless.input).writingMode).toBe('horizontal-tb');
        expect(getComputedStyle(headless.input).direction).toBe(dir);
      }
      await userEvent.hover(screen.getByRole('button', { name: 'Before sliders' }));
      await userEvent.click(screen.getByRole('button', { name: 'Before sliders' }));
      for (const control of [legacy, headless]) {
        const legacyVerticalRtl = vertical && dir === 'rtl' && control === legacy;
        expect(getComputedStyle(control.input).direction).toBe(
          vertical ? (legacyVerticalRtl ? 'ltr' : 'rtl') : dir,
        );
        await userEvent.tab();
        expect(control.input).toHaveFocus();
        expect(control.input.matches(':focus-visible')).toBe(true);
        expect(control.root.matches(':hover')).toBe(false);
        const increment = vertical ? '{ArrowUp}' : dir === 'rtl' ? '{ArrowLeft}' : '{ArrowRight}';
        const decrement = vertical ? '{ArrowDown}' : dir === 'rtl' ? '{ArrowRight}' : '{ArrowLeft}';
        for (const [key, expected] of [
          [increment, legacyVerticalRtl ? 45 : 55],
          [decrement, 50],
          ['{PageUp}', 60],
          ['{PageDown}', 50],
          ['{Home}', 0],
          ['{End}', 100],
        ] as const) {
          await userEvent.keyboard(key);
          expect(control.input.valueAsNumber).toBe(expected);
          expect(changes).toHaveBeenLastCalledWith(expect.anything(), { value: expected });
          expect(changes.mock.lastCall?.[0].target).toBe(control.input);
          expect(
            Number.parseFloat(control.root.style.getPropertyValue('--fui-Slider--progress')),
          ).toBeCloseTo(expected, 12);
          expectThumbGeometry(control, expected, vertical, dir === 'rtl', 'medium');
          if (vertical && key === '{ArrowUp}') {
            const inputRect = control.input.getBoundingClientRect();
            const thumbRect = control.thumb.getBoundingClientRect();
            expect(thumbRect.top + thumbRect.height / 2 - inputRect.top).toBeCloseTo(
              legacyVerticalRtl ? 98 : 82,
              2,
            );
          }
        }
        await userEvent.keyboard(legacyVerticalRtl ? '{ArrowDown}' : increment);
        expect(control.input.valueAsNumber).toBe(100);
      }
      expect(changes).toHaveBeenCalledTimes(12);
    });

    test(`uses real native pointer changes and payloads for ${vertical ? 'vertical' : 'horizontal'} in ${dir}`, async () => {
      const changes = vi.fn<NonNullable<SliderProps['onChange']>>();
      const points: {
        input: EventTarget;
        x: number;
        y: number;
        width: number;
        height: number;
      }[] = [];
      const onPointerDown: NonNullable<SliderProps['onPointerDown']> = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        points.push({
          input: event.currentTarget,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          width: rect.width,
          height: rect.height,
        });
      };
      const { legacy, headless } = await renderPair(
        {
          name: 'Pointer',
          props: { defaultValue: 50, step: 25, vertical, onChange: changes, onPointerDown },
        },
        coreaiLightTheme,
        true,
        dir,
      );
      for (const control of [legacy, headless]) {
        const legacyVerticalRtl = vertical && dir === 'rtl' && control === legacy;
        const position = vertical ? { x: 10, y: 45 } : { x: 180, y: 10 };
        // The browser provider scales its options for the runner iframe; retain our CSS-space target.
        await userEvent.click(control.input, { position: { ...position } });
        const point = points[points.length - 1];
        if (!point) throw new Error('Missing native pointer coordinates');
        expect(point.input).toBe(control.input);
        expect(point.x).toBeCloseTo(position.x, 1);
        expect(point.y).toBeCloseTo(position.y, 1);
        expect(point.width).toBe(vertical ? 20 : 240);
        expect(point.height).toBe(vertical ? 180 : 20);
        expect(getComputedStyle(control.input).direction).toBe(
          vertical ? (legacyVerticalRtl ? 'ltr' : 'rtl') : dir,
        );
        expect(control.input).toHaveAttribute(
          'aria-orientation',
          vertical ? 'vertical' : 'horizontal',
        );
        const expected = legacyVerticalRtl || (!vertical && dir === 'rtl') ? 25 : 75;
        expect(control.input.matches(':hover')).toBe(true);
        expect(control.root.matches(':hover')).toBe(true);
        expect(control.input.valueAsNumber).toBe(expected);
        expect(changes).toHaveBeenLastCalledWith(expect.anything(), { value: expected });
        expect(changes.mock.lastCall?.[0].target).toBe(control.input);
        expect(
          Number.parseFloat(control.root.style.getPropertyValue('--fui-Slider--progress')),
        ).toBe(expected);
        expectThumbGeometry(control, expected, vertical, dir === 'rtl', 'medium');
        const inputRect = control.input.getBoundingClientRect();
        const railRect = control.rail.getBoundingClientRect();
        const thumbRect = control.thumb.getBoundingClientRect();
        const visualCenter = vertical
          ? thumbRect.top + thumbRect.height / 2 - inputRect.top
          : thumbRect.left + thumbRect.width / 2 - inputRect.left;
        expect(visualCenter).toBeCloseTo(legacyVerticalRtl ? 130 : vertical ? 50 : 175, 2);
        expect(Math.abs(visualCenter - (vertical ? point.y : point.x))).toBeCloseTo(
          legacyVerticalRtl ? 85 : 5,
          1,
        );
        if (vertical) {
          expect(railRect.top - inputRect.top).toBeCloseTo(10, 2);
          expect(railRect.height).toBe(160);
        }
      }
      expect(changes).toHaveBeenCalledTimes(2);
    });
  }
}

test('preserves current public headless vertical RTL native behavior without the legacy styled direction flip', async () => {
  const inputRef = React.createRef<HTMLInputElement>();
  const rootRef = React.createRef<HTMLDivElement>();
  const changes = vi.fn<NonNullable<SliderProps['onChange']>>();
  const screen = await renderCoreAIComponent(
    <>
      <button type="button">Before native vertical</button>
      <PrimitiveSlider
        ref={inputRef}
        root={{ ref: rootRef }}
        vertical
        defaultValue={50}
        step={25}
        aria-label="Native vertical primitive"
        onChange={changes}
        input={{
          style: {
            writingMode: 'vertical-lr',
            direction: 'rtl',
            width: '20px',
            height: '180px',
            margin: 0,
            padding: 0,
          },
        }}
      />
    </>,
    { providerProps: { dir: 'rtl' } },
  );
  if (!inputRef.current || !rootRef.current) throw new Error('Missing native primitive refs');
  const before = screen.getByRole('button', { name: 'Before native vertical' });
  await userEvent.hover(before);
  await userEvent.click(before);
  await userEvent.tab();
  expect(inputRef.current).toHaveFocus();
  expect(inputRef.current.matches(':focus-visible')).toBe(true);
  expect(inputRef.current.matches(':hover')).toBe(false);
  expect(getComputedStyle(inputRef.current).direction).toBe('rtl');
  expect(inputRef.current).toHaveAttribute('aria-orientation', 'vertical');
  expect(rootRef.current.style.getPropertyValue('--fui-Slider--direction')).toBe('0deg');
  await userEvent.keyboard('{ArrowUp}');
  expect(inputRef.current.valueAsNumber).toBe(75);
  expect(changes).toHaveBeenLastCalledWith(expect.anything(), { value: 75 });
  await userEvent.keyboard('{ArrowDown}');
  expect(inputRef.current.valueAsNumber).toBe(50);
  expect(changes).toHaveBeenLastCalledWith(expect.anything(), { value: 50 });
  await userEvent.click(inputRef.current, { position: { x: 10, y: 45 } });
  expect(inputRef.current.matches(':hover')).toBe(true);
  expect(inputRef.current.valueAsNumber).toBe(75);
  expect(rootRef.current.style.getPropertyValue('--fui-Slider--progress')).toBe('75%');
  expect(changes).toHaveBeenLastCalledWith(expect.anything(), { value: 75 });
  expect(changes).toHaveBeenCalledTimes(3);
});

for (const [mode, theme] of themes) {
  test.each([false, true])(
    `matches disabled=%s actual hover colors in ${mode}`,
    async (disabled) => {
      const { screen, legacy, headless } = await renderPair(
        { name: 'Hover', props: { defaultValue: 40, disabled } },
        theme,
      );
      await userEvent.hover(screen.getByRole('button', { name: 'Before sliders' }));
      expect(headless.root.matches(':hover')).toBe(false);
      const resting = captureSliderStyles(headless);
      await userEvent.hover(legacy.input);
      expect(legacy.root.matches(':hover')).toBe(true);
      await settleSliderStyles(legacy);
      const expected = captureSliderStyles(legacy);
      await userEvent.hover(headless.input);
      expect(headless.root.matches(':hover')).toBe(true);
      await settleSliderStyles(headless);
      const hovered = captureSliderStyles(headless);
      expect(compareSliderStyles(expected, hovered)).toEqual([]);
      if (!matchMedia('(forced-colors: active)').matches) {
        expect(
          getComputedStyle(headless.root).getPropertyValue('--fui-Slider__thumb--color').trim(),
        ).toBe(
          disabled ? theme.colorNeutralForegroundDisabled : theme.colorCompoundBrandBackgroundHover,
        );
      }
      if (disabled) {
        expect(compareSliderStyles(resting, hovered)).toEqual([]);
        expect(getComputedStyle(headless.input).cursor).toBe('default');
      } else {
        expect(hovered['thumb.background-color']).not.toBe(resting['thumb.background-color']);
        expect(getComputedStyle(headless.input).cursor).toBe('pointer');
      }
    },
  );
}

for (const vertical of [false, true]) {
  test.each([false, true])(
    `matches native keyboard focus, hover=%s, and actual focus pseudo geometry when vertical=${vertical}`,
    async (hover) => {
      const { screen, legacy, headless } = await renderPair({
        name: 'Focus',
        props: { defaultValue: 50, vertical },
      });
      const neutral = screen.getByRole('button', { name: 'Before sliders' });
      await userEvent.hover(neutral);
      await userEvent.click(neutral);
      const captures: Record<string, string>[] = [];
      for (const control of [legacy, headless]) {
        await userEvent.hover(neutral);
        await userEvent.tab();
        expect(control.input).toHaveFocus();
        if (hover) await userEvent.hover(control.input);
        expect(control.input.matches(':focus-visible')).toBe(true);
        expect(control.root.matches(':hover')).toBe(hover);
        await settleSliderStyles(control);
        const styles = captureSliderStyles(control);
        expect(styles['root::after.content']).toBe('""');
        expect(styles['root::after.border-top-width']).toBe('2px');
        expect(styles['root::after.pointer-events']).toBe('none');
        expect(styles['root::after.top']).toBe('0px');
        expect(styles['root::after.left']).toBe(vertical ? '-6px' : '2px');
        captures.push(styles);
      }
      expect(compareSliderStyles(captures[0], captures[1])).toEqual([]);
    },
  );
}

test.each([true, false])(
  'has no additional CoreAI size/default override with component defaults=%s',
  async (withComponentDefaults) => {
    const { legacy, headless } = await renderPair(
      { name: 'Defaults', props: { size: undefined, defaultValue: 25 } },
      coreaiLightTheme,
      withComponentDefaults,
    );
    expect(compareSliderStyles(captureSliderStyles(legacy), captureSliderStyles(headless))).toEqual(
      [],
    );
    expect(headless.root).toHaveAttribute('data-size', 'medium');
    expect(headless.thumb.getBoundingClientRect().width).toBe(20);
  },
);

test('keeps controlled state with the parent, reports native payloads, and responds to prop updates', async () => {
  const inputRef = React.createRef<HTMLInputElement>();
  const rootRef = React.createRef<HTMLDivElement>();
  const onChange = vi.fn<NonNullable<SliderProps['onChange']>>();
  const screen = await renderCoreAIComponent(
    <>
      <button type="button">Before controlled</button>
      <Slider
        ref={inputRef}
        root={{ ref: rootRef }}
        aria-label="Controlled volume"
        value={40}
        onChange={onChange}
      />
    </>,
  );
  if (!inputRef.current || !rootRef.current) throw new Error('Missing controlled refs');
  const initialInput = inputRef.current;
  const initialRoot = rootRef.current;
  await userEvent.hover(screen.getByRole('button', { name: 'Before controlled' }));
  await userEvent.click(screen.getByRole('button', { name: 'Before controlled' }));
  await userEvent.tab();
  expect(inputRef.current.matches(':focus-visible')).toBe(true);
  expect(rootRef.current.matches(':hover')).toBe(false);
  await userEvent.keyboard('{ArrowRight}');
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { value: 41 });
  expect(inputRef.current.valueAsNumber).toBe(40);
  expect(rootRef.current.style.getPropertyValue('--fui-Slider--progress')).toBe('40%');
  await screen.rerender(
    <>
      <button type="button">Before controlled</button>
      <Slider ref={inputRef} root={{ ref: rootRef }} value={60} max={120} step={10} size="small" />
    </>,
  );
  expect(inputRef.current).toBe(initialInput);
  expect(rootRef.current).toBe(initialRoot);
  expect(inputRef.current.valueAsNumber).toBe(60);
  expect(rootRef.current.style.getPropertyValue('--fui-Slider--progress')).toBe('50%');
  expect(rootRef.current.style.getPropertyValue('--fui-Slider--steps-percent')).toBe(
    `${(10 * 100) / 120}%`,
  );
  expect(rootRef.current).toHaveAttribute('data-size', 'small');
  await screen.rerender(
    <>
      <button type="button">Before controlled</button>
      <Slider ref={inputRef} root={{ ref: rootRef }} value={200} max={100} disabled vertical />
    </>,
  );
  expect(inputRef.current.valueAsNumber).toBe(100);
  expect(inputRef.current).toBeDisabled();
  expect(inputRef.current).toHaveAttribute('aria-orientation', 'vertical');
  expect(getComputedStyle(inputRef.current).writingMode).toBe('vertical-lr');
  expect(rootRef.current).toHaveAttribute('data-disabled', '');
  expect(rootRef.current).toHaveAttribute('data-vertical', '');
  expect(rootRef.current.style.getPropertyValue('--fui-Slider--progress')).toBe('100%');
  expect(rootRef.current.style.getPropertyValue('--fui-Slider--steps-percent')).toBe('');
});

test('retains the initial uncontrolled value across later defaultValue changes', async () => {
  const inputRef = React.createRef<HTMLInputElement>();
  const rootRef = React.createRef<HTMLDivElement>();
  const screen = await renderCoreAIComponent(
    <Slider ref={inputRef} root={{ ref: rootRef }} defaultValue={25} />,
  );
  await screen.rerender(<Slider ref={inputRef} root={{ ref: rootRef }} defaultValue={75} />);
  expect(inputRef.current?.valueAsNumber).toBe(25);
  expect(rootRef.current?.style.getPropertyValue('--fui-Slider--progress')).toBe('25%');
});

test('preserves primary-input, root, rail, thumb refs, native props, consumer classes, and content', async () => {
  const inputRef = React.createRef<HTMLInputElement>();
  const rootRef = React.createRef<HTMLDivElement>();
  const railRef = React.createRef<HTMLDivElement>();
  const thumbRef = React.createRef<HTMLDivElement>();
  const onKeyDown = vi.fn<NonNullable<SliderProps['onKeyDown']>>();
  const screen = await renderCoreAIComponent(
    <>
      <button type="button">Before slots</button>
      <Slider
        ref={inputRef}
        id="slider-slots"
        name="volume"
        min={0}
        max={12}
        step={3}
        defaultValue={6}
        size="small"
        className="consumer-root"
        aria-label="Consumer volume"
        aria-valuetext="Comfortable"
        data-consumer-input=""
        onKeyDown={onKeyDown}
        root={{ ref: rootRef, title: 'Volume row', style: { width: '240px' } }}
        input={{ className: 'consumer-input', title: 'Native range' }}
        rail={{
          ref: railRef,
          className: 'consumer-rail',
          children: <span className="consumer-rail-child">•</span>,
        }}
        thumb={{
          ref: thumbRef,
          className: 'consumer-thumb',
          children: <span className="consumer-thumb-child">•</span>,
        }}
      />
    </>,
  );
  if (!rootRef.current || !inputRef.current) throw new Error('Missing Slider refs');
  const { root, input, rail, thumb } = getSliderSlots(rootRef.current);
  expect(input).toBe(inputRef.current);
  expect(rail).toBe(railRef.current);
  expect(thumb).toBe(thumbRef.current);
  expect(root).toHaveClass(sliderClassNames.root, 'consumer-root');
  expect(input).toHaveClass(sliderClassNames.input, 'consumer-input');
  expect(rail).toHaveClass(sliderClassNames.rail, 'consumer-rail');
  expect(thumb).toHaveClass(sliderClassNames.thumb, 'consumer-thumb');
  expect(root).toHaveAttribute('title', 'Volume row');
  expect(input).toHaveAttribute('title', 'Native range');
  expect(input).toHaveAttribute('data-consumer-input', '');
  expect(root).not.toHaveAttribute('data-consumer-input');
  expect(input).toHaveAttribute('name', 'volume');
  expect(input).toHaveAttribute('id', 'slider-slots');
  expect(input).toHaveAttribute('min', '0');
  expect(input).toHaveAttribute('max', '12');
  expect(input).toHaveAttribute('step', '3');
  expect(input).toHaveAttribute('aria-valuetext', 'Comfortable');
  expect(input).toHaveAccessibleName('Consumer volume');
  for (const element of [root, input]) {
    expect(element).not.toHaveAttribute('size');
    expect(element).not.toHaveAttribute('vertical');
  }
  expect(rail.querySelector('.consumer-rail-child')).not.toHaveClass(sliderClassNames.rail);
  expect(thumb.querySelector('.consumer-thumb-child')).not.toHaveClass(sliderClassNames.thumb);
  await userEvent.hover(screen.getByRole('button', { name: 'Before slots' }));
  await userEvent.click(screen.getByRole('button', { name: 'Before slots' }));
  await userEvent.tab();
  expect(input.matches(':focus-visible')).toBe(true);
  expect(root.matches(':hover')).toBe(false);
  await userEvent.keyboard('{ArrowRight}');
  expect(input.valueAsNumber).toBe(9);
  expect(onKeyDown).toHaveBeenCalledOnce();
  expect(onKeyDown.mock.calls[0][0].key).toBe('ArrowRight');
});

test('preserves root/rail/thumb render functions alongside native input classes and refs', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const inputRef = React.createRef<HTMLInputElement>();
  const railRef = React.createRef<HTMLDivElement>();
  const thumbRef = React.createRef<HTMLDivElement>();
  const renderRoot: SlotRenderFunction<ExtractSlotProps<SliderSlots['root']>> = (
    Component,
    props,
  ) => <Component {...props} data-rendered-root="" />;
  const renderRail: SlotRenderFunction<ExtractSlotProps<SliderSlots['rail']>> = (
    Component,
    props,
  ) => <Component {...props} data-rendered-rail="" />;
  const renderThumb: SlotRenderFunction<ExtractSlotProps<SliderSlots['thumb']>> = (
    Component,
    props,
  ) => <Component {...props} data-rendered-thumb="" />;
  await renderCoreAIComponent(
    <Slider
      value={75}
      aria-label="Rendered volume"
      root={{ ref: rootRef, children: renderRoot }}
      input={{ ref: inputRef, className: 'consumer-input' }}
      rail={{ ref: railRef, children: renderRail }}
      thumb={{ ref: thumbRef, children: renderThumb }}
    />,
  );
  if (!rootRef.current) throw new Error('Missing rendered root');
  const control = getSliderSlots(rootRef.current);
  expect(control.input).toBe(inputRef.current);
  expect(control.rail).toBe(railRef.current);
  expect(control.thumb).toBe(thumbRef.current);
  for (const slot of ['root', 'rail', 'thumb'] as const) {
    expect(control[slot]).toHaveAttribute(`data-rendered-${slot}`, '');
    expect(control[slot]).toHaveClass(sliderClassNames[slot]);
  }
  expect(control.input).toHaveClass(sliderClassNames.input, 'consumer-input');
  expect(control.input).toHaveAccessibleName('Rendered volume');
  expect(control.input.valueAsNumber).toBe(75);
  expect(control.root.style.getPropertyValue('--fui-Slider--progress')).toBe('75%');
});

test('preserves the pinned public input-slot ref precedence rather than adding a ref adapter', async () => {
  for (const Component of [PrimitiveSlider, Slider]) {
    const forwardedRef = React.createRef<HTMLInputElement>();
    const slotRef = React.createRef<HTMLInputElement>();
    await renderCoreAIComponent(
      <Component ref={forwardedRef} input={{ ref: slotRef }} aria-label="Slot ref precedence" />,
    );
    expect(slotRef.current).toBeInstanceOf(HTMLInputElement);
    expect(forwardedRef.current).toBeNull();
  }
});

test('preserves the current input-slot callback precedence without double-calling the component callback', async () => {
  const inputRef = React.createRef<HTMLInputElement>();
  const rootRef = React.createRef<HTMLDivElement>();
  const componentChange = vi.fn<NonNullable<SliderProps['onChange']>>();
  const slotChange = vi.fn<React.ChangeEventHandler<HTMLInputElement>>();
  const nativeInput = vi.fn<React.FormEventHandler<HTMLInputElement>>();
  const screen = await renderCoreAIComponent(
    <>
      <button type="button">Before callbacks</button>
      <Slider
        ref={inputRef}
        root={{ ref: rootRef }}
        defaultValue={40}
        onChange={componentChange}
        onInput={nativeInput}
        input={{ onChange: slotChange }}
      />
    </>,
  );
  if (!inputRef.current || !rootRef.current) throw new Error('Missing callback refs');
  await userEvent.hover(screen.getByRole('button', { name: 'Before callbacks' }));
  await userEvent.click(screen.getByRole('button', { name: 'Before callbacks' }));
  await userEvent.tab();
  expect(rootRef.current.matches(':hover')).toBe(false);
  expect(inputRef.current.matches(':focus-visible')).toBe(true);
  await userEvent.keyboard('{ArrowRight}');
  expect(inputRef.current.valueAsNumber).toBe(41);
  expect(slotChange).toHaveBeenCalledOnce();
  expect(slotChange.mock.calls[0][0].target).toBe(inputRef.current);
  expect(componentChange).not.toHaveBeenCalled();
  expect(nativeInput).toHaveBeenCalledOnce();
  expect(rootRef.current.style.getPropertyValue('--fui-Slider--progress')).toBe('41%');
});

test('preserves Field label association, error/required ARIA, description order, and explicit caller ARIA', async () => {
  const { legacy, headless } = await renderPair({
    name: 'Field',
    props: { defaultValue: 40, 'aria-describedby': 'caller-slider-hint' },
    field: {
      label: 'Output volume',
      hint: 'Use headphones at a comfortable volume.',
      validationMessage: 'Volume needs review.',
      validationState: 'error',
      required: true,
    },
  });
  for (const { root, input } of [legacy, headless]) {
    expect(input).toHaveAccessibleName('Output volume');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(root).not.toHaveAttribute('aria-invalid');
    const label = input.labels?.item(0);
    expect(label).toHaveAttribute('for', input.id);
    const descriptions = input.getAttribute('aria-describedby')?.split(' ') ?? [];
    expect(descriptions).toHaveLength(3);
    expect(document.getElementById(descriptions[0])?.textContent).toContain('Volume needs review.');
    expect(document.getElementById(descriptions[1])?.textContent).toBe(
      'Use headphones at a comfortable volume.',
    );
    expect(descriptions[2]).toBe('caller-slider-hint');
  }
  const inputRef = React.createRef<HTMLInputElement>();
  const rootRef = React.createRef<HTMLDivElement>();
  await renderCoreAIComponent(
    <Field label="Explicit field" validationState="error" required size="small">
      <Slider
        ref={inputRef}
        root={{ ref: rootRef }}
        aria-invalid={false}
        aria-required={false}
        aria-orientation="horizontal"
        vertical
      />
    </Field>,
  );
  expect(inputRef.current).toHaveAttribute('aria-invalid', 'false');
  expect(inputRef.current).toHaveAttribute('aria-required', 'false');
  expect(inputRef.current).toHaveAttribute('aria-orientation', 'horizontal');
  expect(rootRef.current).toHaveAttribute('data-size', 'medium');
});

test('does not change disabled ranges or callbacks, and omits disabled inputs from native FormData', async () => {
  const onChange = vi.fn<NonNullable<SliderProps['onChange']>>();
  const { screen, legacy, headless } = await renderPair({
    name: 'Disabled volume',
    props: {
      defaultValue: 40,
      disabled: true,
      name: 'volume',
      form: 'disabled-slider-form',
      onChange,
    },
  });
  const form = document.createElement('form');
  form.id = 'disabled-slider-form';
  screen.container.append(form);
  await userEvent.hover(screen.getByRole('button', { name: 'Before sliders' }));
  await userEvent.click(screen.getByRole('button', { name: 'Before sliders' }));
  for (const { root, input } of [legacy, headless]) {
    expect(input).toBeDisabled();
    input.focus();
    expect(input).not.toHaveFocus();
    await userEvent.keyboard('{ArrowRight}{Home}{End}');
    await userEvent.click(input, { force: true, position: { x: 180, y: 10 } });
    expect(input.valueAsNumber).toBe(40);
    expect(root.style.getPropertyValue('--fui-Slider--progress')).toBe('40%');
  }
  expect(onChange).not.toHaveBeenCalled();
  expect(new FormData(form).getAll('volume')).toEqual([]);
});

test.each(['legacy', 'headless'] as const)(
  'shares controlled keyboard, callback, submit, native reset, and explicit restore behavior with %s',
  async (implementation) => {
    const onChange = vi.fn<NonNullable<SliderProps['onChange']>>();
    const screen = await renderCoreAIComponent(
      <SliderVolumeForm implementation={implementation} onChange={onChange} />,
    );
    const input = screen.getByRole('slider', { name: 'Output volume' }).element();
    if (!(input instanceof HTMLInputElement)) throw new Error('Missing native volume range');
    const before = screen.getByRole('button', { name: 'Before volume' });
    await userEvent.hover(before);
    await userEvent.click(before);
    await userEvent.tab();
    expect(input).toHaveFocus();
    expect(input.matches(':focus-visible')).toBe(true);
    expect(input.closest('.fui-Slider')?.matches(':hover')).toBe(false);
    await userEvent.keyboard('{ArrowRight}{PageUp}');
    expect(input.valueAsNumber).toBe(60);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { value: 60 });
    await expect
      .element(screen.getByRole('status', { name: 'Current volume' }))
      .toHaveTextContent('60');
    await userEvent.click(screen.getByRole('button', { name: 'Save volume' }));
    await expect
      .element(screen.getByRole('status', { name: 'Submitted volume' }))
      .toHaveTextContent('60');
    expect(input.defaultValue).toBe('60');
    await userEvent.click(screen.getByRole('button', { name: 'Native form reset' }));
    expect(input.valueAsNumber).toBe(60);
    expect(onChange).toHaveBeenCalledTimes(2);
    await userEvent.click(screen.getByRole('button', { name: 'Restore volume' }));
    expect(input.valueAsNumber).toBe(40);
    expect(onChange).toHaveBeenCalledTimes(2);
  },
);

test('keeps current uncontrolled headless state on native form reset instead of inventing a reset adapter', async () => {
  const inputRef = React.createRef<HTMLInputElement>();
  const rootRef = React.createRef<HTMLDivElement>();
  const formRef = React.createRef<HTMLFormElement>();
  const onChange = vi.fn<NonNullable<SliderProps['onChange']>>();
  const screen = await renderCoreAIComponent(
    <form ref={formRef}>
      <button type="button">Before uncontrolled</button>
      <Slider
        ref={inputRef}
        root={{ ref: rootRef }}
        name="volume"
        defaultValue={20}
        step={10}
        onChange={onChange}
      />
    </form>,
  );
  if (!inputRef.current || !rootRef.current || !formRef.current) {
    throw new Error('Missing native form refs');
  }
  await userEvent.hover(screen.getByRole('button', { name: 'Before uncontrolled' }));
  await userEvent.click(screen.getByRole('button', { name: 'Before uncontrolled' }));
  await userEvent.tab();
  expect(rootRef.current.matches(':hover')).toBe(false);
  expect(inputRef.current.matches(':focus-visible')).toBe(true);
  await userEvent.keyboard('{ArrowRight}');
  expect(inputRef.current.valueAsNumber).toBe(30);
  expect(inputRef.current.defaultValue).toBe('30');
  expect(new FormData(formRef.current).get('volume')).toBe('30');
  formRef.current.reset();
  expect(inputRef.current.valueAsNumber).toBe(30);
  expect(rootRef.current.style.getPropertyValue('--fui-Slider--progress')).toBe('30%');
  expect(new FormData(formRef.current).get('volume')).toBe('30');
  expect(onChange).toHaveBeenCalledOnce();
});
