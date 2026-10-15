// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Templates / Empty State
 *
 * Composable empty-state pattern for pages and data surfaces that have no
 * content to display. Supply only the slots needed for the use case, from a
 * compact message through to metrics, cards, actions, and supporting links.
 *
 * Copy-paste starting point — not a published, importable component. Copy
 * this file into your codebase and adjust as needed.
 */

import * as React from 'react';
import { makeStyles, tokens, Text } from '@coreai-ds/react-components';

export const useEmptyStateStyles = makeStyles({
  root: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: tokens.spacingVerticalXL,
    width: '100%',
    minHeight: '400px', // no dimension token; preserves the empty-state canvas height
    paddingBlock: tokens.spacingVerticalXXXL,
    paddingInline: tokens.spacingHorizontalXXL,
    textAlign: 'center',
  },
  illustration: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeHero800,
    lineHeight: 1,
  },
  copy: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    rowGap: tokens.spacingVerticalXS,
    maxWidth: '600px', // no dimension token; matches the Figma copy width
  },
  header: {
    marginBlock: 0,
  },
  description: {
    marginBlock: 0,
  },
  collection: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalL,
    width: '100%',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalS,
    width: '100%',
  },
  links: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingHorizontalS,
  },
});

export interface EmptyStateProps {
  /** Optional illustration or icon displayed above the message. */
  illustration?: React.ReactNode;
  /** Main empty-state heading. */
  header: React.ReactNode;
  /** Optional supporting text explaining the state or the next step. */
  description?: React.ReactNode;
  /** Optional row of value propositions, metrics, or highlights. */
  metrics?: React.ReactNode;
  /** Optional row of cards, choices, integrations, or detailed content. */
  cards?: React.ReactNode;
  /** Optional row of primary and secondary actions. */
  actions?: React.ReactNode;
  /** Optional supporting links displayed after the actions. */
  links?: React.ReactNode;
}

export function EmptyState({
  illustration,
  header,
  description,
  metrics,
  cards,
  actions,
  links,
}: EmptyStateProps) {
  const styles = useEmptyStateStyles();
  return (
    <div className={styles.root}>
      {illustration ? <div className={styles.illustration}>{illustration}</div> : null}

      <div className={styles.copy}>
        <Text as="h2" preset="heading4" foreground={1} className={styles.header}>
          {header}
        </Text>
        {description ? (
          <Text as="p" preset="body" foreground={2} className={styles.description}>
            {description}
          </Text>
        ) : null}
      </div>

      {metrics ? <div className={styles.collection}>{metrics}</div> : null}
      {cards ? <div className={styles.collection}>{cards}</div> : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
      {links ? <div className={styles.links}>{links}</div> : null}
    </div>
  );
}
