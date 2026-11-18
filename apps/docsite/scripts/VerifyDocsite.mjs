// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { chromium } from 'playwright';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import {
  appRoot,
  outputDirectory,
  codeFence,
  escapeHtml,
  providerSource,
} from './BuildDocsite.mjs';
import { serveReferenceProof } from './ServeDocsite.mjs';
import { readDocumentationMetadata } from './DocumentationMetadata.mjs';
import { verifyReviewRegressions } from './verify-review-regressions.mjs';

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
  try {
    return path.dirname(require.resolve(`${name}/package.json`));
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
}

async function verifyConsumerPackage() {
  assert.ok(process.env.npm_execpath, 'Run npm --workspace apps/docsite run verify.');
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
      `Consumer check: ${allExamples.length} examples, templates and provider compile against the packed package.`,
    );
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

await verifyConsumerPackage();
const server = await serveReferenceProof({ port: 0 });
const address = server.httpServer.address();
assert.ok(address && typeof address !== 'string');
const root = `http://127.0.0.1:${address.port}${metadata.basePath}`;
let browser;
try {
  const read = async (relative) => {
    const response = await fetch(`${root}${relative}`);
    assert.equal(response.status, 200, relative);
    return response;
  };
  const home = await (await read('')).text();
  const { documentation, skillSource } = await readDocumentationMetadata({
    lastUpdated: metadata.documentation.lastUpdated,
  });
  assert.deepEqual(metadata.documentation, documentation);
  assert.deepEqual(await (await read('version.json')).json(), {
    schemaVersion: 1,
    ...documentation,
    sourceRef: metadata.coreaiSourceRef,
  });
  assert.equal(await (await read(documentation.skill.path)).text(), skillSource);
  const discovery = await (await read('llms.txt')).text();
  assert.match(discovery, /Fetch this index once per task/);
  assert.ok(discovery.includes(`Last updated ${documentation.lastUpdated}`));
  assert.ok(
    discovery.includes(`documented @coreai-ds/react-components v${documentation.packageVersion}`),
  );
  assert.ok(
    home.includes(`datetime="${documentation.lastUpdated}"`) &&
      home.includes('overview/Changelog/'),
  );
  const starterPrompt = (
    await fs.readFile(path.join(appRoot, 'content/data/AgentPrompt.md'), 'utf8')
  ).trim();
  assert.equal(await (await read('agent-prompt.txt')).text(), starterPrompt);
  assert.equal(metadata.agentPrompt, starterPrompt);
  assert.ok(
    home.includes(escapeHtml(starterPrompt)),
    'Homepage starter prompt uses the canonical source.',
  );
  assert.ok(
    (await (await read('overview/Introduction.md')).text()).includes(starterPrompt),
    'Introduction includes the same starter prompt.',
  );
  for (const filename of ['paper-shaders-license.txt', 'paper-shaders-notice.txt']) {
    assert.equal(
      await (await read(`third-party/${filename}`)).text(),
      await fs.readFile(path.join(appRoot, 'public/third-party', filename), 'utf8'),
    );
  }
  const illiconDirectory = path.resolve(appRoot, '../../packages/react-components/illicons');
  const illiconManifest = JSON.parse(
    await fs.readFile(path.join(illiconDirectory, 'manifest.json'), 'utf8'),
  );
  const illiconMarkdown = await (await read('components/Illicon.md')).text();
  for (const icon of illiconManifest.icons) {
    const sourcePath = `assets/illicons/${icon.file}`;
    assert.ok(illiconMarkdown.includes(sourcePath), `${icon.file}: catalog download link`);
    assert.deepEqual(
      Buffer.from(await (await read(sourcePath)).arrayBuffer()),
      await fs.readFile(path.join(illiconDirectory, icon.file)),
      `${icon.file}: original SVG download`,
    );
  }
  assert.equal((await fetch(`${root}components/NotAPage/`)).status, 404);
  const files = new Set(
    (await fs.readdir(outputDirectory, { recursive: true })).map((entry) =>
      entry.replaceAll('\\', '/'),
    ),
  );
  const parser = unified().use(remarkParse);
  const invalidLinks = new Set();
  const checkLink = (href, from) => {
    const url = new URL(href, `${root}${from}`);
    if (url.origin !== new URL(root).origin) return;
    if (!url.pathname.startsWith(metadata.basePath)) {
      invalidLinks.add(`${from}: link loses deployment prefix: ${href}`);
      return;
    }
    let target = decodeURIComponent(url.pathname.slice(metadata.basePath.length));
    if (target.endsWith('/') || !target) target += 'index.html';
    if (!files.has(target)) invalidLinks.add(`${from}: missing case-sensitive target ${href}`);
  };
  for (const record of metadata.pages) {
    assert.ok(!Object.hasOwn(record, 'status'), `${record.id}: no construction metadata`);
    const primaryApi = record.api[0];
    if (record.kind === 'components' && primaryApi?.kind === 'component') {
      assert.equal(
        record.route,
        `components/${primaryApi.name}`,
        'Component routes use the public export casing.',
      );
    }
    const html = await (await read(record.htmlPath)).text();
    if (record.mergedInto) {
      assert.ok(
        html.includes(`url=${metadata.basePath}${record.mergedInto}/#guidance-`),
        `${record.htmlPath}: redirect to the combined page section`,
      );
      assert.ok(!html.includes('id="reference-search-index"'), record.htmlPath);
    } else {
      assert.ok(html.includes('id="main"'), record.htmlPath);
    }
    for (const [, href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      checkLink(href.replaceAll('&amp;', '&'), `${record.htmlPath}index.html`);
    }
    const response = await read(record.markdownPath);
    assert.ok(!response.headers.get('content-type')?.includes('text/html'), record.markdownPath);
    const markdown = await response.text();
    assert.ok(markdown.startsWith('# '), record.markdownPath);
    const checkMarkdown = (node) => {
      if (['link', 'definition', 'image'].includes(node.type))
        checkLink(node.url, record.markdownPath);
      node.children?.forEach(checkMarkdown);
    };
    checkMarkdown(parser.parse(markdown));
    for (const example of record.examples) {
      const source = await (await read(example.sourcePath)).text();
      assert.equal(createHash('sha256').update(source).digest('hex'), example.sha256);
      assert.ok(markdown.includes(codeFence(source)), `${example.id}: Markdown/source parity`);
    }
  }
  assert.deepEqual([...invalidLinks], [], 'All published local links use exact existing paths.');
  assert.equal(
    new Set(allExamples.map((example) => example.id)).size,
    metadata.coverage.filter((entry) => entry.status === 'included').length,
  );
  console.log(
    `Static HTTP check: ${metadata.pages.length} HTML/Markdown pages, source hashes and third-party notices.`,
  );

  const componentPage = (title) => {
    const record = metadata.pages.find(
      (record) => record.title === title && record.defaultExampleId,
    );
    assert.ok(record, `Missing ${title} page`);
    return `${root}${record.htmlPath}`;
  };
  browser = await chromium.launch({ headless: true });
  await verifyReviewRegressions(root, browser);
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(componentPage('Button'));
  await page.locator('[data-reference-ready="true"]').waitFor();
  const { indexedPaths, navigationPaths } = await page.evaluate((html) => {
    const source = new globalThis.DOMParser().parseFromString(html, 'text/html');
    const entries = JSON.parse(source.getElementById('reference-search-index').textContent);
    return {
      indexedPaths: entries.map((entry) => entry.path),
      navigationPaths: [...source.querySelectorAll('[data-navigation-entry]')].map(
        (link) => new URL(link.getAttribute('href'), globalThis.location.href).pathname,
      ),
    };
  }, home);
  const navigationPathSet = new Set(navigationPaths);
  assert.deepEqual(
    new Set(indexedPaths.map((path) => new URL(path.slice(1), root).pathname)),
    navigationPathSet,
    'Search indexes exactly the navigation tree.',
  );
  const navigation = page.locator('nav[aria-label="Documentation"]');
  const accordionLink = navigation.getByRole('link', { name: 'Accordion', exact: true });
  assert.ok((await accordionLink.getAttribute('class')).includes('fui-LinkButton'));
  const timeOrigin = await page.evaluate(() => globalThis.performance.timeOrigin);
  await accordionLink.click();
  await page.locator('[data-reference-ready="true"]').waitFor();
  await page.getByRole('heading', { level: 1, name: 'Accordion', exact: true }).waitFor();
  assert.equal(await page.evaluate(() => globalThis.performance.timeOrigin), timeOrigin);
  assert.equal(await accordionLink.getAttribute('aria-current'), 'page');
  const [newTab] = await Promise.all([
    context.waitForEvent('page'),
    accordionLink.click({ modifiers: ['ControlOrMeta'] }),
  ]);
  await newTab.waitForLoadState('domcontentloaded');
  assert.equal(newTab.url(), componentPage('Accordion'));
  await newTab.close();
  await page.getByRole('searchbox', { name: 'Search navigation' }).fill('Button');
  const result = navigation.locator('a.app-search-result').first();
  assert.ok(navigationPathSet.has(new URL(await result.getAttribute('href'), root).pathname));
  await result.click();
  await page.locator('[data-reference-ready="true"]').waitFor();
  await page.getByRole('heading', { level: 1, name: 'Button', exact: true }).waitFor();

  await page.goto(componentPage('Combobox'));
  await page.locator('[data-reference-ready="true"]').waitFor();
  await page.getByRole('tab', { name: 'Samples', exact: true }).click();
  const preview = page.locator('[data-example-id="components-combobox--multiselect-with-tags"]');
  const input = preview.getByRole('combobox');
  await input.click();
  await page.getByText('Cat', { exact: true }).filter({ visible: true }).click();
  if (!(await page.getByText('Dog', { exact: true }).filter({ visible: true }).isVisible())) {
    await input.click();
  }
  await page.getByText('Dog', { exact: true }).filter({ visible: true }).click();
  await page.keyboard.press('Escape');
  assert.deepEqual(
    await preview.evaluate((element) =>
      [...element.querySelectorAll('[aria-labelledby]')].flatMap((node) =>
        node
          .getAttribute('aria-labelledby')
          .split(/\s+/)
          .filter((id) => !globalThis.document.getElementById(id)),
      ),
    ),
    [],
  );
  await preview.locator('ul button').filter({ hasText: /^Cat$/ }).click();
  assert.equal(
    await preview
      .locator('ul button')
      .filter({ hasText: /^Dog$/ })
      .evaluate((element) => globalThis.document.activeElement === element),
    true,
    'Removing a tag focuses the remaining tag.',
  );
  const contentRecord = metadata.pages.find((record) => record.route === 'foundations/Content');
  assert.ok(contentRecord, 'Missing content guidelines page');
  await page.goto(`${root}${contentRecord.htmlPath}`);
  await page.locator('.content-principle-list').waitFor();
  for (const trigger of await page.locator('.content-principle button[aria-expanded]').all()) {
    await trigger.click();
  }
  const missingContent = await page.evaluate(async () => {
    const source = new globalThis.DOMParser().parseFromString(
      await (await fetch(globalThis.location.href)).text(),
      'text/html',
    );
    const normalize = (text) => text.replace(/\s+/g, ' ').trim();
    const visible = normalize(globalThis.document.querySelector('.content-page').innerText);
    return [
      ...source.querySelectorAll('[data-page-widget="content"] p, [data-page-widget="content"] li'),
    ]
      .filter((element) => !element.matches('p:has(> a:only-child)'))
      .map((element) => normalize(element.textContent.replace(/^(Bad|Better):\s*/, '')))
      .filter((text) => !visible.includes(text));
  });
  assert.deepEqual(missingContent, [], 'Every authored guideline and example remains visible.');
  assert.equal(await page.locator('.content-step:not(.content-step--review)').count(), 3);
  assert.equal(
    await page.locator('.content-process-layout .content-publish-checklist > li').count(),
    7,
  );
  const reviewLayout = await page.locator('.content-flow--review').evaluate((element) => {
    const steps = [...element.children];
    const review = steps.at(-1).getBoundingClientRect();
    const style = globalThis.getComputedStyle(element);
    const contentWidth =
      element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    return {
      spansFlow: Math.abs(review.width - contentWidth) < 1,
      followsDraftSteps: steps
        .slice(0, -1)
        .every((step) => step.getBoundingClientRect().bottom <= review.top),
    };
  });
  assert.deepEqual(reviewLayout, { spansFlow: true, followsDraftSteps: true });
  assert.equal(await page.locator('.content-help-card').count(), 2);
  assert.equal(await page.locator('.content-help-card > a').count(), 0);
  assert.deepEqual(await page.locator('.content-help-card__link').allTextContents(), [
    'Open the Content Design Copilot (opens in a new tab)',
    'Open the content design desk (opens in a new tab)',
  ]);
  assert.deepEqual(errors, []);
  await context.close();

  for (const blockedStorage of [false, true]) {
    const context = await browser.newContext();
    try {
      if (blockedStorage)
        await context.addInitScript(() => {
          for (const method of ['getItem', 'setItem']) {
            Object.defineProperty(globalThis.Storage.prototype, method, {
              value() {
                throw new globalThis.DOMException(
                  'Storage blocked for the check.',
                  'SecurityError',
                );
              },
            });
          }
        });
      const page = await context.newPage();
      await page.goto(`${componentPage('Button')}${blockedStorage ? '' : '#%'}`);
      await page.locator('[data-reference-ready="true"]').waitFor();
      await page.getByRole('heading', { level: 1, name: 'Button', exact: true }).waitFor();
    } finally {
      await context.close();
    }
  }
  const fallbackContext = await browser.newContext();
  try {
    const url = componentPage('Button');
    await fallbackContext.route(url, async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        body: (await response.text()).replace('data-page-header', 'data-missing-header'),
      });
    });
    const page = await fallbackContext.newPage();
    await page.goto(url);
    await page
      .getByRole('alert')
      .filter({ hasText: 'Interactive features are unavailable' })
      .waitFor();
    await page.getByRole('heading', { level: 1, name: 'Button', exact: true }).waitFor();
  } finally {
    await fallbackContext.close();
  }
  console.log(
    'Chromium check: native CoreAI navigation links, client navigation/search, tag labels/focus, blocked storage, malformed fragments and static recovery.',
  );
} finally {
  if (browser) await browser.close();
  await new Promise((resolve, reject) => {
    server.httpServer.close((error) => (error ? reject(error) : resolve()));
    server.httpServer.closeAllConnections();
  });
}
