// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { CompoundButton } from '@coreai-ds/react-headless-components';
import {
  CompoundButtonComparison,
  compoundButtonConsumerExample,
  buttonVariantAppearances,
  buttonVariantSizes,
  buttonVariantShapes,
} from './ButtonVariantsComparison.js';
import { ButtonVariantsReport } from './ButtonVariantsReport.js';
import { CompoundButtonFlow } from './ButtonVariantsFlows.js';

const meta = {
  title: 'Experiments/Headless CompoundButton',
  component: CompoundButton,
  parameters: { layout: 'padded' },
  argTypes: {
    appearance: { control: 'select', options: buttonVariantAppearances },
    size: { control: 'select', options: buttonVariantSizes },
    shape: { control: 'select', options: buttonVariantShapes },
  },
} satisfies Meta<typeof CompoundButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => (
    <ButtonVariantsReport family="compound">
      <CompoundButtonComparison />
    </ButtonVariantsReport>
  ),
};

export const ConsumerOverrides: Story = {
  render: () => (
    <ButtonVariantsReport family="compound" consumer>
      <CompoundButtonComparison examples={[compoundButtonConsumerExample]} />
    </ButtonVariantsReport>
  ),
};

export const NativeSubmission: Story = {
  render: () => <CompoundButtonFlow />,
  play: async ({ canvas }) => {
    await userEvent.clear(canvas.getByRole('textbox', { name: 'Release' }));
    await userEvent.type(canvas.getByRole('textbox', { name: 'Release' }), 'v3');
    await userEvent.click(canvas.getByRole('button', { name: 'Create release' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Submitted release: v3');
    await expect(
      canvas.getByRole('button', { name: 'Delete release Requires approval' }),
    ).toBeDisabled();
  },
};

export const Playground: Story = {
  args: { children: 'Create release', secondaryContent: 'Deploy changes', appearance: 'secondary' },
};
