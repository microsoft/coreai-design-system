// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Listbox as UnstyledListbox,
  renderListbox,
  useListbox,
  useListboxContextValues,
  type ListboxProps,
  type ComboboxSlots,
} from '@fluentui/react-headless-components-preview/combobox';
import {
  slot,
  type ExtractSlotProps,
  type ForwardRefComponent,
  type SlotRenderFunction,
} from '@fluentui/react-utilities';
import styles from './Listbox.module.css';

export type {
  ListboxProps,
  ListboxSlots,
} from '@fluentui/react-headless-components-preview/combobox';

export type OptionOnSelectData = Parameters<NonNullable<ListboxProps['onOptionSelect']>>[1];
export type OptionSelectionEvent = Parameters<NonNullable<ListboxProps['onOptionSelect']>>[0];

export const listboxClassNames = { root: 'fui-Listbox' } as const;

export const Listbox: ForwardRefComponent<ListboxProps> = React.forwardRef<
  HTMLDivElement,
  ListboxProps
>(function Listbox(props, ref) {
  const state = useListbox(props, ref);
  state.root.className = [listboxClassNames.root, styles.Listbox, state.root.className]
    .filter(Boolean)
    .join(' ');
  return renderListbox(state, useListboxContextValues(state));
});

Listbox.displayName = 'Listbox';

type ListboxSlotProps = ExtractSlotProps<ComboboxSlots['listbox']>;

export function resolveListboxSlot(
  value: ComboboxSlots['listbox'],
  defaultProps: Partial<ListboxProps> | undefined,
) {
  if (!defaultProps) return undefined;
  const original = slot.resolveShorthand<ListboxSlotProps | null | undefined>(value);
  const render: SlotRenderFunction<ListboxProps> = (_Component, props) =>
    typeof original?.children === 'function' ? (
      original.children(Listbox, props)
    ) : (
      <Listbox {...props} />
    );
  // Preserve the facade's component metadata while styling through its public render contract.
  return slot.optional<ListboxProps>(
    { children: render },
    { defaultProps, elementType: UnstyledListbox, renderByDefault: true },
  );
}
