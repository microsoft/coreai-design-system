// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Field, SearchBox as LegacySearchBox, type FieldProps } from '@coreai-ds/react-components';
import {
  SearchBox as HeadlessSearchBox,
  type SearchBoxProps,
} from '@coreai-ds/react-headless-components';
import { SearchRegular } from '@fluentui/react-icons/headless/svg/search';
import styles from './SearchBoxComparison.module.css';

export const searchBoxAppearances = [
  'outline',
  'underline',
  'filled-darker',
  'filled-lighter',
] as const;

export interface SearchBoxExample {
  name: string;
  props: SearchBoxProps;
  field?: Pick<FieldProps, 'size' | 'required' | 'validationState' | 'validationMessage' | 'hint'>;
}

const leadingIcon = <SearchRegular aria-hidden />;
const trailingText = <span aria-hidden>Filter</span>;

export const searchBoxExamples: readonly SearchBoxExample[] = [
  { name: 'Default', props: { placeholder: 'Search projects' } },
  { name: 'Explicit undefined appearance', props: { appearance: undefined } },
  ...searchBoxAppearances.map((appearance) => ({
    name: `Appearance: ${appearance}`,
    props: { appearance, defaultValue: 'Atlas' },
  })),
  ...(['small', 'medium', 'large'] as const).map((size) => ({
    name: `Size: ${size}`,
    props: { size, defaultValue: 'Atlas', contentAfter: trailingText },
  })),
  { name: 'No leading icon', props: { contentBefore: null, defaultValue: 'Atlas' } },
  {
    name: 'Custom leading icon',
    props: { contentBefore: leadingIcon, placeholder: 'Search projects' },
  },
  {
    name: 'Text prefix and suffix',
    props: { contentBefore: 'Find:', contentAfter: trailingText, defaultValue: 'Atlas' },
  },
  { name: 'No dismiss control', props: { dismiss: null, defaultValue: 'Atlas' } },
  {
    name: 'No trailing container',
    props: { contentAfter: null, defaultValue: 'Atlas' },
  },
  {
    name: 'Explicit empty glyph children',
    props: { contentBefore: { children: false }, dismiss: { children: false } },
  },
  { name: 'Disabled placeholder', props: { disabled: true, placeholder: 'Unavailable' } },
  {
    name: 'Disabled populated',
    props: { disabled: true, defaultValue: 'Atlas', contentAfter: trailingText },
  },
  { name: 'Read only', props: { readOnly: true, defaultValue: 'Atlas' } },
  {
    name: 'Invalid outline',
    props: { appearance: 'outline', 'aria-invalid': true, defaultValue: 'Atlas' },
  },
  {
    name: 'Spelling is not validation failure',
    props: { appearance: 'outline', 'aria-invalid': 'spelling' },
  },
  {
    name: 'Native text type override',
    props: { type: 'text', defaultValue: 'Atlas' },
  },
  {
    name: 'Field validation and required',
    props: { appearance: 'outline', defaultValue: 'Atlas' },
    field: { required: true, validationState: 'error', validationMessage: 'Choose a project' },
  },
  {
    name: 'Field size does not change SearchBox default',
    props: { defaultValue: 'Atlas' },
    field: { size: 'large' },
  },
  {
    name: 'Explicit undefined size inside Field',
    props: { size: undefined, defaultValue: 'Atlas' },
    field: { size: 'small' },
  },
  {
    name: 'Explicit size inside Field',
    props: { size: 'large', defaultValue: 'Atlas' },
    field: { size: 'small' },
  },
];

export const searchBoxConsumerExample: SearchBoxExample = {
  name: 'Consumer CSS Modules',
  props: {
    defaultValue: 'Atlas',
    className: styles.consumerRoot,
    input: { className: styles.consumerInput },
    contentBefore: { className: styles.consumerBefore, children: leadingIcon },
    contentAfter: { className: styles.consumerAfter, children: trailingText },
    dismiss: { className: styles.consumerDismiss, 'aria-label': 'Clear consumer search' },
  },
};

function ExampleCell({
  implementation,
  example: { name, props, field },
}: {
  implementation: 'legacy' | 'headless';
  example: SearchBoxExample;
}): React.ReactElement {
  const generatedId = React.useId();
  const id = field ? props.id : `${props.id ?? generatedId}-${implementation}`;
  const accessibleName = props['aria-label'] ?? (field ? undefined : name);
  const control =
    implementation === 'headless' ? (
      <HeadlessSearchBox {...props} id={id} aria-label={accessibleName} />
    ) : (
      <LegacySearchBox {...props} id={id} aria-label={accessibleName} />
    );

  return (
    <div data-searchbox-implementation={implementation}>
      {field ? (
        <Field label={name} {...field}>
          {control}
        </Field>
      ) : (
        control
      )}
    </div>
  );
}

export function SearchBoxComparison({
  examples = searchBoxExamples,
}: {
  examples?: readonly SearchBoxExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row} data-searchbox-comparison-header="">
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-searchbox-case={example.name}>
          <span>{example.name}</span>
          <ExampleCell implementation="legacy" example={example} />
          <ExampleCell implementation="headless" example={example} />
        </div>
      ))}
    </div>
  );
}
