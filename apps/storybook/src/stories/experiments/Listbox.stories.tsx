// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { Listbox } from '@coreai-ds/react-headless-components';
import { listboxExamples, StandaloneListboxFlow } from './OptionPickerComparison.js';
import { OptionPickerComparisonReport } from './OptionPickerComparisonReport.js';
import { assertPickerReport } from './OptionPickerStoryPlay.js';

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless Listbox',
  component: Listbox,
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'Shared Listbox/Option/OptionGroup CSS and current public context hooks. Native popup listboxes retain the facade auto-popover default and UA closed hiding. These standalone fixtures use native showPopover() refs and fixture-owned CSS anchors; the published API has no popover prop. No component fallback or second keyboard/selection model is added.',
      },
    },
  },
} satisfies Meta<typeof Listbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <OptionPickerComparisonReport examples={listboxExamples} />,
  play: async ({ canvas, canvasElement }) => {
    await assertPickerReport(canvasElement, 'Single selection');
    await userEvent.selectOptions(
      canvas.getByRole('combobox', { name: 'Option-picker visual fixture' }),
      'Grouped options',
    );
    await assertPickerReport(canvasElement, 'Grouped options');
  },
};

export const KeyboardAndGroups: Story = {
  args: { onOptionSelect: fn() },
  render: (args) => <StandaloneListboxFlow {...args} />,
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open project list' }));
    const listbox = canvas.getByRole('listbox', { name: 'Project catalog' });
    await expect(canvas.getByRole('group', { name: 'Available' })).toBeVisible();
    await expect(listbox).toHaveFocus();
    await userEvent.keyboard('{End}{Enter}');
    await expect(args.onOptionSelect).toHaveBeenLastCalledWith(expect.anything(), {
      optionValue: 'delta',
      optionText: 'Delta',
      selectedOptions: ['delta'],
    });
    await expect(canvas.getByRole('option', { name: 'Delta' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'After project list' })).toHaveFocus();
  },
};
