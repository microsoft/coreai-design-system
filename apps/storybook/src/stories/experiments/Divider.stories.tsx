// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import {
  Divider,
  DividerLabeled,
  type DividerProps,
  type DividerLabeledProps,
} from '@coreai-ds/react-headless-components';
import {
  DividerComparison,
  dividerAlignments,
  dividerAppearances,
  dividerConsumerExamples,
  type DividerExample,
} from './DividerComparison.js';
import {
  captureDividerStyles,
  compareDividerStyles,
  getComparisonDivider,
  settleDividerStyles,
  type DividerStyleDifference,
} from './compareDividerStyles.js';
import styles from './DividerComparison.module.css';

function ComparisonWithReport({
  examples,
  consumerOverrides = false,
}: {
  examples?: readonly DividerExample[];
  consumerOverrides?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (DividerStyleDifference & { example: string })[] | null
  >(null);
  const [comparing, setComparing] = React.useState(false);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Divider comparison has not mounted');
    const rows = [...container.querySelectorAll<HTMLElement>('[data-divider-case]')];
    if (!rows.length) throw new Error('Divider comparison has no examples');
    setComparing(true);
    try {
      const pairs = rows.map((row) => ({
        example: row.dataset.dividerCase ?? '',
        legacy: getComparisonDivider(row, 'legacy'),
        headless: getComparisonDivider(row, 'headless'),
      }));
      await Promise.all(
        pairs.flatMap(({ legacy, headless }) => [
          settleDividerStyles(legacy),
          settleDividerStyles(headless),
        ]),
      );
      setDifferences(
        pairs.flatMap(({ example, legacy, headless }) =>
          compareDividerStyles(captureDividerStyles(legacy), captureDividerStyles(headless)).map(
            (difference) => ({ example, ...difference }),
          ),
        ),
      );
    } finally {
      setComparing(false);
    }
  };

  return (
    <div>
      <p>
        Both columns receive the same fixtures, provider, and active light/dark theme. Divider is
        CoreAI&apos;s contentless hr (or separator div). DividerLabeled is the separately exported,
        Fluent-compatible divider with content and a wrapper slot. Neither supports a size or
        thickness prop; consumer CSS can customize the stroke.
      </p>
      <p>
        The report compares selected root, wrapper, and before/after line styles and dimensions, not
        pixels or every CSS declaration. Native logical start/end alignment is compared with
        Griffel&apos;s equivalent direction-resolved left/right alignment. Undefined children omit
        the wrapper; null, false, an empty string, and zero retain the current primitive&apos;s
        defined-content layout. The headless hr has an explicit separator role rather than relying
        only on the native implicit role.
      </p>
      {consumerOverrides && (
        <p>
          Intentional cascade difference: unlayered consumer CSS overrides the new layered stroke,
          margins, line pseudo-elements, and typography without specificity tricks. Legacy Griffel
          may retain its own declarations; the report displays any differences rather than hiding
          them. Inline styles keep their normal priority in both implementations.
        </p>
      )}
      <button type="button" onClick={compare} disabled={comparing}>
        Compare computed styles
      </button>
      <output className={styles.report} aria-label="Computed style comparison" aria-live="polite">
        {differences === null
          ? 'Comparison not run.'
          : differences.length
            ? JSON.stringify(differences, null, 2)
            : 'No differences in the selected properties.'}
      </output>
      <div ref={containerRef}>
        <DividerComparison examples={examples} />
      </div>
    </div>
  );
}

function DividerPlayground(props: DividerProps) {
  const [flipped, setFlipped] = React.useState(false);
  return (
    <div className={styles.playground}>
      <p>A native contentless separator. Content and alignment belong in DividerLabeled.</p>
      <div className={styles.playgroundFrame}>
        <Divider {...props} vertical={flipped ? !props.vertical : props.vertical} />
      </div>
      <button type="button" onClick={() => setFlipped((value) => !value)}>
        Toggle orientation
      </button>
    </div>
  );
}

function LabeledPlayground(props: DividerLabeledProps) {
  const [flipped, setFlipped] = React.useState(false);
  const [showContent, setShowContent] = React.useState(true);
  return (
    <div className={styles.playground}>
      <p>
        The current headless primitive owns separator semantics and content naming. Removing the
        content removes its wrapper and generated label association, not the separator.
      </p>
      <div className={styles.playgroundFrame}>
        <DividerLabeled
          {...props}
          aria-label="Workspace settings divider"
          vertical={flipped ? !props.vertical : props.vertical}
        >
          {showContent ? props.children : undefined}
        </DividerLabeled>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={() => setFlipped((value) => !value)}>
          Toggle orientation
        </button>
        <button type="button" onClick={() => setShowContent((value) => !value)}>
          {showContent ? 'Hide label' : 'Show label'}
        </button>
      </div>
    </div>
  );
}

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless Divider',
  component: Divider,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment: both CoreAI Divider contracts use the public useDivider/renderDivider pipeline from headless preview 0.3.2. Divider preserves the custom contentless hr/as=div API and CoreAI stroke/margin rules. DividerLabeled preserves Fluent content, alignContent, wrapper slots, caller render functions, refs, and native separator naming with CSS Modules from react-divider 9.7.6. Both retain the original fui-Divider marker; the labeled wrapper retains fui-Divider__wrapper. CoreAI adds no defaults-context dependency, size prop, thickness prop, or labeled styling override. Logical RTL CSS replaces Griffel direction-flipping. No overlay, focusgroup, Tabster, or component-specific JavaScript polyfill is needed. Production components and legacy custom style hooks are unchanged; use consumer CSS for this experimental family.',
      },
    },
  },
  argTypes: {
    appearance: { control: 'select', options: dividerAppearances },
    inset: { control: 'boolean' },
    vertical: { control: 'boolean' },
    as: { control: 'select', options: [undefined, 'div'] },
  },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare computed styles' }));
    await waitFor(
      () =>
        expect(canvas.getByRole('status', { name: 'Computed style comparison' })).toHaveTextContent(
          'No differences in the selected properties.',
        ),
      { timeout: 10000 },
    );
  },
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={dividerConsumerExamples} consumerOverrides />,
  play: async ({ canvas, canvasElement }) => {
    const rows = [...canvasElement.querySelectorAll<HTMLElement>('[data-divider-case]')];
    for (const row of rows) {
      const headless = getComparisonDivider(row, 'headless');
      await settleDividerStyles(headless);
      const values = captureDividerStyles(headless);
      if (row.dataset.dividerFamily === 'divider') {
        await expect(values['root.margin-block-start']).toBe('18px');
        await expect(
          values[
            headless.root.getAttribute('aria-orientation') === 'vertical'
              ? 'root.border-inline-end-width'
              : 'root.border-top-width'
          ],
        ).toBe('3px');
      } else {
        await expect(values['root.font-size']).toBe('18px');
        await expect(values['root::before.border-top-width']).toBe('3px');
        await expect(values['wrapper.font-weight']).toBe('600');
      }
    }
    await userEvent.click(canvas.getByRole('button', { name: 'Compare computed styles' }));
    await waitFor(() =>
      expect(
        canvas.getByRole('status', { name: 'Computed style comparison' }),
      ).not.toHaveTextContent('Comparison not run.'),
    );
  },
};

export const Playground: Story = {
  args: { appearance: 'default', inset: false, vertical: false, 'aria-label': 'Section divider' },
  render: (props) => <DividerPlayground {...props} />,
  play: async ({ canvas }) => {
    const separator = canvas.getByRole('separator', { name: 'Section divider' });
    await expect(separator.tagName).toBe('HR');
    await expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle orientation' }));
    await expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle orientation' }));
    await expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
  },
};

export const LabeledContentPlayground: StoryObj<typeof DividerLabeled> = {
  args: {
    appearance: 'default',
    alignContent: 'center',
    inset: false,
    vertical: false,
    children: 'Workspace settings',
  },
  argTypes: {
    alignContent: { control: 'select', options: dividerAlignments },
    children: { control: 'text' },
    wrapper: { control: false },
    as: { control: false },
  },
  render: (props) => <LabeledPlayground {...props} />,
  play: async ({ canvas, canvasElement }) => {
    const separator = canvas.getByRole('separator');
    await expect(separator).toHaveAccessibleName('Workspace settings');
    await expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    await userEvent.click(canvas.getByRole('button', { name: 'Toggle orientation' }));
    await expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    await userEvent.click(canvas.getByRole('button', { name: 'Hide label' }));
    await expect(canvasElement.querySelector('.fui-Divider__wrapper')).toBeNull();
    await expect(separator).not.toHaveAttribute('aria-labelledby');
    await expect(separator).toHaveAccessibleName('Workspace settings divider');
    await userEvent.click(canvas.getByRole('button', { name: 'Show label' }));
    await expect(canvasElement.querySelector('.fui-Divider__wrapper')).toHaveTextContent(
      'Workspace settings',
    );
    await expect(separator).toHaveAccessibleName('Workspace settings');
  },
};
