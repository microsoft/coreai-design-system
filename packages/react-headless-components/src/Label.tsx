// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderLabel,
  useLabel,
  type LabelProps as HeadlessLabelProps,
} from '@fluentui/react-headless-components-preview/label';
import {
  slot,
  type ForwardRefComponent,
  type Slot,
  type SlotRenderFunction,
} from '@fluentui/react-utilities';
import styles from './Label.module.css';
import './Label.overrides.module.css';

export type { LabelSlots } from '@fluentui/react-headless-components-preview/label';

export const labelClassNames = {
  root: 'fui-Label',
  required: 'fui-Label__required',
} as const;

export type LabelProps = HeadlessLabelProps & {
  /** Visual size. @default 'medium' */
  size?: 'small' | 'medium' | 'large';
  /** Large labels remain semibold even with regular weight, matching Fluent. @default 'regular' */
  weight?: 'regular' | 'semibold';
};

export const Label: ForwardRefComponent<LabelProps> = React.forwardRef<
  HTMLLabelElement,
  LabelProps
>(function Label({ size = 'medium', weight = 'regular', ...props }, ref) {
  const state = useLabel(props, ref);

  // Apply styling to the Label slots based on the state
  Object.assign(state.root, {
    'data-size': size,
    'data-weight': weight,
  });
  state.root.className = [labelClassNames.root, styles.Label, state.root.className]
    .filter(Boolean)
    .join(' ');

  if (state.required) {
    state.required.className = [
      labelClassNames.required,
      styles.Label__required,
      state.required.className,
    ]
      .filter(Boolean)
      .join(' ');
  }

  return renderLabel(state);
});

Label.displayName = 'Label';

export function resolveLabelSlot(
  value: Slot<typeof Label> | undefined,
  defaultProps: Partial<React.ComponentProps<typeof Label>>,
) {
  const label = slot.optional<React.ComponentProps<typeof Label>>(value, {
    defaultProps,
    elementType: 'label',
  });
  if (!label) return undefined;

  const props = slot.resolveShorthand(value);
  const render: SlotRenderFunction<React.ComponentProps<typeof Label>> = (
    _Component,
    resolvedProps,
  ) =>
    typeof props?.children === 'function' ? (
      props.children(Label, resolvedProps)
    ) : (
      <Label {...resolvedProps} />
    );

  // Keep the headless hook's native slot type; customize its rendering through the public API.
  return slot.optional<React.ComponentProps<typeof Label>>(
    { children: render },
    { defaultProps: label, elementType: 'label' },
  );
}
