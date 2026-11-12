// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { Switch, type SwitchProps } from '@coreai-ds/react-headless-components';
import {
  SwitchComparison,
  switchConsumerExample,
  switchLabelPositions,
  switchSizes,
  type SwitchExample,
} from './SwitchComparison.js';
import {
  captureSwitchStyles,
  compareSwitchStyles,
  getComparisonSwitch,
  settleSwitchStyles,
  type SwitchStyleDifference,
} from './compareSwitchStyles.js';
import styles from './SwitchComparison.module.css';

function ComparisonWithReport({
  examples,
  consumerOverrides = false,
}: {
  examples?: readonly SwitchExample[];
  consumerOverrides?: boolean;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (SwitchStyleDifference & { example: string })[] | null
  >(null);
  const [comparing, setComparing] = React.useState(false);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Switch comparison has not mounted');
    setComparing(true);
    try {
      const rows = [...container.querySelectorAll<HTMLElement>('[data-switch-case]')];
      if (!rows.length) throw new Error('Switch comparison has no examples');
      const results: (SwitchStyleDifference & { example: string })[] = [];
      for (const row of rows) {
        const legacy = getComparisonSwitch(row, 'legacy');
        const headless = getComparisonSwitch(row, 'headless');
        await Promise.all([settleSwitchStyles(legacy), settleSwitchStyles(headless)]);
        results.push(
          ...compareSwitchStyles(captureSwitchStyles(legacy), captureSwitchStyles(headless)).map(
            (difference) => ({ example: row.dataset.switchCase ?? '', ...difference }),
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
        Both columns share the active provider, theme, and fixtures, with distinct native input ids.
        Click a label or press Space to toggle. Hover or Tab to inspect interaction styles. CoreAI
        adds no Switch defaults or style overrides.
      </p>
      <p>
        The report compares selected input, track, thumb, label, required-indicator, and focus-ring
        styles and dimensions at rest. It settles track and thumb transitions. It is not a pixel
        comparison. The thumb uses the same CircleFilled glyph through the Griffel-free icon API;
        the label reuses the local Label component.
      </p>
      {consumerOverrides && (
        <p>
          Intentional difference: ordinary consumer CSS overrides the new layered root and slot
          styles. Legacy Griffel can retain its checked colors or size rules. The report shows these
          differences instead of excluding them.
        </p>
      )}
      <button type="button" onClick={compare} disabled={comparing}>
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
        <SwitchComparison examples={examples} />
      </div>
    </div>
  );
}

function SwitchPlayground(props: SwitchProps) {
  const id = React.useId();
  const [checked, setChecked] = React.useState(props.defaultChecked ?? false);
  const [lastChange, setLastChange] = React.useState('No changes yet.');
  const [submitted, setSubmitted] = React.useState<string | null>(null);
  return (
    <form
      className={styles.playground}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get('notifications') ?? '(omitted)'));
      }}
    >
      <p>
        This setting changes immediately. The form-data action demonstrates the native name/value
        and required behavior; it does not apply the setting.
      </p>
      <Switch
        {...props}
        id={id}
        name="notifications"
        value="enabled"
        checked={checked}
        onChange={(event, data) => {
          props.onChange?.(event, data);
          setChecked(data.checked);
          setLastChange(`onChange.checked: ${data.checked}.`);
        }}
      />
      <button type="submit">Inspect form data</button>
      <output aria-live="polite">
        Notifications {checked ? 'on' : 'off'}. {lastChange}{' '}
        {submitted === null ? 'No form inspection yet.' : `Form value: ${submitted}.`}
      </output>
    </form>
  );
}

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless Switch',
  component: Switch,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment: public Fluent headless useSwitch/renderSwitch behavior with CSS Modules from react-switch 9.7.7. Local Label supplies the shared visual foundation. The style-only thumb uses the pinned headless CircleFilled SVG icon. Native checkbox state, switch role, form behavior, label association, and disabledFocusable are retained. Native :focus-visible replaces legacy focus selectors. No overlay, focusgroup, or component-specific polyfill is needed. Use consumer CSS or slot styles instead of legacy customStyleHooks. Production Switch is unchanged.',
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: switchSizes },
    labelPosition: { control: 'select', options: switchLabelPositions },
    label: { control: 'text' },
    checked: { control: false },
    defaultChecked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    disabledFocusable: { control: 'boolean' },
    required: { control: 'boolean' },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(() =>
      expect(canvas.getByRole('status', { name: 'Computed style comparison' })).toHaveTextContent(
        'No differences in the selected properties.',
      ),
    );
  },
};

export const ConsumerOverrides: Story = {
  render: () => <ComparisonWithReport examples={[switchConsumerExample]} consumerOverrides />,
  play: async ({ canvas, canvasElement }) => {
    const headless = getComparisonSwitch(canvasElement, 'headless');
    await settleSwitchStyles(headless);
    const values = captureSwitchStyles(headless);
    await expect(values['input.width']).toBe('68.00');
    await expect(values['indicator.width']).toBe('52.00');
    await expect(values['indicator.height']).toBe('24.00');
    await expect(values['indicator.border-radius']).toBe('3px');
    await expect(values['indicator.background-color']).toBe('rgb(20, 80, 120)');
    await expect(values['label.font-size']).toBe('18px');
    await expect(values['required.padding-left']).toBe('10px');
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(() =>
      expect(
        canvas.getByRole('status', { name: 'Computed style comparison' }),
      ).not.toHaveTextContent('Comparison not run.'),
    );
  },
};

export const Playground: Story = {
  args: {
    label: 'Email notifications',
    size: 'medium',
    labelPosition: 'after',
    required: true,
    defaultChecked: false,
    onChange: fn(),
  },
  render: (args) => <SwitchPlayground {...args} />,
  play: async ({ args, canvas }) => {
    const input = canvas.getByRole('switch', { name: 'Email notifications' });
    const label = canvas.getByText('Email notifications', { selector: 'label' });
    await expect(input).not.toBeChecked();
    await userEvent.click(label);
    await expect(input).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledTimes(1);
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.anything(), { checked: true });
    await userEvent.click(canvas.getByRole('button', { name: 'Inspect form data' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Form value: enabled.');
    await userEvent.tab({ shift: true });
    await expect(input).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(input).not.toBeChecked();
    await expect(args.onChange).toHaveBeenCalledTimes(2);
    await expect(args.onChange).toHaveBeenLastCalledWith(expect.anything(), { checked: false });
    await expect(canvas.getByRole('status')).toHaveTextContent('onChange.checked: false.');
  },
};
