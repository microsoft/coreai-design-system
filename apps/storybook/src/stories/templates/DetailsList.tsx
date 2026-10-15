// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Templates / Details List
 *
 * Starter scaffold for building a label-value details panel with CoreAI
 * primitives. Keep the semantic <dl>/<dt>/<dd> structure, replace the sample
 * items with your own data, and optionally customize class hooks.
 *
 * Displays label-value pairs in a compact, readable layout.
 * Useful for user profiles, resource metadata, and summary panels.
 *
 * Copy-paste starting point — not an importable component.
 */

import * as React from 'react';
import { makeStyles, mergeClasses, Text, tokens } from '@coreai-ds/react-components';

export type DetailsItem = {
  key: React.Key;
  label: React.ReactNode;
  /** The value to show. If there is no value, leave this detail out of the list. */
  value: React.ReactNode;
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  // ── Root container ─────────────────────────────────────────────────────────
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
    margin: 0,
    padding: 0,
    width: '100%',
  },

  // ── Row layout ─────────────────────────────────────────────────────────────
  item: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXXS,
  },

  // ── Label / value text ────────────────────────────────────────────────────
  label: {
    margin: 0,
  },
  value: {
    margin: 0,
  },
});

export interface DetailsListProps extends Omit<React.ComponentPropsWithoutRef<'dl'>, 'children'> {
  items: DetailsItem[];
  itemClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DetailsList({
  items,
  className,
  itemClassName,
  labelClassName,
  valueClassName,
  ...rest
}: DetailsListProps) {
  const styles = useStyles();

  return (
    <dl {...rest} className={mergeClasses('fui-DetailsList', styles.root, className)}>
      {items.map((item) => (
        <div
          key={item.key}
          className={mergeClasses('fui-DetailsList__item', styles.item, itemClassName)}
        >
          <dt className={mergeClasses('fui-DetailsList__label', styles.label, labelClassName)}>
            {typeof item.label === 'string' || typeof item.label === 'number' ? (
              <Text preset="bodySStrong" foreground={2}>
                {item.label}
              </Text>
            ) : (
              item.label
            )}
          </dt>
          <dd className={mergeClasses('fui-DetailsList__value', styles.value, valueClassName)}>
            {typeof item.value === 'string' || typeof item.value === 'number' ? (
              <Text preset="body" foreground={1}>
                {item.value}
              </Text>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
