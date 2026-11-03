// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { useMergedRefs, type ForwardRefComponent } from '@fluentui/react-utilities';
import { InlineDrawer, type InlineDrawerProps } from './InlineDrawer.js';
import { OverlayDrawer, type OverlayDrawerProps } from './OverlayDrawer.js';

export {
  DrawerProvider,
  useDrawerContext,
  useDrawerContextValue,
} from '@fluentui/react-headless-components-preview/drawer';
export type {
  DrawerContextValue,
  DrawerSlots,
  DrawerState,
} from '@fluentui/react-headless-components-preview/drawer';

export type DrawerSize = 'small' | 'medium' | 'large' | 'full';
export type DrawerProps =
  (OverlayDrawerProps & { type?: 'overlay' }) | (InlineDrawerProps & { type: 'inline' });

export const drawerClassNames = { root: 'fui-Drawer' } as const;

export const Drawer: ForwardRefComponent<DrawerProps> = React.forwardRef<HTMLElement, DrawerProps>(
  function Drawer(props, ref) {
    const mergedRef = useMergedRefs(ref);
    const className = [drawerClassNames.root, props.className].filter(Boolean).join(' ');
    if (props.type === 'inline') {
      const { type: _type, ...inlineProps } = props;
      return <InlineDrawer {...inlineProps} ref={mergedRef} className={className} />;
    }
    const { type: _type, ...overlayProps } = props;
    return <OverlayDrawer {...overlayProps} ref={mergedRef} className={className} />;
  },
);

Drawer.displayName = 'Drawer';
