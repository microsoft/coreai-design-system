// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Accordion as LegacyAccordion,
  AccordionHeader as LegacyAccordionHeader,
  AccordionItem as LegacyAccordionItem,
  AccordionPanel as LegacyAccordionPanel,
} from '@coreai-ds/react-components';
import {
  Accordion as HeadlessAccordion,
  AccordionHeader as HeadlessAccordionHeader,
  AccordionItem as HeadlessAccordionItem,
  AccordionPanel as HeadlessAccordionPanel,
  type AccordionHeaderProps,
  type AccordionHeaderSlots,
  type AccordionItemProps,
  type AccordionPanelProps,
  type AccordionProps,
} from '@coreai-ds/react-headless-components';
import type { ExtractSlotProps } from '@fluentui/react-utilities';
import styles from './AccordionComparison.module.css';

export const accordionHeaderSizes = ['small', 'medium', 'large', 'extra-large'] as const;
export const accordionExpandIconPositions = ['start', 'end'] as const;

export function AccordionFixtureIcon(): React.ReactElement {
  return (
    <svg
      data-parity-glyph=""
      aria-hidden="true"
      width="1em"
      height="1em"
      viewBox="0 0 20 20"
      fill="currentColor"
      style={{ display: 'block' }}
    >
      <path d="M4 4h12v12H4zM7 7v6h6V7z" fillRule="evenodd" />
    </svg>
  );
}

export interface AccordionExampleItem {
  value: string;
  label: React.ReactNode;
  content: React.ReactNode;
  itemProps?: Omit<AccordionItemProps, 'value' | 'children'>;
  headerProps?: Omit<AccordionHeaderProps, 'children' | 'button'> & {
    button?: ExtractSlotProps<AccordionHeaderSlots['button']>;
  };
  panelProps?: Omit<AccordionPanelProps, 'children'>;
}

export interface AccordionExample {
  name: string;
  props: Omit<AccordionProps, 'children'>;
  items?: readonly AccordionExampleItem[];
}

export const accordionExampleItems: readonly AccordionExampleItem[] = [
  {
    value: 'overview',
    label: 'Overview',
    content: 'A short overview of the workspace.',
  },
  {
    value: 'details',
    label: 'Details',
    content: 'The current workspace contains three projects.',
  },
  {
    value: 'unavailable',
    label: 'Unavailable',
    content: 'This section is not available.',
    itemProps: { disabled: true },
  },
];

const overview = accordionExampleItems[0];
const openOverview = { defaultOpenItems: ['overview'], collapsible: true };

export const accordionExamples: AccordionExample[] = [
  { name: 'Default closed', props: {}, items: [overview] },
  { name: 'Open panel', props: openOverview, items: [overview] },
  { name: 'Non-collapsible open', props: { defaultOpenItems: ['overview'] }, items: [overview] },
  ...accordionHeaderSizes.map((size) => ({
    name: `Size: ${size}`,
    props: openOverview,
    items: [{ ...overview, headerProps: { size } }],
  })),
  ...accordionExpandIconPositions.flatMap((expandIconPosition) =>
    [false, true].flatMap((withIcon) =>
      [false, true].map((open) => ({
        name: `${expandIconPosition}, ${withIcon ? 'with' : 'without'} icon, ${open ? 'open' : 'closed'}`,
        props: { collapsible: true, defaultOpenItems: open ? ['overview'] : [] },
        items: [
          {
            ...overview,
            headerProps: {
              expandIconPosition,
              icon: withIcon ? <AccordionFixtureIcon /> : undefined,
            },
          },
        ],
      })),
    ),
  ),
  {
    name: 'Inline',
    props: openOverview,
    items: [{ ...overview, headerProps: { inline: true } }],
  },
  {
    name: 'Inline with icon at end',
    props: openOverview,
    items: [
      {
        ...overview,
        headerProps: {
          inline: true,
          expandIconPosition: 'end',
          icon: <AccordionFixtureIcon />,
        },
      },
    ],
  },
  {
    name: 'Disabled closed',
    props: {},
    items: [{ ...overview, itemProps: { disabled: true } }],
  },
  {
    name: 'Disabled open',
    props: openOverview,
    items: [{ ...overview, itemProps: { disabled: true } }],
  },
  {
    name: 'Native disabled button slot',
    props: {},
    items: [{ ...overview, headerProps: { button: { disabled: true } } }],
  },
  {
    name: 'Heading level',
    props: openOverview,
    items: [{ ...overview, headerProps: { as: 'h3' } }],
  },
  {
    name: 'Custom expand icon',
    props: openOverview,
    items: [{ ...overview, headerProps: { expandIcon: <AccordionFixtureIcon /> } }],
  },
  {
    name: 'No expand icon',
    props: openOverview,
    items: [{ ...overview, headerProps: { expandIcon: null } }],
  },
  {
    name: 'Empty expand children use default glyph',
    props: openOverview,
    items: [{ ...overview, headerProps: { expandIcon: { children: null } } }],
  },
  {
    name: 'Explicit undefined visual props',
    props: openOverview,
    items: [
      {
        ...overview,
        headerProps: { size: undefined, inline: undefined, expandIconPosition: undefined },
      },
    ],
  },
  {
    name: 'Tall header content',
    props: openOverview,
    items: [
      {
        ...overview,
        label: <span className={styles.tallContent}>An extended workspace overview</span>,
      },
    ],
  },
  {
    name: 'Multiple open panels',
    props: { multiple: true, collapsible: true, defaultOpenItems: ['overview', 'details'] },
    items: accordionExampleItems,
  },
  {
    name: 'Controlled open panel',
    props: { openItems: ['details'], collapsible: true },
    items: accordionExampleItems,
  },
];

export const accordionConsumerExample: AccordionExample = {
  name: 'Consumer CSS Modules',
  props: { ...openOverview, className: styles.consumerAccordion },
  items: [
    {
      ...overview,
      itemProps: { className: styles.consumerItem },
      headerProps: {
        className: styles.consumerHeader,
        button: { className: styles.consumerButton },
        expandIcon: { className: styles.consumerExpandIcon },
        icon: { className: styles.consumerIcon, children: <AccordionFixtureIcon /> },
      },
      panelProps: { className: styles.consumerPanel },
    },
  ],
};

function AccordionFixture({
  implementation,
  name,
  props,
  items = accordionExampleItems,
}: AccordionExample & { implementation: 'legacy' | 'headless' }): React.ReactElement {
  const generatedId = React.useId();
  const Accordion = implementation === 'legacy' ? LegacyAccordion : HeadlessAccordion;
  const Item = implementation === 'legacy' ? LegacyAccordionItem : HeadlessAccordionItem;
  const Header = implementation === 'legacy' ? LegacyAccordionHeader : HeadlessAccordionHeader;
  const Panel = implementation === 'legacy' ? LegacyAccordionPanel : HeadlessAccordionPanel;
  return (
    <div className={styles.cell} data-accordion-implementation={implementation}>
      <Accordion {...props} aria-label={props['aria-label'] ?? name}>
        {items.map(({ value, label, content, itemProps, headerProps, panelProps }, index) => {
          const buttonId = `${generatedId}-${implementation}-button-${index}`;
          const panelId = `${generatedId}-${implementation}-panel-${index}`;
          return (
            <Item key={value} {...itemProps} value={value}>
              <Header
                {...headerProps}
                button={{
                  id: buttonId,
                  'aria-controls': panelId,
                  ...headerProps?.button,
                }}
              >
                <span data-accordion-label="">{label}</span>
              </Header>
              <Panel id={panelId} role="region" aria-labelledby={buttonId} {...panelProps}>
                {content}
              </Panel>
            </Item>
          );
        })}
      </Accordion>
    </div>
  );
}

export function AccordionComparison({
  examples = accordionExamples,
}: {
  examples?: readonly AccordionExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-accordion-case={example.name}>
          <span>{example.name}</span>
          <AccordionFixture {...example} implementation="legacy" />
          <AccordionFixture {...example} implementation="headless" />
        </div>
      ))}
    </div>
  );
}
