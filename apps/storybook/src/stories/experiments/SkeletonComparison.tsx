// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Skeleton as LegacySkeleton,
  SkeletonItem as LegacySkeletonItem,
} from '@coreai-ds/react-components';
import {
  Skeleton as HeadlessSkeleton,
  SkeletonItem as HeadlessSkeletonItem,
  type SkeletonItemProps,
  type SkeletonItemSlots,
  type SkeletonProps,
  type SkeletonSlots,
} from '@coreai-ds/react-headless-components';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import styles from './SkeletonComparison.module.css';

export const skeletonAnimations = ['wave', 'pulse'] as const;
export const skeletonAppearances = ['opaque', 'translucent'] as const;
export const skeletonShapes = ['rectangle', 'circle', 'square'] as const;
export const skeletonSizes = [
  8, 12, 14, 16, 20, 22, 24, 28, 32, 36, 40, 48, 52, 56, 64, 72, 92, 96, 120, 128,
] as const;

export interface SkeletonExample {
  name: string;
  props?: SkeletonProps;
  items?: readonly SkeletonItemProps[];
  nested?: { props?: SkeletonProps; items?: readonly SkeletonItemProps[] };
  renderRoot?: boolean;
}

const renderItem: SlotRenderFunction<
  Extract<ExtractSlotProps<SkeletonItemSlots['root']>, { as?: 'div' }>
> = (Component, props) => (
  <Component {...props} data-rendered-skeleton-item="">
    <span data-consumer-item-child="">Loading…</span>
  </Component>
);

export const skeletonExamples: SkeletonExample[] = [
  { name: 'Default' },
  ...skeletonAppearances.flatMap((appearance) =>
    skeletonAnimations.flatMap((animation) =>
      skeletonShapes.map<SkeletonExample>((shape) => ({
        name: `${appearance}: ${animation}: ${shape}`,
        props: { appearance, animation, shape, size: 28 },
      })),
    ),
  ),
  ...skeletonShapes.flatMap((shape) =>
    skeletonSizes.map<SkeletonExample>((size) => ({
      name: `${shape}: ${size}px`,
      items: [{ shape, size }],
    })),
  ),
  {
    name: 'Inline roots and items',
    props: { as: 'span', size: 24 },
    items: [{ as: 'span' }],
  },
  {
    name: 'Explicit item visual overrides',
    props: { animation: 'pulse', appearance: 'translucent', size: 64, shape: 'circle' },
    items: [
      {},
      { animation: 'wave', appearance: 'opaque', size: 22, shape: 'square' },
      { animation: undefined, appearance: undefined, size: undefined, shape: undefined },
    ],
  },
  {
    name: 'Nested inheritance and size reset',
    props: { animation: 'pulse', appearance: 'translucent', size: 64, shape: 'circle' },
    items: [{ size: 20 }],
    nested: { items: [{}, { size: 32, shape: 'square' }] },
  },
  {
    name: 'Nested root overrides',
    props: { animation: 'pulse', appearance: 'translucent', size: 64, shape: 'circle' },
    nested: {
      props: { animation: 'wave', appearance: 'opaque', size: 36, shape: 'square' },
    },
  },
  {
    name: 'Explicitly undefined visual props',
    props: { animation: undefined, appearance: undefined, size: undefined, shape: undefined },
    items: [{ animation: undefined, appearance: undefined, size: undefined, shape: undefined }],
  },
  {
    name: 'Custom item content',
    items: [
      {
        size: 32,
        className: 'consumer-item',
        children: <em data-consumer-item-child="">Loading project details…</em>,
      },
    ],
  },
  {
    name: 'Root and item render functions',
    props: { className: 'consumer-root', size: 32 },
    items: [{ className: 'consumer-item', children: renderItem }],
    renderRoot: true,
  },
  {
    name: 'Caller role and loading attributes',
    props: { role: 'status', 'aria-busy': false, 'aria-live': 'polite' },
  },
];

export const skeletonConsumerExample: SkeletonExample = {
  name: 'Consumer CSS Modules',
  props: { as: 'span', className: styles.consumerRoot },
  items: [{ as: 'span', className: styles.consumerItem }],
};

function SkeletonFixture({
  implementation,
  name,
  props = {},
  items = [{}],
  nested,
  renderRoot = false,
}: SkeletonExample & { implementation: 'legacy' | 'headless' }): React.ReactElement {
  const Root = implementation === 'legacy' ? LegacySkeleton : HeadlessSkeleton;
  const Item = implementation === 'legacy' ? LegacySkeletonItem : HeadlessSkeletonItem;
  const renderItems = (values: readonly SkeletonItemProps[]) =>
    values.map((itemProps, index) => <Item key={index} {...itemProps} />);
  const content = (
    <>
      {renderItems(items)}
      {nested && (
        <Root {...nested.props} aria-label="Nested placeholder">
          {renderItems(nested.items ?? [{}])}
        </Root>
      )}
    </>
  );
  const renderSkeleton: SlotRenderFunction<
    Extract<ExtractSlotProps<SkeletonSlots['root']>, { as?: 'div' }>
  > = (Component, slotProps) => (
    <Component {...slotProps} data-rendered-skeleton="">
      {content}
      <span data-consumer-root-child="" />
    </Component>
  );

  return (
    <div className={styles.cell} data-skeleton-implementation={implementation}>
      <Root {...props} aria-label={props['aria-label'] ?? name}>
        {renderRoot ? renderSkeleton : content}
      </Root>
    </div>
  );
}

export function SkeletonComparison({
  examples = skeletonExamples,
}: {
  examples?: readonly SkeletonExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-skeleton-case={example.name}>
          <span>{example.name}</span>
          <SkeletonFixture {...example} implementation="legacy" />
          <SkeletonFixture {...example} implementation="headless" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonLoadingFlow(props: SkeletonProps): React.ReactElement {
  const [loading, setLoading] = React.useState(true);

  return (
    <div className={styles.playground}>
      <p>
        Complete this deterministic mock request, then reload. The application owns the loading
        state and replaces the placeholder with real content; Skeleton has no loading-state prop.
      </p>
      <section aria-label="Project owner" aria-busy={loading} className={styles.loadingRegion}>
        {loading ? (
          <HeadlessSkeleton
            {...props}
            className={[styles.profile, props.className].filter(Boolean).join(' ')}
            aria-label={props['aria-label'] ?? 'Loading project owner'}
          >
            <HeadlessSkeletonItem shape="circle" size={48} />
            <div className={styles.profileLines}>
              <HeadlessSkeletonItem size={20} className={styles.profileName} />
              <HeadlessSkeletonItem size={12} className={styles.profileDetail} />
            </div>
          </HeadlessSkeleton>
        ) : (
          <article aria-label="Loaded project owner">
            <h3>Jordan Lee</h3>
            <p>Design system maintainer</p>
          </article>
        )}
      </section>
      <p role="status" aria-live="polite">
        {loading ? 'Loading owner…' : 'Project owner loaded.'}
      </p>
      <div className={styles.actions}>
        <button type="button" disabled={!loading} onClick={() => setLoading(false)}>
          Complete mock load
        </button>
        <button type="button" disabled={loading} onClick={() => setLoading(true)}>
          Reload owner
        </button>
      </div>
    </div>
  );
}
