// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Button,
  iconToDotGrid,
  Illicon,
  Link,
  makeStyles,
  Text,
  tokens,
  type DotGridData,
  type DotGridRenderOptions,
} from '@coreai-ds/react-components';
import {
  Agents24Filled,
  Agents24Regular,
  Brain24Filled,
  Brain24Regular,
  CodeRegular,
  Cube24Filled,
  Cube24Regular,
  Database24Filled,
  Database24Regular,
  Document24Filled,
  Document24Regular,
  FolderAdd20Filled,
  FolderAdd20Regular,
  FolderAdd24Filled,
  FolderAdd24Regular,
  Heart16Filled,
  Heart16Regular,
  Heart20Filled,
  Heart20Regular,
  Heart24Filled,
  Heart24Regular,
  Rocket16Filled,
  Rocket16Regular,
  Rocket24Filled,
  Rocket24Regular,
  Search24Filled,
  Search24Regular,
  Shield24Filled,
  Shield24Regular,
  Star24Filled,
  Star24Regular,
  type FluentIcon,
} from '@fluentui/react-icons';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { EmptyState } from '../templates/EmptyState';

const iconOptions = {
  Agents24: { filled: Agents24Filled, regular: Agents24Regular, nativeSize: 24 },
  Brain24: { filled: Brain24Filled, regular: Brain24Regular, nativeSize: 24 },
  Cube24: { filled: Cube24Filled, regular: Cube24Regular, nativeSize: 24 },
  Database24: { filled: Database24Filled, regular: Database24Regular, nativeSize: 24 },
  Document24: { filled: Document24Filled, regular: Document24Regular, nativeSize: 24 },
  FolderAdd20: { filled: FolderAdd20Filled, regular: FolderAdd20Regular, nativeSize: 20 },
  FolderAdd24: { filled: FolderAdd24Filled, regular: FolderAdd24Regular, nativeSize: 24 },
  Heart16: { filled: Heart16Filled, regular: Heart16Regular, nativeSize: 16 },
  Heart20: { filled: Heart20Filled, regular: Heart20Regular, nativeSize: 20 },
  Heart24: { filled: Heart24Filled, regular: Heart24Regular, nativeSize: 24 },
  Rocket16: { filled: Rocket16Filled, regular: Rocket16Regular, nativeSize: 16 },
  Rocket24: { filled: Rocket24Filled, regular: Rocket24Regular, nativeSize: 24 },
  Search24: { filled: Search24Filled, regular: Search24Regular, nativeSize: 24 },
  Shield24: { filled: Shield24Filled, regular: Shield24Regular, nativeSize: 24 },
  Star24: { filled: Star24Filled, regular: Star24Regular, nativeSize: 24 },
};

type SamplingProps = DotGridRenderOptions & { multiplier: number };
type ComparisonProps = SamplingProps & {
  icon: keyof typeof iconOptions;
  variant: 'Filled' | 'Regular';
};

function ConvertedIllicon({
  icon,
  columns,
  ...props
}: DotGridRenderOptions & {
  icon: FluentIcon;
  columns: number;
  'aria-label'?: string;
}) {
  const [sample, setSample] = React.useState<{
    icon: FluentIcon;
    columns: number;
    value: DotGridData | Error;
  }>();
  React.useEffect(() => {
    let active = true;
    void iconToDotGrid(icon, { columns }).then(
      (value) => {
        if (active) setSample({ icon, columns, value });
      },
      (error: unknown) => {
        if (active) {
          setSample({
            icon,
            columns,
            value: error instanceof Error ? error : new Error(String(error)),
          });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [icon, columns]);

  if (!sample || sample.icon !== icon || sample.columns !== columns) {
    return <Text role="status">Converting illustration...</Text>;
  }
  if (sample.value instanceof Error) {
    return <Text role="alert">{sample.value.message}</Text>;
  }
  return <Illicon {...props} data={sample.value} />;
}

const useComparisonStyles = makeStyles({
  root: {
    width: '100%',
    overflowX: 'auto',
  },
  comparison: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, max-content)',
    columnGap: tokens.spacingHorizontalXXL,
    marginInline: 'auto',
    width: 'max-content',
    color: tokens.colorNeutralForeground1,
  },
  example: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    rowGap: tokens.spacingVerticalM,
  },
});

function IconComparison({
  icon: Icon,
  label,
  nativeSize,
  multiplier,
  radius = 1,
  pitch = 5,
}: SamplingProps & { icon: FluentIcon; label: string; nativeSize: number }) {
  const styles = useComparisonStyles();
  const columns = nativeSize * multiplier;
  const width = columns * pitch;

  return (
    <div className={styles.root}>
      <div className={styles.comparison}>
        <div className={styles.example}>
          <Text>Original</Text>
          <Icon style={{ width, height: width }} aria-label={`Original ${label}`} />
          <Text>
            {label}: native {nativeSize} x {nativeSize}
          </Text>
        </div>
        <div className={styles.example}>
          <Text>Illicon</Text>
          <ConvertedIllicon
            icon={Icon}
            columns={columns}
            radius={radius}
            pitch={pitch}
            aria-label={`Illicon ${label}`}
          />
          <Text>
            {columns} x {columns} cells; {width} x {width}px; {radius * 2}px dots
          </Text>
        </div>
      </div>
    </div>
  );
}

/**
 * Compare Filled and Regular icons at native-size sampling multiples.
 * The multiplier changes occupancy resolution. Radius and pitch only change
 * rendering; a 2px dot stays 2px at every multiplier. Regular icons usually
 * represent outlines using filled paths rather than SVG stroke attributes.
 */
export const OriginalVsIlliconDev: StoryObj<ComparisonProps> = {
  name: 'Original vs. Illicon Dev',
  args: {
    icon: 'Rocket24',
    variant: 'Filled',
    multiplier: 1,
    radius: 1,
    pitch: 5,
  },
  argTypes: {
    icon: {
      description: 'Fluent icon and its native 16px, 20px, or 24px dimensions.',
      control: 'select',
      options: Object.keys(iconOptions),
    },
    variant: { control: 'select', options: ['Filled', 'Regular'] },
    multiplier: {
      description: 'Recommended sampling resolution: native dimensions times this integer.',
      control: 'select',
      options: [1, 2, 3, 4],
    },
    radius: { control: { type: 'range', min: 0.5, max: 2, step: 0.5 } },
    pitch: { control: { type: 'range', min: 4, max: 12, step: 1 } },
  },
  parameters: {
    controls: { disable: false, include: ['icon', 'variant', 'multiplier', 'radius', 'pitch'] },
  },
  render: ({ icon, variant, ...args }: ComparisonProps) => {
    const source = iconOptions[icon];
    return (
      <IconComparison
        {...args}
        icon={variant === 'Filled' ? source.filled : source.regular}
        label={`${icon}${variant}`}
        nativeSize={source.nativeSize}
      />
    );
  },
  play: async ({ canvas, args }) => {
    const image = await canvas.findByRole('img', { name: `Illicon ${args.icon}${args.variant}` });
    await expect(image).toBeVisible();
    await expect(image.querySelector('svg')).toHaveAttribute(
      'width',
      String(iconOptions[args.icon].nativeSize * args.multiplier * (args.pitch ?? 5)),
    );
    await expect(image.querySelector('circle')?.getBoundingClientRect().width).toBe(
      (args.radius ?? 1) * 2,
    );
  },
};

const StrokedSvg: FluentIcon = (props) => (
  <svg {...props} role="img" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
    <rect x="4.5" y="4.5" width="15" height="15" rx="2" />
    <circle cx="12" cy="12" r="4.5" />
    <path d="M6.5 17.5 17.5 6.5" />
  </svg>
);

/**
 * Real 1px SVG strokes, rather than outline-shaped filled paths. Compare
 * rectangles, curves, and a diagonal at 1x, 2x, 3x, or 4x sampling.
 */
export const StrokedSvgDev: StoryObj<SamplingProps> = {
  name: 'Stroked SVG Dev',
  args: { multiplier: 2, radius: 1, pitch: 5 },
  argTypes: {
    multiplier: { control: 'select', options: [1, 2, 3, 4] },
    radius: { control: { type: 'range', min: 0.5, max: 2, step: 0.5 } },
    pitch: { control: { type: 'range', min: 4, max: 12, step: 1 } },
  },
  parameters: {
    controls: { disable: false, include: ['multiplier', 'radius', 'pitch'] },
  },
  render: (args) => (
    <IconComparison {...args} icon={StrokedSvg} label="Stroked SVG" nativeSize={24} />
  ),
  play: async ({ canvas, args }) => {
    const image = await canvas.findByRole('img', { name: 'Illicon Stroked SVG' });
    await expect(image).toBeVisible();
    await expect(image.querySelector('circle')?.getBoundingClientRect().width).toBe(
      (args.radius ?? 1) * 2,
    );
  },
};

/**
 * Uses an Illicon as the dotted illustration in an empty state.
 *
 * @summary Illicon used as an empty-state illustration.
 */
export const EmptyStateDev: StoryObj = {
  render: () => (
    <EmptyState
      illustration={<ConvertedIllicon icon={Agents24Filled} columns={24} />}
      header="Benefit from Action Artifact"
      description="Disambiguate with text or exclude entirely."
      actions={
        <>
          <Button appearance="primary">Create agent</Button>
          <Button icon={<CodeRegular />}>Code</Button>
        </>
      }
      links={<Link href="#">How to make the coolest artifact ever</Link>}
    />
  ),
};

export default {
  title: 'Components/Illicon',
  component: Illicon,
} satisfies Meta<typeof Illicon>;
