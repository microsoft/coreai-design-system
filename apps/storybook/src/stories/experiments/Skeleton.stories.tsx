// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Skeleton, SkeletonItem, type SkeletonProps } from '@coreai-ds/react-headless-components';
import {
  SkeletonComparison,
  SkeletonLoadingFlow,
  skeletonAnimations,
  skeletonAppearances,
  skeletonConsumerExample,
  skeletonShapes,
  skeletonSizes,
  type SkeletonExample,
} from './SkeletonComparison.js';
import {
  captureSkeletonStyles,
  compareSkeletonStyles,
  getComparisonSkeleton,
  settleSkeletonStyles,
  type SkeletonStyleDifference,
} from './compareSkeletonStyles.js';
import styles from './SkeletonComparison.module.css';

function ComparisonWithReport({
  examples,
  consumerOverrides = false,
}: {
  examples?: readonly SkeletonExample[];
  consumerOverrides?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (SkeletonStyleDifference & { example: string })[] | null
  >(null);
  const [comparing, setComparing] = React.useState(false);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Skeleton comparison has not mounted');
    setComparing(true);
    try {
      const rows = [...container.querySelectorAll<HTMLElement>('[data-skeleton-case]')];
      if (!rows.length) throw new Error('Skeleton comparison has no examples');
      const pairs = rows.map((row) => ({
        example: row.dataset.skeletonCase ?? '',
        legacy: getComparisonSkeleton(row, 'legacy'),
        headless: getComparisonSkeleton(row, 'headless'),
      }));
      await Promise.all(
        pairs.flatMap(({ legacy, headless }) => [
          settleSkeletonStyles(legacy),
          settleSkeletonStyles(headless),
        ]),
      );
      setDifferences(
        pairs.flatMap(({ example, legacy, headless }) =>
          compareSkeletonStyles(captureSkeletonStyles(legacy), captureSkeletonStyles(headless)).map(
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
        Both columns share the active provider, theme, and fixtures. CoreAI adds no defaults or
        overrides to Skeleton or SkeletonItem. The new family uses public headless hooks, renderers,
        and the context facade, plus a small visual-only context because the pinned public API has
        no visual-context reader.
      </p>
      <p>
        This bounded report compares root/item dimensions, offsets, backgrounds, shape, and actual
        item pseudo-element styles and keyframes. Only owned ::after CSS animations are paused at
        frame zero; consumer animations keep running. Durations, easing, iterations, and keyframes
        remain part of the comparison. It is not a screenshot or a full CSS dump.
      </p>
      {consumerOverrides && (
        <p>
          Intentional difference: ordinary unlayered consumer CSS overrides the new layered
          component styles. Legacy Griffel can retain its block layout, dimensions, shape,
          backgrounds, or animation rules; the report shows any differences instead of hiding them.
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
        <SkeletonComparison examples={examples} />
      </div>
    </div>
  );
}

function VisualInheritance(props: SkeletonProps) {
  return (
    <Skeleton {...props} aria-label="Loading inherited placeholders">
      <SkeletonItem />
      <SkeletonItem animation="wave" appearance="opaque" shape="rectangle" size={12} />
      <SkeletonItem
        animation={undefined}
        appearance={undefined}
        size={undefined}
        shape={undefined}
      />
    </Skeleton>
  );
}

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless Skeleton',
  component: Skeleton,
  subcomponents: { SkeletonItem },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment: public useSkeleton/renderSkeleton/useSkeletonContextValues and useSkeletonItem/renderSkeletonItem from headless preview 0.3.2, with direct CSS Modules from react-skeleton 9.7.7. Wave/pulse animation, opaque/translucent appearance, all twenty item sizes, circle/square/rectangle shapes, visual inheritance, supported div/span slots, refs, caller render functions, role and aria-busy are retained. The public context facade publishes the visual choices; a typed same-family React context supplies the missing public visual reader without behavioral state or legacy context imports. Nested Skeleton inherits animation/appearance but starts a new size/shape scope, as in the installed reference. Deprecated width is omitted; use className/style instead. Native :dir() and mirrored keyframes retain RTL wave direction; source forced-colors and reduced-motion rules are ported. No overlay, focusgroup, glyph, motion package, or component-specific JavaScript polyfill is needed. Loading/completion belongs to the application, not a new component prop. Arbitrary legacy customStyleHooks are not called. Production components are unchanged.',
      },
    },
  },
  argTypes: {
    animation: { control: 'select', options: skeletonAnimations },
    appearance: { control: 'select', options: skeletonAppearances },
    size: { control: 'select', options: skeletonSizes },
    shape: { control: 'select', options: skeletonShapes },
    children: { control: false },
  },
} satisfies Meta<typeof Skeleton>;

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
  render: () => <ComparisonWithReport examples={[skeletonConsumerExample]} consumerOverrides />,
  play: async ({ canvas, canvasElement }) => {
    const headless = getComparisonSkeleton(canvasElement, 'headless');
    await settleSkeletonStyles(headless);
    const values = captureSkeletonStyles(headless);
    await expect(values['group[0].display']).toBe('grid');
    await expect(values['item[0].width']).toBe('68.00');
    await expect(values['item[0].height']).toBe('26.00');
    await expect(values['item[0].border-radius']).toBe('3px');
    await expect(values['item[0]::after.animation-duration']).toBe('2.4s');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare frame-zero styles' }));
    await waitFor(() =>
      expect(
        canvas.getByRole('status', { name: 'Computed style comparison' }),
      ).not.toHaveTextContent('Comparison not run.'),
    );
  },
};

export const ContextAndItemOverrides: Story = {
  args: { animation: 'pulse', appearance: 'translucent', size: 40, shape: 'circle' },
  render: (args) => <VisualInheritance {...args} />,
  play: async ({ canvasElement, args }) => {
    const items = canvasElement.querySelectorAll('.fui-SkeletonItem');
    await expect(items).toHaveLength(3);
    for (const index of [0, 2]) {
      await expect(items[index]).toHaveAttribute('data-animation', args.animation);
      await expect(items[index]).toHaveAttribute('data-appearance', args.appearance);
      await expect(items[index]).toHaveAttribute('data-size', String(args.size));
      await expect(items[index]).toHaveAttribute('data-shape', args.shape);
    }
    await expect(items[1]).toHaveAttribute('data-size', '12');
    await expect(items[1]).toHaveAttribute('data-animation', 'wave');
    await expect(items[1]).toHaveAttribute('data-appearance', 'opaque');
    await expect(items[1]).toHaveAttribute('data-shape', 'rectangle');
  },
};

export const LoadingAndCompletion: Story = {
  args: { animation: 'wave', appearance: 'opaque' },
  render: (args) => <SkeletonLoadingFlow {...args} />,
  play: async ({ canvas }) => {
    const region = canvas.getByRole('region', { name: 'Project owner' });
    await expect(region).toHaveAttribute('aria-busy', 'true');
    await expect(
      canvas.getByRole('progressbar', { name: 'Loading project owner' }),
    ).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Complete mock load' }));
    await expect(region).toHaveAttribute('aria-busy', 'false');
    await expect(canvas.queryByRole('progressbar')).not.toBeInTheDocument();
    await expect(canvas.getByRole('article', { name: 'Loaded project owner' })).toHaveTextContent(
      'Jordan Lee',
    );
    await expect(canvas.getByRole('status')).toHaveTextContent('Project owner loaded.');
    await userEvent.click(canvas.getByRole('button', { name: 'Reload owner' }));
    await expect(region).toHaveAttribute('aria-busy', 'true');
    await expect(
      canvas.getByRole('progressbar', { name: 'Loading project owner' }),
    ).toBeInTheDocument();
  },
};
