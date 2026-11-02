// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderAccordionHeader,
  useAccordionHeader,
  useAccordionHeaderContextValues,
  type AccordionHeaderProps as HeadlessAccordionHeaderProps,
} from '@fluentui/react-headless-components-preview/accordion';
import { ChevronRightRegular } from '@fluentui/react-icons/headless/svg/chevron-right';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { useCoreAIDefaults } from '@coreai-ds/react-components';
import styles from './AccordionHeader.module.css';
import overrides from './AccordionHeader.overrides.module.css';

export type { AccordionHeaderSlots } from '@fluentui/react-headless-components-preview/accordion';

export type AccordionHeaderSize = 'small' | 'medium' | 'large' | 'extra-large';
export type AccordionHeaderExpandIconPosition = NonNullable<
  HeadlessAccordionHeaderProps['expandIconPosition']
>;

export type AccordionHeaderProps = HeadlessAccordionHeaderProps & {
  /** Visual spacing and typography. @default 'medium' */
  size?: AccordionHeaderSize;
  /** Renders the heading inline; CoreAI retains its grid button layout. @default false */
  inline?: boolean;
};

export const accordionHeaderClassNames = {
  root: 'fui-AccordionHeader',
  button: 'fui-AccordionHeader__button',
  expandIcon: 'fui-AccordionHeader__expandIcon',
  icon: 'fui-AccordionHeader__icon',
} as const;

export const AccordionHeader: ForwardRefComponent<AccordionHeaderProps> = React.forwardRef<
  HTMLDivElement,
  AccordionHeaderProps
>(function AccordionHeader({ size = 'medium', inline = false, ...props }, ref) {
  const defaultsEnabled = useCoreAIDefaults();
  const state = { ...useAccordionHeader(props, ref), size, inline };
  const contextValues = useAccordionHeaderContextValues(state);

  if (state.expandIcon && state.expandIcon.children == null) {
    state.expandIcon.children = (
      <ChevronRightRegular className={styles.AccordionHeader__chevron} aria-hidden />
    );
  }

  Object.assign(state.root, {
    'data-size': size,
    'data-inline': inline ? '' : undefined,
    'data-has-icon': state.icon ? '' : undefined,
    'data-has-expand-icon': state.expandIcon ? '' : undefined,
  });
  state.root.className = [
    accordionHeaderClassNames.root,
    styles.AccordionHeader,
    defaultsEnabled && overrides.AccordionHeader,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  state.button.className = [
    accordionHeaderClassNames.button,
    styles.AccordionHeader__button,
    defaultsEnabled && overrides.AccordionHeader__button,
    state.button.className,
  ]
    .filter(Boolean)
    .join(' ');
  if (state.expandIcon) {
    state.expandIcon.className = [
      accordionHeaderClassNames.expandIcon,
      styles.AccordionHeader__expandIcon,
      defaultsEnabled && overrides.AccordionHeader__expandIcon,
      state.expandIcon.className,
    ]
      .filter(Boolean)
      .join(' ');
  }
  if (state.icon) {
    state.icon.className = [
      accordionHeaderClassNames.icon,
      styles.AccordionHeader__icon,
      defaultsEnabled && overrides.AccordionHeader__icon,
      state.icon.className,
    ]
      .filter(Boolean)
      .join(' ');
  }

  return renderAccordionHeader(state, contextValues);
});

AccordionHeader.displayName = 'AccordionHeader';
