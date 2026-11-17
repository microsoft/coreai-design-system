// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { chromium, expect } from 'playwright/test';

const root = new URL(process.argv[2] ?? 'http://127.0.0.1:8081/');
const metadata = await (await fetch(new URL('llms/index.json', root))).json();
const pages = metadata.pages.filter((record) => !record.mergedInto);
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
  const html = await (await fetch(root)).text();
  await page.goto(root.href);
  const { indexedPaths, navigationPaths } = await page.evaluate((source) => {
    const document = new globalThis.DOMParser().parseFromString(source, 'text/html');
    const index = JSON.parse(document.getElementById('reference-search-index').textContent);
    return {
      indexedPaths: index.map((entry) => entry.path),
      navigationPaths: [...document.querySelectorAll('[data-navigation-entry]')].map(
        (link) => new URL(link.getAttribute('href'), globalThis.location.href).pathname,
      ),
    };
  }, html);
  const navPaths = new Set(navigationPaths);
  assert.deepEqual(
    new Set(indexedPaths.map((path) => new URL(path.slice(1), root).pathname)),
    navPaths,
    'Search indexes exactly the navigation tree, never unlisted pages or redirects.',
  );
  assert.deepEqual(
    navPaths,
    new Set(pages.map((record) => new URL(record.htmlPath, root).pathname)),
    'Every published non-redirect page appears in navigation.',
  );
  const ready = async () => {
    const pathname = new URL(page.url()).pathname.replace(/index\.html$/, '');
    const record = pages.find((entry) => new URL(entry.htmlPath, root).pathname === pathname);
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
    await expect(resultFor('components/Field/')).toBeVisible();
    await expect(resultFor('patterns/Forms/')).toHaveCount(0);
    await search.fill('tex');
    await expect(results.first().locator('.app-search-result__title')).toHaveText('Text');
    for (const href of await results.evaluateAll((links) => links.map((link) => link.pathname)))
      assert.ok(navPaths.has(href), `Search result is in navigation: ${href}`);
  };

  for (const record of pages) {
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
    'components/Field/',
    'templates/EmptyState/',
    'templates/ShellAndNavigation/',
    'guides/Migration/',
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
      await search.hover();
      const idle = await results.first().evaluate(async (element) => {
        await Promise.all(element.getAnimations().map((animation) => animation.finished));
        return globalThis.getComputedStyle(element).backgroundColor;
      });
      await results.first().hover();
      await expect
        .poll(() =>
          results
            .first()
            .evaluate((element) => globalThis.getComputedStyle(element).backgroundColor),
        )
        .not.toBe(idle);
      await search.hover();
      await expect(results.first()).toHaveCSS('background-color', idle);
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

  for (const route of [
    'guides/UseWithAgents',
    'guides/PackageSkill',
    'guides/AgentWorkflow',
    'guides/RouterLinkSlots',
    'patterns/Forms',
    'mcp-server',
    'guides/mcp-setup',
    'coreai-skill',
    'agent-skill',
    'foundational-skill',
    'design-md',
    'overview/resources',
    'resources',
    'prototyping',
  ]) {
    for (const suffix of ['/', '.md'])
      assert.equal(
        (await fetch(new URL(`${route}${suffix}`, root))).status,
        404,
        `Deleted route must not be served: ${route}${suffix}`,
      );
  }
  const redirects = metadata.pages.filter((record) => record.mergedInto);
  assert.equal(redirects.length, 7, 'Keep all seven React Router adapter redirects.');
  for (const record of redirects) {
    await page.goto(new URL(record.htmlPath, root).href);
    await page.waitForURL(/\/templates\/ReactRouter\/#guidance-/);
    await ready();
    assert.ok(!navPaths.has(new URL(record.htmlPath, root).pathname));
    const anchor = page.locator(new URL(page.url()).hash);
    await expect(anchor).toBeInViewport();
  }

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
