// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderAccordion,
  useAccordion,
  useAccordionContextValues,
  type AccordionProps,
} from '@fluentui/react-headless-components-preview/accordion';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import './Accordion.module.css';
import './Accordion.overrides.module.css';

export type {
  AccordionProps,
  AccordionSlots,
} from '@fluentui/react-headless-components-preview/accordion';

export type AccordionToggleEventHandler = NonNullable<AccordionProps['onToggle']>;
export type AccordionToggleEvent = Parameters<AccordionToggleEventHandler>[0];
export type AccordionToggleData = Parameters<AccordionToggleEventHandler>[1];

export const accordionClassNames = {
  root: 'fui-Accordion',
} as const;

export const Accordion: ForwardRefComponent<AccordionProps> = React.forwardRef<
  HTMLDivElement,
  AccordionProps
>(function Accordion(props, ref) {
  const state = useAccordion(props, ref);
  const contextValues = useAccordionContextValues(state);

  state.root.className = [accordionClassNames.root, state.root.className].filter(Boolean).join(' ');

  return renderAccordion(state, contextValues);
});

Accordion.displayName = 'Accordion';
