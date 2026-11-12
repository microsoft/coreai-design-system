// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { TagGroup as LegacyTagGroup } from '@coreai-ds/react-components';
import { TagGroup, type TagGroupProps } from '@coreai-ds/react-headless-components';
import {
  TagVisualFixture,
  tagAppearances,
  tagSizes,
  type TagImplementation,
} from './TagComparison.js';
import { InteractionTagVisualFixture } from './InteractionTagComparison.js';
import styles from './TagComparison.module.css';

export interface TagGroupExample {
  name: string;
  props?: Pick<TagGroupProps, 'size' | 'appearance' | 'disabled' | 'dismissible'>;
  interaction?: boolean;
  wrap?: boolean;
  consumer?: boolean;
}

export const tagGroupExamples: readonly TagGroupExample[] = [
  { name: 'Static list' },
  { name: 'Dismissible group', props: { dismissible: true } },
  ...tagSizes.map((size) => ({
    name: `Tag size inheritance: ${size}`,
    props: { size, dismissible: true },
  })),
  ...tagSizes.map((size) => ({
    name: `Interaction size inheritance: ${size}`,
    props: { size },
    interaction: true,
  })),
  ...tagAppearances.map((appearance) => ({
    name: `Appearance inheritance: ${appearance}`,
    props: { appearance },
    interaction: true,
  })),
  { name: 'Disabled tag group', props: { disabled: true, dismissible: true } },
  { name: 'Disabled interaction group', props: { disabled: true }, interaction: true },
  { name: 'Wrapping tags', props: { dismissible: true }, wrap: true },
  { name: 'Wrapping interaction tags', interaction: true, wrap: true },
  { name: 'Explicit undefined group visuals', props: { size: undefined, appearance: undefined } },
];

export const tagGroupConsumerExample: TagGroupExample = {
  name: 'Consumer CSS priority',
  props: { dismissible: true },
  consumer: true,
};

function GroupFixture({
  implementation,
  example,
}: {
  implementation: TagImplementation;
  example: TagGroupExample;
}) {
  const Group = implementation === 'legacy' ? LegacyTagGroup : TagGroup;
  const staticRole = !example.props?.dismissible ? 'listitem' : undefined;
  return (
    <Group
      {...example.props}
      data-tag-surface
      data-tag-group
      aria-label="Project labels"
      role={!example.interaction && !example.props?.dismissible ? 'list' : 'toolbar'}
      className={[example.wrap && styles.wrappingGroup, example.consumer && styles.consumerGroup]
        .filter(Boolean)
        .join(' ')}
    >
      {example.interaction ? (
        <>
          <InteractionTagVisualFixture
            implementation={implementation}
            part="item"
            example={{ name: 'Inherited media', media: true, secondary: true }}
          />
          <InteractionTagVisualFixture
            implementation={implementation}
            part="item"
            example={{ name: 'Inherited icon', icon: true, secondary: true }}
          />
          <InteractionTagVisualFixture
            implementation={implementation}
            part="item"
            example={{
              name: 'Explicit overrides',
              props: { appearance: 'outline', size: 'extra-small', disabled: false },
              secondary: true,
            }}
          />
        </>
      ) : (
        <>
          <TagVisualFixture
            implementation={implementation}
            part="item"
            example={{
              name: 'Inherited media',
              media: true,
              props: { dismissible: example.props?.dismissible, role: staticRole },
            }}
          />
          <TagVisualFixture
            implementation={implementation}
            part="item"
            example={{
              name: 'Inherited icon',
              icon: true,
              props: { dismissible: example.props?.dismissible, role: staticRole },
            }}
          />
          <TagVisualFixture
            implementation={implementation}
            part="item"
            example={{
              name: 'Explicit overrides',
              props: {
                appearance: 'outline',
                size: 'extra-small',
                disabled: false,
                dismissible: false,
                role: staticRole,
              },
            }}
          />
        </>
      )}
    </Group>
  );
}

export function TagGroupComparison({ example }: { example: TagGroupExample }) {
  return (
    <div className={styles.pair} data-tag-comparison={example.name}>
      {(['legacy', 'headless'] as const).map((implementation) => (
        <section key={implementation} data-tag-implementation={implementation}>
          <h3>{implementation === 'legacy' ? 'Legacy CoreAI' : 'Headless + CSS Modules'}</h3>
          <GroupFixture implementation={implementation} example={example} />
        </section>
      ))}
    </div>
  );
}
