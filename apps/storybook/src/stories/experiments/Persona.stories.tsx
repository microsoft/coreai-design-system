// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Persona } from '@coreai-ds/react-headless-components';
import {
  PersonaComparison,
  PersonaProfileFlow,
  personaConsumerExample,
  personaExamples,
  personaSizes,
  personaTextAlignments,
  personaTextPositions,
  type PersonaExample,
} from './PersonaComparison.js';
import {
  capturePersonaStyles,
  comparePersonaStyles,
  getComparisonPersona,
  settlePersonaStyles,
  type PersonaStyleDifference,
} from './comparePersonaStyles.js';
import styles from './PersonaComparison.module.css';

function ComparisonWithReport({
  examples = personaExamples,
  consumerOverrides = false,
}: {
  examples?: readonly PersonaExample[];
  consumerOverrides?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [results, setResults] = React.useState<
    (PersonaStyleDifference & { example: string; intentional: boolean })[] | null
  >(null);
  const [comparing, setComparing] = React.useState(false);
  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Persona comparison has not mounted');
    setComparing(true);
    try {
      const pairs = [...container.querySelectorAll<HTMLElement>('[data-persona-case]')].map(
        (row) => {
          const example = examples.find((value) => value.name === row.dataset.personaCase);
          if (!example) throw new Error('Unknown Persona comparison fixture');
          return {
            example,
            legacy: getComparisonPersona(row, 'legacy'),
            headless: getComparisonPersona(row, 'headless'),
          };
        },
      );
      if (!pairs.length) throw new Error('Persona comparison has no fixtures');
      await Promise.all(
        pairs.flatMap(({ legacy, headless }) => [
          settlePersonaStyles(legacy),
          settlePersonaStyles(headless),
        ]),
      );
      setResults(
        pairs.flatMap(({ example, legacy, headless }) =>
          comparePersonaStyles(capturePersonaStyles(legacy), capturePersonaStyles(headless)).map(
            (difference) => ({
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
            }),
          ),
        ),
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
        The same fixtures compare bounded root grid layout, Avatar and PresenceBadge composition,
        all four native text slots, colors, typography, wrapping, ellipsis, dimensions, and relative
        offsets. Every captured CSS string, missing slot, and rectangle is compared exactly.
        Deterministic inline images and finite Avatar transitions settle before capture.
      </p>
      <p>
        The current public Persona hook owns name-to-text resolution, slots, refs, and text
        position. Completed Avatar and PresenceBadge primitives own initials, image fallback,
        identity, status, and accessibility. Persona supplies visual size mappings and text
        alignment without copying those behaviors. Its real legacy composition uses Fluent Avatar,
        not CoreAI’s standalone Avatar wrapper, so the reused neutral foundation is scoped back to
        colorNeutralBackground6. Persona has no CoreAI-specific defaults or style override.
      </p>
      <p>
        Exact intentional differences remain visible: a caller-sized 16px Avatar retains both
        current initials rather than the legacy single initial, and current out-of-office presence
        labels include “out of office”. The Avatar’s accessible name includes the full current
        status. No legacy compatibility logic or standalone Text component is added.
      </p>
      {consumerOverrides && (
        <p>
          Consumer-priority demonstration: ordinary unlayered classes override the new root grid,
          avatar radius and spacing, and native text colors and typography. Legacy Griffel may
          retain its own values; the report deliberately shows those differences.
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
        <PersonaComparison examples={examples} />
      </div>
    </div>
  );
}

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless Persona',
  component: Persona,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment: public usePersona/renderPersona from headless preview 0.3.2 and CSS from react-persona 9.7.11. All current sizes, text positions/alignment, presence-only composition, four text slots, native wrapping/ellipsis, classes, refs, and render functions are retained. Completed Avatar and PresenceBadge foundations are composed with typed public slot render functions that preserve primitive element metadata; Persona never implements initials, fallback, status, or accessible-name logic. Native spans port the exact body1/caption1/subtitle2 visual typography; no styled Text preset or legacy runtime is imported. Persona itself has no CoreAI wrapper/defaults/custom style hook. A scoped composition correction keeps its neutral Avatar at the actual Fluent background6 rather than standalone CoreAI Avatar background4. Current out-of-office labels and 16px initials intentionally differ from legacy and are explicitly asserted. Ordinary consumer CSS takes priority. Persona requires no overlay, focusgroup, or component-specific JavaScript polyfill; Avatar’s native image handling, CSS masking/RTL and reduced-motion behavior remain in the reused foundation. Production exports are unchanged.',
      },
    },
  },
  argTypes: {
    name: { control: 'text' },
    size: { control: 'select', options: personaSizes },
    textPosition: { control: 'select', options: personaTextPositions },
    textAlignment: { control: 'select', options: personaTextAlignments },
    presenceOnly: { control: 'boolean' },
    avatar: { control: false },
    presence: { control: false },
    primaryText: { control: false },
    secondaryText: { control: false },
    tertiaryText: { control: false },
    quaternaryText: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Persona>;

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
    const intentional = canvas.getByRole('status', {
      name: 'Intentional current-API differences',
    });
    await expect(intentional).toHaveTextContent('available out of office');
    await expect(intentional).toHaveTextContent('avatar.initials.text');
  },
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[personaConsumerExample]} consumerOverrides />,
  play: async ({ canvas, canvasElement }) => {
    const { root, avatar, primaryText, secondaryText } = getComparisonPersona(
      canvasElement,
      'headless',
    );
    if (!avatar || !primaryText || !secondaryText)
      throw new Error('Missing Persona consumer fixture slots');
    await expect(getComputedStyle(root).display).toBe('grid');
    await expect(getComputedStyle(avatar).borderRadius).toBe('3px');
    await expect(getComputedStyle(avatar).marginInlineEnd).toBe('14px');
    await expect(getComputedStyle(primaryText).fontSize).toBe('18px');
    await expect(getComputedStyle(primaryText).color).toBe('rgb(35, 95, 155)');
    await expect(getComputedStyle(secondaryText).marginBlockStart).toBe('2px');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(() =>
      expect(
        canvas.getByRole('status', { name: 'Computed style comparison' }),
      ).not.toHaveTextContent('Comparison not run.'),
    );
  },
};

export const IdentityPresenceAndContentFlow: Story = {
  args: { name: 'Ada Lovelace' },
  render: (args) => <PersonaProfileFlow {...args} />,
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('img', { name: 'Ada Lovelace available' })).toBeVisible();
    const name = canvas.getByRole('textbox', { name: 'Display name' });
    await userEvent.clear(name);
    await userEvent.type(name, 'Grace Hopper');
    await waitFor(() =>
      expect(canvas.getByRole('img', { name: 'Grace Hopper available' })).toBeVisible(),
    );
    await userEvent.selectOptions(canvas.getByRole('combobox', { name: 'Availability' }), 'busy');
    await expect(canvas.getByRole('img', { name: 'Grace Hopper busy' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Show more details' }));
    await expect(canvas.getByText('Design systems')).toBeVisible();
    await expect(canvas.getByText('Seattle · UTC−8')).toBeVisible();
    await expect(canvas.getByRole('status', { name: 'Profile changes' })).toHaveTextContent(
      'Grace Hopper · busy · 4 lines',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Show presence only' }));
    await expect(canvas.getByRole('img', { name: 'busy' })).toBeVisible();
    await expect(canvas.queryByRole('img', { name: 'Grace Hopper busy' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Show presence only' }));
    await expect(canvas.getByRole('img', { name: 'Grace Hopper busy' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Load photo' }));
    await waitFor(() =>
      expect(canvas.getByRole('status', { name: 'Image events' })).toHaveTextContent(
        'Loads: 1; errors: 0',
      ),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Break photo' }));
    await waitFor(() =>
      expect(canvas.getByRole('status', { name: 'Image events' })).toHaveTextContent(
        'Loads: 1; errors: 1',
      ),
    );
    const failedImage = canvasElement.querySelector('.fui-Avatar__image');
    if (!(failedImage instanceof HTMLImageElement)) throw new Error('Missing failed profile image');
    await expect(failedImage.hidden).toBe(true);
    await expect(canvasElement.querySelector('.fui-Avatar__initials')).toHaveTextContent('GH');
    await userEvent.click(canvas.getByRole('button', { name: 'Remove photo' }));
    await expect(canvasElement.querySelector('.fui-Avatar__image')).toBeNull();
    await userEvent.clear(name);
    await expect(canvas.getByRole('img', { name: 'Guest avatar' })).toBeVisible();
    await expect(canvasElement.querySelector('.fui-Avatar__icon svg')).not.toBeNull();
  },
};

export const Playground: Story = {
  args: {
    name: 'Ada Lovelace',
    secondaryText: 'Product designer',
    presence: { status: 'available' },
    size: 'medium',
    textPosition: 'after',
    textAlignment: 'start',
  },
};
