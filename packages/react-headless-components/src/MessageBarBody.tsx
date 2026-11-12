// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderMessageBarBody,
  useMessageBarBody,
  useMessageBarBodyContextValues,
  type MessageBarBodyProps,
} from '@fluentui/react-headless-components-preview/message-bar';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './MessageBarBody.module.css';

export type {
  MessageBarBodyContextValues,
  MessageBarBodyProps,
  MessageBarBodySlots,
} from '@fluentui/react-headless-components-preview/message-bar';

export const messageBarBodyClassNames = { root: 'fui-MessageBarBody' } as const;

export const MessageBarBody: ForwardRefComponent<MessageBarBodyProps> = React.forwardRef<
  HTMLDivElement,
  MessageBarBodyProps
>(function MessageBarBody(props, ref) {
  const state = useMessageBarBody(props, ref);
  const context = useMessageBarBodyContextValues(state);
  state.root.className = [
    messageBarBodyClassNames.root,
    styles.MessageBarBody,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  return renderMessageBarBody(state, context);
});

MessageBarBody.displayName = 'MessageBarBody';
