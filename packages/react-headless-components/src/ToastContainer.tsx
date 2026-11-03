// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderToastContainer,
  useToastContainer,
  useToastContainerContextValues,
  type ToastContainerProps,
} from '@fluentui/react-headless-components-preview/toast';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './ToastContainer.module.css';

export {
  useToastContainerContext,
  useToastContainerContextValues,
  type ToastContainerContextValue,
  type ToastContainerProps,
  type ToastContainerSlots,
  type ToastContainerState,
} from '@fluentui/react-headless-components-preview/toast';

export const toastContainerClassNames = { root: 'fui-ToastContainer' } as const;

export const ToastContainer: ForwardRefComponent<ToastContainerProps> = React.forwardRef<
  HTMLDivElement,
  ToastContainerProps
>(function ToastContainer(props, ref) {
  const state = useToastContainer(props, ref);
  const context = useToastContainerContextValues(state);
  state.root.className = [
    toastContainerClassNames.root,
    styles.ToastContainer,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  return renderToastContainer(state, context);
});

ToastContainer.displayName = 'ToastContainer';
