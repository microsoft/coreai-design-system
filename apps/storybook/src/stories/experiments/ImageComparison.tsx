// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Image as LegacyImage } from '@coreai-ds/react-components';
import { Image as HeadlessImage, type ImageProps } from '@coreai-ds/react-headless-components';
import styles from './ImageComparison.module.css';

export const imageFixtureSrc = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="#e4e8ef"/><circle cx="30" cy="40" r="22" fill="#3269b3"/><rect x="70" y="18" width="36" height="44" fill="#d77925"/></svg>',
)}`;

export const imageAlternateSrc = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="#e9e3f1"/><path d="M12 64L42 16L72 64Z" fill="#7452a3"/><circle cx="94" cy="40" r="18" fill="#26846c"/></svg>',
)}`;

export const imageBrokenSrc = 'data:image/svg+xml,%3Csvg';
export const imageFits = ['default', 'center', 'contain', 'cover', 'none'] as const;
export const imageShapes = ['square', 'rounded', 'circular'] as const;

export interface ImageExample {
  name: string;
  props: ImageProps;
}

export const imageExamples: ImageExample[] = [
  { name: 'Intrinsic size', props: {} },
  ...imageFits
    .filter((fit) => fit !== 'default')
    .map((fit) => ({ name: `Fit: ${fit}`, props: { fit } })),
  { name: 'Explicit dimensions', props: { width: 90, height: 60 } },
  { name: 'Fit with width only', props: { fit: 'cover', width: 90 } },
  { name: 'Fit with height only', props: { fit: 'contain', height: 72 } },
  {
    name: 'Fit with string dimensions',
    props: { fit: 'none', width: '90', height: '60' },
  },
  { name: 'Fit with zero width', props: { fit: 'center', width: 0 } },
  {
    name: 'Fit with inline sizing',
    props: { fit: 'cover', style: { width: '90px', height: '60px' } },
  },
  { name: 'Block', props: { block: true } },
  { name: 'Block with explicit dimensions', props: { block: true, width: 90, height: 60 } },
  { name: 'Block and fit', props: { block: true, fit: 'contain' } },
  ...imageShapes.map((shape) => ({
    name: `Bordered shape: ${shape}`,
    props: { shape, bordered: true, width: 80, height: 80 },
  })),
  { name: 'Shadow', props: { shadow: true, width: 90, height: 60 } },
  {
    name: 'Rounded border and shadow',
    props: {
      shape: 'rounded',
      bordered: true,
      shadow: true,
      fit: 'cover',
      width: 90,
      height: 60,
    },
  },
];

export const imageConsumerExample: ImageExample = {
  name: 'Consumer CSS Modules',
  props: {
    block: true,
    bordered: true,
    shadow: true,
    fit: 'cover',
    shape: 'circular',
    className: styles.consumerImage,
  },
};

function ImageFixture({
  implementation,
  name,
  props,
}: ImageExample & { implementation: 'legacy' | 'headless' }): React.ReactElement {
  const Component = implementation === 'legacy' ? LegacyImage : HeadlessImage;
  return (
    <div className={styles.cell} data-implementation={implementation}>
      <div className={styles.frame}>
        <Component
          {...props}
          src={props.src ?? imageFixtureSrc}
          alt={props.alt ?? `${name}: blue circle and orange rectangle`}
        />
      </div>
    </div>
  );
}

export function ImageComparison({
  examples = imageExamples,
}: {
  examples?: readonly ImageExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>Headless / CSS Modules</strong>
      </div>
      {examples.map((example) => (
        <div key={example.name} className={styles.row} data-image-case={example.name}>
          <span>{example.name}</span>
          <ImageFixture {...example} implementation="legacy" />
          <ImageFixture {...example} implementation="headless" />
        </div>
      ))}
    </div>
  );
}
