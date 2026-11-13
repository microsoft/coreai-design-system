// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  illicons,
  iconToDotGrid,
  makeStyles,
  mergeClasses,
  tokens,
  useFluentThemeMode,
  type DotGridRenderOptions,
  type IlliconName,
} from '@coreai-ds/react-components';
import {
  Agents16Filled,
  Agents20Filled,
  Agents24Filled,
  Beaker16Filled,
  Beaker20Filled,
  Beaker24Filled,
  Code16Filled,
  Code20Filled,
  Code24Filled,
  Cube16Regular,
  Cube20Regular,
  Cube24Regular,
  Database16Filled,
  Database20Filled,
  Database24Filled,
  DocumentOnePageMultiple16Filled,
  DocumentOnePageMultiple20Filled,
  DocumentOnePageMultiple24Filled,
  Fluid16Filled,
  Fluid20Filled,
  Fluid24Filled,
  Globe16Filled,
  Globe20Filled,
  Globe24Filled,
  Home16Filled,
  Home20Filled,
  Home24Filled,
  LockClosed16Filled,
  LockClosed20Filled,
  LockClosed24Filled,
  Scales16Filled,
  Scales20Filled,
  Scales24Filled,
  Shield16Filled,
  Shield20Filled,
  Shield24Filled,
  Warning16Filled,
  Warning20Filled,
  Warning24Filled,
  type FluentIcon,
} from '@fluentui/react-icons';
import { ConvertedIllicon } from './ConvertedIllicon';
import { rasterizeIconToDotGrid } from '../../../../packages/react-components/src/illicons/iconToDotGrid';

type NativeIconSize = 16 | 20 | 24;

interface SourceCandidate {
  id: IlliconName | 'code';
  title: string;
  icons: Record<NativeIconSize, FluentIcon>;
  source: string;
  variant?: 'Regular';
  note?: string;
}

export const illiconSourceCandidates: readonly SourceCandidate[] = [
  {
    id: 'agents',
    title: 'Agents',
    icons: { 16: Agents16Filled, 20: Agents20Filled, 24: Agents24Filled },
    source: 'Agents',
  },
  {
    id: 'beaker',
    title: 'Fine-tune',
    icons: { 16: Beaker16Filled, 20: Beaker20Filled, 24: Beaker24Filled },
    source: 'Beaker',
    note: 'Temporary candidate: Beaker Empty is not available in the installed Fluent package.',
  },
  {
    id: 'database',
    title: 'Database',
    icons: { 16: Database16Filled, 20: Database20Filled, 24: Database24Filled },
    source: 'Database',
  },
  {
    id: 'documents',
    title: 'Documents',
    icons: {
      16: DocumentOnePageMultiple16Filled,
      20: DocumentOnePageMultiple20Filled,
      24: DocumentOnePageMultiple24Filled,
    },
    source: 'DocumentOnePageMultiple',
  },
  {
    id: 'evaluations',
    title: 'Evaluations',
    icons: { 16: Scales16Filled, 20: Scales20Filled, 24: Scales24Filled },
    source: 'Scales',
  },
  {
    id: 'globe',
    title: 'Globe',
    icons: { 16: Globe16Filled, 20: Globe20Filled, 24: Globe24Filled },
    source: 'Globe',
  },
  {
    id: 'home',
    title: 'Home',
    icons: { 16: Home16Filled, 20: Home20Filled, 24: Home24Filled },
    source: 'Home',
  },
  {
    id: 'lock-closed',
    title: 'Lock closed',
    icons: { 16: LockClosed16Filled, 20: LockClosed20Filled, 24: LockClosed24Filled },
    source: 'LockClosed',
  },
  {
    id: 'models',
    title: 'Models',
    icons: { 16: Cube16Regular, 20: Cube20Regular, 24: Cube24Regular },
    source: 'Cube',
    variant: 'Regular',
    note: 'Approximation: the original uses a modified Regular cube.',
  },
  {
    id: 'shield',
    title: 'Shield',
    icons: { 16: Shield16Filled, 20: Shield20Filled, 24: Shield24Filled },
    source: 'Shield',
    note: 'Approximation: the original shield was modified.',
  },
  {
    id: 'warning',
    title: 'Warning',
    icons: { 16: Warning16Filled, 20: Warning20Filled, 24: Warning24Filled },
    source: 'Warning',
  },
  {
    id: 'workflows',
    title: 'Workflows',
    icons: { 16: Fluid16Filled, 20: Fluid20Filled, 24: Fluid24Filled },
    source: 'Fluid',
    note: 'Unconfirmed candidate from silhouette matching; verify against the original.',
  },
  {
    id: 'code',
    title: 'Code',
    icons: { 16: Code16Filled, 20: Code20Filled, 24: Code24Filled },
    source: 'Code',
    note: 'New illustration: no original SVG to compare.',
  },
];

export type IlliconSourceComparisonProps = DotGridRenderOptions & {
  nativeSize?: NativeIconSize;
  multiplier?: number;
};

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXL,
    padding: tokens.spacingHorizontalL,
    color: tokens.colorNeutralForeground1,
  },
  row: {
    overflowX: 'auto',
  },
  examples: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalXXL,
    width: 'max-content',
  },
  example: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalS,
    minWidth: '140px',
    margin: 0,
  },
  original: { display: 'block', flexShrink: 0 },
  raster: {
    // Keep the unmodified black raster visible in both themes.
    backgroundColor: '#ffffff',
    '& > canvas': {
      display: 'block',
      width: '100%',
      height: '100%',
      imageRendering: 'pixelated',
    },
  },
  dark: { filter: 'brightness(0) invert(1)' },
  light: { filter: 'brightness(0) invert(0.1411764706)' },
});

function CanvasRaster({
  canvas,
  pitch,
  label,
}: {
  canvas: HTMLCanvasElement;
  pitch: number;
  label: string;
}) {
  const styles = useStyles();
  const mount = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (node) node.replaceChildren(canvas);
    },
    [canvas],
  );
  return (
    <div
      ref={mount}
      role="img"
      aria-label={label}
      className={styles.raster}
      style={{ width: canvas.width * pitch, height: canvas.height * pitch }}
    />
  );
}

function RasterizedSource({
  icon,
  nativeSize,
  multiplier,
  title,
  radius,
  pitch,
}: {
  icon: FluentIcon;
  nativeSize: NativeIconSize;
  multiplier: number;
  title: string;
  radius: number;
  pitch: number;
}) {
  const styles = useStyles();
  const [canvas, setCanvas] = React.useState<HTMLCanvasElement>();
  const convert = React.useCallback<typeof iconToDotGrid>(async (source, options) => {
    const sample = await rasterizeIconToDotGrid(source, options);
    setCanvas(sample.canvas);
    return sample.data;
  }, []);
  return (
    <>
      {canvas ? (
        <figure className={styles.example}>
          <figcaption>
            Canvas: {canvas.width} x {canvas.height}px (before threshold)
          </figcaption>
          <CanvasRaster canvas={canvas} pitch={pitch} label={`Sampling canvas ${title}`} />
        </figure>
      ) : null}
      <figure className={styles.example}>
        <figcaption>Recreated grid: {nativeSize * multiplier * pitch}px</figcaption>
        <ConvertedIllicon
          icon={icon}
          multiplier={multiplier}
          radius={radius}
          pitch={pitch}
          convert={convert}
          aria-label={`Recreated ${title}`}
        />
      </figure>
    </>
  );
}

/**
 * Compares original artwork with likely Fluent sources and newly sampled grids.
 * Candidates are review aids, not approved catalog replacements.
 */
export function IlliconSourceComparison({
  nativeSize = 20,
  multiplier = 2,
  radius = 1,
  pitch = 5,
}: IlliconSourceComparisonProps) {
  const styles = useStyles();
  const mode = useFluentThemeMode();
  const columns = nativeSize * multiplier;
  const width = columns * pitch;
  const original = (id: IlliconName) => {
    const artwork = illicons.find((icon) => icon.id === id);
    if (!artwork) throw new Error(`Missing original Illicon artwork: ${id}`);
    return (
      <img
        className={mergeClasses(styles.original, styles[mode])}
        src={artwork.src}
        width={140}
        height={140}
        alt={`Original ${artwork.name}`}
      />
    );
  };

  return (
    <div className={styles.root}>
      <h1>Fluent source recreation</h1>
      <p>
        Recommended standard for new Fluent-based Illicons: native 20px at 2x, producing 40 x 40
        cells. Other native sizes and multipliers are available here for visual testing.
      </p>
      <p>
        Originals remain unchanged at 140 x 140px. Generated versions use {columns} x {columns}{' '}
        cells ({multiplier}x native {nativeSize}px), {radius * 2}px dots, {pitch}px pitch, and{' '}
        {width} x {width}px output. Canvas raster: {columns} x {columns}px, one pixel per cell at a
        50% alpha threshold. The actual sampling canvas is shown before thresholding, enlarged{' '}
        {pitch}x without smoothing on a white background. Gray edge pixels show partial alpha. This
        compares shapes, not exact designer placement or dot occupancy.
      </p>
      {illiconSourceCandidates.map(({ id, title, icons, source, variant = 'Filled', note }) => {
        const Icon = icons[nativeSize];
        return (
          <section key={id} className={styles.row} aria-label={`${title} source comparison`}>
            <h2>{title}</h2>
            <p>
              {source}
              {nativeSize}
              {variant}
              {note ? ` - ${note}` : ''}
            </p>
            <div className={styles.examples}>
              <figure className={styles.example}>
                <figcaption>Original SVG: 140px</figcaption>
                {id === 'code' ? <p>No original SVG</p> : original(id)}
              </figure>
              <figure className={styles.example}>
                <figcaption>Fluent source</figcaption>
                <Icon style={{ width, height: width }} aria-label={`Fluent source ${title}`} />
              </figure>
              <RasterizedSource
                key={`${nativeSize}-${multiplier}`}
                icon={Icon}
                nativeSize={nativeSize}
                multiplier={multiplier}
                title={title}
                radius={radius}
                pitch={pitch}
              />
            </div>
          </section>
        );
      })}
      {(['ai-gateway', 'foundry'] as const).map((id) => (
        <section key={id} aria-label={`${id} custom artwork`}>
          <h2>{id === 'ai-gateway' ? 'AI Gateway' : 'Foundry'}</h2>
          <p>Custom logo: original preserved; no Fluent source or generated replacement.</p>
          {original(id)}
        </section>
      ))}
    </div>
  );
}
