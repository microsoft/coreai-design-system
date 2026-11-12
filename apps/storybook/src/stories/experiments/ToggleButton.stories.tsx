// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { ToggleButton } from '@coreai-ds/react-headless-components';
import {
  ToggleButtonComparison,
  toggleButtonConsumerExample,
  buttonVariantAppearances,
  buttonVariantSizes,
  buttonVariantShapes,
} from './ButtonVariantsComparison.js';
import { ButtonVariantsReport } from './ButtonVariantsReport.js';
import { ToggleButtonFlow } from './ButtonVariantsFlows.js';

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless ToggleButton',
  component: ToggleButton,
  parameters: { layout: 'padded' },
  argTypes: {
    appearance: { control: 'select', options: buttonVariantAppearances },
    size: { control: 'select', options: buttonVariantSizes },
    shape: { control: 'select', options: buttonVariantShapes },
  },
} satisfies Meta<typeof ToggleButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => (
    <ButtonVariantsReport family="toggle">
      <ToggleButtonComparison />
    </ButtonVariantsReport>
  ),
};

export const ConsumerOverrides: Story = {
  render: () => (
    <ButtonVariantsReport family="toggle" consumer>
      <ToggleButtonComparison examples={[toggleButtonConsumerExample]} />
    </ButtonVariantsReport>
  ),
};

export const ControlledAndDefaultChecked: Story = {
  render: () => <ToggleButtonFlow />,
  play: async ({ canvas }) => {
    const controlled = canvas.getByRole('button', { name: 'Pin release' });
    const uncontrolled = canvas.getByRole('button', { name: 'Follow release' });
    await expect(controlled).toHaveAttribute('aria-pressed', 'false');
    await expect(uncontrolled).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(controlled);
    await expect(controlled).toHaveAttribute('aria-pressed', 'true');
    uncontrolled.focus();
    await userEvent.keyboard(' ');
    await expect(uncontrolled).toHaveAttribute('aria-pressed', 'false');
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Controlled pin: on; follow activations: 1',
    );
    await expect(canvas.getByRole('button', { name: 'Locked setting' })).toBeDisabled();
  },
};

export const Playground: Story = {
  args: { children: 'Pin release', isAccessible: true },
};
