// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Field,
  ProgressBar as LegacyProgressBar,
  type FieldProps,
} from '@coreai-ds/react-components';
import {
  ProgressBar as HeadlessProgressBar,
  type ProgressBarProps,
  type ProgressBarSlots,
} from '@coreai-ds/react-headless-components';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import styles from './ProgressBarComparison.module.css';

export const progressBarShapes = ['rounded', 'square'] as const;
export const progressBarThicknesses = ['medium', 'large'] as const;
export const progressBarColors = ['brand', 'error', 'warning', 'success'] as const;

export interface ProgressBarExample {
  name: string;
  props: ProgressBarProps;
  field?: Pick<FieldProps, 'label' | 'hint' | 'validationMessage' | 'validationState'>;
  expectedBarWidth?: string;
}

const renderBar: SlotRenderFunction<ExtractSlotProps<ProgressBarSlots['bar']>> = (
  Component,
  props,
) => (
  <Component {...props} data-rendered-bar="">
    {props.children}
    <span data-consumer-bar-child="" />
  </Component>
);

const renderRoot: SlotRenderFunction<ExtractSlotProps<ProgressBarSlots['root']>> = (
  Component,
  props,
) => (
  <Component {...props} data-rendered-root="">
    {props.children}
    <span data-consumer-root-child="" />
  </Component>
);

export const progressBarExamples: ProgressBarExample[] = [
  { name: 'Default', props: { value: 0.5 } },
  ...progressBarColors.map((color) => ({
    name: `Color: ${color}`,
    props: { color, value: 0.65, thickness: 'large' as const },
  })),
  ...progressBarShapes.map((shape) => ({
    name: `Shape: ${shape}`,
    props: { shape, thickness: 'large' as const, value: 0.4 },
  })),
  ...progressBarThicknesses.map((thickness) => ({
    name: `Thickness: ${thickness}`,
    props: { thickness, value: 0.7 },
  })),
  { name: 'Zero', props: { value: 0 } },
  { name: 'Near-zero reset', props: { value: 0.005 } },
  { name: 'Transition threshold', props: { value: 0.01 } },
  { name: 'Above transition threshold', props: { value: 0.02 } },
  { name: 'Complete', props: { value: 1, color: 'success' } },
  { name: 'Numeric maximum', props: { max: 42, value: 21, 'aria-valuetext': '21 of 42 files' } },
  { name: 'Indeterminate', props: {} },
  { name: 'Indeterminate square large', props: { shape: 'square', thickness: 'large' } },
  { name: 'Indeterminate status stays brand', props: { color: 'error' } },
  {
    name: 'Explicitly undefined visual props and value',
    props: { shape: undefined, thickness: undefined, color: undefined, value: undefined },
  },
  {
    name: 'Explicitly undefined bar',
    props: { value: 0.5, bar: undefined },
  },
  {
    name: 'Consumer inline bar width',
    props: { value: 0.5, bar: { style: { width: '37%' }, className: 'consumer-bar' } },
    expectedBarWidth: '37%',
  },
  {
    name: 'Bar slot renderer',
    props: { value: 0.6, bar: { className: 'consumer-bar', children: renderBar } },
  },
  {
    name: 'Root slot renderer',
    props: { value: 0.6, children: renderRoot, className: 'consumer-root' },
  },
  ...(['error', 'warning', 'success'] as const).map((validationState) => ({
    name: `Field: ${validationState}`,
    props: { value: 0.75 },
    field: {
      label: 'Project upload',
      hint: 'Keep this page open.',
      validationMessage: `Upload ${validationState}`,
      validationState,
    },
  })),
  {
    name: 'Explicit color wins over Field',
    props: { value: 0.75, color: 'brand' },
    field: { label: 'Project upload', validationState: 'error', validationMessage: 'Upload error' },
  },
];

export interface ProgressBarRangeExample extends ProgressBarExample {
  expectedMax: number;
  expectedValue: number | undefined;
  diagnostic?: string;
}

export const progressBarRangeExamples: ProgressBarRangeExample[] = [
  { name: 'Omitted maximum', props: { value: 0.25 }, expectedMax: 1, expectedValue: 0.25 },
  {
    name: 'Explicitly undefined maximum',
    props: { max: undefined, value: 0.25 },
    expectedMax: 1,
    expectedValue: 0.25,
  },
  {
    name: 'Zero maximum falls back to one',
    props: { max: 0, value: 0.5 },
    expectedMax: 1,
    expectedValue: 0.5,
    diagnostic: "The prop 'max' must be greater than 0.",
  },
  {
    name: 'Negative maximum falls back to one',
    props: { max: -5, value: 0.5 },
    expectedMax: 1,
    expectedValue: 0.5,
    diagnostic: "The prop 'max' must be greater than 0.",
  },
  {
    name: 'Negative value clamps to zero',
    props: { max: 10, value: -1 },
    expectedMax: 10,
    expectedValue: 0,
    diagnostic: "The prop 'value' must be greater than or equal to zero.",
  },
  {
    name: 'Value above maximum clamps to maximum',
    props: { max: 10, value: 12 },
    expectedMax: 10,
    expectedValue: 10,
    diagnostic: "The prop 'value' must be less than or equal to 'max'.",
  },
  { name: 'Omitted value', props: { max: 10 }, expectedMax: 10, expectedValue: undefined },
  {
    name: 'Explicitly undefined value',
    props: { max: 10, value: undefined },
    expectedMax: 10,
    expectedValue: undefined,
  },
];

export const progressBarConsumerExample: ProgressBarExample = {
  name: 'Consumer CSS Modules',
  props: {
    value: 0.6,
    shape: 'rounded',
    thickness: 'large',
    color: 'error',
    className: styles.consumerRoot,
    bar: { className: styles.consumerBar },
  },
};

function ProgressBarFixture({
  implementation,
  name,
  props,
  field,
}: ProgressBarExample & { implementation: 'legacy' | 'headless' }): React.ReactElement {
  const Component = implementation === 'legacy' ? LegacyProgressBar : HeadlessProgressBar;
  const control = (
    <Component {...props} aria-label={props['aria-label'] ?? (field ? undefined : name)} />
  );
  return (
    <div className={styles.cell} data-progressbar-implementation={implementation}>
      {field ? <Field {...field}>{control}</Field> : control}
    </div>
  );
}

export function ProgressBarComparison({
  examples = progressBarExamples,
}: {
  examples?: readonly ProgressBarExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-progressbar-case={example.name}>
          <span>{example.name}</span>
          <ProgressBarFixture {...example} implementation="legacy" />
          <ProgressBarFixture {...example} implementation="headless" />
        </div>
      ))}
    </div>
  );
}

export function ProgressBarUpload(props: ProgressBarProps): React.ReactElement {
  const [value, setValue] = React.useState<number | undefined>(undefined);
  const complete = value === 4;
  const status =
    value === undefined
      ? 'Preparing upload…'
      : complete
        ? 'Upload complete'
        : `${value} of 4 files uploaded`;
  return (
    <div className={styles.playground}>
      <p>Advance a deterministic mock upload. There are no timers or network requests.</p>
      <div
        role="region"
        aria-label="Project upload"
        aria-busy={!complete}
        className={styles.upload}
      >
        <output aria-label="Upload status" aria-live="polite">
          {status}
        </output>
        <HeadlessProgressBar
          {...props}
          aria-label="Files uploaded"
          aria-valuetext={status}
          max={4}
          value={value}
        />
      </div>
      <button type="button" disabled={value !== undefined} onClick={() => setValue(0)}>
        Discover upload size
      </button>
      <button
        type="button"
        disabled={value === undefined || complete}
        onClick={() => setValue((previous) => Math.min(4, (previous ?? 0) + 1))}
      >
        Upload next file
      </button>
      <button type="button" disabled={value === undefined} onClick={() => setValue(undefined)}>
        Restart upload
      </button>
    </div>
  );
}
