// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { CoreAIFluentProvider } from '@coreai-ds/react-components';
import { Rating } from '@coreai-ds/react-headless-components';
import {
  RatingComparison,
  RatingInputFlow,
  ratingColors,
  ratingConsumerExample,
  ratingExamples,
  ratingSizes,
  type RatingExample,
} from './RatingComparison.js';
import {
  assertRatingGeometry,
  captureRatingStyles,
  compareRatingStyles,
  getComparisonRating,
  getRatingItems,
  settleRatingStyles,
  type RatingStyleDifference,
} from './compareRatingStyles.js';
import styles from './RatingComparison.module.css';

function ComparisonWithReport({
  examples = ratingExamples,
}: {
  examples?: readonly RatingExample[];
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [results, setResults] = React.useState<
    { rows: number; differences: (RatingStyleDifference & { example: string })[] } | undefined
  >();
  const [comparing, setComparing] = React.useState(false);
  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Rating comparison has not mounted');
    setComparing(true);
    setResults(undefined);
    try {
      const rows = [...container.querySelectorAll<HTMLElement>('[data-rating-case]')];
      if (rows.length !== examples.length) throw new Error('Incomplete Rating comparison fixtures');
      const differences = [];
      for (const row of rows) {
        const legacy = getComparisonRating(row, 'legacy');
        const headless = getComparisonRating(row, 'headless');
        await Promise.all([settleRatingStyles(legacy), settleRatingStyles(headless)]);
        assertRatingGeometry(legacy);
        assertRatingGeometry(headless);
        differences.push(
          ...compareRatingStyles(captureRatingStyles(legacy), captureRatingStyles(headless)).map(
            (difference) => ({ example: row.dataset.ratingCase ?? '', ...difference }),
          ),
        );
      }
      setResults({ rows: rows.length, differences });
    } finally {
      setComparing(false);
    }
  };
  return (
    <div
      data-rating-report-ready={results ? 'true' : 'false'}
      data-rating-report-count={results?.rows ?? 0}
      data-rating-expected-count={examples.length}
    >
      <p>
        Shared fixtures compare selected root, item, native radio, selected/unselected icon,
        half-fill, and focus-pseudo styles and live dimensions. Values and offsets are exact. There
        are no CoreAI-specific Rating defaults or overrides. Rating and RatingDisplay share one
        styled RatingItem; native radios own keyboard navigation without a focusgroup polyfill.
      </p>
      <button type="button" disabled={comparing} onClick={compare}>
        Compare resting styles
      </button>
      <output className={styles.report} aria-label="Rating style report" aria-live="polite">
        {!results
          ? 'Comparison not run.'
          : results.differences.length
            ? `${results.differences.length} differences (showing at most 60):\n${JSON.stringify(results.differences.slice(0, 60), null, 2)}`
            : 'No differences in the selected properties.'}
      </output>
      <div ref={containerRef}>
        <RatingComparison examples={examples} />
      </div>
    </div>
  );
}

const meta = {
  title: 'Experiments/Headless Rating',
  component: Rating,
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'Private migration experiment: public headless 0.3.2 hook/state/render/context, one RatingItem foundation, CSS Modules, and style-free star glyphs. The current hook owns selected/default/hover values, precision, callbacks and native ARIA. Rating is interactive even without onChange; use RatingDisplay for read-only summaries. There is no root disabled prop: use valid native input slots when necessary. Production components are unchanged.',
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: ratingSizes },
    color: { control: 'select', options: ratingColors },
    step: { control: 'select', options: [1, 0.5] },
    max: { control: 'number' },
  },
} satisfies Meta<typeof Rating>;

export default meta;
type Story = StoryObj<typeof meta>;

const comparePlay: NonNullable<Story['play']> = async ({ canvas, canvasElement }) => {
  await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
  await waitFor(
    async () => {
      const report = canvasElement.querySelector<HTMLElement>('[data-rating-report-ready="true"]');
      await expect(report).not.toBeNull();
      await expect(report?.dataset.ratingReportCount).toBe(report?.dataset.ratingExpectedCount);
      await expect(canvas.getByRole('status', { name: 'Rating style report' })).toHaveTextContent(
        'No differences in the selected properties.',
      );
    },
    { timeout: 10000 },
  );
  const root = getComparisonRating(canvasElement, 'headless');
  assertRatingGeometry(root);
  await expect(getRatingItems(root).length).toBeGreaterThan(0);
};

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: comparePlay,
};

export const RTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <ComparisonWithReport
        examples={[
          { name: 'RTL half rating', props: { defaultValue: 2.5, step: 0.5 } },
          { name: 'RTL brand', props: { defaultValue: 3, size: 'small', color: 'brand' } },
        ]}
      />
    </CoreAIFluentProvider>
  ),
  play: comparePlay,
};

export const DefaultsOptOut: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} withComponentDefaults={false}>
      <ComparisonWithReport examples={ratingExamples.slice(0, 3)} />
    </CoreAIFluentProvider>
  ),
  play: comparePlay,
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[ratingConsumerExample]} />,
  play: async ({ canvas, canvasElement }) => {
    const root = getComparisonRating(canvasElement, 'headless');
    const first = getRatingItems(root)[0];
    await expect(getComputedStyle(root).gap).toBe('6px');
    await expect(getComputedStyle(first).width).toBe('34px');
    const selected = first.querySelector('.fui-RatingItem__selectedIcon');
    if (!selected) throw new Error('Missing selected consumer icon');
    await expect(getComputedStyle(selected).color).toBe('rgb(120, 40, 80)');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(async () => {
      await expect(
        canvasElement.querySelector(
          '[data-rating-report-ready="true"][data-rating-report-count="1"]',
        ),
      ).not.toBeNull();
    });
    assertRatingGeometry(root);
  },
};

export const RatingInput: Story = {
  args: { onChange: fn() },
  render: (args) => <RatingInputFlow {...args} />,
  play: async ({ args, canvas, canvasElement }) => {
    const group = canvas.getByRole('radiogroup', { name: 'Rate this template' });
    await expect(group).toBeVisible();
    await expect(canvas.getByRole('radio', { name: '2.5 out of 5' })).toBeChecked();
    await userEvent.click(canvas.getByRole('radio', { name: '4.5 out of 5' }));
    await expect(canvas.getByRole('radio', { name: '4.5 out of 5' })).toBeChecked();
    await expect(canvas.getByRole('status', { name: 'Your rating' })).toHaveTextContent(
      'Your rating: 4.5 / 5',
    );
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ type: 'change', value: 4.5 }),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Send rating' }));
    await expect(canvas.getByRole('status', { name: 'Submitted rating' })).toHaveTextContent(
      'Submitted rating: 4.5',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Clear rating' }));
    await expect(canvas.getByRole('status', { name: 'Your rating' })).toHaveTextContent(
      'Your rating: 0 / 5',
    );
    await expect(
      canvas
        .getAllByRole('radio')
        .every((input) => input instanceof HTMLInputElement && !input.checked),
    ).toBe(true);
    const root = canvasElement.querySelector<HTMLElement>('.fui-Rating');
    if (!root) throw new Error('Missing final Rating flow root');
    assertRatingGeometry(root);
  },
};
