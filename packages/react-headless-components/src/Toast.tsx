// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderToast,
  useToast,
  type ToastProps as HeadlessToastProps,
} from '@fluentui/react-headless-components-preview/toast';
import {
  BackgroundAppearanceProvider,
  type BackgroundAppearanceContextValue,
} from '@fluentui/react-shared-contexts';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './Toast.module.css';

export type {
  ToastChangeData,
  ToastChangeHandler,
  ToastId,
  ToastImperativeRef,
  ToastIntent,
  ToastPoliteness,
  ToastPosition,
  ToastSlots,
  ToastState,
  ToastStatus,
} from '@fluentui/react-headless-components-preview/toast';

export const toastClassNames = { root: 'fui-Toast' } as const;

export type ToastProps = HeadlessToastProps & {
  /** Visual background context for the toast and its actions. */
  appearance?: BackgroundAppearanceContextValue;
};

export const Toast: ForwardRefComponent<ToastProps> = React.forwardRef<HTMLDivElement, ToastProps>(
  function Toast({ appearance, ...props }, ref) {
    const state = useToast(props, ref);
    Object.assign(state.root, { 'data-appearance': appearance });
    state.root.className = [toastClassNames.root, styles.Toast, state.root.className]
      .filter(Boolean)
      .join(' ');

    return (
      <BackgroundAppearanceProvider value={appearance}>
        {renderToast(state)}
      </BackgroundAppearanceProvider>
    );
  },
);

Toast.displayName = 'Toast';
