// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Avatar } from '@coreai-ds/react-headless-components';
import {
  AvatarComparison,
  AvatarIdentityPlayground,
  AvatarImageFallbackFlow,
  avatarActiveAppearances,
  avatarConsumerExample,
  avatarExamples,
  avatarNamedColors,
  avatarShapes,
  avatarSizes,
  type AvatarExample,
} from './AvatarComparison.js';
import {
  captureAvatarStyles,
  compareAvatarStyles,
  getComparisonAvatar,
  settleAvatarStyles,
  type AvatarStyleDifference,
} from './compareAvatarStyles.js';
import styles from './AvatarComparison.module.css';

function ComparisonWithReport({
  examples = avatarExamples,
  consumerOverrides = false,
}: {
  examples?: readonly AvatarExample[];
  consumerOverrides?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [results, setResults] = React.useState<
    (AvatarStyleDifference & { example: string; intentional: boolean })[] | null
  >(null);
  const [comparing, setComparing] = React.useState(false);
  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Avatar comparison has not mounted');
    setComparing(true);
    try {
      const pairs = [...container.querySelectorAll<HTMLElement>('[data-avatar-case]')].map(
        (row) => {
          const example = examples.find((value) => value.name === row.dataset.avatarCase);
          if (!example) throw new Error('Unknown Avatar comparison fixture');
          return {
            example,
            legacy: getComparisonAvatar(row, 'legacy'),
            headless: getComparisonAvatar(row, 'headless'),
          };
        },
      );
      if (!pairs.length) throw new Error('Avatar comparison has no fixtures');
      await Promise.all(
        pairs.flatMap(({ legacy, headless }) => [
          settleAvatarStyles(legacy),
          settleAvatarStyles(headless),
        ]),
      );
      setResults(
        pairs.flatMap(({ example, legacy, headless }) => {
          const differences = compareAvatarStyles(
            captureAvatarStyles(legacy),
            captureAvatarStyles(headless),
          );
          return differences.map((difference) => ({
            ...difference,
            example: example.name,
            intentional:
              !consumerOverrides &&
              Boolean(
                example.intentionalDifferences?.some(
                  (expected) =>
                    expected.property === difference.property &&
                    expected.legacy === difference.legacy &&
                    expected.headless === difference.headless,
                ),
              ),
          }));
        }),
      );
    } finally {
      setComparing(false);
    }
  };
  const unexpected = results?.filter((difference) => !difference.intentional);
  const intentional = results?.filter((difference) => difference.intentional);
  return (
    <div>
      <p>
        Shared fixtures compare selected root, image, initials, icon, badge, glyph, and ring/shadow
        pseudo-element styles and dimensions. Image loading uses deterministic inline SVGs. Finite
        transitions settle; infinite consumer animations are not awaited. CSS strings, offsets, and
        captured dimensions are exact. A hidden image with no rendered box reports its meaningless
        document-origin-relative offsets as “not-rendered”; presence, hidden/display/visibility
        state, and zero dimensions remain checked. Rendered image offsets are never normalized.
      </p>
      <p>
        The public current hook owns initials, fallback priority, image events, refs, and accessible
        names. At size 16 it retains both generated initials, unlike styled v9’s first-initial-only
        visual wrapper. That exact difference is reported separately, not silently normalized.
        PresenceBadge is the completed headless component, composed through the public slot render
        contract. Its current out-of-office accessible label is “available out of office”; styled v9
        omits that suffix and says “available”. This precise label difference is also reported, and
        the Avatar’s automatic accessible name includes the current full status. The native Avatar
        image does not delegate to Image.
      </p>
      {consumerOverrides && (
        <p>
          Intentional consumer-priority demonstration: unlayered CSS overrides the new component’s
          dimensions, radius, initials colors, border, and badge placement. Any legacy differences
          remain visible in this report.
        </p>
      )}
      <button type="button" disabled={comparing} onClick={compare}>
        Compare resting styles
      </button>
      <output className={styles.report} aria-label="Computed style comparison" aria-live="polite">
        {unexpected === undefined
          ? 'Comparison not run.'
          : unexpected.length
            ? JSON.stringify(unexpected, null, 2)
            : 'No unexpected differences in the selected properties.'}
      </output>
      {Boolean(intentional?.length) && (
        <output className={styles.report} aria-label="Intentional current-API differences">
          {JSON.stringify(intentional, null, 2)}
        </output>
      )}
      <div ref={containerRef}>
        <AvatarComparison examples={examples} />
      </div>
    </div>
  );
}

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless Avatar',
  component: Avatar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment: public useAvatar/renderAvatar/useAvatarContext from headless preview 0.3.2, react-avatar 9.11.9 CSS, and PersonRegular from icons 2.0.343’s public headless SVG entry. All current sizes, shapes, palette/name-color hashing, activity decoration, slots, refs, image fallback, and accessibility are preserved. CoreAI neutral and neutral-alt affect only initials/icon backgrounds and remain active with component defaults disabled. Public slot metadata is retained while a typed render adapter reuses the completed PresenceBadge. Name-to-initials behavior stays in the current hook, including both initials at size 16. The current PresenceBadge includes “out of office” in its accessible label; styled v9 strips that prop before its base hook and omits the suffix. This intentional accessibility difference is reported explicitly, not normalized. Caller CSS replaces legacy customStyleHooks; mixed legacy/headless compound contexts are not bridged. Avatar has no overlay, focusgroup, or component-specific JavaScript polyfill requirement. CSS masking and native direction selectors supply the badge cutout and RTL positioning; source reduced-motion treatment is retained. Production exports are unchanged.',
      },
    },
  },
  argTypes: {
    name: { control: 'text' },
    size: { control: 'select', options: avatarSizes },
    shape: { control: 'select', options: avatarShapes },
    color: {
      control: 'select',
      options: ['neutral', 'neutral-alt', 'brand', 'colorful', ...avatarNamedColors],
    },
    active: { control: 'select', options: ['unset', 'active', 'inactive'] },
    activeAppearance: { control: 'select', options: avatarActiveAppearances },
    idForColor: { control: 'text' },
    image: { control: false },
    initials: { control: false },
    icon: { control: false },
    badge: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(
      () =>
        expect(canvas.getByRole('status', { name: 'Computed style comparison' })).toHaveTextContent(
          'No unexpected differences in the selected properties.',
        ),
      { timeout: 10000 },
    );
    await expect(canvas.getByLabelText('Intentional current-API differences')).toHaveTextContent(
      '"initials.text"',
    );
    await expect(canvas.getByLabelText('Intentional current-API differences')).toHaveTextContent(
      '"badge.aria-label"',
    );
    await expect(canvas.getByLabelText('Intentional current-API differences')).toHaveTextContent(
      'available out of office',
    );
  },
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[avatarConsumerExample]} consumerOverrides />,
  play: async ({ canvas, canvasElement }) => {
    const headless = getComparisonAvatar(canvasElement, 'headless');
    await settleAvatarStyles(headless);
    const values = captureAvatarStyles(headless);
    await expect(values['root.width']).toBe('52.00');
    await expect(values['root.height']).toBe('52.00');
    await expect(values['root.border-radius']).toBe('3px');
    await expect(values['initials.background-color']).toBe('rgb(245, 230, 215)');
    await expect(values['initials.color']).toBe('rgb(35, 95, 155)');
    await expect(values['initials.border-top-width']).toBe('2px');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(() =>
      expect(
        canvas.getByRole('status', { name: 'Computed style comparison' }),
      ).not.toHaveTextContent('Comparison not run.'),
    );
  },
};

export const ImageFallbackFlow: Story = {
  args: { size: 64 },
  render: (args) => <AvatarImageFallbackFlow {...args} />,
  play: async ({ canvas, canvasElement }) => {
    const image = () => canvasElement.querySelector<HTMLImageElement>('.fui-Avatar__image');
    const icon = () => canvasElement.querySelector('.fui-Avatar__icon');
    await expect(canvas.getByRole('img', { name: 'Ada Lovelace' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Load photo' }));
    await waitFor(() =>
      expect(canvas.getByRole('status', { name: 'Image events' })).toHaveTextContent(
        'Loads: 1; errors: 0',
      ),
    );
    await expect(image()?.naturalWidth).toBe(80);
    await expect(image()?.hidden).toBe(false);
    await userEvent.click(canvas.getByRole('button', { name: 'Break photo' }));
    await waitFor(() => expect(image()?.hidden).toBe(true));
    await expect(canvasElement.querySelector('.fui-Avatar__initials')).toHaveTextContent('AL');
    await userEvent.click(canvas.getByRole('button', { name: 'Use guest identity' }));
    await expect(canvas.getByRole('img', { name: 'Guest avatar' })).toBeVisible();
    await expect(icon()).not.toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Load photo' }));
    await waitFor(() => expect(image()?.hidden).toBe(false));
    await expect(icon()).toBeNull();
    await expect(canvas.getByRole('status', { name: 'Image events' })).toHaveTextContent(
      'Loads: 2; errors: 1',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Remove photo' }));
    await expect(image()).toBeNull();
    await expect(icon()).not.toBeNull();
  },
};

export const IdentityFlow: Story = {
  args: { size: 56, color: 'colorful', badge: { status: 'available' } },
  render: (args) => <AvatarIdentityPlayground {...args} />,
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('textbox', { name: 'Display name' });
    await userEvent.clear(input);
    await userEvent.type(input, 'Grace Hopper');
    await expect(canvasElement.querySelector('.fui-Avatar')).toHaveAttribute('data-color', 'beige');
    await expect(canvasElement.querySelector('.fui-Avatar__initials')).toHaveTextContent('GH');
    await userEvent.click(canvas.getByRole('button', { name: 'Speaking' }));
    await expect(canvasElement.querySelector('.fui-Avatar')).toHaveAttribute(
      'data-active',
      'active',
    );
    await expect(canvas.getByText('Grace Hopper is speaking')).toBeVisible();
  },
};

export const Playground: Story = {
  args: {
    name: 'Ada Lovelace',
    size: 48,
    shape: 'circular',
    color: 'neutral-alt',
    active: 'unset',
    activeAppearance: 'ring',
    badge: { status: 'available' },
  },
};
