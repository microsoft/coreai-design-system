// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderToastFooter,
  useToastFooter,
  type ToastFooterProps,
} from '@fluentui/react-headless-components-preview/toast';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './ToastFooter.module.css';

export type {
  ToastFooterProps,
  ToastFooterSlots,
  ToastFooterState,
} from '@fluentui/react-headless-components-preview/toast';

export const toastFooterClassNames = { root: 'fui-ToastFooter' } as const;

export const ToastFooter: ForwardRefComponent<ToastFooterProps> = React.forwardRef<
  HTMLDivElement,
  ToastFooterProps
>(function ToastFooter(props, ref) {
  const state = useToastFooter(props, ref);
  state.root.className = [toastFooterClassNames.root, styles.ToastFooter, state.root.className]
    .filter(Boolean)
    .join(' ');
  return renderToastFooter(state);
});

ToastFooter.displayName = 'ToastFooter';
