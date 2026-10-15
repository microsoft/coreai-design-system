// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const repoRoot = new URL('../../../', import.meta.url);

test('navigation footer casts a shell-colored upward shadow inside the sidebar', async () => {
  const styles = await fs.readFile(
    new URL('apps/docsite/src/styles/docsite.css', repoRoot),
    'utf8',
  );
  assert.match(styles, /\.app-sidenav \{[^}]*overflow: hidden;/);
  assert.match(
    styles,
    /\.app-sidenav__footer \{[^}]*z-index: 1;[^}]*background: var\(--home-backdrop-color\);[^}]*box-shadow: 0 -16px 24px -2px var\(--home-backdrop-color\);/,
  );
  assert.match(
    styles,
    /\.app-sidenav::after \{[^}]*z-index: 2;[^}]*outline: inherit;[^}]*outline-offset: inherit;[^}]*pointer-events: none;/,
  );
  assert.match(
    styles,
    /\.app-sidenav__footer::before \{[^}]*top: -1px;[^}]*height: 1px;[^}]*background: var\(--app-sidenav-border\);/,
  );
});

test('active navigation items scroll once per route, not when browsing sections', async () => {
  const source = await fs.readFile(
    new URL('apps/docsite/src/components/Sidebar.tsx', repoRoot),
    'utf8',
  );
  assert.match(source, /ref=\{navigationRef\}/);
  assert.ok(source.includes('[role="tab"][aria-selected="true"]'));
  assert.match(source, /navigation\.scrollTop \+= item\.bottom - viewport\.bottom/);
  assert.match(source, /navigation\.scrollTop \+= item\.top - viewport\.top/);
  assert.match(source, /\[activePagePath, openGroups, isCollapsed, isOpen, query\]/);
  assert.match(source, /cancelAnimationFrame\(frame\)/);
  assert.match(source, /const revealActivePageRef = React\.useRef\(true\)/);
  assert.match(
    source,
    /revealActivePageRef\.current = true;[\s\S]*?\}, \[activeGroup, activePagePath\]\)/,
  );
  assert.match(
    source,
    /requestAnimationFrame\(\(\) => \{\s*if \(!revealActivePageRef\.current\) return;/,
  );
  assert.match(
    source,
    /if \(!navigation \|\| !activeTab \|\| !activeTab\.getClientRects\(\)\.length\) return;\s*revealActivePageRef\.current = false;/,
  );
  assert.match(
    source,
    /current\.includes\(activeGroup\.label\) \? current : \[\.\.\.current, activeGroup\.label\],[\s\S]*?\}, \[activeGroup, activePagePath\]\)/,
  );
});

test('home illustration fades in only after a complete frame', async () => {
  const [source, styles] = await Promise.all([
    fs.readFile(new URL('apps/docsite/src/components/CoreAILogoCube.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/styles/docsite.css', repoRoot), 'utf8'),
  ]);
  assert.match(source, /const \[isReady, setIsReady\] = React\.useState\(false\)/);
  assert.match(source, /\+\+startupFramesRef\.current === 2\) onReady\(\)/);
  assert.match(source, /data-ready=\{isReady\}/);
  assert.match(source, /onReady=\{handleReady\}/);
  assert.match(
    styles,
    /\.home-visual \.coreai-logo-cube \{\s*opacity: 0;\s*transition: opacity 400ms ease-out;/,
  );
  assert.match(styles, /\.home-visual \.coreai-logo-cube\[data-ready='true'\] \{\s*opacity: 1;/);
  const reducedMotionStyles = styles.slice(
    styles.lastIndexOf('@media (prefers-reduced-motion: reduce)'),
  );
  assert.match(
    reducedMotionStyles,
    /\*,\s*\*::before,\s*\*::after \{[^}]*transition-duration: 0s !important;[^}]*transition-delay: 0s !important;/,
  );
});

test('docsite dropdowns use CoreAI popovers instead of native selects', async () => {
  const srcRoot = new URL('apps/docsite/src/', repoRoot);
  const sourcePaths = await fs.readdir(srcRoot, { recursive: true });
  for (const path of sourcePaths.filter((path) => /\.(tsx|jsx)$/.test(path))) {
    const source = await fs.readFile(new URL(path, srcRoot), 'utf8');
    assert.doesNotMatch(source, /<(?:select|Select|option)\b/, path);
  }
  const source = await fs.readFile(
    new URL('apps/docsite/src/components/ComponentPage.tsx', repoRoot),
    'utf8',
  );
  assert.match(source, /<Dropdown/);
  assert.match(source, /selectedOptions=\{activeStoryId \? \[activeStoryId\] : \[\]\}/);
  assert.match(
    source,
    /storyOptions\.find\(\(story\) => story\.storyId === activeStoryId\)\?\.label/,
  );
  assert.match(source, /setSelectedStoryId\(data\.optionValue\)/);
  assert.match(
    source,
    /<Option key=\{story\.storyId\} value=\{story\.storyId\} text=\{story\.label\}>/,
  );
});

test('Storybook embeds follow the resolved docsite mode without resetting story selection', async () => {
  const source = await fs.readFile(
    new URL('apps/docsite/src/components/ComponentPage.tsx', repoRoot),
    'utf8',
  );
  assert.match(source, /const \{ mode \} = useThemeMode\(\)/);
  assert.match(source, /getComponentSourceUrl\(previewSource, activeStoryId\)/);
  assert.match(source, /new URL\(storyUrl\)/);
  assert.match(source, /globals\.push\(`mode:\$\{mode\}`\)/);
  assert.ok(source.includes("searchParams.set('globals', globals.join(';'))"));
  assert.match(source, /src=\{embedUrl\.toString\(\)\}/);
  assert.match(source, /setSelectedStoryId\(undefined\);\s*\}, \[content\.id\]\)/);
});

test('system theme updates respect saved preferences and clean up their listener', async () => {
  const source = await fs.readFile(
    new URL('apps/docsite/src/theme/ThemeProvider.tsx', repoRoot),
    'utf8',
  );
  assert.match(source, /window\.matchMedia\('\(prefers-color-scheme: light\)'\)/);
  assert.match(source, /stored !== 'light' && stored !== 'dark'/);
  assert.match(source, /setPreferenceState\(systemTheme\.matches \? 'light' : 'dark'\)/);
  assert.match(source, /addEventListener\('change', followSystemTheme\)/);
  assert.match(source, /removeEventListener\('change', followSystemTheme\)/);
});

test('mobile navigation behaves as an accessible modal overlay', async () => {
  const [shellSource, sidebarSource] = await Promise.all([
    fs.readFile(new URL('apps/docsite/src/components/Shell.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/components/Sidebar.tsx', repoRoot), 'utf8'),
  ]);

  assert.match(shellSource, /pageRef\.current\.inert = navigationOpen/);
  assert.match(shellSource, /menuButtonRef\.current\?\.focus\(\)/);
  assert.match(shellSource, /getComputedStyle\(navigation\)\.position !== 'fixed'/);
  assert.match(sidebarSource, /aria-modal=\{isOpen \|\| undefined\}/);
  assert.match(sidebarSource, /event\.key === 'Escape'/);
  assert.match(sidebarSource, /event\.key !== 'Tab'/);
  assert.doesNotMatch(sidebarSource, /max-width:\s*1100px/);
});

test('theme surfaces switch together before normal transitions resume', async () => {
  const [theme, styles] = await Promise.all([
    fs.readFile(new URL('apps/docsite/src/theme/ThemeProvider.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/styles/docsite.css', repoRoot), 'utf8'),
  ]);
  assert.match(
    theme,
    /React\.useLayoutEffect\(\(\) => \{\s*const root = document\.documentElement;/,
  );
  assert.match(
    theme,
    /root\.classList\.add\('theme-transitioning'\);\s*root\.dataset\.theme = mode/,
  );
  assert.match(
    theme,
    /const paintFrame = requestAnimationFrame\(\(\) => \{\s*restoreFrame = requestAnimationFrame/,
  );
  assert.match(theme, /cancelAnimationFrame\(paintFrame\);\s*cancelAnimationFrame\(restoreFrame\)/);
  assert.doesNotMatch(theme, /setTimeout|didMount/);
  assert.match(theme, /background: 'transparent'/);
  assert.match(styles, /\.theme-transitioning \*::after \{\s*transition: none !important;/);
  assert.doesNotMatch(styles, /transition: opacity 250ms ease !important/);
});

test('landing page has an interactive logo alongside vertically centered content', async () => {
  const [homeSource, logoSource, stylesSource] = await Promise.all([
    fs.readFile(new URL('apps/docsite/src/pages/Introduction.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/components/CoreAILogoCube.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/styles/docsite.css', repoRoot), 'utf8'),
  ]);

  assert.match(homeSource, /className="home-visual"/);
  assert.match(homeSource, /<CoreAILogoCube \/>/);
  assert.match(logoSource, /<OrbitControls[^>]*enablePan=\{false\}\s+enableZoom=\{false\}/);
  assert.match(logoSource, /new IntersectionObserver/);
  assert.match(logoSource, /intersectionObserver\.disconnect\(\)/);
  assert.match(logoSource, /document\.addEventListener\('visibilitychange'/);
  assert.match(logoSource, /document\.removeEventListener\('visibilitychange'/);
  assert.match(logoSource, /dpr=\{\[1, 2\]\}/);
  assert.match(logoSource, /frameloop=\{shouldRender \? 'always' : 'never'\}/);
  assert.match(stylesSource, /\.home-landing \{[^}]*align-items: center/);
  assert.match(
    stylesSource,
    /\.app-page--home \.site-main \{[^}]*overflow: visible;[^}]*animation: none;/,
  );
  assert.match(stylesSource, /\.home-visual \{\s*position: fixed;/);
  assert.match(stylesSource, /calc\(120vh \* var\(--logo-scale, 1\)\)/);
  assert.match(stylesSource, /@media \(max-width: 800px\)/);
  assert.doesNotMatch(homeSource, /home-logo-background|BasicGrid/);
  assert.doesNotMatch(stylesSource, /basic-grid/);
});

test('Home is in Overview and the logo toggles a button-only desktop sidebar', async () => {
  const [registrySource, sidebar, styles] = await Promise.all([
    fs.readFile(new URL('apps/docsite/site-registry.json', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/components/Sidebar.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/styles/docsite.css', repoRoot), 'utf8'),
  ]);
  const home = JSON.parse(registrySource).pages.find((page) => page.slug === '/');
  assert.equal(home.navLabel, 'Home');
  assert.equal(home.id, 'home');
  assert.equal(home.group, 'Overview');
  assert.equal(home.showInSidebar, true);
  assert.match(sidebar, /setIsCollapsed\(\(current\) => !current\)/);
  assert.match(sidebar, /aria-expanded=\{isOpen \|\| !isCollapsed\}/);
  assert.match(sidebar, /aria-controls="app-navigation-links"/);
  assert.match(sidebar, /localStorage\.getItem\(sidebarStorageKey\) === 'true'/);
  assert.match(sidebar, /if \(typeof localStorage === 'undefined'\) return;/);
  assert.match(sidebar, /localStorage\.setItem\(sidebarStorageKey, String\(isCollapsed\)\)/);
  assert.doesNotMatch(sidebar, /RouterLink|CoreAI home/);
  assert.match(styles, /@media \(min-width: 1101px\)/);
  assert.match(styles, /\.app-sidenav\.is-collapsed \{\s*width: 48px;\s*height: 48px;/);
  assert.match(styles, /width var\(--mf-duration-smooth\) var\(--mf-ease\)/);
  assert.match(styles, /opacity: 0;\s*visibility: hidden;\s*pointer-events: none;/);
  assert.match(styles, /transition-delay: 0s !important/);
});

test('collapsed navigation overlays the page and shortcut toggles do not focus the logo', async () => {
  const [sidebar, styles] = await Promise.all([
    fs.readFile(new URL('apps/docsite/src/components/Sidebar.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/styles/docsite.css', repoRoot), 'utf8'),
  ]);
  assert.match(styles, /\.app-body \{\s*position: relative;/);
  assert.match(
    styles,
    /\.app-sidenav\.is-collapsed \{[^}]*position: absolute;[^}]*top: 4px;[^}]*left: 4px;/,
  );
  assert.match(sidebar, /onToggleNavigation: toggleNavigationFromShortcut/);
  assert.match(sidebar, /sidebarRef\.current\?\.contains\(focusedElement\)/);
  assert.match(sidebar, /focusedElement\.blur\(\)/);
  const toggle = sidebar.slice(
    sidebar.indexOf('const toggleNavigation ='),
    sidebar.indexOf('const toggleNavigationFromShortcut ='),
  );
  assert.doesNotMatch(toggle, /\.focus\(/);
  assert.match(styles, /\.app-sidenav__nav \.fui-Tab \{\s*padding-left: 16px;/);
  assert.match(styles, /\.app-sidenav__nav \.fui-AccordionHeader__button \{\s*padding-left: 8px;/);
});

test('illustration uses Paper dithering and stationary lights without tuning controls', async () => {
  const [home, logo, adapter, styles] = await Promise.all([
    fs.readFile(new URL('apps/docsite/src/pages/Introduction.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/components/CoreAILogoCube.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/components/paper-dithering.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/styles/docsite.css', repoRoot), 'utf8'),
  ]);
  assert.doesNotMatch(home + styles, /LogoControls|logo-controls/);
  assert.match(logo, /<StaticLighting monochrome=\{monochrome\} \/>\s*<LogoCubeMesh/);
  assert.doesNotMatch(logo.match(/<group[\s\S]*?<\/group>/)?.[0] ?? '', /StaticLighting/);
  assert.match(logo, /if \(!reduceMotion\) animationTimeRef\.current \+=/);
  assert.match(logo, /scale: 1\.19 \* 1\.25/);
  assert.match(logo, /const rotationSpeed = 0\.18 \* 0\.67 \* 0\.67;/);
  assert.match(
    logo,
    /<PaperHeatmap reduceMotion=\{reduceMotion\} lightMode=\{mode === 'light'\} \/>\s*<PaperDithering \/>/,
  );
  assert.doesNotMatch(logo, /ditherFragmentShader|OrderedDither|OutputLevels|bayer4|dotMask/);
  assert.match(adapter, /imageDitheringFragmentShader \} from '@paper-design\/shaders'/);
  assert.match(adapter, /extends ShaderPass/);
  assert.match(adapter, /image\.rgb \/= max\(surfaceAlpha, 0\.00001\)/);
  assert.match(adapter, /clamp\(color, 0\.0, 1\.0\) \* surfaceAlpha, surfaceAlpha/);
  assert.match(adapter, /'u_image'/);
  assert.match(adapter, /\.replace\(imageFlip, ''\)/);
  assert.match(adapter, /this\.resolution\.set\(width, height\)/);
  assert.match(adapter, /pass\.pixelRatio\.value = pixelRatio/);
  assert.match(adapter, /pass\.dispose\(\)/);
  assert.match(adapter, /u_originalColors: new Uniform\(true\)/);
  assert.match(
    styles,
    /\.home-resource-links \.app-sidenav__quick-link \{[^}]*border-radius: var\(--borderRadius2XLarge\)/,
  );
});

test('Paper heatmap prepares live channels and preserves the original cube surface', async () => {
  const source = await fs.readFile(
    new URL('apps/docsite/src/components/paper-heatmap.tsx', repoRoot),
    'utf8',
  );
  assert.match(source, /heatmapFragmentShader/);
  assert.match(source, /from '@paper-design\/shaders'/);
  assert.match(source, /fragmentShader: heatmapFragmentShader\.replace\('#version 300 es', ''\)/);
  assert.match(source, /new KawaseBlurPass/);
  assert.match(source, /512 \/ Math\.max\(width, height\)/);
  assert.match(source, /vec4\(heat \* surface\.a, surface\.a\)/);
  assert.doesNotMatch(source, /heat \* surface\.rgb|heat \* lighting/);
  assert.match(source, /lessThanEqual\(abs\(heat - u_base\.rgb\), vec3\(0\.012\)\)/);
  assert.match(source, /pass\.setLightMode\(lightMode\)/);
  assert.match(source, /if \(!reduceMotion\) pass\.time\.value \+=/);
  assert.match(source, /pass\.time\.value \+= Math\.min\(delta, 0\.1\) \* 0\.67/);
  assert.match(source, /stage\.dispose\(\)/);
  assert.match(source, /buffer\.dispose\(\)/);
  assert.equal((source.match(/coreaiDarkTheme\.colorNeutralBackground6/g) ?? []).length, 2);
  assert.match(source, /coreaiBrandVariants\[80\]/);
  for (const mode of ['dark', 'light']) {
    const palette = source
      .match(new RegExp(`const ${mode}Colors = \\[([\\s\\S]*?)\\n\\];`))[1]
      .split(',')
      .map((color) => color.trim())
      .filter(Boolean);
    assert.equal(palette.length, 10);
    assert.equal(
      palette[0],
      mode === 'dark'
        ? 'coreaiDarkTheme.colorNeutralBackground6'
        : 'coreaiLightTheme.colorNeutralBackground1',
    );
    assert.deepEqual(palette.slice(0, 2), Array(2).fill(palette[0]));
    assert.equal(palette[2], '`${coreaiBrandVariants[140]}1f`');
    assert.deepEqual(
      palette.slice(3),
      [140, 130, 110, 100, 80, 80, 80].map((tone) => `coreaiBrandVariants[${tone}]`),
    );
  }
  assert.doesNotMatch(source, /azureBrandVariants/);
  assert.doesNotMatch(source, /coreaiDarkTheme\.colorNeutralForeground1/);
  assert.doesNotMatch(source, /coreaiDarkTheme\.colorNeutralForeground[34]/);
  assert.match(source, /u_contour: new Uniform\(1\)/);
  assert.match(source, /u_noise: new Uniform\(0\.025\)/);
});

test('search selection clears the filter, navigates, and closes the sidebar without tracking', async () => {
  const [sidebarSource, appSource] = await Promise.all([
    fs.readFile(new URL('apps/docsite/src/components/Sidebar.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/App.tsx', repoRoot), 'utf8'),
  ]);

  assert.match(sidebarSource, /if \(query\.trim\(\)\) \{\s*setQuery\(''\);\s*\}/);
  assert.match(sidebarSource, /navigate\(String\(data\.value\)\);\s*onClose\(\)/);
  assert.match(sidebarSource, /searchPages\(pages, needle\)/);
  assert.match(sidebarSource, /setQuery\(''\);\s*navigate\(slug\);\s*onClose\(\)/);
  assert.match(sidebarSource, /onChange=\{\(_event, data\) => setQuery\(data\.value\)\}/);
  assert.match(appSource, /<Navigate to=\{redirect\.to\} replace \/>/);
  assert.match(appSource, /<Route path="\*" element=\{<NotFound \/>\} \/>/);
});

test('Figma previews and resources coexist with Storybook and Markdown actions', async () => {
  const [component, icons, introduction, styles, home] = await Promise.all([
    fs.readFile(new URL('apps/docsite/src/components/ComponentPage.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/components/Icons.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/storybook/src/stories/docs/IntroductionPage.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/styles/docsite.css', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/pages/Introduction.tsx', repoRoot), 'utf8'),
  ]);
  assert.match(component, /if \(source\.kind === 'figma'\)/);
  assert.match(component, /encodeURIComponent\(figmaPreviewSource\.url\)/);
  assert.match(component, /src=\{figmaEmbedUrl\}/);
  assert.match(component, /content\.figmaPreviewSourceId && !hasStorybookResource/);
  assert.match(icons, /export function FigmaLogo/);
  assert.match(styles, /\.component-embed--figma \{\s*height: 560px/);
  assert.match(styles, /\.component-resources \.component-resource-card--disabled/);
  assert.match(home, /href=\{siteLinks\.figma\}/);
  assert.match(introduction, /href: siteLinks\.figma/);
  assert.match(home, /href=\{siteLinks\.storybook\}/);
  assert.match(component, /src=\{embedUrl\.toString\(\)\}/);
  assert.match(component, /content\.resourceSourceIds\.map/);
  assert.match(component, /content\.resourceSourceIds\.length > 0/);
  assert.match(component, /navigator\.clipboard\.writeText\(await response\.text\(\)\)/);
  assert.match(component, /href=\{markdownUrl\}/);
  assert.match(introduction, /href: siteLinks\.docsite/);
});

test('landing fade sits between the joined cubes and clickable hero content', async () => {
  const [logo, styles] = await Promise.all([
    fs.readFile(new URL('apps/docsite/src/components/CoreAILogoCube.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/styles/docsite.css', repoRoot), 'utf8'),
  ]);
  assert.match(logo, /position: \[x \* 0\.94, y \* 0\.94, 0\]/);
  assert.match(
    styles,
    /\.home-landing::before \{[^}]*z-index: 1;[^}]*pointer-events: none;[^}]*radial-gradient\(/,
  );
  assert.match(styles, /\.home-visual \{[^}]*z-index: 0;/);
  assert.match(styles, /\.home-foreground \{[^}]*z-index: 2;/);
  assert.match(styles, /\.home-landing::before \{\s*display: none;/);
});

test('landing page reserves audience content and exposes Storybook, Figma, and npm links', async () => {
  const [homeSource, registrySource] = await Promise.all([
    fs.readFile(new URL('apps/docsite/src/pages/Introduction.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/site-registry.json', repoRoot), 'utf8'),
  ]);
  assert.match(homeSource, /<PageLayout id="home" hideTitle>/);
  assert.match(homeSource, /Audience cards will return when their supporting content is ready/);
  assert.doesNotMatch(homeSource, /className="home-audiences"/);
  assert.match(homeSource, /href=\{siteLinks\.storybook\}/);
  assert.match(homeSource, /href=\{siteLinks\.figma\}/);
  assert.match(
    homeSource,
    /<FigmaLogo className="app-sidenav__quick-link-brand app-sidenav__figma-logo" \/>/,
  );
  assert.match(homeSource, /href=\{siteLinks\.npmPackage\}/);
  assert.match(homeSource, /<NpmLogo className="app-sidenav__quick-link-brand" \/>/);
  assert.equal((homeSource.match(/className="app-sidenav__quick-link-title"/g) ?? []).length, 3);
  assert.doesNotMatch(homeSource, /Same Foundry look|New foundation/);
  assert.match(homeSource, /className="home-resource-links app-sidenav__quick-links"/);
  assert.equal((homeSource.match(/className="app-sidenav__quick-link"/g) ?? []).length, 3);
  assert.equal(
    (homeSource.match(/<ExternalIcon className="app-sidenav__quick-link-open"/g) ?? []).length,
    3,
  );
  assert.doesNotMatch(homeSource, /description:|home-card__description/);
  const home = JSON.parse(registrySource).pages.find((page) => page.id === 'home');
  assert.deepEqual(
    home.anchors.map((anchor) => anchor.id),
    ['get-started'],
  );
});

test('Typography retains the branded external font download without setup instructions', async () => {
  const source = await fs.readFile(
    new URL('apps/docsite/src/pages/Typography.tsx', repoRoot),
    'utf8',
  );
  assert.match(
    source,
    /<Link href=\{siteLinks\.fontDownload\} external>\s*Download Aptos from Microsoft\s*<\/Link>/,
  );
  assert.doesNotMatch(source, /Set up Aptos|siteLinks\.fontGuide/);
});

test('sidebar pages follow the Figma information architecture', async () => {
  const { pages } = JSON.parse(
    await fs.readFile(new URL('apps/docsite/site-registry.json', repoRoot), 'utf8'),
  );
  const expectedGroups = {
    Overview: ['Home', 'Resources', 'FAQs'],
    'For humans': ['Prototyping', 'NPM package'],
    'For agents': ['MCP server', 'Package skill'],
    Foundations: ['Colors', 'Typography', 'Content'],
  };
  for (const [group, labels] of Object.entries(expectedGroups)) {
    assert.deepEqual(
      pages
        .filter((page) => page.showInSidebar && page.group === group)
        .map((page) => page.navLabel),
      labels,
    );
  }
  assert.equal(new Set(pages.map((page) => page.id)).size, pages.length);
  assert.equal(new Set(pages.map((page) => page.slug)).size, pages.length);
  const registrySource = await fs.readFile(
    new URL('apps/docsite/src/data/registry.ts', repoRoot),
    'utf8',
  );
  assert.deepEqual(
    [...registrySource.matchAll(/\{ label: '([^']+)', group:/g)].map((match) => match[1]),
    [...Object.keys(expectedGroups), 'Components', 'Templates', 'Samples'],
  );
  for (const label of ['Overview', 'For humans', 'For agents']) {
    assert.ok(
      registrySource.includes(`{ label: '${label}', group: '${label}', layout: 'standalone' }`),
    );
  }
});

test('empty sections stay visible outside search and content search uses page results', async () => {
  const [registrySource, sidebarSource, searchSource] = await Promise.all([
    fs.readFile(new URL('apps/docsite/src/data/registry.ts', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/components/Sidebar.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/data/search.ts', repoRoot), 'utf8'),
  ]);
  assert.doesNotMatch(registrySource, /\.filter\(\(entry\) => entry\.items\.length > 0\)/);
  assert.match(sidebarSource, /const groups = sidebarGroups;/);
  assert.match(sidebarSource, /needle \? \(\s*<div className="app-search-results">/);
  assert.match(sidebarSource, /<HighlightedText text=\{excerpt\} query=\{needle\} \/>/);
  assert.match(searchSource, /page\.searchText/);
  assert.match(searchSource, /authoredSearchText\.get\(page\.id\)/);
  assert.match(
    sidebarSource,
    /group\.label === 'Overview' \|\| group\.label === activeGroup\?\.label/,
  );
});

test('resources uses existing link destinations and CoreAI cards', async () => {
  const [resources, app, registry, styles] = await Promise.all([
    fs.readFile(new URL('apps/docsite/src/data/resources.ts', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/App.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/site-registry.json', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/styles/docsite.css', repoRoot), 'utf8'),
  ]);
  assert.deepEqual(
    [...resources.matchAll(/href: siteLinks\.(\w+)/g)].map((match) => match[1]),
    [
      'figma',
      'storybook',
      'fontDownload',
      'packageReadme',
      'npmPackage',
      'changelog',
      'repo',
      'contact',
      'feedback',
    ],
  );
  assert.doesNotMatch(resources, /https?:\/\//);
  assert.match(app, /className="resource-card-link"/);
  assert.match(app, /href=\{resource\.href\}/);
  assert.match(
    app,
    /<Card\s+appearance="filled-alternative"\s+focusMode="off"\s+className="resource-card"\s*>/,
  );
  assert.doesNotMatch(styles, /\[data-page-id='resources'\] \.site-main/);
  const iconStyles = styles.match(/\.resource-card__icon \{([^}]*)\}/)?.[1];
  assert.ok(iconStyles, 'Resource icons must have their own size and color rules.');
  assert.match(iconStyles, /width: 24px;\s*height: 24px;/);
  assert.match(iconStyles, /color: var\(--colorNeutralForeground2\);/);
  assert.doesNotMatch(iconStyles, /background(?:-color)?:/);
  assert.match(
    styles,
    /\.resource-card__destination \{[^}]*color: var\(--colorBrandForegroundLink\);/,
  );
  assert.match(
    styles,
    /\.resource-card-link:hover \.resource-card \{\s*background: var\(--colorNeutralBackground3Hover\);/,
  );
  assert.match(app, /aria-labelledby=\{`resource-\$\{resource\.id\}-title`\}/);
  assert.match(app, /opens in a new tab/);
  const page = JSON.parse(registry).pages.find((page) => page.id === 'resources');
  assert.equal(page.slug, '/resources/');
  assert.deepEqual(
    page.anchors.map((anchor) => anchor.id),
    ['assets', 'code', 'connect'],
  );
});

test('FAQ-only contents rail uses rendered anchors and follows the page scroll region', async () => {
  const [layout, css] = await Promise.all([
    fs.readFile(new URL('apps/docsite/src/components/PageLayout.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/styles/docsite.css', repoRoot), 'utf8'),
  ]);
  assert.match(layout, /main\?\.closest<HTMLDivElement>\('\.app-page'\)/);
  assert.match(layout, /const supportsToc = id === 'faqs';/);
  assert.match(layout, /if \(!main \|\| !scrollRegion \|\| !page \|\| !supportsToc\)/);
  assert.match(layout, /if \(!supportsToc\) \{\s*return content;/);
  assert.match(layout, /page\.anchors\.flatMap/);
  assert.match(layout, /main\.contains\(element\)/);
  assert.match(layout, /toc\.anchors\.length > 1/);
  assert.match(layout, /aria-label="On this page"/);
  assert.match(layout, /<LinkButton\s/);
  assert.match(layout, /appearance="subtle"/);
  assert.match(layout, /selectedSectionRef\.current = anchor\.id/);
  assert.match(layout, /Math\.abs\(scrollRegion\.scrollTop - destination\) <= 2/);
  assert.match(layout, /scrollingToSectionRef\.current \|\|/);
  assert.match(layout, /scrollRegion\.removeEventListener\('scrollend', finishScroll\)/);
  assert.match(layout, /scrollRegion\.removeEventListener\('wheel', interruptScroll\)/);
  assert.match(layout, /href=\{`#\$\{anchor\.id\}`\}/);
  assert.match(layout, /aria-current=\{toc\.activeId === anchor\.id \? 'location'/);
  assert.match(layout, /scrollRegion\.removeEventListener\('scroll', scheduleUpdate\)/);
  assert.match(layout, /resizeObserver\.disconnect\(\)/);
  assert.match(layout, /window\.removeEventListener\('hashchange', followHash\)/);
  assert.match(css, /\.page-toc\s*\{\s*display: none;/);
  assert.match(css, /\.app-page:has\(\.page-layout--with-toc\)\s*\{\s*scroll-behavior: smooth;/);
  assert.match(css, /@media \(min-width: 1440px\)/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\) minmax\(0, 776px\) minmax\(0, 1fr\);/);
  assert.match(css, /\.page-layout--with-toc\s*\{[^}]*padding: 64px 64px 64px 16px;/);
  assert.match(css, /\.page-layout > \.site-main\s*\{[^}]*grid-column: 2;[^}]*padding: 0;/);
  assert.match(css, /\.page-layout--with-toc\s*\{[^}]*column-gap: 80px;/);
  assert.match(css, /\.page-toc\s*\{[^}]*grid-column: 3;[^}]*grid-row: 1;[^}]*max-width: 200px;/);
  assert.doesNotMatch(css, /\.page-toc__link\[aria-current='location'\]::before/);
});

test('FAQ answers retain research in the data and show optional useful links', async () => {
  const [faqs, app, registrySource] = await Promise.all([
    fs.readFile(new URL('apps/docsite/src/data/faqs.ts', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/App.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/site-registry.json', repoRoot), 'utf8'),
  ]);
  const questions = [...faqs.matchAll(/question: '([^']+)'/g)];
  const sourceLists = [...faqs.matchAll(/sources: \[/g)];
  assert.equal(questions.length, 11);
  assert.equal(sourceLists.length, questions.length);
  assert.doesNotMatch(faqs, /sources: \[\s*\]/);
  const ids = [...faqs.matchAll(/id: '([^']+)'/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.doesNotMatch(faqs, /teams\.microsoft\.com|sharepoint\.com|Azure Artifacts/);
  assert.match(faqs, /href: siteLinks\.storybookDocs\.variationsFromFluent/);
  assert.match(faqs, /Lyb3shKi3jWCYjxajCRqmt\/History\?node-id=12-7595/);
  assert.doesNotMatch(
    faqs,
    /id: '(code-as-truth|region-selection|mini-foundry-compatibility|component-defaults|different-documentation-audiences|contributing-beyond-code)'/,
  );
  assert.match(faqs, /label: 'Open a GitHub issue', href: siteLinks\.feedback/);
  assert.match(faqs, /links\?: FaqLink\[\]/);
  assert.match(app, /<Accordion className="faq-list" multiple collapsible>/);
  assert.match(app, /item\.links\?\.length/);
  assert.match(app, /href=\{link\.href\} external/);
  assert.doesNotMatch(app, /item\.sources|faq-sources/);
  assert.match(app, /aria-level=\{3\}/);
  const page = JSON.parse(registrySource).pages.find((page) => page.id === 'faqs');
  assert.equal(page.slug, '/faqs/');
  assert.deepEqual(
    page.anchors.map((anchor) => anchor.id),
    [
      'about-coreai',
      'getting-started',
      'using-components',
      'working-with-agents',
      'help-and-feedback',
    ],
  );
});

test('unfinished pages retain their routes and use the shared work-in-progress state', async () => {
  const [registrySource, appSource] = await Promise.all([
    fs.readFile(new URL('apps/docsite/site-registry.json', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/App.tsx', repoRoot), 'utf8'),
  ]);
  const { pages } = JSON.parse(registrySource);
  const blankPageIds = ['prototyping', 'content'];
  for (const id of blankPageIds) {
    const page = pages.find((entry) => entry.id === id);
    assert.equal(page.slug, `/${id}/`);
  }
  assert.ok(
    appSource.includes(
      `new Set(${JSON.stringify(blankPageIds).replaceAll('"', "'").replaceAll(',', ', ')})`,
    ),
  );
  assert.match(appSource, /blankPageIds\.has\(page\.id\)/);
  assert.match(
    appSource,
    /<PageLayout id=\{page\.id\} hideTitle summary="">\s*<WorkInProgress key=\{page\.id\} standalone \/>/,
  );
});

test('settings reuses Fluent controls with color mode above platform-specific shortcuts', async () => {
  const [settings, sidebar, styles] = await Promise.all([
    fs.readFile(new URL('apps/docsite/src/components/ThemeSwitcher.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/components/Sidebar.tsx', repoRoot), 'utf8'),
    fs.readFile(new URL('apps/docsite/src/styles/docsite.css', repoRoot), 'utf8'),
  ]);
  assert.match(settings, /Settings20Regular.*from '@fluentui\/react-icons'/);
  assert.match(settings, /icon=\{<Settings20Regular \/>\}/);
  assert.match(settings, /<Popover\s+trapFocus/);
  assert.match(settings, /positioning="below-start"/);
  assert.doesNotMatch(settings, /Close popover or overlay/);
  assert.match(settings, /<TabList\s+aria-label="Color mode"[\s\S]*Keyboard shortcuts/);
  assert.match(settings, /appearance="elevated"/);
  assert.match(settings, /<Tab value="dark">Dark<\/Tab>\s*<Tab value="light">Light<\/Tab>/);
  assert.match(settings, /<Text size=\{200\} foreground=\{2\}>\s*\{label\}\s*<\/Text>/);
  assert.match(styles, /\.docsite-settings__mode \{\s*align-self: flex-start;/);
  assert.match(styles, /\.docsite-settings__shortcuts \{[^}]*border-top-color: inherit;/);
  assert.match(settings, /isApplePlatform \? '⌥' : '⎇'/);
  assert.match(settings, /isApplePlatform \? '⌘' : '⌃'/);
  assert.match(settings, /<Badge\s+appearance="tint"/);
  assert.doesNotMatch(settings, /<kbd/);
  assert.match(settings, /className="docsite-settings__keys" aria-hidden="true"/);
  assert.match(settings, /<span className="sr-only">\{accessibleKeys\}<\/span>/);
  assert.doesNotMatch(settings, /<Select/);
  assert.doesNotMatch(settings, /<Field/);
  assert.match(styles, /\.docsite-settings \{\s*width: 220px;/);
  assert.match(
    settings,
    /<section className="docsite-settings__shortcuts" aria-label="Keyboard shortcuts">/,
  );
  assert.doesNotMatch(settings, /as="h2"/);
  assert.match(
    styles,
    /\.docsite-settings__shortcuts \{[^}]*margin-inline: calc\(-1 \* var\(--spacingHorizontalL\)\);[^}]*padding-inline: var\(--spacingHorizontalL\);/,
  );
  assert.match(styles, /\.docsite-settings__key-letter \{[^}]*font-size: var\(--fontSizeBase200\)/);
  assert.match(styles, /\.docsite-settings__key-symbol \{[^}]*font-size: var\(--fontSizeBase200\)/);
  assert.match(styles, /\.docsite-settings__keys \{[^}]*gap: 2px;[^}]*font-family: system-ui/);
  assert.match(settings, /selectedValue=\{preference\}/);
  assert.match(settings, /setPreference\(data\.value\)/);
  assert.match(settings, /isApplePlatform \? 'Option' : 'Alt'/);
  assert.match(settings, /isApplePlatform \? 'Cmd' : 'Ctrl'/);
  assert.match(settings, /event\.key === 'Escape'[\s\S]*event\.stopPropagation\(\)/);
  assert.match(sidebar, /!sidebarRef\.current\?\.contains\(event\.target\)/);
  assert.match(sidebar, /isApplePlatform=\{isApplePlatform\}/);
});
