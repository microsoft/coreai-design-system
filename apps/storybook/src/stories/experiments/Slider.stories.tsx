// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { FluentProvider } from '@coreai-ds/react-components';
import { Slider } from '@coreai-ds/react-headless-components';
import {
  SliderComparison,
  SliderVolumeForm,
  sliderConsumerExample,
  sliderRangeExamples,
  sliderSizes,
  type SliderExample,
} from './SliderComparison.js';
import {
  captureSliderStyles,
  compareSliderStyles,
  getComparisonSlider,
  settleSliderStyles,
  sliderVerticalRtlDirectionDifference,
  type SliderStyleDifference,
} from './compareSliderStyles.js';
import styles from './SliderComparison.module.css';

function ComparisonWithReport({
  examples,
  consumerOverrides = false,
}: {
  examples?: readonly SliderExample[];
  consumerOverrides?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (SliderStyleDifference & { example: string })[] | null
  >(null);
  const [comparing, setComparing] = React.useState(false);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Slider comparison has not mounted');
    setComparing(true);
    try {
      const rows = [...container.querySelectorAll<HTMLElement>('[data-slider-case]')];
      if (!rows.length) throw new Error('Slider comparison has no examples');
      const pairs = rows.map((row) => ({
        example: row.dataset.sliderCase ?? '',
        legacy: getComparisonSlider(row, 'legacy'),
        headless: getComparisonSlider(row, 'headless'),
      }));
      await Promise.all(
        pairs.flatMap(({ legacy, headless }) => [
          settleSliderStyles(legacy),
          settleSliderStyles(headless),
        ]),
      );
      setDifferences(
        pairs.flatMap(({ example, legacy, headless }) =>
          compareSliderStyles(captureSliderStyles(legacy), captureSliderStyles(headless)).map(
            (difference) => ({ example, ...difference }),
          ),
        ),
      );
    } finally {
      setComparing(false);
    }
  };

  return (
    <div>
      <p>
        Both columns share the active theme and fixtures. CoreAI re-exports Fluent Slider without
        additional defaults or overrides. The current public headless hook owns the native range
        input, callbacks, Field association, slots, refs, and resolved progress/step/direction
        variables. Only small/medium size is restored as a visual prop.
      </p>
      <p>
        This report compares selected root/input/rail/thumb styles, their actual dimensions and
        offsets, rail step marks, thumb borders, and the focus pseudo-element. Horizontal controls
        are 240px wide; vertical controls are 180px tall. Native input :focus-visible supplies
        keyboard modality. Modern writing-mode: vertical-lr with direction: rtl puts the maximum at
        the top in both text directions; no browser-version probe or deprecated vertical appearance
        is copied. Slider has no visual animation or overlay/focusgroup polyfill.
      </p>
      <p>
        Root, rail, and thumb support public slot render functions. The void input accepts native
        props, events, classes, and refs, not render children. Pinned public slot precedence is
        unchanged: input.onChange replaces the component callback, and input.ref takes precedence
        over a simultaneous forwarded ref. The wrapper does not add callback or ref adapters.
      </p>
      <p>
        Intentional vertical RTL difference: Griffel flips the legacy input&apos;s direction from
        rtl to ltr, reversing its native keyboard/pointer behavior while the visual rail and thumb
        still put max at the top. The port keeps native direction rtl in both text directions. The
        RTL report therefore shows exactly input.direction, not an excluded property. At the same
        top-quarter point (10,45) in a 20×180 input, legacy selects 25 with its visual thumb
        centered at Y=130; the port and directly styled current primitive select 75. The port&apos;s
        visual thumb is centered at Y=50.
      </p>
      {consumerOverrides && (
        <p>
          Intentional difference: ordinary unlayered CSS overrides the new layered rail thickness,
          thumb size, color, shadow, corners, and border. Griffel may retain its original values.
          The report displays these differences rather than excluding them.
        </p>
      )}
      <button type="button" onClick={compare} disabled={comparing}>
        Compare selected styles
      </button>
      <output className={styles.report} aria-label="Computed style comparison" aria-live="polite">
        {differences === null
          ? 'Comparison not run.'
          : differences.length
            ? JSON.stringify(differences, null, 2)
            : 'No differences in the selected properties.'}
      </output>
      <div ref={containerRef}>
        <SliderComparison examples={examples} />
      </div>
    </div>
  );
}

function RightToLeftComparison() {
  return (
    <FluentProvider dir="rtl">
      <ComparisonWithReport
        examples={[
          { name: 'RTL horizontal', props: { defaultValue: 25, step: 25 } },
          { name: 'RTL small', props: { defaultValue: 75, size: 'small' } },
          { name: 'RTL vertical', props: { defaultValue: 25, step: 25, vertical: true } },
        ]}
      />
    </FluentProvider>
  );
}

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless Slider',
  component: Slider,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment: public useSlider/renderSlider from headless preview 0.3.2, with CSS Modules from react-slider 9.6.8. The only omitted visual prop, small/medium size, is stripped before calling the native hook. CoreAI has no Slider defaults or style override. Current input refs, slot render functions, classes, data-disabled/data-vertical, native stepping, form values, and Field label/description semantics remain headless-owned. The hook already supplies resolved progress, step, and direction variables; the wrapper does not recompute or snap them. Native range sanitization may snap an off-step DOM value while the hook retains the original visual progress. Native form reset likewise does not reset hook state; applications can reset a controlled value explicitly. Native focus-visible and modern vertical writing mode replace legacy focus selectors and browser probes. No component-specific JavaScript polyfill is needed. Production Slider and legacy customStyleHooks are unchanged.',
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: sliderSizes },
    vertical: { control: 'boolean' },
    disabled: { control: 'boolean' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    input: { control: false },
    root: { control: false },
    rail: { control: false },
    thumb: { control: false },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare selected styles' }));
    await waitFor(() =>
      expect(canvas.getByRole('status', { name: 'Computed style comparison' })).toHaveTextContent(
        'No differences in the selected properties.',
      ),
    );
  },
};

export const RangeEdges: Story = {
  render: () => (
    <>
      <p>
        These shared fixtures expose current headless and native-browser range resolution. Off-step
        value 3 with step 2 becomes native value 4 while visual progress remains 30%. Maximum 10
        with step 3 becomes native value 9 while visual progress remains 100%. These inherited
        differences are asserted, not normalized again by the styling port.
      </p>
      <ComparisonWithReport examples={sliderRangeExamples} />
    </>
  ),
  play: async ({ canvasElement, canvas }) => {
    for (const example of sliderRangeExamples) {
      const row = [...canvasElement.querySelectorAll<HTMLElement>('[data-slider-case]')].find(
        (candidate) => candidate.dataset.sliderCase === example.name,
      );
      if (!row) throw new Error(`Missing range fixture ${example.name}`);
      for (const implementation of ['legacy', 'headless'] as const) {
        const { root, input } = getComparisonSlider(row, implementation);
        await expect(input.valueAsNumber).toBe(example.expectedInputValue);
        await expect(
          Number.parseFloat(root.style.getPropertyValue('--fui-Slider--progress')),
        ).toBeCloseTo(example.expectedProgress);
      }
    }
    await userEvent.click(canvas.getByRole('button', { name: 'Compare selected styles' }));
    await waitFor(() =>
      expect(canvas.getByRole('status', { name: 'Computed style comparison' })).toHaveTextContent(
        'No differences in the selected properties.',
      ),
    );
  },
};

export const RightToLeft: Story = {
  render: () => <RightToLeftComparison />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare selected styles' }));
    const report = canvas.getByRole('status', { name: 'Computed style comparison' });
    await waitFor(() => expect(report).toHaveTextContent('"input.direction"'));
    await expect(JSON.parse(report.textContent ?? 'null')).toEqual([
      { example: 'RTL vertical', ...sliderVerticalRtlDirectionDifference },
    ]);
  },
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[sliderConsumerExample]} consumerOverrides />,
  play: async ({ canvasElement, canvas }) => {
    const { root, rail, thumb } = getComparisonSlider(canvasElement, 'headless');
    await expect(getComputedStyle(root).minHeight).toBe('44px');
    await expect(thumb.getBoundingClientRect().width).toBe(28);
    await expect(rail.getBoundingClientRect().height).toBe(8);
    await expect(getComputedStyle(thumb).boxShadow).toBe('none');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare selected styles' }));
    await waitFor(() =>
      expect(canvas.getByRole('status', { name: 'Computed style comparison' })).toHaveTextContent(
        '"property"',
      ),
    );
  },
};

export const KeyboardAndForm: Story = {
  args: { size: 'medium', onChange: fn() },
  render: (args) => (
    <>
      <p>
        Use the native keyboard range controls, save the form value, then explicitly restore the
        controlled setting. Native form reset retains the current hook value and emits no change.
      </p>
      <p>
        This play uses native stepUp/stepDown and input events. Storybook&apos;s synthetic keyboard
        events do not invoke the browser&apos;s default range stepping. Trusted keyboard and pointer
        behavior is covered in the Vitest Chromium tests and standalone Playwright checks.
      </p>
      <SliderVolumeForm {...args} />
    </>
  ),
  play: async ({ canvas, args }) => {
    const before = canvas.getByRole('button', { name: 'Before volume' });
    const input = canvas.getByRole('slider', { name: 'Output volume' });
    if (!(input instanceof HTMLInputElement)) throw new Error('Missing native volume range');
    const volume = canvas.getByRole('status', { name: 'Current volume' });
    await userEvent.hover(before);
    await userEvent.click(before);
    await userEvent.tab();
    await expect(input).toHaveFocus();
    await expect(input.matches(':focus-visible')).toBe(true);
    await expect(input.closest('.fui-Slider')?.matches(':hover')).toBe(false);
    input.stepUp();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await waitFor(() => expect(volume).toHaveTextContent('50'));
    await expect(input).toHaveValue('50');
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.anything(), { value: 50 });
    input.stepUp();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await waitFor(() => expect(volume).toHaveTextContent('60'));
    await expect(input).toHaveValue('60');
    input.stepDown(100);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await waitFor(() => expect(volume).toHaveTextContent('0'));
    await expect(input).toHaveValue('0');
    input.stepUp(100);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await waitFor(() => expect(volume).toHaveTextContent('100'));
    await expect(input).toHaveValue('100');
    await expect(args.onChange).toHaveBeenCalledTimes(4);
    await userEvent.click(canvas.getByRole('button', { name: 'Save volume' }));
    await expect(canvas.getByRole('status', { name: 'Submitted volume' })).toHaveTextContent('100');
    await userEvent.click(canvas.getByRole('button', { name: 'Native form reset' }));
    await expect(input).toHaveValue('100');
    await expect(args.onChange).toHaveBeenCalledTimes(4);
    await userEvent.click(canvas.getByRole('button', { name: 'Restore volume' }));
    await expect(input).toHaveValue('40');
    await expect(canvas.getByRole('status', { name: 'Change events' })).toHaveTextContent('4');
  },
};
