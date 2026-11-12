// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type * as React from 'react';
import type { TextProps } from '@coreai-ds/react-headless-components';
import styles from './TextComparison.module.css';

export const textSizes = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000] as const;
export const textFonts = ['base', 'monospace', 'numeric'] as const;
export const textWeights = ['regular', 'medium', 'semibold', 'bold'] as const;
export const textAlignments = ['start', 'center', 'end', 'justify'] as const;
export const textForegrounds = [1, 2, 3, 4, 'disabled'] as const;
export const textElements = [
  'span',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'pre',
  'strong',
  'b',
  'em',
  'i',
] as const;

export const textPresetExpectations = [
  ['heading1', 900, 'semibold'],
  ['heading2', 700, 'semibold'],
  ['heading3', 500, 'semibold'],
  ['heading4', 400, 'semibold'],
  ['heading5', 300, 'semibold'],
  ['bodyStrong', 300, 'semibold'],
  ['body', 300, 'regular'],
  ['heading6', 200, 'semibold'],
  ['bodySStrong', 200, 'semibold'],
  ['bodyS', 200, 'regular'],
  ['bodyXSStrong', 100, 'semibold'],
  ['bodyXS', 100, 'regular'],
] as const;

export interface TextExample {
  name: string;
  props: TextProps;
  parentStyle?: React.CSSProperties;
}

export const textUndefinedProps: TextProps = {
  align: undefined,
  block: undefined,
  font: undefined,
  italic: undefined,
  size: undefined,
  strikethrough: undefined,
  truncate: undefined,
  underline: undefined,
  weight: undefined,
  wrap: undefined,
  foreground: undefined,
  uppercase: undefined,
  preset: undefined,
};

export const textInheritanceStyle: React.CSSProperties = {
  color: 'rgb(12, 34, 56)',
  fontFamily: 'Georgia, serif',
  fontSize: '19px',
  fontStyle: 'italic',
  fontVariant: 'small-caps',
  fontWeight: 500,
  letterSpacing: '0.7px',
  lineHeight: '31px',
  textTransform: 'capitalize',
  wordSpacing: '2px',
};

const content = 'Project status and upcoming milestones';
const longContent = `${content}; review the full report before the planning meeting.`;

export const textExamples: readonly TextExample[] = [
  { name: 'Inherited typography', props: { children: content }, parentStyle: textInheritanceStyle },
  {
    name: 'Explicitly undefined defaults',
    props: { ...textUndefinedProps, children: content },
    parentStyle: textInheritanceStyle,
  },
  ...textSizes.map((size) => ({
    name: `Size: ${size}`,
    props: { size, children: content },
  })),
  ...textFonts.map((font) => ({
    name: `Font: ${font}`,
    props: { font, children: content },
    parentStyle: textInheritanceStyle,
  })),
  ...textWeights.map((weight) => ({
    name: `Weight: ${weight}`,
    props: { weight, children: content },
    parentStyle: textInheritanceStyle,
  })),
  ...textAlignments.map((align) => ({
    name: `Align: ${align}`,
    props: { align, block: true, children: longContent },
  })),
  { name: 'Block', props: { block: true, children: content } },
  { name: 'No wrap', props: { wrap: false, block: true, children: longContent } },
  { name: 'Truncate only', props: { truncate: true, block: true, children: longContent } },
  {
    name: 'Truncated no wrap',
    props: { wrap: false, truncate: true, block: true, children: longContent },
  },
  { name: 'Italic', props: { italic: true, children: content } },
  { name: 'Underline', props: { underline: true, children: content } },
  { name: 'Strikethrough', props: { strikethrough: true, children: content } },
  {
    name: 'Combined decorations',
    props: { italic: true, underline: true, strikethrough: true, children: content },
  },
  ...textForegrounds.map((foreground) => ({
    name: `Foreground: ${foreground}`,
    props: { foreground, children: content },
  })),
  ...textPresetExpectations.map(([preset]) => ({
    name: `Preset: ${preset}`,
    props: { preset, children: content },
  })),
  {
    name: 'Preset with explicit size and weight',
    props: { preset: 'heading1', size: 100, weight: 'regular', children: content },
  },
  { name: 'Semantic heading', props: { as: 'h2', preset: 'heading3', children: content } },
  { name: 'Semantic paragraph', props: { as: 'p', children: content } },
];

export const textUppercaseExamples: readonly TextExample[] = [
  { name: 'Uppercase inherited', props: { uppercase: true, children: 'Project status' } },
  { name: 'Uppercase small', props: { uppercase: true, size: 100, children: 'Project status' } },
  { name: 'Uppercase heading', props: { uppercase: true, size: 500, children: 'Project status' } },
];

export const textConsumerExample: TextExample = {
  name: 'Consumer CSS Modules',
  props: {
    className: styles.consumerText,
    preset: 'heading1',
    foreground: 1,
    uppercase: true,
    block: true,
    italic: true,
    underline: true,
    wrap: false,
    truncate: true,
    children: content,
  },
};
