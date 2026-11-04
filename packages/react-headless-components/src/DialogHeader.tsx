// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderDialogHeader,
  useDialogHeader,
  type DialogHeaderProps,
} from '@fluentui/react-headless-components-preview/dialog';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './DialogHeader.module.css';

export type {
  DialogHeaderProps,
  DialogHeaderSlots,
  DialogHeaderState,
} from '@fluentui/react-headless-components-preview/dialog';

export const dialogHeaderClassNames = { root: 'fui-DialogHeader' } as const;

export const DialogHeader: ForwardRefComponent<DialogHeaderProps> = React.forwardRef<
  HTMLElement,
  DialogHeaderProps
>(function DialogHeader(props, ref) {
  const state = useDialogHeader(props, ref);
  state.root.className = [dialogHeaderClassNames.root, styles.DialogHeader, state.root.className]
    .filter(Boolean)
    .join(' ');
  return renderDialogHeader(state);
});

DialogHeader.displayName = 'DialogHeader';
