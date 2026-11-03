// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  type AccordionProps,
} from '@coreai-ds/react-headless-components';
import {
  AccordionComparison,
  AccordionFixtureIcon,
  accordionConsumerExample,
  type AccordionExample,
} from './AccordionComparison.js';
import {
  captureAccordionHeaderStyles,
  captureAccordionStyles,
  compareAccordionStyles,
  expectedAccordionMountDifferences,
  getComparisonAccordion,
  settleAccordionStyles,
  type AccordionStyleDifference,
} from './compareAccordionStyles.js';
import styles from './AccordionComparison.module.css';

type ReportDifference = AccordionStyleDifference & { example: string; intentional: boolean };

function ComparisonWithReport({
  examples,
  consumerOverrides = false,
}: {
  examples?: readonly AccordionExample[];
  consumerOverrides?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<ReportDifference[] | null>(null);
  const [comparing, setComparing] = React.useState(false);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Accordion comparison has not mounted');
    setComparing(true);
    try {
      const results: ReportDifference[] = [];
      for (const row of container.querySelectorAll<HTMLElement>('[data-accordion-case]')) {
        const legacy = getComparisonAccordion(row, 'legacy');
        const headless = getComparisonAccordion(row, 'headless');
        await Promise.all([settleAccordionStyles(legacy), settleAccordionStyles(headless)]);
        const expected = expectedAccordionMountDifferences(headless);
        results.push(
          ...compareAccordionStyles(
            captureAccordionStyles(legacy),
            captureAccordionStyles(headless),
          ).map((difference) => ({
            ...difference,
            example: row.dataset.accordionCase ?? '',
            intentional: expected.some(
              (known) =>
                known.property === difference.property &&
                known.legacy === difference.legacy &&
                known.headless === difference.headless,
            ),
          })),
        );
      }
      setDifferences(results);
    } finally {
      setComparing(false);
    }
  };
  const unexpected = differences?.filter((difference) => !difference.intentional).length;

  return (
    <div>
      <p>
        Shared fixtures compare selected root, header, button, icon, visible-panel, and native
        focus-ring styles and dimensions. CoreAI uses a grid header with no button padding or panel
        margins; opting out of component defaults restores Fluent flex layout and spacing.
      </p>
      <p>
        Intentional difference: headless 0.3.2 keeps closed panels mounted, requests inert, and sets
        tabIndex=-1. React DOM 18.3.1 omits its boolean inert attribute; CSS display:none excludes
        closed content from focus and accessibility while preserving local state. No inert shim is
        added. Legacy Collapse unmounts panels. The report retains each exact mounted-panel
        difference rather than suppressing it. Collapse motion is not a current headless API and is
        not recreated. Default chevron rotation uses native DOM direction, including a local dir
        override inside a differently directed provider.
      </p>
      <p>
        Native buttons own click, Enter, Space, and Tab. The current API has no deprecated arrow
        navigation, Tabster attributes, focusgroup, or overlay dependency, so Accordion needs no
        navigation/overlay polyfill. The pinned hook sets aria-expanded but does not generate
        heading levels, region roles, or button/panel IDs; these fixtures provide their
        associations.
      </p>
      <p>
        These examples use array-form open items, including [0] for numeric identifiers. The pinned
        upstream hook mishandles falsy scalar defaults; this inherited limitation is outside the
        styling migration, and no compatibility normalization is added.
      </p>
      {consumerOverrides && (
        <p>
          Ordinary consumer CSS intentionally outranks the new layered component and CoreAI styles.
          Legacy Griffel can retain its original layout, spacing, typography, and colors. All
          selected differences remain visible below.
        </p>
      )}
      <button type="button" onClick={compare} disabled={comparing}>
        Compare resting styles
      </button>
      <output
        className={styles.report}
        aria-label="Computed style comparison"
        aria-live="polite"
        data-unexpected={unexpected}
      >
        {differences === null
          ? 'Comparison not run.'
          : `${unexpected} unexpected selected-style differences. ${differences.length - (unexpected ?? 0)} intentional mounted-panel differences.\n${JSON.stringify(differences, null, 2)}`}
      </output>
      <div ref={containerRef}>
        <AccordionComparison examples={examples} />
      </div>
    </div>
  );
}

function AccordionPlayground({ defaultOpenItems = ['overview'], ...props }: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<unknown[]>(
    Array.isArray(defaultOpenItems) ? defaultOpenItems : [defaultOpenItems],
  );
  const [multiple, setMultiple] = React.useState(props.multiple ?? false);
  const [collapsible, setCollapsible] = React.useState(props.collapsible ?? false);
  const [lastToggle, setLastToggle] = React.useState('No toggles yet.');
  const id = React.useId();
  return (
    <div className={styles.playground}>
      <p>Workspace disclosures</p>
      <div className={styles.controls}>
        <label>
          <input
            type="checkbox"
            checked={multiple}
            onChange={(event) => setMultiple(event.currentTarget.checked)}
          />
          Allow multiple panels
        </label>
        <label>
          <input
            type="checkbox"
            checked={collapsible}
            onChange={(event) => setCollapsible(event.currentTarget.checked)}
          />
          Allow all panels closed
        </label>
      </div>
      <button type="button">Before sections</button>
      <Accordion
        {...props}
        multiple={multiple}
        collapsible={collapsible}
        openItems={openItems}
        onToggle={(event, data) => {
          props.onToggle?.(event, data);
          setOpenItems(data.openItems);
          setLastToggle(
            `Value: ${String(data.value)}. Open: ${data.openItems.join(', ') || '(none)'}.`,
          );
        }}
      >
        <AccordionItem value="overview">
          <AccordionHeader
            as="h2"
            icon={<AccordionFixtureIcon />}
            button={{ id: `${id}-overview-button`, 'aria-controls': `${id}-overview-panel` }}
          >
            Overview
          </AccordionHeader>
          <AccordionPanel
            id={`${id}-overview-panel`}
            role="region"
            aria-labelledby={`${id}-overview-button`}
          >
            <label>
              Workspace note
              <input defaultValue="Draft" />
            </label>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem value="details">
          <AccordionHeader
            as="h2"
            expandIconPosition="end"
            button={{ id: `${id}-details-button`, 'aria-controls': `${id}-details-panel` }}
          >
            Details
          </AccordionHeader>
          <AccordionPanel
            id={`${id}-details-panel`}
            role="region"
            aria-labelledby={`${id}-details-button`}
          >
            <a href="#workspace-details" onClick={(event) => event.preventDefault()}>
              Review workspace details
            </a>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem value="unavailable" disabled>
          <AccordionHeader as="h2">Unavailable</AccordionHeader>
          <AccordionPanel>Unavailable content</AccordionPanel>
        </AccordionItem>
      </Accordion>
      <button type="button">After sections</button>
      <output aria-label="Accordion state" aria-live="polite">
        {lastToggle}
      </output>
    </div>
  );
}

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless Accordion',
  component: Accordion,
  subcomponents: { AccordionItem, AccordionHeader, AccordionPanel },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment: public hooks, three public context-value helpers, and renderers from headless 0.3.2. CSS Modules use react-accordion 9.12.5 visual sources and actual CoreAI header/panel overrides. Only current visual size/inline props and the default style-free chevron are restored. Public slots, refs, ARIA, callbacks, multiple/collapsible controls, and controlled/default openItems stay hook-owned. Closed panels remain mounted and are hidden with CSS; React 18 omits the hook’s boolean inert attribute. No inert shim, legacy motion, or deprecated navigation is restored. Production components and arbitrary legacy customStyleHooks are unchanged.',
      },
    },
  },
  argTypes: {
    multiple: { control: 'boolean' },
    collapsible: { control: 'boolean' },
    openItems: { control: false },
    defaultOpenItems: { control: false },
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(() =>
      expect(canvas.getByRole('status', { name: 'Computed style comparison' })).toHaveAttribute(
        'data-unexpected',
        '0',
      ),
    );
    await expect(
      canvas.getByRole('status', { name: 'Computed style comparison' }),
    ).toHaveTextContent('intentional mounted-panel differences.');
  },
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[accordionConsumerExample]} consumerOverrides />,
  play: async ({ canvas, canvasElement }) => {
    const accordion = getComparisonAccordion(canvasElement, 'headless');
    await settleAccordionStyles(accordion);
    const header = captureAccordionHeaderStyles(accordion.items[0].header);
    const values = captureAccordionStyles(accordion);
    await expect(header['button.display']).toBe('flex');
    await expect(header['button.padding-left']).toBe('10px');
    await expect(header['button.min-height']).toBe('52px');
    await expect(header['button.font-size']).toBe('18px');
    await expect(header['button.color']).toBe('rgb(20, 90, 160)');
    await expect(header['expandIcon.font-size']).toBe('16px');
    await expect(values['item0.panel.margin-left']).toBe('8px');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(() =>
      expect(
        canvas.getByRole('status', { name: 'Computed style comparison' }),
      ).not.toHaveTextContent('Comparison not run.'),
    );
  },
};

export const ControlledFlow: Story = {
  args: {
    multiple: false,
    collapsible: false,
    onToggle: fn(),
  },
  render: (args) => <AccordionPlayground {...args} />,
  play: async ({ args, canvas }) => {
    const overview = canvas.getByRole('button', { name: 'Overview' });
    const details = canvas.getByRole('button', { name: 'Details' });
    await expect(overview).toHaveAttribute('aria-expanded', 'true');
    await expect(overview).toHaveAttribute('aria-disabled', 'true');
    await expect(canvas.getByRole('button', { name: 'Unavailable' })).toBeDisabled();
    const note = canvas.getByRole('textbox', { name: 'Workspace note' });
    await userEvent.clear(note);
    await userEvent.type(note, 'Preserved draft');
    await userEvent.click(details);
    await expect(overview).toHaveAttribute('aria-expanded', 'false');
    await expect(details).toHaveAttribute('aria-expanded', 'true');
    await expect(args.onToggle).toHaveBeenLastCalledWith(expect.anything(), {
      value: 'details',
      openItems: ['details'],
    });
    await expect(canvas.queryByRole('textbox', { name: 'Workspace note' })).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Allow multiple panels' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Before sections' }));
    await userEvent.hover(canvas.getByText('Workspace disclosures', { exact: true }));
    await userEvent.tab();
    await expect(overview).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(overview).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(overview).toHaveAttribute('aria-expanded', 'true');
    await expect(details).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByRole('textbox', { name: 'Workspace note' })).toHaveValue(
      'Preserved draft',
    );
    await expect(args.onToggle).toHaveBeenLastCalledWith(expect.anything(), {
      value: 'overview',
      openItems: ['details', 'overview'],
    });
    await userEvent.keyboard(' ');
    await expect(overview).toHaveAttribute('aria-expanded', 'false');
    await expect(details).toHaveAttribute('aria-disabled', 'true');

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Allow all panels closed' }));
    await userEvent.click(details);
    await expect(details).toHaveAttribute('aria-expanded', 'false');
    await expect(args.onToggle).toHaveBeenLastCalledWith(expect.anything(), {
      value: 'details',
      openItems: [],
    });
    await expect(canvas.getByRole('status', { name: 'Accordion state' })).toHaveTextContent(
      'Value: details. Open: (none).',
    );
    await expect(canvas.queryByRole('region')).not.toBeInTheDocument();
  },
};
