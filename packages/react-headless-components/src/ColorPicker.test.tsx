// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import {
  AlphaSlider as PrimitiveAlphaSlider,
  ColorArea as PrimitiveColorArea,
  ColorPicker as PrimitiveColorPicker,
  ColorSlider as PrimitiveColorSlider,
} from '@fluentui/react-headless-components-preview/color-picker';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../../apps/storybook/src/stories/experiments/HeadlessTestUtils.js';
import {
  ColorPickerComparison,
  ColorPickerNativeEditor,
  colorPickerConsumerExample,
  colorPickerExamples,
  colorPickerInitialColor,
  colorPickerRtlExamples,
  type ColorPickerExample,
  type FixtureColor,
} from '../../../apps/storybook/src/stories/experiments/ColorPickerComparison.js';
import {
  captureColorPickerStyles,
  compareColorPickerStyles,
  getColorPickerInput,
  getColorPickerSlots,
  getComparisonColorPicker,
  settleColorPickerStyles,
  type ColorPickerComparisonSlots,
} from '../../../apps/storybook/src/stories/experiments/compareColorPickerStyles.js';
import { AlphaSlider, alphaSliderClassNames, type AlphaSliderProps } from './AlphaSlider.js';
import { ColorArea, colorAreaClassNames, type ColorAreaProps } from './ColorArea.js';
import {
  ColorPicker,
  colorPickerClassNames,
  useColorPickerContextValue,
  type ColorPickerProps,
  type ColorPickerSlots,
} from './ColorPicker.js';
import {
  ColorSlider,
  colorSliderClassNames,
  type ColorSliderProps,
  type ColorSliderSlots,
} from './ColorSlider.js';
import { Field } from './Field.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

async function renderPair(
  example: ColorPickerExample,
  theme = coreaiLightTheme,
  dir: 'ltr' | 'rtl' = 'ltr',
  withComponentDefaults = true,
) {
  const screen = await renderCoreAIComponent(<ColorPickerComparison examples={[example]} />, {
    providerProps: { theme, dir, withComponentDefaults },
  });
  const legacy = getComparisonColorPicker(screen.container, 'legacy');
  const headless = getComparisonColorPicker(screen.container, 'headless');
  await userEvent.hover(screen.getByRole('button', { name: 'Before color controls' }));
  for (const root of Object.values(headless.roots)) expect(root.matches(':hover')).toBe(false);
  await Promise.all([settleColorPickerStyles(legacy), settleColorPickerStyles(headless)]);
  return { screen, legacy, headless };
}

function expectRangeGeometry(
  slots: ColorPickerComparisonSlots,
  part: 'slider' | 'alpha',
  percent: number,
  vertical: boolean,
  rtl: boolean,
) {
  const root = slots.roots[part].getBoundingClientRect();
  const thumb = slots.elements[`${part}.thumb`].getBoundingClientRect();
  const center = vertical
    ? root.bottom - (thumb.top + thumb.height / 2)
    : rtl
      ? root.right - (thumb.left + thumb.width / 2)
      : thumb.left + thumb.width / 2 - root.left;
  // CSS layout quantizes fractional percentages to 1/64px; allow less than 0.05px.
  expect(center).toBeCloseTo(((vertical ? root.height : root.width) * percent) / 100, 1);
}

function nativeRange(element: Element): HTMLInputElement {
  if (!(element instanceof HTMLInputElement)) throw new Error('Expected a native range input');
  return element;
}

test('exposes only the current native roots and restored shape visual contract', () => {
  expectTypeOf<React.ComponentRef<typeof ColorPicker>>().toEqualTypeOf<HTMLDivElement>();
  expectTypeOf<React.ComponentRef<typeof ColorArea>>().toEqualTypeOf<HTMLDivElement>();
  expectTypeOf<React.ComponentRef<typeof ColorSlider>>().toEqualTypeOf<HTMLInputElement>();
  expectTypeOf<React.ComponentRef<typeof AlphaSlider>>().toEqualTypeOf<HTMLInputElement>();
  expectTypeOf<React.ComponentProps<typeof ColorPicker>['shape']>().toEqualTypeOf<
    'rounded' | 'square' | undefined
  >();
  expectTypeOf<React.ComponentProps<typeof ColorSlider>['shape']>().toEqualTypeOf<
    'rounded' | 'square' | undefined
  >();
  expectTypeOf<ColorPickerProps>().not.toHaveProperty('defaultColor');
  expectTypeOf<ColorAreaProps>().not.toHaveProperty('disabled');
  expectTypeOf<ColorSliderProps['size']>().toEqualTypeOf<number | undefined>();
  expectTypeOf<AlphaSliderProps>().not.toHaveProperty('channel');
  expectTypeOf<ColorSliderProps['as']>().toEqualTypeOf<'input' | undefined>();
  expectTypeOf<NonNullable<ColorSliderProps['input']>['children']>().toEqualTypeOf<undefined>();
  expectTypeOf<React.ComponentProps<typeof ColorArea>['ref']>().toEqualTypeOf<
    React.ComponentProps<typeof PrimitiveColorArea>['ref']
  >();
});

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(colorPickerExamples)(
    `matches $name bounded slots, gradients, checkerboards, and geometry in ${mode}`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(
        compareColorPickerStyles(
          captureColorPickerStyles(legacy),
          captureColorPickerStyles(headless),
        ),
      ).toEqual([]);
      for (const [part, names] of [
        ['picker', colorPickerClassNames],
        ['area', colorAreaClassNames],
        ['slider', colorSliderClassNames],
        ['alpha', alphaSliderClassNames],
      ] as const) {
        if (!headless.roots[part]) continue;
        for (const [slot, name] of Object.entries(names))
          expect(headless.elements[`${part}.${slot}`]).toHaveClass(name);
      }
      for (const element of Object.values(headless.elements)) {
        expect(element).not.toHaveAttribute('shape');
        expect(element).not.toHaveAttribute('defaultColor');
        expect(element).not.toHaveAttribute('color');
      }
      for (const [part, root] of Object.entries(headless.roots)) {
        if (part === 'picker') continue;
        expect(root).toHaveAttribute(
          'data-shape',
          part === 'area' && example.kind === 'picker' && example.areaShape
            ? example.areaShape
            : (example.props.shape ?? 'rounded'),
        );
        if (part === 'slider' || part === 'alpha') {
          const input = getColorPickerInput(headless, `${part}.input`);
          expect(input).toHaveAttribute('type', 'range');
          expect(input).toHaveAccessibleName(
            example.kind === 'picker'
              ? `${example.name} ${part === 'slider' ? 'hue' : 'opacity'}`
              : example.name,
          );
          const vertical = root.getAttribute('data-orientation') === 'vertical';
          expect(input).toHaveAttribute('aria-orientation', vertical ? 'vertical' : 'horizontal');
          const progress = Number.parseFloat(
            root.style.getPropertyValue(
              part === 'alpha' ? '--fui-AlphaSlider--progress' : '--fui-Slider--progress',
            ),
          );
          expectRangeGeometry(headless, part, progress, vertical, false);
        }
      }
      if (headless.roots.alpha) {
        expect(getComputedStyle(headless.elements['alpha.rail']).backgroundImage).toContain(
          'transparent-pattern.png',
        );
        expect(getComputedStyle(headless.elements['alpha.rail']).backgroundImage).toContain(
          'linear-gradient',
        );
      }
    },
  );

  test(`preserves ordinary consumer priority across the combined composed family in ${mode}`, async () => {
    const { legacy, headless } = await renderPair(colorPickerConsumerExample, theme);
    const selected = captureColorPickerStyles(headless);
    expect(selected['picker.root.row-gap']).toBe('12px');
    expect(selected['area.root.min-width']).toBe('260px');
    expect(selected['area.root.min-height']).toBe('180px');
    expect(selected['area.root.border-top-width']).toBe('3px');
    expect(selected['area.root.border-top-left-radius']).toBe('3px');
    for (const part of ['slider', 'alpha']) {
      expect(selected[`${part}.root.min-height`]).toBe('44px');
      expect(selected[`${part}.rail.background-image`]).toBe('none');
      expect(selected[`${part}.rail.border-top-left-radius`]).toBe('1px');
      expect(selected[`${part}.thumb.box-shadow`]).toBe('none');
      expect(selected[`${part}.thumb.border-top-left-radius`]).toBe('3px');
      expect(selected[`${part}.thumb::before.border-top-width`]).toBe('1px');
      expect(selected[`${part}.thumb::before.border-top-style`]).toBe('dashed');
      expect(getComputedStyle(headless.elements[`${part}.thumb`]).width).toBe('28px');
      if (!matchMedia('(forced-colors: active)').matches) {
        expect(selected[`${part}.rail.background-color`]).toBe('rgb(210, 230, 240)');
        expect(selected[`${part}.thumb.background-color`]).toBe('rgb(90, 40, 130)');
      }
    }
    expect(
      compareColorPickerStyles(captureColorPickerStyles(legacy), selected, { consumer: true })
        .length,
    ).toBeGreaterThan(0);
  });
}

test.each([true, false])(
  'has the same stock family defaults with CoreAI defaults=%s',
  async (withComponentDefaults) => {
    const { legacy, headless } = await renderPair(
      { name: 'Defaults', kind: 'picker', props: { shape: undefined } },
      coreaiLightTheme,
      'ltr',
      withComponentDefaults,
    );
    expect(
      compareColorPickerStyles(
        captureColorPickerStyles(legacy),
        captureColorPickerStyles(headless),
      ),
    ).toEqual([]);
    expect(headless.roots.picker).toHaveAttribute('data-shape', 'rounded');
    expect(getColorPickerInput(headless, 'slider.input').value).toBe('0');
    expect(getColorPickerInput(headless, 'alpha.input').value).toBe('100');
    expect(getColorPickerInput(headless, 'area.inputX').value).toBe('0');
    expect(getColorPickerInput(headless, 'area.inputY').value).toBe('100');
    expect(headless.roots.area.getBoundingClientRect().width).toBe(300);
    expect(headless.roots.area.getBoundingClientRect().height).toBe(300);
    expect(headless.roots.slider.getBoundingClientRect().height).toBe(32);
  },
);

test('preserves public root/slot renderers, caller content, classes, and native element identity', async () => {
  for (const name of [
    'Slider public renderers',
    'Area public renderers',
    'Alpha public renderers',
  ]) {
    const example = colorPickerExamples.find((candidate) => candidate.name === name);
    if (!example) throw new Error(`Missing ${name}`);
    const { headless } = await renderPair(example);
    const root = Object.values(headless.roots)[0];
    if (example.kind === 'area') {
      expect(root).toHaveAttribute('data-colorpicker-rendered-area');
      expect(headless.elements['area.thumb']).toHaveAttribute(
        'data-colorpicker-rendered-area-thumb',
      );
      expect(getColorPickerInput(headless, 'area.inputX')).toHaveClass('consumer-area-x');
      expect(getColorPickerInput(headless, 'area.inputY')).toHaveClass('consumer-area-y');
      expect(headless.elements['area.thumb'].contains(headless.elements['area.inputX'])).toBe(true);
    } else {
      const part = example.kind === 'alpha' ? 'alpha' : 'slider';
      expect(root).toHaveAttribute('data-colorpicker-rendered-root');
      expect(headless.elements[`${part}.rail`]).toHaveAttribute('data-colorpicker-rendered-rail');
      expect(headless.elements[`${part}.thumb`]).toHaveAttribute('data-colorpicker-rendered-thumb');
      expect(
        headless.elements[`${part}.rail`].querySelector('[data-colorpicker-rail-child]'),
      ).toBeInstanceOf(HTMLSpanElement);
    }
    await cleanup();
  }
});

test('uses the published context for shape and keeps the supplied color object unchanged', async () => {
  const observe =
    vi.fn<(color: ColorPickerProps['color'], shape: ColorPickerProps['shape']) => void>();
  function Probe() {
    const color = useColorPickerContextValue((context) => context.color);
    const shape = useColorPickerContextValue((context) => context.shape);
    observe(color, shape);
    return null;
  }
  const screen = await renderCoreAIComponent(
    <ColorPicker color={colorPickerInitialColor} shape="square">
      <Probe />
      <ColorArea inputX={{ 'aria-label': 'Saturation' }} inputY={{ 'aria-label': 'Value' }} />
      <ColorSlider aria-label="Hue" shape="rounded" />
      <AlphaSlider aria-label="Opacity" />
    </ColorPicker>,
  );
  const slots = getColorPickerSlots(screen.container);
  expect(observe).toHaveBeenLastCalledWith(colorPickerInitialColor, 'square');
  expect(observe.mock.lastCall?.[0]).toBe(colorPickerInitialColor);
  expect(slots.roots.area).toHaveAttribute('data-shape', 'square');
  expect(slots.roots.slider).toHaveAttribute('data-shape', 'rounded');
  expect(slots.roots.alpha).toHaveAttribute('data-shape', 'square');
});

test('keeps the picker native div ref and public root renderer without replacing its slot', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const renderRoot: SlotRenderFunction<ExtractSlotProps<ColorPickerSlots['root']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-picker-root-renderer="">
      <button type="button">Caller child</button>
    </Component>
  );
  const screen = await renderCoreAIComponent(
    <ColorPicker ref={rootRef} className="consumer-picker">
      {renderRoot}
    </ColorPicker>,
  );
  expect(rootRef.current).toBe(screen.container.querySelector('[data-picker-root-renderer]'));
  expect(rootRef.current).toHaveClass('consumer-picker', colorPickerClassNames.root);
  expect(screen.getByRole('button', { name: 'Caller child' })).toBeVisible();
});

for (const channel of ['hue', 'saturation', 'value'] as const) {
  test(`preserves uncontrolled native ${channel} keyboard values and callback identity`, async () => {
    const changes = vi.fn<NonNullable<ColorSliderProps['onChange']>>();
    const inputRef = React.createRef<HTMLInputElement>();
    const screen = await renderCoreAIComponent(
      <>
        <button type="button">Before channel</button>
        <ColorSlider
          ref={inputRef}
          aria-label="Channel"
          channel={channel}
          defaultColor={colorPickerInitialColor}
          onChange={changes}
        />
      </>,
    );
    const before = screen.getByRole('button', { name: 'Before channel' });
    await userEvent.hover(before);
    await userEvent.click(before);
    await userEvent.tab();
    expect(inputRef.current).toHaveFocus();
    expect(inputRef.current?.matches(':hover')).toBe(false);
    await userEvent.keyboard('{ArrowRight}');
    const expectedColor = {
      ...colorPickerInitialColor,
      ...(channel === 'hue' ? { h: 211 } : channel === 'saturation' ? { s: 0.66 } : { v: 0.81 }),
    };
    const [event, data] = changes.mock.lastCall ?? [];
    expect(data?.color).toEqual(expectedColor);
    expect(data?.event).toBe(event);
    expect(data?.type).toBe('change');
    expect(event?.target).toBe(inputRef.current);
    expect(inputRef.current?.valueAsNumber).toBe(
      channel === 'hue' ? 211 : channel === 'saturation' ? 66 : 81,
    );
    await userEvent.keyboard('{Home}');
    expect(inputRef.current?.valueAsNumber).toBe(0);
    await userEvent.keyboard('{End}');
    expect(inputRef.current?.valueAsNumber).toBe(channel === 'hue' ? 360 : 100);
    expect(changes).toHaveBeenCalledTimes(3);
  });
}

test.each([false, true])(
  'keeps native alpha/transparency=%s callback colors and input-slot event ordering',
  async (transparency) => {
    const order: string[] = [];
    const inputEvent = vi.fn<React.ChangeEventHandler<HTMLInputElement>>(() => order.push('input'));
    const changes = vi.fn<NonNullable<AlphaSliderProps['onChange']>>(() => order.push('color'));
    const screen = await renderCoreAIComponent(
      <AlphaSlider
        aria-label="Alpha"
        defaultColor={{ h: 210, s: 0.65, v: 0.8, a: 0.5 }}
        transparency={transparency}
        onChange={changes}
        input={{ onChange: inputEvent }}
      />,
    );
    const input = screen.getByRole('slider', { name: 'Alpha' });
    nativeRange(input.element()).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(input).toHaveValue('51');
    expect(changes.mock.lastCall?.[1].color).toEqual({
      h: 210,
      s: 0.65,
      v: 0.8,
      a: transparency ? 0.49 : 0.51,
    });
    expect(changes.mock.lastCall?.[1].event).toBe(changes.mock.lastCall?.[0]);
    expect(inputEvent.mock.lastCall?.[0]).toBe(changes.mock.lastCall?.[0]);
    expect(order).toEqual(['input', 'color']);
  },
);

test('preserves native input-slot ref precedence and composed component callbacks', async () => {
  const forwarded = React.createRef<HTMLInputElement>();
  const supplied = React.createRef<HTMLInputElement>();
  const changes = vi.fn<NonNullable<ColorSliderProps['onChange']>>();
  const slotChanges = vi.fn<React.ChangeEventHandler<HTMLInputElement>>();
  const inputProps: ExtractSlotProps<ColorSliderSlots['input']> & {
    'data-consumer-color-input': string;
  } = {
    as: 'input',
    ref: supplied,
    className: 'consumer-native-color',
    'data-consumer-color-input': 'preserved',
    onChange: slotChanges,
  };
  const screen = await renderCoreAIComponent(
    <ColorSlider
      ref={forwarded}
      aria-label="Supplied input"
      defaultColor={colorPickerInitialColor}
      onChange={changes}
      input={inputProps}
    />,
  );
  const input = screen.getByRole('slider', { name: 'Supplied input' });
  expect(supplied.current).toBe(input.element());
  expect(forwarded.current).toBeNull();
  expect(input).toHaveClass('consumer-native-color', colorSliderClassNames.input);
  expect(input).toHaveAttribute('data-consumer-color-input', 'preserved');
  nativeRange(input.element()).focus();
  await userEvent.keyboard('{ArrowRight}');
  expect(slotChanges).toHaveBeenCalledTimes(1);
  expect(changes).toHaveBeenCalledTimes(1);
  expect(slotChanges.mock.lastCall?.[0]).toBe(changes.mock.lastCall?.[0]);
});

test('keeps controlled rejection, member callback priority, ref identity, and prop updates', async () => {
  const pickerRef = React.createRef<HTMLDivElement>();
  const areaRef = React.createRef<HTMLDivElement>();
  const hueRef = React.createRef<HTMLInputElement>();
  const opacityRef = React.createRef<HTMLInputElement>();
  const groupChanges = vi.fn<NonNullable<ColorPickerProps['onColorChange']>>();
  const childChanges = vi.fn<NonNullable<ColorSliderProps['onChange']>>();
  const control = (color: FixtureColor, shape: 'rounded' | 'square') => (
    <ColorPicker ref={pickerRef} color={color} shape={shape} onColorChange={groupChanges}>
      <ColorArea
        ref={areaRef}
        inputX={{ 'aria-label': 'Controlled saturation' }}
        inputY={{ 'aria-label': 'Controlled value' }}
      />
      <ColorSlider ref={hueRef} aria-label="Controlled hue" onChange={childChanges} />
      <AlphaSlider ref={opacityRef} aria-label="Controlled opacity" />
    </ColorPicker>
  );
  const screen = await renderCoreAIComponent(control(colorPickerInitialColor, 'rounded'));
  const identities = [pickerRef.current, areaRef.current, hueRef.current, opacityRef.current];
  if (!hueRef.current || !opacityRef.current) throw new Error('Missing controlled inputs');
  hueRef.current.focus();
  await userEvent.keyboard('{ArrowRight}');
  expect(childChanges.mock.lastCall?.[1].color.h).toBe(211);
  expect(groupChanges).not.toHaveBeenCalled();
  expect(hueRef.current.value).toBe('210');
  opacityRef.current.focus();
  await userEvent.keyboard('{ArrowLeft}');
  expect(groupChanges.mock.calls.map(([, data]) => data.color.a)).toEqual([0.54, 0.55]);
  expect(groupChanges.mock.lastCall?.[1].event).toBe(groupChanges.mock.lastCall?.[0]);
  expect(opacityRef.current.value).toBe('55');
  await screen.rerender(control({ h: 120, s: 0.2, v: 0.4, a: 0.75 }, 'square'));
  expect([pickerRef.current, areaRef.current, hueRef.current, opacityRef.current]).toEqual(
    identities,
  );
  expect(hueRef.current.value).toBe('120');
  expect(opacityRef.current.value).toBe('75');
  const slots = getColorPickerSlots(screen.container);
  expect(getColorPickerInput(slots, 'area.inputX').value).toBe('20');
  expect(getColorPickerInput(slots, 'area.inputY').value).toBe('40');
  for (const root of Object.values(slots.roots))
    expect(root).toHaveAttribute('data-shape', 'square');
});

test.each([
  {
    name: 'rejected fractional alpha',
    alpha: 0.55,
    accept: false,
    requested: [0.54, 0.55],
    final: 55,
  },
  { name: 'accepted fractional alpha', alpha: 0.55, accept: true, requested: [0.54], final: 54 },
  { name: 'rejected exact native alpha', alpha: 0.5, accept: false, requested: [0.49], final: 50 },
])(
  'preserves raw-current native callbacks for $name without a normalization shim',
  async ({ alpha, accept, requested, final }) => {
    for (const Component of [PrimitiveAlphaSlider, AlphaSlider]) {
      const changes = vi.fn<NonNullable<AlphaSliderProps['onChange']>>();
      const inputRef = React.createRef<HTMLInputElement>();
      function ControlledAlpha() {
        const [color, setColor] = React.useState<FixtureColor>({
          ...colorPickerInitialColor,
          a: alpha,
        });
        return (
          <Component
            ref={inputRef}
            aria-label="Controlled alpha boundary"
            color={color}
            onChange={(event, data) => {
              changes(event, data);
              if (accept) setColor(data.color);
            }}
          />
        );
      }
      await renderCoreAIComponent(<ControlledAlpha />);
      if (!inputRef.current) throw new Error('Missing native alpha input');
      const input = inputRef.current;
      expect(input.valueAsNumber).toBeCloseTo(alpha * 100, 12);
      input.focus();
      await userEvent.keyboard('{ArrowLeft}');
      expect(changes.mock.calls.map(([, data]) => data.color.a)).toEqual(requested);
      for (const [event, data] of changes.mock.calls) {
        expect(data.event).toBe(event);
        expect(event.target).toBe(input);
      }
      expect(input.valueAsNumber).toBe(final);
      await cleanup();
    }
  },
);

test.each([
  { name: 'omitted native minimum', min: undefined, expected: 1e-14 },
  { name: 'explicit native minimum', min: 0, expected: 0 },
])(
  'preserves the raw-current alpha pointer step base with $name and its exact-zero safe form',
  async ({ min, expected }) => {
    for (const Component of [PrimitiveAlphaSlider, AlphaSlider]) {
      const changes = vi.fn<NonNullable<AlphaSliderProps['onChange']>>();
      const inputRef = React.createRef<HTMLInputElement>();
      await renderCoreAIComponent(
        <Component
          ref={inputRef}
          aria-label="Alpha pointer step base"
          defaultColor={colorPickerInitialColor}
          min={min}
          max={100}
          style={{ width: 300 }}
          input={
            Component === PrimitiveAlphaSlider
              ? { style: { width: 300, height: 20, margin: 0, padding: 0 } }
              : undefined
          }
          onChange={changes}
        />,
      );
      if (!inputRef.current) throw new Error('Missing native alpha input');
      const input = inputRef.current;
      await userEvent.click(input, { position: { x: 1, y: 10 } });
      expect(input.valueAsNumber).toBe(expected);
      expect(changes.mock.lastCall?.[1].color.a).toBe(expected / 100);
      expect(changes.mock.lastCall?.[0].target).toBe(input);
      expect(changes.mock.lastCall?.[1].event).toBe(changes.mock.lastCall?.[0]);
      await cleanup();
    }
  },
);

for (const dir of ['ltr', 'rtl'] as const) {
  test(`preserves current physical ColorArea pointer/keyboard coordinates and merged native refs in ${dir}`, async () => {
    for (const Component of [PrimitiveColorArea, ColorArea]) {
      const rootRef = React.createRef<HTMLDivElement>();
      const thumbRef = React.createRef<HTMLDivElement>();
      const xRef = React.createRef<HTMLInputElement>();
      const yRef = React.createRef<HTMLInputElement>();
      const changes = vi.fn<NonNullable<ColorAreaProps['onChange']>>();
      const screen = await renderCoreAIComponent(
        <Component
          ref={rootRef}
          style={{ width: 300, height: 300 }}
          defaultColor={colorPickerInitialColor}
          onChange={changes}
          thumb={{ ref: thumbRef }}
          inputX={{ ref: xRef, 'aria-label': 'Physical saturation' }}
          inputY={{ ref: yRef, 'aria-label': 'Physical value' }}
        />,
        { providerProps: { dir } },
      );
      if (!rootRef.current || !thumbRef.current || !xRef.current || !yRef.current)
        throw new Error('Missing area refs');
      const root = rootRef.current;
      const x = xRef.current;
      const y = yRef.current;
      expect(root.contains(x)).toBe(true);
      expect(thumbRef.current.contains(y)).toBe(true);
      await userEvent.click(root, { position: { x: 75, y: 90 } });
      expect(x.value).toBe('25');
      expect(y.value).toBe('70');
      const [pointer, data] = changes.mock.lastCall ?? [];
      expect(pointer).toBeInstanceOf(PointerEvent);
      expect(data?.event).toBe(pointer);
      expect(data?.color).toEqual({ ...colorPickerInitialColor, s: 0.25, v: 0.7 });
      x.focus();
      await userEvent.keyboard('{ArrowRight}{ArrowUp}');
      expect(x.value).toBe('26');
      expect(y.value).toBe('71');
      expect(x).toHaveAttribute('tabindex', '-1');
      expect(y).toHaveAttribute('tabindex', '0');
      const [keyboard, latest] = changes.mock.lastCall ?? [];
      expect(latest?.event).toBe(keyboard);
      expect(keyboard?.target).toBe(x);
      expect(latest?.color.s).toBeCloseTo(0.26, 12);
      expect(latest?.color.v).toBeCloseTo(0.71, 12);
      expect(changes).toHaveBeenCalledTimes(3);
      if (Component === ColorArea) {
        const area = getColorPickerSlots(screen.container);
        const rect = root.getBoundingClientRect();
        const thumb = area.elements['area.thumb'].getBoundingClientRect();
        const border = Number.parseFloat(getComputedStyle(root).borderLeftWidth);
        expect(thumb.left + thumb.width / 2 - rect.left).toBeCloseTo(
          border + (rect.width - border * 2) * 0.26,
          1,
        );
      }
      await cleanup();
    }
  });

  for (const vertical of [false, true]) {
    for (const alpha of [false, true]) {
      test(`uses native ${alpha ? 'alpha' : 'hue'} pointer/keyboard polarity for vertical=${vertical} in ${dir}`, async () => {
        const Primitive = alpha ? PrimitiveAlphaSlider : PrimitiveColorSlider;
        const Styled = alpha ? AlphaSlider : ColorSlider;
        for (const Component of [Primitive, Styled]) {
          const inputRef = React.createRef<HTMLInputElement>();
          const changes = vi.fn<NonNullable<ColorSliderProps['onChange']>>();
          const screen = await renderCoreAIComponent(
            <Component
              ref={inputRef}
              vertical={vertical}
              aria-label="Native polarity"
              defaultColor={{ h: 180, s: 0.65, v: 0.8, a: 0.5 }}
              step={alpha ? 25 : 90}
              style={{ width: vertical ? 32 : 300, ...(vertical && { height: 280 }) }}
              input={
                Component === Primitive
                  ? {
                      style: {
                        width: vertical ? 20 : 300,
                        height: vertical ? 280 : 20,
                        margin: 0,
                        padding: 0,
                        ...(vertical && { writingMode: 'vertical-lr', direction: 'rtl' }),
                      },
                    }
                  : undefined
              }
              onChange={changes}
            />,
            { providerProps: { dir } },
          );
          if (!inputRef.current) throw new Error('Missing native range');
          const input = inputRef.current;
          const max = alpha ? 100 : 360;
          await userEvent.click(input, {
            position: vertical ? { x: 10, y: 70 } : { x: 225, y: 10 },
          });
          const expected = max * (!vertical && dir === 'rtl' ? 0.25 : 0.75);
          expect(input.valueAsNumber).toBe(expected);
          expect(changes.mock.lastCall?.[0].target).toBe(input);
          expect(changes.mock.lastCall?.[1].event).toBe(changes.mock.lastCall?.[0]);
          expect(changes.mock.lastCall?.[1].color[alpha ? 'a' : 'h']).toBe(
            alpha ? expected / 100 : expected,
          );
          await userEvent.keyboard(
            vertical ? '{ArrowDown}' : dir === 'rtl' ? '{ArrowRight}' : '{ArrowLeft}',
          );
          expect(input.valueAsNumber).toBe(expected - max / 4);
          expect(changes).toHaveBeenCalledTimes(2);
          if (Component === Styled) {
            expectRangeGeometry(
              getColorPickerSlots(screen.container),
              alpha ? 'alpha' : 'slider',
              (input.valueAsNumber / max) * 100,
              vertical,
              dir === 'rtl',
            );
          }
          await cleanup();
        }
      });
    }
  }
}

test.each(colorPickerRtlExamples)(
  'reports only proven native-axis RTL differences for $name',
  async (example) => {
    const { legacy, headless } = await renderPair(example, coreaiLightTheme, 'rtl');
    const differences = compareColorPickerStyles(
      captureColorPickerStyles(legacy),
      captureColorPickerStyles(headless),
      { rtl: true },
    );
    expect(differences.filter((difference) => difference.kind === 'unexpected')).toEqual([]);
    const vertical =
      (example.kind === 'slider' || example.kind === 'alpha') && example.props.vertical;
    if (example.kind === 'area' || vertical) expect(differences.length).toBeGreaterThan(0);
    if (example.kind !== 'area' && !vertical) expect(differences).toEqual([]);
  },
);

test.each([false, true])(
  'supplies current native range focus treatment, actual hover=%s, without focus attributes',
  async (hover) => {
    const screen = await renderCoreAIComponent(
      <>
        <button type="button">Park pointer</button>
        <ColorArea
          inputX={{ 'aria-label': 'Focus saturation' }}
          inputY={{ 'aria-label': 'Focus value' }}
        />
        <ColorSlider aria-label="Focus hue" />
        <AlphaSlider aria-label="Focus opacity" />
      </>,
    );
    const slots = getColorPickerSlots(screen.container);
    const park = screen.getByRole('button', { name: 'Park pointer' });
    for (const part of ['area', 'slider', 'alpha'] as const) {
      await userEvent.hover(park);
      await userEvent.click(park);
      const input = getColorPickerInput(slots, part === 'area' ? 'area.inputX' : `${part}.input`);
      input.focus();
      await userEvent.keyboard('{ArrowRight}');
      if (hover) await userEvent.hover(slots.roots[part]);
      expect(input.matches(':focus-visible')).toBe(true);
      expect(slots.roots[part].matches(':hover')).toBe(hover);
      await settleColorPickerStyles(slots);
      const thumb = slots.elements[`${part}.thumb`];
      if (part === 'area') {
        const after = getComputedStyle(thumb, '::after');
        expect(after.content).toBe('""');
        expect(after.borderTopWidth).toBe('2px');
        expect(after.pointerEvents).toBe('none');
      } else {
        const expected = document.createElement('span');
        expected.style.color = coreaiLightTheme.colorStrokeFocus2;
        expect(getComputedStyle(thumb).borderTopWidth).toBe('2px');
        expect(getComputedStyle(thumb).borderTopColor).toBe(expected.style.color);
        expect(getComputedStyle(thumb).outlineWidth).toBe('2px');
      }
    }
  },
);

test('keeps native disabled range controls inactive and does not invent an area disabled API', async () => {
  const hueChange = vi.fn<NonNullable<ColorSliderProps['onChange']>>();
  const alphaChange = vi.fn<NonNullable<AlphaSliderProps['onChange']>>();
  const screen = await renderCoreAIComponent(
    <>
      <button type="button">Before disabled</button>
      <ColorSlider aria-label="Disabled hue" disabled onChange={hueChange} />
      <AlphaSlider aria-label="Disabled opacity" disabled onChange={alphaChange} />
      <button type="button">After disabled</button>
    </>,
  );
  const before = screen.getByRole('button', { name: 'Before disabled' });
  await userEvent.click(before);
  await userEvent.tab();
  expect(screen.getByRole('button', { name: 'After disabled' })).toHaveFocus();
  for (const name of ['Disabled hue', 'Disabled opacity']) {
    const input = screen.getByRole('slider', { name });
    const initialValue = nativeRange(input.element()).value;
    expect(input).toBeDisabled();
    await userEvent.click(input, { force: true });
    await userEvent.keyboard('{ArrowRight}');
    expect(input).not.toHaveFocus();
    expect(input).toHaveValue(initialValue);
  }
  expect(hueChange).not.toHaveBeenCalled();
  expect(alphaChange).not.toHaveBeenCalled();
});

test('documents the raw-current area input-disabled and range readonly boundaries without a shim', async () => {
  for (const Area of [PrimitiveColorArea, ColorArea]) {
    const changes = vi.fn<NonNullable<ColorAreaProps['onChange']>>();
    const areaRef = React.createRef<HTMLDivElement>();
    await renderCoreAIComponent(
      <Area
        ref={areaRef}
        defaultColor={colorPickerInitialColor}
        style={{ width: 300, height: 300 }}
        inputX={{ disabled: true, 'aria-label': 'Disabled axis X' }}
        inputY={{ disabled: true, 'aria-label': 'Disabled axis Y' }}
        onChange={changes}
      />,
    );
    if (!areaRef.current) throw new Error('Missing current area');
    await userEvent.click(areaRef.current, { position: { x: 150, y: 150 } });
    expect(changes.mock.lastCall?.[1].color).toEqual({
      ...colorPickerInitialColor,
      s: 0.5,
      v: 0.5,
    });
    await cleanup();
  }
  for (const Component of [PrimitiveColorSlider, ColorSlider]) {
    const changes = vi.fn<NonNullable<ColorSliderProps['onChange']>>();
    const screen = await renderCoreAIComponent(
      <Component
        readOnly
        aria-label="Readonly native range"
        defaultColor={colorPickerInitialColor}
        onChange={changes}
      />,
    );
    const input = screen.getByRole('slider', { name: 'Readonly native range' });
    nativeRange(input.element()).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(input).toHaveValue('211');
    expect(changes.mock.lastCall?.[1].color.h).toBe(211);
    await cleanup();
  }
});

test('uses explicit Field render props for native labeling, descriptions, invalid state, and names', async () => {
  const screen = await renderCoreAIComponent(
    <form aria-label="Color form">
      <Field
        label="Field hue"
        hint="Degrees around the color wheel"
        validationMessage="Review hue"
        validationState="error"
        required
      >
        {(control) => <ColorSlider {...control} name="hue" color={colorPickerInitialColor} />}
      </Field>
    </form>,
  );
  const input = screen.getByRole('slider', { name: 'Field hue' });
  expect(input).toHaveAccessibleDescription('Review hue Degrees around the color wheel');
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAttribute('aria-required', 'true');
  const form = screen.getByRole('form', { name: 'Color form' }).element();
  if (!(form instanceof HTMLFormElement)) throw new Error('Missing native form');
  expect(new FormData(form).get('hue')).toBe('210');
});

test('keeps current uncontrolled colors independent under an unbound coordinator', async () => {
  for (const Picker of [PrimitiveColorPicker, ColorPicker]) {
    const changes = vi.fn<NonNullable<ColorPickerProps['onColorChange']>>();
    const screen = await renderCoreAIComponent(
      <Picker onColorChange={changes}>
        <ColorSlider aria-label="Independent hue" defaultColor={colorPickerInitialColor} />
        <AlphaSlider aria-label="Independent opacity" defaultColor={colorPickerInitialColor} />
      </Picker>,
    );
    const hue = screen.getByRole('slider', { name: 'Independent hue' });
    nativeRange(hue.element()).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(hue).toHaveValue('211');
    expect(screen.getByRole('slider', { name: 'Independent opacity' })).toHaveValue('55');
    expect(changes.mock.lastCall?.[1].color).toEqual({ ...colorPickerInitialColor, h: 211 });
    await cleanup();
  }
});

test('keeps native form reset at the latest hook-owned uncontrolled range value', async () => {
  for (const Component of [PrimitiveColorSlider, ColorSlider]) {
    const changes = vi.fn<NonNullable<ColorSliderProps['onChange']>>();
    const screen = await renderCoreAIComponent(
      <form aria-label="Native reset">
        <Component
          aria-label="Uncontrolled hue"
          name="hue"
          defaultColor={colorPickerInitialColor}
          onChange={changes}
        />
        <button type="reset">Native reset color</button>
      </form>,
    );
    const input = screen.getByRole('slider', { name: 'Uncontrolled hue' });
    nativeRange(input.element()).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(input).toHaveValue('211');
    await userEvent.click(screen.getByRole('button', { name: 'Native reset color' }));
    expect(input).toHaveValue('211');
    expect(changes).toHaveBeenCalledTimes(1);
    await cleanup();
  }
});

test('keeps the shared native editor coordinated, rejects changes, submits channels, and resets explicitly', async () => {
  const screen = await renderCoreAIComponent(<ColorPickerNativeEditor />);
  const hue = screen.getByRole('slider', { name: 'Editor hue' });
  const opacity = screen.getByRole('slider', { name: 'Editor opacity' });
  await userEvent.click(screen.getByRole('button', { name: 'Focus hue through ref' }));
  expect(hue).toHaveFocus();
  await userEvent.keyboard('{ArrowRight}');
  expect(hue).toHaveValue('211');
  nativeRange(opacity.element()).focus();
  await userEvent.keyboard('{ArrowLeft}');
  expect(opacity).toHaveValue('54');
  await userEvent.click(screen.getByRole('button', { name: 'Submit HSV channels' }));
  expect(screen.getByRole('status', { name: 'Submitted HSV channels' })).toHaveTextContent(
    '{"saturation":"65","value":"80","hue":"211","opacity":"54"}',
  );
  await userEvent.click(screen.getByRole('checkbox', { name: 'Reject requested color' }));
  await userEvent.click(screen.getByRole('button', { name: 'Focus hue through ref' }));
  await userEvent.keyboard('{ArrowRight}');
  expect(hue).toHaveValue('211');
  expect(screen.getByRole('status', { name: 'Editor change count' })).toHaveTextContent('3');
  await userEvent.click(screen.getByRole('button', { name: 'Reset color explicitly' }));
  expect(hue).toHaveValue('210');
  expect(opacity).toHaveValue('55');
  expect(screen.getByRole('status', { name: 'Submitted HSV channels' })).toBeEmptyDOMElement();
});
