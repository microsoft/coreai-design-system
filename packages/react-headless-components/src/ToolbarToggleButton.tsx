// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderToolbarToggleButton,
  useToolbarContext,
  useToolbarToggleButton,
  type ToolbarToggleButtonProps as HeadlessToolbarToggleButtonProps,
} from '@fluentui/react-headless-components-preview/toolbar';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { toggleButtonClassNames } from './ToggleButton.js';
import { applyToolbarButtonStyles, type ToolbarButtonAppearance } from './ToolbarVisuals.js';
import styles from './ToolbarToggleButton.module.css';

export type { ToolbarToggleButtonState } from '@fluentui/react-headless-components-preview/toolbar';
export type ToolbarToggleButtonProps = HeadlessToolbarToggleButtonProps & {
  /** Visual emphasis. @default 'subtle' */
  appearance?: ToolbarButtonAppearance;
};

export const toolbarToggleButtonClassNames = {
  root: 'fui-ToolbarToggleButton',
  icon: 'fui-ToolbarToggleButton__icon',
} as const;

export const ToolbarToggleButton: ForwardRefComponent<ToolbarToggleButtonProps> = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ToolbarToggleButtonProps
>(function ToolbarToggleButton({ appearance = 'subtle', size: sizeProp, ...props }, ref) {
  const contextSize = useToolbarContext((context) => context.size);
  const state = useToolbarToggleButton(props, ref);
  state.root.className = [toggleButtonClassNames.root, state.root.className]
    .filter(Boolean)
    .join(' ');
  if (state.icon) {
    state.icon.className = [toggleButtonClassNames.icon, state.icon.className]
      .filter(Boolean)
      .join(' ');
  }
  applyToolbarButtonStyles(
    state,
    appearance,
    sizeProp ?? contextSize ?? 'medium',
    toolbarToggleButtonClassNames,
    { root: styles.ToolbarToggleButton, icon: styles.ToolbarToggleButton__icon },
  );
  return renderToolbarToggleButton(state);
});

ToolbarToggleButton.displayName = 'ToolbarToggleButton';
