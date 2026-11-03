// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderMessageBarActions,
  useMessageBarActions,
  useMessageBarActionsContextValues,
  type MessageBarActionsProps,
} from '@fluentui/react-headless-components-preview/message-bar';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './MessageBarActions.module.css';

export type {
  MessageBarActionsContextValues,
  MessageBarActionsProps,
  MessageBarActionsSlots,
} from '@fluentui/react-headless-components-preview/message-bar';

export const messageBarActionsClassNames = {
  root: 'fui-MessageBarActions',
  containerAction: 'fui-MessageBarActions__containerAction',
} as const;

export const MessageBarActions: ForwardRefComponent<MessageBarActionsProps> = React.forwardRef<
  HTMLDivElement,
  MessageBarActionsProps
>(function MessageBarActions(props, ref) {
  const state = useMessageBarActions(props, ref);
  const context = useMessageBarActionsContextValues();
  state.root.className = [
    messageBarActionsClassNames.root,
    styles.MessageBarActions,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  if (state.containerAction) {
    state.containerAction.className = [
      messageBarActionsClassNames.containerAction,
      styles.MessageBarActions__containerAction,
      state.containerAction.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  return renderMessageBarActions(state, context);
});

MessageBarActions.displayName = 'MessageBarActions';
