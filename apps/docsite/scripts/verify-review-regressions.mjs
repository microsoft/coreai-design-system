// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createCustomBrand } from '../src/theme/custom-brand.mjs';

export async function verifyReviewRegressions(rootUrl, browser) {
  const root = new URL(rootUrl);
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  try {
    const page = await context.newPage();
    await page.addInitScript(() => {
      const replaceChildren = globalThis.Element.prototype.replaceChildren;
      globalThis.widgetPreviewTargets = [];
      globalThis.Element.prototype.replaceChildren = function (...children) {
        if (this.matches('[data-example-id]') && this.closest('[data-page-widget]'))
          globalThis.widgetPreviewTargets.push(this);
        return replaceChildren.apply(this, children);
      };
    });
    const open = async (route) => {
      await page.goto(new URL(route, root).href);
      await page.locator('[data-reference-ready="true"]').waitFor();
    };

    await open('foundations/Content/');
    assert.equal(
      await page.locator('.content-process-layout .content-publish-checklist > li').count(),
      7,
    );
    assert.equal(
      await page.locator('.content-flow--review').evaluate((flow) => {
        const style = globalThis.getComputedStyle(flow);
        const contentWidth =
          flow.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        return Math.abs(flow.lastElementChild.getBoundingClientRect().width - contentWidth) < 1;
      }),
      true,
    );

    const html = await (await fetch(root)).text();
    const index = await page.evaluate((source) => {
      const document = new globalThis.DOMParser().parseFromString(source, 'text/html');
      return JSON.parse(document.getElementById('reference-search-index').textContent);
    }, html);
    const changelog = index.find((entry) => entry.path === '/overview/Changelog/');
    assert.ok(changelog);
    assert.match(changelog.summary, /Full package changelog/);
    assert.doesNotMatch(changelog.summary, /\[|\]\(|https?:\/\//);

    for (const route of [
      'foundations/Theming/',
      'guides/StylingWithCssModules/',
      'guides/Migration/',
      'guides/VariationsFromFluent/',
    ]) {
      await open(route);
      const headers = page.locator(
        '[data-page-widget="guide-accordions"] .fui-AccordionItem > .fui-AccordionHeader',
      );
      assert.ok((await headers.count()) > 0, `${route}: guide sections are present.`);
      assert.ok(
        await headers.evaluateAll((elements) =>
          elements.every((element) => element.tagName === 'H2'),
        ),
        `${route}: every guide section retains its level-two heading.`,
      );
      if (route === 'foundations/Theming/') {
        await page.evaluate(
          () =>
            new Promise((resolve) =>
              globalThis.requestAnimationFrame(() => globalThis.requestAnimationFrame(resolve)),
            ),
        );
        const targets = await page.evaluate(() =>
          globalThis.widgetPreviewTargets.map((element) => ({
            connected: element.isConnected,
            children: element.childElementCount,
          })),
        );
        assert.ok(targets.length > 0, 'Theming includes widget-owned preview targets.');
        assert.ok(
          targets.every((target) => !target.connected && target.children === 0),
          'Detached widget preview targets do not receive React portals.',
        );
      }
    }

    await open('components/Button/');
    assert.equal(await page.locator('[data-basic-example] .preview .fui-Button').count(), 1);
    const skill = await (await fetch(new URL('source/package/SKILL.md', root))).text();
    const packageGuide = await (await fetch(new URL('guides/Package.md', root))).text();
    assert.match(skill, /overview\/Introduction\.md#working-with-agents/);
    assert.match(skill, /reject HTML when Markdown was expected/);
    assert.match(packageGuide, /overview\/Introduction\/#guidance-working-with-agents/);
    assert.doesNotMatch(
      `${skill}\n${packageGuide}`,
      /guides\/(?:AgentWorkflow|PackageSkill|UseWithAgents)/,
    );
  } finally {
    await context.close();
  }

  for (const [mode, color] of [
    ['light', '#0F6CBD'],
    ['dark', '#B43848'],
  ]) {
    const themeContext = await browser.newContext();
    try {
      await themeContext.addInitScript(
        ({ mode, color }) => {
          globalThis.localStorage.setItem('coreai-docsite-brand', 'custom');
          globalThis.localStorage.setItem('coreai-docsite-theme', mode);
          globalThis.localStorage.setItem('coreai-docsite-custom-color', color);
        },
        { mode, color },
      );
      await themeContext.route('**/*.js', (request) => request.abort());
      const themePage = await themeContext.newPage();
      await themePage.goto(root.href);
      assert.equal(await themePage.locator('html').getAttribute('data-brand'), 'custom');
      const expected = createCustomBrand(color)[mode];
      for (const token of ['colorBrandBackground', 'colorBrandForeground1']) {
        const actual = await themePage
          .locator('html')
          .evaluate(
            (element, token) =>
              globalThis.getComputedStyle(element).getPropertyValue(`--${token}`).trim(),
            token,
          );
        assert.equal(actual, expected[token], `${mode}: ${token} before hydration`);
      }
    } finally {
      await themeContext.close();
    }
  }

  console.log(
    'Content layout, search, guide headings, preview portals, custom themes, and agent links verified.',
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const browser = await chromium.launch();
  try {
    await verifyReviewRegressions(process.argv[2] ?? 'http://127.0.0.1:8081/', browser);
  } finally {
    await browser.close();
  }
}
