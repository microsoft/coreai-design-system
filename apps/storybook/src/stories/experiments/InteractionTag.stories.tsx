// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { ComparisonProvider as CoreAIFluentProvider } from './ComparisonProvider.js';
import {
  InteractionTag,
  InteractionTagPrimary,
  InteractionTagSecondary,
} from '@coreai-ds/react-headless-components';
import {
  interactionTagConsumerExample,
  interactionTagExamples,
} from './InteractionTagComparison.js';
import { TagComparisonWithReport } from './TagComparisonReport.js';
import { TagDismissFlow, TagFormFlow } from './TagFlows.js';
import { assertTagReport, playTagDismissFlow, playTagFormFlow } from './TagStoryPlay.js';
import { getComparisonTag } from './compareTagStyles.js';

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless InteractionTag',
  component: InteractionTag,
  subcomponents: { InteractionTagPrimary, InteractionTagSecondary },
  args: { children: <InteractionTagPrimary type="button">Project Atlas</InteractionTagPrimary> },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'InteractionTag, InteractionTagPrimary and InteractionTagSecondary use only the current headless-preview 0.3.2 /interaction-tag facade. All three raw style-selection sources in react-tags 9.9.8 were ported. Primary media/icon/text compose the Tag CSS foundation; Avatar/presence use the completed components and the existing public Avatar context. Only size/shape/appearance travel in a private visual context; public hooks retain disabled/selection/value/dismiss/ARIA/ref/slot behavior. The default secondary glyph uses icons 2.0.343 headless SVG, not the styled icon entry. CoreAI defaults-gated deviations are text padding-bottom 0 and a non-outline secondary logical border reset/1px margin. Native primary buttons retain submit behavior when type is omitted; secondary defaults to button. Neither part accepts an invented anchor variant or deprecated runtime props. Primary and secondary callbacks are separate and current bubbling/preventDefault behavior is preserved. The flow removes tags and restores focus with explicit consumer refs; the library adds no removal/navigation state or Tabster fallback. Reports compare exact bounded slots, counts and geometry in both themes/RTL/default opt-out, including outline bundled-icon hover support. Native focusgroup and feature-disabled real-polyfill acceptance are separate from synthetic story focus preparation.',
      },
    },
  },
} satisfies Meta<typeof InteractionTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <TagComparisonWithReport family="interaction" />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('tag-report-pointer-rest'));
    for (const example of interactionTagExamples) {
      await userEvent.selectOptions(canvas.getByLabelText('Tag visual fixture'), example.name);
      await assertTagReport(canvasElement, example.name);
    }
  },
};

export const RTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <TagComparisonWithReport family="interaction" />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const DefaultsOptOut: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} withComponentDefaults={false}>
      <TagComparisonWithReport family="interaction" />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const ConsumerOverrides: Story = {
  render: () => (
    <TagComparisonWithReport
      family="interaction"
      examples={[interactionTagConsumerExample]}
      consumer
    />
  ),
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('tag-report-pointer-rest'));
    await assertTagReport(canvasElement, interactionTagConsumerExample.name);
    const root = getComparisonTag(canvasElement, 'headless');
    const primary = root.querySelector('[data-tag-part="primary"]');
    const secondary = root.querySelector('[data-tag-part="secondary"]');
    if (!primary || !secondary) throw new Error('Missing interaction actions');
    await expect(getComputedStyle(primary).minWidth).toBe('180px');
    await expect(getComputedStyle(secondary).borderInlineStartWidth).toBe('3px');
    await expect(getComputedStyle(secondary).marginInlineStart).toBe('4px');
  },
};

export const PrimaryAndSecondaryActions: Story = {
  render: () => <TagDismissFlow interaction />,
  play: async ({ canvasElement }) => playTagDismissFlow(canvasElement, true),
};

export const ColdGroupAndRestore: Story = {
  render: () => <TagDismissFlow interaction cold />,
  play: async ({ canvasElement }) => playTagDismissFlow(canvasElement, true, true),
};

export const KeyboardRTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <TagDismissFlow interaction cold />
    </CoreAIFluentProvider>
  ),
  play: ColdGroupAndRestore.play,
};

export const NativeForms: Story = {
  render: () => <TagFormFlow />,
  play: async ({ canvasElement }) => playTagFormFlow(canvasElement),
};
