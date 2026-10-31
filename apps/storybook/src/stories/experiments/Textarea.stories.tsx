// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { Button } from '@coreai-ds/react-components';
import { Textarea, type TextareaProps } from '@coreai-ds/react-headless-components';
import {
  TextareaComparison,
  textareaAppearances,
  textareaConsumerExample,
  textareaResizeModes,
  textareaSizes,
  type TextareaExample,
} from './TextareaComparison.js';
import {
  captureTextareaStyles,
  compareTextareaStyles,
  getComparisonTextarea,
  settleTextareaStyles,
  type TextareaStyleDifference,
} from './compareTextareaStyles.js';
import styles from './TextareaComparison.module.css';

function ComparisonWithReport({ examples }: { examples?: readonly TextareaExample[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (TextareaStyleDifference & { example: string })[] | null
  >(null);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Textarea comparison has not mounted');
    const rows = [...container.querySelectorAll<HTMLElement>('[data-textarea-case]')];
    if (!rows.length) throw new Error('Textarea comparison has no examples');
    const results = [];
    for (const row of rows) {
      const legacy = getComparisonTextarea(row, 'legacy');
      const headless = getComparisonTextarea(row, 'headless');
      await Promise.all([settleTextareaStyles(legacy), settleTextareaStyles(headless)]);
      results.push(
        ...compareTextareaStyles(
          captureTextareaStyles(legacy),
          captureTextareaStyles(headless),
        ).map((difference) => ({ example: row.dataset.textareaCase ?? '', ...difference })),
      );
    }
    setDifferences(results);
  };

  return (
    <div>
      <p>
        Both columns share the active provider, theme, and fixtures. Each label has its own id.
        Hover, focus, type, or drag an enabled resize handle to inspect behavior. The report
        compares selected wrapper, textarea, placeholder, focus-underline styles, and dimensions; it
        is not a screenshot or pixel comparison.
      </p>
      <Button onClick={compare}>Compare resting styles</Button>
      <output className={styles.report} aria-live="polite">
        {differences === null
          ? 'Comparison not run.'
          : differences.length
            ? JSON.stringify(differences, null, 2)
            : 'No differences in the selected properties.'}
      </output>
      <div ref={containerRef}>
        <TextareaComparison examples={examples} />
      </div>
    </div>
  );
}

function TextareaPlayground(props: TextareaProps) {
  const id = React.useId();
  const hintId = React.useId();
  const [lastValue, setLastValue] = React.useState<string>();
  return (
    <div className={styles.playground}>
      <label htmlFor={id}>Project notes</label>
      <Textarea
        {...props}
        id={id}
        aria-describedby={hintId}
        onChange={(event, data) => {
          setLastValue(data.value);
          props.onChange?.(event, data);
        }}
      />
      <span id={hintId}>
        Enter adds a new line; Tab leaves the field. Resize with the native handle when enabled.
      </span>
      <span>
        {lastValue === undefined ? 'No edits yet.' : `${lastValue.length} characters entered.`}
      </span>
    </div>
  );
}

const meta = {
  title: 'Experiments/Headless Textarea',
  component: Textarea,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment: public Fluent headless behavior with layered CSS Modules. CoreAI defaults to filled-darker; opting out restores outline. Native form semantics and resizing are retained. Use CSS classes or slot styles instead of legacy Griffel customStyleHooks. The existing production package is unchanged.',
      },
    },
  },
  argTypes: {
    appearance: { control: 'select', options: textareaAppearances },
    size: { control: 'select', options: textareaSizes },
    resize: { control: 'select', options: textareaResizeModes },
    rows: { control: { type: 'number', min: 1, max: 20 } },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    required: { control: 'boolean' },
    'aria-invalid': { control: 'select', options: [undefined, false, true, 'grammar', 'spelling'] },
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
};

export const ConsumerOverrides: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Intentional cascade difference: ordinary consumer CSS overrides the headless wrapper radius and textarea height/padding without !important. Legacy Griffel can retain its own styles.',
      },
    },
  },
  render: () => <ComparisonWithReport examples={[textareaConsumerExample]} />,
};

export const Playground: Story = {
  args: {
    appearance: 'filled-darker',
    size: 'medium',
    resize: 'vertical',
    rows: 4,
    placeholder: 'Add project context, decisions, or next steps…',
  },
  render: (args) => <TextareaPlayground {...args} />,
};

export const TypingFlow: Story = {
  args: { resize: 'vertical', rows: 3, onChange: fn() },
  render: (args) => <TextareaPlayground {...args} />,
  play: async ({ args, canvas }) => {
    const textarea = canvas.getByRole('textbox', { name: 'Project notes' });
    await userEvent.clear(textarea);
    await userEvent.type(textarea, 'Draft notes{Enter}Next steps');
    await expect(textarea).toHaveValue('Draft notes\nNext steps');
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.anything(), {
      value: 'Draft notes\nNext steps',
    });
    await userEvent.tab();
    await expect(textarea).not.toHaveFocus();
  },
};
