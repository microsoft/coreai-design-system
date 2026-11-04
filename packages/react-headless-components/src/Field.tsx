// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderField,
  useField,
  useFieldContextValues,
  type FieldProps as HeadlessFieldProps,
} from '@fluentui/react-headless-components-preview/field';
import { DiamondDismiss12Filled } from '@fluentui/react-icons/headless/svg/diamond-dismiss';
import { Warning12Filled } from '@fluentui/react-icons/headless/svg/warning';
import { CheckmarkCircle12Filled } from '@fluentui/react-icons/headless/svg/checkmark-circle';
import { slot, type ForwardRefComponent } from '@fluentui/react-utilities';
import { resolveLabelSlot } from './Label.js';
import styles from './Field.module.css';

export {
  useFieldContext,
  useFieldControlProps,
} from '@fluentui/react-headless-components-preview/field';
export type { FieldSlots } from '@fluentui/react-headless-components-preview/field';

export type FieldProps = HeadlessFieldProps & {
  /** Position of the label relative to the control. @default 'vertical' */
  orientation?: 'horizontal' | 'vertical';
  /** Label size and the size inherited by supporting controls. @default 'medium' */
  size?: 'small' | 'medium' | 'large';
};

export type FieldControlProps = Parameters<Exclude<FieldProps['children'], React.ReactNode>>[0];

export const fieldClassNames = {
  root: 'fui-Field',
  label: 'fui-Field__label',
  validationMessage: 'fui-Field__validationMessage',
  validationMessageIcon: 'fui-Field__validationMessageIcon',
  hint: 'fui-Field__hint',
} as const;

const validationIcons = {
  error: <DiamondDismiss12Filled />,
  warning: <Warning12Filled />,
  success: <CheckmarkCircle12Filled />,
  none: undefined,
};

export const Field: ForwardRefComponent<FieldProps> = React.forwardRef<HTMLDivElement, FieldProps>(
  function Field({ orientation = 'vertical', size = 'medium', ...props }, ref) {
    const state = { ...useField(props, ref), orientation, size };
    state.label = resolveLabelSlot(props.label, { size, ...state.label });
    const defaultIcon = validationIcons[state.validationState];
    state.validationMessageIcon = slot.optional(props.validationMessageIcon, {
      defaultProps: { children: defaultIcon },
      renderByDefault: Boolean(defaultIcon),
      elementType: 'span',
    });
    const contextValues = useFieldContextValues(state);

    Object.assign(state.root, {
      'data-size': size,
      'data-orientation': orientation,
      'data-has-label': state.label ? '' : undefined,
      'data-required': state.required ? '' : undefined,
    });
    state.root.className = [fieldClassNames.root, styles.Field, state.root.className]
      .filter(Boolean)
      .join(' ');

    for (const [name, scopedClass] of [
      ['label', styles.Field__label],
      ['validationMessage', styles.Field__validationMessage],
      ['validationMessageIcon', styles.Field__validationMessageIcon],
      ['hint', styles.Field__hint],
    ] as const) {
      const resolved = state[name];
      if (resolved) {
        resolved.className = [fieldClassNames[name], scopedClass, resolved.className]
          .filter(Boolean)
          .join(' ');
      }
    }
    if (state.validationMessage) {
      Object.assign(state.validationMessage, {
        'data-validation-state': state.validationState,
        'data-has-icon': state.validationMessageIcon ? '' : undefined,
      });
    }
    if (state.validationMessageIcon) {
      Object.assign(state.validationMessageIcon, {
        'data-validation-state': state.validationState,
      });
    }

    return renderField(state, contextValues);
  },
);

Field.displayName = 'Field';
