// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { Image, type ImageProps } from '@coreai-ds/react-headless-components';
import {
  ImageComparison,
  imageAlternateSrc,
  imageBrokenSrc,
  imageConsumerExample,
  imageFits,
  imageFixtureSrc,
  imageShapes,
  type ImageExample,
} from './ImageComparison.js';
import {
  captureImageStyles,
  compareImageStyles,
  getComparisonImage,
  settleImage,
  type ImageStyleDifference,
} from './compareImageStyles.js';
import styles from './ImageComparison.module.css';

function ComparisonWithReport({ examples }: { examples?: readonly ImageExample[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [differences, setDifferences] = React.useState<
    (ImageStyleDifference & { example: string })[] | null
  >(null);

  const compare = async () => {
    const container = containerRef.current;
    if (!container) throw new Error('Image comparison has not mounted');
    const rows = [...container.querySelectorAll<HTMLElement>('[data-image-case]')];
    if (!rows.length) throw new Error('Image comparison has no examples');
    const results: (ImageStyleDifference & { example: string })[] = [];
    for (const row of rows) {
      const legacy = getComparisonImage(row, 'legacy');
      const headless = getComparisonImage(row, 'headless');
      await Promise.all([settleImage(legacy), settleImage(headless)]);
      results.push(
        ...compareImageStyles(captureImageStyles(legacy), captureImageStyles(headless)).map(
          (difference) => ({ example: row.dataset.imageCase ?? '', ...difference }),
        ),
      );
    }
    setDifferences(results);
  };

  return (
    <div>
      <p>
        Both columns share the active provider, theme, and deterministic inline SVG fixtures. Both
        render a native img. The report waits for image decoding before comparing selected root
        styles and dimensions, including intrinsic sizing and explicit width/height. It is not a
        screenshot or pixel comparison.
      </p>
      <button type="button" onClick={compare}>
        Compare loaded styles
      </button>
      <output className={styles.report} aria-live="polite">
        {differences === null
          ? 'Comparison not run.'
          : differences.length
            ? JSON.stringify(differences, null, 2)
            : 'No differences in the selected properties.'}
      </output>
      <div ref={containerRef}>
        <ImageComparison examples={examples} />
      </div>
    </div>
  );
}

function ImagePlayground(props: ImageProps) {
  const [source, setSource] = React.useState<'initial' | 'alternate' | 'broken'>('initial');
  const [status, setStatus] = React.useState('Loading image…');
  const src =
    source === 'alternate' ? imageAlternateSrc : source === 'broken' ? imageBrokenSrc : props.src;
  const selectSource = (next: 'initial' | 'alternate' | 'broken') => {
    setStatus('Loading image…');
    setSource(next);
  };

  return (
    <div className={styles.playground}>
      <p>
        Change fit, shape, border, shadow, or native dimensions in Controls. Load another local
        illustration or a deliberately invalid source to inspect native load/error events and the
        browser&apos;s alt fallback.
      </p>
      <div className={styles.frame}>
        <Image
          {...props}
          src={src}
          onLoad={(event) => {
            setStatus('Image loaded.');
            props.onLoad?.(event);
          }}
          onError={(event) => {
            setStatus('Image failed to load; native alt fallback remains.');
            props.onError?.(event);
          }}
        />
      </div>
      <output aria-live="polite">{status}</output>
      <div className={styles.actions}>
        <button
          type="button"
          disabled={source === 'alternate'}
          onClick={() => selectSource('alternate')}
        >
          Load alternate illustration
        </button>
        <button type="button" disabled={source === 'broken'} onClick={() => selectSource('broken')}>
          Load broken image
        </button>
        <button
          type="button"
          disabled={source === 'initial'}
          onClick={() => selectSource('initial')}
        >
          Restore illustration
        </button>
      </div>
    </div>
  );
}

const meta = {
  title: 'Experiments/Headless Image',
  component: Image,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Private migration experiment: public Fluent headless useImage/renderImage behavior with layered CSS Modules from react-image 9.4.6. Image has no CoreAI-specific styles or defaults. Native alt, intrinsic sizing, responsive sources, loading, refs, and image events are retained. Shadow is a current Image prop. Use consumer CSS or inline styles instead of legacy Griffel customStyleHooks. The production package is unchanged.',
      },
    },
  },
  argTypes: {
    fit: { control: 'select', options: imageFits },
    shape: { control: 'select', options: imageShapes },
    block: { control: 'boolean' },
    bordered: { control: 'boolean' },
    shadow: { control: 'boolean' },
    width: { control: { type: 'number', min: 0 } },
    height: { control: { type: 'number', min: 0 } },
    alt: { control: 'text' },
    loading: { control: 'select', options: ['eager', 'lazy'] },
    decoding: { control: 'select', options: ['auto', 'async', 'sync'] },
    src: { control: false },
  },
} satisfies Meta<typeof Image>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <ComparisonWithReport />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare loaded styles' }));
    await waitFor(() =>
      expect(canvas.getByText('No differences in the selected properties.')).toBeVisible(),
    );
  },
};

export const ConsumerOverrides: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Intentional cascade contract: ordinary consumer CSS overrides combined block, fit, shape, border, and shadow styles without !important. Legacy Griffel can retain its own declarations. Any reported differences here are shown, not excluded from comparison.',
      },
    },
  },
  render: () => <ComparisonWithReport examples={[imageConsumerExample]} />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare loaded styles' }));
    const image = getComparisonImage(canvasElement, 'headless');
    await settleImage(image);
    const styles = captureImageStyles(image);
    await expect(styles['root.width']).toBe('96.00');
    await expect(styles['root.height']).toBe('64.00');
    await expect(styles['root.border-radius']).toBe('3px');
    await expect(styles['root.border-top-width']).toBe('2px');
    await expect(styles['root.object-fit']).toBe('contain');
    await expect(styles['root.box-shadow']).toBe('none');
  },
};

export const Playground: Story = {
  args: {
    src: imageFixtureSrc,
    alt: 'Project diagram of geometric shapes',
    width: 200,
    height: 120,
    fit: 'contain',
    shape: 'rounded',
    bordered: true,
    shadow: true,
    loading: 'eager',
    decoding: 'async',
    onLoad: fn(),
    onError: fn(),
  },
  render: (args) => <ImagePlayground {...args} />,
  play: async ({ args, canvas }) => {
    const image = canvas.getByRole('img', { name: 'Project diagram of geometric shapes' });
    if (!(image instanceof HTMLImageElement)) throw new Error('Missing Playground native img');
    await settleImage(image);
    await waitFor(() => expect(args.onLoad).toHaveBeenCalledTimes(1));
    await expect(args.onError).not.toHaveBeenCalled();

    await userEvent.click(canvas.getByRole('button', { name: 'Load alternate illustration' }));
    await waitFor(() => expect(image).toHaveAttribute('src', imageAlternateSrc));
    await settleImage(image);
    await waitFor(() => expect(args.onLoad).toHaveBeenCalledTimes(2));
    await expect(canvas.getByText('Image loaded.')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Load broken image' }));
    await waitFor(() => expect(args.onError).toHaveBeenCalledTimes(1));
    await expect(image).toHaveAttribute('src', imageBrokenSrc);
    await expect(image).toHaveAttribute('alt', 'Project diagram of geometric shapes');
    await expect(image.naturalWidth).toBe(0);
    await expect(
      canvas.getByText('Image failed to load; native alt fallback remains.'),
    ).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Restore illustration' }));
    await waitFor(() => expect(image).toHaveAttribute('src', imageFixtureSrc));
    await settleImage(image);
    await waitFor(() => expect(args.onLoad).toHaveBeenCalledTimes(3));
    await expect(args.onError).toHaveBeenCalledTimes(1);
    await expect(canvas.getByText('Image loaded.')).toBeVisible();
  },
};
