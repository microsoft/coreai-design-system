// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import {
  assertReferenceTextTokens,
  assertReferenceTypography,
} from './verify-reference-tokens.mjs';

const root = new URL(process.argv[2] ?? 'http://127.0.0.1:8080/');
const metadata = await (await fetch(new URL('llms/index.json', root))).json();
const isShowcaseResource = (resource) => {
  const hostname = new URL(resource.href ?? resource.url, root).hostname;
  return hostname.endsWith('figma.com') || hostname.includes('fluent');
};
const browser = await chromium.launch();
let tabbedPages = 0;
let checks = 0;
try {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const record of metadata.pages) {
    const url = new URL(record.htmlPath, root);
    const html = await (await fetch(url)).text();
    await page.goto(url.href);
    await page.locator('[data-reference-ready="true"]').waitFor();
    assert.equal(
      await page
        .locator('main')
        .getByText(/^(Page under construction|Guidance status|Component description)$/)
        .count(),
      0,
      `${record.id}: generated placeholder copy is removed`,
    );
    if (!record.renderer || ['colors', 'typography', 'materials'].includes(record.renderer)) {
      const guidanceHeadingSizes = await page
        .locator(
          '.component-markdown > :is(h2, h3), .standalone-guidance > :is(h2, h3), .standalone-guidance .guidance-section > :is(h2, h3)',
        )
        .evaluateAll((headings) => [
          ...new Set(
            headings
              .filter((heading) => !heading.closest('.do-dont-card'))
              .map((heading) => getComputedStyle(heading).fontSize),
          ),
        ]);
      assert.ok(
        guidanceHeadingSizes.length <= 1,
        `${record.id}: guidance headings use one visual size (${guidanceHeadingSizes.join(', ')})`,
      );
      assert.ok(
        guidanceHeadingSizes.every((size) => size === '16px'),
        `${record.id}: guidance headings use the 16px section-title size`,
      );
    }
    const tabs = page.locator('.reference-page-tabs');
    if (!(await tabs.count())) {
      assert.ok(record.standalone, `${record.id}: component and template pages have tabs`);
      continue;
    }
    tabbedPages++;
    const usage = page.locator('[data-page-panel="usage"]');
    const samples = page.locator('[data-page-panel="samples"]');
    assert.equal(
      await usage
        .locator('.guidance-section')
        .evaluateAll(
          (sections) =>
            sections.filter(
              (section) =>
                section.children.length === 1 &&
                /^H[1-6]$/.test(section.firstElementChild?.tagName ?? ''),
            ).length,
        ),
      0,
      `${record.id}: Usage has no headings orphaned by Samples`,
    );
    assert.equal(await tabs.getByRole('tab').count(), 2);
    for (const name of ['Usage', 'Code'])
      assert.equal(await tabs.getByRole('tab', { name, exact: true }).count(), 1);
    assert.equal(
      await tabs.getByRole('tab', { name: 'Usage' }).getAttribute('aria-selected'),
      'true',
    );
    assert.ok(await usage.isVisible());
    assert.ok(!(await samples.isVisible()));
    const bestPractices = usage.locator('#guidance-best-practices');
    if (await bestPractices.count()) {
      assert.equal(
        await bestPractices.evaluate((heading) => heading.tagName),
        'H3',
        `${record.id}: Best practices is an h3`,
      );
      assert.equal(
        await usage.locator('#guidance-best-practices + .do-dont-grid').count(),
        1,
        `${record.id}: Best practices keeps the Do/Don’t cards`,
      );
    }
    const hasShowcase = Boolean(record.defaultExampleId);
    const hasShowcaseOptions = Boolean(record.defaultExampleId) && record.examples.length > 1;
    const expandedFoundationCode =
      (await page.locator('[data-page-widget="colors"], [data-page-widget="typography"]').count()) >
      0;
    const showcaseResources = record.resources.filter(isShowcaseResource);
    assert.equal(
      await usage.locator('.reference-showcase-frame').count(),
      hasShowcase ? 1 : 0,
      `${record.id}: Default showcase uses the framed toolbar`,
    );
    assert.equal(
      await usage.locator('.reference-showcase-menu__trigger').count(),
      hasShowcaseOptions ? 1 : 0,
      `${record.id}: showcase menu matches available examples`,
    );
    if (hasShowcase) {
      assert.equal(
        await usage.locator('.reference-showcase-toolbar__action').count(),
        showcaseResources.length,
      );
      for (const resource of showcaseResources) {
        assert.equal(
          await usage.getByRole('link', { name: resource.label, exact: true }).count(),
          1,
        );
        assert.equal(
          await usage
            .locator('.component-resource-card')
            .filter({ hasText: resource.label })
            .count(),
          0,
        );
      }
    }
    if (hasShowcaseOptions) {
      const trigger = usage.getByRole('button', {
        name: `Choose ${record.title} example`,
        exact: true,
      });
      assert.equal(await trigger.count(), 1);
      assert.equal((await trigger.innerText()).trim(), record.examples[0].name);
    }
    assert.equal(
      await usage.locator('.reference-api, .reference-template-source, .source-actions').count(),
      0,
    );
    assert.ok(
      await usage
        .locator('pre')
        .evaluateAll((blocks) => blocks.every((block) => block.closest('[data-example-id]'))),
      `${record.id}: source belongs in Samples`,
    );
    const parity = await page.evaluate((sourceHtml) => {
      const original = new globalThis.DOMParser().parseFromString(sourceHtml, 'text/html');
      const sources = (document) =>
        [...document.querySelectorAll('pre')]
          .filter((element) => !element.closest('[data-example-id]'))
          .map((element) => element.textContent)
          .sort();
      const downloads = [
        ...new Set(
          [...original.querySelectorAll('pre')]
            .filter((element) => !element.closest('[data-example-id]'))
            .flatMap((element) => {
              const section = element.closest('.example, .reference-template-source');
              const link =
                element.previousElementSibling?.querySelector('a[href*="source/"]') ??
                section?.querySelector('a[href*="source/"]');
              return link ? [link.getAttribute('href')] : [];
            }),
        ),
      ].sort();
      return {
        original: sources(original),
        actual: sources(globalThis.document),
        downloads,
      };
    }, html);
    assert.deepEqual(
      parity.actual,
      parity.original,
      `${record.id}: every original code block survives`,
    );
    assert.equal(await page.locator('[data-example-id]').count(), record.examples.length);
    checks += await assertReferenceTextTokens(page, record.id);
    checks += await assertReferenceTypography(page, record.id);
    await tabs.getByRole('tab', { name: 'Code' }).click();
    assert.ok(await samples.isVisible());
    assert.ok(!(await usage.isVisible()));
    assert.equal(page.url(), url.href, 'Tab selection does not create another page');
    if (hasShowcase) {
      assert.ok(
        await samples
          .locator(
            `.reference-sample-group--examples .reference-sample-section:not([hidden]) .preview[data-example-id="${record.defaultExampleId}"]`,
          )
          .isVisible(),
        `${record.id}: the default sample shows its live preview`,
      );
    }
    const sampleGroups = await samples.locator('.reference-sample-group').evaluateAll((groups) =>
      groups.map((group) => ({
        options: group.querySelectorAll('.reference-sample-section').length,
        visible: [...group.querySelectorAll('.reference-sample-section')].filter(
          (section) => !section.hidden,
        ).length,
        menus: group.querySelectorAll('.reference-sample-menu__trigger').length,
      })),
    );
    if (expandedFoundationCode) {
      assert.equal(sampleGroups.length, 0, `${record.id}: Code blocks stay expanded`);
      assert.equal(
        await samples.locator('.reference-sample-section[hidden]').count(),
        0,
        `${record.id}: every Code section stays visible`,
      );
      assert.ok(
        !(await tabs.evaluate((element) => Boolean(element.closest('.reference-sample-group')))),
        `${record.id}: the Usage/Code switch stays outside Code cards`,
      );
    } else {
      assert.equal(
        await samples.locator(':scope > .reference-sample-section').count(),
        0,
        `${record.id}: Code sections are consolidated into compact groups`,
      );
      assert.ok(sampleGroups.length > 0 && sampleGroups.length <= 2);
      for (const group of sampleGroups) {
        assert.equal(group.visible, 1, `${record.id}: each Code group shows one option`);
        assert.equal(
          group.menus,
          group.options > 1 ? 1 : 0,
          `${record.id}: Code groups use a menu only when needed`,
        );
      }
    }
    assert.equal(
      await samples.locator('.reference-page-code-block').count(),
      parity.original.length,
      `${record.id}: every source uses the shared CodeBlock`,
    );
    assert.equal(
      await samples
        .locator('.reference-page-code-block')
        .locator('button[aria-label="Copy code"]')
        .count(),
      parity.original.length,
      `${record.id}: every CodeBlock has a copy action`,
    );
    assert.ok(
      await samples
        .locator('.reference-page-code-block code')
        .evaluateAll((blocks) =>
          blocks.every((block) =>
            [...block.classList].some((className) => className.startsWith('language-')),
          ),
        ),
      `${record.id}: every CodeBlock declares its syntax language`,
    );
    assert.ok(
      await samples
        .locator('.reference-page-code-block .fui-CodeBlock__pre')
        .evaluateAll((blocks) =>
          blocks.every((block) => {
            const style = getComputedStyle(block);
            return style.maxHeight === '480px' && style.overflowY === 'auto';
          }),
        ),
      `${record.id}: CodeBlocks scroll beyond 480px`,
    );
    assert.deepEqual(
      await samples
        .locator('.reference-sample-download')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href')).sort()),
      parity.downloads,
      `${record.id}: source downloads survive`,
    );
    assert.ok(
      await samples
        .locator('.reference-sample-download')
        .evaluateAll((links) => links.every((link) => link.hasAttribute('download'))),
      `${record.id}: source actions download their files`,
    );
    assert.equal(
      await samples
        .locator(
          '.reference-api, .reference-template-source, .reference-basic-source, .source-actions, details, summary, [data-copy-source], [data-copy-status]',
        )
        .count(),
      0,
      `${record.id}: Samples omit legacy source and API chrome`,
    );
    assert.equal(
      await samples.locator('.reference-sample-section > :is(p, h1, h2)').count(),
      0,
      `${record.id}: Samples omit loose prose and oversized headings`,
    );
    assert.ok(
      await samples
        .locator('.reference-sample-section')
        .evaluateAll((sections) =>
          sections.every((section) => /^H[3-6]$/.test(section.firstElementChild?.tagName ?? '')),
        ),
      `${record.id}: every Samples section starts with an h3-or-lower label`,
    );
    for (const value of ['usage', 'samples']) {
      const tab = tabs.getByRole('tab', { name: value === 'usage' ? 'Usage' : 'Code' });
      assert.equal(
        await tab.getAttribute('aria-controls'),
        await page.locator(`[data-page-panel="${value}"]`).getAttribute('id'),
      );
      assert.equal(
        await page.locator(`[data-page-panel="${value}"]`).getAttribute('aria-labelledby'),
        await tab.getAttribute('id'),
      );
    }
    const originalMarkdown = await (await fetch(new URL(record.markdownPath, root))).text();
    assert.match(
      originalMarkdown,
      new RegExp(`# ${record.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    );
    await tabs.getByRole('tab', { name: 'Usage' }).click();
    assert.equal(await page.locator('[data-preview-error]').count(), 0);
  }
  assert.ok(tabbedPages > 80, 'Cover the component, template, foundation and code-guide catalog');

  for (const mode of ['light', 'dark']) {
    await page.evaluate((mode) => localStorage.setItem('coreai-docsite-theme', mode), mode);
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of [
        'components/button/',
        'templates/empty-state/',
        'foundations/typography/',
        'components/tab-elevated/',
      ]) {
        await page.goto(new URL(route, root).href);
        await page.locator('[data-reference-ready="true"]').waitFor();
        const tabs = page.locator('.reference-page-tabs');
        await tabs.getByRole('tab', { name: 'Usage' }).focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        await page.waitForFunction(
          () => globalThis.document.querySelector('[data-page-panel="samples"]')?.hidden === false,
        );
        assert.equal(
          await tabs.getByRole('tab', { name: 'Code' }).getAttribute('aria-selected'),
          'true',
        );
        checks += await assertReferenceTextTokens(page, `${mode}/${width}/${route}`);
        checks += await assertReferenceTypography(page, `${mode}/${width}/${route}`);
        assert.ok(
          await tabs.evaluate((element) => {
            const box = element.getBoundingClientRect();
            return box.width > 0 && box.right <= globalThis.innerWidth;
          }),
        );
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('Enter');
        await page.waitForFunction(
          () => globalThis.document.querySelector('[data-page-panel="usage"]')?.hidden === false,
        );
      }
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(
    new URL('components/button/#source-components-button-button--default', root).href,
  );
  await page.locator('[data-reference-ready="true"]').waitFor();
  assert.ok(
    await page.locator('[data-page-panel="samples"]').isVisible(),
    'A source deep link opens Samples',
  );
  assert.ok(
    await page.locator('[id="source-components-button-button--default"]').isVisible(),
    'A source deep link reveals its selected sample',
  );
  await page
    .locator('[id="source-components-button-button--default"]')
    .getByRole('button', { name: 'Copy code', exact: true })
    .click();
  await page.waitForFunction(async () =>
    (await navigator.clipboard.readText()).includes(
      "import { Button } from '@coreai-ds/react-components'",
    ),
  );
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    await (
      await fetch(new URL('source/examples/components-button-button--default.tsx', root))
    ).text(),
  );
  await page.evaluate(() => {
    globalThis.location.hash = 'guidance-best-practices';
  });
  await page.waitForFunction(
    () => globalThis.document.querySelector('[data-page-panel="usage"]')?.hidden === false,
  );
  await page.goBack();
  await page.waitForFunction(
    () => globalThis.document.querySelector('[data-page-panel="samples"]')?.hidden === false,
  );
  await page.getByRole('button', { name: 'Copy for LLM', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Copy .md', exact: true }).click();
  await page.getByRole('button', { name: 'Copied', exact: true }).waitFor();
  assert.equal(
    (await page.evaluate(() => navigator.clipboard.readText())).trim(),
    (await (await fetch(new URL('components/button.md', root))).text()).trim(),
    'Copy .md includes both Usage and Samples',
  );

  await page
    .locator('.reference-page-tabs')
    .getByRole('tab', { name: 'Code', exact: true })
    .click();
  await page.reload();
  await page.locator('[data-reference-ready="true"]').waitFor();
  assert.ok(
    await page.locator('[data-page-panel="samples"]').isVisible(),
    'Reload preserves the selected tab for the current page',
  );

  const accordion = metadata.pages.find((record) => record.id === 'accordion');
  assert.ok(accordion && accordion.examples.length > 1);
  const alternateAccordion = accordion.examples[1];
  await page.goto(new URL(accordion.htmlPath, root).href);
  await page.locator('[data-reference-ready="true"]').waitFor();
  const accordionMenu = page.getByRole('button', {
    name: `Choose ${accordion.title} example`,
    exact: true,
  });
  await accordionMenu.click();
  assert.equal(await page.getByRole('menuitemradio').count(), accordion.examples.length);
  await page.getByRole('menuitemradio', { name: alternateAccordion.name, exact: true }).click();
  assert.equal((await accordionMenu.innerText()).trim(), alternateAccordion.name);
  assert.equal(
    await page.locator('[data-basic-example] > .preview').getAttribute('data-showcase-example'),
    alternateAccordion.id,
  );
  assert.equal(await page.locator('[data-basic-example] [data-preview-error]').count(), 0);
  await page.locator('.reference-page-tabs').getByRole('tab', { name: 'Code' }).click();
  const accordionSampleMenu = page
    .locator('[data-page-panel="samples"]')
    .getByRole('button', { name: `Choose ${accordion.title} sample`, exact: true });
  assert.equal((await accordionSampleMenu.innerText()).trim(), alternateAccordion.name);
  const accordionReferenceMenu = page
    .locator('[data-page-panel="samples"]')
    .getByRole('button', { name: 'Choose reference code', exact: true });
  await accordionReferenceMenu.click();
  await page.getByRole('menuitemradio', { name: 'AccordionHeader API', exact: true }).click();
  assert.equal((await accordionReferenceMenu.innerText()).trim(), 'AccordionHeader API');
  await page.locator('.reference-page-tabs').getByRole('tab', { name: 'Usage' }).click();
  const accordionFigma = accordion.resources.find((resource) =>
    new URL(resource.href ?? resource.url, root).hostname.endsWith('figma.com'),
  );
  assert.ok(accordionFigma);
  await page.getByRole('link', { name: accordionFigma.label, exact: true }).hover();
  await page.getByRole('tooltip', { name: accordionFigma.label, exact: true }).waitFor();

  await page.goto(new URL('components/dropdown/', root).href);
  await page.locator('[data-reference-ready="true"]').waitFor();
  await page.locator('.reference-page-tabs').getByRole('tab', { name: 'Code' }).click();
  const dropdownSampleMenu = page
    .locator('[data-page-panel="samples"]')
    .getByRole('button', { name: 'Choose Dropdown sample', exact: true });
  await dropdownSampleMenu.click();
  await page.getByRole('menuitemradio', { name: 'Inline Label', exact: true }).click();
  const dropdown = page
    .locator('[data-example-id="components-dropdown--inline-label"]')
    .getByRole('combobox')
    .first();
  await dropdown.click();
  await page.getByRole('option', { name: 'In progress', exact: true }).click();
  await page.locator('.reference-page-tabs').getByRole('tab', { name: 'Usage' }).click();
  await page.locator('.reference-page-tabs').getByRole('tab', { name: 'Code' }).click();
  assert.match(await dropdown.innerText(), /In progress/, 'Switching tabs preserves example state');
  await page.goto(new URL('tab-elevated/', root).href);
  await page.waitForURL(new URL('components/tab-elevated/', root).href);
  await page.locator('[data-reference-ready="true"]').waitFor();
  assert.equal(
    await page
      .locator('[data-example-id="components-tablist--elevated-appearance"] .fui-TabList')
      .count(),
    1,
  );
  assert.deepEqual(errors, [], 'No page errors');
  await context.close();
  const native = await browser.newContext({ javaScriptEnabled: false });
  const fallback = await native.newPage();
  await fallback.goto(new URL('components/button/', root).href);
  assert.equal(await fallback.locator('.reference-page-tabs').count(), 0);
  assert.ok(
    await fallback.getByRole('heading', { name: 'Best practices', exact: true }).isVisible(),
  );
  assert.ok(
    await fallback.getByRole('heading', { name: 'Implementation', exact: true }).isVisible(),
  );
  await native.close();
  console.log(
    `Page tabs: ${tabbedPages} pages, complete code parity, both themes, mobile/desktop, keyboard, deep links, clipboard, preserved example state, static fallback; ${checks} token/typography checks.`,
  );
} finally {
  await browser.close();
}
