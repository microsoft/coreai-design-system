// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderBreadcrumb,
  useBreadcrumb,
  useBreadcrumbContextValues,
  type BreadcrumbProps as HeadlessBreadcrumbProps,
} from '@fluentui/react-headless-components-preview/breadcrumb';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './Breadcrumb.module.css';

export type { BreadcrumbSlots } from '@fluentui/react-headless-components-preview/breadcrumb';

export const breadcrumbClassNames = {
  root: 'fui-Breadcrumb',
  list: 'fui-Breadcrumb__list',
} as const;

export type BreadcrumbProps = HeadlessBreadcrumbProps & {
  /** Visual size inherited by the breadcrumb's buttons and dividers. @default 'medium' */
  size?: 'small' | 'medium' | 'large';
};

export const Breadcrumb: ForwardRefComponent<BreadcrumbProps> = React.forwardRef<
  HTMLElement,
  BreadcrumbProps
>(function Breadcrumb({ size = 'medium', ...props }, ref) {
  const state = { ...useBreadcrumb(props, ref), size };
  const contextValues = useBreadcrumbContextValues(state);

  Object.assign(state.root, { 'data-size': size });
  state.root.className = [breadcrumbClassNames.root, state.root.className]
    .filter(Boolean)
    .join(' ');
  if (state.list) {
    state.list.className = [
      breadcrumbClassNames.list,
      styles.Breadcrumb__list,
      state.list.className,
    ]
      .filter(Boolean)
      .join(' ');
  }

  return renderBreadcrumb(state, contextValues);
});

Breadcrumb.displayName = 'Breadcrumb';
