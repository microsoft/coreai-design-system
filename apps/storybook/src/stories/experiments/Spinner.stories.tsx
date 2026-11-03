// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Spinner, type SpinnerProps } from '@coreai-ds/react-headless-components';
import {
  SpinnerComparison,
  spinnerAppearances,
  spinnerConsumerExample,
  spinnerLabelPositions,
  spinnerSizes,
  type SpinnerExample,
} from './SpinnerComparison.js';
import {
  captureSpinnerStyles,
  compareSpinnerStyles,
  getComparisonSpinner,
  settleSpinnerStyles,
  type SpinnerStyleDifference,
} from './compareSpinnerStyles.js';
import styles from './SpinnerComparison.module.css';

function ComparisonWithReport({
  examples,
  consumerOverrides = false,
}: {
  examples?: readonly SpinnerExample[];
  consumerOverrides?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (SpinnerStyleDifference & { example: string })[] | null
  >(null);
  const [comparing, setComparing] = React.useState(false);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Spinner comparison has not mounted');
    setComparing(true);
    try {
      const rows = [...container.querySelectorAll<HTMLElement>('[data-spinner-case]')];
      if (!rows.length) throw new Error('Spinner comparison has no examples');
      const pairs = rows.map((row) => ({
        example: row.dataset.spinnerCase ?? '',
        legacy: getComparisonSpinner(row, 'legacy'),
        headless: getComparisonSpinner(row, 'headless'),
      }));
      await Promise.all(
        pairs.flatMap(({ legacy, headless }) => [
          settleSpinnerStyles(legacy),
          settleSpinnerStyles(headless),
        ]),
      );
      setDifferences(
        pairs.flatMap(({ example, legacy, headless }) =>
          compareSpinnerStyles(captureSpinnerStyles(legacy), captureSpinnerStyles(headless)).map(
            (difference) => ({ example, ...difference }),
          ),
        ),
      );
    } finally {
      setComparing(false);
    }
  };

  return (
    <div>
      <p>
        Both columns share the active provider, theme, and fixtures. CoreAI adds no Spinner defaults
        or overrides. The headless label reuses the local Label component through a public slot
        render function, preserving the primitive&apos;s native label metadata.
      </p>
      <p>
        The report compares selected root, ring, tail, label, required-indicator, and actual
        tail-pseudo-element styles and dimensions. It pauses only owned CSS animations at frame zero
        so geometry and transforms are deterministic; durations, easing, iterations, masks, and
        actual keyframes are still compared. Generated keyframe names are not a visual contract.
        Consumer child animations are not paused. This is not a pixel comparison.
      </p>
      {consumerOverrides && (
        <p>
          Intentional difference: ordinary unlayered consumer CSS overrides the new layered root,
          ring, tail pseudo-elements, and label styles. Legacy Griffel can retain its size, color,
          or typography rules. The report displays these differences rather than excluding them.
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
        <SpinnerComparison examples={examples} />
      </div>
    </div>
  );
}

function SpinnerLoadingState(props: SpinnerProps) {
  const [loading, setLoading] = React.useState(true);
  return (
    <div className={styles.playground}>
      <p>
        A deterministic mock request: complete the load, then reload. There is no network request or
        automatic timer. The loading region owns aria-busy; the caller opts the Spinner into a
        polite status announcement.
      </p>
      <div
        role="region"
        aria-label="Projects"
        aria-busy={loading}
        className={[
          styles.loadingRegion,
          loading && props.appearance === 'inverted' && styles.inverted,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {loading ? (
          <Spinner {...props} role="status" aria-live="polite" />
        ) : (
          <ul>
            <li>Design system</li>
            <li>Model evaluation</li>
            <li>Workspace settings</li>
          </ul>
        )}
      </div>
      <button type="button" disabled={!loading} onClick={() => setLoading(false)}>
        Complete mock load
      </button>
      <button type="button" disabled={loading} onClick={() => setLoading(true)}>
        Reload projects
      </button>
    </div>
  );
}

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless Spinner',
  component: Spinner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment: current public headless useSpinner/renderSpinner from preview 0.3.2, with CSS Modules from react-spinner 9.8.7 and the completed local Label foundation (react-label 9.4.6). Eight visual sizes, primary/inverted appearance, four label positions, delayed visibility, native slots/refs, progressbar naming, and caller live-region props are retained. The component exposes the current public ForwardRefComponent contract; useSpinner receives the native HTMLElement ref. CSS radial/conic masks, pseudo-elements, native :dir() with mirrored RTL keyframes, reduced-motion and forced-colors rules supply the visuals. No overlay, focusgroup, or component-specific JavaScript polyfill is required. There is no current public headless Spinner size context; the old internal context is not bridged. Consumer CSS replaces legacy customStyleHooks. Production Spinner is unchanged.',
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: spinnerSizes },
    appearance: { control: 'select', options: spinnerAppearances },
    labelPosition: { control: 'select', options: spinnerLabelPositions },
    label: { control: 'text' },
    delay: { control: { type: 'number', min: 0 } },
    spinner: { control: false },
    spinnerTail: { control: false },
  },
} satisfies Meta<typeof Spinner>;

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

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[spinnerConsumerExample]} consumerOverrides />,
  play: async ({ canvas, canvasElement }) => {
    const headless = getComparisonSpinner(canvasElement, 'headless');
    await settleSpinnerStyles(headless);
    const values = captureSpinnerStyles(headless);
    await expect(values['root.gap']).toBe('14px');
    await expect(values['spinner.width']).toBe('52.00');
    await expect(values['spinner.height']).toBe('52.00');
    await expect(values['spinner.--fui-Spinner--strokeWidth']).toBe('5px');
    await expect(values['spinner.animation-duration']).toBe('2.4s');
    await expect(values['label.font-size']).toBe('18px');
    await expect(values['required.padding-left']).toBe('10px');
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
    label: 'Loading projects…',
    size: 'medium',
    appearance: 'primary',
    labelPosition: 'after',
    delay: 0,
  },
  render: (args) => (
    <div className={args.appearance === 'inverted' ? styles.inverted : undefined}>
      <Spinner {...args} />
    </div>
  ),
};

export const LoadingState: Story = {
  args: {
    label: 'Loading projects…',
    size: 'medium',
    appearance: 'primary',
    labelPosition: 'after',
    delay: 0,
  },
  render: (args) => <SpinnerLoadingState {...args} />,
  play: async ({ canvas }) => {
    const region = canvas.getByRole('region', { name: 'Projects' });
    await expect(region).toHaveAttribute('aria-busy', 'true');
    await expect(canvas.getByRole('status', { name: 'Loading projects…' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Complete mock load' }));
    await expect(region).toHaveAttribute('aria-busy', 'false');
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
    await expect(
      canvas.queryByRole('status', { name: 'Loading projects…' }),
    ).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Reload projects' }));
    await expect(region).toHaveAttribute('aria-busy', 'true');
    await expect(canvas.getByRole('status', { name: 'Loading projects…' })).toHaveAttribute(
      'aria-live',
      'polite',
    );
    await expect(canvas.queryByRole('list')).not.toBeInTheDocument();
  },
};
