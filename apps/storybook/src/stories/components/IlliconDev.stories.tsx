// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Illicon, tokens, type IlliconProps } from '@coreai-ds/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';

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
