// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  AlphaSlider as LegacyAlphaSlider,
  ColorArea as LegacyColorArea,
  ColorPicker as LegacyColorPicker,
  ColorSlider as LegacyColorSlider,
} from '@coreai-ds/react-components';
import {
  AlphaSlider,
  ColorArea,
  ColorPicker,
  ColorSlider,
  type AlphaSliderProps,
  type ColorAreaProps,
  type ColorAreaSlots,
  type ColorPickerProps,
  type ColorPickerShape,
  type ColorSliderProps,
  type ColorSliderSlots,
} from '@coreai-ds/react-headless-components';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import styles from './ColorPickerComparison.module.css';

export type FixtureColor = NonNullable<ColorPickerProps['color']>;
export const colorPickerInitialColor: FixtureColor = { h: 210, s: 0.65, v: 0.8, a: 0.55 };
export const colorPickerShapes = ['rounded', 'square'] as const;

type ExampleOptions = { name: string; consumer?: boolean };
export type ColorPickerExample = ExampleOptions &
  (
    | { kind: 'picker'; props: ColorPickerProps; areaShape?: ColorPickerShape }
    | { kind: 'area'; props: ColorAreaProps }
    | { kind: 'slider'; props: ColorSliderProps }
    | { kind: 'alpha'; props: AlphaSliderProps }
  );

const renderSliderRoot: SlotRenderFunction<ExtractSlotProps<ColorSliderSlots['root']>> = (
  Component,
  props,
) => <Component {...props} data-colorpicker-rendered-root="" />;
const renderRail: SlotRenderFunction<ExtractSlotProps<ColorSliderSlots['rail']>> = (
  Component,
  props,
) => (
  <Component {...props} data-colorpicker-rendered-rail="">
    {props.children}
    <span data-colorpicker-rail-child="" />
  </Component>
);
const renderThumb: SlotRenderFunction<ExtractSlotProps<ColorSliderSlots['thumb']>> = (
  Component,
  props,
) => <Component {...props} data-colorpicker-rendered-thumb="" />;
const renderAreaRoot: SlotRenderFunction<ExtractSlotProps<ColorAreaSlots['root']>> = (
  Component,
  props,
) => <Component {...props} data-colorpicker-rendered-area="" />;
const renderAreaThumb: SlotRenderFunction<ExtractSlotProps<ColorAreaSlots['thumb']>> = (
  Component,
  props,
) => <Component {...props} data-colorpicker-rendered-area-thumb="" />;

export const colorPickerExamples: readonly ColorPickerExample[] = [
  { name: 'Coordinated rounded', kind: 'picker', props: { color: colorPickerInitialColor } },
  {
    name: 'Coordinated square with rounded area override',
    kind: 'picker',
    props: { color: colorPickerInitialColor, shape: 'square' },
    areaShape: 'rounded',
  },
  { name: 'Area default white', kind: 'area', props: {} },
  {
    name: 'Area square with alpha',
    kind: 'area',
    props: { color: colorPickerInitialColor, shape: 'square' },
  },
  {
    name: 'Hue uncontrolled',
    kind: 'slider',
    props: { defaultColor: colorPickerInitialColor },
  },
  {
    name: 'Hue square edge',
    kind: 'slider',
    props: { color: { h: 360, s: 1, v: 1 }, shape: 'square' },
  },
  {
    name: 'Saturation channel',
    kind: 'slider',
    props: { color: colorPickerInitialColor, channel: 'saturation' },
  },
  {
    name: 'Value vertical square',
    kind: 'slider',
    props: { color: colorPickerInitialColor, channel: 'value', vertical: true, shape: 'square' },
  },
  {
    name: 'Hue vertical',
    kind: 'slider',
    props: { color: colorPickerInitialColor, vertical: true },
  },
  { name: 'Alpha default opaque black', kind: 'alpha', props: {} },
  {
    name: 'Alpha checkerboard',
    kind: 'alpha',
    props: { color: colorPickerInitialColor },
  },
  {
    name: 'Transparency checkerboard',
    kind: 'alpha',
    props: { color: colorPickerInitialColor, transparency: true, shape: 'square' },
  },
  {
    name: 'Alpha vertical',
    kind: 'alpha',
    props: { color: colorPickerInitialColor, vertical: true },
  },
  {
    name: 'Transparency vertical square',
    kind: 'alpha',
    props: {
      color: colorPickerInitialColor,
      vertical: true,
      transparency: true,
      shape: 'square',
    },
  },
  {
    name: 'Undefined visual props',
    kind: 'slider',
    props: { color: colorPickerInitialColor, shape: undefined, vertical: undefined },
  },
  {
    name: 'Slider public renderers',
    kind: 'slider',
    props: {
      color: colorPickerInitialColor,
      root: { children: renderSliderRoot, className: 'consumer-color-root' },
      input: { className: 'consumer-color-input' },
      rail: { children: renderRail, className: 'consumer-color-rail' },
      thumb: { children: renderThumb, className: 'consumer-color-thumb' },
    },
  },
  {
    name: 'Area public renderers',
    kind: 'area',
    props: {
      color: colorPickerInitialColor,
      children: renderAreaRoot,
      thumb: { children: renderAreaThumb, className: 'consumer-area-thumb' },
      inputX: { className: 'consumer-area-x' },
      inputY: { className: 'consumer-area-y' },
    },
  },
  {
    name: 'Alpha public renderers',
    kind: 'alpha',
    props: {
      color: colorPickerInitialColor,
      root: { children: renderSliderRoot, className: 'consumer-alpha-root' },
      rail: { children: renderRail, className: 'consumer-alpha-rail' },
      thumb: { children: renderThumb, className: 'consumer-alpha-thumb' },
    },
  },
];

export const colorPickerRtlExamples: readonly ColorPickerExample[] = [
  {
    name: 'RTL physical area axis',
    kind: 'area',
    props: { color: { h: 210, s: 0.25, v: 0.75, a: 0.5 } },
  },
  {
    name: 'RTL hue horizontal',
    kind: 'slider',
    props: { color: { h: 90, s: 1, v: 1 } },
  },
  {
    name: 'RTL hue vertical',
    kind: 'slider',
    props: { color: { h: 90, s: 1, v: 1 }, vertical: true },
  },
  {
    name: 'RTL transparency horizontal',
    kind: 'alpha',
    props: { color: colorPickerInitialColor, transparency: true },
  },
  {
    name: 'RTL alpha vertical',
    kind: 'alpha',
    props: { color: colorPickerInitialColor, vertical: true },
  },
];

export const colorPickerConsumerExample: ColorPickerExample = {
  name: 'Consumer family CSS',
  kind: 'picker',
  props: { color: colorPickerInitialColor, className: styles.consumerPicker },
  consumer: true,
};

function ColorFixture({
  example,
  implementation,
}: {
  example: ColorPickerExample;
  implementation: 'legacy' | 'headless';
}): React.ReactElement {
  const Picker = implementation === 'legacy' ? LegacyColorPicker : ColorPicker;
  const Area = implementation === 'legacy' ? LegacyColorArea : ColorArea;
  const Slider = implementation === 'legacy' ? LegacyColorSlider : ColorSlider;
  const Alpha = implementation === 'legacy' ? LegacyAlphaSlider : AlphaSlider;
  const consumerArea = example.consumer ? styles.consumerArea : undefined;
  const consumerSlider = example.consumer ? styles.consumerSlider : undefined;
  const consumerRail = example.consumer ? styles.consumerRail : undefined;
  const consumerThumb = example.consumer ? styles.consumerThumb : undefined;

  if (example.kind === 'picker') {
    return (
      <Picker {...example.props} style={{ width: 300, ...example.props.style }}>
        <Area
          shape={example.areaShape}
          className={consumerArea}
          inputX={{ 'aria-label': `${example.name} saturation` }}
          inputY={{ 'aria-label': `${example.name} value` }}
          thumb={{ className: consumerThumb }}
        />
        <Slider
          aria-label={`${example.name} hue`}
          className={consumerSlider}
          rail={{ className: consumerRail }}
          thumb={{ className: consumerThumb }}
        />
        <Alpha
          aria-label={`${example.name} opacity`}
          className={consumerSlider}
          rail={{ className: consumerRail }}
          thumb={{ className: consumerThumb }}
        />
      </Picker>
    );
  }
  if (example.kind === 'area') {
    return (
      <Area
        {...example.props}
        style={{ width: 300, height: 300, ...example.props.style }}
        inputX={{
          'aria-label': `${example.name} saturation`,
          ...example.props.inputX,
        }}
        inputY={{ 'aria-label': `${example.name} value`, ...example.props.inputY }}
      />
    );
  }
  if (example.kind === 'slider') {
    return (
      <Slider
        {...example.props}
        aria-label={example.name}
        style={{
          width: example.props.vertical ? 32 : 300,
          ...(example.props.vertical && { height: 280 }),
          ...example.props.style,
        }}
      />
    );
  }
  return (
    <Alpha
      {...example.props}
      aria-label={example.name}
      style={{
        width: example.props.vertical ? 32 : 300,
        ...(example.props.vertical && { height: 280 }),
        ...example.props.style,
      }}
    />
  );
}

export function ColorPickerComparison({
  examples = colorPickerExamples,
}: {
  examples?: readonly ColorPickerExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <button type="button" data-colorpicker-neutral="">
        Before color controls
      </button>
      {examples.map((example) => (
        <section key={example.name} data-colorpicker-case={example.name}>
          <h3>{example.name}</h3>
          <div className={styles.pair}>
            {(['legacy', 'headless'] as const).map((implementation) => (
              <div
                key={implementation}
                className={styles.cell}
                data-colorpicker-implementation={implementation}
              >
                <p>{implementation === 'legacy' ? 'Legacy CoreAI' : 'Headless + CSS Modules'}</p>
                <ColorFixture example={example} implementation={implementation} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function ColorPickerNativeEditor(): React.ReactElement {
  const [color, setColor] = React.useState(colorPickerInitialColor);
  const [reject, setReject] = React.useState(false);
  const [changes, setChanges] = React.useState(0);
  const [submitted, setSubmitted] = React.useState('');
  const pickerRef = React.useRef<HTMLDivElement>(null);
  const hueRef = React.useRef<HTMLInputElement>(null);
  const hueId = React.useId();
  const alphaId = React.useId();

  return (
    <form
      className={styles.editor}
      data-colorpicker-editor=""
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))));
      }}
      onReset={() => {
        setColor(colorPickerInitialColor);
        setSubmitted('');
      }}
    >
      <p>Native HSV editor</p>
      <label>
        <input
          type="checkbox"
          checked={reject}
          onChange={(event) => setReject(event.currentTarget.checked)}
        />
        Reject requested color
      </label>
      <button type="button" onClick={() => hueRef.current?.focus()}>
        Focus hue through ref
      </button>
      <ColorPicker
        ref={pickerRef}
        color={color}
        onColorChange={(_, data) => {
          setChanges((count) => count + 1);
          if (!reject) setColor(data.color);
        }}
      >
        <ColorArea
          inputX={{
            name: 'saturation',
            'aria-label': 'Editor saturation',
            'aria-valuetext': `${Math.round(color.s * 100)} percent saturation`,
          }}
          inputY={{
            name: 'value',
            'aria-label': 'Editor brightness',
            'aria-valuetext': `${Math.round(color.v * 100)} percent brightness`,
          }}
        />
        <label htmlFor={hueId}>Editor hue</label>
        <ColorSlider ref={hueRef} id={hueId} name="hue" aria-valuetext={`${color.h} degrees`} />
        <label htmlFor={alphaId}>Editor opacity</label>
        <AlphaSlider
          id={alphaId}
          name="opacity"
          min={0}
          max={100}
          aria-valuetext={`${Math.round((color.a ?? 1) * 100)} percent opacity`}
        />
      </ColorPicker>
      <output aria-label="Editor color">{JSON.stringify(color)}</output>
      <output aria-label="Editor change count">{changes}</output>
      <button type="submit">Submit HSV channels</button>
      <button type="reset">Reset color explicitly</button>
      <output aria-label="Submitted HSV channels">{submitted}</output>
    </form>
  );
}
