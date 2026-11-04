// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderBreadcrumbDivider,
  useBreadcrumbContext,
  useBreadcrumbDivider,
  type BreadcrumbDividerProps,
} from '@fluentui/react-headless-components-preview/breadcrumb';
import { ChevronLeftRegular } from '@fluentui/react-icons/headless/svg/chevron-left';
import { ChevronRightRegular } from '@fluentui/react-icons/headless/svg/chevron-right';
import { useFluent_unstable as useFluent } from '@fluentui/react-shared-contexts';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './BreadcrumbDivider.module.css';

export type {
  BreadcrumbDividerProps,
  BreadcrumbDividerSlots,
} from '@fluentui/react-headless-components-preview/breadcrumb';

export const breadcrumbDividerClassNames = {
  root: 'fui-BreadcrumbDivider',
} as const;

export const BreadcrumbDivider: ForwardRefComponent<BreadcrumbDividerProps> = React.forwardRef<
  HTMLLIElement,
  BreadcrumbDividerProps
>(function BreadcrumbDivider(props, ref) {
  const { size = 'medium' } = useBreadcrumbContext();
  const { dir } = useFluent();
  const state = useBreadcrumbDivider(props, ref);

  if (state.root.children === undefined) {
    state.root.children =
      dir === 'rtl' ? <ChevronLeftRegular aria-hidden /> : <ChevronRightRegular aria-hidden />;
  }
  Object.assign(state.root, { 'data-size': size });
  state.root.className = [
    breadcrumbDividerClassNames.root,
    styles.BreadcrumbDivider,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');

  return renderBreadcrumbDivider(state);
});

BreadcrumbDivider.displayName = 'BreadcrumbDivider';
