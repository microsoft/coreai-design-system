// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { withHeadlessProvider } from './ComparisonProvider.js';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { Calendar } from '@coreai-ds/react-headless-components';

const today = new Date(2026, 7, 12);

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless Calendar',
  component: Calendar,
  parameters: { layout: 'padded', throwPlayFunctionExceptions: true },
  argTypes: {
    dateRangeType: { control: 'select', options: ['day', 'week', 'workWeek', 'month'] },
    layout: { control: 'select', options: ['sideBySide', 'overlay'] },
    firstDayOfWeek: { control: { type: 'number', min: 0, max: 6 } },
  },
  args: { today },
} satisfies Meta<typeof Calendar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: { onSelectDate: fn() },
};

export const KeyboardSelection: Story = {
  args: { onSelectDate: fn() },
  play: async ({ args, canvas }) => {
    const day = canvas.getByRole('button', { name: 'August 12, 2026' }).closest('td')!;
    await expect(day).toHaveAttribute('tabindex', '0');
    day.focus();
    await userEvent.keyboard('{ArrowDown}');
    const next = canvas.getByRole('button', { name: 'August 19, 2026' }).closest('td')!;
    await expect(next).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(next).toHaveAttribute('data-selected');
    await expect(args.onSelectDate).toHaveBeenCalledTimes(1);
  },
};

export const WeekRange: Story = {
  args: { dateRangeType: 'week', value: new Date(2026, 7, 12) },
};

export const OverlayWithWeekNumbers: Story = {
  args: { layout: 'overlay', showWeekNumbers: true, goToTodayButton: null },
};

export const Bounded: Story = {
  args: {
    minDate: new Date(2026, 7, 5),
    maxDate: new Date(2026, 7, 25),
  },
};

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<Date | undefined>(today);
    return (
      <div>
        <Calendar {...args} value={value} onSelectDate={(_, data) => setValue(data.date)} />
        <p role="status">Selected: {value?.toDateString() ?? 'none'}</p>
      </div>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'August 20, 2026' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Thu Aug 20 2026');
  },
};
