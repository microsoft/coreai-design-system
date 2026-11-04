// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderBreadcrumbItem,
  useBreadcrumbContext,
  useBreadcrumbItem,
  type BreadcrumbItemProps as HeadlessBreadcrumbItemProps,
} from '@fluentui/react-headless-components-preview/breadcrumb';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import type { BreadcrumbProps } from './Breadcrumb.js';
import styles from './BreadcrumbItem.module.css';

export type { BreadcrumbItemSlots } from '@fluentui/react-headless-components-preview/breadcrumb';

export const breadcrumbItemClassNames = {
  root: 'fui-BreadcrumbItem',
} as const;

export type BreadcrumbItemProps = HeadlessBreadcrumbItemProps & {
  /** As in Fluent 9.4.8, size is inherited from Breadcrumb; set it on the parent. */
  size?: BreadcrumbProps['size'];
};

export const BreadcrumbItem: ForwardRefComponent<BreadcrumbItemProps> = React.forwardRef<
  HTMLLIElement,
  BreadcrumbItemProps
>(function BreadcrumbItem({ size: _size, ...props }, ref) {
  const { size } = useBreadcrumbContext();
  const state = useBreadcrumbItem(props, ref);

  Object.assign(state.root, { 'data-size': size ?? 'medium' });
  state.root.className = [
    breadcrumbItemClassNames.root,
    styles.BreadcrumbItem,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');

  return renderBreadcrumbItem(state);
});

BreadcrumbItem.displayName = 'BreadcrumbItem';
