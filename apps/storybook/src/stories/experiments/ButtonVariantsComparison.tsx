// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  CompoundButton as LegacyCompoundButton,
  ToggleButton as LegacyToggleButton,
  MenuButton as LegacyMenuButton,
  SplitButton as LegacySplitButton,
} from '@coreai-ds/react-components';
import {
  CompoundButton,
  ToggleButton,
  MenuButton,
  SplitButton,
  type CompoundButtonProps,
  type ToggleButtonProps,
  type MenuButtonProps,
  type SplitButtonProps,
} from '@coreai-ds/react-headless-components';
import { AddFilled, AddRegular } from '@fluentui/react-icons/headless/svg/add';
import styles from './ButtonVariantsComparison.module.css';

export const buttonVariantAppearances = [
  'secondary',
  'primary',
  'outline',
  'subtle',
  'transparent',
] as const;
export const buttonVariantSizes = ['small', 'medium', 'large'] as const;
export const buttonVariantShapes = ['rounded', 'circular', 'square'] as const;
export type ButtonVariantFamily = 'compound' | 'toggle' | 'menu' | 'split';

export interface CompoundButtonExample {
  name: string;
  props: CompoundButtonProps;
}
export interface ToggleButtonExample {
  name: string;
  props: ToggleButtonProps;
}
export interface MenuButtonExample {
  name: string;
  props: MenuButtonProps;
}
export interface SplitButtonExample {
  name: string;
  props: Pick<
    SplitButtonProps,
    | 'appearance'
    | 'size'
    | 'shape'
    | 'icon'
    | 'iconPosition'
    | 'menuIcon'
    | 'className'
    | 'disabled'
    | 'disabledFocusable'
    | 'primaryActionButton'
    | 'menuButton'
  > & { children?: React.ReactNode };
}

export const buttonVariantIcon = {
  children: (
    <span className={styles.bundledIcon}>
      <AddFilled className={`${styles.filledGlyph} fui-Icon-filled`} aria-hidden="true" />
      <AddRegular className={`${styles.regularGlyph} fui-Icon-regular`} aria-hidden="true" />
    </span>
  ),
  className: 'parity-icon',
  'data-family-icon': 'provided',
};

const compoundContent = {
  children: 'Create release',
  secondaryContent: 'Deploy the latest changes',
  icon: buttonVariantIcon,
};

export const compoundButtonExamples: CompoundButtonExample[] = [
  { name: 'Default', props: { children: 'Create release', secondaryContent: 'Start deployment' } },
  {
    name: 'Explicit undefined visual props',
    props: { ...compoundContent, shape: undefined, size: undefined, appearance: undefined },
  },
  ...buttonVariantAppearances.map((appearance) => ({
    name: `Appearance: ${appearance}`,
    props: { ...compoundContent, appearance },
  })),
  ...buttonVariantSizes.map((size) => ({
    name: `Size: ${size}`,
    props: { ...compoundContent, size },
  })),
  ...buttonVariantShapes.map((shape) => ({
    name: `Shape: ${shape}`,
    props: { ...compoundContent, shape },
  })),
  { name: 'Icon after', props: { ...compoundContent, iconPosition: 'after' } },
  { name: 'Secondary only', props: { icon: buttonVariantIcon, secondaryContent: 'Deploy' } },
  { name: 'No secondary', props: { ...compoundContent, secondaryContent: null } },
  ...buttonVariantSizes.map((size) => ({
    name: `Icon only: ${size}`,
    props: { size, icon: buttonVariantIcon, 'aria-label': 'Create release' },
  })),
  { name: 'Disabled', props: { ...compoundContent, disabled: true } },
  { name: 'Disabled focusable', props: { ...compoundContent, disabledFocusable: true } },
  { name: 'Anchor', props: { ...compoundContent, as: 'a', href: '#release-details' } },
];

export const toggleButtonExamples: ToggleButtonExample[] = [
  { name: 'Default', props: { children: 'Pin release' } },
  {
    name: 'Explicit undefined visual props',
    props: { children: 'Pin release', shape: undefined, size: undefined, appearance: undefined },
  },
  ...buttonVariantAppearances.map((appearance) => ({
    name: `Checked: ${appearance}`,
    props: { appearance, checked: true, icon: buttonVariantIcon, children: 'Pin release' },
  })),
  ...buttonVariantAppearances.map((appearance) => ({
    name: `Accessible checked: ${appearance}`,
    props: { appearance, checked: true, isAccessible: true, children: 'Pin release' },
  })),
  ...buttonVariantSizes.map((size) => ({
    name: `Size: ${size}`,
    props: { size, icon: buttonVariantIcon, children: 'Pin release' },
  })),
  ...buttonVariantShapes.map((shape) => ({
    name: `Shape: ${shape}`,
    props: { shape, children: 'Pin release' },
  })),
  {
    name: 'Icon after',
    props: { icon: buttonVariantIcon, iconPosition: 'after', children: 'Pin release' },
  },
  { name: 'Default checked', props: { defaultChecked: true, children: 'Pin release' } },
  {
    name: 'Disabled checked',
    props: {
      defaultChecked: true,
      disabled: true,
      icon: buttonVariantIcon,
      children: 'Pin release',
    },
  },
  {
    name: 'Disabled focusable checked',
    props: {
      checked: true,
      disabledFocusable: true,
      icon: buttonVariantIcon,
      children: 'Pin release',
    },
  },
  { name: 'Checkbox role', props: { role: 'checkbox', checked: true, children: 'Pin release' } },
  { name: 'Anchor', props: { as: 'a', href: '#pinned-releases', children: 'Pinned releases' } },
];

export const menuButtonExamples: MenuButtonExample[] = [
  { name: 'Default', props: { children: 'Release actions' } },
  {
    name: 'Explicit undefined visual props',
    props: {
      children: 'Release actions',
      shape: undefined,
      size: undefined,
      appearance: undefined,
    },
  },
  ...buttonVariantAppearances.map((appearance) => ({
    name: `Expanded: ${appearance}`,
    props: {
      appearance,
      'aria-expanded': true,
      icon: buttonVariantIcon,
      children: 'Release actions',
    },
  })),
  ...buttonVariantSizes.map((size) => ({
    name: `Size: ${size}`,
    props: { size, icon: buttonVariantIcon, children: 'Release actions' },
  })),
  ...buttonVariantShapes.map((shape) => ({
    name: `Shape: ${shape}`,
    props: { shape, children: 'Release actions' },
  })),
  {
    name: 'Leading icon only',
    props: { icon: buttonVariantIcon, 'aria-label': 'Release actions' },
  },
  { name: 'Chevron only', props: { 'aria-label': 'Release actions' } },
  {
    name: 'Custom chevron',
    props: {
      menuIcon: { children: <span aria-hidden="true">⌄</span> },
      children: 'Release actions',
    },
  },
  { name: 'No chevron', props: { menuIcon: null, children: 'Release actions' } },
  {
    name: 'Disabled',
    props: { icon: buttonVariantIcon, disabled: true, children: 'Release actions' },
  },
  {
    name: 'Disabled focusable',
    props: { disabledFocusable: true, children: 'Release actions' },
  },
  { name: 'Anchor', props: { as: 'a', href: '#release-actions', children: 'Release actions' } },
];

export const splitButtonExamples: SplitButtonExample[] = [
  { name: 'Default', props: { children: 'Deploy' } },
  {
    name: 'Explicit undefined visual props',
    props: { children: 'Deploy', shape: undefined, size: undefined, appearance: undefined },
  },
  ...buttonVariantAppearances.map((appearance) => ({
    name: `Appearance: ${appearance}`,
    props: { appearance, children: 'Deploy' },
  })),
  ...buttonVariantSizes.map((size) => ({
    name: `Size: ${size}`,
    props: { size, children: 'Deploy', icon: buttonVariantIcon },
  })),
  ...buttonVariantShapes.map((shape) => ({
    name: `Shape: ${shape}`,
    props: { shape, children: 'Deploy' },
  })),
  { name: 'Icon before', props: { icon: buttonVariantIcon, children: 'Deploy' } },
  {
    name: 'Icon after',
    props: { icon: buttonVariantIcon, iconPosition: 'after', children: 'Deploy' },
  },
  {
    name: 'Primary anchor',
    props: {
      children: 'Deployment details',
      primaryActionButton: { as: 'a', href: '#deployment-details' },
    },
  },
  {
    name: 'Custom menu content',
    props: { children: 'Deploy', menuButton: { children: 'Options' } },
  },
  { name: 'Disabled', props: { disabled: true, children: 'Deploy' } },
  { name: 'Disabled focusable', props: { disabledFocusable: true, children: 'Deploy' } },
  {
    name: 'Menu disabled independently',
    props: { children: 'Deploy', menuButton: { disabled: true } },
  },
  {
    name: 'Primary disabled independently',
    props: { children: 'Deploy', primaryActionButton: { disabled: true } },
  },
  { name: 'No menu', props: { children: 'Deploy', menuButton: null } },
  {
    name: 'No primary',
    props: { menuButton: { 'aria-label': 'Deployment options' }, primaryActionButton: null },
  },
];

const consumerProps = {
  children: 'Release',
  className: styles.consumerRoot,
  icon: {
    ...buttonVariantIcon,
    className: `parity-icon ${styles.consumerIcon}`,
  },
};

export const compoundButtonConsumerExample: CompoundButtonExample = {
  name: 'Consumer CSS priority',
  props: { ...consumerProps, secondaryContent: 'Deploy changes' },
};
export const toggleButtonConsumerExample: ToggleButtonExample = {
  name: 'Consumer CSS priority',
  props: { ...consumerProps, checked: true },
};
export const menuButtonConsumerExample: MenuButtonExample = {
  name: 'Consumer CSS priority',
  props: consumerProps,
};
export const splitButtonConsumerExample: SplitButtonExample = {
  name: 'Consumer CSS priority',
  props: {
    ...consumerProps,
    primaryActionButton: { className: styles.consumerRoot },
    menuButton: { className: styles.consumerRoot },
  },
};

function ComparisonRows<T extends { name: string }>({
  examples,
  legacy,
  headless,
}: {
  examples: readonly T[];
  legacy: (example: T) => React.ReactNode;
  headless: (example: T) => React.ReactNode;
}) {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-parity-case={example.name}>
          <span>{example.name}</span>
          <div data-implementation="legacy">{legacy(example)}</div>
          <div data-implementation="headless">{headless(example)}</div>
        </div>
      ))}
    </div>
  );
}

export function CompoundButtonComparison({
  examples = compoundButtonExamples,
}: {
  examples?: readonly CompoundButtonExample[];
}) {
  return (
    <ComparisonRows
      examples={examples}
      legacy={({ props }) => <LegacyCompoundButton {...props} />}
      headless={({ props }) => <CompoundButton {...props} />}
    />
  );
}

export function ToggleButtonComparison({
  examples = toggleButtonExamples,
}: {
  examples?: readonly ToggleButtonExample[];
}) {
  return (
    <ComparisonRows
      examples={examples}
      legacy={({ props }) => <LegacyToggleButton {...props} />}
      headless={({ props }) => <ToggleButton {...props} />}
    />
  );
}

export function MenuButtonComparison({
  examples = menuButtonExamples,
}: {
  examples?: readonly MenuButtonExample[];
}) {
  return (
    <ComparisonRows
      examples={examples}
      legacy={({ props }) => <LegacyMenuButton {...props} />}
      headless={({ props }) => <MenuButton {...props} />}
    />
  );
}

export function SplitButtonComparison({
  examples = splitButtonExamples,
}: {
  examples?: readonly SplitButtonExample[];
}) {
  return (
    <ComparisonRows
      examples={examples}
      legacy={({ props }) => <LegacySplitButton {...props} />}
      headless={({ props }) => <SplitButton {...props} />}
    />
  );
}
