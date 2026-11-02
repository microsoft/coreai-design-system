// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderCard,
  useCard,
  useCardContextValue,
  type CardProps as HeadlessCardProps,
} from '@fluentui/react-headless-components-preview/card';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { useCoreAIDefaults } from '@coreai-ds/react-components';
import styles from './Card.module.css';
import overrides from './Card.overrides.module.css';

export type {
  CardContextValue,
  CardOnSelectionChangeEvent,
  CardSlots,
} from '@fluentui/react-headless-components-preview/card';

export const cardClassNames = {
  root: 'fui-Card',
  floatingAction: 'fui-Card__floatingAction',
  checkbox: 'fui-Card__checkbox',
} as const;

export type CardAppearance = 'filled' | 'filled-alternative' | 'outline' | 'subtle';
export type CardSize = 'small' | 'medium' | 'large';
export type CardOrientation = 'horizontal' | 'vertical';
export type CardFloatingActionPosition = 'right' | 'left';

export type CardProps = HeadlessCardProps & {
  /** CoreAI defaults to filled-alternative; opting out restores filled. */
  appearance?: CardAppearance;
  /** Controls padding, spacing, and corner radius. @default 'medium' */
  size?: CardSize;
  /** Layout of the card contents. @default 'vertical' */
  orientation?: CardOrientation;
  /** Physical right or left floating-action rail, including RTL. @default 'right' */
  floatingActionPosition?: CardFloatingActionPosition;
};

export const Card: ForwardRefComponent<CardProps> = React.forwardRef<HTMLDivElement, CardProps>(
  function Card(
    {
      appearance: appearanceProp,
      size = 'medium',
      orientation = 'vertical',
      floatingActionPosition = 'right',
      ...props
    },
    ref,
  ) {
    const defaultsEnabled = useCoreAIDefaults();
    const appearance = appearanceProp ?? (defaultsEnabled ? 'filled-alternative' : 'filled');
    const state = useCard(props, ref);
    const context = useCardContextValue(state);

    Object.assign(state.root, {
      'data-appearance': appearance,
      'data-size': size,
      'data-orientation': orientation,
      'data-interactive':
        !state.disabled && (state.interactive || state.selectable) ? '' : undefined,
      'data-selectable': state.selectable ? '' : undefined,
      'data-coreai-defaults': defaultsEnabled ? '' : undefined,
      'data-floating-action-position': floatingActionPosition,
    });
    state.root.className = [
      cardClassNames.root,
      styles.Card,
      overrides.CardFloatingAction,
      defaultsEnabled && overrides.Card,
      state.root.className,
    ]
      .filter(Boolean)
      .join(' ');

    if (state.floatingAction) {
      state.floatingAction.className = [
        cardClassNames.floatingAction,
        styles.Card__floatingAction,
        overrides.CardFloatingAction__slot,
        state.floatingAction.className,
      ]
        .filter(Boolean)
        .join(' ');
    }
    if (state.checkbox) {
      state.checkbox.className = [
        cardClassNames.checkbox,
        styles.Card__checkbox,
        state.checkbox.className,
      ]
        .filter(Boolean)
        .join(' ');
    }

    return renderCard(state, context);
  },
);

Card.displayName = 'Card';
