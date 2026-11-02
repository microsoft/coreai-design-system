// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { ProgressBar } from '@coreai-ds/react-headless-components';
import {
  ProgressBarComparison,
  ProgressBarUpload,
  progressBarColors,
  progressBarConsumerExample,
  progressBarRangeExamples,
  progressBarShapes,
  progressBarThicknesses,
  type ProgressBarExample,
} from './ProgressBarComparison.js';
import {
  captureProgressBarStyles,
  compareProgressBarStyles,
  getComparisonProgressBar,
  settleProgressBarStyles,
  type ProgressBarStyleDifference,
} from './compareProgressBarStyles.js';
import styles from './ProgressBarComparison.module.css';

function ComparisonWithReport({
  examples,
  consumerOverrides = false,
}: {
  examples?: readonly ProgressBarExample[];
  consumerOverrides?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (ProgressBarStyleDifference & { example: string })[] | null
  >(null);
  const [comparing, setComparing] = React.useState(false);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('ProgressBar comparison has not mounted');
    setComparing(true);
    try {
      const rows = [...container.querySelectorAll<HTMLElement>('[data-progressbar-case]')];
      if (!rows.length) throw new Error('ProgressBar comparison has no examples');
      const pairs = rows.map((row) => ({
        example: row.dataset.progressbarCase ?? '',
        legacy: getComparisonProgressBar(row, 'legacy'),
        headless: getComparisonProgressBar(row, 'headless'),
      }));
      await Promise.all(
        pairs.flatMap(({ legacy, headless }) => [
          settleProgressBarStyles(legacy),
          settleProgressBarStyles(headless),
        ]),
      );
      setDifferences(
        pairs.flatMap(({ example, legacy, headless }) =>
          compareProgressBarStyles(
            captureProgressBarStyles(legacy),
            captureProgressBarStyles(headless),
          ).map((difference) => ({ example, ...difference })),
        ),
      );
    } finally {
      setComparing(false);
    }
  };

  return (
    <div>
      <p>
        Both columns share the active provider, theme, and fixtures. CoreAI re-exports Fluent
        ProgressBar without additional defaults or overrides. Color follows the public Field
        validation context unless explicitly supplied; indeterminate bars remain brand-colored.
      </p>
      <p>
        This report compares selected track/bar styles, dimensions, pseudo-element absence, and
        actual animation timing/keyframes. It pauses only bar-slot animations at frame zero, never
        waits for infinite animations, and leaves consumer child animations running. The old visual
        motion slot uses WAAPI; the current headless props omit that slot, so CSS supplies the same
        slide and reduced-motion opacity pulse. No generated animation names or screenshots are
        compared. Native direction mirrors the gradient; upstream motion translates physically in
        both directions. The report canonicalizes only the equivalent identity easings linear and
        cubic-bezier(0, 0, 1, 1), because CSS attaches its timing function to keyframes while WAAPI
        attaches the upstream curve to the effect. All other easing values remain exact.
      </p>
      {consumerOverrides && (
        <p>
          Intentional difference: ordinary unlayered consumer CSS overrides the new layered track
          thickness, corners, bar color, and transition duration. Griffel can retain its original
          values. The report displays these differences rather than excluding them.
        </p>
      )}
      <button type="button" onClick={compare} disabled={comparing}>
        Compare frame-zero styles
      </button>
      <output className={styles.report} aria-label="Computed style comparison" aria-live="polite">
        {differences === null
          ? 'Comparison not run.'
          : differences.length
            ? JSON.stringify(differences, null, 2)
            : 'No differences in the selected properties.'}
      </output>
      <div ref={containerRef}>
        <ProgressBarComparison examples={examples} />
      </div>
    </div>
  );
}

const meta = {
  title: 'Experiments/Headless ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment: current public useProgressBar/renderProgressBar and useFieldContext from headless preview 0.3.2, with CSS Modules from react-progress 9.5.7. Rounded/square shape, medium/large thickness, and brand/error/warning/success color are visual props removed before the native hook. The public HTMLDivElement ref, current slots/render functions, resolved ARIA, clamped values/maxima, data-indeterminate, inline bar-width priority, and Field label/description binding remain headless-owned. The current headless props have no indeterminateMotion slot or progress-change callback. Native CSS nesting, :dir(), percentage sizing, individual translate animation, forced colors, and reduced-motion opacity pulse provide the visuals. No overlay, focusgroup, or component-specific JavaScript polyfill is needed. Legacy customStyleHooks are not called. Production ProgressBar is unchanged.',
      },
    },
  },
  argTypes: {
    shape: { control: 'select', options: progressBarShapes },
    thickness: { control: 'select', options: progressBarThicknesses },
    color: { control: 'select', options: progressBarColors },
    value: { control: { type: 'number', min: 0, step: 0.1 } },
    max: { control: { type: 'number', min: 1 } },
    bar: { control: false },
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare frame-zero styles' }));
    await waitFor(
      () =>
        expect(canvas.getByRole('status', { name: 'Computed style comparison' })).toHaveTextContent(
          'No differences in the selected properties.',
        ),
      { timeout: 10000 },
    );
  },
};

export const RangeEdges: Story = {
  render: () => (
    <>
      <p>
        These shared fixtures expose the primitive&apos;s resolved range semantics. Nonpositive
        maxima fall back to one, and values clamp to the resolved range; development diagnostics are
        expected for those invalid inputs. Omitting value, or supplying undefined, removes the
        determinate ARIA range. The wrapper does not add its own normalization.
      </p>
      <ComparisonWithReport examples={progressBarRangeExamples} />
    </>
  ),
  play: async ({ canvasElement, canvas }) => {
    for (const example of progressBarRangeExamples) {
      const row = [...canvasElement.querySelectorAll<HTMLElement>('[data-progressbar-case]')].find(
        (candidate) => candidate.dataset.progressbarCase === example.name,
      );
      if (!row) throw new Error(`Missing range fixture ${example.name}`);
      for (const implementation of ['legacy', 'headless'] as const) {
        const { root } = getComparisonProgressBar(row, implementation);
        if (example.expectedValue === undefined) {
          await expect(root).not.toHaveAttribute('aria-valuenow');
          await expect(root).not.toHaveAttribute('aria-valuemax');
        } else {
          await expect(root).toHaveAttribute('aria-valuenow', String(example.expectedValue));
          await expect(root).toHaveAttribute('aria-valuemax', String(example.expectedMax));
        }
      }
    }
    await userEvent.click(canvas.getByRole('button', { name: 'Compare frame-zero styles' }));
    await waitFor(() =>
      expect(canvas.getByRole('status', { name: 'Computed style comparison' })).toHaveTextContent(
        'No differences in the selected properties.',
      ),
    );
  },
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[progressBarConsumerExample]} consumerOverrides />,
  play: async ({ canvasElement, canvas }) => {
    const control = getComparisonProgressBar(canvasElement, 'headless');
    await settleProgressBarStyles(control);
    const values = captureProgressBarStyles(control);
    await expect(values['root.height']).toBe('10.00');
    await expect(values['root.border-top-left-radius']).toBe('1px');
    await expect(values['bar.border-top-left-radius']).toBe('0px');
    await expect(values['bar.transition-duration']).toBe('0.6s');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare frame-zero styles' }));
    await waitFor(() =>
      expect(
        canvas.getByRole('status', { name: 'Computed style comparison' }),
      ).not.toHaveTextContent('Comparison not run.'),
    );
  },
};

export const Playground: Story = {
  args: {
    value: 0.5,
    max: 1,
    shape: 'rounded',
    thickness: 'medium',
    color: 'brand',
    'aria-label': 'Files uploaded',
  },
  render: (args) => (
    <div className={styles.upload}>
      <ProgressBar {...args} />
    </div>
  ),
};

export const ProgressUpdates: Story = {
  args: { shape: 'rounded', thickness: 'large', color: 'brand' },
  render: (args) => <ProgressBarUpload {...args} />,
  play: async ({ canvas }) => {
    const region = canvas.getByRole('region', { name: 'Project upload' });
    const progress = canvas.getByRole('progressbar', { name: 'Files uploaded' });
    await expect(region).toHaveAttribute('aria-busy', 'true');
    await expect(progress).not.toHaveAttribute('aria-valuenow');
    await expect(progress).toHaveAttribute('data-indeterminate', '');
    await userEvent.click(canvas.getByRole('button', { name: 'Discover upload size' }));
    await expect(progress).toHaveAttribute('aria-valuenow', '0');
    await expect(progress).toHaveAttribute('aria-valuemin', '0');
    await expect(progress).toHaveAttribute('aria-valuemax', '4');
    await expect(progress).not.toHaveAttribute('data-indeterminate');
    for (let value = 1; value <= 4; value++) {
      await userEvent.click(canvas.getByRole('button', { name: 'Upload next file' }));
      await expect(progress).toHaveAttribute('aria-valuenow', String(value));
    }
    await expect(region).toHaveAttribute('aria-busy', 'false');
    await expect(canvas.getByRole('status', { name: 'Upload status' })).toHaveTextContent(
      'Upload complete',
    );
    await expect(canvas.getByRole('button', { name: 'Upload next file' })).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: 'Restart upload' }));
    await expect(region).toHaveAttribute('aria-busy', 'true');
    await expect(progress).not.toHaveAttribute('aria-valuenow');
    await expect(progress).not.toHaveAttribute('aria-valuemin');
    await expect(progress).not.toHaveAttribute('aria-valuemax');
    await expect(progress).toHaveAttribute('data-indeterminate', '');
  },
};
