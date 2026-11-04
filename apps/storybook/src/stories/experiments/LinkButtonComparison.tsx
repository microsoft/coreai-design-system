// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  LinkButton as LegacyLinkButton,
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
  LinkButton,
  type LinkButtonProps,
} from '../../../../../packages/react-headless-components/src/LinkButton.js';
import styles from './LinkButtonComparison.module.css';

export interface LinkButtonExample {
  name: string;
  props: LinkButtonProps;
}

export const LinkButtonCustomAnchor = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement>
>(function LinkButtonCustomAnchor(props, ref) {
  return <a {...props} ref={ref} data-link-button-custom-root="" />;
});

const href = '#link-button-destination';
const children = 'Project guide';
const customIcon = { className: 'link-button-consumer-icon', children: <span aria-hidden>+</span> };

export const linkButtonExamples: readonly LinkButtonExample[] = [
  { name: 'Default anchor', props: { href, children } },
  {
    name: 'Explicitly undefined defaults',
    props: { href, children, appearance: undefined, external: undefined },
  },
  {
    name: 'Small outline',
    props: { href, children, size: 'small', appearance: 'outline', icon: customIcon },
  },
  {
    name: 'Large primary',
    props: { href, children, size: 'large', appearance: 'primary' },
  },
  { name: 'External defaults', props: { href, children, external: true } },
  {
    name: 'External caller overrides',
    props: {
      href,
      children,
      external: true,
      target: '_self',
      rel: 'external',
      icon: customIcon,
      iconPosition: 'before',
    },
  },
  {
    name: 'External without icon',
    props: { href, children, external: true, icon: null },
  },
  {
    name: 'Icon after',
    props: { href, children, icon: customIcon, iconPosition: 'after' },
  },
  { name: 'Disabled anchor', props: { href, children, disabled: true } },
  { name: 'Disabled focusable anchor', props: { href, children, disabledFocusable: true } },
  { name: 'Anchor without href', props: { children } },
  {
    name: 'Compatible custom anchor',
    props: { as: LinkButtonCustomAnchor, href, children, external: true },
  },
  {
    name: 'Custom anchor icon only',
    props: {
      as: LinkButtonCustomAnchor,
      href,
      external: true,
      size: 'small',
      'aria-label': 'Open project guide',
    },
  },
  {
    name: 'Custom anchor falsy content',
    props: {
      as: LinkButtonCustomAnchor,
      href,
      icon: customIcon,
      children: 0,
      'aria-label': 'Open project guide',
    },
  },
];

export const linkButtonConsumerExample: LinkButtonExample = {
  name: 'Consumer CSS priority',
  props: {
    href,
    children,
    className: styles.consumerRoot,
    icon: { ...customIcon, className: styles.consumerIcon },
    iconPosition: 'after',
  },
};

export function LinkButtonComparison({
  examples = linkButtonExamples,
  theme,
  withComponentDefaults = true,
  dir = 'ltr',
}: {
  examples?: readonly LinkButtonExample[];
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
        <div key={name} className={styles.row} data-link-button-case={name}>
          <span>{name}</span>
          <LegacyProvider
            theme={resolvedTheme}
            withComponentDefaults={withComponentDefaults}
            dir={dir}
            className={styles.cell}
          >
            <LegacyLinkButton {...props} data-link-button-implementation="legacy" />
          </LegacyProvider>
          <CoreAIFluentProvider
            theme={resolvedTheme}
            withComponentDefaults={withComponentDefaults}
            dir={dir}
            className={styles.cell}
          >
            <LinkButton {...props} data-link-button-implementation="headless" />
          </CoreAIFluentProvider>
        </div>
      ))}
    </div>
  );
}

export function LinkButtonFlow(): React.ReactElement {
  const [activations, setActivations] = React.useState(0);
  const [submissions, setSubmissions] = React.useState(0);
  const onClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    event.preventDefault();
    setActivations((value) => value + 1);
  };
  return (
    <form
      className={styles.flow}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmissions((value) => value + 1);
      }}
    >
      <button type="button">Before links</button>
      <LinkButton href="#link-button-destination" onClick={onClick}>
        Open project guide
      </LinkButton>
      <LinkButton href="#link-button-destination" disabled onClick={onClick}>
        Unavailable guide
      </LinkButton>
      <LinkButton href="#link-button-destination" disabledFocusable onClick={onClick}>
        Focusable unavailable guide
      </LinkButton>
      <LinkButton
        as={LinkButtonCustomAnchor}
        href="#link-button-destination"
        external
        onClick={onClick}
      >
        Custom router guide
      </LinkButton>
      <button type="submit">Submit form</button>
      <output aria-label="Link outcomes" aria-live="polite">
        {activations} link activations; {submissions} form submissions
      </output>
    </form>
  );
}
