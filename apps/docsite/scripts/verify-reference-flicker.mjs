// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root = new URL(process.argv[2] ?? 'http://127.0.0.1:8080/');
const buttonUrl = new URL('components/button/', root);
const dropdownUrl = new URL('components/dropdown/', root);
const browser = await chromium.launch();

const delayRoute = async (route, delay) => {
  await new Promise((resolve) => setTimeout(resolve, delay));
  await route.continue();
};

const readFrames = (page) =>
  page.evaluate(() => {
    const frames = globalThis.__referenceFrames ?? [];
    globalThis.__referenceFrames = [];
    return frames;
  });

try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    globalThis.__referenceFrames = [];
    const sample = () => {
      const root = globalThis.document.getElementById('reference-root');
      const shell = root?.querySelector('.reference-shell');
      const main = root?.querySelector('#main');
      const heading = main?.querySelector('h1');
      if (root) {
        const rootStyle = globalThis.getComputedStyle(root);
        const shellStyle = shell ? globalThis.getComputedStyle(shell) : null;
        globalThis.__referenceFrames.push({
          rootVisible:
            rootStyle.display !== 'none' &&
            rootStyle.visibility !== 'hidden' &&
            Number(rootStyle.opacity) !== 0,
          shellVisible:
            !!shell &&
            shellStyle?.display !== 'none' &&
            shellStyle?.visibility !== 'hidden' &&
            Number(shellStyle?.opacity) !== 0,
          mainText: main?.textContent?.trim() ?? '',
          heading: heading?.textContent?.trim() ?? '',
        });
      }
      globalThis.requestAnimationFrame(sample);
    };
    globalThis.requestAnimationFrame(sample);
  });

  const reloadPage = await context.newPage();
  await reloadPage.route(/\/assets\/main-[^/]+\.js$/, (route) => delayRoute(route, 800));
  await reloadPage.goto(buttonUrl.href, { waitUntil: 'commit' });
  await reloadPage.locator('.reference-shell').waitFor();
  await reloadPage.getByRole('heading', { name: 'Button', exact: true }).waitFor();
  const before = await reloadPage.locator('.app-content').boundingBox();
  assert.ok(before, 'The static shell is laid out before the application bundle loads');
  await reloadPage.locator('[data-reference-ready="true"]').waitFor();
  const after = await reloadPage.locator('.app-content').boundingBox();
  assert.ok(after, 'The hydrated shell remains laid out');
  assert.ok(Math.abs(before.x - after.x) <= 1, 'Hydration does not move the content shell');
  assert.ok(
    Math.abs(before.width - after.width) <= 1,
    'Hydration does not resize the content shell',
  );
  const reloadFrames = await readFrames(reloadPage);
  assert.ok(reloadFrames.length > 10, 'The reload check samples multiple animation frames');
  assert.ok(
    reloadFrames.every((frame) => frame.rootVisible),
    'The root never becomes invisible',
  );
  assert.ok(
    reloadFrames.every((frame) => frame.shellVisible),
    'The shell never becomes invisible',
  );
  assert.ok(
    reloadFrames.every((frame) => frame.mainText),
    'The page never becomes blank',
  );
  await reloadPage.close();

  const hydrationPage = await context.newPage();
  let exampleRequested;
  const exampleRequest = new Promise((resolve) => {
    exampleRequested = resolve;
  });
  await hydrationPage.route(/\/assets\/components-button-button-[^/]+\.js$/, async (route) => {
    exampleRequested();
    await delayRoute(route, 800);
  });
  await hydrationPage.goto(buttonUrl.href);
  await exampleRequest;
  assert.ok(
    await hydrationPage.getByRole('heading', { name: 'Button', exact: true }).isVisible(),
    'The page header remains visible while its example bundle loads',
  );
  assert.ok(
    await hydrationPage.getByRole('tab', { name: 'Usage', exact: true }).isVisible(),
    'Usage and Samples tabs render before the example bundle',
  );
  assert.ok(
    await hydrationPage.locator('[data-page-panel="usage"]').isVisible(),
    'Usage content remains visible while examples load',
  );
  assert.ok(
    !(await hydrationPage.locator('[data-page-panel="samples"]').isVisible()),
    'Samples content does not flash before tab state is applied',
  );
  assert.ok(
    await hydrationPage
      .getByText('Loading interactive example. Full source is available below.')
      .first()
      .isVisible(),
    'The static preview remains visible until the live example replaces it',
  );
  await hydrationPage.locator('[data-reference-ready="true"]').waitFor();
  const hydrationFrames = await readFrames(hydrationPage);
  assert.ok(
    hydrationFrames.every((frame) => frame.mainText),
    'Lazy page hydration never blanks the main content',
  );

  let releaseNavigation;
  const navigationGate = new Promise((resolve) => {
    releaseNavigation = resolve;
  });
  let navigationRequested;
  const navigationRequest = new Promise((resolve) => {
    navigationRequested = resolve;
  });
  await hydrationPage.route(dropdownUrl.href, async (route) => {
    navigationRequested();
    await navigationGate;
    await route.continue();
  });
  await readFrames(hydrationPage);
  await hydrationPage.getByRole('tab', { name: 'Dropdown', exact: true }).click();
  await navigationRequest;
  assert.ok(
    await hydrationPage.getByRole('heading', { name: 'Button', exact: true }).isVisible(),
    'The current page remains visible while the destination HTML loads',
  );
  assert.equal(
    await hydrationPage.getByText('Loading documentation…').count(),
    0,
    'Client navigation does not replace the page with a loading placeholder',
  );
  releaseNavigation();
  await hydrationPage.getByRole('heading', { name: 'Dropdown', exact: true }).waitFor();
  await hydrationPage.locator('[data-reference-ready="true"]').waitFor();
  const navigationFrames = await readFrames(hydrationPage);
  assert.ok(navigationFrames.length > 0, 'The navigation check samples animation frames');
  assert.ok(
    navigationFrames.every((frame) => frame.mainText && frame.heading),
    'Client navigation always shows a complete page heading and content',
  );
} finally {
  await browser.close();
}

console.log('Reference flicker: delayed reload, hydration, and navigation passed');
