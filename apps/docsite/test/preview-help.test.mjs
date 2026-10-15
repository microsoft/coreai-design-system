// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

test('Storybook recovery opens the selected story and reloads only the iframe', async () => {
  const [embed, component] = await Promise.all([
    fs.readFile(new URL('../src/components/EmbedFrame.tsx', import.meta.url), 'utf8'),
    fs.readFile(new URL('../src/components/ComponentPage.tsx', import.meta.url), 'utf8'),
  ]);
  assert.match(component, /signInUrl=\{storyUrl\}/);
  assert.match(embed, /signInUrl \? \(/);
  assert.match(embed, /<Link href=\{signInUrl\} external>/);
  assert.match(embed, /Preview not loading\?/);
  assert.match(embed, /key=\{`\$\{src\}-\$\{reloadKey\}`\}/);
  assert.match(embed, /setReloadKey\(\(key\) => key \+ 1\)/);
  assert.match(embed, /\[src, reloadKey\]/);
  assert.doesNotMatch(embed, /contentDocument|contentWindow|location\.reload|fetch\(/);
  const figmaEmbed = component.slice(component.indexOf('src={figmaEmbedUrl}'));
  assert.doesNotMatch(figmaEmbed, /signInUrl=/);
});

test('work-in-progress pages share a monochrome logo and existing suggestion intake', async () => {
  const [state, app, component, logo] = await Promise.all([
    fs.readFile(new URL('../src/components/work-in-progress.tsx', import.meta.url), 'utf8'),
    fs.readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
    fs.readFile(new URL('../src/components/ComponentPage.tsx', import.meta.url), 'utf8'),
    fs.readFile(new URL('../src/components/CoreAILogoCube.tsx', import.meta.url), 'utf8'),
  ]);
  assert.match(state, /Page under construction/);
  assert.doesNotMatch(state, /Tell us what/);
  assert.match(state, /href=\{siteLinks\.feedback\}[\s\S]*?external/);
  assert.match(state, /icon=\{<Open16Filled aria-hidden="true" \/>\}/);
  assert.match(state, /<CoreAILogoCube monochrome \/>/);
  assert.match(state, /aria-hidden="true"/);
  assert.match(state, /<Text as=\{standalone \? 'h1' : 'h2'\} id=\{headingId\}/);
  assert.match(
    app,
    /blankPageIds\.has\(page\.id\)[\s\S]*?<PageLayout id=\{page\.id\} hideTitle summary="">\s*<WorkInProgress key=\{page\.id\} standalone \/>/,
  );
  assert.match(component, /content\.status === 'under-construction' \? <WorkInProgress \/>/);
  assert.match(logo, /monochrome \? '#FFFFFF' : '#D8C9FF'/);
  assert.match(logo, /monochrome \? '#090909' : '#09070D'/);
  assert.match(
    logo,
    /monochrome \? \(\s*<EffectComposer multisampling=\{0\}>\s*<PaperDithering \/>\s*<\/EffectComposer>\s*\) : \(/,
  );
  assert.match(
    logo,
    /<OrbitControls enableDamping dampingFactor=\{0\.08\} enablePan=\{false\} enableZoom=\{false\} \/>/,
  );
  assert.doesNotMatch(logo, /!monochrome &&/);
  assert.match(logo, /if \(!reduceMotion\) animationTimeRef\.current \+=/);
});

test('the three unfinished template routes show only the shared empty state', async () => {
  const source = await fs.readFile(new URL('../src/pages/Component.tsx', import.meta.url), 'utf8');
  assert.match(source, /new Set\(\['empty-state', 'page-header', 'top-nav'\]\)/);
  assert.match(
    source,
    /if \(unfinishedTemplateIds\.has\(componentId\)\) \{\s*return \(\s*<PageLayout id=\{componentId\} hideTitle summary="">\s*<WorkInProgress key=\{componentId\} standalone \/>/,
  );
  assert.ok(source.indexOf('unfinishedTemplateIds.has') < source.indexOf('const Page ='));
});

test('empty-state elements fade in sequence and skip animation for reduced motion', async () => {
  const styles = await fs.readFile(new URL('../src/styles/docsite.css', import.meta.url), 'utf8');
  assert.match(
    styles,
    /\.work-in-progress > \* \{\s*animation: work-in-progress-enter 320ms ease-out both;/,
  );
  for (const [child, delay] of [
    [2, 70],
    [3, 140],
    [4, 210],
  ]) {
    assert.ok(
      styles.includes(`.work-in-progress > :nth-child(${child}) {\n  animation-delay: ${delay}ms;`),
    );
  }
  assert.match(
    styles,
    /@media \(prefers-reduced-motion: reduce\) \{\s*\.work-in-progress > \* \{\s*animation: none;/,
  );
});
