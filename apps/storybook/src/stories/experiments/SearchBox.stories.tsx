// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { CoreAIFluentProvider, useFluent } from '@coreai-ds/react-components';
import { SearchBox, type SearchBoxProps } from '@coreai-ds/react-headless-components';
import {
  SearchBoxComparison,
  searchBoxAppearances,
  searchBoxConsumerExample,
  type SearchBoxExample,
} from './SearchBoxComparison.js';
import {
  captureSearchBoxStyles,
  compareSearchBoxStyles,
  getComparisonSearchBox,
  settleSearchBoxStyles,
  type SearchBoxStyleDifference,
} from './compareSearchBoxStyles.js';
import styles from './SearchBoxComparison.module.css';

function ComparisonWithReport({ examples }: { examples?: readonly SearchBoxExample[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (SearchBoxStyleDifference & { example: string })[] | null
  >(null);
  const [comparing, setComparing] = React.useState(false);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('SearchBox comparison has not mounted');
    setComparing(true);
    try {
      const rows = [...container.querySelectorAll<HTMLElement>('[data-searchbox-case]')];
      if (!rows.length) throw new Error('SearchBox comparison has no examples');
      const results = [];
      for (const row of rows) {
        const legacy = getComparisonSearchBox(row, 'legacy');
        const headless = getComparisonSearchBox(row, 'headless');
        await Promise.all([settleSearchBoxStyles(legacy), settleSearchBoxStyles(headless)]);
        results.push(
          ...compareSearchBoxStyles(
            captureSearchBoxStyles(legacy),
            captureSearchBoxStyles(headless),
          ).map((difference) => ({ example: row.dataset.searchboxCase ?? '', ...difference })),
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
        Both implementations share fixtures, theme, and defaults. Selected root, native input,
        content, dismiss, glyph, and focus-pseudo styles are compared at rest. Only captured
        rectangle width/height permits at most 0.5 CSS px of allocation noise; CSS values stay
        exact. SearchBox reuses the completed Input CSS foundation, not its styled component or copy
        action.
      </p>
      <button type="button" onClick={compare} disabled={comparing}>
        Compare resting styles
      </button>
      <output className={styles.report} aria-live="polite">
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
        <SearchBoxComparison examples={examples} />
      </div>
    </div>
  );
}

function DefaultsOptOutComparison() {
  const { dir } = useFluent();
  return (
    <CoreAIFluentProvider withComponentDefaults={false} theme={{}} dir={dir}>
      <p>
        Opting out restores outline. With defaults enabled, omitting appearance selects
        filled-darker; explicitly undefined clears the CoreAI default. SearchBox retains medium size
        inside a differently sized Field unless its own size is explicit.
      </p>
      <ComparisonWithReport
        examples={[
          { name: 'Omitted appearance', props: {} },
          { name: 'Explicitly undefined appearance', props: { appearance: undefined } },
          { name: 'Explicit filled-darker', props: { appearance: 'filled-darker' } },
        ]}
      />
    </CoreAIFluentProvider>
  );
}

function QueryFlow(props: SearchBoxProps) {
  const [value, setValue] = React.useState('');
  const [changes, setChanges] = React.useState(0);
  const [submissions, setSubmissions] = React.useState<string[]>([]);
  const id = React.useId();
  return (
    <form
      className={styles.playground}
      role="search"
      aria-label="Project search"
      onSubmit={(event) => {
        event.preventDefault();
        const query = String(new FormData(event.currentTarget).get('query') ?? '');
        setSubmissions((previous) => [...previous, query]);
      }}
    >
      <label htmlFor={id}>Project query</label>
      <SearchBox
        {...props}
        id={id}
        name="query"
        value={value}
        dismiss={{ 'aria-label': 'Clear project query' }}
        onChange={(event, data) => {
          props.onChange?.(event, data);
          setValue(data.value);
          setChanges((count) => count + 1);
        }}
      />
      <div>
        <button type="submit">Search projects</button>{' '}
        <button type="button" onClick={() => setValue('orion')}>
          Use saved query
        </button>
      </div>
      <output aria-live="polite">
        Query: {value || '(empty)'}. Changes: {changes}. Submissions: {submissions.length}.
        Submitted:{' '}
        {submissions.length ? submissions[submissions.length - 1] || '(empty)' : '(not submitted)'}
      </output>
    </form>
  );
}

function NativeFormBoundary(props: SearchBoxProps) {
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  const id = React.useId();
  return (
    <form
      className={styles.playground}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get('query') ?? ''));
      }}
    >
      <p>
        The public hook controls the native input internally. Native form reset therefore keeps its
        latest value and emits no change callback; use controlled application state to reset a query
        to an earlier value.
      </p>
      <label htmlFor={id}>Native query</label>
      <SearchBox {...props} id={id} name="query" defaultValue="atlas" />
      <div>
        <button type="submit">Submit query</button> <button type="reset">Reset native form</button>
      </div>
      <output aria-live="polite">
        Submitted: {submitted === null ? '(not submitted)' : submitted || '(empty)'}
      </output>
    </form>
  );
}

const meta = {
  title: 'Experiments/Headless SearchBox',
  component: SearchBox,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment using the installed public headless SearchBox hook/render contract, Input CSS composition, style-free search/dismiss glyphs, native search and form behavior, and CoreAI appearance defaults. Production SearchBox is unchanged. Current slots own clearing and focus; no overlay, focusgroup, or Tabster attributes are added.',
      },
    },
  },
  argTypes: {
    appearance: { control: 'select', options: searchBoxAppearances },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    'aria-invalid': { control: 'boolean' },
  },
} satisfies Meta<typeof SearchBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(
      async () => {
        await expect(canvas.getByRole('status')).toHaveTextContent(
          'No differences in the selected properties.',
        );
      },
      { timeout: 10000 },
    );
  },
};

export const DefaultsOptOut: Story = {
  render: () => <DefaultsOptOutComparison />,
  play: Comparison.play,
};

export const RTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <ComparisonWithReport
        examples={[
          { name: 'Small RTL', props: { size: 'small', defaultValue: 'Atlas' } },
          {
            name: 'Large RTL with suffix',
            props: { size: 'large', appearance: 'underline', contentAfter: 'Filter' },
          },
        ]}
      />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const ConsumerOverrides: Story = {
  render: () => (
    <>
      <p>
        Ordinary, unlayered consumer CSS wins over the new component, including focused slot
        padding. Legacy Griffel may retain defaults; the report exposes this intentional cascade
        difference.
      </p>
      <ComparisonWithReport examples={[searchBoxConsumerExample]} />
    </>
  ),
};

export const QueryDismissAndSubmit: Story = {
  args: { appearance: 'filled-darker', size: 'medium', onChange: fn() },
  render: (args) => <QueryFlow {...args} />,
  play: async ({ canvas, args }) => {
    const query = canvas.getByRole('searchbox', { name: 'Project query' });
    await userEvent.type(query, 'atlas');
    await expect(args.onChange).toHaveBeenCalledTimes(5);
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.anything(), { value: 'atlas' });
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('status')).toHaveTextContent('Submissions: 1. Submitted: atlas');
    await userEvent.click(canvas.getByRole('button', { name: 'Use saved query' }));
    await expect(query).toHaveValue('orion');
    await expect(args.onChange).toHaveBeenCalledTimes(5);
    await userEvent.click(query);
    await userEvent.click(canvas.getByRole('button', { name: 'Clear project query' }));
    await expect(query).toHaveValue('');
    await expect(query).toHaveFocus();
    await expect(args.onChange).toHaveBeenCalledTimes(6);
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.anything(), { value: '' });
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Submissions: 2. Submitted: (empty)',
    );
  },
};

export const NativeFormResetBoundary: Story = {
  args: { onChange: fn() },
  render: (args) => <NativeFormBoundary {...args} />,
  play: async ({ canvas, args }) => {
    const query = canvas.getByRole('searchbox', { name: 'Native query' });
    await userEvent.clear(query);
    await userEvent.type(query, 'orion');
    await expect(args.onChange).toHaveBeenCalledTimes(6);
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.anything(), { value: 'orion' });
    await userEvent.click(canvas.getByRole('button', { name: 'Reset native form' }));
    await expect(query).toHaveValue('orion');
    await expect(args.onChange).toHaveBeenCalledTimes(6);
    await userEvent.click(canvas.getByRole('button', { name: 'Submit query' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Submitted: orion');
  },
};
