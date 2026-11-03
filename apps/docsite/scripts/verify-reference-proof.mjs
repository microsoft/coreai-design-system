// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  assertReferenceTextTokens,
  assertReferenceTypography,
} from './verify-reference-tokens.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { chromium } from 'playwright';
import matter from 'gray-matter';
import { guidanceMarkdown } from '../../../shared/guidance.mjs';
import {
  appRoot,
  outputDirectory,
  codeFence,
  escapeHtml,
  normalizeSource,
  providerSource,
  resolveStandalonePage,
  standalonePageHtml,
  pageMarkdown,
  componentPageGuidanceHtml,
} from './build-reference-proof.mjs';
import { standaloneSections } from './standalone-sections.mjs';
import { componentApiSource } from './sources/component-api.mjs';
import { serveReferenceProof } from './serve-reference-proof.mjs';

const require = createRequire(import.meta.url);
const metadata = JSON.parse(
  await fs.readFile(path.join(outputDirectory, 'llms/index.json'), 'utf8'),
);
const allExamples = [
  ...new Map(
    metadata.pages.flatMap((page) => page.examples).map((example) => [example.id, example]),
  ).values(),
];

async function installedPackageDirectory(name) {
  let filename;
  try {
    filename = require.resolve(`${name}/package.json`);
  } catch (error) {
    if (error.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') throw error;
    let directory = path.dirname(require.resolve(name));
    while (directory !== path.dirname(directory)) {
      try {
        const manifest = JSON.parse(
          await fs.readFile(path.join(directory, 'package.json'), 'utf8'),
        );
        if (manifest.name === name) return directory;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      directory = path.dirname(directory);
    }
    throw new Error(`Cannot locate installed dependency: ${name}`, { cause: error });
  }
  return path.dirname(filename);
}

async function verifyConsumerPackage() {
  assert.ok(
    process.env.npm_execpath,
    'Run this check with npm --workspace apps/docsite run verify:reference-proof.',
  );
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'coreai-reference-consumer-'));
  try {
    const packageRoot = path.resolve(appRoot, '../../packages/react-components');
    const result = execFileSync(
      process.execPath,
      [
        process.env.npm_execpath,
        'pack',
        '--ignore-scripts',
        '--json',
        '--pack-destination',
        directory,
      ],
      { cwd: packageRoot, encoding: 'utf8' },
    );
    const [{ filename }] = JSON.parse(result);
    execFileSync('tar', ['-xzf', path.join(directory, filename), '-C', directory]);
    const consumerPackage = path.join(directory, 'node_modules/@coreai-ds/react-components');
    await fs.mkdir(path.dirname(consumerPackage), { recursive: true });
    await fs.cp(path.join(directory, 'package'), consumerPackage, { recursive: true });
    const manifest = JSON.parse(
      await fs.readFile(path.join(consumerPackage, 'package.json'), 'utf8'),
    );
    const dependencies = new Set([
      ...Object.keys(metadata.versions),
      ...Object.keys(manifest.dependencies),
      '@types/react',
      '@types/react-dom',
      ...(metadata.versions['react-window'] ? ['@types/react-window'] : []),
    ]);
    dependencies.delete('@coreai-ds/react-components');
    for (const name of dependencies) {
      const target = path.join(directory, 'node_modules', name);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.symlink(await installedPackageDirectory(name), target, 'junction');
    }
    await fs.writeFile(path.join(directory, 'package.json'), '{"private":true,"type":"module"}');
    await fs.mkdir(path.join(directory, 'examples'));
    const files = [];
    const bindings = [];
    for (const [index, example] of allExamples.entries()) {
      const filename = path.basename(example.sourcePath);
      const target = path.join(directory, 'examples', filename);
      await fs.copyFile(path.join(outputDirectory, example.sourcePath), target);
      files.push(target);
      bindings.push(`import Example${index} from './examples/${path.basename(filename, '.tsx')}';`);
    }
    for (const page of metadata.pages) {
      for (const source of page.templateSources) {
        const target = path.join(directory, 'templates', page.id, source.name);
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.copyFile(path.join(outputDirectory, source.path), target);
        files.push(target);
      }
    }
    await fs.writeFile(
      path.join(directory, 'Example.tsx'),
      `export { default } from './examples/${path.basename(allExamples[0].sourcePath, '.tsx')}';\n`,
    );
    await fs.writeFile(path.join(directory, 'App.tsx'), providerSource);
    const consumer = path.join(directory, 'Consumer.tsx');
    await fs.writeFile(
      consumer,
      `import type { ComponentType } from 'react';\n${bindings.join('\n')}\nexport const examples = [${allExamples.map((_, index) => `Example${index}`).join(',')}] satisfies ComponentType[];\n`,
    );
    files.push(consumer, path.join(directory, 'App.tsx'), path.join(directory, 'Example.tsx'));
    const program = ts.createProgram(files, {
      noEmit: true,
      strict: true,
      skipLibCheck: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      types: ['react', 'react-dom'],
      typeRoots: [path.join(directory, 'node_modules/@types')],
    });
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(
      diagnostics.length,
      0,
      ts.formatDiagnostics(diagnostics, {
        getCanonicalFileName: (filename) => filename,
        getCurrentDirectory: () => directory,
        getNewLine: () => '\n',
      }),
    );
    console.log(
      `Consumer check: ${allExamples.length} examples, template source and provider setup compile against the packed npm artifact, without workspace paths.`,
    );
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

await verifyConsumerPackage();
const sourceExamples = new Map(
  await Promise.all(
    allExamples.map(async (example) => [
      example.id,
      {
        ...example,
        source: await fs.readFile(path.join(outputDirectory, example.sourcePath), 'utf8'),
      },
    ]),
  ),
);
const generatedSections = await standaloneSections({
  appRoot,
  pages: metadata.pages,
  versions: metadata.versions,
  providerSource,
  fence: codeFence,
});
const server = await serveReferenceProof({ port: 0 });
const address = server.httpServer.address();
assert.ok(address && typeof address !== 'string');
const origin = `http://127.0.0.1:${address.port}`;
const root = `${origin}${metadata.basePath}`;
let browser;
try {
  const get = async (relative) => {
    const response = await fetch(`${root}${relative}`);
    assert.equal(response.status, 200, relative);
    return response.text();
  };
  await get('');
  await get('guides/package/');
  assert.match(await get('guides/package.md'), /CoreAIFluentProvider/);
  assert.match(
    await get('llms.txt'),
    new RegExp(metadata.versions['@fluentui/react-components'].replaceAll('.', '\\.')),
  );
  assert.match(await get('THIRD-PARTY-NOTICES.txt'), /Permission is hereby granted/);
  assert.equal(
    await get('source/package/SKILL.md'),
    await fs.readFile(
      path.resolve(appRoot, '../../packages/react-components/agent/SKILL.md'),
      'utf8',
    ),
  );
  const starter = (
    await fs.readFile(path.join(appRoot, 'content/data/agent-prompt.md'), 'utf8')
  ).trim();
  assert.equal(await get('agent-prompt.txt'), starter);
  assert.equal(metadata.agentPrompt, starter);
  const agentIndex = await get('llms.txt');
  assert.match(agentIndex, /Fetch this index once per task/);
  assert.match(agentIndex, /guides\/use-with-agents\.md/);
  assert.match(agentIndex, /source\/package\/SKILL\.md/);
  assert.equal((await fetch(`${root}components/not-a-page/`)).status, 404);
  assert.equal((await fetch(`${root}components/not-a-page.md`)).status, 404);
  await fs.access(path.join(outputDirectory, '.nojekyll'));
  const included = metadata.coverage.filter((entry) => entry.status === 'included');
  assert.equal(included.length, allExamples.length);
  assert.ok(
    metadata.coverage.every((entry) => ['included', 'replaced', 'excluded'].includes(entry.status)),
  );
  assert.ok(metadata.coverage.every((entry) => entry.status === 'included' || entry.reason));
  assert.equal(new Set(allExamples.map((example) => example.id)).size, allExamples.length);
  for (const name of ['react', 'react-dom', '@fluentui/react-components']) {
    assert.deepEqual(metadata.runtimePackages[name], {
      version: metadata.versions[name],
      installations: 1,
    });
  }

  for (const page of metadata.pages) {
    const html = await get(page.htmlPath);
    const markdown = await get(page.markdownPath);
    assert.doesNotMatch(
      markdown,
      /\bMCP\b|docs-list|docs-show|azurewebsites\.net\/mcp/i,
      `${page.id}: no retired agent integration guidance`,
    );
    const authored = matter(await fs.readFile(path.join(appRoot, page.guidanceSource), 'utf8'));
    assert.deepEqual(page.resources, authored.data.resources ?? []);
    assert.equal(
      page.renderer,
      authored.data.reference?.renderer,
    );
    const guidance = guidanceMarkdown({ ...authored.data, body: authored.content.trim() });
    if (page.standalone) {
      const expected = {
        ...page,
        ...(await resolveStandalonePage(
          { ...page, guidance },
          {
            pages: metadata.pages,
            basePath: metadata.basePath,
            generated: generatedSections,
            allExamples: sourceExamples,
          },
        )),
      };
      assert.equal(
        markdown,
        pageMarkdown(expected, metadata),
        `${page.id}: complete authored/resolved Markdown`,
      );
      assert.ok(
        html.includes(standalonePageHtml(expected, metadata)),
        `${page.id}: complete HTML counterpart`,
      );
    } else {
      const expected = {
        ...page,
        guidance,
        examples: page.examples.map((example) => sourceExamples.get(example.id)),
        templateSources: await Promise.all(
          page.templateSources.map(async (source) => ({
            ...source,
            source: await get(source.path),
          })),
        ),
      };
      assert.equal(
        markdown,
        pageMarkdown(expected, metadata),
        `${page.id}: complete Default/API/guidance/source Markdown`,
      );
      assert.equal(page.examples[0].id, page.defaultExampleId);
      assert.equal(page.examples[0].exportName, 'Default');
      if (page.kind === 'components')
        assert.ok(page.api.length > 0, `${page.id}: public API coverage`);
      assert.doesNotMatch(
        JSON.stringify(page.api),
        /import\(["'](?:[A-Z]:|\/)|[/\\]node_modules[/\\]/,
      );
      assert.ok(
        html.includes(componentPageGuidanceHtml(expected, metadata)),
        `${page.id}: templated guidance and resources in HTML`,
      );
    }
    assert.doesNotMatch(markdown, /<!--\s*(?:include|generated|example|live-example|\/?view):/);
    for (const alias of page.aliases) {
      assert.ok((await get(alias.slice(1))).includes(`${metadata.basePath}${page.htmlPath}`));
      assert.equal(await get(`${alias.slice(1, -1)}.md`), markdown);
    }
    for (const id of page.legacyIds) assert.equal(await get(`llms/${id}.md`), markdown);
    for (const example of page.examples) {
      const source = await get(example.sourcePath);
      assert.equal(createHash('sha256').update(source).digest('hex'), example.sha256);
      assert.ok(markdown.includes(codeFence(source)), `${example.id}: Markdown source parity`);
      if (!page.standalone)
        assert.ok(html.includes(escapeHtml(source)), `${example.id}: HTML source parity`);
      assert.doesNotMatch(source, /from\s+['"](?:@storybook\/|storybook|\.{1,2}\/)/);
      assert.doesNotMatch(source, /from\s+['"]@fluentui\/react-components['"]/);
    }
    for (const template of page.templateSources) {
      const source = await get(template.path);
      assert.ok(markdown.includes(codeFence(source)));
      assert.ok(html.includes(escapeHtml(source)));
    }
  }
  console.log(
    `Static HTTP check: ${metadata.pages.length} paired pages, setup, raw TSX, guidance/source parity, 404s, coverage, licenses and base path ${metadata.basePath}.`,
  );

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
  const page = await context.newPage();
  await page.addInitScript(() => {
    globalThis.referencePaintProblems = [];
    function inspectFrame() {
      const document = globalThis.document;
      const theme = document.documentElement.dataset.theme;
      if (theme === 'light' || theme === 'dark') {
        const background = globalThis.getComputedStyle(document.documentElement).backgroundColor;
        if (background !== (theme === 'dark' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)'))
          globalThis.referencePaintProblems.push('Wrong initial theme background');
      }
      globalThis.requestAnimationFrame(inspectFrame);
    }
    globalThis.requestAnimationFrame(inspectFrame);
  });
  async function setTheme(mode) {
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    const settings = page.locator('.docsite-settings');
    await settings
      .getByRole('tab', { name: mode === 'dark' ? 'Dark' : 'Light', exact: true })
      .click();
    await page.keyboard.press('Escape');
    await settings.waitFor({ state: 'hidden' });
    await page.waitForFunction(
      (expected) => globalThis.document.documentElement.dataset.theme === expected,
      mode,
    );
  }
  async function setBrand(brand) {
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    const settings = page.locator('.docsite-settings');
    await settings
      .getByRole('combobox', { name: 'Product color palette', exact: true })
      .click();
    await page
      .getByRole('option', {
        name: brand === 'azure' ? 'Azure blue' : 'CoreAI purple',
        exact: true,
      })
      .click();
    await page.keyboard.press('Escape');
    await settings.waitFor({ state: 'hidden' });
  }
  const errors = [];
  const pageProblems = [];
  const expectedNavigationErrors = [];
  const checkedDocumentLinks = new Set();
  let simulatingNavigationFailure = false;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      if (
        simulatingNavigationFailure &&
        /503|Could not load documentation page/.test(message.text())
      )
        expectedNavigationErrors.push(message.text());
      else errors.push(message.text());
    }
  });
  for (const record of metadata.pages) {
    await page.goto(`${root}${record.htmlPath}`);
    try {
      await page.waitForFunction(
        () =>
          globalThis.document.querySelector('[data-reference-ready="true"]') &&
          [...globalThis.document.querySelectorAll('[data-example-id]')].every(
            (container) => container.children.length > 0,
          ),
      );
    } catch (error) {
      throw new Error(
        `${record.id}: page did not become ready. Preview errors: ${JSON.stringify(await page.locator('[data-preview-error]').allTextContents())}. Browser errors: ${errors.slice(-5).join('; ')}`,
        { cause: error },
      );
    }
    await assertReferenceTextTokens(page, record.id);
    await assertReferenceTypography(page, record.id);
    assert.equal(await page.locator('[data-example-id]').count(), record.examples.length);
    if (record.id === 'introduction') {
      const resourceSections = page.locator('.reference-resources-view .page-section');
      assert.equal(await resourceSections.count(), 1);
      assert.equal(await resourceSections.locator('> h2, > h3').count(), 0);
      const resourceLinks = resourceSections.locator('.resources-grid > .fui-Link');
      assert.equal(await resourceLinks.count(), 3);
      assert.equal(await resourceSections.locator('.fui-Card').count(), 3);
      assert.equal(await resourceSections.locator('[class*="resource-card"]').count(), 0);
      assert.ok(
        await resourceLinks.evaluateAll((cards) =>
          cards.every(
            (card) =>
              card.tagName === 'A' &&
              card.classList.contains('fui-Link') &&
              card.firstElementChild?.classList.contains('fui-Card'),
          ),
        ),
      );
    }
    if (!record.standalone) {
      const expectedCodeBlocks = (html.match(/<pre>/g) ?? []).length;
      const expectedDownloads = (html.match(/class="source-actions"/g) ?? []).length;
      assert.equal(
        await page.locator('[data-example-id]').first().getAttribute('data-example-id'),
        record.defaultExampleId,
      );
      const order = await page
        .locator('[data-page-panel="usage"]')
        .evaluate((element) =>
          [...element.children].map((child) =>
            child.hasAttribute('data-page-header')
              ? 'header'
              : child.hasAttribute('data-basic-example')
                ? 'default'
                : child.classList.contains('reference-api')
                  ? 'api'
                  : child.classList.contains('component-markdown')
                    ? 'guidance'
                    : 'resources',
          ),
        );
      assert.equal(order[0], 'default');
      assert.ok(order.indexOf('guidance') > order.indexOf('default'));
      if (order.includes('resources')) {
        assert.ok(order.indexOf('resources') > order.indexOf('default'));
        assert.ok(order.indexOf('resources') < order.indexOf('guidance'));
      }
      if (record.api.length) {
        assert.equal(
          await page
            .locator('[data-page-panel="samples"] .reference-sample-section')
            .filter({ has: page.getByRole('heading', { name: / API$/, includeHidden: true }) })
            .count(),
          record.api.length,
        );
      }
      assert.ok(
        await page
          .locator('[data-page-panel="usage"] pre')
          .evaluateAll((blocks) => blocks.every((block) => block.closest('[data-example-id]'))),
        `${record.id}: only live preview content can contain code in Usage`,
      );
      assert.equal(
        await page.locator('[data-page-panel="samples"] .reference-page-code-block').count(),
        expectedCodeBlocks,
      );
      assert.equal(
        await page
          .locator('[data-page-panel="samples"] .reference-page-code-block')
          .getByRole('button', { name: 'Copy code', exact: true })
          .count(),
        expectedCodeBlocks,
      );
      assert.equal(
        await page
          .locator(
            '[data-page-panel="samples"] .reference-api, [data-page-panel="samples"] .reference-basic-source, [data-page-panel="samples"] .source-actions',
          )
          .count(),
        0,
      );
      assert.equal(
        await page.locator('[data-page-panel="samples"] .reference-sample-download').count(),
        expectedDownloads,
      );
      assert.equal(
        await page
          .locator('[data-page-panel="samples"] .reference-page-code-block .fui-CodeBlock__pre')
          .evaluateAll(
            (blocks) =>
              blocks.filter((block) => getComputedStyle(block).maxHeight === '480px').length,
          ),
        expectedCodeBlocks,
      );
      assert.equal(
        await page
          .locator('[data-page-panel="samples"] .reference-page-code-block code')
          .evaluateAll(
            (blocks) =>
              blocks.filter((block) =>
                [...block.classList].some((className) => className.startsWith('language-')),
              ).length,
          ),
        expectedCodeBlocks,
      );
      assert.equal(
        await page
          .locator('.reference-page-tabs')
          .getByRole('tab', { name: 'Usage', selected: true })
          .count(),
        1,
      );
      for (const member of record.api) {
        assert.equal(
          await page
            .locator('[data-page-panel="samples"] .reference-sample-section')
            .filter({
              has: page.getByRole('heading', {
                name: `${member.name} API`,
                exact: true,
                includeHidden: true,
              }),
            })
            .getByRole('heading', {
              name: `${member.name} API`,
              exact: true,
              includeHidden: true,
            })
            .count(),
          1,
        );
      }
      assert.deepEqual(
        await Promise.all(
          record.api.map(async (member) =>
            (
              await page
                .locator('[data-page-panel="samples"] .reference-sample-section')
                .filter({
                  has: page.getByRole('heading', {
                    name: `${member.name} API`,
                    exact: true,
                    includeHidden: true,
                  }),
                })
                .locator('code')
                .textContent()
            ).trimEnd(),
          ),
        ),
        record.api.map(componentApiSource),
        `${record.id}: complete interface/function API code`,
      );
    }
    const hiddenHeader = ['home', 'work-in-progress'].includes(record.renderer);
    if (!hiddenHeader) {
      assert.equal(
        await page.locator('.page-header h1.fui-Text').count(),
        1,
        `${record.id}: CoreAI page title`,
      );
      assert.ok(
        (await page.locator('.page-header .page-summary').innerText()).trim().length > 0,
        `${record.id}: visible summary`,
      );
    }
    assert.equal(
      await page.getByRole('button', { name: 'Copy for LLM', exact: true }).count(),
      hiddenHeader ? 0 : 1,
    );
    assert.equal(
      await page
        .locator('nav[aria-label="Documentation"] [role="tab"][aria-selected="true"]')
        .count(),
      1,
      `${record.id}: active navigation`,
    );
    for (const link of await page
      .locator('nav[aria-label="Documentation"] a')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')))) {
      assert.ok(link?.startsWith(metadata.basePath), `${record.id}: base-aware navigation ${link}`);
    }
    if (record.singlePreview) {
      for (const example of record.examples) {
        const container = page.locator(`[data-example-id="${example.id}"]`);
        const panel = await container.evaluate((element) =>
          element.closest('[data-page-panel]')?.getAttribute('data-page-panel'),
        );
        if (panel)
          await page
            .locator('.reference-page-tabs')
            .getByRole('tab', { name: panel === 'usage' ? 'Usage' : 'Samples', exact: true })
            .click();
        const run = container.getByRole('button', { name: 'Run this example', exact: true });
        if (await run.count()) await run.click();
        assert.equal(await run.count(), 0, `${example.id}: activated preview`);
        assert.equal(await container.locator('[data-preview-error]').count(), 0);
      }
    }
    assert.equal(
      await page.locator('#reference-root > .coreai-docsite-provider').count(),
      1,
      `${record.id}: one app-level provider`,
    );
    const previewErrors = await page.locator('[data-preview-error]').count();
    if (previewErrors)
      pageProblems.push(
        `${record.id}: failed previews ${JSON.stringify(await page.locator('[data-preview-error]').evaluateAll((elements) => elements.map((element) => element.closest('[data-example-id]')?.getAttribute('data-example-id'))))}; ${errors.slice(-4).join('\n')}`,
      );
    const duplicateIds = await page.evaluate(() => {
      const ids = [...globalThis.document.querySelectorAll('[id]')].map((element) => element.id);
      return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    });
    if (duplicateIds.length)
      pageProblems.push(`${record.id}: duplicate IDs ${duplicateIds.join(', ')}`);
    for (const example of record.examples) {
      if (record.standalone)
        assert.ok(
          (await page.locator('pre code').allTextContents()).includes(
            await get(example.sourcePath),
          ),
          `${record.id}: embedded source parity`,
        );
      else
        assert.equal(
          await page.locator(`[id="source-${example.id}"]`).textContent(),
          await get(example.sourcePath),
        );
    }
    if (record.standalone) {
      const links = await page
        .locator('.standalone-guidance a[href], .standalone-guidance img[src]')
        .evaluateAll((elements) =>
          elements
            .filter((element) => !element.closest('[data-example-id]'))
            .map((element) => (element.tagName === 'IMG' ? element.src : element.href)),
        );
      for (const href of links) {
        const url = new URL(href);
        if (url.origin !== origin || checkedDocumentLinks.has(href)) continue;
        checkedDocumentLinks.add(href);
        const response = await fetch(href);
        assert.equal(response.status, 200, `${record.id}: local documentation link ${href}`);
        if (url.hash && response.headers.get('content-type')?.includes('text/html')) {
          assert.ok(
            (await response.text()).includes(`id="${decodeURIComponent(url.hash.slice(1))}"`),
            `${record.id}: target fragment ${href}`,
          );
        }
      }
    }
    assert.deepEqual(pageProblems, [], 'Whole-catalog page checks');
  }

  await page.goto(`${root}colors/`);
  await page.waitForURL(`${root}foundations/colors/`);
  await page.locator('[data-reference-ready="true"]').waitFor();
  const themes = await import('@coreai-ds/react-components');
  await page.getByRole('heading', { name: 'Colors', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const settings = page.locator('.docsite-settings');
  const colorMode = settings.getByRole('tablist', { name: 'Color mode', exact: true });
  const appearanceSettings = settings.locator('.docsite-settings__appearance');
  const productThemeLabel = settings.getByText('Product color palette', { exact: true });
  const productTheme = settings.getByRole('combobox', {
    name: 'Product color palette',
    exact: true,
  });
  assert.equal(
    await settings.evaluate((element) => element.scrollWidth),
    await settings.evaluate((element) => element.clientWidth),
    'Settings popover does not overflow horizontally',
  );
  assert.equal(
    await appearanceSettings.evaluate((element) => getComputedStyle(element).rowGap),
    '16px',
  );
  assert.ok(
    Math.abs(
      (await productThemeLabel.boundingBox()).y -
        ((await colorMode.boundingBox()).y + (await colorMode.boundingBox()).height) -
        16,
    ) <= 1,
    'Product color palette has the intended gap below color mode',
  );
  assert.equal(
    await appearanceSettings.evaluate((element) => getComputedStyle(element).paddingBottom),
    '4px',
  );
  assert.equal(Math.round((await productTheme.boundingBox()).height), 30);
  assert.equal(await productTheme.textContent(), 'CoreAI purple');
  const shortcuts = settings.locator('.docsite-settings__shortcuts');
  const shortcutsToggle = settings.getByRole('button', {
    name: 'Keyboard shortcuts',
    exact: true,
  });
  const settingsPopoverBounds = await settings.boundingBox();
  const shortcutsSectionBounds = await shortcuts.boundingBox();
  assert.equal(Math.round(shortcutsSectionBounds.x - settingsPopoverBounds.x), 1);
  assert.equal(
    Math.round(
      settingsPopoverBounds.x +
        settingsPopoverBounds.width -
        (shortcutsSectionBounds.x + shortcutsSectionBounds.width),
    ),
    1,
  );
  assert.equal(
    await shortcutsToggle.evaluate((element) => getComputedStyle(element).paddingBottom),
    '4px',
  );
  const firstShortcut = settings.getByText('Show/hide navigation', { exact: true });
  assert.equal(await shortcutsToggle.getAttribute('aria-expanded'), 'false');
  assert.equal(await firstShortcut.isVisible(), false);
  await shortcutsToggle.click();
  await firstShortcut.waitFor({ state: 'visible' });
  assert.equal(await shortcutsToggle.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  await settings.waitFor({ state: 'hidden' });
  await setTheme('dark');
  assert.equal(
    await page.locator('.page-summary').innerText(),
    'Palette, semantic roles, and token naming conventions.',
  );
  assert.equal(
    await page.locator('.site-main').evaluate((element) => getComputedStyle(element).paddingTop),
    '80px',
  );
  const colorTabs = page.locator('.reference-page-tabs');
  assert.equal(await colorTabs.count(), 1);
  assert.equal(
    await colorTabs.getByRole('tab', { name: 'Usage', exact: true }).getAttribute('aria-selected'),
    'true',
  );
  const colorSections = page.locator(
    '[data-page-panel="usage"] .standalone-guidance .page-section',
  );
  assert.deepEqual(
    await colorSections.locator('> h2').allTextContents(),
    [
      'Brand Color',
      'Surface Colors',
      'Text Colors',
      'Accessibility requirements',
      'Data Visualization',
    ],
  );
  assert.deepEqual(
    await colorSections.evaluateAll((sections) =>
      sections.slice(1).map((section, index) =>
        Math.round(
          section.getBoundingClientRect().top - sections[index].getBoundingClientRect().bottom,
        ),
      ),
    ),
    [48, 48, 48, 48],
  );
  assert.equal(await page.locator('.colors-theme-tabs').count(), 0);
  await page.getByText('brandVariants[70] · colorBrandBackground', { exact: true }).waitFor();
  await page.getByText('brandVariants[110] · colorBrandForeground1', { exact: true }).waitFor();
  assert.equal(await page.locator('.stack-table--filled .stack-row').count(), 4);
  assert.equal(
    await page.locator('.colors-theme-content .stack-table--outline .stack-row').count(),
    6,
  );
  assert.equal(await page.locator('.ratio-card').count(), 0);
  assert.equal(
    await page.locator('.theme-dark-only .accessibility-card:visible').count(),
    2,
  );
  await setTheme('light');
  assert.equal(
    await page.locator('[data-token-value="colorNeutralBackground1"]').innerText(),
    themes.coreaiLightTheme.colorNeutralBackground1,
  );
  await setBrand('azure');
  assert.equal(
    await page.locator('[data-token-value="colorBrandBackground"]').innerText(),
    themes.azureLightTheme.colorBrandBackground,
  );
  await setTheme('dark');
  assert.equal(
    await page.locator('[data-token-value="colorBrandBackground"]').innerText(),
    themes.azureDarkTheme.colorBrandBackground,
  );
  await page.locator('[data-copy="colorNeutralBackground1"]').click();
  await page
    .locator('.copy-toast')
    .filter({ hasText: 'Copied colorNeutralBackground1' })
    .waitFor({ state: 'visible' });
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    'colorNeutralBackground1',
  );
  await colorTabs.getByRole('tab', { name: 'Samples', exact: true }).click();
  assert.ok(await page.locator('[data-page-panel="samples"]').isVisible());
  assert.equal(
    await page
      .locator('[data-page-panel="samples"] pre')
      .filter({ hasText: 'export function Colors()' })
      .count(),
    1,
  );
  await page.getByRole('heading', { name: 'Apply the CoreAI theme', exact: true }).waitFor();
  await page.getByRole('heading', { name: 'Apply the Azure theme', exact: true }).waitFor();
  await colorTabs.getByRole('tab', { name: 'Usage', exact: true }).click();
  await setTheme('light');
  const foundationOrigin = await page.evaluate(() => globalThis.performance.timeOrigin);
  await page
    .getByRole('navigation', { name: 'Documentation', exact: true })
    .getByRole('tab', { name: 'Typography', exact: true })
    .click();
  await page.getByRole('heading', { name: 'Typography', exact: true }).waitFor();
  await page.locator('[data-reference-ready="true"]').waitFor();
  await page.locator('[data-example-id="components-text--presets"] .fui-Text').first().waitFor();
  const typographyTabs = page.locator('.reference-page-tabs');
  assert.equal(await typographyTabs.count(), 1);
  assert.equal(
    await page.locator('.page-summary').innerText(),
    'Type scale, weight system, and readability rules.',
  );
  assert.equal(
    await page.locator('.site-main').evaluate((element) => getComputedStyle(element).paddingTop),
    '80px',
  );
  assert.equal(await page.locator('.font-card').count(), 2);
  assert.deepEqual(
    await page
      .locator('[data-page-panel="usage"] .standalone-guidance .page-section > h2')
      .allTextContents(),
    ['Font families', 'Type scale'],
  );
  assert.deepEqual(
    await page
      .locator(
        '[data-page-widget="font-families"], [data-page-widget="typography"]',
      )
      .evaluateAll((widgets) =>
        widgets.slice(1).map((widget, index) =>
          Math.round(
            widget.getBoundingClientRect().top - widgets[index].getBoundingClientRect().bottom,
          ),
        ),
      ),
    [48],
  );
  assert.equal(
    await page
      .locator('.standalone-guidance')
      .getByRole('link', { name: /Download Aptos from Microsoft/ })
      .count(),
    0,
  );
  await page.getByText('Body1Strong&Body1', { exact: true }).waitFor();
  await page.getByText('Caption1Strong&Caption1', { exact: true }).waitFor();
  const typeSizes = await page
    .locator('.reference-type-table [data-type-preset]')
    .evaluateAll((elements) =>
      elements.map((element) => parseFloat(globalThis.getComputedStyle(element).fontSize)),
    );
  assert.ok(
    typeSizes[0] > typeSizes[1] && typeSizes[1] > typeSizes[4],
    'Type samples use real text presets',
  );
  await typographyTabs.getByRole('tab', { name: 'Samples', exact: true }).click();
  assert.ok(await page.locator('[data-page-panel="samples"]').isVisible());
  assert.equal(
    await page
      .locator('[data-page-panel="samples"] pre')
      .filter({ hasText: 'export function Typography()' })
      .count(),
    1,
  );
  await page.getByRole('heading', { name: 'Register installed Aptos fonts', exact: true }).waitFor();
  await page.getByRole('heading', { name: 'Load the Inter fallback', exact: true }).waitFor();
  await typographyTabs.getByRole('tab', { name: 'Usage', exact: true }).click();
  assert.equal(
    await page
      .locator('[data-page-panel="usage"]')
      .getByRole('heading', {
        name: /^(Register installed Aptos fonts|Load the Inter fallback|Page source)$/,
      })
      .count(),
    0,
  );
  await page.locator('.reference-type-table .type-table__row').first().click();
  await page
    .locator('.copy-toast')
    .filter({ hasText: 'Copied heading1' })
    .waitFor({ state: 'visible' });
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'heading1');
  assert.equal(await page.evaluate(() => globalThis.performance.timeOrigin), foundationOrigin);
  await page
    .getByRole('navigation', { name: 'Documentation', exact: true })
    .getByRole('button', { name: 'Guides', exact: true })
    .click();
  await page
    .getByRole('navigation', { name: 'Documentation', exact: true })
    .getByRole('tab', { name: 'Theming', exact: true })
    .click();
  await page.getByRole('heading', { name: 'Theming', exact: true }).waitFor();
  await page.locator('[data-reference-ready="true"]').waitFor();
  assert.equal(await page.locator('[data-example-id]').count(), 3);
  assert.equal(await page.evaluate(() => globalThis.performance.timeOrigin), foundationOrigin);
  await page.goto(`${root}foundations/surfaces/`);
  await page.locator('[data-reference-ready="true"]').waitFor();
  const materialsImage = page.locator('[data-page-widget="materials"] img');
  assert.ok((await materialsImage.getAttribute('src')).endsWith('-light.png'));
  await setTheme('dark');
  assert.ok((await materialsImage.getAttribute('src')).endsWith('-dark.png'));
  await setTheme('light');

  await page.goto(`${root}components/button/`);
  await page.locator('[data-reference-ready="true"]').waitFor();
  await page.getByRole('button', { name: 'Copy for LLM', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Copy .md', exact: true }).click();
  await page.getByRole('button', { name: 'Copied', exact: true }).waitFor();
  assert.equal(
    normalizeSource(await page.evaluate(() => navigator.clipboard.readText())),
    normalizeSource(await get('components/button.md')),
  );
  const defaultButton = page.locator('[data-example-id="components-button-button--default"]');
  await defaultButton.getByRole('button', { name: 'Example', exact: true }).waitFor();
  const buttonApi = (
    await page
      .locator('[data-page-panel="samples"] .reference-page-code-block code')
      .allTextContents()
  ).join('\n');
  assert.match(buttonApi, /interface ButtonProps \{/);
  assert.match(buttonApi, /@default 'circular'/);
  assert.match(buttonApi, /shape\?:/);
  await page
    .locator('.reference-page-tabs')
    .getByRole('tab', { name: 'Samples', exact: true })
    .click();
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
    normalizeSource(await page.evaluate(() => navigator.clipboard.readText())),
    await get('source/examples/components-button-button--default.tsx'),
  );

  await page.goto(`${root}components/dropdown/`);
  await page
    .locator('.reference-page-tabs')
    .getByRole('tab', { name: 'Samples', exact: true })
    .click();
  const inlineLabel = page.locator('[data-example-id="components-dropdown--inline-label"]');
  const dropdown = inlineLabel.getByRole('combobox').first();
  await dropdown.click();
  await page.getByRole('option', { name: 'In progress', exact: true }).click();
  assert.match(await dropdown.innerText(), /In progress/);
  const beforeTheme = await page
    .locator('[data-example-id]')
    .evaluateAll((containers) =>
      containers.map((container) =>
        globalThis.getComputedStyle(container).getPropertyValue('--colorNeutralBackground1'),
      ),
    );
  await setTheme('dark');
  const darkTheme = await page
    .locator('[data-example-id]')
    .evaluateAll((containers) =>
      containers.map((container) =>
        globalThis.getComputedStyle(container).getPropertyValue('--colorNeutralBackground1'),
      ),
    );
  assert.ok(
    darkTheme.every((color, index) => color && color !== beforeTheme[index]),
    'All examples inherit the changed theme',
  );
  assert.match(
    await dropdown.innerText(),
    /In progress/,
    'Theme changes must preserve example state',
  );
  await page
    .getByRole('navigation', { name: 'Documentation', exact: true })
    .getByRole('tab', { name: 'Button', exact: true })
    .click();
  await page.waitForFunction(() => globalThis.document.documentElement.dataset.theme === 'dark');
  assert.equal(await page.locator('#reference-root > .coreai-docsite-provider').count(), 1);
  await setTheme('light');
  const navigation = page.getByRole('navigation', { name: 'Documentation', exact: true });
  await navigation.getByRole('tablist').first().waitFor();
  assert.deepEqual(await navigation.locator('.fui-AccordionHeader__button').allTextContents(), [
    'Getting started',
    'Foundations',
    'Components',
    'Templates',
    'Guides',
  ]);
  const timeOrigin = await page.evaluate(() => {
    globalThis.document
      .querySelector('#reference-root > .coreai-docsite-provider')
      .setAttribute('data-provider-sentinel', 'persistent');
    globalThis.document
      .querySelector('.app-sidenav')
      .setAttribute('data-sidebar-sentinel', 'persistent');
    return globalThis.performance.timeOrigin;
  });
  await page.locator('#main').getByRole('tab', { name: 'Samples', exact: true }).click();
  await page
    .locator('#main')
    .getByRole('link', { name: 'Setup and dependencies', exact: true })
    .click();
  await page.getByRole('heading', { name: 'NPM package', exact: true }).waitFor();
  await page.locator('[data-reference-ready="true"]').waitFor();
  assert.equal(
    await page.evaluate(() => globalThis.performance.timeOrigin),
    timeOrigin,
    'Links inside static article content use the same router',
  );
  await page.goBack();
  await page.getByRole('heading', { name: 'Button', exact: true }).waitFor();
  await page.locator('[data-reference-ready="true"]').waitFor();
  const templates = navigation.getByRole('button', { name: 'Templates', exact: true });
  if ((await templates.getAttribute('aria-expanded')) === 'true') await templates.click();
  assert.equal(await templates.getAttribute('aria-expanded'), 'false');
  const savedScroll = await page.locator('.app-page').evaluate((region) => {
    region.scrollTop = 600;
    return region.scrollTop;
  });
  await navigation.getByRole('tab', { name: 'Dropdown', exact: true }).click();
  await page.getByRole('heading', { name: 'Dropdown', exact: true }).waitFor();
  await page.locator('[data-reference-ready="true"]').waitFor();
  assert.equal(
    await page.evaluate(() => globalThis.performance.timeOrigin),
    timeOrigin,
    'Client navigation must not reload the document',
  );
  assert.equal(await page.locator('[data-provider-sentinel="persistent"]').count(), 1);
  assert.equal(await page.locator('[data-sidebar-sentinel="persistent"]').count(), 1);
  assert.equal(
    await templates.getAttribute('aria-expanded'),
    'false',
    'Navigation expansion persists across page navigation',
  );
  assert.ok(
    await page.locator('#main').evaluate((main) => main === globalThis.document.activeElement),
  );

  await page.goBack();
  await page.getByRole('heading', { name: 'Button', exact: true }).waitFor();
  await page.locator('[data-reference-ready="true"]').waitFor();
  await page.waitForFunction(
    (expected) => Math.abs(globalThis.document.querySelector('.app-page').scrollTop - expected) < 2,
    savedScroll,
  );
  await page.goForward();
  await page.getByRole('heading', { name: 'Dropdown', exact: true }).waitFor();
  await page.locator('[data-reference-ready="true"]').waitFor();
  assert.equal(await page.evaluate(() => globalThis.performance.timeOrigin), timeOrigin);
  const treeItem = navigation.getByRole('tab', { name: 'Tree', exact: true });
  await treeItem.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('heading', { name: 'Tree', exact: true }).waitFor();
  await page.locator('[data-reference-ready="true"]').waitFor();
  assert.equal(await page.title(), 'Tree | CoreAI design system');
  assert.equal(
    await navigation.getByRole('tab', { name: 'Tree', exact: true }).getAttribute('aria-selected'),
    'true',
  );
  assert.equal(
    await page.evaluate(() => globalThis.performance.timeOrigin),
    timeOrigin,
    'Enter activation uses the router',
  );

  if ((await templates.getAttribute('aria-expanded')) !== 'true') await templates.click();
  await navigation.getByRole('tab', { name: 'React Router / Tab Link List', exact: true }).click();
  await page.getByRole('heading', { name: 'Tab Link List', exact: true }).waitFor();
  await page.locator('[data-reference-ready="true"]').waitFor();
  const routerExample = page.locator(
    '[data-example-id="templates-react-router-tab-link-list--default"]',
  );
  await routerExample.getByRole('tab', { name: 'Activity', exact: true }).click();
  await routerExample
    .locator('[role="tab"][aria-selected="true"]')
    .filter({ hasText: 'Activity' })
    .waitFor();
  assert.equal(
    await routerExample
      .getByRole('tab', { name: 'Activity', exact: true })
      .getAttribute('aria-selected'),
    'true',
  );
  assert.ok(
    page.url().endsWith('/templates/react-router-tab-link-list/'),
    'Demo router must not navigate the documentation app',
  );
  assert.equal(await page.evaluate(() => globalThis.performance.timeOrigin), timeOrigin);

  const failureUrl = `${root}components/button/`;
  await page.route(failureUrl, (route) =>
    route.fulfill({ status: 503, contentType: 'text/plain', body: 'Simulated outage' }),
  );
  simulatingNavigationFailure = true;
  await navigation.getByRole('tab', { name: 'Button', exact: true }).click();
  await page.locator('[data-navigation-error]').filter({ hasText: 'HTTP 503' }).waitFor();
  assert.ok(
    expectedNavigationErrors.some((message) =>
      message.includes('Could not load documentation page'),
    ),
    'Navigation failures are logged, not silently hidden',
  );
  assert.equal(await page.evaluate(() => globalThis.performance.timeOrigin), timeOrigin);
  await page.unroute(failureUrl);
  simulatingNavigationFailure = false;
  await page.getByRole('button', { name: 'Retry page loading', exact: true }).click();
  await page.getByRole('heading', { name: 'Button', exact: true }).waitFor();
  await page.locator('[data-reference-ready="true"]').waitFor();
  assert.equal(await page.locator('[data-navigation-error]').count(), 0);

  let release;
  let started;
  let finished;
  const blocked = new Promise((resolve) => {
    release = resolve;
  });
  const requestStarted = new Promise((resolve) => {
    started = resolve;
  });
  const requestFinished = new Promise((resolve) => {
    finished = resolve;
  });
  const delayedUrl = `${root}components/dropdown/`;
  const delayedHtml = await get('components/dropdown/');
  await page.route(delayedUrl, async (route) => {
    started();
    await blocked;
    await route.fulfill({ status: 200, contentType: 'text/html', body: delayedHtml });
    finished();
  });
  await navigation.getByRole('tab', { name: 'Dropdown', exact: true }).click();
  await requestStarted;
  await navigation.getByRole('tab', { name: 'Tree', exact: true }).click();
  await page.getByRole('heading', { name: 'Tree', exact: true }).waitFor();
  await page.locator('[data-reference-ready="true"]').waitFor();
  release();
  await requestFinished;
  await page.unroute(delayedUrl);
  assert.equal(
    await page.title(),
    'Tree | CoreAI design system',
    'Late responses cannot replace a newer page',
  );

  await page.evaluate((href) => {
    const link = globalThis.document.createElement('a');
    link.href = href;
    link.textContent = 'Go to Dropdown guidance';
    globalThis.document.getElementById('main').prepend(link);
  }, `${root}components/dropdown/#guidance-best-practices`);
  await page.getByRole('link', { name: 'Go to Dropdown guidance', exact: true }).click();
  await page.getByRole('heading', { name: 'Dropdown', exact: true }).waitFor();
  await page.locator('[data-reference-ready="true"]').waitFor();
  assert.ok(page.url().endsWith('/components/dropdown/#guidance-best-practices'));
  await page.waitForFunction(() => {
    const heading = globalThis.document.getElementById('guidance-best-practices');
    const region = globalThis.document.querySelector('.app-page');
    const headingBounds = heading.getBoundingClientRect();
    const regionBounds = region.getBoundingClientRect();
    return (
      region.scrollTop > 0 &&
      headingBounds.top >= regionBounds.top &&
      headingBounds.top < regionBounds.bottom
    );
  });
  assert.equal(await page.evaluate(() => globalThis.performance.timeOrigin), timeOrigin);

  await page.evaluate((href) => {
    const link = globalThis.document.createElement('a');
    link.href = href;
    link.textContent = 'Open Button in a new tab';
    globalThis.document.getElementById('main').prepend(link);
  }, `${root}components/button/`);
  const [newTab] = await Promise.all([
    context.waitForEvent('page'),
    page
      .getByRole('link', { name: 'Open Button in a new tab', exact: true })
      .click({ modifiers: ['ControlOrMeta'] }),
  ]);
  await newTab.getByRole('heading', { name: 'Button', exact: true }).waitFor();
  await newTab.close();
  assert.ok(
    page.url().includes('/components/dropdown/'),
    'Modified clicks do not navigate the current page',
  );

  const rawPage = await context.newPage();
  await rawPage.goto(`${root}components/button/`);
  await rawPage.locator('[data-reference-ready="true"]').waitFor();
  const copyErrors = [];
  rawPage.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('Failed to copy page Markdown.'))
      copyErrors.push(message.text());
  });
  const copyMenu = rawPage.locator('.component-copy-menu__trigger');
  await rawPage.route(`${root}components/button.md`, (route) =>
    route.fulfill({ status: 503, contentType: 'text/plain', body: 'Simulated outage' }),
  );
  await copyMenu.click();
  await rawPage.getByRole('menuitem', { name: 'Copy .md', exact: true }).click();
  await rawPage.getByRole('button', { name: 'Copy failed', exact: true }).waitFor();
  await rawPage
    .getByRole('status')
    .filter({ hasText: 'Use View .md' })
    .waitFor({ state: 'attached' });
  assert.equal(copyErrors.length, 1);
  await rawPage.unroute(`${root}components/button.md`);
  await rawPage.evaluate(() => {
    navigator.clipboard.writeText = async () => {
      throw new Error('Clipboard blocked for regression test');
    };
  });
  await copyMenu.click();
  await rawPage.getByRole('menuitem', { name: 'Copy .md', exact: true }).click();
  await rawPage.getByRole('button', { name: 'Copy failed', exact: true }).waitFor();
  assert.equal(copyErrors.length, 2);
  await rawPage.evaluate(() => {
    delete navigator.clipboard.writeText;
  });
  await copyMenu.click();
  await Promise.all([
    context.waitForEvent('request', {
      predicate: (request) =>
        request.isNavigationRequest() && request.url() === `${root}components/button.md`,
    }),
    rawPage.getByRole('menuitem', { name: 'View .md', exact: true }).click(),
  ]);
  await rawPage.close();

  await page.goto(`${root}components/dialog/`);
  await page
    .locator('[data-example-id="components-dialog--default"]')
    .getByRole('button', { name: 'Open dialog', exact: true })
    .click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden' });

  await page.goto(`${root}components/tree/`);
  await page
    .locator('.reference-page-tabs')
    .getByRole('tab', { name: 'Samples', exact: true })
    .click();
  const lazyTree = page.locator('[data-example-id="components-tree--lazy-loading"]');
  await lazyTree.getByRole('treeitem', { name: 'People', exact: true }).click();
  await lazyTree.getByText('People 1', { exact: true }).waitFor();

  await page.goto(`${root}components/codeblock/`);
  await page
    .locator('.reference-page-tabs')
    .getByRole('tab', { name: 'Samples', exact: true })
    .click();
  await page
    .locator('[data-example-id="components-codeblock--header"]')
    .getByRole('combobox')
    .click();
  await page.getByRole('option', { name: 'YAML', exact: true }).click();
  await page
    .locator('[data-example-id="components-codeblock--header"] pre')
    .filter({ hasText: 'name: coreai-docs' })
    .waitFor();

  await page.goto(`${root}templates/empty-state/`);
  await page
    .locator('[data-example-id="templates-empty-state--default"]')
    .getByRole('heading', { name: 'Benefit from Action Artifact' })
    .waitFor();
  assert.deepEqual(errors, [], 'Browser errors');
  const noJavaScript = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noJavaScript.newPage();
  await staticPage.goto(`${root}components/button/`);
  assert.match(
    await staticPage.locator('.reference-theme-fallback svg path').getAttribute('d'),
    /^M14\.95 5/,
  );
  assert.equal(await staticPage.getByRole('heading', { name: 'Button', exact: true }).count(), 1);
  assert.ok(
    (
      await staticPage.locator('[id="source-components-button-button--default"]').textContent()
    ).includes('export default Default'),
  );
  await staticPage.goto(`${root}foundations/colors/`);
  assert.equal(await staticPage.locator('[data-page-widget="colors"] table').count(), 2);
  assert.ok(
    (await staticPage.locator('.standalone-guidance').innerText()).includes(
      themes.azureDarkTheme.colorBrandBackground,
    ),
  );
  await staticPage.goto(`${root}foundations/typography/`);
  assert.equal(await staticPage.locator('[data-page-widget="font-families"] table').count(), 1);
  assert.equal(await staticPage.locator('[data-page-widget="typography"] table').count(), 1);
  await staticPage.goto(`${root}foundations/surfaces/`);
  assert.equal(await staticPage.locator('[data-page-widget="materials"] img').count(), 2);
  await staticPage.goto(root);
  assert.equal(await staticPage.locator('.reference-footer.sr-only').count(), 1);
  assert.notEqual(await staticPage.locator('.reference-footer').getAttribute('inert'), null);
  assert.equal(await staticPage.locator('.reference-footer').getAttribute('aria-hidden'), 'true');
  assert.equal(await staticPage.locator('.reference-footer a[href$="llms.txt"]').count(), 1);
  assert.equal(await staticPage.locator('.home-resource-links').count(), 0);
  assert.equal(await staticPage.locator('.home-agent-entry + .home-agent-preview').count(), 1);
  assert.notEqual(await staticPage.locator('.home-agent-preview').getAttribute('hidden'), null);
  assert.equal(await staticPage.locator('.home-visual').locator('img, svg, canvas').count(), 0);
  assert.equal(
    await staticPage.getByRole('heading', { name: 'Build with your agent', exact: true }).count(),
    0,
  );
  assert.equal((await staticPage.locator('[data-agent-prompt]').textContent()).trim(), starter);
  await noJavaScript.close();
  await page.goto(`${root}components/button/`);
  await page.locator('[data-reference-ready="true"]').waitFor();
  assert.match(
    await page
      .locator('.app-sidenav__footer')
      .evaluate((element) => globalThis.getComputedStyle(element).boxShadow),
    /0px -16px 24px 4px/,
  );
  await page.getByRole('link', { name: 'CoreAI home', exact: true }).click();
  await page.getByRole('heading', { name: 'CoreAI Design System', exact: true }).waitFor();
  assert.equal(new URL(page.url()).pathname, metadata.basePath);
  await page.goto(`${root}components/button/`);
  await page.locator('[data-reference-ready="true"]').waitFor();
  await page.keyboard.press('Alt+s');
  await page.locator('.app-sidenav.is-collapsed').waitFor();
  assert.equal(
    await page.evaluate(() => localStorage.getItem('coreai-docsite-sidebar-collapsed')),
    'true',
  );
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');
  await page.waitForFunction(
    () => globalThis.document.activeElement?.getAttribute('aria-label') === 'Search navigation',
  );
  await page.getByRole('searchbox', { name: 'Search navigation' }).fill('dropdown');
  const filtered = page.locator('.app-search-result:visible');
  assert.ok((await filtered.count()) >= 1);
  assert.equal(await filtered.locator('.app-search-result__path').count(), 0);
  for (const title of await filtered.allTextContents())
    assert.match(title.toLowerCase(), /dropdown/);
  await page.getByRole('searchbox', { name: 'Search navigation' }).fill('');
  await page.locator('#main').focus();
  await page.keyboard.press(
    process.platform === 'darwin' ? 'Meta+Shift+ArrowUp' : 'Control+Shift+ArrowUp',
  );
  assert.equal(await navigation.locator('[aria-expanded="true"]').count(), 0);
  await page.keyboard.press(
    process.platform === 'darwin' ? 'Meta+Shift+ArrowDown' : 'Control+Shift+ArrowDown',
  );
  assert.equal(await navigation.locator('[aria-expanded="true"]').count(), 5);
  await page.keyboard.press('Alt+m');
  await page.waitForFunction(() => globalThis.document.documentElement.dataset.theme === 'dark');
  await page.keyboard.press('Alt+m');
  await page.waitForFunction(() => globalThis.document.documentElement.dataset.theme === 'light');
  await page.keyboard.press('Alt+ArrowDown');
  await page.getByRole('heading', { name: 'Card', exact: true }).waitFor();
  await page.locator('[data-reference-ready="true"]').waitFor();
  await page.keyboard.press('Alt+ArrowUp');
  await page.getByRole('heading', { name: 'Button', exact: true }).waitFor();
  await page.locator('[data-reference-ready="true"]').waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page.getByRole('dialog', { name: 'Site navigation dialog', exact: true }).waitFor();
  assert.ok(await page.locator('.app-content').evaluate((element) => element.inert));
  const settingsBounds = await page
    .getByRole('button', { name: 'Settings', exact: true })
    .boundingBox();
  const sidebarBounds = await page.locator('.app-sidenav').boundingBox();
  assert.ok(
    settingsBounds.x >= sidebarBounds.x &&
      settingsBounds.x + settingsBounds.width <= sidebarBounds.x + sidebarBounds.width,
    'Mobile settings remain inside the sidebar',
  );
  await page.keyboard.press('Escape');
  assert.equal(
    await page.getByRole('dialog', { name: 'Site navigation dialog', exact: true }).count(),
    0,
  );
  await page.waitForFunction(
    () => globalThis.document.activeElement?.getAttribute('aria-label') === 'Open navigation',
  );
  await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Documentation', exact: true })
    .getByRole('tab', { name: 'Dropdown', exact: true })
    .click();
  await page.getByRole('heading', { name: 'Dropdown', exact: true }).waitFor();
  assert.equal(
    await page.getByRole('dialog', { name: 'Site navigation dialog', exact: true }).count(),
    0,
  );
  assert.equal(await page.locator('#reference-root > .coreai-docsite-provider').count(), 1);
  await page.goto(root);
  await page.locator('[data-reference-ready="true"]').waitFor();
  assert.ok(await page.locator('.app-sidenav').evaluate((element) => element.inert));
  assert.equal(await page.locator('.home-resource-links').count(), 0);
  assert.equal(
    await page
      .locator('.app-sidenav__nav')
      .getByRole('tab', { name: 'Home', exact: true, includeHidden: true })
      .getAttribute('aria-selected'),
    'true',
  );
  assert.deepEqual(
    await page.locator('.reference-footer').evaluate((footer) => ({
      width: footer.getBoundingClientRect().width,
      height: footer.getBoundingClientRect().height,
      clip: globalThis.getComputedStyle(footer).clip,
    })),
    { width: 1, height: 1, clip: 'rect(0px, 0px, 0px, 0px)' },
    'Home footer is visually hidden, not removed',
  );
  assert.equal(
    await page
      .locator('.reference-footer a')
      .first()
      .evaluate((link) => {
        link.focus();
        return globalThis.document.activeElement === link;
      }),
    false,
    'Home footer links are not keyboard focus targets',
  );
  assert.equal(
    await page.locator('.home-heading .page-header__title-row .fui-CopyButton').count(),
    0,
  );
  assert.equal(await page.locator('.home-agent-entry h2, .home-agent-entry p').count(), 0);
  assert.equal(await page.locator('.home-agent-entry > .fui-Button').count(), 2);
  assert.equal(await page.locator('.home-agent-preview').count(), 0);
  assert.equal(
    await page.locator('.home-heading p').innerText(),
    'The guide for building CoreAI experiences on the web',
  );
  const promptButton = page.getByRole('button', { name: 'Copy starter prompt', exact: true });
  await promptButton.click();
  await page
    .locator('.copy-toast')
    .filter({ hasText: 'Copied starter prompt' })
    .waitFor({ state: 'visible' });
  assert.equal(
    normalizeSource(await page.evaluate(() => navigator.clipboard.readText())),
    normalizeSource(starter),
  );
  const starterOrigin = await page.evaluate(() => globalThis.performance.timeOrigin);
  await page
    .locator('.home-agent-entry')
    .getByRole('link', { name: 'Learn more', exact: true })
    .click();
  await page
    .getByRole('heading', { level: 1, name: 'Build with your agent', exact: true })
    .waitFor();
  await page.locator('[data-reference-ready="true"]').waitFor();
  await page.locator('#main').getByRole('tab', { name: 'Samples', exact: true }).click();
  assert.ok(
    (
      await page
        .locator('[data-page-panel="samples"]:not([hidden]) .standalone-guidance')
        .innerText()
    ).includes(starter),
  );
  assert.equal(await page.evaluate(() => globalThis.performance.timeOrigin), starterOrigin);
  await page.goto(root);
  await page.locator('[data-reference-ready="true"]').waitFor();
  assert.equal(
    await page.evaluate(
      () => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth,
    ),
    false,
    'Homepage fits mobile width',
  );
  const homeOrigin = await page.evaluate(() => globalThis.performance.timeOrigin);
  await page
    .locator('.home-agent-entry')
    .getByRole('link', { name: 'Learn more', exact: true })
    .click();
  await page
    .getByRole('heading', { level: 1, name: 'Build with your agent', exact: true })
    .waitFor();
  await page.locator('[data-reference-ready="true"]').waitFor();
  assert.equal(await page.evaluate(() => globalThis.performance.timeOrigin), homeOrigin);
  assert.deepEqual(
    await page.evaluate(() => globalThis.referencePaintProblems),
    [],
    'No wrong-theme frames during initial load and client navigation',
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(root);
  await page.bringToFront();
  await page.locator('.coreai-logo-cube[data-ready="true"]').waitFor();
  const canvas = page.locator('.coreai-logo-cube canvas');
  await page.waitForTimeout(600);
  const firstFrame = await canvas.screenshot();
  await page.waitForTimeout(200);
  assert.deepEqual(
    await canvas.screenshot(),
    firstFrame,
    'Reduced-motion homepage does not animate',
  );
  assert.deepEqual(errors, [], 'Browser errors after navigation checks');
  console.log(
    'Chromium check: persistent React Router navigation, Accordion keyboard/expansion/search, history and scroll restoration, mobile focus, fragments, failure/retry/cancellation, native downloads/new tabs, isolated demo routers, shared theme, all previews and source parity. No unexpected browser errors.',
  );
} finally {
  if (browser) await browser.close();
  await new Promise((resolve, reject) => {
    server.httpServer.close((error) => (error ? reject(error) : resolve()));
    server.httpServer.closeAllConnections();
  });
}
