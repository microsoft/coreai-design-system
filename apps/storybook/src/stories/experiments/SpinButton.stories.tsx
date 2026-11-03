// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { CoreAIFluentProvider, useFluent } from '@coreai-ds/react-components';
import { SpinButton } from '@coreai-ds/react-headless-components';
import {
  SpinButtonComparison,
  SpinButtonNumericFlow,
  SpinButtonValidationFlow,
  spinButtonAppearances,
  spinButtonConsumerExample,
  spinButtonSizes,
  type SpinButtonExample,
} from './SpinButtonComparison.js';
import {
  captureSpinButtonStyles,
  compareSpinButtonStyles,
  getComparisonSpinButton,
  getSpinButtonSlots,
  settleSpinButtonStyles,
  type SpinButtonStyleDifference,
} from './compareSpinButtonStyles.js';
import styles from './SpinButtonComparison.module.css';

function ComparisonWithReport({ examples }: { examples?: readonly SpinButtonExample[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (SpinButtonStyleDifference & { example: string })[] | null
  >(null);
  const [comparing, setComparing] = React.useState(false);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('SpinButton comparison has not mounted');
    setComparing(true);
    try {
      const rows = [...container.querySelectorAll<HTMLElement>('[data-spinbutton-case]')];
      if (!rows.length) throw new Error('SpinButton comparison has no examples');
      const results = [];
      for (const row of rows) {
        const legacy = getComparisonSpinButton(row, 'legacy');
        const headless = getComparisonSpinButton(row, 'headless');
        await Promise.all([settleSpinButtonStyles(legacy), settleSpinButtonStyles(headless)]);
        results.push(
          ...compareSpinButtonStyles(
            captureSpinButtonStyles(legacy),
            captureSpinButtonStyles(headless),
          ).map((difference) => ({ example: row.dataset.spinbuttonCase ?? '', ...difference })),
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
        Shared fixtures compare selected root, native input, increment/decrement, glyph, border, and
        focus-pseudo styles and dimensions at rest. Values are exact; no style or geometry
        differences are excluded. SpinButton&apos;s source styles are self-contained rather than
        delegating to the Input or Button foundations. Only appearance and size are recreated; all
        numeric, native form, and accessibility behavior stays in the public hook.
      </p>
      <button type="button" onClick={compare} disabled={comparing}>
        Compare resting styles
      </button>
      <output className={styles.report} aria-live="polite">
        {differences === null
          ? 'Comparison not run.'
          : differences.length
            ? `${differences.length} differences (showing at most 100):\n${JSON.stringify(
                differences.slice(0, 100),
                null,
                2,
              )}`
            : 'No differences in the selected properties.'}
      </output>
      <div ref={containerRef}>
        <SpinButtonComparison examples={examples} />
      </div>
    </div>
  );
}

function DefaultsOptOutComparison() {
  const { dir } = useFluent();
  return (
    <CoreAIFluentProvider withComponentDefaults={false} theme={{}} dir={dir}>
      <p>
        Opting out restores outline. With defaults enabled, omitted appearance selects
        filled-darker; explicitly undefined clears the CoreAI default. SpinButton keeps medium size
        inside a differently sized Field unless its own size is explicit.
      </p>
      <ComparisonWithReport
        examples={[
          { name: 'Omitted appearance', props: {} },
          { name: 'Explicitly undefined appearance', props: { appearance: undefined } },
          { name: 'Explicit filled-darker', props: { appearance: 'filled-darker' } },
        ]}
      />
    </CoreAIFluentProvider>
  );
}

const meta = {
  title: 'Experiments/Headless SpinButton',
  component: SpinButton,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment using the installed public headless SpinButton hook/render contract, self-contained CSS Modules, style-free 16px chevron glyphs, and CoreAI appearance defaults. Production SpinButton is unchanged. Current APIs are step, stepPage, precision, value/defaultValue, displayValue, and onChange; formatting and validation belong to the application. No overlay, focusgroup, Tabster machinery, or second numeric state model is introduced.',
      },
    },
  },
  argTypes: {
    appearance: { control: 'select', options: spinButtonAppearances },
    size: { control: 'select', options: spinButtonSizes },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    step: { control: 'number' },
    stepPage: { control: 'number' },
    precision: { control: 'number' },
  },
} satisfies Meta<typeof SpinButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(
      async () => {
        await expect(canvas.getByRole('status')).toHaveTextContent(
          'No differences in the selected properties.',
        );
      },
      { timeout: 10000 },
    );
  },
};

export const DefaultsOptOut: Story = {
  render: () => <DefaultsOptOutComparison />,
  play: Comparison.play,
};

export const RTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <ComparisonWithReport
        examples={[
          {
            name: 'Small RTL outline',
            props: { appearance: 'outline', size: 'small', defaultValue: 4 },
          },
          {
            name: 'Medium RTL filled',
            props: { appearance: 'filled-darker', defaultValue: 4 },
          },
          {
            name: 'RTL disabled',
            props: { appearance: 'underline', disabled: true, defaultValue: 4 },
          },
          {
            name: 'RTL minimum',
            props: { size: 'small', defaultValue: 0, min: 0, max: 10 },
          },
        ]}
      />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[spinButtonConsumerExample]} />,
  play: async ({ canvas, canvasElement }) => {
    const root = getComparisonSpinButton(canvasElement, 'headless');
    const { input, incrementButton, decrementButton } = getSpinButtonSlots(root);
    await expect(getComputedStyle(root).minHeight).toBe('44px');
    await expect(getComputedStyle(root).borderRadius).toBe('3px');
    await expect(getComputedStyle(root).backgroundColor).toBe('rgb(232, 240, 255)');
    await expect(getComputedStyle(input).paddingInlineStart).toBe('12px');
    await expect(getComputedStyle(input).color).toBe('rgb(32, 48, 96)');
    await expect(getComputedStyle(incrementButton).color).toBe('rgb(128, 48, 32)');
    await expect(getComputedStyle(decrementButton).color).toBe('rgb(72, 32, 128)');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(async () => {
      await expect(canvas.getByRole('status')).not.toHaveTextContent('Comparison not run.');
    });
  },
};

export const NumericEntry: Story = {
  args: { onChange: fn() },
  render: (args) => <SpinButtonNumericFlow {...args} />,
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('spinbutton', { name: 'Quantity' });
    await expect(input).toHaveValue('4');
    await userEvent.clear(input);
    await userEvent.type(input, '7.5');
    await expect(args.onChange).not.toHaveBeenCalled();
    await expect(input).toHaveAttribute('aria-valuenow', '7.5');
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenNthCalledWith(1, expect.anything(), {
      value: undefined,
      displayValue: '7.5',
    });
    await userEvent.keyboard('{ArrowUp}');
    await expect(input).toHaveValue('8');
    await expect(args.onChange).toHaveBeenNthCalledWith(2, expect.anything(), {
      value: 8,
      displayValue: undefined,
    });
    await userEvent.keyboard('{PageUp}');
    await expect(input).toHaveValue('13');
    await userEvent.keyboard('{Home}');
    await expect(input).toHaveValue('0');
    await expect(canvas.getByRole('button', { name: 'Decrement value' })).toBeDisabled();
    await userEvent.keyboard('{End}');
    await expect(input).toHaveValue('20');
    await expect(canvas.getByRole('button', { name: 'Increment value' })).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Decrement value' }));
    await expect(input).toHaveValue('19.5');
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.anything(), {
      value: 19.5,
      displayValue: undefined,
    });
    await userEvent.click(canvas.getByRole('button', { name: 'Submit quantity' }));
    await expect(canvas.getByRole('status', { name: 'Quantity submission' })).toHaveTextContent(
      'Submitted: 19.5',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Reset native form' }));
    await expect(input).toHaveValue('19.5');
    await expect(args.onChange).toHaveBeenCalledTimes(6);
  },
};

export const FormattingAndValidation: Story = {
  args: { onChange: fn() },
  render: (args) => <SpinButtonValidationFlow {...args} />,
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('spinbutton', { name: /Budget/ });
    await expect(input).toHaveValue('$1');
    await expect(input).toHaveAttribute('aria-valuetext', '$1');
    await userEvent.clear(input);
    await userEvent.type(input, 'bad');
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenNthCalledWith(1, expect.anything(), {
      value: undefined,
      displayValue: 'bad',
    });
    await expect(input).toHaveValue('(invalid)');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByText('Enter an amount between $0 and $10.')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Submit budget' }));
    await expect(canvas.getByRole('status', { name: 'Budget submission' })).toHaveTextContent(
      'Submitted: (invalid)',
    );
    await userEvent.clear(input);
    await userEvent.type(input, '$3.5');
    await userEvent.keyboard('{Enter}');
    await expect(input).toHaveValue('$3.5');
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    await userEvent.keyboard('{ArrowUp}');
    await expect(input).toHaveValue('$3.75');
    await userEvent.keyboard('{PageUp}');
    await expect(input).toHaveValue('$5.75');
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.anything(), {
      value: 5.75,
      displayValue: undefined,
    });
    await userEvent.click(canvas.getByRole('button', { name: 'Submit budget' }));
    await expect(canvas.getByRole('status', { name: 'Budget submission' })).toHaveTextContent(
      'Submitted: $5.75',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Reset budget' }));
    await expect(input).toHaveValue('$1');
    await expect(args.onChange).toHaveBeenCalledTimes(4);
  },
};
