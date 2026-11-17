// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import path from 'node:path';
import { chromium, expect } from 'playwright/test';

const root = new URL(process.argv[2] ?? 'http://127.0.0.1:8081/');
const screenshots = process.argv[3];
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const visit = async (route) => {
    await page.goto(new URL(route, root).href);
    await page.locator('[data-reference-ready="true"]').waitFor();
  };
  const screenshot = async (name) => {
    if (screenshots)
      await page.screenshot({ path: path.join(screenshots, name), animations: 'disabled' });
  };

  await visit('guides/RouterLinkSlots/');
  await page.getByRole('button', { name: 'Templates', exact: true }).click();
  const labels = page.locator('.reference-navigation-link').filter({
    hasText: /React Router \/ (Breadcrumb|Card Link)/,
  });
  assert.ok((await labels.count()) >= 2);
  for (const label of await labels.all()) {
    await expect(label).toBeVisible();
    assert.ok(
      await label.evaluate((element) => element.scrollHeight <= element.clientHeight),
      `Navigation text fits: ${await label.textContent()}`,
    );
    assert.equal(
      await label.evaluate((element) => globalThis.getComputedStyle(element).whiteSpace),
      'normal',
    );
  }
  await labels.first().scrollIntoViewIfNeeded();
  await screenshot('docsite-after-nav.png');

  for (const route of ['foundations/Spacing/', 'foundations/Layout/', 'foundations/Surfaces/']) {
    await visit(route);
    await expect(page.getByRole('heading', { name: 'Page under construction' })).toBeVisible();
    await expect(page.locator('.work-in-progress__logo')).toBeVisible();
    await expect(page.locator('.work-in-progress canvas')).toBeVisible();
    await expect(page.locator('.work-in-progress h1')).toHaveCSS('opacity', '1');
    await expect(page.getByRole('link', { name: /Share a suggestion/ })).toBeVisible();
    if (route.includes('Surfaces')) {
      await page.getByText('Existing guidance', { exact: true }).click();
      await expect(page.getByText(/We use subtle variations in background color/)).toBeVisible();
      await expect(page.locator('.materials-hero')).toBeVisible();
    } else {
      await expect(page.locator('.reference-existing-guidance')).toHaveCount(0);
    }
    if (route.includes('Spacing')) await screenshot('docsite-after-spacing.png');
  }

  for (const route of [
    'guides/Migration/',
    'guides/StylingWithCssModules/',
    'foundations/Theming/',
    'guides/VariationsFromFluent/',
  ]) {
    await visit(route);
    const expected = await page.evaluate(async () => {
      const source = new globalThis.DOMParser()
        .parseFromString(await (await fetch(globalThis.location.href)).text(), 'text/html')
        .querySelector('[data-page-widget="guide-accordions"]');
      return {
        titles: [...source.querySelectorAll('h2')].map((heading) => heading.textContent),
        code: [...source.querySelectorAll('pre code')].map((code) => code.textContent),
        nestedAnchor: source.querySelector('h3[id]')?.id,
      };
    });
    const headers = page.locator('.faq-list .fui-AccordionHeader button');
    assert.equal(await headers.count(), expected.titles.length);
    if (route.includes('Theming')) await screenshot('docsite-after-accordions.png');
    for (const header of await headers.all()) {
      await expect(header).toHaveAttribute('aria-expanded', 'false');
      await header.click();
      await expect(header).toHaveAttribute('aria-expanded', 'true');
    }
    assert.deepEqual(
      await page.locator('.faq-list pre code').allTextContents(),
      expected.code,
      `Code examples remain complete: ${route}`,
    );
    if (expected.nestedAnchor) {
      await visit(`${route}#${expected.nestedAnchor}`);
      await expect(page.locator(`[id="${expected.nestedAnchor}"]`)).toBeVisible();
    }
    const lastId = await page.locator('.faq-list .fui-AccordionItem').last().getAttribute('id');
    await visit(`${route}#${lastId}`);
    await expect(page.locator(`[id="${lastId}"] button`).first()).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  }

  await visit('overview/Changelog/');
  await expect(page.locator('.changelog-actions')).toHaveCount(0);
  await expect(page.locator('.changelog-month').filter({ hasText: 'Unreleased' })).toHaveCount(0);
  await expect(page.locator('.page-summary a', { hasText: 'Full changelog' })).toHaveAttribute(
    'href',
    'https://github.com/microsoft/coreai-design-system/blob/main/packages/react-components/CHANGELOG.md',
  );
  await screenshot('docsite-after-changelog.png');
  const metadata = await (await fetch(new URL('llms/index.json', root))).json();
  for (const entry of metadata.pages) {
    const response = await page.request.get(new URL(entry.htmlPath, root).href);
    assert.ok(
      (await response.text()).includes(
        `<link rel="icon" href="${root.pathname}assets/favicon.svg" type="image/svg+xml">`,
      ),
      `Favicon uses the deployment root: ${entry.htmlPath}`,
    );
  }
  const icon = await page.request.get(new URL('assets/favicon.svg', root).href);
  assert.equal(icon.status(), 200);
  assert.match(icon.headers()['content-type'], /image\/svg\+xml/);
  assert.ok(!metadata.pages.some((entry) => /DocumentationChangelog/.test(entry.htmlPath)));
  assert.ok(!metadata.pages.some((entry) => entry.title === 'Documentation changelog'));
  const removed = await page.request.get(new URL('overview/DocumentationChangelog/', root).href);
  assert.equal(removed.status(), 404);
  assert.deepEqual(errors, []);
  console.log(
    'Docsite UI updates passed: wrapped navigation, empty states, guide accordions and anchors, changelog, and removed page.',
  );
} finally {
  await browser.close();
}
