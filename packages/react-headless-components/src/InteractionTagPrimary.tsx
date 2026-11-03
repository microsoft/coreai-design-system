// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderInteractionTagPrimary,
  useInteractionTagPrimary,
  useInteractionTagPrimaryContextValues,
  type InteractionTagPrimaryProps,
} from '@fluentui/react-headless-components-preview/interaction-tag';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { useCoreAIDefaults } from '@coreai-ds/react-components';
import {
  InteractionTagVisualContext,
  tagAvatarShapes,
  tagAvatarSizes,
} from './TagVisualContext.js';
import { applyTagVisualSlots } from './TagVisualStyles.js';
import styles from './InteractionTagPrimary.module.css';

export { useInteractionTagPrimaryContextValues } from '@fluentui/react-headless-components-preview/interaction-tag';
export type {
  InteractionTagPrimaryContextValues,
  InteractionTagPrimaryProps,
  InteractionTagPrimarySlots,
  InteractionTagPrimaryState,
} from '@fluentui/react-headless-components-preview/interaction-tag';

export const interactionTagPrimaryClassNames = {
  root: 'fui-InteractionTagPrimary',
  media: 'fui-InteractionTagPrimary__media',
  icon: 'fui-InteractionTagPrimary__icon',
  primaryText: 'fui-InteractionTagPrimary__primaryText',
  secondaryText: 'fui-InteractionTagPrimary__secondaryText',
} as const;

export const InteractionTagPrimary: ForwardRefComponent<InteractionTagPrimaryProps> =
  React.forwardRef<HTMLButtonElement, InteractionTagPrimaryProps>(
    function InteractionTagPrimary(props, ref) {
      const { appearance, shape, size } = React.useContext(InteractionTagVisualContext);
      const defaultsEnabled = useCoreAIDefaults();
      const state = {
        ...useInteractionTagPrimary(props, ref),
        appearance,
        shape,
        size,
        avatarShape: tagAvatarShapes[shape],
        avatarSize: tagAvatarSizes[size],
      };
      state.root.className = [
        interactionTagPrimaryClassNames.root,
        styles.InteractionTagPrimary,
        state.root.className,
      ]
        .filter(Boolean)
        .join(' ');
      Object.assign(state.root, {
        'data-appearance': appearance,
        'data-shape': shape,
        'data-size': size,
        'data-has-media': state.media || state.icon ? '' : undefined,
        'data-coreai-defaults': defaultsEnabled ? '' : undefined,
      });
      applyTagVisualSlots(
        state,
        size,
        interactionTagPrimaryClassNames,
        {
          media: styles.InteractionTagPrimary__media,
          icon: styles.InteractionTagPrimary__icon,
          primaryText: styles.InteractionTagPrimary__primaryText,
          secondaryText: styles.InteractionTagPrimary__secondaryText,
        },
        defaultsEnabled,
      );
      return renderInteractionTagPrimary(state, useInteractionTagPrimaryContextValues(state));
    },
  );

InteractionTagPrimary.displayName = 'InteractionTagPrimary';
