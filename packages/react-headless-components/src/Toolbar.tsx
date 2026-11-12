// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderToolbar,
  useToolbar,
  useToolbarContextValues,
  type ToolbarProps as HeadlessToolbarProps,
} from '@fluentui/react-headless-components-preview/toolbar';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './Toolbar.module.css';

export {
  useToolbarContext,
  useToolbarContextValues,
} from '@fluentui/react-headless-components-preview/toolbar';
export type {
  ToolbarContextValues,
  ToolbarSlots,
  ToolbarState,
} from '@fluentui/react-headless-components-preview/toolbar';

export type ToolbarProps = HeadlessToolbarProps & {
  /** Spacing around the controls and inherited toggle/radio size. @default 'medium' */
  size?: 'small' | 'medium' | 'large';
};

export const toolbarClassNames = { root: 'fui-Toolbar' } as const;

export const Toolbar: ForwardRefComponent<ToolbarProps> = React.forwardRef<
  HTMLDivElement,
  ToolbarProps
>(function Toolbar({ size = 'medium', ...props }, ref) {
  const state = useToolbar(props, ref);
  const contextValues = useToolbarContextValues(state);
  // Size is visual-only; retain the hook's selection handlers and resolved checked values.
  const toolbar = React.useMemo(
    () => ({ ...contextValues.toolbar, size }),
    [contextValues.toolbar, size],
  );
  Object.assign(state.root, { 'data-size': size });
  state.root.className = [toolbarClassNames.root, styles.Toolbar, state.root.className]
    .filter(Boolean)
    .join(' ');
  return renderToolbar(state, { toolbar });
});

Toolbar.displayName = 'Toolbar';
