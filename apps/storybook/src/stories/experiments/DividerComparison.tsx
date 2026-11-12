// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Divider as LegacyDivider,
  DividerLabeled as LegacyDividerLabeled,
} from '@coreai-ds/react-components';
import {
  Divider as HeadlessDivider,
  DividerLabeled as HeadlessDividerLabeled,
  type DividerProps,
  type DividerLabeledProps,
  type DividerLabeledSlots,
} from '@coreai-ds/react-headless-components';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import styles from './DividerComparison.module.css';

export const dividerAppearances = ['default', 'subtle', 'brand', 'strong'] as const;
export const dividerAlignments = ['start', 'center', 'end'] as const;

export type DividerExample =
  | { name: string; family: 'divider'; props: DividerProps }
  | { name: string; family: 'labeled'; props: DividerLabeledProps };

function ContentIcon() {
  return (
    <svg
      className={styles.icon}
      data-divider-content-icon=""
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <circle cx="8" cy="8" r="5" />
    </svg>
  );
}

const renderWrapper: SlotRenderFunction<ExtractSlotProps<DividerLabeledSlots['wrapper']>> = (
  Component,
  props,
) => (
  <Component {...props} data-rendered-wrapper="">
    <em data-consumer-content="">{props.children}</em>
  </Component>
);

const renderRoot: SlotRenderFunction<ExtractSlotProps<DividerLabeledSlots['root']>> = (
  Component,
  props,
) => <Component {...props} data-rendered-root="" />;

export const dividerExamples: DividerExample[] = [
  { name: 'Divider: default native hr', family: 'divider', props: {} },
  ...dividerAppearances.flatMap((appearance) =>
    [false, true].map((vertical): DividerExample => ({
      name: `Divider: ${appearance}, ${vertical ? 'vertical' : 'horizontal'}`,
      family: 'divider',
      props: { appearance, vertical },
    })),
  ),
  { name: 'Divider: horizontal inset', family: 'divider', props: { inset: true } },
  {
    name: 'Divider: vertical inset',
    family: 'divider',
    props: { vertical: true, inset: true, style: { height: '120px' } },
  },
  { name: 'Divider: separator div', family: 'divider', props: { as: 'div', appearance: 'brand' } },
  {
    name: 'Divider: explicitly undefined defaults',
    family: 'divider',
    props: { appearance: undefined, inset: undefined, vertical: undefined, as: undefined },
  },
  {
    name: 'DividerLabeled: default text',
    family: 'labeled',
    props: { children: 'Workspace settings' },
  },
  ...dividerAppearances.map((appearance): DividerExample => ({
    name: `DividerLabeled: ${appearance}`,
    family: 'labeled',
    props: { appearance, children: 'Workspace settings' },
  })),
  ...dividerAlignments.flatMap((alignContent) =>
    [false, true].map((vertical): DividerExample => ({
      name: `DividerLabeled: ${alignContent}, ${vertical ? 'vertical' : 'horizontal'}`,
      family: 'labeled',
      props: { alignContent, vertical, children: 'Section' },
    })),
  ),
  {
    name: 'DividerLabeled: horizontal inset',
    family: 'labeled',
    props: { inset: true, children: 'Inset section' },
  },
  {
    name: 'DividerLabeled: vertical inset',
    family: 'labeled',
    props: { inset: true, vertical: true, children: 'Inset section', style: { height: '120px' } },
  },
  {
    name: 'DividerLabeled: icon content',
    family: 'labeled',
    props: { children: <ContentIcon /> },
  },
  {
    name: 'DividerLabeled: text and icon',
    family: 'labeled',
    props: {
      appearance: 'brand',
      children: (
        <span className={styles.content}>
          <ContentIcon />
          Projects
        </span>
      ),
    },
  },
  {
    name: 'DividerLabeled: vertical text and icon',
    family: 'labeled',
    props: {
      vertical: true,
      children: (
        <span className={styles.content}>
          <ContentIcon />
          Projects
        </span>
      ),
    },
  },
  { name: 'DividerLabeled: without content', family: 'labeled', props: {} },
  {
    name: 'DividerLabeled: vertical without content',
    family: 'labeled',
    props: { vertical: true, alignContent: 'end' },
  },
  ...[
    ['null', null],
    ['false', false],
    ['empty string', ''],
    ['zero', 0],
  ].map(([label, children]): DividerExample => ({
    name: `DividerLabeled: ${label} content`,
    family: 'labeled',
    props: { vertical: true, children },
  })),
  {
    name: 'DividerLabeled: wrapper render function',
    family: 'labeled',
    props: {
      children: 'Custom content wrapper',
      className: 'consumer-divider-root',
      wrapper: { className: 'consumer-divider-wrapper', children: renderWrapper },
    },
  },
  {
    name: 'DividerLabeled: root render function',
    family: 'labeled',
    props: {
      children: renderRoot,
      'aria-label': 'Custom separator root',
      'aria-labelledby': undefined,
      className: 'consumer-divider-root',
    },
  },
  {
    name: 'DividerLabeled: explicitly undefined defaults',
    family: 'labeled',
    props: {
      alignContent: undefined,
      appearance: undefined,
      inset: undefined,
      vertical: undefined,
      children: 'Workspace settings',
    },
  },
];

export const dividerConsumerExamples: DividerExample[] = [
  {
    name: 'Divider: consumer CSS',
    family: 'divider',
    props: { appearance: 'brand', inset: true, className: styles.consumerDivider },
  },
  {
    name: 'Divider: vertical consumer CSS',
    family: 'divider',
    props: { vertical: true, className: styles.consumerDivider, style: { height: '100px' } },
  },
  {
    name: 'DividerLabeled: consumer CSS',
    family: 'labeled',
    props: {
      appearance: 'brand',
      children: 'Custom section',
      className: styles.consumerLabeled,
      wrapper: { className: styles.consumerWrapper },
    },
  },
];

function DividerFixture({
  example,
  implementation,
}: {
  example: DividerExample;
  implementation: 'legacy' | 'headless';
}): React.ReactElement {
  const { props } = example;
  const content =
    example.family === 'divider' ? (
      implementation === 'legacy' ? (
        <LegacyDivider {...example.props} aria-label={props['aria-label'] ?? example.name} />
      ) : (
        <HeadlessDivider {...example.props} aria-label={props['aria-label'] ?? example.name} />
      )
    ) : implementation === 'legacy' ? (
      <LegacyDividerLabeled {...example.props} aria-label={props['aria-label'] ?? example.name} />
    ) : (
      <HeadlessDividerLabeled {...example.props} aria-label={props['aria-label'] ?? example.name} />
    );

  return (
    <div
      className={[styles.cell, props.vertical && styles.vertical].filter(Boolean).join(' ')}
      data-divider-implementation={implementation}
    >
      {content}
    </div>
  );
}

export function DividerComparison({
  examples = dividerExamples,
}: {
  examples?: readonly DividerExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div
          key={example.name}
          className={styles.row}
          data-divider-case={example.name}
          data-divider-family={example.family}
        >
          <span>{example.name}</span>
          <DividerFixture example={example} implementation="legacy" />
          <DividerFixture example={example} implementation="headless" />
        </div>
      ))}
    </div>
  );
}
