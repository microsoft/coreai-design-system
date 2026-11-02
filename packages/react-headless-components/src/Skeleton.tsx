// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderSkeleton,
  useSkeleton,
  useSkeletonContextValues,
  type SkeletonProps as HeadlessSkeletonProps,
} from '@fluentui/react-headless-components-preview/skeleton';
import {
  useMergedRefs,
  type ForwardRefComponent,
  type InferredElementRefType,
} from '@fluentui/react-utilities';
import { SkeletonVisualContext, type SkeletonVisualOptions } from './SkeletonVisualContext.js';
import styles from './Skeleton.module.css';

export type { SkeletonSlots } from '@fluentui/react-headless-components-preview/skeleton';

export const skeletonClassNames = {
  root: 'fui-Skeleton',
} as const;

export type SkeletonProps = Omit<HeadlessSkeletonProps, 'size' | 'shape' | 'width'> &
  SkeletonVisualOptions;

export const Skeleton: ForwardRefComponent<SkeletonProps> = React.forwardRef<
  InferredElementRefType<SkeletonProps>,
  SkeletonProps
>(function Skeleton(
  { animation: animationProp, appearance: appearanceProp, size, shape, ...props },
  ref,
) {
  const inherited = React.useContext(SkeletonVisualContext);
  const animation = animationProp ?? inherited.animation ?? 'wave';
  const appearance = appearanceProp ?? inherited.appearance ?? 'opaque';
  // A callback bridges the facade's div ref signature to both supported native roots.
  const rootRef = useMergedRefs(ref);
  const state = { ...useSkeleton(props, rootRef), animation, appearance, size, shape };
  const contextValues = useSkeletonContextValues(state);

  Object.assign(state.root, {
    'data-animation': animation,
    'data-appearance': appearance,
    'data-size': size,
    'data-shape': shape,
    'data-as': state.root.as,
  });
  state.root.className = [skeletonClassNames.root, styles.Skeleton, state.root.className]
    .filter(Boolean)
    .join(' ');

  return (
    <SkeletonVisualContext.Provider value={contextValues.skeletonGroup}>
      {renderSkeleton(state, contextValues)}
    </SkeletonVisualContext.Provider>
  );
});

Skeleton.displayName = 'Skeleton';
