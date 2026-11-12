// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ComparisonProvider as CoreAIFluentProvider } from './ComparisonProvider.js';
import {
  AvatarGroup,
  AvatarGroupItem,
  AvatarGroupPopover,
} from '@coreai-ds/react-headless-components';
import {
  AvatarGroupPeopleFlow,
  avatarGroupConsumerExample,
  avatarGroupExamples,
  getAvatarGroupPartition,
  type AvatarGroupExample,
} from './AvatarGroupComparison.js';
import { AvatarGroupComparisonReport } from './AvatarGroupComparisonReport.js';
import { captureAvatarGroupStyles, getComparisonAvatarGroup } from './compareAvatarGroupStyles.js';

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless AvatarGroup',
  component: AvatarGroup,
  subcomponents: { AvatarGroupItem, AvatarGroupPopover },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'All three current visual members use the public hook → resolved-state styling → public-renderer pipeline from headless preview 0.3.2/avatar-group. The installed runtime delegates to react-avatar 9.11.9, also the exact raw visual source. Group size is restored only as a visual prop and passed through the published typed context value. Item restores only color/idForColor and reuses the completed Avatar/PresenceBadge slot foundations. Popover restores appearance/visual size, size-dependent count/icon defaults and the public MoreHorizontal glyph, and reuses the completed native PopoverSurface/visual context without replacing the renderer’s Popover/Trigger behavior. Explicit dialog/div adapters retain native refs and caller slot renderers. Current overflow counting, list roles, callbacks, generated associations and native focus/dismissal remain authoritative. There is no root popover slot, legacy positioning/focus/motion shim, glyph slot, production polyfill import or new dependency. No family focusgroup exists. Current trapFocus is the installed spelling, despite newer online docs. Valid pie composition displays at most three inline people and all people in overflow; fragments/action rows have an explicit count. Consumer CSS overrides the layered visual foundation. Current 16px two-letter initials and native overlay differences remain explicit. Production source and exports are unchanged.',
      },
    },
  },
} satisfies Meta<typeof AvatarGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

async function assertReport(canvasElement: HTMLElement, example: AvatarGroupExample) {
  const canvas = within(canvasElement);
  const report = canvas.getByRole('status', { name: 'AvatarGroup style report' });
  await waitFor(
    () => {
      expect(report).toHaveAttribute('data-avatar-group-report-example', example.name);
      expect(report).toHaveAttribute('data-avatar-group-report-state', 'ready');
    },
    { timeout: 10000 },
  );
  await expect(report).toHaveAttribute('data-avatar-group-unexpected-count', '0');
  const partition = getAvatarGroupPartition(example);
  await expect(report).toHaveAttribute(
    'data-avatar-group-inline-count',
    String(partition.inlineItems.length),
  );
  await expect(report).toHaveAttribute(
    'data-avatar-group-overflow-count',
    String(example.open ? (partition.overflowItems?.length ?? 0) : 0),
  );
  const current = getComparisonAvatarGroup(canvasElement, 'headless');
  const geometry = current.root.getBoundingClientRect();
  await expect(Number(report.getAttribute('data-avatar-group-property-count'))).toBe(
    Object.keys(captureAvatarGroupStyles(current)).length,
  );
  await expect(geometry.width).toBeGreaterThan(0);
  await expect(geometry.height).toBeGreaterThan(0);
  await expect(Number(report.getAttribute('data-avatar-group-width'))).toBe(geometry.width);
  await expect(Number(report.getAttribute('data-avatar-group-height'))).toBe(geometry.height);
  await expect(report.getBoundingClientRect().height).toBe(240);
  if (current.trigger) await expect(current.trigger.matches(':hover')).toBe(false);
  if (example.open) await expect(current.surface?.matches(':popover-open')).toBe(true);
}

export const Comparison: Story = {
  render: () => <AvatarGroupComparisonReport />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('avatar-group-report-pointer-rest'));
    await userEvent.click(canvas.getByRole('button', { name: 'Refresh AvatarGroup report' }));
    for (const example of avatarGroupExamples) {
      await userEvent.selectOptions(
        canvas.getByLabelText('AvatarGroup visual fixture'),
        example.name,
      );
      await assertReport(canvasElement, example);
    }
    await userEvent.click(canvas.getByRole('button', { name: 'Refresh AvatarGroup report' }));
    await assertReport(canvasElement, avatarGroupExamples[avatarGroupExamples.length - 1]);
  },
};

export const RTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <AvatarGroupComparisonReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const DefaultsOptOut: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} withComponentDefaults={false}>
      <AvatarGroupComparisonReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const ConsumerOverrides: Story = {
  render: () => <AvatarGroupComparisonReport examples={[avatarGroupConsumerExample]} />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('avatar-group-report-pointer-rest'));
    await userEvent.click(canvas.getByRole('button', { name: 'Refresh AvatarGroup report' }));
    await assertReport(canvasElement, avatarGroupConsumerExample);
    const current = getComparisonAvatarGroup(canvasElement, 'headless');
    await expect(
      Number(
        canvas
          .getByRole('status', { name: 'AvatarGroup style report' })
          .getAttribute('data-avatar-group-difference-count'),
      ),
    ).toBeGreaterThan(0);
    if (!current.trigger) throw new Error('Missing consumer AvatarGroup trigger');
    await expect(getComputedStyle(current.trigger).borderRadius).toBe('3px');
    await expect(getComputedStyle(current.trigger).borderTopColor).toBe('rgb(35, 95, 155)');
    const avatar = current.items[0].querySelector('.fui-Avatar');
    if (!avatar) throw new Error('Missing consumer Avatar');
    await expect(getComputedStyle(avatar).borderRadius).toBe('3px');
  },
};

async function playPeopleFlow(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  const trigger = canvas.getByRole('button', { name: 'Show additional reviewers' });
  await userEvent.hover(canvas.getByTestId('avatar-group-flow-pointer-rest'));
  await userEvent.click(trigger);
  await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
  await userEvent.click(canvas.getByRole('button', { name: 'Open Ada Lovelace profile' }));
  await expect(canvas.getByRole('status', { name: 'Selected reviewer profile' })).toHaveTextContent(
    'Ada Lovelace',
  );
  await userEvent.click(canvas.getByRole('button', { name: 'Close reviewer list' }));
  await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
  await userEvent.click(canvas.getByRole('button', { name: 'Add reviewer' }));
  await expect(canvas.getByRole('status', { name: 'Reviewer count' })).toHaveTextContent(
    '6 reviewers',
  );
  await userEvent.selectOptions(canvas.getByLabelText('Reviewer layout'), 'pie');
  await userEvent.click(trigger);
  await expect(canvas.getByRole('list')).toHaveTextContent('Dorothy Vaughan');
  await userEvent.click(canvas.getByRole('button', { name: 'Close reviewer list' }));
  await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
  await expect(canvas.getByRole('status', { name: 'Reviewer popup events' })).toHaveTextContent(
    'click:open:same-event',
  );
  await expect(canvas.getByRole('status', { name: 'Reviewer popup events' })).toHaveTextContent(
    'click:closed:same-event',
  );
}

export const ReviewersAndOverflow: Story = {
  render: () => <AvatarGroupPeopleFlow />,
  play: async ({ canvasElement }) => playPeopleFlow(canvasElement),
};

export const NativeModalOverflow: Story = {
  render: () => <AvatarGroupPeopleFlow modal />,
  play: ReviewersAndOverflow.play,
};
