// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Button as LegacyButton } from '@coreai-ds/react-components';
import { Button as HeadlessButton, type ButtonProps } from '@coreai-ds/react-headless-components';
import { AddFilled, AddRegular, bundleIcon } from '@fluentui/react-icons';
import styles from './ButtonComparison.module.css';

const AddIcon = bundleIcon(AddFilled, AddRegular);

export const buttonAppearances = [
  'secondary',
  'primary',
  'outline',
  'subtle',
  'transparent',
] as const;

export interface ButtonExample {
  name: string;
  props: ButtonProps;
}

const icon = {
  children: <AddIcon aria-hidden="true" />,
  className: 'parity-icon',
};

export const buttonExamples: ButtonExample[] = [
  { name: 'Default', props: { children: 'Example' } },
  ...buttonAppearances.map((appearance) => ({
    name: `Appearance: ${appearance}`,
    props: { appearance, children: 'Example' },
  })),
  ...(['small', 'medium', 'large'] as const).map((size) => ({
    name: `Size: ${size}`,
    props: { size, children: 'Example' },
  })),
  ...(['rounded', 'circular', 'square'] as const).map((shape) => ({
    name: `Shape: ${shape}`,
    props: { shape, children: 'Example' },
  })),
  { name: 'Icon before', props: { icon, children: 'Example' } },
  { name: 'Icon after', props: { icon, iconPosition: 'after', children: 'Example' } },
  ...(['small', 'medium', 'large'] as const).map((size) => ({
    name: `Icon only: ${size}`,
    props: { size, icon, 'aria-label': 'Add' },
  })),
  ...buttonAppearances.map((appearance) => ({
    name: `Disabled: ${appearance}`,
    props: { appearance, icon, disabled: true, children: 'Example' },
  })),
  {
    name: 'Disabled focusable',
    props: { icon, disabled: true, disabledFocusable: true, children: 'Example' },
  },
  {
    name: 'Disabled focusable without disabled',
    props: { icon, disabledFocusable: true, children: 'Example' },
  },
  {
    name: 'Anchor',
    props: { as: 'a', href: '#button-comparison', children: 'Example' },
  },
];

export const consumerExample: ButtonExample = {
  name: 'Consumer CSS Modules',
  props: {
    children: 'Example',
    className: styles.consumerRoot,
    icon: { ...icon, className: `parity-icon ${styles.consumerIcon}` },
  },
};

export function ButtonComparison({
  examples = buttonExamples,
}: {
  examples?: readonly ButtonExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map(({ name, props }) => (
        <div key={name} className={styles.row} data-parity-case={name}>
          <span>{name}</span>
          <div data-implementation="legacy">
            <LegacyButton {...props} />
          </div>
          <div data-implementation="headless">
            <HeadlessButton {...props} />
          </div>
        </div>
      ))}
    </div>
  );
}
