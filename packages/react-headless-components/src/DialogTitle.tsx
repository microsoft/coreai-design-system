// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderDialogTitle,
  useDialogTitle,
  type DialogTitleProps,
} from '@fluentui/react-headless-components-preview/dialog';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './DialogTitle.module.css';

export type {
  DialogTitleProps,
  DialogTitleSlots,
  DialogTitleState,
} from '@fluentui/react-headless-components-preview/dialog';

export const dialogTitleClassNames = { root: 'fui-DialogTitle' } as const;

export const DialogTitle: ForwardRefComponent<DialogTitleProps> = React.forwardRef<
  HTMLHeadingElement,
  DialogTitleProps
>(function DialogTitle(props, ref) {
  const state = useDialogTitle(props, ref);
  state.root.className = [dialogTitleClassNames.root, styles.DialogTitle, state.root.className]
    .filter(Boolean)
    .join(' ');
  return renderDialogTitle(state);
});

DialogTitle.displayName = 'DialogTitle';
