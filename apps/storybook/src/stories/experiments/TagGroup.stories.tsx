// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { CoreAIFluentProvider } from '@coreai-ds/react-components';
import { Tag, TagGroup } from '@coreai-ds/react-headless-components';
import { tagGroupConsumerExample, tagGroupExamples } from './TagGroupComparison.js';
import { TagComparisonWithReport } from './TagComparisonReport.js';
import { TagDismissFlow, TagSelectionFlow } from './TagFlows.js';
import { assertTagReport, playTagDismissFlow, playTagSelectionFlow } from './TagStoryPlay.js';
import { getComparisonTag } from './compareTagStyles.js';

const meta = {
  title: 'Experiments/Headless TagGroup',
  component: TagGroup,
  args: {
    'aria-label': 'Project labels',
    children: <Tag role="listitem">Project Atlas</Tag>,
    role: 'list',
  },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'TagGroup uses the current public /tag-group hook/render/context-values pipeline. CoreAI has no TagGroup prop defaults or style overrides. The visual-only family context restores size/appearance inheritance without cloning disabled/dismiss/selection state or callbacks. Current focusgroup="toolbar inline wrap" replaces legacy Tabster navigation. Consumers load the public polyfill(root) API before children and initialize newly mounted groups where native support is missing; the shared experiment-only FocusgroupConsumer does this, never the component library. Chromium acceptance feature-detects native focusGroup, then disables Focusgroup to test the real 1.6.0 polyfill. The polyfill documents visibility-only changes as a limitation; these flows unmount/remount groups instead of faking support. The current headless group does not restore focus after deletion; consumer refs do so explicitly in the flows. Controlled selection passes the existing pre-change selectedValues/event payload unchanged, with no controller normalization. In the pinned primitive an explicit InteractionTagPrimary onClick takes precedence over its group-selection handler; the controlled selection flow uses the safe no-child-handler form. Tag itself does not become a selectable controller. TagPicker remains a separate deferred family.',
      },
    },
  },
} satisfies Meta<typeof TagGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <TagComparisonWithReport family="group" />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('tag-report-pointer-rest'));
    for (const example of tagGroupExamples) {
      await userEvent.selectOptions(canvas.getByLabelText('Tag visual fixture'), example.name);
      await assertTagReport(canvasElement, example.name);
      await expect(getComparisonTag(canvasElement, 'headless')).toHaveAttribute(
        'focusgroup',
        'toolbar inline wrap',
      );
    }
  },
};

export const RTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <TagComparisonWithReport family="group" />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const DefaultsOptOut: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} withComponentDefaults={false}>
      <TagComparisonWithReport family="group" />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const ConsumerOverrides: Story = {
  render: () => (
    <TagComparisonWithReport family="group" examples={[tagGroupConsumerExample]} consumer />
  ),
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('tag-report-pointer-rest'));
    await assertTagReport(canvasElement, tagGroupConsumerExample.name);
    await expect(getComputedStyle(getComparisonTag(canvasElement, 'headless')).columnGap).toBe(
      '18px',
    );
  },
};

export const KeyboardAndDismiss: Story = {
  render: () => <TagDismissFlow />,
  play: async ({ canvasElement }) => playTagDismissFlow(canvasElement),
};

export const ColdMountAndRestore: Story = {
  render: () => <TagDismissFlow cold />,
  play: async ({ canvasElement }) => playTagDismissFlow(canvasElement, false, true),
};

export const KeyboardRTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <TagDismissFlow cold />
    </CoreAIFluentProvider>
  ),
  play: ColdMountAndRestore.play,
};

export const ControlledSelection: Story = {
  render: () => <TagSelectionFlow />,
  play: async ({ canvasElement }) => playTagSelectionFlow(canvasElement),
};
