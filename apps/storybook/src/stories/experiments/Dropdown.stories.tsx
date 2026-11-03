// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { CoreAIFluentProvider } from '@coreai-ds/react-components';
import { Dropdown } from '@coreai-ds/react-headless-components';
import {
  DropdownSelectionFlow,
  dropdownExamples,
  pickerAppearances,
  pickerSizes,
} from './OptionPickerComparison.js';
import { OptionPickerComparisonReport } from './OptionPickerComparisonReport.js';
import { assertPickerReport } from './OptionPickerStoryPlay.js';

const meta = {
  title: 'Experiments/Headless Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'Private migration of the actual CoreAI Dropdown wrapper. Native popup state, selection, type-to-find, active descendants, and exact callbacks remain in the public facade; only current appearance/size and inline-label visuals are supplied here.',
      },
    },
  },
  argTypes: {
    appearance: { control: 'select', options: pickerAppearances },
    size: { control: 'select', options: pickerSizes },
  },
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <OptionPickerComparisonReport examples={dropdownExamples} />,
  play: async ({ canvas, canvasElement }) => {
    await assertPickerReport(canvasElement, 'Default');
    await userEvent.selectOptions(
      canvas.getByRole('combobox', { name: 'Option-picker visual fixture' }),
      'Open grouped options',
    );
    await assertPickerReport(canvasElement, 'Open grouped options');
  },
};

export const DefaultsOptOut: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} withComponentDefaults={false}>
      <OptionPickerComparisonReport examples={dropdownExamples.slice(0, 2)} />
    </CoreAIFluentProvider>
  ),
  play: async ({ canvasElement }) => assertPickerReport(canvasElement, 'Default'),
};

export const RTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <OptionPickerComparisonReport
        examples={dropdownExamples.filter((example) =>
          ['outline, small', 'Inline label with value', 'Clearable inline selection'].includes(
            example.name,
          ),
        )}
      />
    </CoreAIFluentProvider>
  ),
  play: async ({ canvasElement }) => assertPickerReport(canvasElement, 'outline, small'),
};

export const KeyboardSelection: Story = {
  args: { onOptionSelect: fn() },
  render: (args) => (
    <DropdownSelectionFlow
      multiselect={args.multiselect}
      onOptionSelect={args.onOptionSelect}
      button={args.button}
      appearance={args.appearance}
      size={args.size}
      disabled={args.disabled}
      label={args.label}
    />
  ),
  play: async ({ args, canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Project access' });
    await userEvent.click(canvas.getByRole('button', { name: 'Before project access' }));
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{End}{Enter}');
    await expect(args.onOptionSelect).toHaveBeenLastCalledWith(expect.anything(), {
      optionValue: 'delta',
      optionText: 'Delta',
      selectedOptions: ['delta'],
    });
    await expect(trigger).toHaveTextContent('Delta');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear selection' }));
    await expect(args.onOptionSelect).toHaveBeenLastCalledWith(expect.anything(), {
      optionValue: undefined,
      optionText: undefined,
      selectedOptions: [],
    });
    await expect(trigger).toHaveFocus();
    await expect(canvas.getByRole('status', { name: 'Selected access' })).toBeEmptyDOMElement();
  },
};

export const Multiselect: Story = {
  args: { multiselect: true, onOptionSelect: fn() },
  render: (args) => (
    <DropdownSelectionFlow
      multiselect={args.multiselect}
      onOptionSelect={args.onOptionSelect}
      button={args.button}
      appearance={args.appearance}
      size={args.size}
      disabled={args.disabled}
      label={args.label}
    />
  ),
  play: async ({ args, canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Project access' });
    await userEvent.click(trigger);
    await userEvent.click(canvas.getByRole('menuitemcheckbox', { name: 'Alpha' }));
    await userEvent.click(canvas.getByRole('menuitemcheckbox', { name: 'Gamma' }));
    await expect(args.onOptionSelect).toHaveBeenLastCalledWith(expect.anything(), {
      optionValue: 'gamma',
      optionText: 'Gamma',
      selectedOptions: ['alpha', 'gamma'],
    });
    await expect(canvas.getByRole('menuitemcheckbox', { name: 'Alpha' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(canvas.getByRole('menuitemcheckbox', { name: 'Beta' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(trigger).toHaveTextContent('Alpha, Gamma');
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'After project access' })).toHaveFocus();
  },
};
