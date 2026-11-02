// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Field, Slider as LegacySlider, type FieldProps } from '@coreai-ds/react-components';
import {
  Slider as HeadlessSlider,
  type SliderProps,
  type SliderSlots,
} from '@coreai-ds/react-headless-components';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import styles from './SliderComparison.module.css';

export const sliderSizes = ['small', 'medium'] as const;

export interface SliderExample {
  name: string;
  props: SliderProps;
  field?: Pick<FieldProps, 'label' | 'hint' | 'validationMessage' | 'validationState' | 'required'>;
}

const renderRoot: SlotRenderFunction<ExtractSlotProps<SliderSlots['root']>> = (
  Component,
  props,
) => <Component {...props} data-rendered-root="" />;

const renderRail: SlotRenderFunction<ExtractSlotProps<SliderSlots['rail']>> = (
  Component,
  props,
) => (
  <Component {...props} data-rendered-rail="">
    {props.children}
    <span data-consumer-rail-child="" />
  </Component>
);

const renderThumb: SlotRenderFunction<ExtractSlotProps<SliderSlots['thumb']>> = (
  Component,
  props,
) => (
  <Component {...props} data-rendered-thumb="">
    {props.children}
    <span data-consumer-thumb-child="" />
  </Component>
);

export const sliderExamples: SliderExample[] = [
  { name: 'Default', props: { defaultValue: 35 } },
  ...sliderSizes.map((size) => ({
    name: `Size: ${size}`,
    props: { size, defaultValue: 35 },
  })),
  { name: 'Omitted value', props: {} },
  { name: 'Minimum', props: { value: 0 } },
  { name: 'Maximum', props: { value: 100 } },
  { name: 'Disabled', props: { defaultValue: 40, disabled: true, step: 10 } },
  { name: 'Negative range', props: { min: -20, max: 20, step: 5, defaultValue: -10 } },
  { name: 'Fractional steps', props: { min: 0, max: 1, step: 0.125, defaultValue: 0.625 } },
  ...sliderSizes.map((size) => ({
    name: `Vertical: ${size}`,
    props: { size, vertical: true, defaultValue: 25, step: 25 },
  })),
  {
    name: 'Explicitly undefined visual and range props',
    props: {
      size: undefined,
      vertical: undefined,
      disabled: undefined,
      defaultValue: undefined,
      min: undefined,
      max: undefined,
      step: undefined,
    },
  },
  {
    name: 'Root, rail, and thumb render functions',
    props: {
      defaultValue: 60,
      root: { className: 'consumer-root', children: renderRoot },
      input: { className: 'consumer-input' },
      rail: { className: 'consumer-rail', children: renderRail },
      thumb: { className: 'consumer-thumb', children: renderThumb },
    },
  },
  {
    name: 'Field association',
    props: { defaultValue: 40, step: 10 },
    field: {
      label: 'Output volume',
      hint: 'Use headphones at a comfortable volume.',
      validationMessage: 'Volume needs review.',
      validationState: 'error',
      required: true,
    },
  },
];

export interface SliderRangeExample extends SliderExample {
  expectedInputValue: number;
  expectedProgress: number;
}

export const sliderRangeExamples: SliderRangeExample[] = [
  {
    name: 'Below minimum',
    props: { min: 10, max: 50, value: -20 },
    expectedInputValue: 10,
    expectedProgress: 0,
  },
  {
    name: 'Above maximum',
    props: { min: 10, max: 50, value: 90 },
    expectedInputValue: 50,
    expectedProgress: 100,
  },
  {
    name: 'Native step snapping',
    props: { min: 0, max: 10, step: 2, value: 3 },
    expectedInputValue: 4,
    expectedProgress: 30,
  },
  {
    name: 'Step base follows minimum',
    props: { min: 3, max: 15, step: 4, defaultValue: 7 },
    expectedInputValue: 7,
    expectedProgress: 100 / 3,
  },
  {
    name: 'Maximum outside the step grid',
    props: { min: 0, max: 10, step: 3, value: 10 },
    expectedInputValue: 9,
    expectedProgress: 100,
  },
  {
    name: 'Fractional negative range',
    props: { min: -1, max: 1, step: 0.25, value: 0.25 },
    expectedInputValue: 0.25,
    expectedProgress: 62.5,
  },
];

export const sliderConsumerExample: SliderExample = {
  name: 'Consumer CSS Modules',
  props: {
    defaultValue: 50,
    className: styles.consumerRoot,
    rail: { className: styles.consumerRail },
    thumb: { className: styles.consumerThumb },
  },
};

function SliderFixture({
  implementation,
  name,
  props,
  field,
}: SliderExample & { implementation: 'legacy' | 'headless' }): React.ReactElement {
  const Component = implementation === 'legacy' ? LegacySlider : HeadlessSlider;
  const control = (
    <Component
      {...props}
      style={{
        width: props.vertical ? (props.size === 'small' ? '24px' : '32px') : '240px',
        ...(props.vertical && { height: '180px' }),
        ...props.style,
      }}
      aria-label={props['aria-label'] ?? (field ? undefined : name)}
    />
  );
  return (
    <div className={styles.cell} data-slider-implementation={implementation}>
      {field ? <Field {...field}>{control}</Field> : control}
    </div>
  );
}

export function SliderComparison({
  examples = sliderExamples,
}: {
  examples?: readonly SliderExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <button type="button" className={styles.neutral} data-slider-neutral="">
        Before sliders
      </button>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-slider-case={example.name}>
          <span>{example.name}</span>
          <SliderFixture {...example} implementation="legacy" />
          <SliderFixture {...example} implementation="headless" />
        </div>
      ))}
    </div>
  );
}

export function SliderVolumeForm({
  implementation = 'headless',
  ...props
}: SliderProps & { implementation?: 'legacy' | 'headless' }): React.ReactElement {
  const Component = implementation === 'legacy' ? LegacySlider : HeadlessSlider;
  const id = React.useId();
  const [value, setValue] = React.useState(40);
  const [changes, setChanges] = React.useState(0);
  const [submitted, setSubmitted] = React.useState('Not submitted');

  return (
    <form
      className={styles.playground}
      aria-label="Volume settings"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get('volume')));
      }}
    >
      <button type="button">Before volume</button>
      <label htmlFor={id}>Output volume</label>
      <Component
        {...props}
        id={id}
        name="volume"
        min={0}
        max={100}
        step={10}
        value={value}
        defaultValue={undefined}
        style={{ width: '240px', ...props.style }}
        aria-valuetext={`${value} percent`}
        onChange={(event, data) => {
          setValue(data.value);
          setChanges((count) => count + 1);
          props.onChange?.(event, data);
        }}
      />
      <output aria-label="Current volume">{value}</output>
      <output aria-label="Change events">{changes}</output>
      <output aria-label="Submitted volume">{submitted}</output>
      <button type="submit">Save volume</button>
      <button type="reset">Native form reset</button>
      <button type="button" onClick={() => setValue(40)}>
        Restore volume
      </button>
    </form>
  );
}
