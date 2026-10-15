// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Storybook story file for the Details List template.
 * The template and all its code live in DetailsList.tsx.
 * This file owns Storybook meta and copy-paste examples shown in the
 * Docs Source Code entry. Do not hand-author the generated DetailsList.mdx.
 *
 * Stories:
 *   Default            — baseline text-only label/value pairs
 *   WithCustomClasses  — grouped model facts styled via className hooks
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DetailsList } from './DetailsList';
import { Button, Card, Divider, Link, Text } from '@coreai-ds/react-components';

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Baseline label/value layout with text values.
 *
 * @summary Basic text-only details list.
 */
export const Default: StoryObj = {
  name: 'Details List',
  render: () => {
    const items = [
      { key: 'name', label: 'Name', value: 'John Smith' },
      {
        key: 'email',
        label: 'Email',
        value: <Link href="mailto:john.smith@example.com">john.smith@example.com</Link>,
      },
      { key: 'role', label: 'Role', value: 'Software Engineer' },
      { key: 'department', label: 'Department', value: 'Engineering' },
      { key: 'location', label: 'Location', value: 'Seattle, WA' },
    ];

    return <DetailsList items={items} />;
  },
};

// ---------- With Custom Classes ----------

/**
 * Uses class name props to arrange details in horizontal rows within grouped card sections.
 * The values can contain interactive content such as links and buttons.
 *
 * @summary Details list with custom layout classes and interactive values.
 */
export const WithCustomClasses: StoryObj = {
  render: () => {
    const modelFacts = [
      { key: 'provider', label: 'Model provider', value: 'Anthropic' },
      { key: 'type', label: 'Type', value: 'Messages' },
      { key: 'lifecycle', label: 'Lifecycle', value: 'Generally Available' },
      { key: 'hosted', label: 'Hosted on', value: 'Azure' },
    ];

    const inputOutputFacts = [
      { key: 'input', label: 'Input type', value: 'text, image, code' },
      { key: 'output', label: 'Output type', value: 'text, image, code' },
    ];

    const capacityFacts = [
      { key: 'context', label: 'Context window', value: '1000k' },
      { key: 'tokens', label: 'Token limits', value: '128k output' },
    ];

    const actionFacts = [
      {
        key: 'pricing',
        label: 'Pricing',
        value: (
          <Link href="https://azure.microsoft.com/pricing" target="_blank" external>
            View pricing
          </Link>
        ),
      },
      {
        key: 'availability',
        label: 'Availability',
        value: <Button appearance="outline">View availability</Button>,
      },
    ];

    const slotClassNameProps = {
      itemClassName: 'details-list-example__item',
      labelClassName: 'details-list-example__label',
      valueClassName: 'details-list-example__value',
    };

    const styles = /* css */ `
       .details-list-example__card {
        width: 356px;
        max-width: 100%;
        padding: var(--spacingVerticalXXL);
        row-gap: var(--spacingVerticalL);
      }

       .details-list-example__heading {
        margin: 0;
      }

       .details-list-example__section {
        row-gap: var(--spacingVerticalS);
      }

       .details-list-example__item {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        column-gap: var(--spacingHorizontalL);
      }

       .details-list-example__label {
        min-width: 0;
      }

       .details-list-example__value {
        min-width: 0;
        text-align: end;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <Card className="details-list-example__card">
          <Text as="h2" preset="heading4" foreground={1} className="details-list-example__heading">
            Quick facts
          </Text>
          <DetailsList
            items={modelFacts}
            className="details-list-example__section"
            {...slotClassNameProps}
          />
          <Divider />
          <DetailsList
            items={inputOutputFacts}
            className="details-list-example__section"
            {...slotClassNameProps}
          />
          <Divider />
          <DetailsList
            items={capacityFacts}
            className="details-list-example__section"
            {...slotClassNameProps}
          />
          <Divider />
          <DetailsList
            items={actionFacts}
            className="details-list-example__section"
            {...slotClassNameProps}
          />
        </Card>
      </>
    );
  },
};

// ─── Storybook meta ───────────────────────────────────────────────────────────

/**
 * Copy-paste template — not an importable component. Copy the full source from
 * the `templates-details-list--source-code` docs entry.
 *
 * Starter scaffold for building a label-value details panel with CoreAI primitives.
 * Keep semantic <dl>/<dt>/<dd> markup, replace sample items, and customize class
 * hooks only when needed.
 *
 * @summary Accessible, responsive, copy-paste starter for details panels with 2 variants.
 */
const meta: Meta = {
  title: 'Templates/Details List',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
