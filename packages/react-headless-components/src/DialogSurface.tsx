// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderDialogSurface,
  useDialogContext,
  useDialogSurface,
  type DialogSurfaceProps,
} from '@fluentui/react-headless-components-preview/dialog';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { useCoreAIDefaults } from './ComponentDefaultsContext.js';
import styles from './DialogSurface.module.css';
import overrides from './DialogSurface.overrides.module.css';

export type {
  DialogSurfaceProps,
  DialogSurfaceSlots,
  DialogSurfaceState,
} from '@fluentui/react-headless-components-preview/dialog';

export const dialogSurfaceClassNames = { root: 'fui-DialogSurface' } as const;

export const DialogSurface: ForwardRefComponent<DialogSurfaceProps> = React.forwardRef<
  HTMLDialogElement,
  DialogSurfaceProps
>(function DialogSurface(props, ref) {
  const defaultsEnabled = useCoreAIDefaults();
  const { isNestedDialog } = useDialogContext();
  const state = useDialogSurface(props, ref);
  Object.assign(state.root, {
    'data-coreai-defaults': defaultsEnabled ? '' : undefined,
    'data-dialog-nested': isNestedDialog ? '' : undefined,
  });
  state.root.className = [
    dialogSurfaceClassNames.root,
    styles.DialogSurface,
    defaultsEnabled && overrides.DialogSurface,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  return renderDialogSurface(state);
});

DialogSurface.displayName = 'DialogSurface';
