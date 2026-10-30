// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@coreai-ds/react-headless-components';
import {
  ButtonComparison,
  buttonAppearances,
  consumerExample,
  type ButtonExample,
} from './ButtonComparison.js';
import {
  captureButtonStyles,
  compareButtonStyles,
  getComparisonButton,
  settleButtonStyles,
  type ButtonStyleDifference,
} from './compareButtonStyles.js';
import styles from './ButtonComparison.module.css';

function ComparisonWithReport({ examples }: { examples?: readonly ButtonExample[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (ButtonStyleDifference & { example: string })[] | null
  >(null);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Button comparison has not mounted');
    const rows = [...container.querySelectorAll<HTMLElement>('[data-parity-case]')];
    if (!rows.length) throw new Error('Button comparison has no examples');
    const results = [];
    for (const row of rows) {
      const legacy = getComparisonButton(row, 'legacy');
      const headless = getComparisonButton(row, 'headless');
      await Promise.all([settleButtonStyles(legacy), settleButtonStyles(headless)]);
      results.push(
        ...compareButtonStyles(captureButtonStyles(legacy), captureButtonStyles(headless)).map(
          (difference) => ({ example: row.dataset.parityCase ?? '', ...difference }),
        ),
      );
    }
    setDifferences(results);
  };

  return (
    <div>
      <p>
        Both implementations share the active theme and the same props. Tab or hover to inspect
        interaction states. The report compares selected resting root/icon styles and dimensions,
        not every CSS property or pixel.
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
        <ButtonComparison examples={examples} />
      </div>
    </div>
  );
}

const meta = {
  title: 'Experiments/Headless Button',
  component: Button,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Button-only migration pilot. Fluent headless behavior, layered CSS Modules, and the existing CoreAI theme provider. The current component package is unchanged.',
      },
    },
  },
  argTypes: {
    appearance: { control: 'select', options: buttonAppearances },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    shape: { control: 'select', options: ['rounded', 'circular', 'square'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[consumerExample]} />,
};

export const Playground: Story = {
  args: { children: 'Example', appearance: 'secondary', size: 'medium' },
};
