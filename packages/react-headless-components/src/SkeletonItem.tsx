// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderSkeletonItem,
  useSkeletonItem,
  type SkeletonItemProps as HeadlessSkeletonItemProps,
} from '@fluentui/react-headless-components-preview/skeleton';
import {
  useMergedRefs,
  type ForwardRefComponent,
  type InferredElementRefType,
} from '@fluentui/react-utilities';
import { SkeletonVisualContext, type SkeletonVisualOptions } from './SkeletonVisualContext.js';
import styles from './SkeletonItem.module.css';

export type { SkeletonItemSlots } from '@fluentui/react-headless-components-preview/skeleton';
export type { SkeletonItemSize } from './SkeletonVisualContext.js';

export const skeletonItemClassNames = {
  root: 'fui-SkeletonItem',
} as const;

export type SkeletonItemProps = HeadlessSkeletonItemProps & SkeletonVisualOptions;

export const SkeletonItem: ForwardRefComponent<SkeletonItemProps> = React.forwardRef<
  InferredElementRefType<SkeletonItemProps>,
  SkeletonItemProps
>(function SkeletonItem(
  {
    animation: animationProp,
    appearance: appearanceProp,
    size: sizeProp,
    shape: shapeProp,
    ...props
  },
  ref,
) {
  const inherited = React.useContext(SkeletonVisualContext);
  const animation = animationProp ?? inherited.animation ?? 'wave';
  const appearance = appearanceProp ?? inherited.appearance ?? 'opaque';
  const size = sizeProp ?? inherited.size ?? 16;
  const shape = shapeProp ?? inherited.shape ?? 'rectangle';
  // A callback bridges the facade's div ref signature to both supported native roots.
  const rootRef = useMergedRefs(ref);
  const state = useSkeletonItem(props, rootRef);

  // Apply styling to the SkeletonItem slots based on the state.
  Object.assign(state.root, {
    'data-animation': animation,
    'data-appearance': appearance,
    'data-size': size,
    'data-shape': shape,
    'data-as': state.root.as,
  });
  state.root.className = [skeletonItemClassNames.root, styles.SkeletonItem, state.root.className]
    .filter(Boolean)
    .join(' ');

  return renderSkeletonItem(state);
});

SkeletonItem.displayName = 'SkeletonItem';
