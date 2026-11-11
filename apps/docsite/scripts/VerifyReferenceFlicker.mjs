// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root = new URL(process.argv[2] ?? 'http://127.0.0.1:8080/');
const buttonUrl = new URL('components/Button/', root);
const dropdownUrl = new URL('components/Dropdown/', root);
const browser = await chromium.launch();

const delayRoute = async (route, delay) => {
  await new Promise((resolve) => setTimeout(resolve, delay));
  await route.continue();
};

const readFrames = (page) =>
  page.evaluate(() => {
    const frames = globalThis.__referenceFrames ?? [];
    globalThis.__referenceFrames = [];
    return frames;
  });

const readNavigationGeometry = (page) =>
  page.evaluate(() => {
    const rect = (element) => {
      const bounds = element?.getBoundingClientRect();
      return bounds
        ? [bounds.x, bounds.y, bounds.width, bounds.height].map((value) => Math.round(value))
        : null;
    };
    const navigation = globalThis.document.querySelector('.app-sidenav__nav');
    const groups = [
      ...globalThis.document.querySelectorAll('.reference-nav-group, .app-sidenav__section-shell'),
    ];
    return {
      scrollHeight: navigation?.scrollHeight,
      divider: groups[0] ? globalThis.getComputedStyle(groups[0]).borderBottom : null,
      groups: groups.map((group) => ({
        rect: rect(group),
        expanded:
          group instanceof globalThis.HTMLDetailsElement
            ? group.open
            : group.querySelector('button')?.getAttribute('aria-expanded') === 'true',
      })),
      active: rect(
        globalThis.document.querySelector('[aria-current="page"], .fui-Tab[aria-selected="true"]'),
      ),
    };
  });

const readSearchPresentation = (page, fallback) =>
  page.evaluate((staticFallback) => {
    const element = globalThis.document.querySelector(
      staticFallback ? '.reference-search-fallback' : '.fui-SearchBox',
    );
    const text = staticFallback ? element?.firstElementChild : element?.querySelector('input');
    const shortcut = element?.querySelector('.app-sidenav__search-shortcut');
    if (!element || !text || !shortcut) return null;
    const rect = (target) => {
      const bounds = target.getBoundingClientRect();
      return [bounds.x, bounds.y, bounds.width, bounds.height].map((value) =>
        Number(value.toFixed(3)),
      );
    };
    const style = globalThis.getComputedStyle(element);
    const textStyle = globalThis.getComputedStyle(text);
    return {
      rect: rect(element),
      background: style.backgroundColor,
      border: style.border,
      borderRadius: style.borderRadius,
      textX: staticFallback
        ? rect(text)[0]
        : Number(
            (text.getBoundingClientRect().x + Number.parseFloat(textStyle.paddingLeft)).toFixed(3),
          ),
      shortcut: rect(shortcut),
    };
  }, fallback);

try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    globalThis.__referenceFrames = [];
    const sample = () => {
      const root = globalThis.document.getElementById('reference-root');
      const shell = root?.querySelector('.reference-shell');
      const main = root?.querySelector('#main');
      const heading = main?.querySelector('h1');
      const navigationHeaders = [
        ...(root?.querySelectorAll('.reference-nav-group summary, .fui-AccordionHeader__button') ??
          []),
      ].filter((element) => globalThis.getComputedStyle(element).visibility !== 'hidden');
      const settings = root?.querySelector(
        '.reference-theme-fallback, [data-shell-theme] button[aria-label="Settings"]',
      );
      if (root) {
        const rootStyle = globalThis.getComputedStyle(root);
        const shellStyle = shell ? globalThis.getComputedStyle(shell) : null;
        globalThis.__referenceFrames.push({
          rootVisible:
            rootStyle.display !== 'none' &&
            rootStyle.visibility !== 'hidden' &&
            Number(rootStyle.opacity) !== 0,
          shellVisible:
            !!shell &&
            shellStyle?.display !== 'none' &&
            shellStyle?.visibility !== 'hidden' &&
            Number(shellStyle?.opacity) !== 0,
          mainText: main?.textContent?.trim() ?? '',
          heading: heading?.textContent?.trim() ?? '',
          navigationComplete:
            navigationHeaders.length === 5 &&
            !!settings &&
            globalThis.getComputedStyle(settings).visibility !== 'hidden',
        });
      }
      globalThis.requestAnimationFrame(sample);
    };
    globalThis.requestAnimationFrame(sample);
  });

  const reloadPage = await context.newPage();
  await reloadPage.route(/\/assets\/main-[^/]+\.js$/, (route) => delayRoute(route, 800));
  await reloadPage.goto(buttonUrl.href, { waitUntil: 'commit' });
  await reloadPage.locator('.reference-shell').waitFor();
  await reloadPage.getByRole('heading', { name: 'Button', exact: true }).waitFor();
  const before = await reloadPage.locator('.app-content').boundingBox();
  const navigationBefore = await readNavigationGeometry(reloadPage);
  const searchBefore = await readSearchPresentation(reloadPage, true);
  assert.ok(before, 'The static shell is laid out before the application bundle loads');
  await reloadPage.locator('[data-reference-ready="true"]').waitFor();
  await reloadPage.locator('.app-sidenav__nav.shell-slot-ready').waitFor();
  const after = await reloadPage.locator('.app-content').boundingBox();
  const navigationAfter = await readNavigationGeometry(reloadPage);
  const searchAfter = await readSearchPresentation(reloadPage, false);
  assert.ok(after, 'The hydrated shell remains laid out');
  assert.ok(Math.abs(before.x - after.x) <= 1, 'Hydration does not move the content shell');
  assert.ok(
    Math.abs(before.width - after.width) <= 1,
    'Hydration does not resize the content shell',
  );
  assert.deepEqual(
    navigationAfter,
    navigationBefore,
    'Hydration keeps navigation groups and the active item in the same positions',
  );
  assert.deepEqual(searchAfter, searchBefore, 'Hydration keeps the search control visually stable');
  const reloadFrames = await readFrames(reloadPage);
  assert.ok(reloadFrames.length > 10, 'The reload check samples multiple animation frames');
  assert.ok(
    reloadFrames.every((frame) => frame.rootVisible),
    'The root never becomes invisible',
  );
  assert.ok(
    reloadFrames.every((frame) => frame.shellVisible),
    'The shell never becomes invisible',
  );
  assert.ok(
    reloadFrames.every((frame) => frame.mainText),
    'The page never becomes blank',
  );
  assert.ok(
    reloadFrames.every((frame) => frame.navigationComplete),
    'The navigation content never becomes incomplete during hydration',
  );
  await reloadPage.close();

  const hydrationPage = await context.newPage();
  let exampleRequested;
  const exampleRequest = new Promise((resolve) => {
    exampleRequested = resolve;
  });
  await hydrationPage.route(/\/assets\/components-button-button-[^/]+\.js$/, async (route) => {
    exampleRequested();
    await delayRoute(route, 800);
  });
  await hydrationPage.goto(buttonUrl.href);
  await exampleRequest;
  assert.ok(
    await hydrationPage.getByRole('heading', { name: 'Button', exact: true }).isVisible(),
    'The page header remains visible while its example bundle loads',
  );
  assert.ok(
    await hydrationPage.getByRole('tab', { name: 'Usage', exact: true }).isVisible(),
    'Usage and Samples tabs render before the example bundle',
  );
  assert.ok(
    await hydrationPage.locator('[data-page-panel="usage"]').isVisible(),
    'Usage content remains visible while examples load',
  );
  assert.ok(
    !(await hydrationPage.locator('[data-page-panel="samples"]').isVisible()),
    'Samples content does not flash before tab state is applied',
  );
  assert.ok(
    await hydrationPage
      .getByText('Loading interactive example. Full source is available below.')
      .first()
      .isVisible(),
    'The static preview remains visible until the live example replaces it',
  );
  await hydrationPage.locator('[data-reference-ready="true"]').waitFor();
  const hydrationFrames = await readFrames(hydrationPage);
  assert.ok(
    hydrationFrames.every((frame) => frame.mainText),
    'Lazy page hydration never blanks the main content',
  );

  let releaseNavigation;
  const navigationGate = new Promise((resolve) => {
    releaseNavigation = resolve;
  });
  let navigationRequested;
  const navigationRequest = new Promise((resolve) => {
    navigationRequested = resolve;
  });
  await hydrationPage.route(dropdownUrl.href, async (route) => {
    navigationRequested();
    await navigationGate;
    await route.continue();
  });
  await readFrames(hydrationPage);
  await hydrationPage.getByRole('tab', { name: 'Dropdown', exact: true }).click();
  await navigationRequest;
  assert.ok(
    await hydrationPage.getByRole('heading', { name: 'Button', exact: true }).isVisible(),
    'The current page remains visible while the destination HTML loads',
  );
  assert.equal(
    await hydrationPage.getByText('Loading documentation…').count(),
    0,
    'Client navigation does not replace the page with a loading placeholder',
  );
  releaseNavigation();
  await hydrationPage.getByRole('heading', { name: 'Dropdown', exact: true }).waitFor();
  await hydrationPage.locator('[data-reference-ready="true"]').waitFor();
  const navigationFrames = await readFrames(hydrationPage);
  assert.ok(navigationFrames.length > 0, 'The navigation check samples animation frames');
  assert.ok(
    navigationFrames.every((frame) => frame.mainText && frame.heading),
    'Client navigation always shows a complete page heading and content',
  );

  const homePage = await context.newPage();
  await homePage.route(/\/assets\/main-[^/]+\.js$/, (route) => delayRoute(route, 800));
  let graphicRequested;
  const graphicRequest = new Promise((resolve) => {
    graphicRequested = resolve;
  });
  await homePage.route(/\/assets\/CoreAILogoCube-[^/]+\.js$/, async (route) => {
    graphicRequested();
    await delayRoute(route, 800);
  });
  await homePage.goto(root.href, { waitUntil: 'commit' });
  await homePage.locator('.home-widget').waitFor();
  const readHomeActions = () =>
    homePage.evaluate(() =>
      [...globalThis.document.querySelectorAll('.home-agent-entry > :not(details)')].map(
        (element) => {
          const bounds = element.getBoundingClientRect();
          const style = globalThis.getComputedStyle(element);
          return {
            rect: [bounds.x, bounds.y, bounds.width, bounds.height].map((value) =>
              Number(value.toFixed(3)),
            ),
            background: style.backgroundColor,
            border: style.border,
            color: style.color,
            font: style.font,
            letterSpacing: style.letterSpacing,
            padding: style.padding,
          };
        },
      ),
    );
  const homeActionsBefore = await readHomeActions();
  const homeBackgroundBefore = await homePage.evaluate(() => {
    const content = globalThis.document.querySelector('.app-content');
    const page = globalThis.document.querySelector('.app-page');
    return {
      contentHome: content?.classList.contains('app-content--home'),
      pageHome: page?.classList.contains('app-page--home'),
      pageBackground: page ? globalThis.getComputedStyle(page).backgroundColor : null,
    };
  });
  await graphicRequest;
  await homePage.locator('[data-reference-ready="true"]').waitFor();
  await homePage.locator('.home-widget.page-widget-ready').waitFor();
  const homeActionsAfter = await readHomeActions();
  const homeBackgroundAfter = await homePage.evaluate(() => {
    const content = globalThis.document.querySelector('.app-content');
    const page = globalThis.document.querySelector('.app-page');
    return {
      contentHome: content?.classList.contains('app-content--home'),
      pageHome: page?.classList.contains('app-page--home'),
      pageBackground: page ? globalThis.getComputedStyle(page).backgroundColor : null,
    };
  });
  assert.deepEqual(
    homeBackgroundAfter,
    homeBackgroundBefore,
    'Home keeps the same shell classes and background through hydration',
  );
  assert.deepEqual(
    homeActionsAfter,
    homeActionsBefore,
    'Home keeps the same starter actions through hydration',
  );
  assert.equal(
    await homePage.locator('.home-visual').locator('img, svg, canvas, [role="img"]').count(),
    0,
    'Home shows no placeholder while the interactive illustration loads',
  );
  await homePage.locator('.coreai-logo-cube[data-ready="true"]').waitFor();
} finally {
  await browser.close();
}

console.log(
  'Reference flicker: stable nav, delayed reload, hydration, navigation, and Home graphic passed',
);
