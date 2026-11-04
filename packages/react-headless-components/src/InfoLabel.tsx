// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  InfoButton as HeadlessInfoButton,
  renderInfoLabel,
  useInfoLabel,
  type InfoLabelProps as HeadlessInfoLabelProps,
  type InfoLabelSlots as HeadlessInfoLabelSlots,
} from '@fluentui/react-headless-components-preview/info-label';
import { Label as HeadlessLabel } from '@fluentui/react-headless-components-preview/label';
import {
  slot,
  type ForwardRefComponent,
  type Slot,
  type SlotRenderFunction,
} from '@fluentui/react-utilities';
import { Label, type LabelProps } from './Label.js';
import { InfoButtonBase, type InfoButtonBaseProps } from './InfoButtonBase.js';
import styles from './InfoLabel.module.css';

export const infoLabelClassNames = {
  root: 'fui-InfoLabel',
  label: 'fui-InfoLabel__label',
  infoButton: 'fui-InfoLabel__infoButton',
} as const;

export type InfoLabelSlots = Omit<HeadlessInfoLabelSlots, 'label' | 'infoButton'> & {
  label: NonNullable<Slot<typeof Label>>;
  infoButton: Slot<typeof InfoButtonBase>;
};

export type InfoLabelProps = Omit<HeadlessInfoLabelProps, 'label' | 'infoButton'> &
  Pick<Partial<InfoLabelSlots>, 'label' | 'infoButton'> &
  Pick<LabelProps, 'size' | 'weight'>;

function resolveLabel(
  value: InfoLabelSlots['label'] | undefined,
  defaultProps: Partial<LabelProps>,
) {
  const original = slot.resolveShorthand(value);
  const render: SlotRenderFunction<LabelProps> = (_Component, props) =>
    typeof original?.children === 'function' ? (
      original.children(Label, props)
    ) : (
      <Label {...props} />
    );
  return slot.always<LabelProps>(
    { children: render },
    { defaultProps, elementType: HeadlessLabel },
  );
}

function resolveButton(
  value: InfoLabelSlots['infoButton'] | undefined,
  defaultProps: Partial<InfoButtonBaseProps>,
) {
  const original = slot.resolveShorthand(value);
  const render: SlotRenderFunction<InfoButtonBaseProps> = (_Component, props) => {
    if (typeof original?.children === 'function') {
      return original.children(InfoButtonBase, props);
    }
    // slot.always adds an undefined children key for a render adapter. It is not
    // an authored override of the InfoButton's default glyph.
    const { children, ...rest } = props;
    return original && 'children' in original ? (
      <InfoButtonBase {...rest} children={children} />
    ) : (
      <InfoButtonBase {...rest} />
    );
  };
  return slot.always<InfoButtonBaseProps>(
    { children: render },
    { defaultProps, elementType: HeadlessInfoButton },
  );
}

export const InfoLabel: ForwardRefComponent<InfoLabelProps> = React.forwardRef<
  HTMLLabelElement,
  InfoLabelProps
>(function InfoLabel({ size = 'medium', weight = 'regular', label, infoButton, ...props }, ref) {
  const state = useInfoLabel({ ...props, label, infoButton }, ref);
  state.label = resolveLabel(label, { size, weight, ...state.label });
  if (state.infoButton) {
    state.infoButton = resolveButton(infoButton, { size, ...state.infoButton });
  }
  Object.assign(state.root, { 'data-size': size });
  state.root.className = [infoLabelClassNames.root, styles.InfoLabel, state.root.className]
    .filter(Boolean)
    .join(' ');
  state.label.className = [
    infoLabelClassNames.label,
    styles.InfoLabel__label,
    state.label.className,
  ]
    .filter(Boolean)
    .join(' ');
  if (state.infoButton) {
    state.infoButton.className = [
      infoLabelClassNames.infoButton,
      styles.InfoLabel__infoButton,
      state.infoButton.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  return renderInfoLabel(state);
});

InfoLabel.displayName = 'InfoLabel';
