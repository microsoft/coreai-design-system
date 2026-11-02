// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { CounterBadge } from '@coreai-ds/react-headless-components';
import {
  CounterBadgeComparison,
  CounterBadgeNotifications,
  counterBadgeAppearances,
  counterBadgeColors,
  counterBadgeConsumerExample,
  counterBadgeNumericZeroExample,
  counterBadgeShapes,
  type CounterBadgeExample,
} from './CounterBadgeComparison.js';
import { badgeSizes } from './BadgeComparison.js';
import {
  captureCounterBadgeStyles,
  compareCounterBadgeStyles,
  getComparisonCounterBadge,
  settleCounterBadgeStyles,
  type CounterBadgeStyleDifference,
} from './compareCounterBadgeStyles.js';
import styles from './BadgeComparison.module.css';

function ComparisonWithReport({
  examples,
  explanation,
}: {
  examples?: readonly CounterBadgeExample[];
  explanation?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (CounterBadgeStyleDifference & { example: string })[] | null
  >(null);
  const compare = async () => {
    const container = ref.current;
    if (!container) throw new Error('CounterBadge comparison has not mounted');
    const results: (CounterBadgeStyleDifference & { example: string })[] = [];
    for (const row of container.querySelectorAll<HTMLElement>('[data-counterbadge-case]')) {
      const legacy = getComparisonCounterBadge(row, 'legacy');
      const headless = getComparisonCounterBadge(row, 'headless');
      await Promise.all([settleCounterBadgeStyles(legacy), settleCounterBadgeStyles(headless)]);
      results.push(
        ...compareCounterBadgeStyles(
          captureCounterBadgeStyles(legacy),
          captureCounterBadgeStyles(headless),
        ).map((difference) => ({ example: row.dataset.counterbadgeCase ?? '', ...difference })),
      );
    }
    setDifferences(results);
  };
  return (
    <div>
      <p>
        The public headless hook resolves count text, overflow, dot, and hidden state. Styling
        consumes its resolved data attributes and reuses Badge’s root/icon foundation. Dot
        suppresses automatic counts, not content explicitly supplied by a caller.
      </p>
      <p>
        Selected root/icon computed properties, dimensions, and the border pseudo-element are
        compared at rest.
      </p>
      {explanation && <p>{explanation}</p>}
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
      <div ref={ref}>
        <CounterBadgeComparison examples={examples} />
      </div>
    </div>
  );
}

const meta = {
  title: 'Experiments/Headless CounterBadge',
  component: CounterBadge,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment using the supported public CounterBadge hook/render pipeline. Base Badge styles and stable fui-Badge markers are retained alongside fui-CounterBadge markers. Counts do not become automatic live regions; the host supplies notification meaning. CoreAI has no family defaults or overrides. Numeric children={0} follows the current headless data-hidden contract and remains visible, unlike the old falsy-content style check.',
      },
    },
  },
  argTypes: {
    appearance: { control: 'select', options: counterBadgeAppearances },
    color: { control: 'select', options: counterBadgeColors },
    shape: { control: 'select', options: counterBadgeShapes },
    size: { control: 'select', options: badgeSizes },
    count: { control: 'number' },
    overflowCount: { control: 'number' },
    dot: { control: 'boolean' },
    showZero: { control: 'boolean' },
  },
} satisfies Meta<typeof CounterBadge>;

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

export const CurrentZeroContent: Story = {
  render: () => (
    <ComparisonWithReport
      examples={[counterBadgeNumericZeroExample]}
      explanation="Intentional current-hook difference: explicitly supplied numeric zero is content. The headless badge is visible; the old style hook hides it. The report retains the display and size differences."
    />
  ),
  play: async ({ canvasElement, canvas }) => {
    const legacy = getComparisonCounterBadge(canvasElement, 'legacy');
    const headless = getComparisonCounterBadge(canvasElement, 'headless');
    await expect(legacy.root).not.toBeVisible();
    await expect(headless.root).toBeVisible();
    await expect(headless.root).toHaveTextContent('0');
    await expect(headless.root).not.toHaveAttribute('data-hidden');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await expect(
      canvas.getByRole('status', { name: 'Computed style comparison' }),
    ).toHaveTextContent('root.display');
  },
};

export const ConsumerOverrides: Story = {
  render: () => (
    <ComparisonWithReport
      examples={[counterBadgeConsumerExample]}
      explanation="Intentional cascade difference: unlayered consumer CSS overrides inherited Badge styles and CounterBadge visual states without !important."
    />
  ),
  play: async ({ canvasElement, canvas }) => {
    const badge = getComparisonCounterBadge(canvasElement, 'headless');
    await settleCounterBadgeStyles(badge);
    const values = captureCounterBadgeStyles(badge);
    await expect(values['root.min-width']).toBe('60px');
    await expect(values['root.height']).toBe('30.00');
    await expect(values['icon.font-size']).toBe('18px');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await expect(
      canvas.getByRole('status', { name: 'Computed style comparison' }),
    ).not.toHaveTextContent('Comparison not run.');
  },
};

export const Notifications: Story = {
  args: { color: 'danger', overflowCount: 99 },
  render: (args) => <CounterBadgeNotifications {...args} />,
  play: async ({ canvasElement, canvas }) => {
    const badge = canvasElement.querySelector('.fui-CounterBadge');
    if (!(badge instanceof HTMLDivElement)) throw new Error('Missing notification badge');
    await expect(badge).not.toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Receive message' }));
    await expect(canvas.getByRole('button', { name: 'Inbox, 1 unread messages' })).toBeVisible();
    await expect(badge).toHaveTextContent('1');
    await userEvent.click(canvas.getByRole('button', { name: 'Receive 100 messages' }));
    await expect(badge).toHaveTextContent('99+');
    await expect(badge).toHaveAttribute('data-overflowed', '');
    await userEvent.click(canvas.getByRole('button', { name: 'Dot only' }));
    await expect(badge).toHaveAttribute('data-dot', '');
    await expect(badge.textContent).toBe('');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear inbox' }));
    await expect(badge).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Dot only' }));
    await expect(badge).not.toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Show zero' }));
    await expect(badge).toBeVisible();
    await expect(badge).toHaveTextContent('0');
    await expect(badge).toHaveAttribute('aria-hidden', 'true');
    await expect(badge).not.toHaveAttribute('aria-live');
  },
};

export const Playground: Story = { args: { count: 8, color: 'brand', appearance: 'filled' } };
