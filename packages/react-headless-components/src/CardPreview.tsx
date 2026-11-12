// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderCardPreview,
  useCardPreview,
  type CardPreviewProps,
} from '@fluentui/react-headless-components-preview/card';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './CardPreview.module.css';

export type {
  CardPreviewProps,
  CardPreviewSlots,
} from '@fluentui/react-headless-components-preview/card';

export const cardPreviewClassNames = {
  root: 'fui-CardPreview',
  logo: 'fui-CardPreview__logo',
} as const;

export const CardPreview: ForwardRefComponent<CardPreviewProps> = React.forwardRef<
  HTMLDivElement,
  CardPreviewProps
>(function CardPreview(props, ref) {
  const state = useCardPreview(props, ref);
  state.root.className = [cardPreviewClassNames.root, styles.CardPreview, state.root.className]
    .filter(Boolean)
    .join(' ');
  if (state.logo) {
    state.logo.className = [
      cardPreviewClassNames.logo,
      styles.CardPreview__logo,
      state.logo.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  return renderCardPreview(state);
});

CardPreview.displayName = 'CardPreview';
