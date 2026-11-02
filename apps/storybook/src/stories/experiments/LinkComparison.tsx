// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Link as LegacyLink, Toast } from '@coreai-ds/react-components';
import { LinkContextProvider } from '@fluentui/react-headless-components-preview/link';
import { Link as HeadlessLink, type LinkProps } from '@coreai-ds/react-headless-components';
import styles from './LinkComparison.module.css';

export const linkAppearances = ['default', 'subtle'] as const;

export interface LinkExample {
  name: string;
  props: LinkProps;
  surroundingText?: boolean;
  parentFontSize?: string;
  contextInline?: boolean;
  backgroundAppearance?: 'inverted' | 'brand';
}

export function LinkContentIcon(): React.ReactElement {
  return (
    <svg
      className={styles.contentIcon}
      data-parity-child-icon=""
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path d="M4 3h8l4 4v10H4V3Zm7 1v4h4M7 11h6M7 14h6" />
    </svg>
  );
}

const children = 'View documentation';
const href = '#link-parity-destination';

export const linkExamples: LinkExample[] = [
  { name: 'Default anchor', props: { href, children } },
  {
    name: 'Explicitly undefined defaults',
    props: {
      href,
      children,
      appearance: undefined,
      inline: undefined,
      external: undefined,
      disabled: undefined,
      disabledFocusable: undefined,
      target: undefined,
      rel: undefined,
    },
  },
  { name: 'Subtle anchor', props: { href, appearance: 'subtle', children } },
  { name: 'Default button', props: { children } },
  { name: 'Subtle button', props: { appearance: 'subtle', children } },
  { name: 'Explicit button', props: { as: 'button', children } },
  { name: 'Anchor without href', props: { as: 'a', children } },
  { name: 'Inline anchor', props: { href, inline: true, children }, surroundingText: true },
  {
    name: 'Inline subtle anchor',
    props: { href, appearance: 'subtle', inline: true, children },
    surroundingText: true,
  },
  {
    name: 'Wrapping inline span',
    props: {
      as: 'span',
      inline: true,
      children: 'Read the documentation before changing shared project settings',
    },
    surroundingText: true,
  },
  {
    name: 'Anchor inherits parent typography',
    props: { href, children },
    parentFontSize: '20px',
  },
  { name: 'Button keeps Fluent font size', props: { children }, parentFontSize: '20px' },
  { name: 'Disabled anchor', props: { href, disabled: true, inline: true, children } },
  { name: 'Disabled button', props: { disabled: true, children } },
  {
    name: 'Disabled focusable anchor',
    props: { href, disabled: true, disabledFocusable: true, inline: true, children },
  },
  {
    name: 'Disabled focusable without disabled',
    props: { href, disabledFocusable: true, inline: true, children },
  },
  {
    name: 'Disabled focusable button',
    props: { disabled: true, disabledFocusable: true, children },
  },
  { name: 'External anchor', props: { href, external: true, children } },
  { name: 'External button', props: { external: true, children } },
  {
    name: 'External navigation overrides',
    props: { href, external: true, target: '_self', rel: 'external', children },
  },
  {
    name: 'External subtle inline anchor',
    props: { href, external: true, appearance: 'subtle', inline: true, children },
    surroundingText: true,
  },
  {
    name: 'External inherits parent typography',
    props: { href, external: true, children },
    parentFontSize: '20px',
  },
  {
    name: 'Disabled external anchor',
    props: { href, external: true, disabled: true, children },
  },
  {
    name: 'Consumer children and icon',
    props: {
      href,
      children: (
        <>
          <LinkContentIcon /> <span>{children}</span>
        </>
      ),
    },
  },
  { name: 'Inherited inline context', props: { href, children }, contextInline: true },
  {
    name: 'Explicit inline context opt-out',
    props: { href, inline: false, children },
    contextInline: true,
  },
  {
    name: 'Inverted background',
    props: { href, children },
    backgroundAppearance: 'inverted',
  },
  {
    name: 'Brand background overrides subtle',
    props: { href, appearance: 'subtle', children },
    backgroundAppearance: 'brand',
  },
  {
    name: 'Disabled on brand background',
    props: { href, appearance: 'subtle', disabled: true, children },
    backgroundAppearance: 'brand',
  },
];

export const linkConsumerExample: LinkExample = {
  name: 'Consumer CSS Modules',
  props: {
    href,
    external: true,
    appearance: 'subtle',
    inline: true,
    children,
    className: styles.consumerLink,
  },
};

function LinkFixture({
  implementation,
  props,
  surroundingText,
  parentFontSize,
  contextInline,
  backgroundAppearance,
}: LinkExample & { implementation: 'legacy' | 'headless' }): React.ReactElement {
  const Component = implementation === 'legacy' ? LegacyLink : HeadlessLink;
  const link = <Component {...props} />;
  let content = surroundingText ? (
    <p className={styles.paragraph}>
      Start here: {link}. These instructions apply to your project.
    </p>
  ) : (
    link
  );

  if (contextInline !== undefined) {
    content = (
      <LinkContextProvider value={{ inline: contextInline }}>{content}</LinkContextProvider>
    );
  }
  if (backgroundAppearance) {
    // A public Toast owns this context; no internal context registry is needed by the fixture.
    content = (
      <Toast appearance={backgroundAppearance}>
        <div>{content}</div>
      </Toast>
    );
  }

  return (
    <div
      className={styles.cell}
      style={parentFontSize ? { fontSize: parentFontSize } : undefined}
      data-link-implementation={implementation}
    >
      {content}
    </div>
  );
}

export function LinkComparison({
  examples = linkExamples,
}: {
  examples?: readonly LinkExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-link-case={example.name}>
          <span>{example.name}</span>
          <LinkFixture {...example} implementation="legacy" />
          <LinkFixture {...example} implementation="headless" />
        </div>
      ))}
    </div>
  );
}
