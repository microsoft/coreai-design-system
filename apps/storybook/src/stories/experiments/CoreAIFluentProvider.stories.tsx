// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { CoreAIFluentProvider } from '@coreai-ds/react-headless-components';
import {
  CoreAIFluentProviderComparison,
  captureProviderStyles,
  providerThemes,
} from './CoreAIFluentProviderComparison.js';

function Comparison(): React.ReactElement {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<string[] | null>(null);
  const compare = () => {
    const root = rootRef.current;
    if (!root) throw new Error('Provider comparison has not mounted');
    const results: string[] = [];
    for (const row of root.querySelectorAll<HTMLElement>('[data-provider-case]')) {
      const legacy = row.querySelector<HTMLElement>('[data-provider-implementation="legacy"]');
      const headless = row.querySelector<HTMLElement>('[data-provider-implementation="headless"]');
      if (!legacy || !headless) throw new Error('Missing provider comparison pair');
      const expected = captureProviderStyles(legacy);
      const actual = captureProviderStyles(headless);
      for (const property of Object.keys(expected)) {
        if (expected[property] !== actual[property]) {
          results.push(
            `${row.dataset.providerCase}: ${property}: ${expected[property]} / ${actual[property]}`,
          );
        }
      }
    }
    setDifferences(results);
  };
  return (
    <div ref={rootRef}>
      <p>
        Separate old and new providers compare inherited typography, theme variables, responsive
        tracking, direction, and scrollbars. The new provider uses CSS Modules and native inline
        theme variables, not the old provider or its style hooks.
      </p>
      <button type="button" onClick={compare}>
        Compare provider styles
      </button>
      <output aria-label="Provider style comparison">
        {differences === null
          ? 'Comparison not run.'
          : differences.length
            ? differences.join('\n')
            : 'No differences in the selected properties.'}
      </output>
      {Object.entries(providerThemes).map(([name, theme]) => (
        <section key={name} data-provider-case={name}>
          <h3>{name}</h3>
          <CoreAIFluentProviderComparison theme={theme} />
        </section>
      ))}
    </div>
  );
}

const meta = {
  title: 'Experiments/Headless Provider',
  component: CoreAIFluentProvider,
  parameters: { throwPlayFunctionExceptions: true },
} satisfies Meta<typeof CoreAIFluentProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProviderComparison: Story = {
  render: () => <Comparison />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare provider styles' }));
    await waitFor(() =>
      expect(canvas.getByRole('status', { name: 'Provider style comparison' })).toHaveTextContent(
        'No differences in the selected properties.',
      ),
    );
  },
};
