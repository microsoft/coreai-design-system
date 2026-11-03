// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  RatingDisplay as LegacyRatingDisplay,
  RatingItem as LegacyRatingItem,
} from '@coreai-ds/react-components';
import {
  RatingDisplay as HeadlessRatingDisplay,
  RatingItem as HeadlessRatingItem,
  type RatingDisplayProps,
  type RatingDisplaySlots,
  type RatingItemProps,
} from '@coreai-ds/react-headless-components';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import { CircleFilled } from '@fluentui/react-icons/headless/svg/circle';
import { SquareFilled } from '@fluentui/react-icons/headless/svg/square';
import { ratingColors, ratingSizes } from './RatingComparison.js';
import styles from './RatingDisplayComparison.module.css';

export interface RatingDisplayExample {
  name: string;
  props?: RatingDisplayProps;
  items?: readonly RatingItemProps[];
  renderRoot?: boolean;
}

export const ratingDisplayExamples: RatingDisplayExample[] = [
  { name: 'Default', props: { value: 4 } },
  ...[0, 0.5, 1, 2.5, 3.7, 3.9, 5].map<RatingDisplayExample>((value) => ({
    name: `Value: ${value}`,
    props: { value },
  })),
  ...ratingSizes.map<RatingDisplayExample>((size) => ({
    name: `Size: ${size}`,
    props: { size, value: 2.5, count: 1160 },
  })),
  ...ratingColors.map<RatingDisplayExample>((color) => ({
    name: `Color: ${color}`,
    props: { color, value: 2.5, count: 1160 },
  })),
  { name: 'Circle icon', props: { icon: CircleFilled, value: 2.5 } },
  { name: 'Square icon', props: { icon: SquareFilled, value: 2.5 } },
  { name: 'Compact', props: { compact: true, value: 3.7, count: 1160 } },
  { name: 'Count zero', props: { value: 0, count: 0 } },
  { name: 'Three items', props: { max: 3, value: 1.5, count: 42 } },
  { name: 'Ten items', props: { max: 10, value: 7.5 } },
  { name: 'Count only', props: { count: 1160 } },
  { name: 'Hidden count text', props: { value: 3.5, count: 1160, countText: null } },
  { name: 'Hidden value text', props: { value: 3.5, count: 1160, valueText: null } },
  {
    name: 'Explicitly undefined visual props',
    props: { value: 2.5, color: undefined, size: undefined, icon: undefined },
  },
  {
    name: 'Custom labels',
    props: { value: 4.5, count: 1160, valueText: '4.5 out of 5', countText: '(1,160 reviews)' },
  },
  {
    name: 'Explicit items',
    props: { value: 1.5, count: 42, size: 'large' },
    items: [{ value: 1 }, { value: 2 }, { value: 3 }],
  },
  {
    name: 'Root render function with caller items',
    props: { value: 1.5, count: 42, size: 'large' },
    items: [{ value: 1 }, { value: 2 }, { value: 3 }],
    renderRoot: true,
  },
];

export const ratingDisplayConsumerExample: RatingDisplayExample = {
  name: 'Consumer CSS Modules',
  props: {
    size: 'large',
    value: 2.5,
    count: 1160,
    className: styles.consumerRoot,
    valueText: { className: styles.consumerValue },
    countText: { className: styles.consumerCount },
  },
};

function RatingDisplayFixture({
  implementation,
  props = {},
  items,
  renderRoot = false,
}: RatingDisplayExample & { implementation: 'legacy' | 'headless' }): React.ReactElement {
  const Root = implementation === 'legacy' ? LegacyRatingDisplay : HeadlessRatingDisplay;
  const Item = implementation === 'legacy' ? LegacyRatingItem : HeadlessRatingItem;
  const content = items?.map((item, index) => <Item key={index} {...item} aria-hidden="true" />);
  const renderDisplay: SlotRenderFunction<ExtractSlotProps<RatingDisplaySlots['root']>> = (
    Component,
    slotProps,
  ) => {
    const children = slotProps.children;
    if (
      !React.isValidElement<{ children?: React.ReactNode }>(children) ||
      children.type !== React.Fragment ||
      !Array.isArray(children.props.children)
    ) {
      throw new Error('Expected the current RatingDisplay static-slot children Fragment');
    }
    // Supply caller items, keeping the renderer's value/count slots after its default item block.
    // The public static-slot runtime wraps that block in a Fragment. Legacy drops default items here.
    return (
      <Component {...slotProps} data-rendered-rating-display="">
        {content}
        {children.props.children.slice(1)}
      </Component>
    );
  };
  // Keep absent children omitted: legacy RatingDisplay spreads the native root after its defaults.
  const fixtureChildren = renderRoot
    ? { children: renderDisplay }
    : content !== undefined
      ? { children: content }
      : {};
  return (
    <div className={styles.cell} data-ratingdisplay-implementation={implementation}>
      <Root {...props} {...fixtureChildren} />
    </div>
  );
}

export function RatingDisplayComparison({
  examples = ratingDisplayExamples,
}: {
  examples?: readonly RatingDisplayExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-ratingdisplay-case={example.name}>
          <span>{example.name}</span>
          <RatingDisplayFixture {...example} implementation="legacy" />
          <RatingDisplayFixture {...example} implementation="headless" />
        </div>
      ))}
    </div>
  );
}

export function RatingSummaryFlow(props: RatingDisplayProps): React.ReactElement {
  const [recent, setRecent] = React.useState(false);
  return (
    <section className={styles.playground} aria-label="Project template review summary">
      <h3>Project template reviews</h3>
      <p>The summary is read-only. Switch the review sample to update its average and count.</p>
      <HeadlessRatingDisplay {...props} value={recent ? 4.2 : 3.7} count={recent ? 204 : 1160} />
      <output aria-label="Review sample">{recent ? 'Recent reviews' : 'All reviews'}</output>
      <div className={styles.actions}>
        <button type="button" onClick={() => setRecent(true)} disabled={recent}>
          Show recent reviews
        </button>
        <button type="button" onClick={() => setRecent(false)} disabled={!recent}>
          Show all reviews
        </button>
      </div>
    </section>
  );
}
