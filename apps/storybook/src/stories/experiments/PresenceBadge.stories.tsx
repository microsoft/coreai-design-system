// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { PresenceBadge } from '@coreai-ds/react-headless-components';
import {
  PresenceBadgeAvailability,
  PresenceBadgeComparison,
  presenceBadgeConsumerExample,
  presenceBadgeStatuses,
  type PresenceBadgeExample,
} from './PresenceBadgeComparison.js';
import { badgeSizes } from './BadgeComparison.js';
import {
  capturePresenceBadgeStyles,
  comparePresenceBadgeStyles,
  getComparisonPresenceBadge,
  settlePresenceBadgeStyles,
  type PresenceBadgeStyleDifference,
} from './comparePresenceBadgeStyles.js';
import styles from './BadgeComparison.module.css';

function ComparisonWithReport({
  examples,
  consumerOverrides = false,
}: {
  examples?: readonly PresenceBadgeExample[];
  consumerOverrides?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (PresenceBadgeStyleDifference & { example: string })[] | null
  >(null);
  const compare = async () => {
    const container = ref.current;
    if (!container) throw new Error('PresenceBadge comparison has not mounted');
    const results: (PresenceBadgeStyleDifference & { example: string })[] = [];
    for (const row of container.querySelectorAll<HTMLElement>('[data-presencebadge-case]')) {
      const legacy = getComparisonPresenceBadge(row, 'legacy');
      const headless = getComparisonPresenceBadge(row, 'headless');
      await Promise.all([settlePresenceBadgeStyles(legacy), settlePresenceBadgeStyles(headless)]);
      results.push(
        ...comparePresenceBadgeStyles(
          capturePresenceBadgeStyles(legacy),
          capturePresenceBadgeStyles(headless),
        ).map((difference) => ({ example: row.dataset.presencebadgeCase ?? '', ...difference })),
      );
    }
    setDifferences(results);
  };
  return (
    <div>
      <p>
        Selected root/icon/SVG colors, background clipping, spacing, and dimensions are compared
        across statuses, out-of-office combinations, and sizes. Default glyphs use public style-free
        headless SVG entries, with the original size-specific paths.
      </p>
      <p>
        The current headless hook owns the image role, accessible status strings, and resolved data
        attributes. Presence is not automatically a live region. Caller labels, content, and valid
        slot render functions are retained.
      </p>
      {consumerOverrides && (
        <p>
          Intentional difference: ordinary consumer CSS overrides status color, background, radius,
          and slot margin.
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
      <div ref={ref}>
        <PresenceBadgeComparison examples={examples} />
      </div>
    </div>
  );
}

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless PresenceBadge',
  component: PresenceBadge,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment with public usePresenceBadge/renderPresenceBadge APIs, react-badge 9.5.7 CSS, and public headless icons 2.0.343. Its upstream styles are independent of Badge’s baseline. No overlay, focusgroup, or component-specific polyfill is needed. CoreAI adds no defaults or overrides. Caller CSS replaces old customStyleHooks. Production exports are unchanged.',
      },
    },
  },
  argTypes: {
    status: { control: 'select', options: presenceBadgeStatuses },
    size: { control: 'select', options: badgeSizes },
    outOfOffice: { control: 'boolean' },
  },
} satisfies Meta<typeof PresenceBadge>;

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
  render: () => (
    <ComparisonWithReport examples={[presenceBadgeConsumerExample]} consumerOverrides />
  ),
  play: async ({ canvasElement, canvas }) => {
    const badge = getComparisonPresenceBadge(canvasElement, 'headless');
    await settlePresenceBadgeStyles(badge);
    const values = capturePresenceBadgeStyles(badge);
    await expect(values['root.color']).toBe('rgb(35, 95, 155)');
    await expect(values['root.background-color']).toBe('rgb(245, 230, 215)');
    await expect(values['root.border-radius']).toBe('3px');
    await expect(values['icon.margin-left']).toBe('0px');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await expect(
      canvas.getByRole('status', { name: 'Computed style comparison' }),
    ).not.toHaveTextContent('Comparison not run.');
  },
};

export const Availability: Story = {
  render: (args) => <PresenceBadgeAvailability {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('img', { name: 'available' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Set busy' }));
    await expect(canvas.getByRole('img', { name: 'busy' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Out of office' }));
    const busy = canvas.getByRole('img', { name: 'busy out of office' });
    await expect(busy).toHaveAttribute('data-status', 'busy');
    await expect(busy).toHaveAttribute('data-out-of-office', '');
    await expect(busy).not.toHaveAttribute('aria-live');
    await userEvent.click(canvas.getByRole('button', { name: 'Set out-of-office' }));
    await expect(canvas.getByRole('img', { name: 'out of office' })).toBeVisible();
    await expect(canvas.getByText('Availability: out of office')).toBeVisible();
  },
};

export const Playground: Story = {
  args: { status: 'available', size: 'medium', outOfOffice: false },
};
