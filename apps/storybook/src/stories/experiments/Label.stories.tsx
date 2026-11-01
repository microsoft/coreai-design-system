// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { Label, type LabelProps } from '@coreai-ds/react-headless-components';
import {
  LabelComparison,
  labelConsumerExample,
  labelSizes,
  labelWeights,
  type LabelExample,
} from './LabelComparison.js';
import {
  captureLabelStyles,
  compareLabelStyles,
  getComparisonLabel,
  settleLabelStyles,
  type LabelStyleDifference,
} from './compareLabelStyles.js';
import styles from './LabelComparison.module.css';

function ComparisonWithReport({
  examples,
  consumerOverrides = false,
}: {
  examples?: readonly LabelExample[];
  consumerOverrides?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (LabelStyleDifference & { example: string })[] | null
  >(null);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Label comparison has not mounted');
    const rows = [...container.querySelectorAll<HTMLElement>('[data-label-case]')];
    if (!rows.length) throw new Error('Label comparison has no examples');
    const results: (LabelStyleDifference & { example: string })[] = [];
    for (const row of rows) {
      const legacy = getComparisonLabel(row, 'legacy');
      const headless = getComparisonLabel(row, 'headless');
      await Promise.all([settleLabelStyles(legacy), settleLabelStyles(headless)]);
      results.push(
        ...compareLabelStyles(captureLabelStyles(legacy), captureLabelStyles(headless)).map(
          (difference) => ({ example: row.dataset.labelCase ?? '', ...difference }),
        ),
      );
    }
    setDifferences(results);
  };

  return (
    <div>
      <p>
        Both columns share the active provider, theme, and props. Each label and native input has
        its own id. Click a label to focus its associated input. The fixture explicitly applies
        required and disabled to the input; Label itself does not set those control attributes.
      </p>
      <p>
        The report compares selected root and required-slot typography, colors, spacing, and
        dimensions at rest. It is not a screenshot or pixel comparison.
      </p>
      {consumerOverrides && (
        <p>
          Intentional difference: unlayered consumer CSS overrides the headless label and required
          indicator. Legacy Griffel may retain its own styles.
        </p>
      )}
      <button type="button" onClick={compare}>
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
        <LabelComparison examples={examples} />
      </div>
    </div>
  );
}

function LabelPlayground(props: LabelProps) {
  const id = React.useId();
  const hintId = React.useId();
  const [lastValue, setLastValue] = React.useState<string>();
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  return (
    <form
      className={styles.playground}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get('project') ?? ''));
      }}
    >
      <Label {...props} htmlFor={id} />
      <input
        className={styles.control}
        id={id}
        name="project"
        aria-describedby={hintId}
        required={Boolean(props.required)}
        disabled={props.disabled}
        onChange={(event) => setLastValue(event.currentTarget.value)}
      />
      <span id={hintId}>
        Click the label to focus the native input. This example explicitly applies required and
        disabled to the control as well as to Label.
      </span>
      <span>
        {lastValue === undefined ? 'No edits yet.' : `${lastValue.length} characters entered.`}
      </span>
      <button type="submit">Save project</button>
      <output aria-live="polite">
        {submitted === null ? 'No submission yet.' : `Saved project: ${submitted}`}
      </output>
    </form>
  );
}

const meta = {
  title: 'Experiments/Headless Label',
  component: Label,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment: public Fluent headless Label behavior with layered CSS Modules. CoreAI adds no Label defaults or overrides. Required and disabled are visual Label props; native validation and disabled behavior belong to the associated control. Large labels remain semibold even with weight="regular". Use CSS classes or slot styles instead of legacy Griffel customStyleHooks. The production package is unchanged.',
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: labelSizes },
    weight: { control: 'select', options: labelWeights },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Label>;

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
  parameters: {
    docs: {
      description: {
        story:
          'Intentional cascade difference: unlayered consumer CSS sets root color, font size, weight, and line height, plus required-indicator color, size, and leading padding without !important. The report shows differences rather than hiding them.',
      },
    },
  },
  render: () => <ComparisonWithReport examples={[labelConsumerExample]} consumerOverrides />,
  play: async ({ canvas, canvasElement }) => {
    const headless = getComparisonLabel(canvasElement, 'headless');
    await settleLabelStyles(headless);
    const values = captureLabelStyles(headless);
    await expect(values['root.font-size']).toBe('22px');
    await expect(values['root.font-weight']).toBe('400');
    await expect(values['required.color']).toBe('rgb(40, 110, 60)');
    await expect(values['required.padding-left']).toBe('12px');
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
    children: 'Project name',
    size: 'medium',
    weight: 'regular',
    required: true,
    onClick: fn(),
  },
  render: (args) => <LabelPlayground {...args} />,
  play: async ({ args, canvas }) => {
    const label = canvas.getByText('Project name', { selector: 'label' });
    const input = canvas.getByRole('textbox', { name: 'Project name' });
    await expect(input).toHaveAccessibleName('Project name');
    await userEvent.click(label);
    await expect(input).toHaveFocus();
    await expect(args.onClick).toHaveBeenCalledTimes(1);
    await userEvent.type(input, 'CoreAI migration');
    await expect(input).toHaveValue('CoreAI migration');
    await expect(canvas.getByText('16 characters entered.')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Save project' }));
    await expect(canvas.getByText('Saved project: CoreAI migration')).toBeVisible();
  },
};
