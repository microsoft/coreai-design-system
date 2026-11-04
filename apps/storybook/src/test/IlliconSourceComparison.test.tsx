// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { dotGridToSvg, iconToDotGrid, illicons } from '@coreai-ds/react-components';
import { Agents20Filled } from '@fluentui/react-icons';
import { renderCoreAIComponent } from '../../../../packages/react-components/src/test-utils';
import { ConvertedIllicon } from '../illicons/ConvertedIllicon';
import {
  IlliconSourceComparison,
  illiconSourceCandidates,
} from '../illicons/IlliconSourceComparison';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test('records the supplied mappings, modified originals, tentative sources, and new Code', () => {
  expect(
    illiconSourceCandidates.map(({ id, source, variant = 'Filled' }) => [
      id,
      `${source}20${variant}`,
    ]),
  ).toEqual([
    ['agents', 'Agents20Filled'],
    ['beaker', 'Beaker20Filled'],
    ['database', 'Database20Filled'],
    ['documents', 'DocumentOnePageMultiple20Filled'],
    ['evaluations', 'Scales20Filled'],
    ['globe', 'Globe20Filled'],
    ['home', 'Home20Filled'],
    ['lock-closed', 'LockClosed20Filled'],
    ['models', 'Cube20Regular'],
    ['shield', 'Shield20Filled'],
    ['warning', 'Warning20Filled'],
    ['workflows', 'Fluid20Filled'],
    ['code', 'Code20Filled'],
  ]);
});

for (const nativeSize of [16, 20, 24] as const) {
  for (const multiplier of [1, 2, 3, 4]) {
    test(`recreates every ${nativeSize}px source at ${multiplier}x without resizing its dots`, async () => {
      const screen = await renderCoreAIComponent(
        <IlliconSourceComparison nativeSize={nativeSize} multiplier={multiplier} />,
      );
      const columns = nativeSize * multiplier;
      for (const candidate of illiconSourceCandidates) {
        const image = screen.getByRole('img', {
          name: `Recreated ${candidate.title}`,
          exact: true,
        });
        await expect.element(image).toBeVisible();
        const svg = image.element().querySelector('svg');
        expect(svg).toHaveAttribute('width', String(columns * 5));
        expect(svg).toHaveAttribute('height', String(columns * 5));
        const source = screen.getByRole('img', {
          name: `Fluent source ${candidate.title}`,
          exact: true,
        });
        expect(source).toHaveAttribute('viewBox', `0 0 ${nativeSize} ${nativeSize}`);
        expect(
          screen.getByText(`${candidate.source}${nativeSize}${candidate.variant ?? 'Filled'}`, {
            exact: !candidate.note,
          }),
        ).toBeVisible();
        const grid = await iconToDotGrid(candidate.icons[nativeSize], { multiplier });
        expect(grid.rows).toHaveLength(columns);
        expect(grid.rows.every((row) => row.length === columns)).toBe(true);
        const raster = screen
          .getByRole('img', { name: `Sampling canvas ${candidate.title}`, exact: true })
          .element()
          .querySelector('canvas');
        if (!raster) throw new Error(`Missing sampling canvas: ${candidate.id}`);
        expect(raster.width).toBe(columns);
        expect(raster.height).toBe(columns);
        expect(raster.getBoundingClientRect().width).toBe(columns * 5);
        expect(getComputedStyle(raster).imageRendering).toBe('pixelated');
        const context = raster.getContext('2d');
        if (!context) throw new Error('Sampling canvas has no 2D context');
        const pixels = context.getImageData(0, 0, columns, columns).data;
        const rasterRows = Array.from({ length: columns }, (_, row) =>
          Array.from({ length: columns }, (_, column) =>
            pixels[(row * columns + column) * 4 + 3] >= 128 ? '1' : '0',
          ).join(''),
        );
        expect(rasterRows).toEqual(grid.rows);
        const expected = new DOMParser().parseFromString(dotGridToSvg(grid), 'image/svg+xml');
        const positions = (root: ParentNode) =>
          Array.from(root.querySelectorAll('circle'), (circle) => [
            circle.getAttribute('cx'),
            circle.getAttribute('cy'),
            circle.getAttribute('r'),
          ]);
        if (!svg) throw new Error(`Missing recreated SVG: ${candidate.id}`);
        expect(positions(svg)).toEqual(positions(expected));
        expect(svg.querySelector('circle')?.getBoundingClientRect().width).toBe(2);
      }
      expect(screen.container.querySelector('[role="alert"]')).toBeNull();
    });
  }
}

test('switches native variants and replaces the actual raster and grids', async () => {
  const screen = await renderCoreAIComponent(<IlliconSourceComparison />);
  const source = screen.getByRole('img', { name: 'Fluent source Evaluations', exact: true });
  const grid = screen.getByRole('img', { name: 'Recreated Evaluations', exact: true });
  const raster = screen.getByRole('img', { name: 'Sampling canvas Evaluations', exact: true });
  await expect.element(grid).toBeVisible();
  const twentyPath = source.element().querySelector('path')?.getAttribute('d');
  for (const nativeSize of [16, 24, 20] as const) {
    await screen.rerender(<IlliconSourceComparison nativeSize={nativeSize} />);
    await expect.element(grid).toBeVisible();
    expect(source).toHaveAttribute('viewBox', `0 0 ${nativeSize} ${nativeSize}`);
    expect(raster.element().querySelector('canvas')?.width).toBe(nativeSize * 2);
    expect(grid.element().querySelector('svg')).toHaveAttribute(
      'width',
      String(nativeSize * 2 * 5),
    );
    const path = source.element().querySelector('path')?.getAttribute('d');
    if (nativeSize === 20) expect(path).toBe(twentyPath);
    else expect(path).not.toBe(twentyPath);
  }
});

test('defaults to 20x2 and displays actual canvases without a second rasterization or repaint on pitch changes', async () => {
  const drawImage = vi.spyOn(CanvasRenderingContext2D.prototype, 'drawImage');
  const screen = await renderCoreAIComponent(<IlliconSourceComparison />);
  for (const candidate of illiconSourceCandidates) {
    await expect
      .element(screen.getByRole('img', { name: `Recreated ${candidate.title}`, exact: true }))
      .toBeVisible();
  }
  const canvases = Array.from(screen.container.querySelectorAll('canvas'));
  expect(canvases).toHaveLength(13);
  expect(drawImage).toHaveBeenCalledTimes(13);
  for (const target of drawImage.mock.contexts) {
    if (!(target instanceof CanvasRenderingContext2D)) {
      throw new Error('Conversion did not draw into a 2D canvas');
    }
    expect(canvases).toContain(target.canvas);
  }
  const pixels = canvases.map((canvas) => canvas.toDataURL());
  await screen.rerender(<IlliconSourceComparison pitch={6} />);
  expect(drawImage).toHaveBeenCalledTimes(13);
  expect(Array.from(screen.container.querySelectorAll('canvas'))).toEqual(canvases);
  expect(canvases.map((canvas) => canvas.toDataURL())).toEqual(pixels);
  for (const canvas of canvases) {
    expect(canvas.width).toBe(40);
    expect(canvas.height).toBe(40);
    expect(canvas.getBoundingClientRect().width).toBe(240);
  }
});

test('retains all original image sources and explains uncertain and custom artwork', async () => {
  const screen = await renderCoreAIComponent(<IlliconSourceComparison multiplier={1} />);
  const images = Array.from(screen.container.querySelectorAll('img'));
  expect(images).toHaveLength(illicons.length);
  for (const artwork of illicons) {
    const image = images.find((image) => image.alt === `Original ${artwork.name}`);
    expect(image?.src).toBe(artwork.src);
    await image?.decode();
    expect(image?.naturalWidth).toBe(140);
    expect(image?.getBoundingClientRect().width).toBe(140);
  }
  for (const name of ['ai-gateway', 'foundry']) {
    const section = screen.getByRole('region', { name: `${name} custom artwork` });
    expect(section).toHaveTextContent('Custom logo: original preserved');
    expect(section.element().querySelector('svg')).toBeNull();
  }
  expect(screen.getByText(/Temporary candidate: Beaker Empty/)).toBeVisible();
  expect(screen.getByText(/Unconfirmed candidate from silhouette matching/)).toBeVisible();
  expect(screen.getByText(/original uses a modified Regular cube/)).toBeVisible();
  expect(screen.getByText(/original shield was modified/)).toBeVisible();
  expect(screen.getByText('No original SVG', { exact: true })).toBeVisible();
});

test('changes rendering geometry independently and replaces occupancy when sampling changes', async () => {
  const screen = await renderCoreAIComponent(
    <ConvertedIllicon icon={Agents20Filled} aria-label="Sample" />,
  );
  const sample = screen.getByRole('img', { name: 'Sample' });
  await expect.element(sample).toBeVisible();
  expect(sample.element().querySelector('svg')).toHaveAttribute('width', '200');
  const circles = sample.element().querySelectorAll('circle').length;
  await screen.rerender(
    <ConvertedIllicon icon={Agents20Filled} radius={1.5} pitch={6} aria-label="Sample" />,
  );
  expect(sample.element().querySelector('svg')).toHaveAttribute('width', '240');
  expect(sample.element().querySelectorAll('circle')).toHaveLength(circles);
  expect(sample.element().querySelector('circle')?.getBoundingClientRect().width).toBe(3);
  await screen.rerender(
    <ConvertedIllicon icon={Agents20Filled} multiplier={3} aria-label="Sample" />,
  );
  await expect.element(sample).toBeVisible();
  expect(sample.element().querySelector('svg')).toHaveAttribute('width', '300');
  expect(sample.element().querySelectorAll('circle').length).toBeGreaterThan(circles);
});

test('surfaces conversion errors instead of showing an empty success state', async () => {
  const screen = await renderCoreAIComponent(
    <ConvertedIllicon icon={Agents20Filled} multiplier={0} />,
  );
  await expect.element(screen.getByRole('alert')).toHaveTextContent(/multiplier/);
  expect(screen.container.querySelector('svg')).toBeNull();
});
