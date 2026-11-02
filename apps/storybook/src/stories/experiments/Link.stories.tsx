// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { Link, type LinkProps } from '@coreai-ds/react-headless-components';
import {
  LinkComparison,
  linkAppearances,
  linkConsumerExample,
  type LinkExample,
} from './LinkComparison.js';
import {
  captureLinkStyles,
  compareLinkStyles,
  getComparisonLink,
  settleLinkStyles,
  type LinkStyleDifference,
} from './compareLinkStyles.js';
import styles from './LinkComparison.module.css';

function ComparisonWithReport({
  examples,
  consumerOverrides = false,
}: {
  examples?: readonly LinkExample[];
  consumerOverrides?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (LinkStyleDifference & { example: string })[] | null
  >(null);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Link comparison has not mounted');
    const rows = [...container.querySelectorAll<HTMLElement>('[data-link-case]')];
    if (!rows.length) throw new Error('Link comparison has no examples');
    const results: (LinkStyleDifference & { example: string })[] = [];
    for (const row of rows) {
      const legacy = getComparisonLink(row, 'legacy');
      const headless = getComparisonLink(row, 'headless');
      await Promise.all([settleLinkStyles(legacy), settleLinkStyles(headless)]);
      results.push(
        ...compareLinkStyles(captureLinkStyles(legacy), captureLinkStyles(headless)).map(
          (difference) => ({ example: row.dataset.linkCase ?? '', ...difference }),
        ),
      );
    }
    setDifferences(results);
  };

  return (
    <div>
      <p>
        Both columns share the provider, theme, and representative fixtures. An href selects a
        native anchor; without an href, Link defaults to a native button. Span roots and public
        inline context are also supported. Static Toast fixtures supply their public brand and
        inverted background contexts; the headless Link implementation does not import Toast.
      </p>
      <p>
        This report compares selected resting typography, decoration, colors, glyphs, and
        dimensions, not screenshots. Logical text alignment is compared by its effective direction.
        External uses the current filled glyph, not a regular/filled icon bundle.
      </p>
      {consumerOverrides && (
        <p>
          Intentional cascade change: ordinary, unlayered consumer CSS overrides the headless root
          and decorative glyph. Legacy Griffel may retain its styles. Native keyboard focus also
          keeps a double underline when a disabled-focusable link is hovered.
        </p>
      )}
      <button type="button" onClick={compare}>
        Compare resting styles
      </button>
      <output className={styles.report} aria-label="Computed style comparison" aria-live="polite">
        {differences === null
          ? 'Comparison not run.'
          : differences.length
            ? JSON.stringify(differences, null, 2)
            : 'No differences in the selected properties.'}
      </output>
      <div ref={containerRef}>
        <LinkComparison examples={examples} />
      </div>
    </div>
  );
}

function NativeLinkSemantics(): React.ReactElement {
  const [activations, setActivations] = React.useState(0);
  const [saved, setSaved] = React.useState<string | null>(null);
  const activate: React.MouseEventHandler<HTMLSpanElement> = () =>
    setActivations((value) => value + 1);
  return (
    <form
      className={styles.playground}
      onSubmit={(event) => {
        event.preventDefault();
        if (!(event.nativeEvent instanceof SubmitEvent))
          throw new Error('Missing native SubmitEvent');
        const submitter = event.nativeEvent.submitter;
        if (!(submitter instanceof HTMLButtonElement))
          throw new Error('Missing native button submitter');
        const values = new FormData(event.currentTarget, submitter);
        setSaved(`${values.get('project')} (${values.get('action')})`);
      }}
    >
      <p>These link-styled controls retain their native button and span contracts.</p>
      <input type="hidden" name="project" value="CoreAI" />
      <Link onClick={activate}>Preview project</Link>
      <Link as="button" type="submit" name="action" value="save" onClick={activate}>
        Save project
      </Link>
      <Link as="button" type="submit" disabledFocusable onClick={activate}>
        Unavailable save
      </Link>
      <Link as="span" onClick={activate}>
        Show options
      </Link>
      <output aria-live="polite">{activations} activations.</output>
      <output aria-live="polite">
        {saved === null ? 'No submission yet.' : `Saved project: ${saved}`}
      </output>
    </form>
  );
}

const meta = {
  title: 'Experiments/Headless Link',
  component: Link,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment: public Fluent useLink/renderLink and root-slot behavior with layered CSS Modules. Current visual props are appearance and inline; CoreAI adds explicit external glyph/navigation defaults. Link has no CoreAI provider-dependent prop defaults. Only a, button, and span roots are supported by the pinned public API; use a caller root render function for compatible adapters rather than an unsupported as component. Caller render functions receive the external glyph as default slot children and can preserve or replace that content. Native :focus-visible replaces the legacy focus attribute, retaining a double underline even with disabled-focusable hover. Use consumer CSS, slots, or inline styles instead of legacy customStyleHooks. The production package is unchanged.',
      },
    },
  },
  argTypes: {
    appearance: { control: 'select', options: linkAppearances },
    inline: { control: 'boolean' },
    external: { control: 'boolean' },
    disabled: { control: 'boolean' },
    disabledFocusable: { control: 'boolean' },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;
type AnchorStory = StoryObj<Extract<LinkProps, { as?: 'a' }>>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    for (const implementation of ['legacy', 'headless'] as const) {
      await expect(getComparisonLink(canvasElement, implementation).root.matches(':hover')).toBe(
        false,
      );
    }
    await expect(
      await canvas.findByText('No differences in the selected properties.'),
    ).toBeVisible();
  },
};

export const ConsumerOverrides: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The shared fixture uses ordinary CSS for root color, typography, decoration, spacing, and a non-shrinking 12px external glyph without !important. Native 1em glyphs otherwise remain flexible when their row is constrained. The report retains any legacy/headless differences rather than hiding them.',
      },
    },
  },
  render: () => <ComparisonWithReport examples={[linkConsumerExample]} consumerOverrides />,
  play: async ({ canvas, canvasElement }) => {
    const headless = getComparisonLink(canvasElement, 'headless');
    await settleLinkStyles(headless);
    const values = captureLinkStyles(headless);
    await expect(values['root.color']).toBe('rgb(20, 90, 160)');
    await expect(values['root.font-size']).toBe('18px');
    await expect(values['root.text-decoration-style']).toBe('dashed');
    await expect(values['externalIcon.font-size']).toBe('12px');
    await expect(values['externalIcon.width']).toBe('12.00');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole('status', { name: 'Computed style comparison' }),
      ).not.toHaveTextContent('Comparison not run.');
    });
  },
};

export const Playground: AnchorStory = {
  args: {
    href: '#headless-link-preview',
    target: '_self',
    children: 'View documentation',
    external: true,
    inline: true,
    onClick: fn((event: React.MouseEvent<HTMLSpanElement>) => event.preventDefault()),
  },
  render: (args) => (
    <div className={styles.playground}>
      <p>
        The callback prevents navigation in this playground. Native Navigation exercises a real
        local destination.
      </p>
      <Link {...args} />
    </div>
  ),
  play: async ({ args, canvas }) => {
    const link = canvas.getByRole('link', { name: 'View documentation' });
    await expect(link).toHaveAccessibleName('View documentation');
    await expect(link).toHaveAttribute('target', '_self');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    await userEvent.click(link);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('{Enter}');
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};

export const NativeSemantics: Story = {
  render: () => <NativeLinkSemantics />,
  play: async ({ canvas }) => {
    const preview = canvas.getByRole('button', { name: 'Preview project' });
    await expect(preview).toHaveAttribute('type', 'button');
    await userEvent.click(preview);
    await expect(canvas.getByText('1 activations.')).toBeVisible();
    await expect(canvas.getByText('No submission yet.')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Save project' }));
    await expect(canvas.getByText('2 activations.')).toBeVisible();
    await expect(canvas.getByText('Saved project: CoreAI (save)')).toBeVisible();
    const unavailable = canvas.getByRole('button', { name: 'Unavailable save' });
    await expect(unavailable).toHaveAttribute('aria-disabled', 'true');
    await expect(unavailable).not.toHaveAttribute('disabled');
    await userEvent.click(unavailable);
    await expect(canvas.getByText('2 activations.')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Show options' }));
    await userEvent.keyboard('{Enter} ');
    await expect(canvas.getByText('5 activations.')).toBeVisible();
  },
};

export const DisabledActivation: AnchorStory = {
  args: { onClick: fn() },
  render: (args) => (
    <div className={styles.playground}>
      <div className={styles.pointerParking} data-testid="pointer-parking" aria-hidden />
      <p>
        Tab skips disabled anchors. Disabled-focusable anchors remain discoverable but cannot
        activate.
      </p>
      <button type="button">Start keyboard test</button>
      <Link href="#unavailable-destination" disabled>
        Unavailable destination
      </Link>
      <Link href="#unavailable-destination" disabled disabledFocusable onClick={args.onClick}>
        Focusable unavailable destination
      </Link>
      <button type="button">Next action</button>
    </div>
  ),
  play: async ({ args, canvas }) => {
    const focusable = canvas.getByRole('link', { name: 'Focusable unavailable destination' });
    await userEvent.click(canvas.getByRole('button', { name: 'Start keyboard test' }));
    await userEvent.hover(canvas.getByTestId('pointer-parking'));
    await userEvent.tab();
    await expect(focusable).toHaveFocus();
    await expect(focusable.matches(':hover')).toBe(false);
    await expect(focusable.matches(':focus-visible')).toBe(true);
    await expect(focusable).not.toHaveAttribute('href');
    await userEvent.keyboard('{Enter} ');
    await userEvent.hover(focusable);
    await expect(focusable.matches(':hover')).toBe(true);
    await expect(getComputedStyle(focusable).textDecorationLine).toBe('underline');
    await expect(getComputedStyle(focusable).textDecorationStyle).toBe('double');
    await userEvent.click(focusable);
    await expect(args.onClick).not.toHaveBeenCalled();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Next action' })).toHaveFocus();
  },
};

export const NativeNavigation: AnchorStory = {
  args: {
    children: 'Jump to documentation',
    onClick: fn(),
  },
  render: (args) => (
    <div className={styles.playground}>
      <Link {...args} href="#headless-link-story-destination" target="_self" />
      <p id="headless-link-story-destination">Documentation destination</p>
    </div>
  ),
  play: async ({ args, canvas }) => {
    const originalUrl = window.location.href;
    try {
      await userEvent.click(canvas.getByRole('link', { name: 'Jump to documentation' }));
      await waitFor(async () => {
        await expect(window.location.hash).toBe('#headless-link-story-destination');
      });
      await expect(args.onClick).toHaveBeenCalledTimes(1);
      await expect(canvas.getByText('Documentation destination')).toBeVisible();
    } finally {
      window.history.replaceState(window.history.state, '', originalUrl);
    }
  },
};
