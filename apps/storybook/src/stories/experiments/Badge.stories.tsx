// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { Badge } from '@coreai-ds/react-headless-components';
import {
  BadgeComparison,
  BadgeFixtureIcon,
  badgeAppearances,
  badgeColors,
  badgeConsumerExample,
  badgeShapes,
  badgeSizes,
  type BadgeExample,
} from './BadgeComparison.js';
import {
  captureBadgeStyles,
  compareBadgeStyles,
  getComparisonBadge,
  settleBadgeStyles,
  type BadgeStyleDifference,
} from './compareBadgeStyles.js';
import styles from './BadgeComparison.module.css';

function ComparisonWithReport({
  examples,
  consumerOverrides = false,
}: {
  examples?: readonly BadgeExample[];
  consumerOverrides?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (BadgeStyleDifference & { example: string })[] | null
  >(null);
  const compare = async () => {
    const container = ref.current;
    if (!container) throw new Error('Badge comparison has not mounted');
    const results: (BadgeStyleDifference & { example: string })[] = [];
    for (const row of container.querySelectorAll<HTMLElement>('[data-badge-case]')) {
      const legacy = getComparisonBadge(row, 'legacy');
      const headless = getComparisonBadge(row, 'headless');
      await Promise.all([settleBadgeStyles(legacy), settleBadgeStyles(headless)]);
      results.push(
        ...compareBadgeStyles(captureBadgeStyles(legacy), captureBadgeStyles(headless)).map(
          (difference) => ({ example: row.dataset.badgeCase ?? '', ...difference }),
        ),
      );
    }
    setDifferences(results);
  };
  return (
    <div>
      <p>
        Shared fixtures compare selected root/icon colors, typography, spacing, dimensions, and the
        border pseudo-element. Both columns use the active theme and direction. Ghost and outline
        subtle badges are shown on a branded surface.
      </p>
      <p>
        CounterBadge reuses this styling foundation. PresenceBadge has a separate upstream baseline.
        CoreAI adds no defaults or style overrides to this family.
      </p>
      {consumerOverrides && (
        <p>
          Intentional difference: ordinary unlayered consumer CSS takes priority over the new
          layered styles.
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
        <BadgeComparison examples={examples} />
      </div>
    </div>
  );
}

const meta = {
  title: 'Experiments/Headless Badge',
  component: Badge,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment: public Fluent headless Badge hook/render APIs with layered CSS Modules, based on react-badge 9.5.7. Badges are non-interactive and have no automatic live-region semantics. Put notification meaning in the host control’s name, or supply an accessible image label. Use slots, classes, or inline styles rather than legacy customStyleHooks. Production exports are unchanged.',
      },
    },
  },
  argTypes: {
    appearance: { control: 'select', options: badgeAppearances },
    color: { control: 'select', options: badgeColors },
    shape: { control: 'select', options: badgeShapes },
    size: { control: 'select', options: badgeSizes },
    iconPosition: { control: 'select', options: ['before', 'after'] },
  },
} satisfies Meta<typeof Badge>;

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
  render: () => <ComparisonWithReport examples={[badgeConsumerExample]} consumerOverrides />,
  play: async ({ canvasElement, canvas }) => {
    const badge = getComparisonBadge(canvasElement, 'headless');
    await settleBadgeStyles(badge);
    const values = captureBadgeStyles(badge);
    await expect(values['root.min-width']).toBe('60px');
    await expect(values['root.height']).toBe('30.00');
    await expect(values['root.border-radius']).toBe('3px');
    await expect(values['icon.font-size']).toBe('18px');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await expect(
      canvas.getByRole('status', { name: 'Computed style comparison' }),
    ).not.toHaveTextContent('Comparison not run.');
  },
};

export const Playground: Story = {
  args: {
    children: 'Ready',
    appearance: 'tint',
    color: 'success',
    shape: 'circular',
    size: 'medium',
    icon: <BadgeFixtureIcon />,
  },
};

export const AccessibleMeaning: Story = {
  render: () => (
    <div className={styles.playground}>
      <button type="button" aria-label="Inbox, 6 unread messages">
        Inbox <Badge aria-hidden="true">6</Badge>
      </button>
      <Badge role="img" aria-label="Project ready" color="success" icon={<BadgeFixtureIcon />} />
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Inbox, 6 unread messages' })).toBeVisible();
    await expect(canvas.getByRole('img', { name: 'Project ready' })).toBeVisible();
  },
};
