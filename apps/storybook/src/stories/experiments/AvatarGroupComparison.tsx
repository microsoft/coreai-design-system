// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  AvatarGroup as LegacyAvatarGroup,
  AvatarGroupItem as LegacyAvatarGroupItem,
  AvatarGroupPopover as LegacyAvatarGroupPopover,
} from '@coreai-ds/react-components';
import {
  AvatarGroup,
  AvatarGroupItem,
  AvatarGroupPopover,
  partitionAvatarGroupItems,
  usePopoverContext,
  type AvatarGroupItemColor,
  type AvatarGroupItemSlots,
  type AvatarGroupPopoverProps,
  type AvatarGroupProps,
  type AvatarShape,
  type AvatarSize,
  type PresenceBadgeProps,
} from '@coreai-ds/react-headless-components';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import type { PositioningImperativeRef } from '@fluentui/react-headless-components-preview/positioning';
import styles from './AvatarGroupComparison.module.css';

type OverflowItemRootProps = Extract<ExtractSlotProps<AvatarGroupItemSlots['root']>, { as: 'li' }>;

export const avatarGroupNames = [
  'Ada Lovelace',
  'Grace Hopper',
  'Katherine Johnson',
  'Margaret Hamilton',
  'Mary Jackson',
  'Dorothy Vaughan',
  'Annie Easley',
];

export const avatarGroupImage = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#dbeaf3"/><circle cx="32" cy="24" r="13" fill="#39729a"/><path d="M7 64a25 24 0 0 1 50 0" fill="#39729a"/></svg>',
)}`;

export interface AvatarGroupPerson {
  name?: string;
  color?: AvatarGroupItemColor;
  idForColor?: string;
  initials?: string;
  image?: { src: string };
  badge?: Pick<PresenceBadgeProps, 'status' | 'outOfOffice'>;
}

export interface AvatarGroupExample {
  name: string;
  props?: Pick<AvatarGroupProps, 'layout' | 'size'>;
  people?: readonly AvatarGroupPerson[];
  maxInlineItems?: number;
  item?: {
    color?: AvatarGroupItemColor;
    active?: 'active' | 'inactive' | 'unset';
    activeAppearance?: 'ring' | 'shadow' | 'ring-shadow';
  };
  avatar?: { size?: AvatarSize; shape?: AvatarShape; color?: AvatarGroupItemColor };
  popover?: Pick<AvatarGroupPopoverProps, 'indicator' | 'count' | 'appearance' | 'size'>;
  open?: boolean;
  fragment?: boolean;
  consumer?: boolean;
  currentSmallInitials?: boolean;
}

export const avatarGroupExamples: readonly AvatarGroupExample[] = [
  { name: 'Default spread and colorful identities' },
  { name: 'Explicitly undefined visual defaults', props: { layout: undefined, size: undefined } },
  {
    name: 'Small automatic icon indicator',
    props: { size: 20 },
    people: avatarGroupNames.map((name) => ({ name, initials: 'A' })),
  },
  { name: 'Compact count typography', props: { size: 24 }, popover: { indicator: 'count' } },
  { name: 'Caption count typography', props: { size: 28 } },
  {
    name: 'Square named-color avatar slot',
    props: { size: 40 },
    avatar: { shape: 'square', color: 'brand' },
  },
  {
    name: 'Stack with current presence composition',
    props: { layout: 'stack', size: 32 },
    people: avatarGroupNames.map((name) => ({ name, badge: { status: 'busy' } })),
  },
  { name: 'Stack thicker outlines', props: { layout: 'stack', size: 56 }, maxInlineItems: 3 },
  { name: 'Stack largest spacing', props: { layout: 'stack', size: 96 }, maxInlineItems: 3 },
  {
    name: 'Large subtitle count',
    props: { size: 64 },
    maxInlineItems: 3,
    item: { color: 'neutral' },
  },
  {
    name: 'Large icon indicator',
    props: { size: 120 },
    maxInlineItems: 2,
    popover: { indicator: 'icon' },
  },
  {
    name: 'Single pie with photo',
    props: { layout: 'pie', size: 48 },
    people: [{ name: 'Ada Lovelace', image: { src: avatarGroupImage } }],
  },
  {
    name: 'Two pie slices',
    props: { layout: 'pie', size: 56 },
    people: avatarGroupNames.slice(0, 2).map((name) => ({ name })),
  },
  { name: 'Three pie slices and complete overflow', props: { layout: 'pie', size: 72 } },
  {
    name: 'Current two-letter 16px initials',
    props: { size: 16 },
    people: [{ name: 'Ada Lovelace' }],
    currentSmallInitials: true,
  },
  {
    name: 'Guest icon and alternate colorful identity',
    people: [{ idForColor: 'guest-17' }, { name: 'Grace Hopper' }],
  },
  {
    name: 'Open overflow rows always use size 24',
    props: { layout: 'stack', size: 56 },
    open: true,
    maxInlineItems: 3,
  },
  {
    name: 'Neutral overflow reuses actual Fluent Avatar background',
    item: { color: 'neutral' },
    open: true,
  },
  {
    name: 'Fragment children require an explicit count',
    open: true,
    fragment: true,
    popover: { count: 100 },
  },
  {
    name: 'Inverted overflow and large visual surface',
    open: true,
    popover: { appearance: 'inverted', size: 'large' },
  },
];

export const avatarGroupConsumerExample: AvatarGroupExample = {
  name: 'Consumer CSS priority',
  consumer: true,
  open: true,
};

export function getAvatarGroupPartition(example: AvatarGroupExample) {
  return partitionAvatarGroupItems({
    items: example.people ?? avatarGroupNames.map((name) => ({ name })),
    layout: example.props?.layout,
    maxInlineItems: example.maxInlineItems ?? 4,
  });
}

function ExampleCell({
  implementation,
  example,
  fixtureId,
  positioningRef,
}: {
  implementation: 'legacy' | 'headless';
  example: AvatarGroupExample;
  fixtureId: string;
  positioningRef?: React.Ref<PositioningImperativeRef>;
}) {
  const Group = implementation === 'legacy' ? LegacyAvatarGroup : AvatarGroup;
  const Item = implementation === 'legacy' ? LegacyAvatarGroupItem : AvatarGroupItem;
  const { inlineItems, overflowItems } = getAvatarGroupPartition(example);
  const renderItem = (person: AvatarGroupPerson, index: number) => (
    <Item
      {...example.item}
      {...person}
      key={person.name ?? index}
      avatar={{
        ...example.avatar,
        className: example.consumer ? styles.consumerAvatar : undefined,
      }}
      overflowLabel={{ className: example.consumer ? styles.consumerLabel : undefined }}
    />
  );
  const rows = overflowItems?.map(renderItem);
  const content = example.fragment ? <>{rows}</> : rows;
  const surfaceIdentity = {
    'aria-label': `${example.name} ${implementation} overflow`,
    'data-avatar-group-surface-implementation': implementation,
    'data-avatar-group-fixture': fixtureId,
  };
  const triggerIdentity = {
    'data-avatar-group-trigger': implementation,
    className: example.consumer ? styles.consumerTrigger : undefined,
  };
  const positioning = { position: 'below' as const, align: 'start' as const, positioningRef };
  const tooltip = {
    content: 'View project reviewers.',
    relationship: 'label' as const,
    visible: false,
  };
  return (
    <div
      className={styles.cell}
      data-avatar-group-implementation={implementation}
      data-avatar-group-fixture={fixtureId}
    >
      <strong>
        {implementation === 'legacy' ? 'Current CoreAI / Griffel' : 'Headless / CSS Modules'}
      </strong>
      <div className={styles.stage}>
        <Group {...example.props} aria-label={`${implementation} reviewers`}>
          {inlineItems.map(renderItem)}
          {overflowItems &&
            (implementation === 'legacy' ? (
              <LegacyAvatarGroupPopover
                {...example.popover}
                open={example.open ?? false}
                trapFocus={false}
                unstable_disableAutoFocus
                surfaceMotion={null}
                positioning={positioning}
                popoverSurface={surfaceIdentity}
                triggerButton={triggerIdentity}
                tooltip={tooltip}
              >
                {content}
              </LegacyAvatarGroupPopover>
            ) : (
              <AvatarGroupPopover
                {...example.popover}
                open={example.open ?? false}
                positioning={positioning}
                popoverSurface={surfaceIdentity}
                triggerButton={triggerIdentity}
                tooltip={tooltip}
              >
                {content}
              </AvatarGroupPopover>
            ))}
        </Group>
      </div>
    </div>
  );
}

export function AvatarGroupComparison({
  example = avatarGroupExamples[0],
  legacyPositioningRef,
  headlessPositioningRef,
}: {
  example?: AvatarGroupExample;
  legacyPositioningRef?: React.Ref<PositioningImperativeRef>;
  headlessPositioningRef?: React.Ref<PositioningImperativeRef>;
}) {
  const fixtureId = React.useId();
  return (
    <section
      className={styles.comparison}
      data-avatar-group-comparison={fixtureId}
      data-avatar-group-example={example.name}
    >
      <ExampleCell
        implementation="legacy"
        example={example}
        fixtureId={fixtureId}
        positioningRef={legacyPositioningRef}
      />
      <ExampleCell
        implementation="headless"
        example={example}
        fixtureId={fixtureId}
        positioningRef={headlessPositioningRef}
      />
    </section>
  );
}

function CloseReviewers() {
  const setOpen = usePopoverContext((context) => context.setOpen);
  return (
    <li>
      <button type="button" onClick={(event) => setOpen(event, false)}>
        Close reviewer list
      </button>
    </li>
  );
}

export function AvatarGroupPeopleFlow({ modal = false }: { modal?: boolean }) {
  const [people, setPeople] = React.useState(avatarGroupNames.slice(0, 5));
  const [open, setOpen] = React.useState(false);
  const [layout, setLayout] = React.useState<NonNullable<AvatarGroupProps['layout']>>('spread');
  const [profile, setProfile] = React.useState('No profile selected');
  const [events, setEvents] = React.useState<string[]>([]);
  const { inlineItems, overflowItems } = partitionAvatarGroupItems({
    items: people,
    layout,
    maxInlineItems: 3,
  });
  return (
    <div className={styles.flow}>
      <button type="button" data-testid="avatar-group-flow-pointer-rest">
        Before reviewers
      </button>
      <label>
        Reviewer layout
        <select
          value={layout}
          onChange={(event) => {
            const value = event.currentTarget.value;
            if (value === 'spread' || value === 'stack' || value === 'pie') setLayout(value);
          }}
        >
          <option value="spread">Spread</option>
          <option value="stack">Stack</option>
          <option value="pie">Pie</option>
        </select>
      </label>
      <AvatarGroup layout={layout} size={48} aria-label="Project reviewers">
        {inlineItems.map((name) => (
          <AvatarGroupItem key={name} name={name} />
        ))}
        {overflowItems && (
          <AvatarGroupPopover
            open={open}
            count={overflowItems.length}
            trapFocus={modal}
            onOpenChange={(event, data) => {
              setEvents((previous) => [
                ...previous,
                `${data.type}:${data.open ? 'open' : 'closed'}:${event === data.event ? 'same-event' : 'different-event'}`,
              ]);
              setOpen(data.open);
            }}
            tooltip={{
              content: 'Show additional reviewers',
              relationship: 'label',
              showDelay: 0,
            }}
            triggerButton={{ 'aria-label': 'Show additional reviewers' }}
            popoverSurface={{ 'aria-label': 'Additional project reviewers' }}
          >
            {overflowItems.map((name, index) => {
              const renderRoot: SlotRenderFunction<OverflowItemRootProps> = (Component, props) => (
                <Component {...props} as="li">
                  {props.children}
                  <button type="button" autoFocus={index === 0} onClick={() => setProfile(name)}>
                    Open {name} profile
                  </button>
                </Component>
              );
              return (
                <AvatarGroupItem key={name} name={name} root={{ as: 'li', children: renderRoot }} />
              );
            })}
            <CloseReviewers />
          </AvatarGroupPopover>
        )}
      </AvatarGroup>
      <button
        type="button"
        disabled={people.length === avatarGroupNames.length}
        onClick={() => setPeople(avatarGroupNames.slice(0, people.length + 1))}
      >
        Add reviewer
      </button>
      <output aria-label="Reviewer count">{people.length} reviewers</output>
      <output aria-label="Selected reviewer profile">{profile}</output>
      <output aria-label="Reviewer popup events">{events.join(', ')}</output>
    </div>
  );
}
