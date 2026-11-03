// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderAvatarGroupPopover,
  useAvatarGroupContext,
  useAvatarGroupPopover,
  useAvatarGroupPopoverContextValues,
  type AvatarGroupPopoverProps as HeadlessAvatarGroupPopoverProps,
  type AvatarGroupPopoverSlots,
} from '@fluentui/react-headless-components-preview/avatar-group';
import { PopoverSurface as HeadlessPopoverSurface } from '@fluentui/react-headless-components-preview/popover';
import { MoreHorizontalRegular } from '@fluentui/react-icons/headless/svg/more-horizontal';
import {
  slot,
  type ExtractSlotProps,
  type ForwardRefComponent,
  type SlotRenderFunction,
} from '@fluentui/react-utilities';
import { useCoreAIDefaults } from '@coreai-ds/react-components';
import type { PopoverProps } from './Popover.js';
import { PopoverSurface, type PopoverSurfaceProps } from './PopoverSurface.js';
import { PopoverVisualContext } from './PopoverVisualContext.js';
import { applyTooltipContentStyles } from './TooltipStyles.js';
import groupStyles from './AvatarGroup.module.css';
import styles from './AvatarGroupPopover.module.css';

export type {
  AvatarGroupPopoverPopoverProps,
  AvatarGroupPopoverSlots,
  AvatarGroupPopoverState,
} from '@fluentui/react-headless-components-preview/avatar-group';

export const avatarGroupPopoverClassNames = {
  content: 'fui-AvatarGroupPopover__content',
  popoverSurface: 'fui-AvatarGroupPopover__popoverSurface',
  tooltip: 'fui-AvatarGroupPopover__tooltip',
  triggerButton: 'fui-AvatarGroupPopover__triggerButton',
} as const;

export type AvatarGroupPopoverProps = HeadlessAvatarGroupPopoverProps &
  Pick<PopoverProps, 'appearance' | 'size'>;

type SurfaceSlotProps = ExtractSlotProps<AvatarGroupPopoverSlots['popoverSurface']>;
type DialogSurfaceProps = Extract<PopoverSurfaceProps, { as?: 'dialog' }>;
type DivSurfaceProps = Extract<PopoverSurfaceProps, { as: 'div' }>;

const DivSurface: ForwardRefComponent<Omit<DivSurfaceProps, 'as'>> = React.forwardRef<
  HTMLDivElement,
  Omit<DivSurfaceProps, 'as'>
>(function DivSurface(props, ref) {
  return <PopoverSurface {...props} as="div" ref={ref} />;
});

function resolveSurface(
  value: AvatarGroupPopoverProps['popoverSurface'],
  defaultProps: Partial<PopoverSurfaceProps>,
) {
  const original = slot.resolveShorthand<SurfaceSlotProps | undefined>(value);
  const resolved = slot.always<PopoverSurfaceProps>(undefined, {
    defaultProps,
    elementType: HeadlessPopoverSurface,
  });
  if (resolved.as === 'div') {
    const render: SlotRenderFunction<DivSurfaceProps> = (_Component, props) =>
      original?.as === 'div' && typeof original.children === 'function' ? (
        original.children(DivSurface, props)
      ) : (
        <PopoverSurface {...props} as="div" />
      );
    return slot.always<PopoverSurfaceProps>(
      { as: 'div', children: render },
      { defaultProps: resolved, elementType: HeadlessPopoverSurface },
    );
  }
  const render: SlotRenderFunction<DialogSurfaceProps> = (_Component, props) =>
    original?.as !== 'div' && typeof original?.children === 'function' ? (
      original.children(PopoverSurface, props)
    ) : (
      <PopoverSurface {...props} as="dialog" />
    );
  return slot.always<PopoverSurfaceProps>(
    { as: 'dialog', children: render },
    { defaultProps: resolved, elementType: HeadlessPopoverSurface },
  );
}

export function AvatarGroupPopover(props: AvatarGroupPopoverProps): React.ReactElement {
  const { appearance, size: surfaceSizeProp, indicator: indicatorProp, ...behaviorProps } = props;
  const size = useAvatarGroupContext((context) => context.size) ?? 32;
  const surfaceSize = 'size' in props ? surfaceSizeProp : 'small';
  const indicator = indicatorProp ?? (size < 24 ? 'icon' : 'count');
  const visual = React.useMemo(
    () => ({ appearance, size: surfaceSize }),
    [appearance, surfaceSize],
  );
  const defaultsEnabled = useCoreAIDefaults();
  const state = useAvatarGroupPopover({ ...behaviorProps, indicator });
  const contextValues = useAvatarGroupPopoverContextValues(state);
  const originalTrigger = slot.resolveShorthand(props.triggerButton);

  if (
    state.layout !== 'pie' &&
    state.indicator === 'icon' &&
    !Object.prototype.hasOwnProperty.call(originalTrigger ?? {}, 'children')
  ) {
    state.triggerButton.children = (
      <MoreHorizontalRegular className={styles.AvatarGroupPopover__glyph} />
    );
  }
  Object.assign(state.triggerButton, {
    'data-size': size,
    'data-layout': state.layout,
    'data-indicator': state.indicator,
    'data-open': state.popoverOpen ? '' : undefined,
  });
  state.triggerButton.className = [
    avatarGroupPopoverClassNames.triggerButton,
    styles.AvatarGroupPopover__triggerButton,
    groupStyles.AvatarGroup__size,
    groupStyles.AvatarGroup__child,
    state.triggerButton.className,
  ]
    .filter(Boolean)
    .join(' ');
  state.content.className = [
    avatarGroupPopoverClassNames.content,
    styles.AvatarGroupPopover__content,
    state.content.className,
  ]
    .filter(Boolean)
    .join(' ');
  Object.assign(state.popoverSurface, { 'data-avatar-group-surface': '' });
  state.popoverSurface.className = [
    avatarGroupPopoverClassNames.popoverSurface,
    styles.AvatarGroupPopover__popoverSurface,
    state.popoverSurface.className,
  ]
    .filter(Boolean)
    .join(' ');
  state.popoverSurface = resolveSurface(props.popoverSurface, state.popoverSurface);

  const tooltipContent = slot.always(state.tooltip.content, { elementType: 'div' });
  applyTooltipContentStyles(tooltipContent, 'normal', defaultsEnabled);
  Object.assign(tooltipContent, { 'data-avatar-group-tooltip': '' });
  tooltipContent.className = [avatarGroupPopoverClassNames.tooltip, tooltipContent.className]
    .filter(Boolean)
    .join(' ');
  state.tooltip.content = tooltipContent;
  return (
    <PopoverVisualContext.Provider value={visual}>
      {renderAvatarGroupPopover(state, contextValues)}
    </PopoverVisualContext.Provider>
  );
}

AvatarGroupPopover.displayName = 'AvatarGroupPopover';
