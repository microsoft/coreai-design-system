// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { CoreAIFluentProvider } from '@coreai-ds/react-components';
import { Tag } from '@coreai-ds/react-headless-components';
import { tagConsumerExample, tagExamples } from './TagComparison.js';
import { TagComparisonWithReport } from './TagComparisonReport.js';
import { TagDismissFlow, TagFormFlow } from './TagFlows.js';
import { assertTagReport, playTagDismissFlow, playTagFormFlow } from './TagStoryPlay.js';
import { getComparisonTag } from './compareTagStyles.js';

const meta = {
  title: 'Experiments/Headless Tag',
  component: Tag,
  args: { children: 'Project Atlas' },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'Tag uses only the public headless-preview 0.3.2 /tag hook, renderer and context-values helper. Its visual reference is react-tags 9.9.8. Restored size/shape/appearance inherit the visual TagGroup context; native dismissal, values, callbacks, ARIA, slots and refs remain in the current primitive. CoreAI only removes primary-text bottom padding, gated by component defaults. Media uses the completed Avatar/PresenceBadge through the existing public Avatar context. The default dismiss glyph is the style-free icons 2.0.343 headless SVG entry. No TagPicker API, deprecated state.components/getSlots, old styled runtime or keyboard/focus shim is added. Current Tag is span/button only, not an anchor. Dismissal removal and post-delete focus restoration in the flow are explicit product-owned state/refs. Reports compare bounded CSS strings, geometry and slot counts exactly; consumer CSS priority is intentionally improved. Native focusgroup and the actual consumer polyfill are accepted separately with trusted keys; synthetic plays prepare focus for native defaults.',
      },
    },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <TagComparisonWithReport family="tag" />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('tag-report-pointer-rest'));
    for (const example of tagExamples) {
      await userEvent.selectOptions(canvas.getByLabelText('Tag visual fixture'), example.name);
      await assertTagReport(canvasElement, example.name);
    }
  },
};

export const RTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <TagComparisonWithReport family="tag" />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const DefaultsOptOut: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} withComponentDefaults={false}>
      <TagComparisonWithReport family="tag" />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const ConsumerOverrides: Story = {
  render: () => <TagComparisonWithReport family="tag" examples={[tagConsumerExample]} consumer />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('tag-report-pointer-rest'));
    await assertTagReport(canvasElement, tagConsumerExample.name);
    const root = getComparisonTag(canvasElement, 'headless');
    await expect(getComputedStyle(root).minWidth).toBe('180px');
    await expect(getComputedStyle(root).borderRadius).toBe('3px');
    const text = root.querySelector('[data-tag-part="primaryText"]');
    if (!text) throw new Error('Missing Tag primary text');
    await expect(getComputedStyle(text).paddingBottom).toBe('4px');
  },
};

export const DismissAndRestore: Story = {
  render: () => <TagDismissFlow />,
  play: async ({ canvasElement }) => playTagDismissFlow(canvasElement),
};

export const NativeForms: Story = {
  render: () => <TagFormFlow />,
  play: async ({ canvasElement }) => playTagFormFlow(canvasElement),
};
