// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import {
  coreaiLightTheme,
  coreaiDarkTheme,
  coreaiBrandVariants,
  azureLightTheme,
  azureDarkTheme,
  azureBrandVariants,
} from '@coreai-ds/react-components';

const root = new URL(process.argv[2] ?? 'http://127.0.0.1:8080/');
const brands = {
  coreai: { light: coreaiLightTheme, dark: coreaiDarkTheme, variants: coreaiBrandVariants },
  azure: { light: azureLightTheme, dark: azureDarkTheme, variants: azureBrandVariants },
};
const metadata = await (await fetch(new URL('llms/index.json', root))).json();
const route = (id) => new URL(metadata.pages.find((page) => page.id === id).htmlPath, root);

async function seed(context, brand, mode) {
  await context.addInitScript(
    ({ brand, mode }) => {
      if (sessionStorage.getItem('theme-check-seeded')) return;
      localStorage.setItem('coreai-docsite-brand', brand);
      localStorage.setItem('coreai-docsite-theme', mode);
      sessionStorage.setItem('theme-check-seeded', 'true');
    },
    { brand, mode },
  );
}

async function assertTokens(scope, theme) {
  for (const token of [
    'colorBrandBackground',
    'colorBrandForeground1',
    'colorNeutralBackground3',
    'colorNeutralForeground2',
  ]) {
    const actual = await scope.evaluate(
      (element, token) =>
        globalThis.getComputedStyle(element).getPropertyValue(`--${token}`).trim(),
      token,
    );
    assert.equal(actual, theme[token], token);
  }
}

async function selectBrand(page, brand) {
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('combobox', { name: 'Theme', exact: true }).click();
  await page
    .getByRole('option', { name: brand === 'azure' ? 'Azure blue' : 'CoreAI purple' })
    .click();
  await page.keyboard.press('Escape');
  await page.waitForFunction(
    (brand) =>
      globalThis.document.documentElement.dataset.brand === brand &&
      !globalThis.document.documentElement.classList.contains('theme-transitioning'),
    brand,
  );
}

async function assertCubeColors(page, brand) {
  await page.locator('.coreai-logo-cube[data-ready="true"]').waitFor();
  const png = await page.locator('.coreai-logo-cube canvas').screenshot();
  const colors = await page.evaluate(async (png) => {
    const image = new globalThis.Image();
    image.src = `data:image/png;base64,${png}`;
    await image.decode();
    const canvas = globalThis.document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const counts = { coreai: 0, azure: 0 };
    for (let i = 0; i < pixels.length; i += 4) {
      const [r, g, b] = pixels.subarray(i, i + 3);
      if (b - r > 12 && r - g > 8) counts.coreai++;
      if (b - g > 12 && g - r > 8) counts.azure++;
    }
    return counts;
  }, png.toString('base64'));
  const other = brand === 'coreai' ? 'azure' : 'coreai';
  assert.ok(colors[brand] > 100 && colors[brand] > colors[other] * 2, JSON.stringify(colors));
}

const browser = await chromium.launch();
try {
  for (const [brand, mode, expectedBrand, expectedMode] of [
    ['coreai', 'light', 'coreai', 'light'],
    ['coreai', 'dark', 'coreai', 'dark'],
    ['azure', 'light', 'azure', 'light'],
    ['azure', 'dark', 'azure', 'dark'],
    ['invalid', 'light', 'coreai', 'light'],
    ['azure', 'invalid', 'azure', 'dark'],
  ]) {
    const context = await browser.newContext({
      colorScheme: mode === 'dark' ? 'light' : 'dark',
    });
    await seed(context, brand, mode);
    await context.route('**/*.js', (request) => request.abort());
    const page = await context.newPage();
    await page.goto(root.href);
    assert.equal(await page.locator('html').getAttribute('data-brand'), expectedBrand);
    assert.equal(await page.locator('html').getAttribute('data-theme'), expectedMode);
    await assertTokens(page.locator('html'), brands[expectedBrand][expectedMode]);
    await context.close();
  }

  for (const mode of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
      colorScheme: mode,
      reducedMotion: 'reduce',
    });
    await seed(context, 'coreai', mode);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(route('introduction').href);
    await page.locator('.intro-feature--foundations').waitFor();
    for (const brand of ['coreai', 'azure']) {
      if (brand === 'azure') await selectBrand(page, brand);
      const theme = brands[brand][mode];
      await assertTokens(page.locator('.coreai-docsite-provider'), theme);
      const swatches = await page
        .locator('.intro-foundation-swatches > span')
        .evaluateAll((elements) => elements.map((element) => element.style.backgroundColor));
      const expected = [40, 60, 90, 120, 150].map((step) => {
        const hex = brands[brand].variants[step];
        return `rgb(${hex
          .slice(1)
          .match(/../g)
          .map((value) => parseInt(value, 16))
          .join(', ')})`;
      });
      assert.deepEqual(swatches, expected);
      const primary = page.locator('.intro-component-do button');
      assert.equal(
        await primary.evaluate((element) => globalThis.getComputedStyle(element).backgroundColor),
        `rgb(${theme.colorBrandBackground
          .slice(1)
          .match(/../g)
          .map((value) => parseInt(value, 16))
          .join(', ')})`,
      );
      for (const scene of ['foundations', 'components', 'templates', 'agents']) {
        await assertTokens(page.locator(`.intro-feature--${scene}`), theme);
      }
    }
    await page.reload();
    await page.locator('.intro-feature--foundations').waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('coreai-docsite-brand')), 'azure');
    await assertTokens(page.locator('.coreai-docsite-provider'), brands.azure[mode]);
    for (const id of ['colors', 'button']) {
      await page.goto(route(id).href);
      const scope = page
        .locator(id === 'colors' ? '.reference-color-view' : '.preview .fui-Button')
        .first();
      await scope.waitFor();
      await assertTokens(scope, brands.azure[mode]);
    }
    await page.getByRole('link', { name: 'CoreAI home', exact: true }).click();
    await assertCubeColors(page, 'azure');
    const canvas = await page.locator('.coreai-logo-cube canvas').elementHandle();
    await selectBrand(page, 'coreai');
    assert.ok(
      await canvas.evaluate((element) => element.isConnected),
      'Theme switch keeps the canvas',
    );
    await assertCubeColors(page, 'coreai');
    assert.deepEqual(errors, [], `${mode}: runtime errors`);
    await context.close();
  }
} finally {
  await browser.close();
}
console.log(
  'Site-wide themes verified: initial paint, persistence, live controls, illustrations, and homepage shader in both modes.',
);
