// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  ColorSwatch as LegacyColorSwatch,
  EmptySwatch as LegacyEmptySwatch,
  ImageSwatch as LegacyImageSwatch,
  SwatchPicker as LegacySwatchPicker,
  SwatchPickerRow as LegacySwatchPickerRow,
} from '@coreai-ds/react-components';
import {
  ColorSwatch,
  EmptySwatch,
  ImageSwatch,
  SwatchPicker,
  SwatchPickerRow,
  type SwatchPickerProps,
} from '@coreai-ds/react-headless-components';
import styles from './SwatchPickerComparison.module.css';

export type SwatchPickerImplementation = 'legacy' | 'headless';
export interface SwatchPickerExample {
  name: string;
  size?: SwatchPickerProps['size'];
  shape?: SwatchPickerProps['shape'];
  spacing?: SwatchPickerProps['spacing'];
  layout?: SwatchPickerProps['layout'];
  selected?: string;
  icons?: boolean;
  childOverrides?: boolean;
  disabledIcon?: 'none' | 'custom';
  emptyDisabled?: boolean;
  consumer?: boolean;
}

export const swatchImage =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path fill="#0078d4" d="M0 0h32v32H0z"/><path fill="#8ad4eb" d="M0 20 12 8l20 24H0z"/></svg>',
  );
export const swatchGradient = 'linear-gradient(45deg, #d13438, #ffca28)';

export const swatchPickerExamples: readonly SwatchPickerExample[] = [
  { name: 'Default' },
  { name: 'Extra small', size: 'extra-small' },
  { name: 'Small', size: 'small' },
  { name: 'Large', size: 'large' },
  { name: 'Square', shape: 'square' },
  { name: 'Circular', shape: 'circular' },
  { name: 'Compact spacing', spacing: 'small' },
  { name: 'Grid', layout: 'grid', shape: 'square' },
  { name: 'Compact grid', layout: 'grid', size: 'extra-small', spacing: 'small', shape: 'square' },
  { name: 'No selection', selected: '' },
  { name: 'Image selected', selected: 'image' },
  { name: 'Selected disabled', selected: 'disabled' },
  { name: 'Small selected disabled', size: 'small', selected: 'disabled' },
  { name: 'Content and icons', icons: true },
  { name: 'Child visual overrides', childOverrides: true },
  { name: 'Suppressed disabled glyph', disabledIcon: 'none' },
  { name: 'Custom disabled glyph', disabledIcon: 'custom' },
  { name: 'Disabled empty', emptyDisabled: true },
  {
    name: 'Explicit undefined visual props',
    size: undefined,
    shape: undefined,
    spacing: undefined,
  },
];

export const swatchPickerConsumerExample: SwatchPickerExample = {
  name: 'Consumer classes',
  layout: 'grid',
  icons: true,
  consumer: true,
};

type SwatchFixtureSpan = React.HTMLAttributes<HTMLSpanElement> & {
  as: 'span';
  'data-swatch-slot': string;
};

export function SwatchPickerFixture({
  implementation,
  example,
}: {
  implementation: SwatchPickerImplementation;
  example: SwatchPickerExample;
}) {
  const Picker = implementation === 'legacy' ? LegacySwatchPicker : SwatchPicker;
  const Row = implementation === 'legacy' ? LegacySwatchPickerRow : SwatchPickerRow;
  const Color = implementation === 'legacy' ? LegacyColorSwatch : ColorSwatch;
  const Image = implementation === 'legacy' ? LegacyImageSwatch : ImageSwatch;
  const Empty = implementation === 'legacy' ? LegacyEmptySwatch : EmptySwatch;
  const visualProps = {
    ...('size' in example ? { size: example.size } : {}),
    ...('shape' in example ? { shape: example.shape } : {}),
    ...('spacing' in example ? { spacing: example.spacing } : {}),
  };
  const icon = {
    as: 'span',
    'data-swatch-slot': 'icon',
    className: example.consumer ? styles.consumerIcon : undefined,
    children: (
      <svg aria-hidden="true" width="1em" height="1em" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 3h2v6h6v2h-6v6H9v-6H3V9h6z" />
      </svg>
    ),
  } satisfies SwatchFixtureSpan;
  const disabledIcon = {
    as: 'span',
    'data-swatch-slot': 'disabled-icon',
    className: example.consumer ? styles.consumerIcon : undefined,
    ...(example.disabledIcon === 'custom' ? { children: <span aria-hidden="true">×</span> } : {}),
  } satisfies SwatchFixtureSpan;
  const className = example.consumer ? styles.consumerSwatch : undefined;
  const swatches = [
    <Color
      key="red"
      color="#d13438"
      value="red"
      aria-label="Red"
      data-swatch-part="red"
      className={className}
      {...(example.childOverrides ? { size: 'small', shape: 'square' } : {})}
    />,
    <Color
      key="blue"
      color="#0078d4"
      value="blue"
      aria-label="Blue"
      data-swatch-part="blue"
      className={className}
      icon={example.icons ? icon : undefined}
    >
      {example.icons ? 'B' : undefined}
    </Color>,
    <Color
      key="gradient"
      color={swatchGradient}
      borderColor="#6b4c00"
      value="gradient"
      aria-label="Sunset gradient"
      data-swatch-part="gradient"
      className={className}
    />,
    <Image
      key="image"
      src={swatchImage}
      value="image"
      aria-label="Mountain texture"
      data-swatch-part="image"
      className={className}
      {...(example.childOverrides ? { size: 'large', shape: 'circular' } : {})}
    />,
    <Color
      key="disabled"
      color="#6b6b6b"
      value="disabled"
      disabled
      aria-label="Unavailable gray"
      data-swatch-part="disabled"
      className={className}
      disabledIcon={example.disabledIcon === 'none' ? null : disabledIcon}
    />,
    <Empty
      key="empty"
      aria-label="Empty color"
      data-swatch-part="empty"
      disabled={example.emptyDisabled}
      className={className}
      {...(example.childOverrides ? { size: 'large', shape: 'circular' } : {})}
    />,
  ];
  return (
    <Picker
      {...visualProps}
      aria-label={`${implementation} swatches`}
      data-swatch-implementation={implementation}
      layout={example.layout}
      defaultSelectedValue={example.selected ?? 'red'}
      className={example.consumer ? styles.consumerPicker : undefined}
    >
      {example.layout === 'grid' ? (
        <>
          <Row data-swatch-row="0" className={example.consumer ? styles.consumerRow : undefined}>
            {swatches.slice(0, 3)}
          </Row>
          <Row data-swatch-row="1" className={example.consumer ? styles.consumerRow : undefined}>
            {swatches.slice(3)}
          </Row>
        </>
      ) : (
        swatches
      )}
    </Picker>
  );
}

export function SwatchPickerComparison({ example }: { example: SwatchPickerExample }) {
  return (
    <div className={styles.comparison}>
      <section className={styles.column}>
        <h3>Current CoreAI / Griffel</h3>
        <div className={styles.viewport}>
          <SwatchPickerFixture implementation="legacy" example={example} />
        </div>
      </section>
      <section className={styles.column}>
        <h3>Headless / CSS Modules</h3>
        <div className={styles.viewport}>
          <SwatchPickerFixture implementation="headless" example={example} />
        </div>
      </section>
    </div>
  );
}
