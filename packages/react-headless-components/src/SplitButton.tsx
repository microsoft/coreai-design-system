// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderSplitButton,
  useSplitButton,
  type SplitButtonProps as HeadlessSplitButtonProps,
  type SplitButtonSlots as HeadlessSplitButtonSlots,
} from '@fluentui/react-headless-components-preview/split-button';
import { Button as UnstyledButton } from '@fluentui/react-headless-components-preview/button';
import { MenuButton as UnstyledMenuButton } from '@fluentui/react-headless-components-preview/menu-button';
import {
  slot,
  type ExtractSlotProps,
  type ForwardRefComponent,
  type Slot,
  type SlotRenderFunction,
} from '@fluentui/react-utilities';
import { Button, type ButtonProps } from './Button.js';
import { MenuButton, type MenuButtonProps } from './MenuButton.js';
import { useButtonVariantVisuals, type ButtonVariantVisualProps } from './ButtonVariants.js';
import overrides from './Button.overrides.module.css';
import splitOverrides from './SplitButton.overrides.module.css';
import styles from './SplitButton.module.css';

export const splitButtonClassNames = {
  root: 'fui-SplitButton',
  menuButton: 'fui-SplitButton__menuButton',
  primaryActionButton: 'fui-SplitButton__primaryActionButton',
} as const;

export type SplitButtonSlots = Omit<
  HeadlessSplitButtonSlots,
  'menuButton' | 'primaryActionButton'
> & {
  menuButton?: Slot<typeof MenuButton>;
  primaryActionButton?: Slot<ForwardRefComponent<ButtonProps>>;
};

export type SplitButtonProps = Omit<
  HeadlessSplitButtonProps,
  'menuButton' | 'primaryActionButton'
> &
  ButtonVariantVisualProps &
  Pick<SplitButtonSlots, 'menuButton' | 'primaryActionButton'>;

type PrimaryAnchorProps = Extract<ButtonProps, { as: 'a' }>;
type PrimaryButtonProps = Extract<ButtonProps, { as?: 'button' }>;
type MenuAnchorProps = Extract<MenuButtonProps, { as: 'a' }>;
type MenuNativeButtonProps = Extract<MenuButtonProps, { as?: 'button' }>;
type PrimarySlotProps = ExtractSlotProps<SplitButtonSlots['primaryActionButton']>;
type MenuSlotProps = ExtractSlotProps<SplitButtonSlots['menuButton']>;

const AnchorButton: ForwardRefComponent<Omit<PrimaryAnchorProps, 'as'>> = React.forwardRef<
  HTMLAnchorElement,
  Omit<PrimaryAnchorProps, 'as'>
>(function AnchorButton(props, ref) {
  return <Button {...props} as="a" ref={ref} />;
});

const AnchorMenuButton: ForwardRefComponent<Omit<MenuAnchorProps, 'as'>> = React.forwardRef<
  HTMLAnchorElement,
  Omit<MenuAnchorProps, 'as'>
>(function AnchorMenuButton(props, ref) {
  return <MenuButton {...props} as="a" ref={ref} />;
});

function resolvePrimaryAction(
  value: SplitButtonSlots['primaryActionButton'],
  defaultProps: Partial<ButtonProps>,
) {
  const resolved = slot.optional<ButtonProps>(value, {
    defaultProps,
    renderByDefault: true,
    elementType: UnstyledButton,
  });
  if (!resolved) return undefined;
  const original = slot.resolveShorthand<PrimarySlotProps | null | undefined>(value);
  if (resolved.as === 'a') {
    const render: SlotRenderFunction<PrimaryAnchorProps> = (_Component, props) =>
      original?.as === 'a' && typeof original.children === 'function' ? (
        original.children(AnchorButton, { ...props, children: resolved.children })
      ) : (
        <Button {...props} as="a" />
      );
    return slot.optional<ButtonProps>(
      { as: 'a', children: render },
      { defaultProps: resolved, elementType: UnstyledButton },
    );
  }
  const render: SlotRenderFunction<PrimaryButtonProps> = (_Component, props) =>
    original?.as !== 'a' && typeof original?.children === 'function' ? (
      original.children(Button, { ...props, children: resolved.children })
    ) : (
      <Button {...props} as="button" />
    );
  // Keep the primitive's element metadata compatible with the public renderer's dev assertion.
  return slot.optional<ButtonProps>(
    { as: 'button', children: render },
    { defaultProps: resolved, elementType: UnstyledButton },
  );
}

function resolveMenuButton(
  value: SplitButtonSlots['menuButton'],
  defaultProps: Partial<MenuButtonProps>,
) {
  const resolved = slot.optional<MenuButtonProps>(value, {
    defaultProps,
    renderByDefault: true,
    elementType: UnstyledMenuButton,
  });
  if (!resolved) return undefined;
  const original = slot.resolveShorthand<MenuSlotProps | null | undefined>(value);
  if (resolved.as === 'a') {
    const render: SlotRenderFunction<MenuAnchorProps> = (_Component, props) =>
      original?.as === 'a' && typeof original.children === 'function' ? (
        original.children(AnchorMenuButton, { ...props, children: resolved.children })
      ) : (
        <MenuButton {...props} as="a" />
      );
    return slot.optional<MenuButtonProps>(
      { as: 'a', children: render },
      { defaultProps: resolved, elementType: UnstyledMenuButton },
    );
  }
  const render: SlotRenderFunction<MenuNativeButtonProps> = (_Component, props) =>
    original?.as !== 'a' && typeof original?.children === 'function' ? (
      original.children(MenuButton, { ...props, children: resolved.children })
    ) : (
      <MenuButton {...props} as="button" />
    );
  return slot.optional<MenuButtonProps>(
    { as: 'button', children: render },
    { defaultProps: resolved, elementType: UnstyledMenuButton },
  );
}

export const SplitButton: ForwardRefComponent<SplitButtonProps> = React.forwardRef<
  HTMLDivElement,
  SplitButtonProps
>(function SplitButton(componentProps, ref) {
  const { appearance, shape, size, ...props } = componentProps;
  const visuals = useButtonVariantVisuals(
    { appearance, shape, size },
    Object.prototype.hasOwnProperty.call(componentProps, 'shape'),
    false,
  );
  const state = useSplitButton(props, ref);
  const childVisuals = {
    appearance: visuals.appearance,
    shape: visuals.shape,
    size: visuals.size,
  };
  state.primaryActionButton = resolvePrimaryAction(props.primaryActionButton, {
    ...childVisuals,
    ...state.primaryActionButton,
  });
  state.menuButton = resolveMenuButton(props.menuButton, {
    ...childVisuals,
    ...state.menuButton,
  });
  Object.assign(state.root, {
    'data-appearance': visuals.appearance,
    'data-size': visuals.size,
    'data-shape': visuals.shape,
    'data-disabled': state.disabled ? '' : undefined,
    'data-disabled-focusable': state.disabledFocusable ? '' : undefined,
  });
  state.root.className = [
    splitButtonClassNames.root,
    styles.SplitButton,
    visuals.defaultsEnabled && overrides.Button,
    visuals.defaultsEnabled && splitOverrides.SplitButton,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  for (const [name, scopedClass] of [
    ['primaryActionButton', styles.SplitButton__primaryActionButton],
    ['menuButton', styles.SplitButton__menuButton],
  ] as const) {
    const resolved = state[name];
    if (resolved) {
      resolved.className = [
        splitButtonClassNames[name],
        scopedClass,
        visuals.defaultsEnabled && name === 'menuButton' && splitOverrides.SplitButton__menuButton,
        resolved.className,
      ]
        .filter(Boolean)
        .join(' ');
    }
  }
  return renderSplitButton(state);
});

SplitButton.displayName = 'SplitButton';
