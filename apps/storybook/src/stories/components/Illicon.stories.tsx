// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Illicon, type IlliconSize } from '@coreai-ds/react-components';
import {
  Brain24Filled,
  Cube24Filled,
  Database24Filled,
  Heart24Filled,
  Rocket24Filled,
  Shield24Filled,
  Star24Filled,
} from '@fluentui/react-icons';
import type { Meta, StoryObj } from '@storybook/react-vite';

const iconOptions = {
  Brain: Brain24Filled,
  Cube: Cube24Filled,
  Database: Database24Filled,
  Heart: Heart24Filled,
  Rocket: Rocket24Filled,
  Shield: Shield24Filled,
  Star: Star24Filled,
};
const exampleSizes: IlliconSize[] = [48, 96, 100, 140, 192];

type IlliconStoryProps = Omit<React.ComponentProps<typeof Illicon>, 'icon'> & {
  icon: keyof typeof iconOptions;
};

/**
 * `Illicon` turns a filled Fluent icon or SVG element into a dotted
 * illustration. It samples the original paths at the requested output size
 * and renders fixed 2px dots with 3px gaps, inheriting color through
 * `currentColor`. Use the Controls panel to choose an icon and size.
 */
export const Default: StoryObj<IlliconStoryProps> = {
  args: {
    icon: 'Rocket',
    size: 100,
    'aria-label': 'Dotted illustration',
  },
  argTypes: {
    icon: {
      description: 'SVG or Fluent Filled icon to render as a dotted illustration.',
      control: 'select',
      options: Object.keys(iconOptions),
    },
    size: {
      description: 'Width in pixels. Defaults to 100; smaller sizes may lose detail.',
      control: 'select',
      options: exampleSizes,
    },
  },
  parameters: {
    controls: { disable: false, include: ['icon', 'size'] },
  },
  render: ({ icon, ...args }: IlliconStoryProps) => <Illicon {...args} icon={iconOptions[icon]} />,
};

/**
 * Converts a filled icon or SVG into a single-color dotted illustration,
 * preserving aspect ratio with fixed 2px dots and 3px gaps.
 * Prefer Fluent Filled icons. Custom SVGs require static, flattened filled
 * paths without strokes, transforms, or effects. See IlliconProps for details.
 *
 * @summary Converts a filled Fluent icon into a dotted illustration.
 */
export default {
  title: 'Components/Illicon',
  component: Illicon,
} satisfies Meta<typeof Illicon>;
