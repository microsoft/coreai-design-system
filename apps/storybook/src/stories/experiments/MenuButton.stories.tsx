// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { MenuButton } from '@coreai-ds/react-headless-components';
import {
  MenuButtonComparison,
  menuButtonConsumerExample,
  buttonVariantAppearances,
  buttonVariantSizes,
  buttonVariantShapes,
} from './ButtonVariantsComparison.js';
import { ButtonVariantsReport } from './ButtonVariantsReport.js';
import { MenuButtonFlow } from './ButtonVariantsFlows.js';

const meta = {
  title: 'Experiments/Headless MenuButton',
  component: MenuButton,
  parameters: { layout: 'padded' },
  argTypes: {
    appearance: { control: 'select', options: buttonVariantAppearances },
    size: { control: 'select', options: buttonVariantSizes },
    shape: { control: 'select', options: buttonVariantShapes },
  },
} satisfies Meta<typeof MenuButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => (
    <ButtonVariantsReport family="menu">
      <MenuButtonComparison />
    </ButtonVariantsReport>
  ),
};

export const ConsumerOverrides: Story = {
  render: () => (
    <ButtonVariantsReport family="menu" consumer>
      <MenuButtonComparison examples={[menuButtonConsumerExample]} />
    </ButtonVariantsReport>
  ),
};

export const NativeMenuActivation: Story = {
  render: () => <MenuButtonFlow />,
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Release actions' });
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(await canvas.findByRole('menuitem', { name: 'Inspect release' }));
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Last action: Inspect release; requested open: false',
    );
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Escape}');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

export const Playground: Story = {
  args: { children: 'Release actions' },
};
