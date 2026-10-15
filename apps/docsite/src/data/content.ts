// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { TextPreset } from '@coreai-ds/react-components';

export interface ColorRow {
  name: string;
  description: string;
  token: string;
  value: string;
}

export interface DataVizRow {
  slot: string;
  label: string;
  description: string;
  value: string;
}

export interface TypeRow {
  strongPreset: TextPreset;
  strongLabel: string;
  regularPreset?: TextPreset;
  regularLabel?: string;
  fluent: string;
  usage: string;
}

export const dataVizRows: DataVizRow[] = [
  {
    slot: '1',
    label: 'Cornflower',
    description: 'Primary series, default single-series charts',
    value: '#637CEF',
  },
  {
    slot: '2',
    label: 'Orchid',
    description: 'Secondary series, companion against primary',
    value: '#F393EB',
  },
  {
    slot: '3',
    label: 'Seafoam',
    description: 'Tertiary series, three-way comparisons',
    value: '#4EC8AF',
  },
  {
    slot: '4',
    label: 'Sky',
    description: 'Fourth series, multi-category breakdowns',
    value: '#3BBAFF',
  },
  { slot: '5', label: 'Teal', description: 'Fifth series, extended datasets', value: '#2AA0A4' },
  {
    slot: '6',
    label: 'Peach',
    description: 'Sixth series, dense multi-series displays',
    value: '#F69672',
  },
  {
    slot: '7',
    label: 'Grape',
    description: 'Seventh series, maximum category count',
    value: '#9373C0',
  },
];

export const typographyRows: TypeRow[] = [
  {
    strongPreset: 'heading1',
    strongLabel: 'Heading 1',
    fluent: 'LargeTitle',
    usage: 'Page titles and hero headings.',
  },
  {
    strongPreset: 'heading2',
    strongLabel: 'Heading 2',
    fluent: 'Title2',
    usage: 'Major section headings.',
  },
  {
    strongPreset: 'heading3',
    strongLabel: 'Heading 3',
    fluent: 'Subtitle1',
    usage: 'Section headings.',
  },
  {
    strongPreset: 'heading4',
    strongLabel: 'Heading 4',
    fluent: 'Subtitle2',
    usage: 'Subsection headings.',
  },
  {
    strongPreset: 'heading5',
    strongLabel: 'Heading 5 / Body Strong',
    regularPreset: 'body',
    regularLabel: 'Body',
    fluent: 'Body1Strong / Body1',
    usage: 'Compact headings, emphasized text, and default body copy.',
  },
  {
    strongPreset: 'heading6',
    strongLabel: 'Heading 6 / Body S Strong',
    regularPreset: 'bodyS',
    regularLabel: 'Body S',
    fluent: 'Caption1Strong / Caption1',
    usage: 'Small headings, secondary text, metadata, and timestamps.',
  },
  {
    strongPreset: 'bodyXSStrong',
    strongLabel: 'Body XS Strong',
    regularPreset: 'bodyXS',
    regularLabel: 'Body XS',
    fluent: 'Caption2Strong / Caption2',
    usage: 'Labels and tertiary text in high-density views.',
  },
];

export const guidelinesSections: Array<{ title: string; items: string[] }> = [
  {
    title: 'Accessibility',
    items: [
      'Keyboard-only navigation. All flows work with tab key alone. Tested before ship.',
      'Zoom to 320x256px. UI scales at 4x zoom on 1080p with no loss of functionality or horizontal scrolling.',
      'Semantic HTML first. Use headings, landmarks, labels. Prefer native elements before aria-*.',
      'Accessible names on everything. Every interactive element has a label or aria-label.',
      'Icons are decorative. Add aria-hidden to icons where text label is sufficient for screen readers.',
      "Redundant status cues. Don't rely on color alone. Include text labels.",
    ],
  },
  {
    title: 'Components and styling',
    items: [
      "Use common components. Browse Storybook for all available. If you write too much CSS, you're probably not using an existing component.",
      'Layout with flex and gap. Prefer flexbox with gap over block with margin. Reduce nesting, prefer flat structures.',
    ],
  },
  {
    title: 'Interactions',
    items: [
      "Clear focus rings. Prefer :focus-visible over :focus. Don't override built-in focus indicators.",
      'Manage focus in overlays. Dialogs trap focus. When an overlay closes, return focus to the trigger.',
      'Match visual and hit targets. If a visual target is < 24px, expand hit target to >= 24px.',
      'No dead zones. If part of a control looks interactive, it should be interactive.',
      'Links are links. Use a or Link for navigation. Never button or div.',
    ],
  },
  {
    title: 'Content and states',
    items: [
      'All states designed. Empty, loading, error, and success states required for every view.',
      'No dead ends. Every screen offers a next step or recovery path.',
      'Stable skeletons. Skeletons mirror final content dimensions to avoid layout shift.',
      'Tabular numbers for data. Use font-variant-numeric: tabular-nums for tables and metrics.',
    ],
  },
  {
    title: 'Animations',
    items: [
      'Honor prefers-reduced-motion. Provide a reduced-motion variant for every animation.',
      'Compositor-friendly. Prioritize transform and opacity. Avoid animating width, height, top, left.',
      'Necessity check. Only animate when it clarifies cause and effect.',
      'Never transition: all. Explicitly list only the properties you intend to animate.',
      'Interruptible. Animations are cancelable by user input.',
    ],
  },
  {
    title: 'Tone and content',
    items: [
      'Warm and relaxed. Like a helpful conversation, not a manual.',
      'Crisp and clear. Built for speed: easy to scan, quick to grasp.',
      'Customer-centric. Focused on user goals, context, and experience.',
      'Active voice. "Create a resource" not "The resource will be created."',
      'Sentence case. Headings, buttons, labels per Microsoft content style.',
      'Second person. Address the user directly. Avoid first person in UI text.',
      'Use numerals. "8 deployments" not "eight deployments."',
      'Default to positive language. Encouraging, problem-solving framing, even for errors.',
    ],
  },
];

export { siteLinks } from '../../../../shared/site-links';
