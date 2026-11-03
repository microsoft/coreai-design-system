// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderDialogActions,
  useDialogActions,
  type DialogActionsProps as HeadlessDialogActionsProps,
} from '@fluentui/react-headless-components-preview/dialog';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './DialogActions.module.css';

export type {
  DialogActionsSlots,
  DialogActionsState,
} from '@fluentui/react-headless-components-preview/dialog';

export type DialogActionsProps = HeadlessDialogActionsProps & {
  /** Position within the surface grid. @default 'end' */
  position?: 'start' | 'end';
  /** Expand across the complete surface grid. @default false */
  fluid?: boolean;
};

export const dialogActionsClassNames = { root: 'fui-DialogActions' } as const;

export const DialogActions: ForwardRefComponent<DialogActionsProps> = React.forwardRef<
  HTMLDivElement,
  DialogActionsProps
>(function DialogActions({ position = 'end', fluid = false, ...props }, ref) {
  const state = useDialogActions(props, ref);
  Object.assign(state.root, {
    'data-position': position,
    'data-fluid': fluid ? '' : undefined,
  });
  state.root.className = [dialogActionsClassNames.root, styles.DialogActions, state.root.className]
    .filter(Boolean)
    .join(' ');
  return renderDialogActions(state);
});

DialogActions.displayName = 'DialogActions';
