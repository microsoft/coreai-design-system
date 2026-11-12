// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderCardFooter,
  useCardFooter,
  type CardFooterProps,
} from '@fluentui/react-headless-components-preview/card';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './CardFooter.module.css';

export type {
  CardFooterProps,
  CardFooterSlots,
} from '@fluentui/react-headless-components-preview/card';

export const cardFooterClassNames = {
  root: 'fui-CardFooter',
  action: 'fui-CardFooter__action',
} as const;

export const CardFooter: ForwardRefComponent<CardFooterProps> = React.forwardRef<
  HTMLDivElement,
  CardFooterProps
>(function CardFooter(props, ref) {
  const state = useCardFooter(props, ref);
  state.root.className = [cardFooterClassNames.root, styles.CardFooter, state.root.className]
    .filter(Boolean)
    .join(' ');
  if (state.action) {
    state.action.className = [
      cardFooterClassNames.action,
      styles.CardFooter__action,
      state.action.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  return renderCardFooter(state);
});

CardFooter.displayName = 'CardFooter';
