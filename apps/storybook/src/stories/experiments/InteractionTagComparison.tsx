// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Avatar as LegacyAvatar,
  InteractionTag as LegacyInteractionTag,
  InteractionTagPrimary as LegacyInteractionTagPrimary,
  InteractionTagSecondary as LegacyInteractionTagSecondary,
} from '@coreai-ds/react-components';
import {
  Avatar,
  InteractionTag,
  InteractionTagPrimary,
  InteractionTagSecondary,
  type InteractionTagProps,
} from '@coreai-ds/react-headless-components';
import { CalendarMonthRegular } from '@fluentui/react-icons/headless/svg/calendar-month';
import { DismissRegular } from '@fluentui/react-icons/headless/svg/dismiss';
import {
  CalendarMonthFilled,
  CalendarMonthRegular as StyledCalendarMonthRegular,
  bundleIcon,
} from '@fluentui/react-icons';
import {
  tagAppearances,
  tagIconRenderer,
  tagMediaSource,
  tagShapes,
  tagSizes,
  tagTextRenderer,
  type TagImplementation,
} from './TagComparison.js';
import styles from './TagComparison.module.css';

const CalendarBundle = bundleIcon(CalendarMonthFilled, StyledCalendarMonthRegular);

export interface InteractionTagExample {
  name: string;
  props?: Pick<InteractionTagProps, 'appearance' | 'size' | 'shape' | 'disabled' | 'selected'>;
  secondary?: boolean;
  secondaryText?: boolean;
  icon?: boolean;
  bundledIcon?: boolean;
  media?: boolean;
  customDismiss?: boolean;
  renderedSlots?: boolean;
  consumer?: boolean;
}

export const interactionTagExamples: readonly InteractionTagExample[] = [
  { name: 'Primary action only' },
  {
    name: 'Explicit undefined visual props',
    props: { appearance: undefined, shape: undefined, size: undefined },
    secondary: true,
  },
  ...tagAppearances.map((appearance) => ({
    name: `Appearance: ${appearance}`,
    props: { appearance },
    secondary: true,
    icon: true,
  })),
  ...tagSizes.map((size) => ({
    name: `Size: ${size}`,
    props: { size },
    secondary: true,
    icon: true,
  })),
  ...tagShapes.map((shape) => ({ name: `Shape: ${shape}`, props: { shape }, secondary: true })),
  ...tagAppearances.map((appearance) => ({
    name: `Disabled: ${appearance}`,
    props: { appearance, disabled: true },
    secondary: true,
    secondaryText: true,
    icon: true,
  })),
  ...tagAppearances.map((appearance) => ({
    name: `Selected: ${appearance}`,
    props: { appearance, selected: true },
    secondary: true,
    icon: true,
  })),
  {
    name: 'Disabled selected priority',
    props: { disabled: true, selected: true },
    secondary: true,
  },
  ...tagSizes.map((size) => ({
    name: `Secondary text: ${size}`,
    props: { size },
    secondaryText: true,
  })),
  ...tagSizes.map((size) => ({
    name: `Avatar media: ${size}`,
    props: { size, shape: 'circular' as const },
    media: true,
    secondary: true,
  })),
  { name: 'Circular primary only', props: { shape: 'circular' }, media: true },
  {
    name: 'Outline bundled glyph',
    props: { appearance: 'outline' },
    bundledIcon: true,
    secondary: true,
  },
  { name: 'Public slot render functions', icon: true, renderedSlots: true, secondary: true },
  { name: 'Caller secondary glyph', secondary: true, customDismiss: true },
];

export const interactionTagConsumerExample: InteractionTagExample = {
  name: 'Consumer CSS priority',
  icon: true,
  secondary: true,
  consumer: true,
};

export function InteractionTagVisualFixture({
  implementation,
  example,
  part = 'root',
}: {
  implementation: TagImplementation;
  example: InteractionTagExample;
  part?: 'root' | 'item';
}) {
  const Root = implementation === 'legacy' ? LegacyInteractionTag : InteractionTag;
  const Primary = implementation === 'legacy' ? LegacyInteractionTagPrimary : InteractionTagPrimary;
  const Secondary =
    implementation === 'legacy' ? LegacyInteractionTagSecondary : InteractionTagSecondary;
  const Coin = implementation === 'legacy' ? LegacyAvatar : Avatar;
  return (
    <Root
      {...example.props}
      data-tag-surface={part === 'root' ? '' : undefined}
      data-tag-part={part}
    >
      <Primary
        type="button"
        data-tag-part="primary"
        className={example.consumer ? styles.consumerRoot : undefined}
        hasSecondaryAction={example.secondary}
        primaryText={{
          ...{ 'data-tag-part': 'primaryText' },
          className: example.consumer ? styles.consumerText : undefined,
          ...(example.renderedSlots && { children: tagTextRenderer }),
        }}
        secondaryText={
          example.secondaryText
            ? { ...{ 'data-tag-part': 'secondaryText' }, children: 'Project owner' }
            : undefined
        }
        icon={
          example.icon || example.bundledIcon
            ? {
                ...{ 'data-tag-part': 'icon' },
                className: example.consumer ? styles.consumerIcon : undefined,
                children: example.renderedSlots ? (
                  tagIconRenderer
                ) : example.bundledIcon ? (
                  <CalendarBundle aria-hidden />
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
      >
        Project Atlas
      </Primary>
      {example.secondary && (
        <Secondary
          data-tag-part="secondary"
          className={example.consumer ? styles.consumerSecondary : undefined}
          aria-label="remove"
        >
          {example.customDismiss ? (
            <DismissRegular aria-hidden className={styles.customGlyph} data-tag-custom-glyph />
          ) : undefined}
        </Secondary>
      )}
    </Root>
  );
}

export function InteractionTagComparison({ example }: { example: InteractionTagExample }) {
  return (
    <div className={styles.pair} data-tag-comparison={example.name}>
      {(['legacy', 'headless'] as const).map((implementation) => (
        <section key={implementation} data-tag-implementation={implementation}>
          <h3>{implementation === 'legacy' ? 'Legacy CoreAI' : 'Headless + CSS Modules'}</h3>
          <InteractionTagVisualFixture implementation={implementation} example={example} />
        </section>
      ))}
    </div>
  );
}
