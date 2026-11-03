// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderToolbarRadioGroup,
  useToolbarRadioGroup,
  type ToolbarRadioGroupProps,
} from '@fluentui/react-headless-components-preview/toolbar';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { toolbarGroupClassNames } from './ToolbarGroup.js';
import styles from './ToolbarGroup.module.css';

export type {
  ToolbarRadioGroupProps,
  ToolbarRadioGroupState,
} from '@fluentui/react-headless-components-preview/toolbar';

export const toolbarRadioGroupClassNames = { root: 'fui-ToolbarRadioGroup' } as const;

export const ToolbarRadioGroup: ForwardRefComponent<ToolbarRadioGroupProps> = React.forwardRef<
  HTMLDivElement,
  ToolbarRadioGroupProps
>(function ToolbarRadioGroup(props, ref) {
  const state = useToolbarRadioGroup(props, ref);
  state.root.className = [
    toolbarGroupClassNames.root,
    toolbarRadioGroupClassNames.root,
    styles.ToolbarGroup,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  return renderToolbarRadioGroup(state);
});

ToolbarRadioGroup.displayName = 'ToolbarRadioGroup';
