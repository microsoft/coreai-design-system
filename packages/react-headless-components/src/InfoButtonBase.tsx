// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderInfoButton,
  useInfoButton,
  type InfoButtonProps as HeadlessInfoButtonProps,
  type InfoButtonSlots as HeadlessInfoButtonSlots,
} from '@fluentui/react-headless-components-preview/info-label';
import { PopoverSurface as HeadlessPopoverSurface } from '@fluentui/react-headless-components-preview/popover';
import {
  Info12Filled,
  Info12Regular,
  Info16Filled,
  Info16Regular,
  Info20Filled,
  Info20Regular,
} from '@fluentui/react-icons/headless/svg/info';
import {
  slot,
  type ExtractSlotProps,
  type ForwardRefComponent,
  type Slot,
  type SlotRenderFunction,
} from '@fluentui/react-utilities';
import type { PopoverProps } from './Popover.js';
import { PopoverSurface, type PopoverSurfaceProps } from './PopoverSurface.js';
import { PopoverVisualContext } from './PopoverVisualContext.js';
import styles from './InfoButton.module.css';

export const infoButtonClassNames = {
  root: 'fui-InfoButton',
  popover: 'fui-InfoButton__popover',
  info: 'fui-InfoButton__info',
} as const;

type InfoPopoverProps = Partial<Omit<PopoverProps, 'openOnHover'>>;
type InfoSlotProps = ExtractSlotProps<HeadlessInfoButtonSlots['info']>;
type DialogInfoProps = Extract<PopoverSurfaceProps, { as?: 'dialog' }>;
type DivInfoProps = Extract<PopoverSurfaceProps, { as: 'div' }>;

// Internal base contract: InfoLabel supplies its own generated accessible name.
export type InfoButtonBaseProps = Omit<HeadlessInfoButtonProps, 'popover'> & {
  /** Visual size, including the default glyph and surface typography. @default 'medium' */
  size?: 'small' | 'medium' | 'large';
  popover?: NonNullable<Slot<InfoPopoverProps>>;
};

const DivInfoSurface: ForwardRefComponent<Omit<DivInfoProps, 'as'>> = React.forwardRef<
  HTMLDivElement,
  Omit<DivInfoProps, 'as'>
>(function DivInfoSurface(props, ref) {
  return <PopoverSurface {...props} as="div" ref={ref} />;
});

function resolveInfo(
  value: InfoButtonBaseProps['info'],
  defaultProps: Partial<PopoverSurfaceProps>,
) {
  const resolved = slot.always<PopoverSurfaceProps>(undefined, {
    defaultProps,
    elementType: HeadlessPopoverSurface,
  });
  const original = slot.resolveShorthand<InfoSlotProps | undefined>(value);
  if (resolved.as === 'div') {
    const render: SlotRenderFunction<DivInfoProps> = (_Component, props) =>
      original?.as === 'div' && typeof original.children === 'function' ? (
        original.children(DivInfoSurface, { ...props, children: resolved.children })
      ) : (
        <PopoverSurface {...props} as="div" />
      );
    return slot.always<PopoverSurfaceProps>(
      { as: 'div', children: render },
      { defaultProps: resolved, elementType: HeadlessPopoverSurface },
    );
  }
  const render: SlotRenderFunction<DialogInfoProps> = (_Component, props) =>
    original?.as !== 'div' && typeof original?.children === 'function' ? (
      original.children(PopoverSurface, { ...props, children: resolved.children })
    ) : (
      <PopoverSurface {...props} as="dialog" />
    );
  return slot.always<PopoverSurfaceProps>(
    { as: 'dialog', children: render },
    { defaultProps: resolved, elementType: HeadlessPopoverSurface },
  );
}

const iconPairs = {
  small: [Info12Regular, Info12Filled],
  medium: [Info16Regular, Info16Filled],
  large: [Info20Regular, Info20Filled],
} as const;

export const InfoButtonBase: ForwardRefComponent<InfoButtonBaseProps> = React.forwardRef<
  HTMLButtonElement,
  InfoButtonBaseProps
>(function InfoButtonBase({ size = 'medium', popover, ...props }, ref) {
  const popoverProps = slot.resolveShorthand<InfoPopoverProps | undefined>(popover);
  const { appearance, size: popoverSize, ...behaviorPopover } = popoverProps ?? {};
  const surfaceSize =
    popoverProps && 'size' in popoverProps ? popoverSize : size === 'large' ? 'medium' : 'small';
  const visual = React.useMemo(
    () => ({ appearance, size: surfaceSize }),
    [appearance, surfaceSize],
  );
  const [RegularIcon, FilledIcon] = iconPairs[size];
  const state = useInfoButton(
    {
      children: (
        <>
          <RegularIcon data-info-glyph="regular" />
          <FilledIcon data-info-glyph="filled" />
        </>
      ),
      ...props,
      popover: behaviorPopover,
    },
    ref,
  );
  state.info = resolveInfo(props.info, state.info);
  Object.assign(state.root, { 'data-size': size });
  Object.assign(state.info, { 'data-info-button-size': size });
  state.root.className = [infoButtonClassNames.root, styles.InfoButton, state.root.className]
    .filter(Boolean)
    .join(' ');
  state.info.className = [infoButtonClassNames.info, styles.InfoButton__info, state.info.className]
    .filter(Boolean)
    .join(' ');
  return (
    <PopoverVisualContext.Provider value={visual}>
      {renderInfoButton(state)}
    </PopoverVisualContext.Provider>
  );
});

InfoButtonBase.displayName = 'InfoButtonBase';
