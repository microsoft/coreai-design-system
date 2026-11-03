// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { ComparisonProvider as CoreAIFluentProvider } from './ComparisonProvider.js';
import { Field, Input } from '@coreai-ds/react-headless-components';
import {
  FieldComparisonWithReport,
  FieldFormFlow,
  fieldConsumerExample,
  fieldExamples,
  fieldSizes,
  fieldValidationStates,
} from './FieldComparison.js';
import {
  captureFieldStyles,
  compareFieldStyles,
  getComparisonField,
} from './compareFieldStyles.js';

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless Field',
  component: Field,
  args: { label: 'Project name', children: <Input /> },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'Private Field migration: public headless 0.3.2 hook/context/renderer, react-field 9.5.6 visuals, and the completed Label foundation. CoreAI has no Field defaults or style overrides. The real installed error glyph is DiamondDismiss12Filled despite older prop documentation naming ErrorCircle. Visual size/orientation are stripped before the hook and included in its current context values. The control owns disabled/native validation behavior; there is no Field.disabled prop. RadioGroup receives aria-required from Field, but needs its own required prop for native radio validity. Render-function controls receive aria-required, not an invented native required mapping. No second control state, compatibility provider, focus polyfill, or overlay machinery is added. The form example composes completed Input, Select, RadioGroup, Checkbox, Switch, InfoLabel and native forms.',
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: fieldSizes },
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
    validationState: { control: 'select', options: fieldValidationStates },
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <FieldComparisonWithReport />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('field-pointer-rest'));
    await waitFor(
      async () => {
        const report = canvas.getByRole('status', { name: 'Field style report' });
        await expect(report).toHaveAttribute('data-field-report-state', 'ready');
        await expect(report).toHaveAttribute(
          'data-field-fixture-count',
          String(fieldExamples.length),
        );
        await expect(report).toHaveAttribute('data-field-unexpected-count', '0');
      },
      { timeout: 10000 },
    );
    for (const row of canvasElement.querySelectorAll('[data-field-case]')) {
      const legacy = getComparisonField(row, 'legacy');
      const headless = getComparisonField(row, 'headless');
      await expect(
        compareFieldStyles(captureFieldStyles(legacy), captureFieldStyles(headless)),
      ).toEqual([]);
      await expect(headless.root.getBoundingClientRect().width).toBe(340);
      await expect(headless.root.getBoundingClientRect().height).toBeGreaterThan(0);
    }
  },
};

export const RTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <FieldComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const DefaultsOptOut: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} withComponentDefaults={false}>
      <FieldComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const ConsumerOverrides: Story = {
  render: () => <FieldComparisonWithReport examples={[fieldConsumerExample]} consumer />,
  play: async ({ canvas, canvasElement }) => {
    await waitFor(
      async () => {
        await expect(canvas.getByRole('status', { name: 'Field style report' })).toHaveAttribute(
          'data-field-report-state',
          'ready',
        );
      },
      { timeout: 10000 },
    );
    const field = getComparisonField(canvasElement, 'headless');
    await expect(getComputedStyle(field.root).rowGap).toBe('9px');
    await expect(field.validationMessage).not.toBeNull();
    if (!field.validationMessage) throw new Error('Missing consumer validation message');
    await expect(getComputedStyle(field.validationMessage).color).toBe('rgb(20, 90, 60)');
  },
};

export const ValidationAndHelpForm: Story = {
  render: () => <FieldFormFlow />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save project' }));
    await expect(canvas.getByRole('alert')).toHaveTextContent('Enter a project name.');
    const input = canvas.getByRole('textbox', { name: 'Project name' });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await userEvent.type(input, 'Atlas');
    await expect(canvas.getByRole('status', { name: 'Project change count' })).toHaveTextContent(
      '5',
    );
    await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Region' }), 'east');
    await userEvent.click(canvas.getByRole('radio', { name: 'Editor' }));
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Reviewed' }));
    await userEvent.click(canvas.getByRole('switch', { name: 'Notifications' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Project name information' }));
    await waitFor(async () => {
      const note = canvas.getByRole('note');
      await expect(note).toHaveFocus();
      await expect(note).toHaveTextContent('Use the project name your team recognizes.');
      await expect(note.matches(':popover-open')).toBe(true);
    });
    // Synthetic Escape cannot run the browser's native popover default action.
    canvas.getByRole('note').hidePopover();
    await waitFor(async () => {
      await expect(canvas.queryByRole('note')).toBeNull();
    });
    await userEvent.click(canvas.getByRole('button', { name: 'Save project' }));
    await expect(canvas.getByRole('status', { name: 'Project submission' })).toHaveTextContent(
      '{"project":"Atlas","region":"east","access":"editor","reviewed":"yes","notifications":"yes"}',
    );
    await expect(canvas.getByRole('textbox', { name: 'Directory identifier' })).toBeDisabled();
  },
};
