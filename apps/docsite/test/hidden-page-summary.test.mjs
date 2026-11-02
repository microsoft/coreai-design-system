// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { pageGuidanceParts, pageTemplateHeader } from '../scripts/page-template.mjs';
import { readReferencePages } from '../scripts/read-reference-pages.mjs';

test('pages can hide their visual summary without removing summary metadata', async () => {
  const contentDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'hidden-page-summary-'));
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
  hideSummary: true
---
`,
    );
    const [page] = await readReferencePages(contentDirectory);
    const guidance = '# Example\n\nExample summary.\n\nBody.';
    const header = pageTemplateHeader(
      { ...page, title: 'Example' },
      { basePath: '/' },
      pageGuidanceParts(guidance),
    );

    assert.equal(page.hideSummary, true);
    assert.match(header, /data-hide-summary="true"/);
    assert.match(header, /data-page-summary class="sr-only"/);
    assert.match(header, /Example summary\./);
  } finally {
    await fs.rm(contentDirectory, { recursive: true, force: true });
  }
});
