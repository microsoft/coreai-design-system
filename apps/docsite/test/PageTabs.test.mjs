// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import matter from 'gray-matter';
import { readReferencePages } from '../scripts/ReadReferencePages.mjs';
import {
  appRoot,
  pageMarkdown,
  resolveStandalonePage,
  standalonePageHtml,
} from '../scripts/BuildDocsite.mjs';
import { guidanceMarkdown } from '../../../shared/guidance.mjs';

test('elevated tabs reuse the existing story and retain complete agent Markdown', async () => {
  const pages = await readReferencePages(path.join(appRoot, 'content'));
  const scope = pages.find((page) => page.route === 'components/TabElevated');
  assert.ok(scope?.standalone);
  assert.equal(scope.component, undefined);
  assert.ok(scope.aliases.includes('/tab-elevated/'));
  const { data, content } = matter(
    await fs.readFile(path.join(appRoot, 'content', scope.guidance), 'utf8'),
  );
  const example = {
    id: 'components-tablist--elevated-appearance',
    name: 'Elevated Appearance',
    origin: 'local',
    source: 'export default function Example() { return <TabList appearance="elevated" />; }',
    sourcePath: 'source/examples/components-tablist--elevated-appearance.tsx',
  };
  const page = {
    ...scope,
    ...data,
    guidanceSource: `content/${scope.guidance}`,
    guidance: guidanceMarkdown({ ...data, body: content.trim() }),
  };
  const resolved = await resolveStandalonePage(page, {
    pages: [],
    basePath: '/',
    generated: {},
    allExamples: new Map([[example.id, example]]),
  });
  const complete = { ...page, ...resolved };
  const html = standalonePageHtml(complete, { basePath: '/', pages: [] });
  assert.match(html, /data-example-id="components-tablist--elevated-appearance"/);
  assert.match(html, /Best practices/);
  assert.match(html, /<pre><code/);
  const markdown = pageMarkdown(complete, {});
  assert.match(markdown, /Best practices/);
  assert.match(markdown, /Behavior and states/);
  assert.ok(markdown.includes(example.source));
  assert.doesNotMatch(markdown, /<!-- live-example:/);
});

test('standalone component guides must opt in and cannot claim catalog ownership', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'coreai-standalone-guide-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const filename = path.join(directory, 'guide.md');
  const write = (reference) =>
    fs.writeFile(
      filename,
      matter.stringify('Guidance.', {
        id: 'variant',
        title: 'Variant',
        summary: 'A documented component variant.',
        reference: { route: 'components/variant', ...reference },
      }),
    );
  await write({ standalone: true });
  assert.equal((await readReferencePages(directory))[0].standalone, true);
  await write({ standalone: false });
  await assert.rejects(readReferencePages(directory), /standalone must be true/);
  await write({ standalone: true, component: 'components-tablist' });
  await assert.rejects(readReferencePages(directory), /cannot own a reference.component/);
});
