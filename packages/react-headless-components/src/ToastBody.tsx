// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderToastBody,
  useToastBody,
  type ToastBodyProps,
} from '@fluentui/react-headless-components-preview/toast';
import { useBackgroundAppearance } from '@fluentui/react-shared-contexts';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './ToastBody.module.css';

export type {
  ToastBodyProps,
  ToastBodySlots,
  ToastBodyState,
} from '@fluentui/react-headless-components-preview/toast';

export const toastBodyClassNames = {
  root: 'fui-ToastBody',
  subtitle: 'fui-ToastBody__subtitle',
} as const;

export const ToastBody: ForwardRefComponent<ToastBodyProps> = React.forwardRef<
  HTMLDivElement,
  ToastBodyProps
>(function ToastBody(props, ref) {
  const state = useToastBody(props, ref);
  const appearance = useBackgroundAppearance();
  Object.assign(state.root, { 'data-appearance': appearance });
  state.root.className = [toastBodyClassNames.root, styles.ToastBody, state.root.className]
    .filter(Boolean)
    .join(' ');
  if (state.subtitle) {
    Object.assign(state.subtitle, { 'data-appearance': appearance });
    state.subtitle.className = [
      toastBodyClassNames.subtitle,
      styles.ToastBody__subtitle,
      state.subtitle.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  return renderToastBody(state);
});

ToastBody.displayName = 'ToastBody';
