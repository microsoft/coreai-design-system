// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderDialogBody,
  useDialogBody,
  type DialogBodyProps,
} from '@fluentui/react-headless-components-preview/dialog';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { useCoreAIDefaults } from '@coreai-ds/react-components';
import styles from './DialogBody.module.css';
import overrides from './DialogBody.overrides.module.css';

export type {
  DialogBodyProps,
  DialogBodySlots,
  DialogBodyState,
} from '@fluentui/react-headless-components-preview/dialog';

export const dialogBodyClassNames = { root: 'fui-DialogBody' } as const;

export const DialogBody: ForwardRefComponent<DialogBodyProps> = React.forwardRef<
  HTMLDivElement,
  DialogBodyProps
>(function DialogBody(props, ref) {
  const defaultsEnabled = useCoreAIDefaults();
  const state = useDialogBody(props, ref);
  state.root.className = [
    dialogBodyClassNames.root,
    styles.DialogBody,
    defaultsEnabled && overrides.DialogBody,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  return renderDialogBody(state);
});

DialogBody.displayName = 'DialogBody';
