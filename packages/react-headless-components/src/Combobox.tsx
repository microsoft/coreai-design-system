// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderCombobox,
  useCombobox,
  useComboboxContextValues,
  type ComboboxProps as HeadlessComboboxProps,
  type ComboboxSlots,
} from '@fluentui/react-headless-components-preview/combobox';
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
import { Label } from './Label.js';
import { resolveListboxSlot } from './Listbox.js';
import type { OptionPickerVisualProps } from './OptionPickerVisuals.js';
import styles from './Combobox.module.css';
import overrides from './Combobox.overrides.module.css';

export { useComboboxFilter } from '@fluentui/react-headless-components-preview/combobox';
export type { ComboboxSlots } from '@fluentui/react-headless-components-preview/combobox';

export type ComboboxProps = HeadlessComboboxProps & OptionPickerVisualProps;
export type ComboboxOpenChangeData = Parameters<
  NonNullable<HeadlessComboboxProps['onOpenChange']>
>[1];
export type ComboboxOpenEvent = Parameters<NonNullable<HeadlessComboboxProps['onOpenChange']>>[0];
export type ComboboxActiveOptionChangeData = Parameters<
  NonNullable<HeadlessComboboxProps['onActiveOptionChange']>
>[1];

export const comboboxClassNames = {
  root: 'fui-Combobox',
  input: 'fui-Combobox__input',
  expandIcon: 'fui-Combobox__expandIcon',
  clearIcon: 'fui-Combobox__clearIcon',
  listbox: 'fui-Combobox__listbox',
  label: 'fui-Combobox__label',
} as const;

type RootProps = ExtractSlotProps<ComboboxSlots['root']>;

export const Combobox: ForwardRefComponent<ComboboxProps> = React.forwardRef<
  HTMLInputElement,
  ComboboxProps
>(function Combobox(
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
  const generatedId = useId('headless-combobox');
  const size = sizeProp ?? field?.size ?? 'medium';
  const state = useCombobox(
    {
      ...props,
      placeholder: props.placeholder == null && dynamicWidth ? 'Select...' : props.placeholder,
    },
    ref,
  );
  const hasLabel = Boolean(label);
  if (hasLabel) {
    state.input.id ??= generatedId;
    const original = slot.resolveShorthand<RootProps | undefined>(props.root);
    const render: SlotRenderFunction<RootProps> = (Component, rootProps) => {
      const children = (
        <>
          <Label
            data-inline-label=""
            htmlFor={state.input.id}
            className={`${comboboxClassNames.label} ${overrides.Combobox__label}`}
          >
            {label}
          </Label>
          {rootProps.children}
        </>
      );
      return typeof original?.children === 'function' ? (
        original.children(Component, { ...rootProps, children })
      ) : (
        <Component {...rootProps}>{children}</Component>
      );
    };
    // input is a props-object slot, so an inline label belongs in the root render contract.
    state.root = slot.always<RootProps>(
      { children: render },
      { defaultProps: state.root, elementType: 'div' },
    );
  }
  state.listbox = resolveListboxSlot(props.listbox, state.listbox);
  if (state.expandIcon && state.expandIcon.children == null) {
    state.expandIcon.children = <ChevronDownRegular aria-hidden />;
  }
  if (state.clearIcon && state.clearIcon.children == null) {
    state.clearIcon.children = <DismissRegular aria-hidden />;
  }
  Object.assign(state.root, {
    'data-appearance': appearance,
    'data-size': size,
    'data-has-label': hasLabel ? '' : undefined,
    'data-inline-label-layout': label !== undefined ? '' : undefined,
    'data-has-value': state.value ? '' : undefined,
    'data-dynamic-width': dynamicWidth ? '' : undefined,
    'data-truncate-text-overflow': truncateTextOverflow ? '' : undefined,
  });
  state.root.className = [
    comboboxClassNames.root,
    styles.Combobox,
    overrides.Combobox,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  state.input.className = [
    comboboxClassNames.input,
    styles.Combobox__input,
    overrides.Combobox__input,
    state.input.className,
  ]
    .filter(Boolean)
    .join(' ');
  Object.assign(state.input, { 'data-size': size });
  for (const [name, scopedClass] of [
    ['expandIcon', styles.Combobox__expandIcon],
    ['clearIcon', styles.Combobox__clearIcon],
    ['listbox', styles.Combobox__listbox],
  ] as const) {
    const resolved = state[name];
    if (resolved) {
      Object.assign(resolved, {
        'data-size': size,
        'data-disabled': state.input.disabled ? '' : undefined,
        'data-clearable': state.showClearIcon ? '' : undefined,
      });
      resolved.className = [comboboxClassNames[name], scopedClass, resolved.className]
        .filter(Boolean)
        .join(' ');
    }
  }
  return renderCombobox(state, useComboboxContextValues(state));
});

Combobox.displayName = 'Combobox';
