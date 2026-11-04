// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderToggleButton,
  useToggleButton,
  type ToggleButtonProps as HeadlessToggleButtonProps,
} from '@fluentui/react-headless-components-preview/toggle-button';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import {
  applyButtonVariantStyles,
  useButtonVariantVisuals,
  type ButtonVariantVisualProps,
} from './ButtonVariants.js';
import styles from './ToggleButton.module.css';

export const toggleButtonClassNames = {
  root: 'fui-ToggleButton',
  icon: 'fui-ToggleButton__icon',
} as const;

export type ToggleButtonProps = HeadlessToggleButtonProps & ButtonVariantVisualProps;
export type { ToggleButtonSlots } from '@fluentui/react-headless-components-preview/toggle-button';

export const ToggleButton: ForwardRefComponent<ToggleButtonProps> = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ToggleButtonProps
>(function ToggleButton(componentProps, ref) {
  const { appearance, shape, size, ...props } = componentProps;
  const visuals = useButtonVariantVisuals(
    { appearance, shape, size },
    Object.prototype.hasOwnProperty.call(componentProps, 'shape'),
  );
  const state = useToggleButton(props, ref);
  applyButtonVariantStyles(state, visuals, toggleButtonClassNames, {
    root: styles.ToggleButton,
    icon: styles.ToggleButton__icon,
  });
  Object.assign(state.root, {
    'data-accessible': state.isAccessible ? '' : undefined,
  });
  return renderToggleButton(state);
});

ToggleButton.displayName = 'ToggleButton';
