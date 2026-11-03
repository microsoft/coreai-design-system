// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { LinkButton } from '../../../../../packages/react-headless-components/src/LinkButton.js';
import {
  coreaiDarkTheme,
  type CoreAITheme,
} from '../../../../../packages/react-headless-components/src/theme.js';
import {
  LinkButtonComparison,
  LinkButtonFlow,
  linkButtonConsumerExample,
  type LinkButtonExample,
} from './LinkButtonComparison.js';
import {
  captureLinkButtonStyles,
  compareLinkButtonStyles,
  getComparisonLinkButton,
  settleLinkButtonStyles,
  type LinkButtonStyleDifference,
} from './LinkButtonComparisonStyles.js';
import { withHeadlessProvider } from './ComparisonProvider.js';
import styles from './LinkButtonComparison.module.css';

function ComparisonWithReport({
  examples,
  theme,
  withComponentDefaults = true,
  consumerOverrides = false,
}: {
  examples?: readonly LinkButtonExample[];
  theme?: Partial<CoreAITheme>;
  withComponentDefaults?: boolean;
  consumerOverrides?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (LinkButtonStyleDifference & { example: string })[] | null
  >(null);
  const [capturing, setCapturing] = React.useState(false);
  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('LinkButton comparison has not mounted');
    const rows = [...container.querySelectorAll<HTMLElement>('[data-link-button-case]')];
    if (!rows.length) throw new Error('LinkButton comparison has no examples');
    setCapturing(true);
    const results: (LinkButtonStyleDifference & { example: string })[] = [];
    for (const row of rows) {
      const legacy = getComparisonLinkButton(row, 'legacy');
      const headless = getComparisonLinkButton(row, 'headless');
      await Promise.all([settleLinkButtonStyles(legacy), settleLinkButtonStyles(headless)]);
      if (!legacy.getBoundingClientRect().height || !headless.getBoundingClientRect().height)
        throw new Error('LinkButton comparison has no rendered geometry');
      results.push(
        ...compareLinkButtonStyles(
          captureLinkButtonStyles(legacy),
          captureLinkButtonStyles(headless),
        ).map((difference) => ({ example: row.dataset.linkButtonCase ?? '', ...difference })),
      );
    }
    setDifferences(results);
    setCapturing(false);
  };
  return (
    <div>
      <p>
        The original package is the reference. Both columns receive the same fixtures, CoreAI theme,
        and defaults setting through separate providers. Light/dark follows the toolbar. LinkButton
        adds no CSS: the new Button owns all visual states.
      </p>
      <p>
        Roots stay native anchors, including with a compatible router component. A typed public root
        render function preserves the resolved anchor props and ref without passing a custom
        component through Button&apos;s native-only as API. External defaults use one filled,
        decorative glyph, not a regular/filled bundle.
      </p>
      <p>
        Button&apos;s supported anchor keyboard handling activates on Enter and Space, as in the
        original preset. Native href, modifier-click, download, and form semantics remain intact.
        Disabled custom roots now take the same public anchor branch as native roots, including href
        removal; the original unsupported component-as-native cast did not take that branch.
      </p>
      {consumerOverrides && (
        <p>
          Ordinary consumer CSS deliberately outranks the Fluent/CoreAI layers. Any differences from
          Griffel remain visible in this report.
        </p>
      )}
      <button type="button" onClick={compare}>
        Compare resting styles
      </button>
      <output
        className={styles.report}
        aria-label="LinkButton style comparison"
        aria-live="polite"
        data-report-state={capturing ? 'capturing' : differences === null ? 'idle' : 'ready'}
      >
        {differences === null
          ? 'Comparison not run.'
          : differences.length
            ? JSON.stringify(differences, null, 2)
            : 'No differences in the selected properties.'}
      </output>
      <div ref={containerRef}>
        <LinkButtonComparison
          examples={examples}
          theme={theme}
          withComponentDefaults={withComponentDefaults}
        />
      </div>
    </div>
  );
}

const meta = {
  title: 'Experiments/Headless LinkButton',
  component: LinkButton,
  decorators: [withHeadlessProvider],
  args: { href: '#link-button-destination', children: 'Project guide' },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'Current native-anchor LinkButton on the new Button foundation. Preserves native anchor attributes, refs, compatible router roots, consumer icon slots, and disabled/disabledFocusable behavior. External defaults remain target="_blank", rel="noopener noreferrer", and an after-content OpenFilled glyph; explicit navigation, icon, and position props win. No Griffel hooks or legacy slot registry are authored. The production package stays unchanged.',
      },
    },
  },
} satisfies Meta<typeof LinkButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const comparePlay: NonNullable<Story['play']> = async ({ canvas }) => {
  await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
  await waitFor(async () => {
    const report = canvas.getByRole('status', { name: 'LinkButton style comparison' });
    await expect(report).toHaveAttribute('data-report-state', 'ready');
    await expect(report).toHaveTextContent('No differences in the selected properties.');
  });
};

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: comparePlay,
};

export const DarkComparison: Story = {
  render: () => <ComparisonWithReport theme={coreaiDarkTheme} />,
  play: comparePlay,
};

export const DefaultsDisabled: Story = {
  render: () => <ComparisonWithReport withComponentDefaults={false} />,
  play: comparePlay,
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[linkButtonConsumerExample]} consumerOverrides />,
  play: async ({ canvas, canvasElement }) => {
    const root = getComparisonLinkButton(canvasElement, 'headless');
    await settleLinkButtonStyles(root);
    const values = captureLinkButtonStyles(root);
    await expect(values['root.min-width']).toBe('152px');
    await expect(values['root.border-radius']).toBe('3px');
    await expect(values['root.color']).toBe('rgb(20, 90, 160)');
    await expect(values['presetIcon.width']).toBe('16px');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole('status', { name: 'LinkButton style comparison' }),
      ).toHaveAttribute('data-report-state', 'ready');
    });
  },
};

export const InteractionFlow: Story = {
  render: () => <LinkButtonFlow />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Before links' }));
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Open project guide' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('status', { name: 'Link outcomes' })).toHaveTextContent(
      '1 link activations; 0 form submissions',
    );
    await userEvent.keyboard(' ');
    await expect(canvas.getByRole('status', { name: 'Link outcomes' })).toHaveTextContent(
      '2 link activations; 0 form submissions',
    );
    await userEvent.tab();
    const disabled = canvas.getByRole('link', { name: 'Focusable unavailable guide' });
    await expect(disabled).toHaveFocus();
    await expect(disabled).not.toHaveAttribute('href');
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('status', { name: 'Link outcomes' })).toHaveTextContent(
      '2 link activations; 0 form submissions',
    );
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Custom router guide' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('status', { name: 'Link outcomes' })).toHaveTextContent(
      '3 link activations; 0 form submissions',
    );
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('status', { name: 'Link outcomes' })).toHaveTextContent(
      '3 link activations; 1 form submissions',
    );
  },
};

export const Playground: Story = {};
