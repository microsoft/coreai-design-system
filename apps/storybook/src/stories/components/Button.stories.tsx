// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { StoryObj } from '@storybook/react-vite';
import { figmaDesign } from '../../utils/figma';
import { Button, Text } from '@coreai-ds/react-components';

export const Default: StoryObj = {
  render: () => <Button>Example</Button>,
};

/** Demonstrates each available button shape. */
export const Shape: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: '15px' }}>
      <Button shape="rounded">Rounded</Button>
      <Button shape="circular">Circular</Button>
      <Button shape="square">Square</Button>
    </div>
  ),
};

export const SubtleContentAlignment: StoryObj = {
  render: () => {
    const styles = /* css */ `
      .button-example__aligned-action {
        margin-inline: calc(-1 * var(--spacingHorizontalS));
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <Text as="h2" block preset="heading4" foreground={1}>
          Aligning subtle button content to surrounding text
        </Text>
        <Text as="p" block>
          Subtle and transparent buttons keep the same horizontal padding as filled buttons, so
          their visible content sits inset from surrounding text. A matching negative inline margin
          optically aligns the button's content to this paragraph's edge while keeping the full
          padded hit target for click and focus.
        </Text>
        <Button appearance="subtle" size="small" className="button-example__aligned-action">
          Aligned action
        </Button>
      </>
    );
  },
};

/**
 * A button triggers an action or event when activated.
 *
 * @summary Triggers an action or event when activated.
 */
export default {
  title: 'Components/Button/Button',
  component: Button,
  parameters: { ...figmaDesign('Button') },
};
