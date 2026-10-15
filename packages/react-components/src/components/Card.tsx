// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Wrapped `Card` with CoreAI defaults plus a `floatingActionPosition` prop.
 *
 * - Defaults `appearance` to `'filled-alternative'` when CoreAI defaults are
 *   enabled (`useComponentDefaults()`); otherwise leaves stock behavior.
 * - Adds `floatingActionPosition`, which applies a className to the Card root
 *   that repositions the nested `.fui-Card__floatingAction` slot (stock Fluent
 *   only pins it to the right).
 *
 * Not a `withComponentDefaults` factory case: that factory only fills default
 * prop values and cannot widen the prop union. Surface / interaction CSS lives
 * in the `useCardStyles` customStyleHook (`Card.styles.ts`). Per-instance
 * `className` / `appearance` overrides always win (merged last).
 */
import * as React from 'react';
import {
  Card as FluentCard,
  type CardProps as FluentCardProps,
  type ForwardRefComponent,
  makeStyles,
  mergeClasses,
} from '@fluentui/react-components';
import { useComponentDefaults } from '../contexts/ComponentDefaultsContext.js';

export type CardFloatingActionPosition = 'right' | 'left';

// Each variant sets a className on the Card root that repositions
// the absolutely-positioned `.fui-Card__floatingAction` slot.
// `right` mirrors the stock Fluent placement
const useStyles = makeStyles({
  floatingAction: {
    '--fui-Card--floatingAction-width': '28px',

    '& .fui-Card__floatingAction': {
      display: 'flex',
      flexDirection: 'column',
      padding: '6px 4px',
      width: 'var(--fui-Card--floatingAction-width)',
      boxSizing: 'border-box',
    },
  },

  right: {
    '& .fui-Card__floatingAction': {
      inset: '0 0 0 auto',
      alignItems: 'end',
    },
  },

  left: {
    paddingLeft: 'calc(var(--fui-Card--floatingAction-width) + var(--fui-Card--size))',

    '& .fui-Card__floatingAction': {
      inset: '0 auto 0 0',
    },
  },
});

export interface CardProps extends FluentCardProps {
  /**
   * Placement of the `floatingAction` slot within the card.
   * - 'right' (default): matches stock Fluent placement
   * - 'left': left edge
   * @default 'right'
   */
  floatingActionPosition?: CardFloatingActionPosition;
}

export const Card: ForwardRefComponent<CardProps> = React.forwardRef<HTMLDivElement, CardProps>(
  (props, ref) => {
    const { floatingActionPosition = 'right', appearance, className, ...rest } = props;
    const enabled = useComponentDefaults();
    const styles = useStyles();

    // Default appearance only when CoreAI defaults are enabled; otherwise leave
    // it undefined so stock Fluent semantics apply.
    const resolvedAppearance = appearance ?? (enabled ? 'filled-alternative' : undefined);

    return (
      <FluentCard
        {...rest}
        ref={ref}
        appearance={resolvedAppearance}
        className={mergeClasses(styles.floatingAction, styles[floatingActionPosition], className)}
      />
    );
  },
) as ForwardRefComponent<CardProps>;

Card.displayName = 'Card';
