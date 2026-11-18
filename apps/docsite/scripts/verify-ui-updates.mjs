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

  await visit('overview/Introduction/');
  await page.getByRole('button', { name: 'Templates', exact: true }).click();
  const templateLinks = page.locator('.reference-navigation-link');
  await expect(templateLinks.filter({ hasText: /^React Router$/ })).toHaveCount(1);
  await expect(templateLinks.filter({ hasText: /React Router \// })).toHaveCount(0);
  for (const label of await templateLinks.all()) {
    if (!(await label.isVisible())) continue;
    assert.ok(
      await label.evaluate((element) => element.scrollHeight <= element.clientHeight),
      `Navigation text fits: ${await label.textContent()}`,
    );
    assert.equal(
      await label.evaluate((element) => globalThis.getComputedStyle(element).whiteSpace),
      'normal',
    );
  }
  await templateLinks.filter({ hasText: /^React Router$/ }).scrollIntoViewIfNeeded();
  await screenshot('docsite-after-nav.png');

  const routerSections = [
    'Breadcrumb Link',
    'Card Link',
    'Link',
    'Link Button',
    'Menu Item Link',
    'Tab Link',
    'Tab Link List',
  ];
  await visit('templates/ReactRouter/');
  for (const name of [...routerSections, 'Shared helper'])
    await expect(page.getByRole('heading', { level: 2, name, exact: true })).toHaveCount(1);
  const guidance = page.locator('[data-page-panel="usage"]');
  const samples = page.locator('[data-page-panel="samples"]');
  const previews = guidance.locator('.preview[data-example-id]');
  await expect(previews).toHaveCount(routerSections.length);
  for (const name of routerSections) {
    const section = guidance.getByRole('heading', { level: 2, name, exact: true }).locator('..');
    const preview = section.locator(':scope > .preview[data-example-id]');
    await expect(preview).toBeVisible();
    await expect(preview.locator('> :not(p)').first()).toBeAttached();
  }
  await page.getByRole('tab', { name: 'Samples', exact: true }).click();
  await expect(samples.locator('.preview[data-example-id]')).toHaveCount(routerSections.length);
  for (const name of routerSections) {
    const section = samples
      .locator('.reference-sample-section')
      .filter({ has: page.getByRole('heading', { name, exact: true }) });
    await expect(section.locator('.preview[data-example-id]')).toBeVisible();
    await expect(section.locator('.reference-page-code-block')).toBeVisible();
  }
  await page.getByRole('tab', { name: 'Guidance', exact: true }).click();
  await expect(previews).toHaveCount(routerSections.length);
  for (const preview of await previews.all()) await expect(preview).toBeVisible();
  await page.goto(new URL('templates/ReactRouterCardLink/', root).href);
  await page.waitForURL(/\/templates\/ReactRouter\/#guidance-card-link$/);
  await page.locator('[data-reference-ready="true"]').waitFor();
  await expect(page.locator('#guidance-card-link')).toBeInViewport();
  await screenshot('docsite-after-react-router.png');

  for (const route of ['foundations/Spacing/', 'foundations/Layout/', 'foundations/Surfaces/']) {
    await visit(route);
    await expect(page.getByRole('heading', { name: 'Page under construction' })).toBeVisible();
    await expect(page.locator('.work-in-progress__logo')).toBeVisible();
    await expect(page.locator('.work-in-progress canvas')).toBeVisible();
    await expect(page.locator('.work-in-progress h1')).toHaveCSS('opacity', '1');
    await expect(page.getByRole('link', { name: /Share a suggestion/ })).toBeVisible();
    await expect(page.locator('.reference-existing-guidance')).toHaveCount(0);
    await expect(page.locator('.standalone-guidance')).toHaveCount(0);
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
        titles: [...source.querySelectorAll('h2')]
          .filter((heading, index) => {
            if (index === 0) return true;
            for (let next = heading.nextElementSibling; next; next = next.nextElementSibling) {
              if (next.tagName === 'H2') return true;
              if (next.matches('.preview[data-example-id]')) return false;
            }
            return true;
          })
          .map((heading) => heading.textContent),
        code: [...source.querySelectorAll('pre code')].map((code) =>
          code.textContent.replace(/\n$/, ''),
        ),
        examples: source.querySelectorAll('.preview[data-example-id]').length,
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
      await page
        .locator('.reference-faqs-view .fui-CodeBlock')
        .evaluateAll((blocks) =>
          blocks.map((block) => block.querySelector('pre')?.textContent?.replace(/\n$/, '')),
        ),
      expected.code,
      `Code examples use CodeBlock and remain complete: ${route}`,
    );
    assert.equal(
      await page
        .locator('.reference-faqs-view pre')
        .evaluateAll((blocks) => blocks.filter((pre) => !pre.closest('.fui-CodeBlock')).length),
      0,
      `No raw code blocks: ${route}`,
    );
    await expect(
      page.locator('.reference-faqs-view blockquote, .reference-faqs-view hr'),
    ).toHaveCount(0);
    await expect(page.locator('.reference-faqs-view .guide-example:not(:empty)')).toHaveCount(
      expected.examples,
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
  await expect(
    page.locator('.page-summary a', { hasText: 'Full package changelog' }),
  ).toHaveAttribute(
    'href',
    'https://github.com/microsoft/coreai-design-system/blob/main/packages/react-components/CHANGELOG.md',
  );
  await expect(page.locator('.changelog-list')).toHaveCount(1);
  await expect(
    page.locator('.changelog-entry__version a', { hasText: 'Site update' }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Package release', exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /Build timestamps and dated documentation notes/ }),
  ).toHaveCount(1);
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
