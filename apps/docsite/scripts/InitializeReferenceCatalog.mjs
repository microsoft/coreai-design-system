// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import ts from 'typescript';
import {
  readSourceCatalog,
  storyRoot,
  referencePageName as nameForFile,
} from './sources/Catalog.mjs';
import { readStoryDescriptions } from './sources/StoryDescriptions.mjs';

const contentRoot = fileURLToPath(new URL('../content/', import.meta.url));
const slug = (value) =>
  value
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function templateSources(component) {
  const files = new Set();
  async function visit(filename) {
    if (files.has(filename)) return;
    files.add(filename);
    const source = await fs.readFile(path.join(storyRoot, filename), 'utf8');
    const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
    for (const statement of ast.statements) {
      const specifier =
        (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) &&
        statement.moduleSpecifier?.text;
      if (typeof specifier === 'string' && specifier.startsWith('.')) {
        const target = path.join(path.dirname(filename), `${specifier}.tsx`).replaceAll('\\', '/');
        await visit(target);
      }
    }
  }
  const main = component.sources[0].sourceFile.replace(/\.stories\.tsx?$/, '.tsx');
  await visit(main);
  for (const story of component.stories) {
    for (const dependency of story.dependencies.filter((dependency) =>
      dependency.specifier.startsWith('.'),
    )) {
      await visit(
        path
          .join(path.dirname(story.implementationFile), `${dependency.specifier}.tsx`)
          .replaceAll('\\', '/'),
      );
    }
  }
  return [...files];
}

const catalog = await readSourceCatalog();
const authored = [];
for (const directory of ['components', 'templates']) {
  await fs.mkdir(path.join(contentRoot, directory), { recursive: true });
  for (const filename of await fs.readdir(path.join(contentRoot, directory))) {
    if (!filename.endsWith('.md')) continue;
    const file = path.join(contentRoot, directory, filename);
    const parsed = matter(await fs.readFile(file, 'utf8'));
    authored.push({ file, ...parsed });
  }
}
let created = 0;
let updated = 0;
for (const component of catalog.components) {
  const kind = component.title.startsWith('Templates/') ? 'templates' : 'components';
  const owned = authored.find((page) => page.data.reference?.component === component.id);
  const candidates = authored.filter(
    (page) => !page.data.reference && page.data.storybookTitles?.includes(component.title),
  );
  const existing =
    owned ??
    candidates.find(
      (page) =>
        path.basename(page.file, '.md').toLowerCase() === nameForFile(component).toLowerCase(),
    ) ??
    candidates[0];
  const name = component.title.split('/').at(-1);
  const routeName = nameForFile(component);
  const reference = { component: component.id, ...(existing?.data.reference ?? {}) };
  if (component.sources.some((source) => source.metadata.decorators)) {
    reference.omitDecorators =
      'Storybook-only layout decorators are omitted. Examples use the documentation preview spacing instead.';
  }
  if (kind === 'templates') {
    reference.sources = await templateSources(component);
    reference.route = `templates/${routeName}`;
  }
  if (existing) {
    const data = { ...existing.data, reference };
    await fs.writeFile(existing.file, matter.stringify(existing.content, data));
    existing.data = data;
    updated++;
  } else {
    const descriptions = await Promise.all(
      component.sources.map((source) =>
        readStoryDescriptions(path.join(storyRoot, source.sourceFile)),
      ),
    );
    const summary =
      [...descriptions].reverse().find((item) => item.summary)?.summary ??
      `${name} ${kind === 'templates' ? 'copy-and-adapt template' : 'component'} reference and examples.`;
    const file = path.join(contentRoot, kind, `${routeName}.md`);
    await fs.mkdir(path.dirname(file), { recursive: true });
    const data = {
      id: slug(routeName),
      title: name,
      summary,
      resources: [],
      reference,
    };
    const body = '\n';
    await fs.writeFile(file, matter.stringify(body, data), { flag: 'wx' });
    created++;
  }
}
console.log(
  `Initialized reference catalog: ${created} new Markdown pages, ${updated} existing page definitions. Review and commit the authored files; builds never run this initializer.`,
);
