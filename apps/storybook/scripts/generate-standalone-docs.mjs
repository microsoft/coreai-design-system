// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import matter from 'gray-matter';
import { readReferencePages } from '../../docsite/scripts/ReadReferencePages.mjs';
import { publicMarkdown } from '../../docsite/scripts/sources/PublicMarkdown.mjs';

export const standaloneContentRoot = fileURLToPath(
  new URL('../../docsite/content/', import.meta.url),
);
export const standaloneDocsRoot = fileURLToPath(
  new URL('../.storybook/.cache/standalone-docs/', import.meta.url),
);

export async function generateStandaloneDocs() {
  const pages = await readReferencePages(standaloneContentRoot);
  await fs.mkdir(standaloneDocsRoot, { recursive: true });
  const generated = [];
  for (const page of pages) {
    const oldSource = page.migratedFrom?.find((file) =>
      /^apps\/storybook\/src\/stories\/docs\/(?!Introduction|AgentSkill)[A-Za-z]+\.mdx$/.test(file),
    );
    if (!oldSource) continue;
    const sourcePath = path.join(standaloneContentRoot, page.guidance);
    const source = await fs.readFile(sourcePath, 'utf8');
    const { data } = matter(source);
    const identity = path
      .basename(oldSource, '.mdx')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .replace(/([a-z])([A-Z])/g, '$1 $2');
    const title = `Docs/${identity}`;
    const summary = data.summary
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
    const body = publicMarkdown(source, sourcePath);
    const filename = path.basename(oldSource);
    const target = path.join(standaloneDocsRoot, filename);
    const mdx = `{/* Generated from ${page.guidance}; edit the canonical Markdown, not this file. */}
import { Meta } from '@storybook/addon-docs/blocks';

<Meta title="${title}" summary="${summary}" />

# ${data.title}

${data.summary}

${body}`;
    let previous;
    try {
      previous = await fs.readFile(target, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (previous !== mdx) await fs.writeFile(target, mdx);
    generated.push(filename);
  }
  for (const filename of await fs.readdir(standaloneDocsRoot)) {
    if (filename.endsWith('.mdx') && !generated.includes(filename))
      await fs.unlink(path.join(standaloneDocsRoot, filename));
  }
  return generated;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  console.log(
    `Generated ${(await generateStandaloneDocs()).length} canonical Markdown mirrors for Storybook and MCP.`,
  );
}
