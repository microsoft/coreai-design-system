// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { SplitButton } from '@coreai-ds/react-headless-components';
import {
  SplitButtonComparison,
  splitButtonConsumerExample,
  buttonVariantAppearances,
  buttonVariantSizes,
  buttonVariantShapes,
} from './ButtonVariantsComparison.js';
import { ButtonVariantsReport } from './ButtonVariantsReport.js';
import { SplitButtonFlow } from './ButtonVariantsFlows.js';

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless SplitButton',
  component: SplitButton,
  parameters: { layout: 'padded' },
  argTypes: {
    appearance: { control: 'select', options: buttonVariantAppearances },
    size: { control: 'select', options: buttonVariantSizes },
    shape: { control: 'select', options: buttonVariantShapes },
  },
} satisfies Meta<typeof SplitButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => (
    <ButtonVariantsReport family="split">
      <SplitButtonComparison />
    </ButtonVariantsReport>
  ),
};

export const ConsumerOverrides: Story = {
  render: () => (
    <ButtonVariantsReport family="split" consumer>
      <SplitButtonComparison examples={[splitButtonConsumerExample]} />
    </ButtonVariantsReport>
  ),
};

export const IndependentActions: Story = {
  render: () => <SplitButtonFlow />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Deploy release' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Deployments: 1; last action: None');
    const menu = canvas.getByRole('button', { name: 'More deployment options' });
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(menu);
    await userEvent.click(await canvas.findByRole('menuitem', { name: 'Schedule deployment' }));
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Deployments: 1; last action: Schedule deployment',
    );
  },
};

export const Playground: Story = {
  args: { children: 'Deploy release', appearance: 'primary' },
};
