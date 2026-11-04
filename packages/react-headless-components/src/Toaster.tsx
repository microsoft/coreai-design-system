// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { CSSProperties } from 'react';
import {
  renderToaster,
  useToaster,
  type ToasterProps,
} from '@fluentui/react-headless-components-preview/toast';
import styles from './Toaster.module.css';
import containerStyles from './ToastContainer.module.css';
import overrides from './Toaster.overrides.module.css';

export {
  useToastController,
  type ToasterId,
  type ToasterProps,
  type ToasterState,
} from '@fluentui/react-headless-components-preview/toast';

export const toasterClassNames = { root: 'fui-Toaster' } as const;

const positions = [
  ['top', 'top'],
  ['topStart', 'top-start'],
  ['topEnd', 'top-end'],
  ['bottom', 'bottom'],
  ['bottomStart', 'bottom-start'],
  ['bottomEnd', 'bottom-end'],
] as const;

function isShorthandOffset(
  offset: NonNullable<ToasterProps['offset']>,
): offset is { horizontal?: number; vertical?: number } {
  return 'horizontal' in offset || 'vertical' in offset;
}

export function Toaster(props: ToasterProps) {
  const state = useToaster(props);
  for (const [slotName, position] of positions) {
    const positionSlot = state[slotName];
    if (!positionSlot) continue;
    const offset = state.offset;
    const resolvedOffset = offset && (isShorthandOffset(offset) ? offset : offset[position]);
    positionSlot.className = [
      toasterClassNames.root,
      styles.Toaster,
      containerStyles.Toaster__containers,
      overrides.Toaster,
      positionSlot.className,
    ]
      .filter(Boolean)
      .join(' ');
    const offsetVariables: CSSProperties & {
      '--fui-toast-offset-horizontal'?: string;
      '--fui-toast-offset-vertical'?: string;
    } = {
      '--fui-toast-offset-horizontal':
        resolvedOffset?.horizontal === undefined ? undefined : `${resolvedOffset.horizontal}px`,
      '--fui-toast-offset-vertical':
        resolvedOffset?.vertical === undefined ? undefined : `${resolvedOffset.vertical}px`,
    };
    positionSlot.style = { ...offsetVariables, ...positionSlot.style };
  }
  return renderToaster(state);
}

Toaster.displayName = 'Toaster';
