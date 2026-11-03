// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { CoreAIFluentProvider } from '@coreai-ds/react-components';
import {
  TagPicker,
  TagPickerButton,
  TagPickerControl,
  TagPickerGroup,
  TagPickerInput,
  TagPickerList,
  TagPickerOption,
  TagPickerOptionGroup,
} from '@coreai-ds/react-headless-components';
import { TagPickerComparisonReport } from './TagPickerComparisonReport.js';
import { tagPickerConsumerExample, tagPickerExamples } from './TagPickerComparison.js';
import {
  TagPickerCustomValuesFlow,
  TagPickerNativeFormFlow,
  TagPickerSelectionFlow,
} from './TagPickerFlows.js';
import {
  assertTagPickerReport,
  playTagPickerButtonFlow,
  playTagPickerControlledFlow,
  playTagPickerCustomValuesFlow,
  playTagPickerNativeFormFlow,
  playTagPickerSelectionFlow,
  playTagPickerSingleFlow,
} from './TagPickerStoryPlay.js';
import { getComparisonTagPicker, getTagPickerTrigger } from './compareTagPickerStyles.js';

const meta = {
  title: 'Experiments/Headless TagPicker',
  component: TagPicker,
  subcomponents: {
    TagPickerButton,
    TagPickerControl,
    TagPickerGroup,
    TagPickerInput,
    TagPickerList,
    TagPickerOption,
    TagPickerOptionGroup,
  },
  args: {
    children: (
      <TagPickerControl>
        <TagPickerInput aria-label="Reviewers" />
      </TagPickerControl>
    ),
    noPopover: true,
  },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'All 8 public TagPicker visual members use the installed headless-preview 0.3.2 /tag-picker facade, public hook/render/context/slot APIs and pinned react-tag-picker 9.10.5 raw visual reference. The root is behavior/context-only: no fabricated DOM, ref, inline, provider, query, value, freeform or single-selection alias is added. Only actual visual props are stripped before hooks. CoreAI applies filled-darker only for omitted appearance with component defaults enabled; explicit undefined and defaults opt-out resolve to outline. Root size maps medium/large/extra-large to Tag extra-small/small/medium; filled-darker maps selected tags to outline. TagPickerGroup reuses completed TagGroup CSS and its visual-only context, TagPickerList the completed native Listbox slot adapter, and option/group parts their completed CSS foundations. Current group role/focusgroup, current disabled/selected/active-descendant state, native query/form state, consumer refs/classes/render functions and unchanged callback payload identity remain authoritative. Public TagPickerOption has no checkIcon prop and its current renderer emits no selection glyph. The declared child input/button appearance and button size props are unused upstream; parent presentation wins. Input clearable has no emitted clear slot. Native popovers and CSS anchors retain native defaults; only explicit fixtures request matching width/zero offset for bounded comparison. Closed native popovers remain UA-hidden. No Portal, Tabster, JavaScript positioner, navigation/selection shim or library polyfill is restored. The shared consumer loads the exact public focusgroup 1.6.0 polyfill only when needed and observes newly mounted groups. Consumer-controlled removal and focus restoration are explicit flow state, not library behavior. Story plays throw on failures and verify final report state/counts/geometry; trusted native acceptance covers browser focusgroup and Tab defaults separately. Reports reserve layout space, await fonts/finite pseudo-element animations, neutralize the pointer and refresh both public positioning handles after relocation. The only native maximum difference allowed is authored 80vh with exactly matching popup rectangles; no broad bounds exclusion or geometry tolerance is used. Field required/invalid/labels/descriptions apply to the query input; selection does not automatically serialize or satisfy required. Named hidden reviewer entries and resets in the native form example are consumer-owned. Arbitrary legacy custom style hooks are not called; unlayered consumer CSS overrides the layered foundation.',
      },
    },
  },
} satisfies Meta<typeof TagPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <TagPickerComparisonReport />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('tagpicker-report-pointer-rest'));
    for (const example of tagPickerExamples) {
      await userEvent.selectOptions(
        canvas.getByLabelText('TagPicker visual fixture'),
        example.name,
      );
      await assertTagPickerReport(canvasElement, example);
    }
    await userEvent.click(canvas.getByRole('button', { name: 'Refresh TagPicker report' }));
    await assertTagPickerReport(canvasElement, tagPickerExamples[tagPickerExamples.length - 1]);
  },
};

export const RTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <TagPickerComparisonReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const DefaultsOptOut: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} withComponentDefaults={false}>
      <TagPickerComparisonReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const ConsumerOverrides: Story = {
  render: () => <TagPickerComparisonReport examples={[tagPickerConsumerExample]} consumer />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('tagpicker-report-pointer-rest'));
    await assertTagPickerReport(canvasElement, tagPickerConsumerExample);
    await userEvent.click(canvas.getByRole('button', { name: 'Refresh TagPicker report' }));
    await assertTagPickerReport(canvasElement, tagPickerConsumerExample);
    const control = getComparisonTagPicker(canvasElement, 'headless');
    await expect(getComputedStyle(control).minWidth).toBe('280px');
    await expect(getComputedStyle(control).borderRadius).toBe('3px');
    await expect(getComputedStyle(getTagPickerTrigger(control)).color).toBe('rgb(90, 40, 130)');
  },
};

export const FilteringAndRemoval: Story = {
  render: () => <TagPickerSelectionFlow />,
  play: async ({ canvasElement }) => playTagPickerSelectionFlow(canvasElement),
};

export const GroupedSuggestions: Story = {
  render: () => <TagPickerSelectionFlow grouped />,
  play: async ({ canvasElement }) => playTagPickerSelectionFlow(canvasElement, true),
};

export const ControlledSelection: Story = {
  render: () => <TagPickerSelectionFlow />,
  play: async ({ canvasElement }) => playTagPickerControlledFlow(canvasElement),
};

export const SingleSelection: Story = {
  render: () => <TagPickerSelectionFlow single />,
  play: async ({ canvasElement }) => playTagPickerSingleFlow(canvasElement),
};

export const ButtonTrigger: Story = {
  render: () => <TagPickerSelectionFlow button />,
  play: async ({ canvasElement }) => playTagPickerButtonFlow(canvasElement),
};

export const NativeForms: Story = {
  render: () => <TagPickerNativeFormFlow />,
  play: async ({ canvasElement }) => playTagPickerNativeFormFlow(canvasElement),
};

export const CustomValues: Story = {
  render: () => <TagPickerCustomValuesFlow />,
  play: async ({ canvasElement }) => playTagPickerCustomValuesFlow(canvasElement),
};
