// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { ComparisonProvider as CoreAIFluentProvider } from './ComparisonProvider.js';
import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  CardPreview,
  type CardProps,
} from '@coreai-ds/react-headless-components';
import {
  CardComparison,
  CardNativeActionsFlow,
  CardSelectionFlow,
  cardAppearances,
  cardConsumerExample,
  cardFloatingActionPositions,
  cardOrientations,
  cardSizes,
  type CardExample,
} from './CardComparison.js';
import {
  captureCardStyles,
  compareCardStyles,
  getCardSlots,
  getComparisonCard,
  settleCardStyles,
  type CardStyleDifference,
} from './compareCardStyles.js';
import styles from './CardComparison.module.css';

function ComparisonWithReport({ examples }: { examples?: readonly CardExample[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (CardStyleDifference & { example: string })[] | null
  >(null);
  const [comparing, setComparing] = React.useState(false);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Card comparison has not mounted');
    setComparing(true);
    try {
      const rows = [...container.querySelectorAll<HTMLElement>('[data-card-case]')];
      if (!rows.length) throw new Error('Card comparison has no fixtures');
      const results = [];
      for (const row of rows) {
        const legacy = getComparisonCard(row, 'legacy');
        const headless = getComparisonCard(row, 'headless');
        await Promise.all([settleCardStyles(legacy), settleCardStyles(headless)]);
        results.push(
          ...compareCardStyles(captureCardStyles(legacy), captureCardStyles(headless)).map(
            (difference) => ({ example: row.dataset.cardCase ?? '', ...difference }),
          ),
        );
      }
      setDifferences(results);
    } finally {
      setComparing(false);
    }
  };

  return (
    <div>
      <p>
        Shared fixtures compare bounded root, header/image/title/description/action, content,
        preview/media/logo, footer/action, floating-action, and checkbox styles and dimensions.
        Captured strings and dimensions are exact. CoreAI floating-action rails still apply when
        component defaults are disabled.
      </p>
      <button type="button" onClick={compare} disabled={comparing}>
        Compare resting styles
      </button>
      <output className={styles.report} aria-label="Card style report" aria-live="polite">
        {differences === null
          ? 'Comparison not run.'
          : differences.length
            ? `${differences.length} differences (showing at most 100):\n${JSON.stringify(
                differences.slice(0, 100),
                null,
                2,
              )}`
            : 'No differences in the selected properties.'}
      </output>
      <div ref={containerRef}>
        <CardComparison examples={examples} />
      </div>
    </div>
  );
}

function NativeFocusFlow() {
  const [activations, setActivations] = React.useState(0);
  return (
    <div className={styles.flow}>
      <p>
        The installed public Card intentionally omits focusMode. It adds neither a Tabster focus
        trap nor focusgroup. Explicit tabIndex makes this native group a tab stop; Enter does not
        synthesize a click on a div. Use a native button for keyboard activation. Native
        :focus-visible provides a visible ring without old focus attributes.
      </p>
      <button type="button">Start native focus</button>
      <Card
        className={styles.card}
        aria-label="Focusable native card"
        tabIndex={0}
        onClick={() => setActivations((count) => count + 1)}
      >
        <CardHeader header="Native focus, no trap" />
        <CardFooter>
          <Button as="button" type="button">
            Activate card action
          </Button>
        </CardFooter>
      </Card>
      <button type="button">After the card</button>
      <output aria-label="Native card activations">Activations: {activations}</output>
    </div>
  );
}

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless Card',
  component: Card,
  subcomponents: { CardHeader, CardPreview, CardFooter },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration of Card, CardHeader, CardPreview, and CardFooter as one family. Uses the public headless 0.3.2 hook/render/context facade and native slots, with react-card 9.7.4 as the visual reference. Production is unchanged. Current Card roots are divs; links and forms belong in valid native children. focusMode is intentionally absent, no focusgroup/overlay polyfill is needed, and no legacy focus manager is recreated. The primitive does not supply the legacy focus-aware selection restriction: use its public shouldRestrictTriggerAction when nested actions must not select. Native checkbox clicks can report both click and change; this example explicitly stops checkbox click bubbling through its public slot, without changing the primitive. Nested buttons stop Enter bubbling because the primitive otherwise cancels native Enter activation before checking the predicate. Header context supplies the checkbox accessible name. A native focus-visible outline intentionally remains visible with CoreAI defaults instead of relying on the legacy pseudo-element that CoreAI resets.',
      },
    },
  },
  argTypes: {
    appearance: { control: 'select', options: cardAppearances },
    size: { control: 'select', options: cardSizes },
    orientation: { control: 'select', options: cardOrientations },
    floatingActionPosition: { control: 'select', options: cardFloatingActionPositions },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(
      async () => {
        await expect(canvas.getByRole('status', { name: 'Card style report' })).toHaveTextContent(
          'No differences in the selected properties.',
        );
      },
      { timeout: 10000 },
    );
  },
};

export const RTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <ComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const DefaultsOptOut: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} withComponentDefaults={false}>
      <p>
        One explicit cascade difference is expected: the Custom Text color fixture retains its
        explicit Text foreground in the layered port, while legacy Fluent forces currentColor. The
        unsuppressed report must contain only that text.color difference.
      </p>
      <ComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(
      async () => {
        const report = canvas.getByRole('status', { name: 'Card style report' });
        await expect(report).toHaveTextContent('1 differences (showing at most 100):');
        await expect(report).toHaveTextContent('"example": "Custom Text color"');
        await expect(report).toHaveTextContent('"property": "text.color"');
      },
      { timeout: 10000 },
    );
    const row = canvasElement.querySelector('[data-card-case="Custom Text color"]');
    if (!row) throw new Error('Missing opt-out custom Text fixture');
    const reference = row.querySelector('[data-card-color-reference]');
    if (!reference) throw new Error('Missing foreground color reference');
    const legacy = getComparisonCard(row, 'legacy');
    const headless = getComparisonCard(row, 'headless');
    await expect(compareCardStyles(captureCardStyles(legacy), captureCardStyles(headless))).toEqual(
      [
        {
          property: 'text.color',
          legacy: getComputedStyle(legacy).color,
          headless: getComputedStyle(reference).color,
        },
      ],
    );
  },
};

export const ConsumerOverrides: Story = {
  render: () => (
    <>
      <p>
        Intentional cascade difference: ordinary unlayered consumer CSS wins over the port's layered
        rules, including the root surface, header gap, image sizing, preview logo, floating-action
        rail, and footer spacing. The unsuppressed report may differ from Griffel.
      </p>
      <ComparisonWithReport examples={[cardConsumerExample]} />
    </>
  ),
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(async () => {
      await expect(canvas.getByRole('status', { name: 'Card style report' })).not.toHaveTextContent(
        'Comparison not run.',
      );
    });
    const root = getComparisonCard(canvasElement, 'headless');
    const slots = getCardSlots(root);
    await expect(getComputedStyle(root).borderRadius).toBe('3px');
    await expect(getComputedStyle(root).paddingTop).toBe('17px');
    if (!slots.logo || !slots.floatingAction || !slots.footer) {
      throw new Error('Missing consumer Card slots');
    }
    await expect(getComputedStyle(slots.logo).width).toBe('24px');
    await expect(getComputedStyle(slots.floatingAction).paddingTop).toBe('2px');
    await expect(getComputedStyle(slots.footer).gap).toBe('7px');
  },
};

export const Selection: Story = {
  render: () => <CardSelectionFlow />,
  play: async ({ canvas }) => {
    const selected = canvas.getByRole('checkbox', { name: 'Project Atlas' });
    const uncontrolled = canvas.getByRole('checkbox', { name: 'Project Borealis' });
    await expect(selected).not.toBeChecked();
    await expect(uncontrolled).toBeChecked();
    await userEvent.click(canvas.getByRole('button', { name: 'Start keyboard selection' }));
    await userEvent.hover(canvas.getByText(/Native Tab reaches/));
    await userEvent.tab();
    await expect(selected).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(selected).toBeChecked();
    await expect(canvas.getByRole('status', { name: 'Atlas selection' })).toHaveTextContent(
      'Selected; changes: 1; actions: 0',
    );
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Open Atlas actions' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(selected).toBeChecked();
    await expect(canvas.getByRole('status', { name: 'Atlas selection' })).toHaveTextContent(
      'Selected; changes: 1; actions: 1',
    );
    await userEvent.click(canvas.getByText('Select the Atlas card body.'));
    await expect(selected).not.toBeChecked();
    await expect(canvas.getByRole('status', { name: 'Atlas selection' })).toHaveTextContent(
      'Not selected; changes: 2; actions: 1',
    );
    await userEvent.click(canvas.getByText('Project Borealis'));
    await expect(uncontrolled).not.toBeChecked();
    await expect(canvas.getByRole('status', { name: 'Borealis selection' })).toHaveTextContent(
      'Not selected',
    );
  },
};

export const NativeActions: Story = {
  render: () => <CardNativeActionsFlow />,
  play: async ({ canvas }) => {
    const originalUrl = window.location.href;
    try {
      await userEvent.click(canvas.getByRole('button', { name: 'Start keyboard actions' }));
      await userEvent.hover(canvas.getByText(/Card is a noninteractive group/));
      await userEvent.tab();
      await expect(canvas.getByRole('button', { name: 'Pin project' })).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(canvas.getByRole('status', { name: 'Project pins' })).toHaveTextContent(
        'Pins: 1',
      );
      await expect(canvas.getByRole('status', { name: 'Project submission' })).toHaveTextContent(
        'No submission; submissions: 0',
      );
      await userEvent.tab();
      await expect(canvas.getByRole('button', { name: 'Open project' })).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(canvas.getByRole('status', { name: 'Project submission' })).toHaveTextContent(
        'Atlas:open; submissions: 1',
      );
      await userEvent.tab();
      await expect(canvas.getByRole('link', { name: 'Project details' })).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await waitFor(async () => {
        await expect(canvas.getByRole('status', { name: 'Project visits' })).toHaveTextContent(
          'Visits: 1',
        );
      });
    } finally {
      window.history.replaceState(null, '', originalUrl);
    }
  },
};

export const NativeFocus: Story = {
  render: () => <NativeFocusFlow />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Start native focus' }));
    await userEvent.hover(canvas.getByText(/The installed public Card intentionally omits/));
    await userEvent.tab();
    const card = canvas.getByRole('group', { name: 'Focusable native card' });
    await expect(card).toHaveFocus();
    await expect(card.matches(':focus-visible')).toBe(true);
    await expect(getComputedStyle(card).outlineStyle).toBe('solid');
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('status', { name: 'Native card activations' })).toHaveTextContent(
      'Activations: 0',
    );
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Activate card action' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('status', { name: 'Native card activations' })).toHaveTextContent(
      'Activations: 1',
    );
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'After the card' })).toHaveFocus();
  },
};

export const Playground: Story = {
  args: {
    appearance: 'filled-alternative',
    size: 'medium',
    orientation: 'vertical',
    floatingActionPosition: 'right',
  },
  render: (args: CardProps) => (
    <CardComparison examples={[{ name: 'Playground', props: args, floating: true }]} />
  ),
};
