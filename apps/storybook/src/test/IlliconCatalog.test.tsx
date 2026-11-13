// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import {
  CoreAIFluentProvider,
  coreaiDarkTheme,
  coreaiLightTheme,
  illicons,
} from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../../../packages/react-components/src/test-utils';
import { IlliconCatalog } from '../illicons/IlliconCatalog';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test('previews the artwork gallery without advertising the obsolete name API', async () => {
  const screen = await renderCoreAIComponent(<IlliconCatalog />);
  const images = Array.from(screen.container.querySelectorAll('img'));
  expect(images).toHaveLength(Math.min(illicons.length, 24));
  for (const image of images) {
    image.loading = 'eager';
    await image.decode();
    expect(image.naturalWidth).toBe(140);
    expect(image.naturalHeight).toBe(140);
    expect(image.getBoundingClientRect().width).toBe(80);
    expect(image.getBoundingClientRect().height).toBe(80);
    expect(image.parentElement?.tagName).toBe('ARTICLE');
    expect(getComputedStyle(image).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(getComputedStyle(image.parentElement!).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  }
  expect(screen.getByRole('article', { name: 'Agents', exact: true })).toBeVisible();
  expect(screen.container.querySelectorAll('a[download]')).toHaveLength(0);
  expect(screen.container.textContent).not.toContain('<Illicon name=');
  expect(
    screen.getByText(/Saved-data catalog integration is being designed separately/),
  ).toBeVisible();
  const guide = screen.getByRole('link', { name: 'Create a new illicon' });
  expect(guide).toHaveAttribute(
    'href',
    'https://mini-foundry.azurewebsites.net/ckantner/illicon-creator/',
  );
  expect(guide).toHaveAttribute('target', '_blank');
  expect(guide).toHaveAttribute('rel', 'noopener noreferrer');
  for (const name of ['Agents', 'Workflows', 'Models', 'Foundry', 'Home']) {
    const tile = screen.getByRole('article', { name, exact: true }).element();
    expect(tile.querySelector('p')).toBeNull();
  }
  expect(screen.getByRole('article', { name: 'Fine-tune', exact: true })).toHaveTextContent(
    'beaker, lab, test',
  );
});

test('searches names and tags case-insensitively and reports no matches', async () => {
  const screen = await renderCoreAIComponent(<IlliconCatalog />);
  await userEvent.fill(
    screen.getByRole('searchbox', { name: 'Search illicons' }),
    'SECURITY shield',
  );
  expect(screen.container.querySelectorAll('article')).toHaveLength(1);
  expect(screen.getByRole('article', { name: 'Shield', exact: true })).toBeVisible();
  await userEvent.fill(screen.getByRole('searchbox'), 'brain');
  expect(screen.getByText(/No illicons match/)).toBeVisible();
  await userEvent.fill(screen.getByRole('searchbox'), 'agents');
  expect(screen.getByRole('article', { name: 'Agents', exact: true })).toBeVisible();
  await userEvent.fill(screen.getByRole('searchbox'), 'test');
  expect(screen.container.querySelectorAll('article')).toHaveLength(1);
  expect(screen.getByRole('article', { name: 'Fine-tune', exact: true })).toBeVisible();
  await userEvent.fill(screen.getByRole('searchbox'), 'scale');
  expect(screen.getByRole('article', { name: 'Evaluations', exact: true })).toBeVisible();
  await userEvent.fill(screen.getByRole('searchbox'), 'networking');
  expect(screen.getByRole('article', { name: 'Globe', exact: true })).toBeVisible();
  expect(screen.getByText('networking, network, world')).toBeVisible();
  await userEvent.fill(screen.getByRole('searchbox'), 'missing');
  expect(screen.getByText(/No illicons match/)).toBeVisible();
  await userEvent.clear(screen.getByRole('searchbox'));
  expect(screen.container.querySelectorAll('article')).toHaveLength(Math.min(illicons.length, 24));
});

test('confirms each copy above its button without shifting the icon grid', async () => {
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  const screen = await renderCoreAIComponent(<IlliconCatalog />);
  const positions = () =>
    Array.from(
      screen.container.querySelectorAll('article'),
      (tile) => tile.getBoundingClientRect().top + window.scrollY,
    );
  const before = positions();
  for (const [name, id] of [
    ['Shield', 'shield'],
    ['Home', 'home'],
  ]) {
    const artwork = illicons.find((icon) => icon.id === id);
    if (!artwork) throw new Error(`Missing catalog artwork: ${id}`);
    const original = await fetch(artwork.src).then((response) => response.text());
    const button = screen.getByRole('button', { name: `Copy ${name} SVG`, exact: true });
    await userEvent.click(button);
    await expect.poll(() => writeText.mock.lastCall?.[0]).toBe(original);
    const feedback = screen.getByText(`Copied ${name} SVG`, { exact: true });
    await expect.element(feedback).toBeVisible();
    expect(feedback.element().getBoundingClientRect().bottom).toBeLessThanOrEqual(
      button.element().getBoundingClientRect().top,
    );
    expect(positions()).toEqual(before);
  }
});

test('reports clipboard rejection and preview failure without claiming success', async () => {
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Permission denied'));
  const screen = await renderCoreAIComponent(<IlliconCatalog />);
  await userEvent.click(screen.getByRole('button', { name: 'Copy Agents SVG', exact: true }));
  await expect.element(screen.getByRole('alert')).toHaveTextContent(/Could not copy Agents SVG/);
  screen.container.querySelector('img')?.dispatchEvent(new Event('error'));
  await expect
    .element(screen.getByRole('alert'))
    .toHaveTextContent('Preview unavailable for Agents.');
});

function inkPixel(image: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is required to check illustration colors');
  context.filter = getComputedStyle(image).filter;
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let ink = [0, 0, 0, 0];
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] > ink[3]) ink = Array.from(pixels.subarray(index, index + 4));
  }
  return ink;
}

test('switches preview ink with the active theme without remounting or changing artwork', async () => {
  const gallery = <IlliconCatalog />;
  const screen = await render(
    <CoreAIFluentProvider theme={coreaiDarkTheme}>{gallery}</CoreAIFluentProvider>,
  );
  const image = screen.container.querySelector('img');
  if (!image) throw new Error('Catalog did not render an image');
  image.loading = 'eager';
  await image.decode();
  const source = image.src;
  const darkInk = inkPixel(image);
  expect(darkInk[0]).toBeGreaterThan(250);

  await screen.rerender(
    <CoreAIFluentProvider theme={coreaiLightTheme}>{gallery}</CoreAIFluentProvider>,
  );
  await expect.poll(() => inkPixel(image)[0]).toBeLessThan(40);
  const lightInk = inkPixel(image);
  expect(lightInk[0]).toBeGreaterThan(30);
  expect(lightInk[3]).toBe(darkInk[3]);
  expect(screen.container.querySelector('img')).toBe(image);
  expect(image.src).toBe(source);

  await screen.rerender(
    <CoreAIFluentProvider theme={coreaiDarkTheme}>{gallery}</CoreAIFluentProvider>,
  );
  await expect.poll(() => inkPixel(image)).toEqual(darkInk);
});
