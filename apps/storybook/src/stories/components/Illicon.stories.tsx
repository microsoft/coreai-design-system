// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Illicon, tokens } from '@coreai-ds/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Renders saved occupancy without converting an icon at runtime. Radius and
 * pitch change the circles, not the saved cells. SVG units map 1:1 to CSS pixels.
 */
export const Default: StoryObj<typeof Illicon> = {
  args: {
    data: {
      rows: [
        '0000000000',
        '0011001100',
        '0111111110',
        '0111111110',
        '0011111100',
        '0001111000',
        '0000110000',
        '0000000000',
      ],
    },
    radius: 1,
    pitch: 5,
    'aria-label': 'Heart illustration',
  },
  argTypes: {
    radius: { control: { type: 'range', min: 0.5, max: 2, step: 0.5 } },
    pitch: { control: { type: 'range', min: 4, max: 12, step: 1 } },
  },
  parameters: {
    controls: { disable: false, include: ['radius', 'pitch'] },
  },
  render: (args) => <Illicon {...args} />,
};

/**
 * Empty rows and columns still occupy space. The outline shows the retained
 * artboard; it is a consumer style, not part of the illustration.
 */
export const EmptyGrid: StoryObj<typeof Illicon> = {
  args: {
    data: { rows: ['0000', '0000'] },
    style: { outline: `1px solid ${tokens.colorNeutralStroke2}` },
  },
  render: (args) => <Illicon {...args} />,
};

/**
 * Custom SVG is not sampled or rewritten. It can mix irregular circles,
 * paths, and other shapes. currentColor follows the theme; explicit paint stays.
 */
export const CustomSvg: StoryObj<typeof Illicon> = {
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
  render: (args) => <Illicon {...args} />,
};

/**
 * Renders saved dot-grid data as circles or displays custom inline SVG artwork.
 * Grid data contains only equal-length rows of 0s and 1s, including empty borders.
 * Convert source icons separately with iconToDotGrid, then save or reuse the data.
 * Radius defaults to 1 CSS pixel and pitch to 5. Grid dimensions follow cells times pitch.
 * Whole-pixel diameter and pitch align dot bounds to integer coordinates. Custom SVG alone supports size.
 * Supply aria-label or aria-labelledby for meaningful images, or leave decorative.
 *
 * @summary Theme-aware dot-grid and custom SVG illustrations.
 */
export default {
  title: 'Components/Illicon',
  component: Illicon,
} satisfies Meta<typeof Illicon>;
