// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import {
  Label,
  Radio,
  RadioGroup,
  type RadioGroupProps,
} from '@coreai-ds/react-headless-components';
import {
  RadioGroupComparison,
  radioGroupConsumerExample,
  radioGroupLayouts,
  radioGroupOptions,
  type RadioGroupExample,
} from './RadioGroupComparison.js';
import {
  captureRadioGroupStyles,
  captureRadioStyles,
  compareRadioGroupStyles,
  getComparisonRadioGroup,
  settleRadioGroupStyles,
  type RadioGroupStyleDifference,
} from './compareRadioGroupStyles.js';
import styles from './RadioGroupComparison.module.css';

function ComparisonWithReport({
  examples,
  consumerOverrides = false,
}: {
  examples?: readonly RadioGroupExample[];
  consumerOverrides?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (RadioGroupStyleDifference & { example: string })[] | null
  >(null);
  const [comparing, setComparing] = React.useState(false);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('RadioGroup comparison has not mounted');
    setComparing(true);
    try {
      const results: (RadioGroupStyleDifference & { example: string })[] = [];
      for (const row of container.querySelectorAll<HTMLElement>('[data-radiogroup-case]')) {
        const legacy = getComparisonRadioGroup(row, 'legacy');
        const headless = getComparisonRadioGroup(row, 'headless');
        await Promise.all([settleRadioGroupStyles(legacy), settleRadioGroupStyles(headless)]);
        results.push(
          ...compareRadioGroupStyles(
            captureRadioGroupStyles(legacy),
            captureRadioGroupStyles(headless),
          ).map((difference) => ({ example: row.dataset.radiogroupCase ?? '', ...difference })),
        );
      }
      setDifferences(results);
    } finally {
      setComparing(false);
    }
  };

  return (
    <div>
      <p>
        Both implementations share the active provider and fixtures, but have distinct input ids and
        native group names. CoreAI adds no Radio or RadioGroup defaults or visual overrides. Radio
        has one 16px indicator size; its Label slot supports small, medium, and large text.
      </p>
      <p>
        The report compares bounded group layout, radio, input, CSS dot, Label, required-marker, and
        focus-ring styles and dimensions at rest. The default dot uses CSS rather than a glyph.
        Native named radio inputs own arrows, Space, Tab, selection, and form behavior. No
        focusgroup, Tabster handler, or overlay polyfill is needed.
      </p>
      <p>
        Captured rectangle widths and heights allow up to 0.5 CSSpx of fractional grid-allocation
        noise. Offsets and CSS property strings are compared exactly.
      </p>
      <p>
        In the pinned hook, Field required sets aria-required on the group. Set RadioGroup required
        as well to require native form validation. Field errors set aria-invalid on the group, not
        on each input. These current boundaries are kept rather than changed to match newer docs.
      </p>
      {consumerOverrides && (
        <p>
          Intentional difference: ordinary consumer CSS overrides the new layered group and slot
          styles. Legacy Griffel can retain its selection colors, padding, or vertical layout. The
          report shows these differences without hiding properties.
        </p>
      )}
      <button type="button" onClick={compare} disabled={comparing}>
        Compare resting styles
      </button>
      <output className={styles.report} aria-label="Computed style comparison" aria-live="polite">
        {differences === null
          ? 'Comparison not run.'
          : differences.length
            ? JSON.stringify(differences, null, 2)
            : 'No differences in the selected properties.'}
      </output>
      <div ref={containerRef}>
        <RadioGroupComparison examples={examples} />
      </div>
    </div>
  );
}

function RadioGroupPlayground(props: RadioGroupProps) {
  const labelId = React.useId();
  const [value, setValue] = React.useState(props.defaultValue ?? 'standard');
  const [lastChange, setLastChange] = React.useState('No changes yet.');
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  return (
    <form
      className={styles.playground}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get('plan') ?? '(omitted)'));
      }}
    >
      <button type="button">Before plans</button>
      <Label id={labelId} required={props.required}>
        Plan
      </Label>
      <RadioGroup
        {...props}
        aria-labelledby={labelId}
        name="plan"
        value={value}
        onChange={(event, data) => {
          props.onChange?.(event, data);
          setValue(data.value);
          setLastChange(`onChange.value: ${data.value}.`);
        }}
      >
        {radioGroupOptions.map((option) => (
          <Radio key={option.value} {...option} />
        ))}
      </RadioGroup>
      <button type="submit">Inspect form data</button>
      <button type="button" onClick={() => setValue('')}>
        Clear selection
      </button>
      <output aria-label="Plan selection" aria-live="polite">
        Selected: {value || '(none)'}. {lastChange}{' '}
        {submitted === null ? 'No form inspection yet.' : `Form value: ${submitted}.`}
      </output>
    </form>
  );
}

const meta = {
  title: 'Experiments/Headless RadioGroup',
  component: RadioGroup,
  subcomponents: { Radio },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment: public useRadio/renderRadio and useRadioGroup/useRadioGroupContextValues/renderRadioGroup APIs from headless 0.3.2, with CSS Modules ported from react-radio 9.6.7. Reuses local Label through the current public slot-render contract. Native input grouping, selection, callbacks, refs, Field context, and forms are unchanged. Only the missing current visual layout prop is restored. Native :focus-visible replaces legacy focus selectors. Production Radio and RadioGroup are unchanged; arbitrary legacy customStyleHooks are not called.',
      },
    },
  },
  argTypes: {
    layout: { control: 'select', options: radioGroupLayouts },
    defaultValue: { control: 'select', options: ['', 'free', 'standard', 'team'] },
    value: { control: false },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(() =>
      expect(canvas.getByRole('status', { name: 'Computed style comparison' })).toHaveTextContent(
        'No differences in the selected properties.',
      ),
    );
  },
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[radioGroupConsumerExample]} consumerOverrides />,
  play: async ({ canvas, canvasElement }) => {
    const headless = getComparisonRadioGroup(canvasElement, 'headless');
    await settleRadioGroupStyles(headless);
    const group = captureRadioGroupStyles(headless);
    const radio = captureRadioStyles(headless.radios[0]);
    await expect(group['group.flex-direction']).toBe('row');
    await expect(group['group.gap']).toBe('12px');
    await expect(radio['input.width']).toBe('44.00');
    await expect(radio['indicator.width']).toBe('24.00');
    await expect(radio['indicator.height']).toBe('24.00');
    await expect(radio['indicator.border-radius']).toBe('3px');
    await expect(radio['indicator.border-top-color']).toBe('rgb(40, 110, 60)');
    await expect(radio['label.color']).toBe('rgb(20, 90, 160)');
    await expect(radio['label.padding-left']).toBe('12px');
    await expect(radio['required.padding-left']).toBe('10px');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(() =>
      expect(
        canvas.getByRole('status', { name: 'Computed style comparison' }),
      ).not.toHaveTextContent('Comparison not run.'),
    );
  },
};

export const Playground: Story = {
  args: {
    layout: 'vertical',
    defaultValue: 'standard',
    required: true,
    onChange: fn(),
  },
  render: (args) => <RadioGroupPlayground {...args} />,
  play: async ({ args, canvas }) => {
    const standard = canvas.getByRole('radio', { name: 'Standard' });
    const team = canvas.getByRole('radio', { name: 'Team' });
    await expect(standard).toBeChecked();
    await userEvent.click(canvas.getByText('Team', { selector: 'label' }));
    await expect(team).toBeChecked();
    await expect(standard).not.toBeChecked();
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.anything(), { value: 'team' });
    await userEvent.click(canvas.getByRole('button', { name: 'Inspect form data' }));
    await expect(canvas.getByRole('status', { name: 'Plan selection' })).toHaveTextContent(
      'Form value: team.',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Before plans' }));
    await userEvent.hover(canvas.getByText('Plan', { selector: 'label' }));
    await userEvent.tab();
    await expect(team).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(standard).toHaveFocus();
    await expect(standard).toBeChecked();
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.anything(), { value: 'standard' });
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Inspect form data' })).toHaveFocus();
  },
};
