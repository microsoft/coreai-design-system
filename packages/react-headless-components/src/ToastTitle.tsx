// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderToastTitle,
  useToastTitle,
  type ToastTitleProps,
} from '@fluentui/react-headless-components-preview/toast';
import { CheckmarkCircleFilled } from '@fluentui/react-icons/headless/svg/checkmark-circle';
import { DiamondDismissFilled } from '@fluentui/react-icons/headless/svg/diamond-dismiss';
import { InfoFilled } from '@fluentui/react-icons/headless/svg/info';
import { WarningFilled } from '@fluentui/react-icons/headless/svg/warning';
import { useBackgroundAppearance } from '@fluentui/react-shared-contexts';
import { slot, type ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './ToastTitle.module.css';

export type {
  ToastTitleProps,
  ToastTitleSlots,
  ToastTitleState,
} from '@fluentui/react-headless-components-preview/toast';

export const toastTitleClassNames = {
  root: 'fui-ToastTitle',
  media: 'fui-ToastTitle__media',
  action: 'fui-ToastTitle__action',
} as const;

const intentIcons = {
  info: InfoFilled,
  success: CheckmarkCircleFilled,
  warning: WarningFilled,
  error: DiamondDismissFilled,
};

export const ToastTitle: ForwardRefComponent<ToastTitleProps> = React.forwardRef<
  HTMLDivElement,
  ToastTitleProps
>(function ToastTitle(props, ref) {
  const state = useToastTitle(props, ref);
  const appearance = useBackgroundAppearance();
  const IntentIcon = state.intent ? intentIcons[state.intent] : undefined;

  state.media = slot.optional(props.media, {
    defaultProps: { children: IntentIcon ? <IntentIcon aria-hidden /> : undefined },
    renderByDefault: !!state.intent,
    elementType: 'div',
  });
  Object.assign(state.root, { 'data-appearance': appearance });
  state.root.className = [toastTitleClassNames.root, styles.ToastTitle, state.root.className]
    .filter(Boolean)
    .join(' ');
  if (state.media) {
    Object.assign(state.media, {
      'data-appearance': appearance,
      'data-intent': state.intent,
    });
    state.media.className = [
      toastTitleClassNames.media,
      styles.ToastTitle__media,
      state.media.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  if (state.action) {
    Object.assign(state.action, { 'data-appearance': appearance });
    state.action.className = [
      toastTitleClassNames.action,
      styles.ToastTitle__action,
      state.action.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  return renderToastTitle(state);
});

ToastTitle.displayName = 'ToastTitle';
