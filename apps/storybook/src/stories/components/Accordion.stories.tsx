// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { figmaDesign } from '../../utils/figma';
import type { StoryObj } from '@storybook/react-vite';
import {
  type JSXElement,
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
} from '@coreai-ds/react-components';

export const Default = (): JSXElement => (
  <Accordion>
    <AccordionItem value="1">
      <AccordionHeader>Accordion Header 1</AccordionHeader>
      <AccordionPanel>
        <div>Accordion Panel 1</div>
      </AccordionPanel>
    </AccordionItem>
    <AccordionItem value="2">
      <AccordionHeader>Accordion Header 2</AccordionHeader>
      <AccordionPanel>
        <div>Accordion Panel 2</div>
      </AccordionPanel>
    </AccordionItem>
    <AccordionItem value="3">
      <AccordionHeader>Accordion Header 3</AccordionHeader>
      <AccordionPanel>
        <div>Accordion Panel 3</div>
      </AccordionPanel>
    </AccordionItem>
  </Accordion>
);

/**
 * Add a border and restore header and panel padding to present an accordion as a card-like
 * disclosure without introducing a separate Card component.
 */
export const AccordionCard: StoryObj = {
  render: () => {
    const styles = /* css */ `
      .accordion-card-example {
        background-color: var(--colorNeutralBackground1);
        border: var(--strokeWidthThin) solid var(--colorNeutralStroke2);
        border-radius: var(--borderRadiusXLarge);
        max-width: 100%;
        overflow: hidden;
        width: 30rem;
      }

      .accordion-card-example__header-button.fui-AccordionHeader__button {
        padding-inline: var(--spacingHorizontalL);
      }

      .accordion-card-example__body {
        display: grid;
        padding: var(--spacingVerticalM) var(--spacingHorizontalL);
        row-gap: var(--spacingVerticalS);
        border-top: var(--strokeWidthThin) solid var(--colorNeutralStroke2);
      }

      .accordion-card-example__body-copy {
        margin: 0;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <Accordion
          className="accordion-card-example"
          collapsible
          defaultOpenItems="evaluation-details"
        >
          <AccordionItem value="evaluation-details">
            <AccordionHeader button={{ className: 'accordion-card-example__header-button' }}>
              Evaluation details
            </AccordionHeader>
            <AccordionPanel className="accordion-card-example__body">
              <p className="accordion-card-example__body-copy">
                Review the configuration and results for this evaluation before sharing it with your
                team.
              </p>
              <p className="accordion-card-example__body-copy">
                The evaluation uses the latest version of the customer-support dataset.
              </p>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </>
    );
  },
};

/**
 * An accordion allows users to toggle the display of content by expanding or collapsing sections.
 *
 * @summary Vertically stacked sections that expand and collapse to show or hide content. Subcomponents: AccordionItem, AccordionHeader, AccordionPanel.
 */
export default {
  title: 'Components/Accordion',
  component: Accordion,
  subcomponents: { AccordionItem, AccordionHeader, AccordionPanel },
  parameters: {
    ...figmaDesign('Accordion'),
  },
};
