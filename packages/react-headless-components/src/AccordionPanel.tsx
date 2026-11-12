// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderAccordionPanel,
  useAccordionPanel,
  type AccordionPanelProps,
  type AccordionPanelSlots as HeadlessAccordionPanelSlots,
} from '@fluentui/react-headless-components-preview/accordion';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { useCoreAIDefaults } from './ComponentDefaultsContext.js';
import styles from './AccordionPanel.module.css';
import overrides from './AccordionPanel.overrides.module.css';

export type { AccordionPanelProps } from '@fluentui/react-headless-components-preview/accordion';
export type AccordionPanelSlots = Pick<HeadlessAccordionPanelSlots, 'root'>;

export const accordionPanelClassNames = {
  root: 'fui-AccordionPanel',
} as const;

export const AccordionPanel: ForwardRefComponent<AccordionPanelProps> = React.forwardRef<
  HTMLDivElement,
  AccordionPanelProps
>(function AccordionPanel(props, ref) {
  const defaultsEnabled = useCoreAIDefaults();
  const state = useAccordionPanel(props, ref);

  state.root.className = [
    accordionPanelClassNames.root,
    styles.AccordionPanel,
    defaultsEnabled && overrides.AccordionPanel,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');

  return renderAccordionPanel(state);
});

AccordionPanel.displayName = 'AccordionPanel';
