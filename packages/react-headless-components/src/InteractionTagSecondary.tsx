// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderInteractionTagSecondary,
  useInteractionTagSecondary,
  type InteractionTagSecondaryProps,
} from '@fluentui/react-headless-components-preview/interaction-tag';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { DismissRegular } from '@fluentui/react-icons/headless/svg/dismiss';
import { useCoreAIDefaults } from '@coreai-ds/react-components';
import { InteractionTagVisualContext } from './TagVisualContext.js';
import styles from './InteractionTagSecondary.module.css';
import overrides from './InteractionTagSecondary.overrides.module.css';

export type {
  InteractionTagSecondaryProps,
  InteractionTagSecondarySlots,
  InteractionTagSecondaryState,
} from '@fluentui/react-headless-components-preview/interaction-tag';

export const interactionTagSecondaryClassNames = { root: 'fui-InteractionTagSecondary' } as const;

export const InteractionTagSecondary: ForwardRefComponent<InteractionTagSecondaryProps> =
  React.forwardRef<HTMLButtonElement, InteractionTagSecondaryProps>(
    function InteractionTagSecondary(props, ref) {
      const { appearance, shape, size } = React.useContext(InteractionTagVisualContext);
      const defaultsEnabled = useCoreAIDefaults();
      const state = useInteractionTagSecondary(props, ref);
      state.root.children ??= <DismissRegular className={styles.InteractionTagSecondary__glyph} />;
      state.root.className = [
        interactionTagSecondaryClassNames.root,
        styles.InteractionTagSecondary,
        defaultsEnabled && overrides.InteractionTagSecondary,
        state.root.className,
      ]
        .filter(Boolean)
        .join(' ');
      Object.assign(state.root, {
        'data-appearance': appearance,
        'data-shape': shape,
        'data-size': size,
        'data-coreai-defaults': defaultsEnabled ? '' : undefined,
      });
      return renderInteractionTagSecondary(state);
    },
  );

InteractionTagSecondary.displayName = 'InteractionTagSecondary';
