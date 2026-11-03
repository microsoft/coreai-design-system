// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { DropdownButton } from '@coreai-ds/react-headless-components';
import {
  DropdownSelectionFlow,
  dropdownButtonAppearances,
  dropdownButtonExamples,
  dropdownButtonShapes,
  pickerSizes,
} from './OptionPickerComparison.js';
import { OptionPickerComparisonReport } from './OptionPickerComparisonReport.js';
import { assertPickerReport } from './OptionPickerStoryPlay.js';

const meta = {
  title: 'Experiments/Headless DropdownButton',
  component: DropdownButton,
  args: { label: 'Sort by' },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'The CoreAI-specific DropdownButton is preserved, not silently mapped to a field appearance. It reuses the completed Fluent Button CSS on the Dropdown outer root, including five appearances and circular/rounded/square shapes. Selection and native overlay behavior come only from the current public Dropdown facade.',
      },
    },
  },
  argTypes: {
    appearance: { control: 'select', options: dropdownButtonAppearances },
    shape: { control: 'select', options: dropdownButtonShapes },
    size: { control: 'select', options: pickerSizes },
  },
} satisfies Meta<typeof DropdownButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <OptionPickerComparisonReport examples={dropdownButtonExamples} />,
  play: async ({ canvas, canvasElement }) => {
    await assertPickerReport(canvasElement, 'Default labelled button');
    await userEvent.selectOptions(
      canvas.getByRole('combobox', { name: 'Option-picker visual fixture' }),
      'Open button options',
    );
    await assertPickerReport(canvasElement, 'Open button options');
  },
};

export const Selection: Story = {
  args: { onOptionSelect: fn() },
  render: (args) => (
    <DropdownSelectionFlow
      variant="button"
      onOptionSelect={args.onOptionSelect}
      multiselect={args.multiselect}
      appearance={args.appearance}
      shape={args.shape}
      size={args.size}
      disabled={args.disabled}
      label={args.label}
    />
  ),
  play: async ({ args, canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Project access' });
    await userEvent.click(trigger);
    await userEvent.click(canvas.getByRole('option', { name: 'Gamma' }));
    await expect(args.onOptionSelect).toHaveBeenLastCalledWith(expect.anything(), {
      optionValue: 'gamma',
      optionText: 'Gamma',
      selectedOptions: ['gamma'],
    });
    await expect(trigger).toHaveTextContent(`${args.label}Gamma`);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear selection' }));
    await expect(canvas.getByRole('status', { name: 'Selected access' })).toBeEmptyDOMElement();
    await expect(trigger).toHaveTextContent(args.label);
  },
};
