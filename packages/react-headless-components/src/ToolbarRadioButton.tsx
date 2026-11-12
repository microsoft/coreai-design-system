// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderToolbarRadioButton,
  useToolbarContext,
  useToolbarRadioButton,
  type ToolbarRadioButtonProps as HeadlessToolbarRadioButtonProps,
} from '@fluentui/react-headless-components-preview/toolbar';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { toggleButtonClassNames } from './ToggleButton.js';
import { applyToolbarButtonStyles, type ToolbarButtonAppearance } from './ToolbarVisuals.js';
import styles from './ToolbarRadioButton.module.css';

export type { ToolbarRadioButtonState } from '@fluentui/react-headless-components-preview/toolbar';
export type ToolbarRadioButtonProps = HeadlessToolbarRadioButtonProps & {
  /** Visual emphasis. @default 'subtle' */
  appearance?: ToolbarButtonAppearance;
};

export const toolbarRadioButtonClassNames = {
  root: 'fui-ToolbarRadioButton',
  icon: 'fui-ToolbarRadioButton__icon',
} as const;

export const ToolbarRadioButton: ForwardRefComponent<ToolbarRadioButtonProps> = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ToolbarRadioButtonProps
>(function ToolbarRadioButton({ appearance = 'subtle', size: sizeProp, ...props }, ref) {
  const contextSize = useToolbarContext((context) => context.size);
  const state = useToolbarRadioButton(props, ref);
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
    toolbarRadioButtonClassNames,
    { root: styles.ToolbarRadioButton, icon: styles.ToolbarRadioButton__icon },
  );
  return renderToolbarRadioButton(state);
});

ToolbarRadioButton.displayName = 'ToolbarRadioButton';
