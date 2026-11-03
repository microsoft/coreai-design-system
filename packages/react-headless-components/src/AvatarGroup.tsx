// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderAvatarGroup,
  useAvatarGroup,
  useAvatarGroupContextValues,
  type AvatarGroupProps as HeadlessAvatarGroupProps,
} from '@fluentui/react-headless-components-preview/avatar-group';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import type { AvatarSize } from './Avatar.js';
import styles from './AvatarGroup.module.css';

export {
  AvatarGroupProvider,
  partitionAvatarGroupItems,
  useAvatarGroupContext,
  useAvatarGroupContextValues,
} from '@fluentui/react-headless-components-preview/avatar-group';
export type {
  AvatarGroupContextValue,
  AvatarGroupContextValues,
  AvatarGroupSlots,
  AvatarGroupState,
  PartitionAvatarGroupItems,
  PartitionAvatarGroupItemsOptions,
} from '@fluentui/react-headless-components-preview/avatar-group';

export const avatarGroupClassNames = {
  root: 'fui-AvatarGroup',
} as const;

export type AvatarGroupProps = HeadlessAvatarGroupProps & {
  /** Visual size of inline items and the overflow trigger. @default 32 */
  size?: AvatarSize;
};

export const AvatarGroup: ForwardRefComponent<AvatarGroupProps> = React.forwardRef<
  HTMLDivElement,
  AvatarGroupProps
>(function AvatarGroup({ size = 32, ...props }, ref) {
  const state = useAvatarGroup(props, ref);
  const contextValues = useAvatarGroupContextValues(state);
  const avatarGroup = React.useMemo(
    () => ({ ...contextValues.avatarGroup, size }),
    [contextValues.avatarGroup, size],
  );
  Object.assign(state.root, { 'data-size': size });
  state.root.className = [
    avatarGroupClassNames.root,
    styles.AvatarGroup,
    styles.AvatarGroup__size,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  return renderAvatarGroup(state, { avatarGroup });
});

AvatarGroup.displayName = 'AvatarGroup';
