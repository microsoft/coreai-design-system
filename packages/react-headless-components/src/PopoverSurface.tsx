// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderPopoverSurface,
  usePopoverSurface,
  type PopoverSurfaceProps,
} from '@fluentui/react-headless-components-preview/popover';
import type { ForwardRefComponent, InferredElementRefType } from '@fluentui/react-utilities';
import { useCoreAIDefaults } from './ComponentDefaultsContext.js';
import { PopoverVisualContext } from './PopoverVisualContext.js';
import styles from './PopoverSurface.module.css';
import overrides from './PopoverSurface.overrides.module.css';

export type {
  PopoverSurfaceProps,
  PopoverSurfaceSlots,
  PopoverSurfaceState,
} from '@fluentui/react-headless-components-preview/popover';

export const popoverSurfaceClassNames = {
  root: 'fui-PopoverSurface',
} as const;

export const PopoverSurface: ForwardRefComponent<PopoverSurfaceProps> = React.forwardRef<
  InferredElementRefType<PopoverSurfaceProps>,
  PopoverSurfaceProps
>(function PopoverSurface(props, ref) {
  const { appearance, size } = React.useContext(PopoverVisualContext);
  const defaultsEnabled = useCoreAIDefaults();
  const state = usePopoverSurface(props, ref);

  Object.assign(state.root, {
    'data-appearance': appearance,
    'data-size': size,
    'data-coreai-defaults': defaultsEnabled ? '' : undefined,
  });
  state.root.className = [
    popoverSurfaceClassNames.root,
    styles.PopoverSurface,
    defaultsEnabled && overrides.PopoverSurface,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');

  return renderPopoverSurface(state);
});

PopoverSurface.displayName = 'PopoverSurface';
