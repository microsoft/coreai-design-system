// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { StoryObj } from '@storybook/react-vite';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
} from '@coreai-ds/react-components';

/** Shows an open accordion aligned with content in the same vertical stack. */
export const ContentAlignmentDev: StoryObj = {
  parameters: { centered: false },
  render: () => {
    const details = [
      ['Model', 'gpt-4.1-mini'],
      ['Project', 'Customer operations'],
      ['Status', 'Draft'],
    ];

    const styles = /* css */ `
      .accordion-alignment-example {
        display: grid;
        width: 30rem;
        max-width: 100%;
        row-gap: var(--spacingVerticalM);
      }

      .accordion-alignment-example__heading {
        margin: 0;
      }

      .accordion-alignment-example__details {
        display: grid;
        grid-template-columns: max-content 1fr;
        column-gap: var(--spacingHorizontalXXL);
        row-gap: var(--spacingVerticalS);
        margin: 0;
      }

      .accordion-alignment-example__details dd {
        margin: 0;
      }

      .accordion-alignment-example__panel-content {
        padding-block: var(--spacingVerticalS);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <section className="accordion-alignment-example" aria-labelledby="applied-to-heading">
          <h2 id="applied-to-heading" className="accordion-alignment-example__heading">
            Applied to
          </h2>
          <dl className="accordion-alignment-example__details">
            {details.map(([label, value]) => (
              <React.Fragment key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </React.Fragment>
            ))}
          </dl>
          <Accordion collapsible defaultOpenItems={['checks']}>
            <AccordionItem value="checks">
              <AccordionHeader>Input checks (3)</AccordionHeader>
              <AccordionPanel>
                <div className="accordion-alignment-example__panel-content">
                  Prompt injection, sensitive data, and request limits
                </div>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </section>
      </>
    );
  },
};

export default {
  title: 'Components/Accordion',
};
