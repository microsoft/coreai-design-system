// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { standalonePageHtml } from '../scripts/BuildDocsite.mjs';
import { readReferencePages } from '../scripts/ReadReferencePages.mjs';

test('pages can opt into the compact guidance layout', async () => {
  const contentDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'compact-guidance-'));
  try {
    await fs.writeFile(
      path.join(contentDirectory, 'example.md'),
      `---
id: example
title: Example
summary: Example summary.
resources: []
reference:
  route: overview/example
  layout: compact-guidance
---
`,
    );
    const [page] = await readReferencePages(contentDirectory);

    assert.equal(page.layout, 'compact-guidance');

    const html = standalonePageHtml(
      {
        ...page,
        title: 'Example',
        guidance: '# Example\n\nSummary.\n\n## Section\n\nBody.',
        examples: [],
        resources: [],
      },
      { basePath: '/', pages: [page] },
    );

    assert.match(html, /reference-page--compact-guidance/);
  } finally {
    await fs.rm(contentDirectory, { recursive: true, force: true });
  }
});
