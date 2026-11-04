// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderToolbarDivider,
  useToolbarDivider,
  type ToolbarDividerProps,
} from '@fluentui/react-headless-components-preview/toolbar';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { dividerLabeledClassNames } from './Divider.js';
import styles from './ToolbarDivider.module.css';

export type {
  ToolbarDividerProps,
  ToolbarDividerState,
} from '@fluentui/react-headless-components-preview/toolbar';

export const toolbarDividerClassNames = {
  root: 'fui-ToolbarDivider',
  wrapper: 'fui-ToolbarDivider__wrapper',
} as const;

export const ToolbarDivider: ForwardRefComponent<ToolbarDividerProps> = React.forwardRef<
  HTMLDivElement,
  ToolbarDividerProps
>(function ToolbarDivider(props, ref) {
  const state = useToolbarDivider(props, ref);
  Object.assign(state.root, {
    'data-orientation': state.vertical ? 'vertical' : 'horizontal',
    'data-align-content': 'center',
    'data-appearance': 'default',
    'data-has-content': state.root.children !== undefined ? '' : undefined,
  });
  state.root.className = [
    dividerLabeledClassNames.root,
    toolbarDividerClassNames.root,
    styles.ToolbarDivider,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  if (state.wrapper) {
    state.wrapper.className = [
      dividerLabeledClassNames.wrapper,
      toolbarDividerClassNames.wrapper,
      styles.ToolbarDivider__wrapper,
      state.wrapper.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  return renderToolbarDivider(state);
});

ToolbarDivider.displayName = 'ToolbarDivider';
