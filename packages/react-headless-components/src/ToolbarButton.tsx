// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderToolbarButton,
  useToolbarButton,
  type ToolbarButtonProps as HeadlessToolbarButtonProps,
} from '@fluentui/react-headless-components-preview/toolbar';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { applyToolbarButtonStyles, type ToolbarButtonAppearance } from './ToolbarVisuals.js';
import styles from './ToolbarButton.module.css';

export type { ToolbarButtonState } from '@fluentui/react-headless-components-preview/toolbar';
export type ToolbarButtonProps = HeadlessToolbarButtonProps & {
  /** Visual emphasis. @default 'subtle' */
  appearance?: ToolbarButtonAppearance;
};

export const toolbarButtonClassNames = {
  root: 'fui-ToolbarButton',
  icon: 'fui-ToolbarButton__icon',
} as const;

export const ToolbarButton: ForwardRefComponent<ToolbarButtonProps> = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ToolbarButtonProps
>(function ToolbarButton({ appearance = 'subtle', ...props }, ref) {
  const state = useToolbarButton(props, ref);
  // Unlike toggle/radio controls, the actual ToolbarButton always uses medium size.
  applyToolbarButtonStyles(state, appearance, 'medium', toolbarButtonClassNames, {
    root: styles.ToolbarButton,
    icon: styles.ToolbarButton__icon,
  });
  return renderToolbarButton(state);
});

ToolbarButton.displayName = 'ToolbarButton';
