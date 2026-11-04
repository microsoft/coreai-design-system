// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderCardHeader,
  useCardHeader,
  type CardHeaderProps,
} from '@fluentui/react-headless-components-preview/card';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './CardHeader.module.css';

export type {
  CardHeaderProps,
  CardHeaderSlots,
} from '@fluentui/react-headless-components-preview/card';

export const cardHeaderClassNames = {
  root: 'fui-CardHeader',
  image: 'fui-CardHeader__image',
  header: 'fui-CardHeader__header',
  description: 'fui-CardHeader__description',
  action: 'fui-CardHeader__action',
} as const;

export const CardHeader: ForwardRefComponent<CardHeaderProps> = React.forwardRef<
  HTMLDivElement,
  CardHeaderProps
>(function CardHeader(props, ref) {
  const state = useCardHeader(props, ref);
  Object.assign(state.root, {
    'data-has-description': state.description ? '' : undefined,
  });
  for (const [name, scopedClass] of [
    ['root', styles.CardHeader],
    ['image', styles.CardHeader__image],
    ['header', styles.CardHeader__header],
    ['description', styles.CardHeader__description],
    ['action', styles.CardHeader__action],
  ] as const) {
    const resolved = state[name];
    if (resolved) {
      resolved.className = [cardHeaderClassNames[name], scopedClass, resolved.className]
        .filter(Boolean)
        .join(' ');
    }
  }
  return renderCardHeader(state);
});

CardHeader.displayName = 'CardHeader';
