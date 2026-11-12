// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { withHeadlessProvider } from './ComparisonProvider.js';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { DatePicker } from '@coreai-ds/react-headless-components';

const today = new Date(2026, 7, 12);

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless DatePicker',
  component: DatePicker,
  parameters: { layout: 'padded', throwPlayFunctionExceptions: true },
  argTypes: {
    appearance: {
      control: 'select',
      options: ['outline', 'underline', 'filled-darker', 'filled-lighter'],
    },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
  },
  args: { today, 'aria-label': 'Due date' },
} satisfies Meta<typeof DatePicker>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { onDateChange: fn(), onOpenChange: fn() },
};

export const Appearances: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 12, maxWidth: 320 }}>
      {(['outline', 'underline', 'filled-darker', 'filled-lighter'] as const).map((appearance) => (
        <DatePicker
          key={appearance}
          today={today}
          appearance={appearance}
          aria-label={appearance}
        />
      ))}
      <DatePicker today={today} size="small" aria-label="Small" />
      <DatePicker today={today} size="large" aria-label="Large" />
      <DatePicker today={today} disabled aria-label="Disabled" />
    </div>
  ),
};

export const KeyboardSelection: Story = {
  args: { onDateChange: fn() },
  play: async ({ args, canvas }) => {
    const trigger = canvas.getByRole('button', { name: /Due date/ });
    trigger.focus();
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}');
    const day = canvas.getByRole('button', { name: 'August 12, 2026' }).closest('td')!;
    await waitFor(() => expect(day).toHaveFocus());
    await userEvent.keyboard('{ArrowRight}{Enter}');
    await expect(args.onDateChange).toHaveBeenCalledTimes(1);
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveTextContent('August 13, 2026');
  },
};

export const EscapeReturnsFocus: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /Due date/ });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toHaveFocus();
  },
};

export const TextInput: Story = {
  args: { allowTextInput: true, onDateChange: fn() },
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('combobox', { name: 'Due date' });
    await userEvent.click(input);
    await userEvent.keyboard('not a date{Enter}');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await userEvent.clear(input);
    await userEvent.keyboard('2026-08-20{Enter}');
    await expect(input).toHaveValue('August 20, 2026');
    await expect(args.onDateChange).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ value: new Date(2026, 7, 20) }),
    );
  },
};

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<Date | null>(null);
    return (
      <div style={{ display: 'grid', gap: 8, maxWidth: 320 }}>
        <DatePicker {...args} value={value} onDateChange={(_, data) => setValue(data.value)} />
        <p role="status">Selected: {value?.toDateString() ?? 'none'}</p>
      </div>
    );
  },
};

export const WithGoToTodayAndBounds: Story = {
  args: {
    showGoToToday: true,
    minDate: new Date(2026, 7, 3),
    maxDate: new Date(2026, 8, 20),
  },
};
