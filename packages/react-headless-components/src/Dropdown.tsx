// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderDropdown,
  useDropdown,
  useDropdownContextValues,
  type DropdownProps as HeadlessDropdownProps,
  type DropdownSlots,
} from '@fluentui/react-headless-components-preview/dropdown';
import { useFieldContext } from '@fluentui/react-headless-components-preview/field';
import { ChevronDownRegular } from '@fluentui/react-icons/headless/svg/chevron-down';
import { DismissRegular } from '@fluentui/react-icons/headless/svg/dismiss';
import {
  slot,
  useId,
  type ExtractSlotProps,
  type ForwardRefComponent,
  type SlotRenderFunction,
} from '@fluentui/react-utilities';
import { resolveListboxSlot } from './Listbox.js';
import { DropdownVisualContext } from './DropdownVisualContext.js';
import type { OptionPickerVisualProps } from './OptionPickerVisuals.js';
import styles from './Dropdown.module.css';
import overrides from './Dropdown.overrides.module.css';

export type { DropdownSlots } from '@fluentui/react-headless-components-preview/dropdown';
export type DropdownProps = HeadlessDropdownProps & OptionPickerVisualProps;
export type DropdownOpenChangeData = Parameters<
  NonNullable<HeadlessDropdownProps['onOpenChange']>
>[1];
export type DropdownOpenEvent = Parameters<NonNullable<HeadlessDropdownProps['onOpenChange']>>[0];
export type DropdownActiveOptionChangeData = Parameters<
  NonNullable<HeadlessDropdownProps['onActiveOptionChange']>
>[1];

export const dropdownClassNames = {
  root: 'fui-Dropdown',
  button: 'fui-Dropdown__button',
  clearButton: 'fui-Dropdown__clearButton',
  expandIcon: 'fui-Dropdown__expandIcon',
  listbox: 'fui-Dropdown__listbox',
  label: 'fui-Dropdown__label',
  text: 'fui-Dropdown__text',
} as const;

type ButtonSlotProps = ExtractSlotProps<DropdownSlots['button']>;

export const Dropdown: ForwardRefComponent<DropdownProps> = React.forwardRef<
  HTMLButtonElement,
  DropdownProps
>(function Dropdown(
  {
    appearance = 'filled-darker',
    size: sizeProp,
    label,
    dynamicWidth = false,
    truncateTextOverflow = false,
    ...props
  },
  ref,
) {
  const field = useFieldContext();
  const buttonVisuals = React.useContext(DropdownVisualContext);
  const labelId = useId('headless-dropdown-label');
  const size = sizeProp ?? field?.size ?? 'medium';
  const state = useDropdown(props, ref);
  const hasLabel = Boolean(label);
  if (truncateTextOverflow) {
    state.button.children = (
      <span className={`${dropdownClassNames.text} ${overrides.Dropdown__text}`}>
        {state.button.children}
      </span>
    );
  }
  if (hasLabel || truncateTextOverflow) {
    const original = slot.resolveShorthand<ButtonSlotProps | undefined>(props.button);
    const render: SlotRenderFunction<ButtonSlotProps> = (Component, buttonProps) => {
      const children = (
        <>
          {hasLabel && (
            <span
              aria-hidden="true"
              data-inline-label=""
              id={labelId}
              className={`${dropdownClassNames.label} ${overrides.Dropdown__label}`}
            >
              {label}
            </span>
          )}
          {buttonProps.children}
        </>
      );
      return typeof original?.children === 'function' ? (
        original.children(Component, { ...buttonProps, children })
      ) : (
        <Component {...buttonProps}>{children}</Component>
      );
    };
    state.button = slot.always<ButtonSlotProps>(
      { children: render },
      { defaultProps: state.button, elementType: 'button' },
    );
    // An explicit name or Field association takes precedence over the inline label.
    const fieldLabelsButton = field?.labelFor !== undefined && field.labelFor === state.button.id;
    if (
      hasLabel &&
      !fieldLabelsButton &&
      !state.button['aria-label'] &&
      !state.button['aria-labelledby']
    ) {
      state.button['aria-labelledby'] = labelId;
    }
  }
  state.listbox = resolveListboxSlot(props.listbox, state.listbox);
  if (state.expandIcon && state.expandIcon.children == null) {
    state.expandIcon.children = <ChevronDownRegular aria-hidden />;
  }
  if (state.clearButton && state.clearButton.children == null) {
    state.clearButton.children = <DismissRegular aria-hidden />;
  }
  Object.assign(state.root, {
    'data-appearance': buttonVisuals?.appearance ?? appearance,
    'data-size': buttonVisuals?.size ?? size,
    'data-control-size': size,
    'data-shape': buttonVisuals?.shape,
    'data-inline-label-layout': label !== undefined ? '' : undefined,
    'data-has-label': hasLabel ? '' : undefined,
    'data-has-value': state.value ? '' : undefined,
    'data-dynamic-width': dynamicWidth ? '' : undefined,
    'data-truncate-text-overflow': truncateTextOverflow ? '' : undefined,
  });
  state.root.className = [
    dropdownClassNames.root,
    styles.Dropdown,
    overrides.Dropdown,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  state.button.className = [
    dropdownClassNames.button,
    styles.Dropdown__button,
    state.button.className,
  ]
    .filter(Boolean)
    .join(' ');
  Object.assign(state.button, {
    'data-size': size,
    'data-placeholder': state.placeholderVisible ? '' : undefined,
  });
  for (const [name, scopedClass] of [
    ['expandIcon', styles.Dropdown__expandIcon],
    ['clearButton', styles.Dropdown__clearButton],
    ['listbox', styles.Dropdown__listbox],
  ] as const) {
    const resolved = state[name];
    if (resolved) {
      Object.assign(resolved, {
        'data-size': size,
        'data-disabled': state.button.disabled ? '' : undefined,
        'data-clearable': state.showClearButton ? '' : undefined,
      });
      resolved.className = [
        dropdownClassNames[name],
        scopedClass,
        name === 'listbox' && overrides.Dropdown__listbox,
        resolved.className,
      ]
        .filter(Boolean)
        .join(' ');
    }
  }
  const content = renderDropdown(state, useDropdownContextValues(state));
  return buttonVisuals ? (
    <DropdownVisualContext.Provider value={undefined}>{content}</DropdownVisualContext.Provider>
  ) : (
    content
  );
});

Dropdown.displayName = 'Dropdown';
