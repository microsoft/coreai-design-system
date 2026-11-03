// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderMessageBar,
  useMessageBar,
  useMessageBarContextValues,
  type MessageBarIntent as HeadlessMessageBarIntent,
  type MessageBarProps as HeadlessMessageBarProps,
} from '@fluentui/react-headless-components-preview/message-bar';
import { InfoFilled } from '@fluentui/react-icons/headless/svg/info';
import { WarningFilled } from '@fluentui/react-icons/headless/svg/warning';
import { DiamondDismissFilled } from '@fluentui/react-icons/headless/svg/diamond-dismiss';
import { CheckmarkCircleFilled } from '@fluentui/react-icons/headless/svg/checkmark-circle';
import { slot, type ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './MessageBar.module.css';
import overrides from './MessageBar.overrides.module.css';

export {
  useMessageBarContext,
  type MessageBarContextValues,
  type MessageBarSlots,
} from '@fluentui/react-headless-components-preview/message-bar';

export const messageBarClassNames = {
  root: 'fui-MessageBar',
  icon: 'fui-MessageBar__icon',
  bottomReflowSpacer: 'fui-MessageBar__bottomReflowSpacer',
} as const;

export type MessageBarIntent = HeadlessMessageBarIntent | 'brand';
export type MessageBarShape = 'rounded' | 'square';

export type MessageBarProps = Omit<HeadlessMessageBarProps, 'intent'> & {
  /** Brand is a visual extension of info, available even with CoreAI defaults disabled. */
  intent?: MessageBarIntent;
  /** Rounded for component messages; square for page messages. @default 'rounded' */
  shape?: MessageBarShape;
};

const intentIcons = {
  info: InfoFilled,
  warning: WarningFilled,
  error: DiamondDismissFilled,
  success: CheckmarkCircleFilled,
};

export const MessageBar: ForwardRefComponent<MessageBarProps> = React.forwardRef<
  HTMLDivElement,
  MessageBarProps
>(function MessageBar({ shape = 'rounded', intent = 'info', icon, ...props }, ref) {
  const nativeIntent = intent === 'brand' ? 'info' : intent;
  const state = useMessageBar({ ...props, icon, intent: nativeIntent }, ref);
  const context = useMessageBarContextValues(state);
  const IntentIcon = intentIcons[nativeIntent];

  state.icon = slot.optional(icon, {
    defaultProps: { children: <IntentIcon aria-hidden /> },
    renderByDefault: true,
    elementType: 'div',
  });
  Object.assign(state.root, { 'data-shape': shape, 'data-intent': intent });
  state.root.className = [
    messageBarClassNames.root,
    styles.MessageBar,
    intent === 'brand' && overrides.MessageBar,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');

  if (state.icon) {
    Object.assign(state.icon, { 'data-intent': nativeIntent });
    state.icon.className = [
      messageBarClassNames.icon,
      styles.MessageBar__icon,
      intent === 'brand' && overrides.MessageBar__icon,
      state.icon.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  if (state.bottomReflowSpacer) {
    state.bottomReflowSpacer.className = [
      messageBarClassNames.bottomReflowSpacer,
      styles.MessageBar__bottomReflowSpacer,
      state.bottomReflowSpacer.className,
    ]
      .filter(Boolean)
      .join(' ');
  }

  return renderMessageBar(state, context);
});

MessageBar.displayName = 'MessageBar';
