// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { CoreAIFluentProvider, useFluent } from '@coreai-ds/react-components';
import { Select, type SelectProps } from '@coreai-ds/react-headless-components';
import {
  SelectComparison,
  selectAppearances,
  selectConsumerExample,
  selectOptions,
  type SelectExample,
} from './SelectComparison.js';
import {
  captureSelectStyles,
  compareSelectStyles,
  getComparisonSelect,
  settleSelectStyles,
  type SelectStyleDifference,
} from './compareSelectStyles.js';
import styles from './SelectComparison.module.css';

function ComparisonWithReport({ examples }: { examples?: readonly SelectExample[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (SelectStyleDifference & { example: string })[] | null
  >(null);
  const [comparing, setComparing] = React.useState(false);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Select comparison has not mounted');
    setComparing(true);
    try {
      const rows = [...container.querySelectorAll<HTMLElement>('[data-select-case]')];
      if (!rows.length) throw new Error('Select comparison has no examples');
      const results = [];
      for (const row of rows) {
        const legacy = getComparisonSelect(row, 'legacy');
        const headless = getComparisonSelect(row, 'headless');
        await Promise.all([settleSelectStyles(legacy), settleSelectStyles(headless)]);
        results.push(
          ...compareSelectStyles(captureSelectStyles(legacy), captureSelectStyles(headless)).map(
            (difference) => ({ example: row.dataset.selectCase ?? '', ...difference }),
          ),
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
        Both columns share the provider, theme, and fixtures, with distinct native select ids. The
        report compares selected root, select, icon, option-background, and focus-pseudo styles and
        dimensions at rest. The popup belongs to the browser: no custom overlay is introduced.
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
        <SelectComparison examples={examples} />
      </div>
    </div>
  );
}

function DefaultsOptOutComparison() {
  const { dir } = useFluent();
  return (
    <CoreAIFluentProvider withComponentDefaults={false} theme={{}} dir={dir}>
      <p>
        Disabling component defaults restores outline. With defaults enabled, an omitted appearance
        uses filled-darker; explicitly undefined clears that default and uses outline.
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

function SelectPlayground(props: SelectProps) {
  const [value, setValue] = React.useState('green');
  const [submitted, setSubmitted] = React.useState('');
  const id = React.useId();
  return (
    <form
      className={styles.playground}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get('color') ?? ''));
      }}
    >
      <label htmlFor={id}>Color</label>
      <Select
        {...props}
        id={id}
        name="color"
        value={value}
        onChange={(event, data) => {
          props.onChange?.(event, data);
          setValue(data.value);
        }}
      >
        {selectOptions}
      </Select>
      <div>
        <button type="submit">Save color</button>{' '}
        <button type="button" onClick={() => setValue('blue')}>
          Choose blue
        </button>
      </div>
      <output aria-live="polite">
        Selected: {value}. Submitted: {submitted || '(not submitted)'}
      </output>
    </form>
  );
}

function NativeForm(props: SelectProps) {
  const [submitted, setSubmitted] = React.useState('');
  const id = React.useId();
  return (
    <form
      className={styles.playground}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get('color') ?? ''));
      }}
    >
      <label htmlFor={id}>Color</label>
      <Select defaultValue="green" required {...props} id={id} name="color">
        {selectOptions}
      </Select>
      <div>
        <button type="submit">Save color</button> <button type="reset">Reset native select</button>
      </div>
      <output aria-live="polite">Submitted: {submitted || '(not submitted)'}</output>
    </form>
  );
}

const meta = {
  title: 'Experiments/Headless Select',
  component: Select,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment: current public Fluent headless Select hook/render APIs, native selection and forms, layered CSS Modules, and CoreAI appearance defaults. Native selects have no read-only or shape prop. Production Select is unchanged.',
      },
    },
  },
  argTypes: {
    appearance: { control: 'select', options: selectAppearances },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'No differences in the selected properties.',
    );
  },
};

export const ConsumerOverrides: Story = {
  render: () => (
    <>
      <p>
        Unlayered consumer CSS deliberately wins over the new select and icon styles. The legacy
        Griffel column may retain some defaults; that is an intentional cascade difference.
      </p>
      <ComparisonWithReport examples={[selectConsumerExample]} />
    </>
  ),
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
          { name: 'Small RTL', props: { size: 'small' } },
          { name: 'Large RTL', props: { size: 'large', appearance: 'underline' } },
        ]}
      />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const Playground: Story = {
  args: { appearance: 'filled-darker', size: 'medium', onChange: fn() },
  render: (args) => <SelectPlayground {...args} />,
  play: async ({ canvas, args }) => {
    const select = canvas.getByRole('combobox', { name: 'Color' });
    await expect(select).toHaveValue('green');
    await userEvent.selectOptions(select, 'red');
    await expect(select).toHaveValue('red');
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.anything(), { value: 'red' });
    await userEvent.click(canvas.getByRole('button', { name: 'Choose blue' }));
    await expect(select).toHaveValue('blue');
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await userEvent.click(canvas.getByRole('button', { name: 'Save color' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Submitted: blue');
  },
};

export const NativeFormReset: Story = {
  args: { onChange: fn() },
  render: (args) => <NativeForm {...args} />,
  play: async ({ canvas, args }) => {
    const select = canvas.getByRole('combobox', { name: 'Color' });
    await expect(select).toHaveValue('green');
    await userEvent.selectOptions(select, 'blue');
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.anything(), { value: 'blue' });
    await userEvent.click(canvas.getByRole('button', { name: 'Save color' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Submitted: blue');
    await userEvent.click(canvas.getByRole('button', { name: 'Reset native select' }));
    await expect(select).toHaveValue('green');
    await expect(args.onChange).toHaveBeenCalledTimes(1);
  },
};
