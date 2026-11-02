// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderBreadcrumbButton,
  useBreadcrumbButton,
  useBreadcrumbContext,
  type BreadcrumbButtonProps as HeadlessBreadcrumbButtonProps,
} from '@fluentui/react-headless-components-preview/breadcrumb';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import type { BreadcrumbProps } from './Breadcrumb.js';
import { buttonClassNames } from './Button.js';
import styles from './BreadcrumbButton.module.css';

export type { BreadcrumbButtonSlots } from '@fluentui/react-headless-components-preview/breadcrumb';

export const breadcrumbButtonClassNames = {
  root: 'fui-BreadcrumbButton',
  icon: 'fui-BreadcrumbButton__icon',
} as const;

export type BreadcrumbButtonProps = HeadlessBreadcrumbButtonProps & {
  /** As in Fluent 9.4.8, size is inherited from Breadcrumb; set it on the parent. */
  size?: BreadcrumbProps['size'];
};

export const BreadcrumbButton: ForwardRefComponent<BreadcrumbButtonProps> = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  BreadcrumbButtonProps
>(function BreadcrumbButton({ size: _size, ...props }, ref) {
  const { size = 'medium' } = useBreadcrumbContext();
  const state = useBreadcrumbButton(props, ref);

  Object.assign(state.root, {
    'data-size': size,
    'data-appearance': 'subtle',
    'data-shape': 'rounded',
    'data-disabled': state.disabled ? '' : undefined,
    'data-disabled-focusable': state.disabledFocusable ? '' : undefined,
    'data-icon-only': state.iconOnly ? '' : undefined,
    'data-icon-position': state.iconPosition,
    'data-has-icon': state.icon ? '' : undefined,
    'data-has-content': state.root.children ? '' : undefined,
  });
  state.root.className = [
    breadcrumbButtonClassNames.root,
    buttonClassNames.root,
    styles.BreadcrumbButton,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  if (state.icon) {
    state.icon.className = [
      breadcrumbButtonClassNames.icon,
      buttonClassNames.icon,
      styles.BreadcrumbButton__icon,
      state.icon.className,
    ]
      .filter(Boolean)
      .join(' ');
  }

  return renderBreadcrumbButton(state);
});

BreadcrumbButton.displayName = 'BreadcrumbButton';
