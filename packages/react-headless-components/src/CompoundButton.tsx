// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderCompoundButton,
  useCompoundButton,
  type CompoundButtonProps as HeadlessCompoundButtonProps,
} from '@fluentui/react-headless-components-preview/compound-button';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import {
  applyButtonVariantStyles,
  useButtonVariantVisuals,
  type ButtonVariantVisualProps,
} from './ButtonVariants.js';
import styles from './CompoundButton.module.css';

export const compoundButtonClassNames = {
  root: 'fui-CompoundButton',
  icon: 'fui-CompoundButton__icon',
  contentContainer: 'fui-CompoundButton__contentContainer',
  secondaryContent: 'fui-CompoundButton__secondaryContent',
} as const;

export type CompoundButtonProps = HeadlessCompoundButtonProps & ButtonVariantVisualProps;
export type { CompoundButtonSlots } from '@fluentui/react-headless-components-preview/compound-button';

export const CompoundButton: ForwardRefComponent<CompoundButtonProps> = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  CompoundButtonProps
>(function CompoundButton(componentProps, ref) {
  const { appearance, shape, size, ...props } = componentProps;
  const visuals = useButtonVariantVisuals(
    { appearance, shape, size },
    Object.prototype.hasOwnProperty.call(componentProps, 'shape'),
  );
  const state = useCompoundButton(props, ref);
  applyButtonVariantStyles(state, visuals, compoundButtonClassNames, {
    root: styles.CompoundButton,
    icon: styles.CompoundButton__icon,
  });
  Object.assign(state.root, {
    'data-has-primary-content':
      state.root.children !== undefined && state.root.children !== null ? '' : undefined,
  });
  state.contentContainer.className = [
    compoundButtonClassNames.contentContainer,
    styles.CompoundButton__contentContainer,
    state.contentContainer.className,
  ]
    .filter(Boolean)
    .join(' ');
  if (state.secondaryContent) {
    state.secondaryContent.className = [
      compoundButtonClassNames.secondaryContent,
      styles.CompoundButton__secondaryContent,
      state.secondaryContent.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  return renderCompoundButton(state);
});

CompoundButton.displayName = 'CompoundButton';
