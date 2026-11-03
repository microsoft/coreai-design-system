// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import {
  AvatarGroup as RawAvatarGroup,
  AvatarGroupItem as RawAvatarGroupItem,
  AvatarGroupPopover as RawAvatarGroupPopover,
  type AvatarGroupItemProps as RawAvatarGroupItemProps,
  type AvatarGroupPopoverProps as RawAvatarGroupPopoverProps,
} from '@fluentui/react-headless-components-preview/avatar-group';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import type { PositioningImperativeRef } from '@fluentui/react-headless-components-preview/positioning';
import {
  AvatarGroup as LegacyAvatarGroup,
  AvatarGroupItem as LegacyAvatarGroupItem,
  AvatarGroupPopover as LegacyAvatarGroupPopover,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../react-components/src/test-utils.js';
import {
  AvatarGroupComparison,
  AvatarGroupPeopleFlow,
  avatarGroupConsumerExample,
  avatarGroupExamples,
  avatarGroupNames,
  getAvatarGroupPartition,
  type AvatarGroupExample,
} from '../../../apps/storybook/src/stories/experiments/AvatarGroupComparison.js';
import { AvatarGroupComparisonReport } from '../../../apps/storybook/src/stories/experiments/AvatarGroupComparisonReport.js';
import {
  captureAvatarGroupStyles,
  compareAvatarGroupStyles,
  getComparisonAvatarGroup,
  refreshAvatarGroupPositioning,
  settleAvatarGroupStyles,
} from '../../../apps/storybook/src/stories/experiments/compareAvatarGroupStyles.js';
import { Avatar } from './Avatar.js';
import {
  AvatarGroup,
  avatarGroupClassNames,
  partitionAvatarGroupItems,
  type AvatarGroupProps,
} from './AvatarGroup.js';
import {
  AvatarGroupItem,
  avatarGroupItemClassNames,
  type AvatarGroupItemAvatarProps,
  type AvatarGroupItemProps,
  type AvatarGroupItemSlots,
} from './AvatarGroupItem.js';
import {
  AvatarGroupPopover,
  avatarGroupPopoverClassNames,
  type AvatarGroupPopoverProps,
  type AvatarGroupPopoverSlots,
} from './AvatarGroupPopover.js';
import { PopoverSurface } from './PopoverSurface.js';

type DivItemRootProps = Extract<ExtractSlotProps<AvatarGroupItemSlots['root']>, { as?: 'div' }>;
type DialogSurfaceProps = Extract<
  ExtractSlotProps<AvatarGroupPopoverSlots['popoverSurface']>,
  { as?: 'dialog' }
>;
type DivSurfaceProps = Extract<
  ExtractSlotProps<AvatarGroupPopoverSlots['popoverSurface']>,
  { as: 'div' }
>;

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

function cssColor(value: string) {
  const element = document.createElement('span');
  element.style.color = value;
  document.body.append(element);
  const color = getComputedStyle(element).color;
  element.remove();
  return color;
}

test('reports exact geometry and unexpected consumer values instead of hiding them as known differences', () => {
  expect(
    compareAvatarGroupStyles(
      { 'root.width': '120.00', 'trigger.border-top-color': 'rgb(35, 95, 155)' },
      { 'root.width': '120.01', 'trigger.border-top-color': 'rgb(1, 2, 3)' },
      avatarGroupConsumerExample,
    ),
  ).toEqual([
    { property: 'root.width', legacy: '120.00', headless: '120.01', kind: 'unexpected' },
    {
      property: 'trigger.border-top-color',
      legacy: 'rgb(35, 95, 155)',
      headless: 'rgb(1, 2, 3)',
      kind: 'unexpected',
    },
  ]);
});

async function renderPair(
  example: AvatarGroupExample,
  theme = coreaiLightTheme,
  dir: 'ltr' | 'rtl' = 'ltr',
  withComponentDefaults = true,
) {
  const legacyPositioning = React.createRef<PositioningImperativeRef>();
  const headlessPositioning = React.createRef<PositioningImperativeRef>();
  const screen = await renderCoreAIComponent(
    <>
      <span data-testid="avatar-group-pointer-rest">Pointer rest</span>
      <AvatarGroupComparison
        example={example}
        legacyPositioningRef={legacyPositioning}
        headlessPositioningRef={headlessPositioning}
      />
    </>,
    { providerProps: { theme, dir, withComponentDefaults } },
  );
  await userEvent.hover(screen.getByTestId('avatar-group-pointer-rest'));
  const legacy = getComparisonAvatarGroup(screen.container, 'legacy');
  const headless = getComparisonAvatarGroup(screen.container, 'headless');
  await settleAvatarGroupStyles(legacy, headless);
  await refreshAvatarGroupPositioning(
    legacy,
    headless,
    legacyPositioning.current,
    headlessPositioning.current,
  );
  if (legacy.trigger) expect(legacy.trigger.matches(':hover')).toBe(false);
  if (headless.trigger) expect(headless.trigger.matches(':hover')).toBe(false);
  return { screen, legacy, headless };
}

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(avatarGroupExamples)(
    `matches $name selected family visuals in ${mode} mode, with current differences explicit`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      const differences = compareAvatarGroupStyles(
        captureAvatarGroupStyles(legacy),
        captureAvatarGroupStyles(headless),
        example,
      );
      expect(differences.filter((difference) => difference.kind === 'unexpected')).toEqual([]);
      expect(
        differences.filter((difference) => difference.kind === 'current-small-initials'),
      ).toHaveLength(example.currentSmallInitials ? 1 : 0);
      expect(headless.root).toHaveAttribute('role', 'group');
      expect(headless.root).toHaveClass(avatarGroupClassNames.root);
      expect(headless.root).not.toHaveAttribute('focusgroup');
      expect(headless.root.querySelector('[data-tabster], [focusgroup]')).toBeNull();
      expect(headless.items.length).toBe(getAvatarGroupPartition(example).inlineItems.length);
      if (example.open) {
        expect(headless.surface?.matches(':popover-open')).toBe(true);
        const rows = headless.surface?.querySelectorAll('li.fui-AvatarGroupItem');
        expect(rows?.length).toBe(getAvatarGroupPartition(example).overflowItems?.length);
        for (const row of rows ?? []) {
          expect(row.querySelector('.fui-Avatar')).toHaveAttribute('data-size', '24');
          expect(row.querySelector('.fui-AvatarGroupItem__overflowLabel')).toHaveAttribute(
            'aria-hidden',
            'true',
          );
        }
      }
    },
  );

  test(`ordinary consumer classes override the composed Avatar, trigger and label in ${mode} mode`, async () => {
    const { legacy, headless } = await renderPair(avatarGroupConsumerExample, theme);
    const values = captureAvatarGroupStyles(headless);
    const differences = compareAvatarGroupStyles(
      captureAvatarGroupStyles(legacy),
      values,
      avatarGroupConsumerExample,
    );
    expect(differences.filter((difference) => difference.kind === 'unexpected')).toEqual([]);
    expect(
      differences.filter((difference) => difference.kind === 'consumer-cascade').length,
    ).toBeGreaterThan(0);
    expect(values['trigger.border-radius']).toBe('3px');
    expect(values['trigger.border-top-color']).toBe('rgb(35, 95, 155)');
    expect(values['inline.0.avatar.border-radius']).toBe('3px');
    expect(values['inline.0.initials.background-color']).toBe('rgb(195, 220, 245)');
    expect(values['overflow.0.overflowLabel.color']).toBe('rgb(130, 45, 80)');
  });
}

test.each(
  avatarGroupExamples.filter((example) =>
    [
      'Stack thicker outlines',
      'Two pie slices',
      'Three pie slices and complete overflow',
      'Open overflow rows always use size 24',
    ].includes(example.name),
  ),
)('retains logical RTL spacing, labels and exact pie clipping for $name', async (example) => {
  const { legacy, headless } = await renderPair(example, coreaiLightTheme, 'rtl');
  expect(
    compareAvatarGroupStyles(
      captureAvatarGroupStyles(legacy),
      captureAvatarGroupStyles(headless),
      example,
    ),
  ).toEqual([]);
  expect(getComputedStyle(headless.root).direction).toBe('rtl');
});

test('reports only the measured RTL size-16 initials boundary without accepting the wrong current direction', async () => {
  const example = avatarGroupExamples.find((candidate) => candidate.currentSmallInitials);
  if (!example) throw new Error('Missing current size-16 initials fixture');
  const { legacy, headless } = await renderPair(example, coreaiLightTheme, 'rtl');
  const oldValues = captureAvatarGroupStyles(legacy);
  const newValues = captureAvatarGroupStyles(headless);
  expect(newValues['root.direction']).toBe('rtl');
  expect(compareAvatarGroupStyles(oldValues, newValues, example)).toEqual([
    {
      property: 'inline.0.initials.text',
      legacy: 'A',
      headless: 'LA',
      kind: 'current-small-initials',
    },
  ]);
  expect(
    compareAvatarGroupStyles(oldValues, { ...newValues, 'inline.0.initials.text': 'AL' }, example),
  ).toEqual([
    {
      property: 'inline.0.initials.text',
      legacy: 'A',
      headless: 'AL',
      kind: 'unexpected',
    },
  ]);
});

test.each([true, false])(
  'keeps actual family defaults and nested neutral background when CoreAI defaults=%s',
  async (withComponentDefaults) => {
    const example: AvatarGroupExample = {
      name: 'Family defaults',
      props: { size: undefined, layout: undefined },
      item: { color: 'neutral' },
      open: true,
    };
    const { legacy, headless, screen } = await renderPair(
      example,
      coreaiLightTheme,
      'ltr',
      withComponentDefaults,
    );
    expect(
      compareAvatarGroupStyles(
        captureAvatarGroupStyles(legacy),
        captureAvatarGroupStyles(headless),
      ),
    ).toEqual([]);
    expect(headless.root).toHaveAttribute('data-size', '32');
    expect(headless.root).toHaveAttribute('data-layout', 'spread');
    const avatar = headless.items[0].querySelector('.fui-Avatar');
    if (!avatar || !headless.surface) throw new Error('Missing family default slots');
    expect(getComputedStyle(avatar).getPropertyValue('--coreai-Avatar-background').trim()).toBe(
      coreaiLightTheme.colorNeutralBackground6,
    );
    expect(getComputedStyle(headless.surface).borderTopColor).toBe(
      withComponentDefaults ? cssColor(coreaiLightTheme.colorNeutralStroke3) : 'rgba(0, 0, 0, 0)',
    );
    await screen.rerender(<Avatar name="Standalone neutral" data-testid="standalone-neutral" />);
    const standalone = screen.getByTestId('standalone-neutral').element();
    expect(getComputedStyle(standalone).getPropertyValue('--coreai-Avatar-background').trim()).toBe(
      coreaiLightTheme.colorNeutralBackground4,
    );
  },
);

test.each([
  ['current primitive', RawAvatarGroup, RawAvatarGroupPopover],
  ['ported wrapper', AvatarGroup, AvatarGroupPopover],
] as const)(
  'records the pinned %s trigger-render-function boundary without a shim',
  async (_, Group, Popup) => {
    const renderTrigger: SlotRenderFunction<
      ExtractSlotProps<AvatarGroupPopoverSlots['triggerButton']>
    > = (Component, props) => <Component {...props}>Custom trigger</Component>;
    await expect(async () => {
      await renderCoreAIComponent(
        <Group>
          <Popup
            tooltip={{ content: 'Rendered trigger', relationship: 'label', visible: false }}
            triggerButton={{ children: renderTrigger }}
          >
            <RawAvatarGroupItem name="Grace Hopper" />
          </Popup>
        </Group>,
      );
    }).rejects.toThrow(
      "A trigger element must be a single element for this component. Please ensure that you're not using React Fragments.",
    );
  },
);

test('preserves current native refs, slot renderers, callback targets and supported visual slot precedence', async () => {
  expectTypeOf(AvatarGroup).toExtend<ForwardRefComponent<AvatarGroupProps>>();
  expectTypeOf(AvatarGroupItem).toExtend<ForwardRefComponent<AvatarGroupItemProps>>();
  const groupRef = React.createRef<HTMLDivElement>();
  const itemRootRef = React.createRef<HTMLDivElement>();
  const forwardedAvatarRef = React.createRef<HTMLSpanElement>();
  const explicitAvatarRef = React.createRef<HTMLSpanElement>();
  const triggerRef = React.createRef<HTMLButtonElement>();
  const surfaceRef = React.createRef<HTMLDialogElement>();
  const contentRef = React.createRef<HTMLUListElement>();
  const labelRef = React.createRef<HTMLSpanElement>();
  const clickTargets: EventTarget[] = [];
  const triggerTargets: EventTarget[] = [];
  const avatarRenderer = vi.fn();
  const contentRenderer = vi.fn();
  const surfaceRenderer = vi.fn();
  const openChange = vi.fn<NonNullable<AvatarGroupPopoverProps['onOpenChange']>>();
  const renderItemRoot: SlotRenderFunction<DivItemRootProps> = (Component, props) => (
    <Component {...props} data-caller-item-root="" />
  );
  const renderAvatar: SlotRenderFunction<AvatarGroupItemAvatarProps> = (Component, props) => {
    avatarRenderer(Component, props);
    return <Component {...props} data-caller-avatar="" />;
  };
  const renderContent: SlotRenderFunction<ExtractSlotProps<AvatarGroupPopoverSlots['content']>> = (
    Component,
    props,
  ) => {
    contentRenderer(Component, props);
    return <Component {...props} data-caller-list="" />;
  };
  const renderSurface: SlotRenderFunction<DialogSurfaceProps> = (Component, props) => {
    surfaceRenderer(Component, props);
    return <Component {...props} data-caller-surface="" />;
  };
  const renderLabel: SlotRenderFunction<ExtractSlotProps<AvatarGroupItemSlots['overflowLabel']>> = (
    Component,
    props,
  ) => <Component {...props} data-caller-label="" />;
  const screen = await renderCoreAIComponent(
    <AvatarGroup ref={groupRef} size={56} aria-label="Custom reviewers">
      <AvatarGroupItem
        ref={forwardedAvatarRef}
        name="Ada Lovelace"
        color="red"
        onClick={(event) => clickTargets.push(event.currentTarget)}
        root={{
          as: 'div',
          ref: itemRootRef,
          className: 'caller-item-root',
          children: renderItemRoot,
        }}
        avatar={{
          ref: explicitAvatarRef,
          color: 'brand',
          size: 40,
          shape: 'square',
          className: 'caller-avatar',
          children: renderAvatar,
        }}
      />
      <AvatarGroupPopover
        onOpenChange={openChange}
        tooltip={{ content: 'Custom overflow', relationship: 'label', visible: false }}
        triggerButton={{
          ref: triggerRef,
          id: 'caller-trigger',
          children: 'Custom trigger content',
          onClick: (event) => triggerTargets.push(event.currentTarget),
        }}
        content={{
          ref: contentRef,
          children: renderContent,
        }}
        popoverSurface={{
          as: 'dialog',
          ref: surfaceRef,
          className: 'caller-surface',
          children: renderSurface,
        }}
      >
        <AvatarGroupItem
          name="Grace Hopper"
          overflowLabel={{
            ref: labelRef,
            children: renderLabel,
          }}
        />
      </AvatarGroupPopover>
    </AvatarGroup>,
  );
  const avatar = explicitAvatarRef.current;
  expect(avatar).toBeInstanceOf(HTMLSpanElement);
  expect(forwardedAvatarRef.current).toBeNull();
  expect(itemRootRef.current).toHaveClass(avatarGroupItemClassNames.root, 'caller-item-root');
  expect(itemRootRef.current).toHaveAttribute('data-caller-item-root', '');
  expect(avatar).toHaveClass('fui-Avatar', avatarGroupItemClassNames.avatar, 'caller-avatar');
  expect(avatar).toHaveAttribute('data-color', 'brand');
  expect(avatar).toHaveAttribute('data-size', '40');
  expect(avatar).toHaveAttribute('data-shape', 'square');
  expect(avatar).not.toHaveAttribute('color');
  expect(groupRef.current).not.toHaveAttribute('size');
  expect(avatarRenderer.mock.calls[0][0]).toBe(Avatar);
  if (!avatar) throw new Error('Missing caller Avatar');
  await userEvent.click(avatar);
  expect(clickTargets).toEqual([avatar]);
  const trigger = screen.getByRole('button', { name: 'Custom overflow' });
  expect(triggerRef.current).toBe(trigger.element());
  expect(trigger.element()).toHaveAttribute('id', 'caller-trigger');
  expect(trigger.element()).toHaveTextContent('Custom trigger content');
  await userEvent.click(trigger);
  expect(triggerTargets).toEqual([triggerRef.current]);
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  expect(surfaceRef.current).toBeInstanceOf(HTMLDialogElement);
  expect(surfaceRef.current).toHaveAttribute('data-caller-surface', '');
  expect(surfaceRef.current).toHaveClass('fui-PopoverSurface', 'caller-surface');
  expect(contentRef.current).toHaveAttribute('data-caller-list', '');
  expect(contentRef.current).toHaveClass(avatarGroupPopoverClassNames.content);
  expect(labelRef.current).toHaveAttribute('data-caller-label', '');
  expect(contentRenderer.mock.calls[0][0]).toBe('ul');
  expect(surfaceRenderer.mock.calls[0][0]).toBe(PopoverSurface);
  const [event, data] = openChange.mock.calls[0];
  expect(data.event).toBe(event);
  expect(data.type).toBe('click');
  expect(data.open).toBe(true);
});

function NativeFixture({
  raw = false,
  autoFocus = false,
  disabled = false,
  ...props
}: Pick<AvatarGroupPopoverProps, 'defaultOpen' | 'open' | 'onOpenChange' | 'trapFocus'> & {
  raw?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}) {
  const Group = raw ? RawAvatarGroup : AvatarGroup;
  const Item = raw ? RawAvatarGroupItem : AvatarGroupItem;
  const Popup = raw ? RawAvatarGroupPopover : AvatarGroupPopover;
  return (
    <>
      <button type="button">Before people</button>
      <Group aria-label="People">
        <Item name="Ada Lovelace" />
        <Popup
          {...props}
          count={2}
          tooltip={{ content: 'More people', relationship: 'label', visible: false }}
          triggerButton={{ 'aria-label': 'More people', disabled }}
          popoverSurface={{ 'aria-label': 'Overflow people' }}
        >
          <Item name="Grace Hopper" />
          <Item name="Katherine Johnson" />
          <li>
            <button type="button" autoFocus={autoFocus}>
              Review profiles
            </button>
          </li>
        </Popup>
      </Group>
      <button type="button">After people</button>
    </>
  );
}

test.each([false, true])(
  'retains raw=%s native keyboard opening, callback data, Escape restoration and light dismissal',
  async (raw) => {
    const changes = vi.fn<NonNullable<AvatarGroupPopoverProps['onOpenChange']>>();
    const screen = await renderCoreAIComponent(
      <NativeFixture raw={raw} autoFocus onOpenChange={changes} />,
    );
    const before = screen.getByRole('button', { name: 'Before people' });
    const trigger = screen.getByRole('button', { name: 'More people' });
    await userEvent.hover(before);
    await userEvent.click(before);
    await userEvent.keyboard('{Tab}');
    await expect.element(trigger).toHaveFocus();
    expect(trigger.element().matches(':hover')).toBe(false);
    expect(trigger.element().matches(':focus-visible')).toBe(true);
    if (!raw)
      expect(getComputedStyle(trigger.element()).borderTopColor).toBe(
        cssColor(coreaiLightTheme.colorStrokeFocus2),
      );
    await userEvent.keyboard('{Enter}');
    const surface = screen.getByRole('group', { name: 'Overflow people' });
    await expect.element(surface).toBeVisible();
    expect(surface.element()).toBeInstanceOf(HTMLDialogElement);
    expect(surface.element().matches(':popover-open')).toBe(true);
    await expect.element(screen.getByRole('button', { name: 'Review profiles' })).toHaveFocus();
    await expect.element(trigger).toHaveAttribute('aria-details', surface.element().id);
    expect(screen.getByRole('listitem').all().length).toBe(3);
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => surface.query() === null).toBe(true);
    await expect.element(trigger).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect.element(screen.getByRole('group', { name: 'Overflow people' })).toBeVisible();
    await userEvent.click(before);
    await expect.poll(() => surface.query() === null).toBe(true);
    await expect.element(before).toHaveFocus();
    expect(
      changes.mock.calls.map(([event, data]) => [event === data.event, data.type, data.open]),
    ).toEqual([
      [true, 'click', true],
      [true, 'toggle', false],
      [true, 'click', true],
      [true, 'toggle', false],
    ]);
  },
);

test('native overflow and content buttons do not submit their owner form, while its submitter keeps FormData', async () => {
  const submissions: { project: string; action: string; submitter: EventTarget | null }[] = [];
  const submit = vi.fn((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null;
    const data = new FormData(event.currentTarget, submitter);
    submissions.push({
      project: String(data.get('project')),
      action: String(data.get('action')),
      submitter,
    });
  });
  const screen = await renderCoreAIComponent(
    <form onSubmit={submit}>
      <input aria-label="Project" name="project" defaultValue="Atlas" />
      <NativeFixture autoFocus />
      <button type="submit" name="action" value="save">
        Save group assignment
      </button>
    </form>,
  );
  const trigger = screen.getByRole('button', { name: 'More people' });
  await expect.element(trigger).toHaveAttribute('type', 'button');
  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole('button', { name: 'Review profiles' }));
  expect(submit).not.toHaveBeenCalled();
  await userEvent.keyboard('{Escape}');
  const submitter = screen.getByRole('button', { name: 'Save group assignment' });
  await userEvent.click(submitter);
  expect(submit).toHaveBeenCalledTimes(1);
  expect(submissions).toEqual([
    { project: 'Atlas', action: 'save', submitter: submitter.element() },
  ]);
});

test('native modal overflow focuses its first action, prevents outside focus and restores the trigger', async () => {
  const changes = vi.fn<NonNullable<AvatarGroupPopoverProps['onOpenChange']>>();
  const screen = await renderCoreAIComponent(<NativeFixture trapFocus onOpenChange={changes} />);
  const trigger = screen.getByRole('button', { name: 'More people' });
  const outside = screen.getByRole('button', { name: 'After people' }).element();
  await userEvent.click(trigger);
  const surface = screen.getByRole('dialog', { name: 'Overflow people' });
  await expect.element(surface).toBeVisible();
  expect(surface.element().matches(':modal')).toBe(true);
  expect(surface.element()).not.toHaveAttribute('popover');
  await expect.element(screen.getByRole('button', { name: 'Review profiles' })).toHaveFocus();
  if (!(outside instanceof HTMLButtonElement)) throw new Error('Missing native outside button');
  outside.focus();
  expect(document.activeElement).not.toBe(outside);
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => surface.query() === null).toBe(true);
  await expect.element(trigger).toHaveFocus();
  expect(changes.mock.calls.map(([, data]) => [data.type, data.open])).toEqual([
    ['click', true],
    ['close', false],
  ]);
});

test('current defaultOpen, controlled false and native disabled trigger retain their distinct contracts', async () => {
  const changes = vi.fn<NonNullable<AvatarGroupPopoverProps['onOpenChange']>>();
  const screen = await renderCoreAIComponent(<NativeFixture defaultOpen onOpenChange={changes} />);
  await expect.element(screen.getByRole('group', { name: 'Overflow people' })).toBeVisible();
  expect(changes).not.toHaveBeenCalled();
  await screen.rerender(<NativeFixture key="controlled" open={false} onOpenChange={changes} />);
  const trigger = screen.getByRole('button', { name: 'More people' });
  await userEvent.click(trigger);
  await userEvent.click(trigger);
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(screen.getByRole('group', { name: 'Overflow people' }).query()).toBeNull();
  expect(changes.mock.calls.map(([, data]) => data.open)).toEqual([true, true]);
  changes.mockClear();
  await screen.rerender(<NativeFixture key="disabled" disabled onOpenChange={changes} />);
  await expect.element(trigger).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Before people' }));
  await userEvent.keyboard('{Tab}');
  await expect.element(screen.getByRole('button', { name: 'After people' })).toHaveFocus();
  expect(changes).not.toHaveBeenCalled();
});

test('uses the public div surface branch without changing native element/ref identity or the caller renderer', async () => {
  const surfaceRef = React.createRef<HTMLDivElement>();
  const renderer = vi.fn();
  const renderSurface: SlotRenderFunction<DivSurfaceProps> = (Component, props) => {
    renderer(Component, props);
    return <Component {...props} as="div" data-div-renderer="" />;
  };
  const screen = await renderCoreAIComponent(
    <AvatarGroup layout="pie" size={72} aria-label="Custom div pie">
      <AvatarGroupItem name="Ada Lovelace" />
      <AvatarGroupItem name="Margaret Hamilton" />
      <AvatarGroupItem name="Katherine Johnson" />
      <AvatarGroupPopover
        tooltip={{ content: 'Div overflow', relationship: 'label', visible: false }}
        popoverSurface={{
          as: 'div',
          ref: surfaceRef,
          children: renderSurface,
        }}
      >
        <AvatarGroupItem name="Grace Hopper" />
      </AvatarGroupPopover>
    </AvatarGroup>,
  );
  const group = screen.getByRole('group', { name: 'Custom div pie' }).element();
  const slices = [...group.querySelectorAll(':scope > .fui-AvatarGroupItem')];
  const clipping = slices.map((slice) => getComputedStyle(slice).clipPath);
  expect(clipping).toHaveLength(3);
  expect(clipping.every((clip) => clip !== 'none')).toBe(true);
  await userEvent.click(screen.getByRole('button', { name: 'Div overflow' }));
  const surface = screen.getByRole('group', { name: 'Overflow' });
  await expect.element(surface).toBeVisible();
  expect(surfaceRef.current).toBe(surface.element());
  expect(surface.element()).toBeInstanceOf(HTMLDivElement);
  expect(surface.element()).toHaveAttribute('data-div-renderer', '');
  expect(surface.element().matches(':popover-open')).toBe(true);
  expect(renderer).toHaveBeenCalled();
  expect(slices.map((slice) => getComputedStyle(slice).clipPath)).toEqual(clipping);
});

test('keeps current fragment counting instead of adding recursive counting, and honors explicit clamped counts', async () => {
  for (const raw of [false, true]) {
    const Group = raw ? RawAvatarGroup : AvatarGroup;
    const Popup = raw ? RawAvatarGroupPopover : AvatarGroupPopover;
    const Item = raw ? RawAvatarGroupItem : AvatarGroupItem;
    const children = (
      <>
        <Item name="Ada Lovelace" />
        <Item name="Grace Hopper" />
      </>
    );
    const screen = await renderCoreAIComponent(
      <Group>
        <Popup tooltip={{ content: 'Fragment people', relationship: 'label', visible: false }}>
          {children}
        </Popup>
      </Group>,
    );
    expect(screen.getByRole('button', { name: 'Fragment people' }).element().textContent).toBe(
      '+1',
    );
    await screen.rerender(
      <Group>
        <Popup
          count={100}
          tooltip={{ content: 'Fragment people', relationship: 'label', visible: false }}
        >
          {children}
        </Popup>
      </Group>,
    );
    expect(screen.getByRole('button', { name: 'Fragment people' }).element().textContent).toBe(
      '99+',
    );
    await cleanup();
  }
});

test('pie partition shows at most three inline people and includes every person in the accessible overflow list', async () => {
  const partition = partitionAvatarGroupItems({ items: avatarGroupNames, layout: 'pie' });
  expect(partition.inlineItems).toEqual(avatarGroupNames.slice(0, 3));
  expect(partition.overflowItems).toEqual(avatarGroupNames);
  const screen = await renderCoreAIComponent(
    <AvatarGroup layout="pie" size={72} aria-label="Pie people">
      {partition.inlineItems.map((name) => (
        <AvatarGroupItem name={name} key={name} />
      ))}
      <AvatarGroupPopover
        tooltip={{ content: 'Every pie person', relationship: 'label', visible: false }}
      >
        {partition.overflowItems?.map((name) => (
          <AvatarGroupItem name={name} key={name} />
        ))}
      </AvatarGroupPopover>
    </AvatarGroup>,
  );
  const group = screen.getByRole('group', { name: 'Pie people' }).element();
  expect(group.querySelectorAll(':scope > .fui-AvatarGroupItem')).toHaveLength(3);
  const trigger = screen.getByRole('button', { name: 'Every pie person' });
  expect(trigger.element().textContent).toBe('');
  await userEvent.click(trigger);
  expect(screen.getByRole('listitem').all()).toHaveLength(avatarGroupNames.length);
  const list = screen.getByRole('list');
  for (const name of avatarGroupNames)
    await expect.element(list.getByRole('img', { name })).toBeVisible();
});

test('current tooltip reuses the overlay foundation and its own arrow size without changing its accessible label', async () => {
  const legacyContent: React.HTMLAttributes<HTMLDivElement> & { 'data-testid': string } = {
    children: 'Review project members',
    'data-testid': 'legacy-group-tooltip',
  };
  const headlessContent: React.HTMLAttributes<HTMLDivElement> & { 'data-testid': string } = {
    children: 'Review project members',
    'data-testid': 'headless-group-tooltip',
  };
  const screen = await renderCoreAIComponent(
    <>
      <LegacyAvatarGroup>
        <LegacyAvatarGroupPopover
          open={false}
          tooltip={{
            visible: true,
            withArrow: true,
            relationship: 'label',
            content: legacyContent,
          }}
        >
          <LegacyAvatarGroupItem name="Ada Lovelace" />
        </LegacyAvatarGroupPopover>
      </LegacyAvatarGroup>
      <AvatarGroup>
        <AvatarGroupPopover
          open={false}
          tooltip={{
            visible: true,
            withArrow: true,
            relationship: 'label',
            content: headlessContent,
          }}
        >
          <AvatarGroupItem name="Ada Lovelace" />
        </AvatarGroupPopover>
      </AvatarGroup>
    </>,
  );
  const old = screen.getByTestId('legacy-group-tooltip');
  const current = screen.getByTestId('headless-group-tooltip');
  await expect.element(current).toBeVisible();
  const oldStyle = getComputedStyle(old.element());
  const currentStyle = getComputedStyle(current.element());
  for (const property of [
    'background-color',
    'color',
    'border-radius',
    'border-top-color',
    'font-size',
    'line-height',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'filter',
  ]) {
    expect(currentStyle.getPropertyValue(property), property).toBe(
      oldStyle.getPropertyValue(property),
    );
  }
  expect(current.element().matches(':popover-open')).toBe(true);
  expect(current.element()).toHaveClass(avatarGroupPopoverClassNames.tooltip);
  expect(current.element()).not.toHaveAttribute('data-tabster');
  const legacyArrow = old.element().querySelector(':scope > div:first-child');
  const nativeArrow = current.element().querySelector(':scope > [data-arrow]');
  if (!legacyArrow || !nativeArrow) throw new Error('Missing current tooltip arrow fixtures');
  expect(getComputedStyle(nativeArrow).width).toBe(getComputedStyle(legacyArrow).width);
  expect(getComputedStyle(nativeArrow).height).toBe(getComputedStyle(legacyArrow).height);
});

test('consumer reviewer controls update count, controlled callbacks, profile content and valid pie composition', async () => {
  const screen = await renderCoreAIComponent(<AvatarGroupPeopleFlow />);
  const trigger = screen.getByRole('button', { name: 'Show additional reviewers' });
  await userEvent.hover(screen.getByTestId('avatar-group-flow-pointer-rest'));
  await userEvent.click(trigger);
  await expect
    .element(screen.getByRole('button', { name: 'Open Ada Lovelace profile' }))
    .toHaveFocus();
  await userEvent.click(screen.getByRole('button', { name: 'Open Ada Lovelace profile' }));
  await expect
    .element(screen.getByRole('status', { name: 'Selected reviewer profile' }))
    .toHaveTextContent('Ada Lovelace');
  await userEvent.click(screen.getByRole('button', { name: 'Close reviewer list' }));
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
  await userEvent.click(screen.getByRole('button', { name: 'Add reviewer' }));
  await expect
    .element(screen.getByRole('status', { name: 'Reviewer count' }))
    .toHaveTextContent('6 reviewers');
  expect(trigger.element().textContent).toBe('+4');
  await userEvent.selectOptions(screen.getByLabelText('Reviewer layout'), 'pie');
  await userEvent.click(trigger);
  expect(screen.getByRole('listitem').all()).toHaveLength(7);
  await userEvent.keyboard('{Escape}');
  await expect.element(trigger).toHaveFocus();
  await expect
    .element(screen.getByRole('status', { name: 'Reviewer popup events' }))
    .toHaveTextContent('toggle:closed:same-event');
});

test.each([
  [1440, 1000],
  [375, 720],
] as const)(
  '%sx%s report publishes real readiness/counts and fixed report geometry after fixture changes and refresh',
  async (width, height) => {
    const viewport = { width: innerWidth, height: innerHeight };
    await page.viewport(width, height);
    try {
      const screen = await renderCoreAIComponent(<AvatarGroupComparisonReport />);
      await userEvent.hover(screen.getByTestId('avatar-group-report-pointer-rest'));
      const report = screen.getByRole('status', { name: 'AvatarGroup style report' });
      await expect.element(report).toHaveAttribute('data-avatar-group-report-state', 'ready');
      expect(
        report.element().getAttribute('data-avatar-group-unexpected-count'),
        report.element().textContent ?? '',
      ).toBe('0');
      expect(report.element().getBoundingClientRect().height).toBe(240);
      const example = avatarGroupExamples.find(
        (candidate) => candidate.name === 'Open overflow rows always use size 24',
      );
      if (!example) throw new Error('Missing open overflow report fixture');
      await userEvent.selectOptions(
        screen.getByLabelText('AvatarGroup visual fixture'),
        example.name,
      );
      await expect
        .element(report)
        .toHaveAttribute('data-avatar-group-report-example', example.name);
      await expect.element(report).toHaveAttribute('data-avatar-group-report-state', 'ready');
      expect(
        report.element().getAttribute('data-avatar-group-unexpected-count'),
        report.element().textContent ?? '',
      ).toBe('0');
      const partition = getAvatarGroupPartition(example);
      expect(report.element()).toHaveAttribute(
        'data-avatar-group-inline-count',
        String(partition.inlineItems.length),
      );
      expect(report.element()).toHaveAttribute(
        'data-avatar-group-overflow-count',
        String(partition.overflowItems?.length),
      );
      const group = getComparisonAvatarGroup(screen.container, 'headless');
      expect(group.surface?.matches(':popover-open')).toBe(true);
      expect(
        Number(report.element().getAttribute('data-avatar-group-property-count')),
      ).toBeGreaterThan(200);
      expect(Number(report.element().getAttribute('data-avatar-group-width'))).toBe(
        group.root.getBoundingClientRect().width,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Refresh AvatarGroup report' }));
      await expect.element(report).toHaveAttribute('data-avatar-group-report-state', 'ready');
      expect(
        report.element().getAttribute('data-avatar-group-unexpected-count'),
        report.element().textContent ?? '',
      ).toBe('0');
      expect(report.element().getBoundingClientRect().height).toBe(240);
    } finally {
      await cleanup();
      await page.viewport(viewport.width, viewport.height);
    }
  },
);

test('the public current item/popover contract stays assignable without private registries or legacy behavior props', () => {
  expectTypeOf<Pick<AvatarGroupItemProps, 'name' | 'active' | 'activeAppearance'>>().toEqualTypeOf<
    Pick<RawAvatarGroupItemProps, 'name' | 'active' | 'activeAppearance'>
  >();
  expectTypeOf<
    Pick<AvatarGroupPopoverProps, 'trapFocus' | 'onOpenChange' | 'positioning'>
  >().toEqualTypeOf<
    Pick<RawAvatarGroupPopoverProps, 'trapFocus' | 'onOpenChange' | 'positioning'>
  >();
});
