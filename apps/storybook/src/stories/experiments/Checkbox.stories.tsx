// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { Checkbox, type CheckboxProps } from '@coreai-ds/react-headless-components';
import {
  CheckboxComparison,
  checkboxConsumerExample,
  checkboxShapes,
  checkboxSizes,
  type CheckboxExample,
} from './CheckboxComparison.js';
import {
  captureCheckboxStyles,
  compareCheckboxStyles,
  getCheckboxSlots,
  getComparisonCheckbox,
  settleCheckboxStyles,
  type CheckboxStyleDifference,
} from './compareCheckboxStyles.js';
import styles from './CheckboxComparison.module.css';

function ComparisonWithReport({
  examples,
  consumerOverrides = false,
}: {
  examples?: readonly CheckboxExample[];
  consumerOverrides?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (CheckboxStyleDifference & { example: string })[] | null
  >(null);
  const [comparing, setComparing] = React.useState(false);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Checkbox comparison has not mounted');
    setComparing(true);
    try {
      const rows = [...container.querySelectorAll<HTMLElement>('[data-checkbox-case]')];
      if (!rows.length) throw new Error('Checkbox comparison has no examples');
      const results: (CheckboxStyleDifference & { example: string })[] = [];
      for (const row of rows) {
        const legacy = getComparisonCheckbox(row, 'legacy');
        const headless = getComparisonCheckbox(row, 'headless');
        await Promise.all([settleCheckboxStyles(legacy), settleCheckboxStyles(headless)]);
        results.push(
          ...compareCheckboxStyles(
            captureCheckboxStyles(legacy),
            captureCheckboxStyles(headless),
          ).map((difference) => ({ example: row.dataset.checkboxCase ?? '', ...difference })),
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
        Both columns share the active provider, theme, and fixtures, with distinct native input ids.
        Click a label or use Tab and Space to toggle. The report compares selected owned-slot
        styles, dimensions, and default glyph visibility at rest, not screenshots or transition
        frames.
      </p>
      <p>
        Headless behavior supplies native checked and indeterminate state. The completed local Label
        supplies the label foundation; Checkbox adds only its layout and inherited control color.
        Focus styling uses native :focus-visible rather than legacy focus attributes.
      </p>
      {consumerOverrides && (
        <p>
          Intentional cascade difference: unlayered consumer CSS overrides the headless indicator,
          input hit target, Label, and required marker. Legacy Griffel can retain its own styles.
        </p>
      )}
      <button type="button" onClick={compare} disabled={comparing}>
        Compare resting styles
      </button>
      <output className={styles.report} aria-label="Computed style comparison" aria-live="polite">
        {differences === null
          ? 'Comparison not run.'
          : differences.length
            ? `${differences.length} differences:\n${JSON.stringify(differences, null, 2)}`
            : 'No differences in the selected properties.'}
      </output>
      <div ref={containerRef}>
        <CheckboxComparison examples={examples} />
      </div>
    </div>
  );
}

function CheckboxPlayground(props: CheckboxProps) {
  const id = React.useId();
  const [checked, setChecked] = React.useState<CheckboxProps['checked']>(
    props.checked ?? props.defaultChecked ?? false,
  );
  const [lastChange, setLastChange] = React.useState('No changes yet.');
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  return (
    <form
      className={styles.playground}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get('updates') ?? '(not selected)'));
      }}
    >
      <Checkbox
        {...props}
        id={id}
        name="updates"
        value="yes"
        checked={checked}
        onChange={(event, data) => {
          props.onChange?.(event, data);
          setChecked(data.checked);
          setLastChange(`onChange: ${String(data.checked)}`);
        }}
      />
      <button type="button" onClick={() => setChecked('mixed')}>
        Set mixed
      </button>
      <button type="submit">Save preferences</button>
      <output aria-label="Last checkbox change" aria-live="polite">
        {lastChange}
      </output>
      <output aria-label="Submitted preferences" aria-live="polite">
        {submitted === null ? 'No submission yet.' : `Submitted updates: ${submitted}`}
      </output>
    </form>
  );
}

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment: public Fluent headless Checkbox hook and renderer with layered CSS Modules, the local Label visual foundation, and headless SVG glyphs. CoreAI adds no Checkbox defaults or style overrides. Native form behavior and mixed state remain owned by the public behavior hook. Arbitrary legacy customStyleHooks are not called; use CSS classes or slots. Production Checkbox is unchanged.',
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: checkboxSizes },
    shape: { control: 'select', options: checkboxShapes },
    labelPosition: { control: 'select', options: ['before', 'after'] },
    checked: { control: 'select', options: [false, true, 'mixed'] },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await expect(
      await canvas.findByText('No differences in the selected properties.'),
    ).toBeVisible();
  },
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[checkboxConsumerExample]} consumerOverrides />,
  play: async ({ canvas, canvasElement }) => {
    const root = getComparisonCheckbox(canvasElement, 'headless');
    await settleCheckboxStyles(root);
    const values = captureCheckboxStyles(root);
    const { label, required } = getCheckboxSlots(root);
    if (!label || !required) throw new Error('Missing consumer Label or required marker');
    await expect(values['indicator.width']).toBe('24.00');
    await expect(values['indicator.border-radius']).toBe('3px');
    await expect(values['input.width']).toBe('44.00');
    await expect(getComputedStyle(label).paddingInlineStart).toBe('12px');
    await expect(getComputedStyle(required).paddingInlineStart).toBe('10px');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole('status', { name: 'Computed style comparison' }),
      ).not.toHaveTextContent('Comparison not run.');
    });
  },
};

export const Playground: Story = {
  args: {
    label: 'Send project updates',
    required: true,
    disabled: false,
    shape: 'square',
    size: 'medium',
    checked: false,
    onChange: fn(),
  },
  render: (args) => <CheckboxPlayground {...args} />,
  play: async ({ args, canvas, canvasElement }) => {
    const checkbox = canvas.getByRole('checkbox', { name: 'Send project updates' });
    const label = canvas.getByText('Send project updates', { selector: 'label' });
    await expect(checkbox).not.toBeChecked();
    await userEvent.click(canvas.getByRole('button', { name: 'Save preferences' }));
    await expect(canvas.getByText('No submission yet.')).toBeVisible();
    await userEvent.click(label);
    await expect(checkbox).toBeChecked();
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.anything(), { checked: true });
    await userEvent.click(canvas.getByRole('button', { name: 'Save preferences' }));
    await expect(canvas.getByText('Submitted updates: yes')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Set mixed' }));
    await expect(checkbox).toBePartiallyChecked();
    const root = canvasElement.querySelector<HTMLElement>('.fui-Checkbox');
    if (!root) throw new Error('Missing Playground Checkbox');
    const input = getCheckboxSlots(root).input;
    await expect(input.indeterminate).toBe(true);
    await expect(input.checked).toBe(false);
    await userEvent.click(label);
    await expect(checkbox).toBeChecked();
    await expect(input.indeterminate).toBe(false);
    await userEvent.keyboard(' ');
    await expect(checkbox).not.toBeChecked();
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.anything(), { checked: false });
    await expect(args.onChange).toHaveBeenCalledTimes(3);
    await expect(canvas.getByText('onChange: false')).toBeVisible();
  },
};
