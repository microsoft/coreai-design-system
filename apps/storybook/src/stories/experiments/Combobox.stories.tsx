// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { CoreAIFluentProvider } from '@coreai-ds/react-components';
import { Combobox } from '@coreai-ds/react-headless-components';
import {
  ComboboxQueryFlow,
  OptionPickerFormFlow,
  comboboxExamples,
  pickerAppearances,
  pickerConsumerExample,
  pickerSizes,
} from './OptionPickerComparison.js';
import { OptionPickerComparisonReport } from './OptionPickerComparisonReport.js';
import { assertPickerReport } from './OptionPickerStoryPlay.js';
import { getComparisonPicker, getPickerTrigger } from './compareOptionPickerStyles.js';

const meta = {
  title: 'Experiments/Headless Combobox',
  component: Combobox,
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'Current public headless Combobox, Listbox, Option and OptionGroup behavior with ported Fluent 9.17.7 CSS and CoreAI inline labels. Native popovers/CSS anchors replace Portal positioning. Current input slots are props objects: no void-input render-function children or legacy input fallback is added.',
      },
    },
  },
  argTypes: {
    appearance: { control: 'select', options: pickerAppearances },
    size: { control: 'select', options: pickerSizes },
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <OptionPickerComparisonReport examples={comboboxExamples} />,
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
      <OptionPickerComparisonReport examples={comboboxExamples.slice(0, 2)} />
    </CoreAIFluentProvider>
  ),
  play: async ({ canvasElement }) => {
    await assertPickerReport(canvasElement, 'Default');
    await expect(getComparisonPicker(canvasElement, 'headless')).toHaveAttribute(
      'data-appearance',
      'filled-darker',
    );
  },
};

export const RTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <OptionPickerComparisonReport
        examples={comboboxExamples.filter((example) =>
          ['outline, small', 'Inline label with value', 'Clearable selection'].includes(
            example.name,
          ),
        )}
      />
    </CoreAIFluentProvider>
  ),
  play: async ({ canvasElement }) => assertPickerReport(canvasElement, 'outline, small'),
};

export const ConsumerOverrides: Story = {
  render: () => (
    <OptionPickerComparisonReport examples={[pickerConsumerExample('combobox')]} consumer />
  ),
  play: async ({ canvasElement }) => {
    const report = canvasElement.querySelector('[data-picker-report-state]');
    if (!(report instanceof HTMLOutputElement)) throw new Error('Missing consumer report');
    await waitFor(async () => expect(report).toHaveAttribute('data-picker-report-state', 'ready'));
    const root = getComparisonPicker(canvasElement, 'headless');
    await expect(getComputedStyle(root).minWidth).toBe('300px');
    await expect(getComputedStyle(root).borderRadius).toBe('3px');
    await expect(getComputedStyle(getPickerTrigger(root)).paddingInlineStart).toBe('18px');
  },
};

export const QueryAndSelection: Story = {
  args: { onChange: fn(), onOptionSelect: fn() },
  render: (args) => <ComboboxQueryFlow {...args} />,
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('combobox', { name: 'Find a project' });
    await userEvent.click(input);
    await userEvent.type(input, 'Gam');
    await expect(args.onChange).toHaveBeenCalledTimes(3);
    await expect(canvas.getByRole('option', { name: 'Gamma' })).toBeVisible();
    await expect(canvas.queryByRole('option', { name: 'Alpha' })).toBeNull();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(args.onOptionSelect).toHaveBeenLastCalledWith(expect.anything(), {
      optionValue: 'gamma',
      optionText: 'Gamma',
      selectedOptions: ['gamma'],
    });
    await expect(input).toHaveValue('Gamma');
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.getByRole('status', { name: 'Selected project' })).toHaveTextContent(
      'gamma',
    );
    await userEvent.keyboard('{ArrowDown}{Escape}');
    await expect(input).toHaveFocus();
    await expect(input).toHaveAttribute('aria-expanded', 'false');
  },
};

export const FreeformAndEmptyResults: Story = {
  args: { freeform: true, onChange: fn(), onOptionSelect: fn() },
  render: (args) => <ComboboxQueryFlow {...args} />,
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('combobox', { name: 'Find a project' });
    await userEvent.click(input);
    await userEvent.type(input, 'Unlisted');
    await expect(canvas.getByRole('option', { name: 'No matching projects' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await userEvent.keyboard('{Escape}');
    await userEvent.click(canvas.getByRole('button', { name: 'After project query' }));
    await expect(input).toHaveValue('Unlisted');
    await expect(args.onChange).toHaveBeenCalledTimes(8);
    await expect(args.onOptionSelect).not.toHaveBeenCalled();
  },
};

export const NativeFormBoundaries: Story = {
  render: () => <OptionPickerFormFlow />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox', { name: 'Project name' });
    const dropdown = canvas.getByRole('combobox', { name: 'Access preset' });
    await expect(input).toBeRequired();
    await expect(dropdown).toHaveAttribute('aria-required', 'true');
    await userEvent.click(canvas.getByRole('button', { name: 'Save preferences' }));
    await expect(canvas.getByRole('status', { name: 'Submitted preferences' })).toHaveTextContent(
      '[["project","Alpha"]]',
    );
    await userEvent.click(input);
    await userEvent.keyboard('{End}{Enter}');
    await expect(input).toHaveValue('Delta');
    await userEvent.click(canvas.getByRole('button', { name: 'Reset native form' }));
    await expect(input).toHaveValue('Delta');
    await expect(dropdown).toHaveTextContent('Gamma');
  },
};
