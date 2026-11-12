// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { useFluent } from '@coreai-ds/react-components';
import { ComparisonProvider as CoreAIFluentProvider } from './ComparisonProvider.js';
import { Button, Input, type InputProps } from '@coreai-ds/react-headless-components';
import {
  InputComparison,
  inputAppearances,
  inputConsumerExample,
  type InputExample,
} from './InputComparison.js';
import {
  captureInputStyles,
  compareInputStyles,
  getComparisonInput,
  settleInputStyles,
  type InputStyleDifference,
} from './compareInputStyles.js';
import styles from './InputComparison.module.css';

function ComparisonWithReport({ examples }: { examples?: readonly InputExample[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (InputStyleDifference & { example: string })[] | null
  >(null);
  const [comparing, setComparing] = React.useState(false);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Input comparison has not mounted');
    setComparing(true);
    try {
      const rows = [...container.querySelectorAll<HTMLElement>('[data-input-case]')];
      if (!rows.length) throw new Error('Input comparison has no examples');
      const results = [];
      for (const row of rows) {
        const legacy = getComparisonInput(row, 'legacy');
        const headless = getComparisonInput(row, 'headless');
        await Promise.all([settleInputStyles(legacy), settleInputStyles(headless)]);
        results.push(
          ...compareInputStyles(captureInputStyles(legacy), captureInputStyles(headless)).map(
            (difference) => ({ example: row.dataset.inputCase ?? '', ...difference }),
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
        Both columns share the active provider, theme, and fixtures, with distinct input ids. Hover
        or Tab to inspect interactions. The report compares selected Input-owned root, input, affix,
        label, placeholder, and focus-border styles and dimensions at rest.
      </p>
      <Button onClick={compare} disabled={comparing}>
        Compare resting styles
      </Button>
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
        <InputComparison examples={examples} />
      </div>
    </div>
  );
}

function DefaultsOptOutComparison() {
  const { dir } = useFluent();
  return (
    <CoreAIFluentProvider withComponentDefaults={false} theme={{}} dir={dir}>
      <p>
        The current CoreAI Input wrapper still defaults to filled-darker when provider defaults are
        disabled. The experimental Input preserves this inherited limitation, including an
        explicitly undefined appearance.
      </p>
      <ComparisonWithReport
        examples={[
          { name: 'Omitted appearance', props: { placeholder: 'CoreAI filled default remains' } },
          {
            name: 'Explicitly undefined appearance',
            props: { appearance: undefined, placeholder: 'Same CoreAI filled default' },
          },
          {
            name: 'Explicit outline',
            props: { appearance: 'outline', defaultValue: 'Explicit appearance still wins' },
          },
        ]}
      />
    </CoreAIFluentProvider>
  );
}

function InputPlayground(props: InputProps) {
  const [value, setValue] = React.useState('');
  const [submitted, setSubmitted] = React.useState('');
  const [lastChange, setLastChange] = React.useState('No changes yet.');
  const id = React.useId();
  return (
    <form
      className={styles.playground}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get('project') ?? ''));
      }}
    >
      <Input
        {...props}
        id={id}
        name="project"
        value={value}
        onChange={(event, data) => {
          props.onChange?.(event, data);
          setValue(data.value);
          setLastChange(`onChange: ${data.value}`);
        }}
      />
      <div>
        <Button type="submit">Save project</Button>{' '}
        <Button type="button" onClick={() => setValue('')}>
          Clear
        </Button>
      </div>
      <output aria-live="polite">
        {lastChange} Submitted: {submitted || '(empty)'}
      </output>
    </form>
  );
}

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless Input',
  component: Input,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment: public Fluent headless Input behavior and layered CSS Modules. Inline labels, native field-sizing, and read-only copy composition retain the CoreAI contract. Production Input is unchanged.',
      },
    },
  },
  argTypes: {
    appearance: {
      control: 'select',
      options: inputAppearances,
    },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    label: { control: 'text' },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    dynamicWidth: { control: 'boolean' },
    truncateTextOverflow: { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
};

export const ConsumerOverrides: Story = {
  render: () => (
    <>
      <p>
        Unlayered consumer CSS deliberately wins over the new root and slot styles. The legacy
        Griffel column may retain some defaults; that is an intentional cascade difference.
      </p>
      <ComparisonWithReport examples={[inputConsumerExample]} />
    </>
  ),
};

export const DefaultsOptOut: Story = {
  render: () => <DefaultsOptOutComparison />,
};

export const Playground: Story = {
  args: {
    label: 'Project',
    placeholder: 'Enter a project name',
    appearance: 'filled-darker',
    size: 'medium',
    onChange: fn(),
  },
  render: (args) => <InputPlayground {...args} />,
  play: async ({ canvas, args }) => {
    const input = canvas.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'Migration pilot');
    await expect(input).toHaveValue('Migration pilot');
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.anything(), {
      value: 'Migration pilot',
    });
    await userEvent.click(canvas.getByRole('button', { name: 'Save project' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Submitted: Migration pilot');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear' }));
    await expect(input).toHaveValue('');
  },
};
