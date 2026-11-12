// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderMessageBarTitle,
  useMessageBarTitle,
  type MessageBarTitleProps,
} from '@fluentui/react-headless-components-preview/message-bar';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './MessageBarTitle.module.css';

export type {
  MessageBarTitleProps,
  MessageBarTitleSlots,
} from '@fluentui/react-headless-components-preview/message-bar';

export const messageBarTitleClassNames = { root: 'fui-MessageBarTitle' } as const;

export const MessageBarTitle: ForwardRefComponent<MessageBarTitleProps> = React.forwardRef<
  HTMLSpanElement,
  MessageBarTitleProps
>(function MessageBarTitle(props, ref) {
  const state = useMessageBarTitle(props, ref);
  state.root.className = [
    messageBarTitleClassNames.root,
    styles.MessageBarTitle,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  return renderMessageBarTitle(state);
});

MessageBarTitle.displayName = 'MessageBarTitle';
