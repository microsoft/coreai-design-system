// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Textarea as LegacyTextarea } from '@coreai-ds/react-components';
import {
  Textarea as HeadlessTextarea,
  type TextareaProps,
} from '@coreai-ds/react-headless-components';
import styles from './TextareaComparison.module.css';

export const textareaAppearances = ['outline', 'filled-darker', 'filled-lighter'] as const;

export const textareaSizes = ['small', 'medium', 'large'] as const;
export const textareaResizeModes = ['none', 'vertical', 'horizontal', 'both'] as const;

export interface TextareaExample {
  name: string;
  props: TextareaProps;
}

export const textareaExamples: TextareaExample[] = [
  { name: 'CoreAI default', props: { defaultValue: 'Design notes' } },
  ...textareaAppearances.map((appearance) => ({
    name: `Appearance: ${appearance}`,
    props: { appearance, defaultValue: 'Design notes' },
  })),
  ...textareaSizes.map((size) => ({
    name: `Size: ${size}`,
    props: { size, defaultValue: 'Design notes' },
  })),
  ...textareaResizeModes.map((resize) => ({
    name: `Resize: ${resize}`,
    props: { resize, rows: 4, defaultValue: 'First line\nSecond line' },
  })),
  ...([1, 5, 20] as const).map((rows) => ({
    name: `Rows: ${rows}`,
    props: { rows, defaultValue: 'Rows remain a native textarea attribute.' },
  })),
  { name: 'Placeholder', props: { placeholder: 'Write your notes…' } },
  ...(['outline', 'filled-darker', 'filled-lighter'] as const).map((appearance) => ({
    name: `Disabled: ${appearance}`,
    props: { appearance, disabled: true, resize: 'both' as const, placeholder: 'Unavailable' },
  })),
  {
    name: 'Disabled invalid',
    props: {
      appearance: 'outline',
      disabled: true,
      'aria-invalid': true,
      placeholder: 'Unavailable',
    },
  },
  {
    name: 'Read only',
    props: { readOnly: true, defaultValue: 'This text can be selected and copied.' },
  },
  ...(['outline', 'filled-darker'] as const).map((appearance) => ({
    name: `Invalid: ${appearance}`,
    props: {
      appearance,
      'aria-invalid': true as const,
      defaultValue: 'Please review these notes.',
    },
  })),
];

export const textareaConsumerExample: TextareaExample = {
  name: 'Consumer CSS Modules',
  props: {
    defaultValue: 'Consumer-sized notes',
    className: styles.consumerRoot,
    textarea: { className: styles.consumerTextarea },
  },
};

function TextareaFixture({
  implementation,
  name,
  props,
}: TextareaExample & { implementation: 'legacy' | 'headless' }): React.ReactElement {
  const id = React.useId();
  const errorId = React.useId();
  const invalid = props['aria-invalid'] === true;
  const describedBy = [props['aria-describedby'], invalid && errorId].filter(Boolean).join(' ');
  const Component = implementation === 'legacy' ? LegacyTextarea : HeadlessTextarea;
  return (
    <div className={styles.cell} data-implementation={implementation}>
      <label className={styles.label} htmlFor={id}>
        {name}
      </label>
      <Component {...props} id={id} aria-describedby={describedBy || undefined} />
      {invalid && <span id={errorId}>Please review these notes.</span>}
    </div>
  );
}

export function TextareaComparison({
  examples = textareaExamples,
}: {
  examples?: readonly TextareaExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-textarea-case={example.name}>
          <span>{example.name}</span>
          <TextareaFixture {...example} implementation="legacy" />
          <TextareaFixture {...example} implementation="headless" />
        </div>
      ))}
    </div>
  );
}
