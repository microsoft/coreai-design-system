// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  CopyButton as LegacyCopyButton,
  CoreAIFluentProvider as LegacyProvider,
} from '@coreai-ds/react-components';
import {
  CoreAIFluentProvider,
  type CoreAIFluentProviderProps,
} from '../../../../../packages/react-headless-components/src/CoreAIFluentProvider.js';
import {
  coreaiDarkTheme,
  coreaiLightTheme,
} from '../../../../../packages/react-headless-components/src/theme.js';
import { useFluentThemeMode } from '../../../../../packages/react-headless-components/src/FluentThemeModeContext.js';
import {
  CopyButton,
  type CopyButtonProps,
} from '../../../../../packages/react-headless-components/src/CopyButton.js';
import styles from './CopyButtonComparison.module.css';

export interface CopyButtonExample {
  name: string;
  props: CopyButtonProps;
}

const copyProps = { 'aria-label': 'Copy project code', contentToCopy: 'CoreAI-42' };
const customIcon = {
  className: 'copy-button-consumer-icon',
  children: <span aria-hidden>+</span>,
};

export const copyButtonExamples: readonly CopyButtonExample[] = [
  { name: 'Default icon only', props: { ...copyProps } },
  {
    name: 'Explicitly undefined appearance',
    props: { ...copyProps, appearance: undefined, children: 'Copy code' },
  },
  { name: 'Small', props: { ...copyProps, size: 'small' } },
  {
    name: 'Large primary',
    props: { ...copyProps, size: 'large', appearance: 'primary', children: 'Copy code' },
  },
  {
    name: 'Icon after',
    props: { ...copyProps, iconPosition: 'after', children: 'Copy code' },
  },
  {
    name: 'Caller icon slot',
    props: { ...copyProps, icon: customIcon, children: 'Copy code' },
  },
  { name: 'Caller removes icon', props: { ...copyProps, icon: null, children: 'Copy code' } },
  {
    name: 'Explicitly undefined icon',
    props: { ...copyProps, icon: undefined, children: 'Copy code' },
  },
  { name: 'Disabled', props: { ...copyProps, disabled: true } },
  { name: 'Disabled focusable', props: { ...copyProps, disabledFocusable: true } },
  {
    name: 'Native anchor',
    props: { ...copyProps, as: 'a', href: '#copy-button-destination', children: 'Copy code' },
  },
];

export const copyButtonConsumerExample: CopyButtonExample = {
  name: 'Consumer CSS priority',
  props: {
    ...copyProps,
    children: 'Copy code',
    className: styles.consumerRoot,
    icon: { ...customIcon, className: styles.consumerIcon },
  },
};

export function CopyButtonComparison({
  examples = copyButtonExamples,
  theme,
  withComponentDefaults = true,
  dir = 'ltr',
}: {
  examples?: readonly CopyButtonExample[];
  theme?: CoreAIFluentProviderProps['theme'];
  withComponentDefaults?: boolean;
  dir?: 'ltr' | 'rtl';
}): React.ReactElement {
  const mode = useFluentThemeMode();
  const resolvedTheme = theme ?? (mode === 'dark' ? coreaiDarkTheme : coreaiLightTheme);
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map(({ name, props }) => (
        <div key={name} className={styles.row} data-copy-button-case={name}>
          <span>{name}</span>
          <LegacyProvider
            theme={resolvedTheme}
            withComponentDefaults={withComponentDefaults}
            dir={dir}
            className={styles.cell}
          >
            <LegacyCopyButton {...props} data-copy-button-implementation="legacy" />
          </LegacyProvider>
          <CoreAIFluentProvider
            theme={resolvedTheme}
            withComponentDefaults={withComponentDefaults}
            dir={dir}
            className={styles.cell}
          >
            <CopyButton {...props} data-copy-button-implementation="headless" />
          </CoreAIFluentProvider>
        </div>
      ))}
    </div>
  );
}

export function CopyButtonFlow(): React.ReactElement {
  const [content, setContent] = React.useState('CoreAI-42');
  const [clicks, setClicks] = React.useState(0);
  const [successes, setSuccesses] = React.useState(0);
  const [errors, setErrors] = React.useState(0);
  const [submitted, setSubmitted] = React.useState('No submission');
  const callbacks = {
    onClick: () => setClicks((value) => value + 1),
    onCopySuccess: () => setSuccesses((value) => value + 1),
    onCopyError: () => setErrors((value) => value + 1),
  };
  return (
    <form
      className={styles.flow}
      onSubmit={(event) => {
        event.preventDefault();
        const submitter =
          event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : undefined;
        const data = new FormData(event.currentTarget, submitter);
        setSubmitted(`Submitted ${data.get('code')} (${data.get('action')})`);
      }}
    >
      <label>
        Project code
        <input name="code" value={content} onChange={(event) => setContent(event.target.value)} />
      </label>
      <CopyButton aria-label="Copy code only" contentToCopy={content} {...callbacks}>
        Copy only
      </CopyButton>
      <CopyButton
        aria-label="Copy and submit code"
        contentToCopy={content}
        type="submit"
        name="action"
        value="copy"
        {...callbacks}
      >
        Copy and submit
      </CopyButton>
      <CopyButton aria-label="Unavailable copy" contentToCopy={content} disabled {...callbacks} />
      <CopyButton
        aria-label="Focusable unavailable copy"
        contentToCopy={content}
        disabledFocusable
        {...callbacks}
      />
      <output aria-label="Copy outcomes" aria-live="polite">
        {clicks} clicks; {successes} copied; {errors} errors
      </output>
      <output aria-label="Copy form result" aria-live="polite">
        {submitted}
      </output>
    </form>
  );
}
