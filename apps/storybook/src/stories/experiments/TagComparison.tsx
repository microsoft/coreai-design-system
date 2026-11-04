// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Avatar as LegacyAvatar, Tag as LegacyTag } from '@coreai-ds/react-components';
import { Avatar, Tag, type TagProps, type TagSlots } from '@coreai-ds/react-headless-components';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import { CalendarMonthRegular } from '@fluentui/react-icons/headless/svg/calendar-month';
import { DismissRegular } from '@fluentui/react-icons/headless/svg/dismiss';
import styles from './TagComparison.module.css';

export type TagImplementation = 'legacy' | 'headless';
export const tagSizes = ['medium', 'small', 'extra-small'] as const;
export const tagAppearances = ['filled', 'outline', 'brand'] as const;
export const tagShapes = ['rounded', 'circular'] as const;

export interface TagExample {
  name: string;
  props?: Pick<
    TagProps,
    'appearance' | 'size' | 'shape' | 'disabled' | 'selected' | 'dismissible' | 'role'
  >;
  icon?: boolean;
  media?: boolean;
  secondary?: boolean;
  customDismiss?: boolean;
  renderedSlots?: boolean;
  consumer?: boolean;
  text?: string;
}

export const tagExamples: readonly TagExample[] = [
  { name: 'Default static tag' },
  {
    name: 'Explicit undefined visual props',
    props: { appearance: undefined, shape: undefined, size: undefined },
  },
  ...tagAppearances.map((appearance) => ({
    name: `Appearance: ${appearance}`,
    props: { appearance, dismissible: true },
    icon: true,
  })),
  ...tagSizes.map((size) => ({
    name: `Size: ${size}`,
    props: { size, dismissible: true },
    icon: true,
  })),
  ...tagShapes.map((shape) => ({ name: `Shape: ${shape}`, props: { shape, dismissible: true } })),
  ...tagAppearances.map((appearance) => ({
    name: `Disabled: ${appearance}`,
    props: { appearance, disabled: true, dismissible: true },
    secondary: true,
    icon: true,
  })),
  ...tagAppearances.map((appearance) => ({
    name: `Selected: ${appearance}`,
    props: { appearance, selected: true, dismissible: true },
    icon: true,
  })),
  {
    name: 'Disabled selected priority',
    props: { selected: true, disabled: true, dismissible: true },
    icon: true,
  },
  ...tagSizes.map((size) => ({
    name: `Secondary text: ${size}`,
    props: { size },
    secondary: true,
  })),
  ...tagSizes.map((size) => ({
    name: `Avatar media: ${size}`,
    props: { size, shape: 'circular' as const, dismissible: true },
    media: true,
  })),
  { name: 'Rounded avatar media', media: true },
  { name: 'Caller dismiss glyph', props: { dismissible: true }, customDismiss: true },
  {
    name: 'Public slot render functions',
    props: { dismissible: true },
    icon: true,
    renderedSlots: true,
  },
  { name: 'Long unwrapped label', text: 'Quarterly risk and compliance review' },
];

export const tagConsumerExample: TagExample = {
  name: 'Consumer CSS priority',
  props: { dismissible: true },
  icon: true,
  consumer: true,
};

export const tagMediaSource = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#d9e8f7"/><circle cx="16" cy="12" r="6" fill="#365b9d"/><path d="M5 32v-4a11 11 0 0 1 22 0v4" fill="#365b9d"/></svg>',
)}`;

export const tagTextRenderer: SlotRenderFunction<ExtractSlotProps<TagSlots['primaryText']>> = (
  Component,
  props,
) => <Component {...props} data-tag-rendered-text />;

export const tagIconRenderer: SlotRenderFunction<ExtractSlotProps<TagSlots['icon']>> = (
  Component,
  props,
) => (
  <Component {...props} data-tag-rendered-icon>
    {props.children ?? <CalendarMonthRegular aria-hidden className={styles.fixtureGlyph} />}
  </Component>
);

export const tagDismissRenderer: SlotRenderFunction<ExtractSlotProps<TagSlots['dismissIcon']>> = (
  Component,
  props,
) => <Component {...props} data-tag-rendered-dismiss />;

export function TagVisualFixture({
  implementation,
  example,
  part = 'root',
}: {
  implementation: TagImplementation;
  example: TagExample;
  part?: 'root' | 'item';
}) {
  const Control = implementation === 'legacy' ? LegacyTag : Tag;
  const Coin = implementation === 'legacy' ? LegacyAvatar : Avatar;
  return (
    <Control
      {...example.props}
      data-tag-surface={part === 'root' ? '' : undefined}
      data-tag-part={part}
      className={example.consumer ? styles.consumerRoot : undefined}
      primaryText={{
        ...{ 'data-tag-part': 'primaryText' },
        className: example.consumer ? styles.consumerText : undefined,
        ...(example.renderedSlots && { children: tagTextRenderer }),
      }}
      secondaryText={
        example.secondary
          ? { ...{ 'data-tag-part': 'secondaryText' }, children: 'Project owner' }
          : undefined
      }
      icon={
        example.icon
          ? {
              ...{ 'data-tag-part': 'icon' },
              className: example.consumer ? styles.consumerIcon : undefined,
              children: example.renderedSlots ? (
                tagIconRenderer
              ) : (
                <CalendarMonthRegular aria-hidden className={styles.fixtureGlyph} />
              ),
            }
          : undefined
      }
      media={
        example.media
          ? {
              ...{ 'data-tag-part': 'media' },
              children: (
                <Coin
                  name="Katri Athokas"
                  image={{ src: tagMediaSource }}
                  badge={{ status: 'busy' }}
                />
              ),
            }
          : undefined
      }
      dismissIcon={
        example.props?.dismissible
          ? {
              ...{ 'data-tag-part': 'dismissIcon' },
              'aria-label': 'remove',
              ...(example.customDismiss && {
                children: (
                  <DismissRegular
                    aria-hidden
                    className={styles.customGlyph}
                    data-tag-custom-glyph
                  />
                ),
              }),
              ...(example.renderedSlots && { children: tagDismissRenderer }),
            }
          : undefined
      }
    >
      {example.text ?? 'Project Atlas'}
    </Control>
  );
}

export function TagComparison({ example }: { example: TagExample }) {
  return (
    <div className={styles.pair} data-tag-comparison={example.name}>
      {(['legacy', 'headless'] as const).map((implementation) => (
        <section key={implementation} data-tag-implementation={implementation}>
          <h3>{implementation === 'legacy' ? 'Legacy CoreAI' : 'Headless + CSS Modules'}</h3>
          <TagVisualFixture implementation={implementation} example={example} />
        </section>
      ))}
    </div>
  );
}
