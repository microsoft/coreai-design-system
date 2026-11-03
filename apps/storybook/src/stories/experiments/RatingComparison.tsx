// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Rating as LegacyRating,
  RatingItem as LegacyRatingItem,
} from '@coreai-ds/react-components';
import {
  Rating as HeadlessRating,
  RatingItem as HeadlessRatingItem,
  type RatingProps,
  type RatingSlots,
  type RatingItemProps,
  type RatingItemSlots,
} from '@coreai-ds/react-headless-components';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import { CircleFilled, CircleRegular } from '@fluentui/react-icons/headless/svg/circle';
import { SquareFilled, SquareRegular } from '@fluentui/react-icons/headless/svg/square';
import styles from './RatingComparison.module.css';

export const ratingSizes = ['small', 'medium', 'large', 'extra-large'] as const;
export const ratingColors = ['neutral', 'brand', 'marigold'] as const;

export interface RatingExample {
  name: string;
  props?: RatingProps;
  items?: readonly RatingItemProps[];
  renderRoot?: boolean;
}

const renderItem: SlotRenderFunction<ExtractSlotProps<RatingItemSlots['root']>> = (
  Component,
  props,
) => <Component {...props} data-rendered-rating-item="" />;

export const ratingExamples: RatingExample[] = [
  { name: 'Default: empty' },
  { name: 'Full value', props: { defaultValue: 5 } },
  { name: 'Half precision', props: { step: 0.5, defaultValue: 2.5 } },
  ...ratingSizes.map<RatingExample>((size) => ({
    name: `Size: ${size}`,
    props: { size, defaultValue: 2.5, step: 0.5 },
  })),
  ...ratingColors.map<RatingExample>((color) => ({
    name: `Color: ${color}`,
    props: { color, defaultValue: 2.5, step: 0.5 },
  })),
  {
    name: 'Circle icons',
    props: { iconFilled: CircleFilled, iconOutline: CircleRegular, defaultValue: 2.5, step: 0.5 },
  },
  {
    name: 'Square icons',
    props: { iconFilled: SquareFilled, iconOutline: SquareRegular, defaultValue: 2.5, step: 0.5 },
  },
  { name: 'Three items', props: { max: 3, defaultValue: 1 } },
  { name: 'Ten items', props: { max: 10, defaultValue: 7 } },
  {
    name: 'Explicitly undefined visual props',
    props: {
      color: undefined,
      size: undefined,
      iconFilled: undefined,
      iconOutline: undefined,
      defaultValue: 3,
    },
  },
  {
    name: 'Custom item slots and native disabled input',
    props: { defaultValue: 1, step: 0.5 },
    items: [
      { value: 1 },
      { value: 2, fullValueInput: { disabled: true }, halfValueInput: { disabled: true } },
      { value: 3, fullValueInput: { 'aria-label': 'Three points' } },
    ],
  },
  {
    name: 'Root and item render functions',
    props: { defaultValue: 1.5, step: 0.5, className: 'consumer-rating-root' },
    items: [
      { value: 1, children: renderItem },
      { value: 2, children: renderItem },
      { value: 3, children: renderItem },
    ],
    renderRoot: true,
  },
];

export const ratingConsumerExample: RatingExample = {
  name: 'Consumer CSS Modules',
  props: { defaultValue: 1.5, step: 0.5, color: 'brand', className: styles.consumerRoot },
  items: [1, 2, 3].map((value) => ({
    value,
    className: styles.consumerItem,
    selectedIcon: { className: styles.consumerSelected },
    unselectedIcon: { className: styles.consumerUnselected },
    halfValueInput: { className: styles.consumerInput },
    fullValueInput: { className: styles.consumerInput },
  })),
};

function RatingFixture({
  implementation,
  name,
  props = {},
  items,
  renderRoot = false,
}: RatingExample & { implementation: 'legacy' | 'headless' }): React.ReactElement {
  const Root = implementation === 'legacy' ? LegacyRating : HeadlessRating;
  const Item = implementation === 'legacy' ? LegacyRatingItem : HeadlessRatingItem;
  const content = items?.map((item, index) => <Item key={index} {...item} />);
  const renderRating: SlotRenderFunction<ExtractSlotProps<RatingSlots['root']>> = (
    Component,
    slotProps,
  ) => (
    <Component {...slotProps} data-rendered-rating="">
      {content}
    </Component>
  );
  return (
    <div className={styles.cell} data-rating-implementation={implementation}>
      <Root
        {...props}
        name={props.name ? `${implementation}-${props.name}` : undefined}
        aria-label={props['aria-label'] ?? name}
      >
        {renderRoot ? renderRating : (content ?? props.children)}
      </Root>
    </div>
  );
}

export function RatingComparison({
  examples = ratingExamples,
}: {
  examples?: readonly RatingExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-rating-case={example.name}>
          <span>{example.name}</span>
          <RatingFixture {...example} implementation="legacy" />
          <RatingFixture {...example} implementation="headless" />
        </div>
      ))}
    </div>
  );
}

export function RatingInputFlow(props: RatingProps): React.ReactElement {
  const [value, setValue] = React.useState(2.5);
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  return (
    <form
      className={styles.playground}
      aria-label="Template feedback"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get('template-rating')));
      }}
    >
      <p>Rate this project template, then send your feedback. Half-point ratings are supported.</p>
      <HeadlessRating
        {...props}
        aria-label="Rate this template"
        itemLabel={(rating) => `${rating} out of 5`}
        name="template-rating"
        step={0.5}
        value={value}
        onChange={(event, data) => {
          setValue(data.value);
          props.onChange?.(event, data);
        }}
      />
      <output aria-label="Your rating">Your rating: {value} / 5</output>
      <div className={styles.actions}>
        <button type="submit">Send rating</button>
        <button type="button" onClick={() => setValue(0)}>
          Clear rating
        </button>
      </div>
      <output aria-label="Submitted rating">
        {submitted === null ? 'Not submitted.' : `Submitted rating: ${submitted}`}
      </output>
    </form>
  );
}
