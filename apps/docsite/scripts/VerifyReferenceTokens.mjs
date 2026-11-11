// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';

export async function assertReferenceTextTokens(page, label) {
  const result = await page.evaluate(() => {
    const document = globalThis.document;
    const alreadyTransitioning = document.documentElement.classList.contains('theme-transitioning');
    document.documentElement.classList.add('theme-transitioning');
    const host = document.querySelector('.coreai-docsite-provider') ?? document.documentElement;
    const hosts = [
      ...new Set([
        document.documentElement,
        host,
        ...document.querySelectorAll('.colors-theme-scope'),
      ]),
    ];
    const groups = [
      [
        1,
        '.page-header h1, .home-heading h1, .work-in-progress :is(h1,h2), .component-markdown :is(h1,h2,h3,h4,h5,h6,th), .standalone-guidance :is(h1,h2,h3,h4,h5,h6,th), .reference-color-view h3, .reference-resources-view :is(h2,h3), .reference-faqs-view h2, .reference-changelog-view :is(h2,h3,h4), .package-step__content > h3, .content-page :is(h2,h3), .agent-workflow-view :is(h2,h3), .type-table__example, .example > h2, .reference-template-source > h2',
      ],
      [2, '.fui-CodeBlock__pre'],
      [
        3,
        '.page-summary, .home-heading p, .work-in-progress p, .component-markdown :is(p,li,td), .standalone-guidance :is(p,li,td), .faq-answer :is(p,li), .content-example__body p, .content-guidance-list li, .content-publish-checklist li, .changelog-entry__section li, .resource-card p, .content-step__content > div, .package-step__content > div:not(.fui-CodeBlock), .reference-footer, .font-card__description, .primary-card--foreground .primary-card__meta, .stack-row__meta .fui-Text, .type-table__preset, .resource-card__destination .fui-Text, .reference-api > details > summary span',
      ],
      [4, '.font-card__token, .font-card__sample-suffix'],
    ];
    const originals = hosts.flatMap((element) =>
      groups.map(([level]) => {
        const name = `--colorNeutralForeground${level}`;
        return [
          element,
          name,
          element.style.getPropertyValue(name),
          element.style.getPropertyPriority(name),
        ];
      }),
    );
    const probe = document.createElement('span');
    probe.hidden = true;
    host.append(probe);
    const failures = [];
    let checks = 0;
    function inspect(phase) {
      for (const [level, selector] of groups) {
        probe.style.color = `var(--colorNeutralForeground${level})`;
        const expected = globalThis.getComputedStyle(probe).color;
        for (const element of document.querySelectorAll(selector)) {
          if (element.closest('[data-example-id], .preview')) continue;
          checks++;
          const actual = globalThis.getComputedStyle(element).color;
          if (actual !== expected) {
            failures.push({
              phase,
              role: `Foreground ${level}`,
              element: `${element.tagName.toLowerCase()}.${element.classList[0] ?? ''}`,
              text: element.textContent.trim().slice(0, 65),
              actual,
              expected,
            });
          }
        }
      }
    }
    try {
      inspect('theme');
      // Changing tokens proves the binding, not just a matching current hex value.
      hosts.forEach((element) =>
        groups.forEach(([level]) =>
          element.style.setProperty(
            `--colorNeutralForeground${level}`,
            `rgb(${level * 20}, ${level * 30}, ${level * 40})`,
          ),
        ),
      );
      inspect('binding');
    } finally {
      probe.remove();
      originals.forEach(([element, name, value, priority]) => {
        if (value) element.style.setProperty(name, value, priority);
        else element.style.removeProperty(name);
      });
      globalThis.getComputedStyle(host).color;
      if (!alreadyTransitioning) document.documentElement.classList.remove('theme-transitioning');
    }
    return { checks, failures };
  });
  assert.deepEqual(result.failures, [], `${label}: CoreAI text roles and live token bindings`);
  assert.ok(result.checks > 0, `${label}: documentation text was checked`);
  return result.checks;
}

export async function assertReferenceTypography(page, label) {
  await page.evaluate(() => globalThis.document.fonts.ready);
  const result = await page.evaluate(() => {
    const document = globalThis.document;
    const host = document.querySelector('.coreai-docsite-provider') ?? document.documentElement;
    const probe = document.createElement('span');
    probe.hidden = true;
    host.append(probe);
    const groups = [
      ['.page-header h1, .home-heading h1', 'Hero900', 'Regular'],
      ['.page-summary, .home-heading p', 'Base400', 'Regular'],
      ['.work-in-progress :is(h1,h2)', 'Base600', 'Semibold'],
      ['.work-in-progress p', 'Base300', 'Regular'],
      [
        '.component-markdown :is(p,li), .standalone-guidance :is(p,li), .faq-answer :is(p,li), .content-example__body p, .content-guidance-list li, .fui-CodeBlock__pre, .reference-api pre, .reference-basic-source pre',
        'Base300',
        'Regular',
      ],
      ['.example > h2, .reference-template-source > h2', 'Base500', 'Semibold'],
      ['.reference-api__content > h3', 'Base400', 'Semibold'],
    ];
    const headingSizes = ['Hero700', 'Base600', 'Base500', 'Base400', 'Base300', 'Base200'];
    headingSizes.forEach((size, index) =>
      groups.push([
        `.component-markdown h${index + 1}:not(.fui-Text), .standalone-guidance h${index + 1}:not(.fui-Text)`,
        size,
        'Semibold',
      ]),
    );
    const failures = [];
    let checks = 0;
    try {
      for (const [selector, defaultSize, weight] of groups) {
        for (const element of document.querySelectorAll(selector)) {
          if (element.closest('[data-example-id], .preview')) continue;
          let size = defaultSize;
          if (
            element.matches(
              '.reference-page-panel[data-page-panel="usage"] > .component-markdown > :is(h2,h3), .standalone-guidance .guidance-section > :is(h2,h3)',
            )
          ) {
            size = 'Base400';
          }
          if (element.closest('.reference-page--compact-guidance')) {
            if (element.tagName === 'H2') size = 'Base400';
            if (element.tagName === 'H3') size = 'Base400';
          }
          if (
            element.matches(
              '.reference-page--compact-guidance:has([data-page-widget="includes"]) .standalone-guidance h2',
            )
          )
            size = 'Base500';
          if (element.matches('.resource-card p')) size = 'Base200';
          if (element.matches('.do-dont-card > h3')) size = 'Base400';
          const family = element.tagName === 'PRE' ? 'Monospace' : 'Base';
          probe.style.fontSize = element.matches('.intro-feature-copy p')
            ? '13px'
            : `var(--fontSize${size})`;
          probe.style.lineHeight = `var(--lineHeight${size})`;
          probe.style.fontWeight = `var(--fontWeight${weight})`;
          probe.style.fontFamily = `var(--fontFamily${family})`;
          const expected = globalThis.getComputedStyle(probe);
          const actual = globalThis.getComputedStyle(element);
          for (const property of ['fontSize', 'lineHeight', 'fontWeight', 'fontFamily']) {
            checks++;
            if (actual[property] !== expected[property])
              failures.push({
                text: element.textContent.trim().slice(0, 50),
                property,
                actual: actual[property],
                expected: expected[property],
              });
          }
          if (!document.querySelector('.coreai-docsite-provider')) continue;
          const compactBody =
            element.closest('.reference-page--compact-guidance .standalone-guidance') &&
            element.matches('p, ul, ol, strong');
          const pixels = Number.parseFloat(actual.fontSize);
          const threshold = Number.parseFloat(actual.getPropertyValue('--fui-tracking-threshold'));
          const ramp = Number.parseFloat(actual.getPropertyValue('--fui-tracking-ramp'));
          const tracking = compactBody
            ? 0
            : Math.max(0.01, 0.01 + (threshold - pixels) * ramp) * pixels;
          const actualTracking =
            actual.letterSpacing === 'normal' ? 0 : Number.parseFloat(actual.letterSpacing);
          checks++;
          if (Math.abs(actualTracking - tracking) > 0.001)
            failures.push({
              text: element.textContent.trim().slice(0, 50),
              property: 'letterSpacing',
              actual: actualTracking,
              expected: tracking,
            });
        }
      }
    } finally {
      probe.remove();
    }
    return { checks, failures };
  });
  assert.deepEqual(result.failures, [], `${label}: CoreAI typography metrics`);
  assert.ok(result.checks > 0, `${label}: typography was checked`);
  return result.checks;
}

async function main() {
  const root = new URL(process.argv[2] ?? 'http://127.0.0.1:8080/');
  const response = await fetch(new URL('llms/index.json', root));
  assert.ok(response.ok, 'Built reference metadata must be available');
  const metadata = await response.json();
  const samples = new Map();
  for (const record of metadata.pages) {
    const key = record.standalone
      ? `${record.kind}/${record.renderer ?? 'guidance'}/${record.layout ?? 'default'}`
      : record.kind;
    if (!samples.has(key)) samples.set(key, record);
  }
  const browser = await chromium.launch();
  let checks = 0;
  try {
    for (const mode of ['light', 'dark']) {
      const theme = mode === 'dark' ? coreaiDarkTheme : coreaiLightTheme;
      const fallback = await browser.newContext({ javaScriptEnabled: false, colorScheme: mode });
      const nativePage = await fallback.newPage();
      await nativePage.goto(root.href);
      assert.equal(
        await nativePage
          .locator('html')
          .evaluate((element) =>
            globalThis
              .getComputedStyle(element)
              .getPropertyValue('--colorNeutralForeground2')
              .trim(),
          ),
        theme.colorNeutralForeground2,
        `${mode}: canonical tokens exist before JavaScript`,
      );
      checks += await assertReferenceTextTokens(nativePage, `${mode}/static-home`);
      checks += await assertReferenceTypography(nativePage, `${mode}/static-home`);
      await fallback.close();

      const context = await browser.newContext({
        colorScheme: mode === 'dark' ? 'light' : 'dark',
      });
      await context.addInitScript(
        (savedMode) => localStorage.setItem('coreai-docsite-theme', savedMode),
        mode,
      );
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      for (const record of samples.values()) {
        await page.goto(new URL(record.htmlPath, root).href);
        await page.locator('[data-reference-ready="true"]').waitFor();
        checks += await assertReferenceTextTokens(page, `${mode}/${record.id}`);
        checks += await assertReferenceTypography(page, `${mode}/${record.id}`);
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(root.href);
      await page.locator('.home-heading h1.fui-Text').waitFor();
      checks += await assertReferenceTextTokens(page, `${mode}/mobile-home`);
      checks += await assertReferenceTypography(page, `${mode}/mobile-home`);
      assert.equal(await page.locator('html').getAttribute('data-theme'), mode);
      assert.deepEqual(errors, [], `${mode}: browser errors`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
  console.log(
    `CoreAI audit: ${samples.size} representative page types in both themes, static and mobile Home, ${checks} foreground, binding and typography checks.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
