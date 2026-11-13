// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Illicon, tokens, type IlliconProps } from '@coreai-ds/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  IlliconSourceComparison,
  type IlliconSourceComparisonProps,
} from '../../illicons/IlliconSourceComparison';

/**
 * Recreates catalog concepts from native 20px Fluent source icons at 2x by default.
 * This is the recommended standard; other size and scale choices are verification controls.
 * The native-size selector switches actual Fluent variants between 16, 20, and 24px.
 * Shows the original SVG, source icon, actual sampling canvas before threshold,
 * and sampled grid without replacing assets. Canvas pixels are enlarged without
 * smoothing to make partial alpha coverage visible.
 * Beaker and Workflows are tentative; Cube and Shield omit designer modifications.
 * Custom logos remain original-only. Code is a new Filled illustration.
 *
 * @summary Verification only: compare Fluent source recreations with original artwork.
 */
export const SourceRecreationDev: StoryObj<IlliconSourceComparisonProps> = {
  tags: ['!manifest'],
  args: { nativeSize: 20, multiplier: 2, radius: 1, pitch: 5 },
  argTypes: {
    nativeSize: {
      description: 'Select the actual native Fluent icon variant, not a resized version.',
      control: 'select',
      options: [16, 20, 24],
    },
    multiplier: { control: 'select', options: [1, 2, 3, 4] },
    radius: { control: { type: 'range', min: 0.5, max: 2, step: 0.5 } },
    pitch: { control: { type: 'range', min: 4, max: 12, step: 1 } },
  },
  parameters: {
    layout: 'fullscreen',
    fullBleed: true,
    controls: { disable: false, include: ['nativeSize', 'multiplier', 'radius', 'pitch'] },
  },
  render: (args: IlliconSourceComparisonProps) => <IlliconSourceComparison {...args} />,
};

/**
 * Verifies that an all-zero grid keeps its artboard. The consumer outline
 * makes the otherwise invisible bounds observable.
 *
 * @summary Verification only: empty occupancy retains its dimensions.
 */
export const EmptyGridDev: StoryObj<typeof Illicon> = {
  tags: ['!manifest'],
  args: {
    data: { rows: ['0000', '0000'] },
    style: { outline: `1px solid ${tokens.colorNeutralStroke2}` },
  },
  render: (args: IlliconProps) => <Illicon {...args} />,
};

/**
 * Verifies preservation of irregular circles, paths, opacity, and mixed SVG
 * geometry without sampling. currentColor follows the active theme.
 *
 * @summary Verification only: custom hybrid SVG geometry and themed paint.
 */
export const CustomSvgDev: StoryObj<typeof Illicon> = {
  tags: ['!manifest'],
  args: {
    size: 140,
    'aria-label': 'Custom hybrid illustration',
    children: (
      <svg viewBox="0 0 40 20" fill="currentColor">
        <circle cx="4.25" cy="5.75" r="1.25" />
        <circle cx="8.5" cy="12.25" r="2" />
        <path d="M14 4h12v12H14z" fill="none" stroke="currentColor" />
        <rect x="30" y="4" width="6" height="12" rx="1" opacity=".5" />
      </svg>
    ),
  },
  render: (args: IlliconProps) => <Illicon {...args} />,
};

export default {
  title: 'Components/Illicon',
  component: Illicon,
} satisfies Meta<typeof Illicon>;
