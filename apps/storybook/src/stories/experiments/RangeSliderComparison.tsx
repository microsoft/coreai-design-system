// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Field } from '@coreai-ds/react-components';
import { Slider } from '@coreai-ds/react-headless-components';
import {
  RangeSlider,
  type RangeSliderProps,
  type RangeSliderValue,
} from '../../../../../packages/react-headless-components/src/RangeSlider.js';
import styles from './RangeSliderComparison.module.css';

export const rangeSliderSizes = ['small', 'medium'] as const;

export interface RangeSliderExample {
  name: string;
  props: RangeSliderProps;
}

export const rangeSliderExamples: RangeSliderExample[] = [
  { name: 'Default', props: { defaultValue: { start: 20, end: 80 } } },
  ...rangeSliderSizes.map((size) => ({
    name: `Size: ${size}`,
    props: { size, defaultValue: { start: 25, end: 75 } },
  })),
  { name: 'Omitted value', props: {} },
  { name: 'Steps', props: { min: 0, max: 10, step: 2, defaultValue: { start: 2, end: 6 } } },
  { name: 'Overlapping thumbs', props: { defaultValue: { start: 50, end: 50 } } },
  { name: 'Disabled', props: { disabled: true, defaultValue: { start: 30, end: 60 } } },
  {
    name: 'Start thumb disabled',
    props: { defaultValue: { start: 30, end: 60 }, startInput: { disabled: true } },
  },
  ...rangeSliderSizes.map((size) => ({
    name: `Vertical: ${size}`,
    props: { size, vertical: true, defaultValue: { start: 25, end: 75 } },
  })),
];

function withThumbLabels(name: string, { startInput, endInput, ...props }: RangeSliderProps) {
  return {
    ...props,
    startInput: { 'aria-label': `${name} minimum`, ...(startInput as object | undefined) },
    endInput: { 'aria-label': `${name} maximum`, ...(endInput as object | undefined) },
  } satisfies RangeSliderProps;
}

/** Each row places the range slider beside a single-value headless Slider of the same size. */
export function RangeSliderComparison({
  examples = rangeSliderExamples,
}: {
  examples?: readonly RangeSliderExample[];
}) {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Example</strong>
        <strong>Headless RangeSlider</strong>
        <strong>Headless Slider reference</strong>
      </div>
      {examples.map(({ name, props }) => {
        const vertical = props.vertical ?? false;
        return (
          <div key={name} className={styles.row} data-range-slider-case={name}>
            <span>{name}</span>
            <div className={styles.cell}>
              <RangeSlider
                aria-label={name}
                {...withThumbLabels(name, props)}
                className={vertical ? styles.vertical : styles.horizontal}
              />
            </div>
            <div className={styles.cell}>
              <Slider
                aria-label={`${name} reference`}
                size={props.size}
                vertical={vertical}
                disabled={props.disabled}
                defaultValue={props.defaultValue?.end}
                className={vertical ? styles.vertical : styles.horizontal}
                data-reference-slider=""
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RangeSliderPriceFilter(props: Partial<RangeSliderProps>) {
  const [value, setValue] = React.useState<RangeSliderValue>({ start: 200, end: 800 });
  const [changes, setChanges] = React.useState(0);
  return (
    <div className={styles.playground}>
      <Field label="Price range" hint="Drag either thumb or use the arrow keys.">
        <RangeSlider
          {...props}
          min={0}
          max={1000}
          step={50}
          value={value}
          onChange={(event, data) => {
            setValue(data.value);
            setChanges((count) => count + 1);
            props.onChange?.(event, data);
          }}
          className={styles.horizontal}
          startInput={{ 'aria-label': 'Minimum price' }}
          endInput={{ 'aria-label': 'Maximum price' }}
        />
      </Field>
      <output aria-label="Selected price range">
        {value.start}–{value.end}
      </output>
      <output aria-label="Change events">{changes}</output>
      <button type="button" onClick={() => setValue({ start: 200, end: 800 })}>
        Reset range
      </button>
    </div>
  );
}
