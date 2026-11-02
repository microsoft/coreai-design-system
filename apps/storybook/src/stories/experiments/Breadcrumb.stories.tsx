// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import {
  CoreAIFluentProvider,
  Breadcrumb as LegacyBreadcrumb,
  BreadcrumbDivider as LegacyBreadcrumbDivider,
  BreadcrumbItem as LegacyBreadcrumbItem,
} from '@coreai-ds/react-components';
import {
  Breadcrumb,
  BreadcrumbButton,
  BreadcrumbDivider,
  BreadcrumbItem,
  Link,
} from '@coreai-ds/react-headless-components';
import {
  BreadcrumbCalendarIcon,
  BreadcrumbCollapsedAncestors,
  BreadcrumbComparison,
  BreadcrumbNavigationFlow,
  breadcrumbConsumerExample,
  breadcrumbSizes,
  type BreadcrumbExample,
} from './BreadcrumbComparison.js';
import {
  captureBreadcrumbStyles,
  compareBreadcrumbStyles,
  getComparisonBreadcrumb,
  settleBreadcrumbStyles,
  type BreadcrumbStyleDifference,
} from './compareBreadcrumbStyles.js';
import styles from './BreadcrumbComparison.module.css';

function ComparisonWithReport({ examples }: { examples?: readonly BreadcrumbExample[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (BreadcrumbStyleDifference & { example: string })[] | null
  >(null);
  const [comparing, setComparing] = React.useState(false);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Breadcrumb comparison has not mounted');
    setComparing(true);
    try {
      const rows = [...container.querySelectorAll<HTMLElement>('[data-breadcrumb-case]')];
      if (!rows.length) throw new Error('Breadcrumb comparison has no examples');
      const results = [];
      for (const row of rows) {
        const legacy = getComparisonBreadcrumb(row, 'legacy');
        const headless = getComparisonBreadcrumb(row, 'headless');
        await Promise.all([settleBreadcrumbStyles(legacy), settleBreadcrumbStyles(headless)]);
        results.push(
          ...compareBreadcrumbStyles(
            captureBreadcrumbStyles(legacy),
            captureBreadcrumbStyles(headless),
          ).map((difference) => ({ example: row.dataset.breadcrumbCase ?? '', ...difference })),
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
        Shared fixtures compare selected nav, list, item, button, icon, and divider styles and
        dimensions at rest. Values are exact; no properties are suppressed. BreadcrumbButton
        composes the completed Button CSS foundation, not its CoreAI defaults. Set visual size on
        Breadcrumb: the visual reference ignores child size props. Only the leading icon position is
        public in the pinned BreadcrumbButton API.
      </p>
      <button type="button" onClick={compare} disabled={comparing}>
        Compare resting styles
      </button>
      <output className={styles.report} aria-label="Breadcrumb style report" aria-live="polite">
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
        <BreadcrumbComparison examples={examples} />
      </div>
    </div>
  );
}

function CustomContent() {
  return (
    <div className={styles.flow}>
      <p>
        Intentional current-API difference: headless dividers preserve supplied children, including
        null. The legacy styled divider replaces ordinary children with a chevron. Both preserve
        caller render functions and remain hidden from assistive technology by default.
      </p>
      <LegacyBreadcrumb aria-label="Legacy custom divider">
        <LegacyBreadcrumbItem>Home</LegacyBreadcrumbItem>
        <LegacyBreadcrumbDivider>/</LegacyBreadcrumbDivider>
        <LegacyBreadcrumbItem>Projects</LegacyBreadcrumbItem>
      </LegacyBreadcrumb>
      <Breadcrumb aria-label="Custom divider and item content">
        <BreadcrumbItem>
          <Link href="#breadcrumb-custom-projects">Home</Link>
        </BreadcrumbItem>
        <BreadcrumbDivider>/</BreadcrumbDivider>
        <BreadcrumbItem>
          <BreadcrumbButton icon={<BreadcrumbCalendarIcon />}>
            Projects <span aria-hidden>(12)</span>
          </BreadcrumbButton>
        </BreadcrumbItem>
        <BreadcrumbDivider>{null}</BreadcrumbDivider>
        <BreadcrumbItem>
          <span id="breadcrumb-custom-projects" aria-current="page">
            Atlas
          </span>
        </BreadcrumbItem>
      </Breadcrumb>
    </div>
  );
}

const meta = {
  title: 'Experiments/Headless Breadcrumb',
  component: Breadcrumb,
  subcomponents: { BreadcrumbItem, BreadcrumbButton, BreadcrumbDivider },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration of the complete Breadcrumb family using public headless 0.3.2 hooks, renderers, context, native slots, and style-free glyphs. No CoreAI Breadcrumb overrides or defaults exist. Production is unchanged. The pinned Breadcrumb base hook strips focusMode without emitting focusgroup or Tabster attributes: native Tab works, but arrow focus mode is not implemented. A focusgroup polyfill cannot add behavior without a focusgroup attribute; this experiment adds neither a fallback nor the legacy Tabster pipeline.',
      },
    },
  },
  argTypes: {
    size: { control: 'select', options: breadcrumbSizes },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(
      async () => {
        await expect(
          canvas.getByRole('status', { name: 'Breadcrumb style report' }),
        ).toHaveTextContent('No differences in the selected properties.');
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

export const ConsumerOverrides: Story = {
  render: () => (
    <>
      <p>
        Intentional cascade difference: ordinary unlayered consumer CSS wins over the port's layered
        rules, including button height, min-width, padding, icon dimensions, and divider size. The
        exact unsuppressed report may differ from the legacy Griffel result.
      </p>
      <ComparisonWithReport examples={[breadcrumbConsumerExample]} />
    </>
  ),
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare resting styles' }));
    await waitFor(async () => {
      await expect(
        canvas.getByRole('status', { name: 'Breadcrumb style report' }),
      ).not.toHaveTextContent('Comparison not run.');
    });
    const root = getComparisonBreadcrumb(canvasElement, 'headless');
    const control = root.querySelector('.fui-BreadcrumbButton');
    if (!control) throw new Error('Missing consumer BreadcrumbButton');
    const projectControl = root.querySelectorAll('.fui-BreadcrumbButton')[1];
    await expect(getComputedStyle(projectControl).minWidth).toBe('110px');
    await expect(getComputedStyle(projectControl).height).toBe('38px');
  },
};

export const NavigationFlow: Story = {
  render: () => <BreadcrumbNavigationFlow />,
  play: async ({ canvas }) => {
    const originalUrl = window.location.href;
    try {
      await userEvent.click(canvas.getByRole('button', { name: 'Start keyboard navigation' }));
      await userEvent.hover(canvas.getByText(/Native Tab visits/));
      await userEvent.tab();
      await expect(canvas.getByRole('button', { name: 'Home' })).toHaveFocus();
      await userEvent.tab();
      const projects = canvas.getByRole('link', { name: 'Projects' });
      await expect(projects).toHaveFocus();
      const targetHash = projects.getAttribute('href');
      await userEvent.keyboard('{Enter}');
      await waitFor(async () => {
        await expect(window.location.hash).toBe(targetHash);
        await expect(canvas.getByRole('status', { name: 'Navigation result' })).toHaveTextContent(
          'Page: Projects. Link callbacks: 1. Button callbacks: 0. Hash visits: 1.',
        );
      });
      await expect(projects).toHaveAttribute('aria-current', 'page');
      await expect(projects).not.toHaveAttribute('href');
      await userEvent.click(canvas.getByRole('button', { name: 'Home' }));
      await expect(canvas.getByRole('status', { name: 'Navigation result' })).toHaveTextContent(
        'Page: Home. Link callbacks: 1. Button callbacks: 1. Hash visits: 1.',
      );
      await userEvent.click(canvas.getByRole('button', { name: 'Home' }));
      await expect(canvas.getByRole('status', { name: 'Navigation result' })).toHaveTextContent(
        'Button callbacks: 1.',
      );
    } finally {
      window.history.replaceState(window.history.state, '', originalUrl);
    }
  },
};

export const CustomDividerAndContent: Story = {
  render: () => <CustomContent />,
  play: async ({ canvas }) => {
    const root = canvas.getByRole('navigation', { name: 'Custom divider and item content' });
    const dividers = root.querySelectorAll('.fui-BreadcrumbDivider');
    await expect(dividers[0]).toHaveTextContent('/');
    await expect(dividers[0].querySelector('svg')).toBeNull();
    await expect(dividers[1]).toBeEmptyDOMElement();
    await expect(root.querySelector('[aria-current="page"]')).toHaveTextContent('Atlas');
  },
};

export const CollapsedAncestors: Story = {
  render: () => <BreadcrumbCollapsedAncestors />,
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('link', { name: 'Team' })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Show two hidden ancestors' }));
    await expect(canvas.getByRole('link', { name: 'Team' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Projects' })).toBeVisible();
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'All four breadcrumb entries shown.',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Collapse ancestors' }));
    await expect(canvas.queryByRole('link', { name: 'Team' })).not.toBeInTheDocument();
    await expect(canvas.getByRole('status')).toHaveTextContent('Two ancestors collapsed.');
  },
};
