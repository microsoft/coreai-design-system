// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { CoreAIFluentProvider } from '@coreai-ds/react-components';
import { RatingDisplay } from '@coreai-ds/react-headless-components';
import { ratingColors, ratingSizes } from './RatingComparison.js';
import {
  RatingDisplayComparison,
  RatingSummaryFlow,
  ratingDisplayConsumerExample,
  ratingDisplayExamples,
  type RatingDisplayExample,
} from './RatingDisplayComparison.js';
import { assertRatingGeometry, settleRatingStyles } from './compareRatingStyles.js';
import {
  captureRatingDisplayStyles,
  compareRatingDisplayStyles,
  getComparisonRatingDisplay,
  type RatingDisplayStyleDifference,
} from './compareRatingDisplayStyles.js';
import styles from './RatingDisplayComparison.module.css';

function ComparisonWithReport({
  examples = ratingDisplayExamples,
}: {
  examples?: readonly RatingDisplayExample[];
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [results, setResults] = React.useState<
    | { rows: number; differences: (RatingDisplayStyleDifference & { example: string })[] }
    | undefined
  >();
  const [comparing, setComparing] = React.useState(false);
  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('RatingDisplay comparison has not mounted');
    setComparing(true);
    setResults(undefined);
    try {
      const rows = [...container.querySelectorAll<HTMLElement>('[data-ratingdisplay-case]')];
      if (rows.length !== examples.length) throw new Error('Incomplete RatingDisplay fixtures');
      const differences = [];
      for (const row of rows) {
        const legacy = getComparisonRatingDisplay(row, 'legacy');
        const headless = getComparisonRatingDisplay(row, 'headless');
        await Promise.all([settleRatingStyles(legacy), settleRatingStyles(headless)]);
        assertRatingGeometry(legacy);
        assertRatingGeometry(headless);
        differences.push(
          ...compareRatingDisplayStyles(
            captureRatingDisplayStyles(legacy),
            captureRatingDisplayStyles(headless),
          ).map((difference) => ({ example: row.dataset.ratingdisplayCase ?? '', ...difference })),
        );
      }
      setResults({ rows: rows.length, differences });
    } finally {
      setComparing(false);
    }
  };
  return (
    <div
      data-ratingdisplay-report-ready={results ? 'true' : 'false'}
      data-ratingdisplay-report-count={results?.rows ?? 0}
      data-ratingdisplay-expected-count={examples.length}
    >
      <p>
        One RatingItem foundation is shared with Rating. The report compares selected root, item,
        selected/unselected/half-filled glyph, average-value/count label, divider-pseudo styles and
        live dimensions. Formatting, rounding and the accessible image name remain owned by the
        installed public hook; there are no CoreAI-specific defaults or style overrides. Absent
        children are omitted in the fixtures: legacy RatingDisplay suppresses its default items when
        explicitly passed children={'{undefined}'}, while the current hook uses a nullish fallback.
      </p>
      <button type="button" disabled={comparing} onClick={compare}>
        Compare resting styles
      </button>
      <output className={styles.report} aria-label="RatingDisplay style report" aria-live="polite">
        {!results
          ? 'Comparison not run.'
          : results.differences.length
            ? `${results.differences.length} differences (showing at most 60):\n${JSON.stringify(results.differences.slice(0, 60), null, 2)}`
            : 'No differences in the selected properties.'}
      </output>
      <div ref={containerRef}>
        <RatingDisplayComparison examples={examples} />
      </div>
    </div>
  );
}

const meta = {
  title: 'Experiments/Headless RatingDisplay',
  component: RatingDisplay,
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'Private read-only rating migration using the installed public 0.3.2 facade. A single CSS-styled RatingItem foundation is reused for full and compact displays; the current hook owns nearest-half fill, count locale formatting, text slots and accessible image naming. No custom star behavior, legacy Tabster navigation, overlay or polyfill is added.',
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: ratingSizes },
    color: { control: 'select', options: ratingColors },
    compact: { control: 'boolean' },
    max: { control: 'number' },
    count: { control: 'number' },
  },
} satisfies Meta<typeof RatingDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

const comparePlay: NonNullable<Story['play']> = async ({ canvas, canvasElement }) => {
  await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
  await waitFor(
    async () => {
      const report = canvasElement.querySelector<HTMLElement>(
        '[data-ratingdisplay-report-ready="true"]',
      );
      await expect(report).not.toBeNull();
      await expect(report?.dataset.ratingdisplayReportCount).toBe(
        report?.dataset.ratingdisplayExpectedCount,
      );
      await expect(
        canvas.getByRole('status', { name: 'RatingDisplay style report' }),
      ).toHaveTextContent('No differences in the selected properties.');
    },
    { timeout: 10000 },
  );
  assertRatingGeometry(getComparisonRatingDisplay(canvasElement, 'headless'));
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
          { name: 'RTL half-filled summary', props: { value: 2.5, count: 1160 } },
          {
            name: 'RTL large marigold',
            props: { value: 4.5, count: 42, color: 'marigold', size: 'large' },
          },
        ]}
      />
    </CoreAIFluentProvider>
  ),
  play: comparePlay,
};

export const DefaultsOptOut: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} withComponentDefaults={false}>
      <ComparisonWithReport examples={ratingDisplayExamples.slice(0, 3)} />
    </CoreAIFluentProvider>
  ),
  play: comparePlay,
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[ratingDisplayConsumerExample]} />,
  play: async ({ canvas, canvasElement }) => {
    const root = getComparisonRatingDisplay(canvasElement, 'headless');
    const value = root.querySelector('.fui-RatingDisplay__valueText');
    const count = root.querySelector('.fui-RatingDisplay__countText');
    if (!value || !count) throw new Error('Missing consumer RatingDisplay labels');
    await expect(getComputedStyle(value).fontSize).toBe('18px');
    await expect(getComputedStyle(value).color).toBe('rgb(100, 40, 120)');
    await expect(getComputedStyle(count, '::before').content).toBe('"/ "');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(async () => {
      await expect(
        canvasElement.querySelector(
          '[data-ratingdisplay-report-ready="true"][data-ratingdisplay-report-count="1"]',
        ),
      ).not.toBeNull();
    });
    assertRatingGeometry(root);
  },
};

export const ReviewSummary: Story = {
  render: () => <RatingSummaryFlow />,
  play: async ({ canvas, canvasElement }) => {
    const initialName = `3.7 ${(1160).toLocaleString()}`;
    await expect(canvas.getByRole('img', { name: initialName })).toBeVisible();
    await expect(canvas.queryByRole('radio')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Show recent reviews' }));
    await expect(canvas.getByRole('img', { name: '4.2 204' })).toBeVisible();
    await expect(canvas.getByRole('status', { name: 'Review sample' })).toHaveTextContent(
      'Recent reviews',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Show all reviews' }));
    await expect(canvas.getByRole('img', { name: initialName })).toBeVisible();
    await expect(canvas.getByRole('status', { name: 'Review sample' })).toHaveTextContent(
      'All reviews',
    );
    const root = canvasElement.querySelector<HTMLElement>('.fui-RatingDisplay');
    if (!root) throw new Error('Missing final read-only summary');
    assertRatingGeometry(root);
    await expect(root.querySelectorAll('input').length).toBe(0);
  },
};
