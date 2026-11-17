// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { chromium, expect } from 'playwright/test';

const root = new URL(process.argv[2] ?? 'http://127.0.0.1:8082/coreai-design-system/');
const metadata = await (await fetch(new URL('llms/index.json', root))).json();
const browser = await chromium.launch();
let routeChecks = 0;
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const search = page.getByRole('searchbox', { name: 'Search navigation' });
  const results = page.locator('.app-search-result');
  const resultFor = (path) =>
    page.locator(`.app-search-result[href="${new URL(path, root).pathname}"]`);
  const ready = async () => {
    const pathname = new URL(page.url()).pathname.replace(/index\.html$/, '');
    const record = metadata.pages.find(
      (entry) => new URL(entry.htmlPath, root).pathname === pathname,
    );
    assert.ok(record, `Known route: ${pathname}`);
    await expect(page).toHaveTitle(`${record.title} | CoreAI design system`);
    await page.locator('[data-reference-ready="true"]').waitFor();
  };
  const assertSearch = async () => {
    await search.fill('attention-grabbing');
    await expect(resultFor('components/Button/')).toBeVisible();
    await expect(resultFor('components/Button/').locator('mark').last()).toHaveText(
      'attention-grabbing',
    );
    await search.fill('Forms');
    await expect(resultFor('patterns/Forms/')).toBeVisible();
    await search.fill('tex');
    await expect(results.first().locator('.app-search-result__title')).toHaveText('Text');
  };

  for (const record of metadata.pages) {
    await page.goto(new URL(record.htmlPath, root).href);
    await ready();
    await assertSearch();
    routeChecks++;
  }

  const routes = [
    '',
    'overview/Introduction/',
    'foundations/Typography/',
    'components/Button/',
    'patterns/Forms/',
    'templates/EmptyState/',
    'templates/ShellAndNavigation/',
    'guides/AgentWorkflow/',
  ];
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => localStorage.setItem('coreai-docsite-theme', value), theme);
    await page.goto(root.href);
    await ready();
    await page.evaluate(() => (globalThis.searchNavigationProbe = true));
    for (const route of routes) {
      await search.fill(route ? route.split('/').at(-2) : 'Home');
      await resultFor(route).click();
      await expect(page).toHaveURL(new URL(route, root).href);
      await ready();
      assert.equal(await page.evaluate(() => globalThis.searchNavigationProbe), true);
      await expect(search).toHaveValue('');
      await assertSearch();
      await search.press('ArrowDown');
      await expect(results.first()).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(results.nth(1)).toBeFocused();
      await page.keyboard.press('Home');
      await expect(results.first()).toBeFocused();
      await page.keyboard.press('End');
      await expect(results.last()).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(search).toBeFocused();
      await expect(search).toHaveValue('');
      await search.fill('tex');
      await search.press('Tab');
      await expect(page.getByRole('button', { name: 'Settings' })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(results.first()).toBeFocused();
      await page.keyboard.press('ControlOrMeta+k');
      await expect(search).toBeFocused();
      await search.fill('tex');
      const style = await results.first().evaluate((element) => {
        const computed = globalThis.getComputedStyle(element);
        const title = globalThis.getComputedStyle(element.firstElementChild);
        const excerpt = globalThis.getComputedStyle(element.lastElementChild);
        return {
          display: computed.display,
          align: computed.alignItems,
          radius: parseFloat(computed.borderRadius),
          decoration: computed.textDecorationLine,
          title: title.whiteSpace,
          clamp: excerpt.webkitLineClamp,
          overflow: element.scrollWidth > element.clientWidth,
        };
      });
      assert.equal(style.display, 'flex');
      assert.equal(style.align, 'stretch');
      assert.ok(style.radius <= 8);
      assert.equal(style.decoration, 'none');
      assert.equal(style.title, 'nowrap');
      assert.equal(style.clamp, '3');
      assert.equal(style.overflow, false);
      await search.fill('');
      await page.locator('nav[aria-label="Documentation"]').evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      await search.fill('tex');
      await expect(page.locator('.app-search-results__header')).toBeInViewport();
      await expect(results.first()).toBeInViewport();
      await results.first().hover();
      const hover = await results
        .first()
        .evaluate((element) => globalThis.getComputedStyle(element).backgroundColor);
      await search.hover();
      const idle = await results
        .first()
        .evaluate((element) => globalThis.getComputedStyle(element).backgroundColor);
      assert.notEqual(hover, idle, `${theme}: hover is visible`);
      routeChecks++;
    }
    await page.goBack();
    await ready();
    await assertSearch();
    await page.goForward();
    await ready();
    await assertSearch();
    await search.fill('zzzz-no-match');
    await expect(page.locator('.app-search-results__header')).toContainText('0 results');
    await expect(page.getByText('Try a different word or phrase.')).toBeVisible();
    await search.press('Escape');
    await expect(search).toHaveValue('');
  }

  await page.goto(new URL('components/Button/index.html#guidance-best-practices', root).href);
  await ready();
  await assertSearch();
  await search.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new URL('components/Text/', root).href);
  await ready();
  await search.fill('Text');
  await resultFor('components/Text/').click();
  await expect(search).toHaveValue('');

  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['', 'templates/EmptyState/']) {
    await page.goto(new URL(route, root).href);
    await ready();
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(search).toBeFocused();
    await search.fill('Button');
    await resultFor('components/Button/').click();
    await ready();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(search).toBeFocused();
    await assertSearch();
    await search.press('Escape');
    await expect(search).toHaveValue('');
    await expect(page.getByRole('dialog')).toBeVisible();
    await search.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  assert.deepEqual(errors, []);
  console.log(
    `Search passed on ${routeChecks} direct/client route and theme checks, plus history, deep links, keyboard, and mobile navigation.`,
  );
} finally {
  await browser.close();
}
