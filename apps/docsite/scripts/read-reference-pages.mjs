// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

export const standaloneRendererNames = [
  'home',
  'colors',
  'typography',
  'materials',
  'resources',
  'faqs',
  'package',
  'changelog',
  'package-skill',
  'agent-workflow',
  'content',
  'work-in-progress',
];

export const wholePageRendererNames = [
  'resources',
  'faqs',
  'package',
  'changelog',
  'package-skill',
  'agent-workflow',
  'content',
];

export async function readReferencePages(contentDirectory) {
  const pages = [];
  async function walk(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (entry.name === 'generated') continue;
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(filename);
      } else if (entry.name.endsWith('.md')) {
        const { data } = matter(await fs.readFile(filename, 'utf8'));
        const guidance = path.relative(contentDirectory, filename).replaceAll('\\', '/');
        const sourceKind = guidance.split('/')[0];
        if (data.reference === undefined) {
          if (['components', 'templates'].includes(sourceKind)) {
            throw new Error(
              `${filename}: component and template pages require reference metadata.`,
            );
          }
          continue;
        }
        const fail = (message) => {
          throw new Error(`${filename}: ${message}`);
        };
        const reference = data.reference;
        if (!reference || typeof reference !== 'object' || Array.isArray(reference)) {
          fail('reference must be an object.');
        }
        for (const key of Object.keys(reference)) {
          if (
            ![
              'component',
              'standalone',
              'examples',
              'sources',
              'route',
              'omitDecorators',
              'exclude',
              'singlePreview',
              'aliases',
              'label',
              'migratedFrom',
              'legacyIds',
              'renderer',
              'layout',
              'hideSummary',
              'api',
            ].includes(key)
          ) {
            fail(`unknown reference field "${key}".`);
          }
          if (
            reference.singlePreview !== undefined &&
            (typeof reference.singlePreview !== 'string' || !reference.singlePreview.trim())
          ) {
            fail('reference.singlePreview must explain why previews run one at a time.');
          }
          if (
            reference.omitDecorators !== undefined &&
            (typeof reference.omitDecorators !== 'string' || !reference.omitDecorators.trim())
          ) {
            fail('reference.omitDecorators must explain the layout simplification.');
          }
          if (reference.exclude !== undefined) {
            if (
              !reference.exclude ||
              typeof reference.exclude !== 'object' ||
              Array.isArray(reference.exclude) ||
              Object.entries(reference.exclude).some(
                ([name, reason]) => !name.trim() || typeof reason !== 'string' || !reason.trim(),
              )
            ) {
              fail('reference.exclude must map example export names to reasons.');
            }
            if (reference.examples)
              fail('Use either reference.examples or reference.exclude, not both.');
          }
        }
        for (const key of ['id', 'title', 'summary']) {
          if (typeof data[key] !== 'string' || !data[key].trim()) fail(`${key} is required.`);
        }
        if (data.status !== undefined && !['complete', 'under-construction'].includes(data.status))
          fail('status must be complete or under-construction.');
        if (
          reference.component !== undefined &&
          (typeof reference.component !== 'string' || !/^[a-z0-9-]+$/.test(reference.component))
        ) {
          fail('reference.component must be an inventory component ID.');
        }
        if (reference.standalone !== undefined && reference.standalone !== true)
          fail('reference.standalone must be true when provided.');
        if (reference.standalone && reference.component)
          fail('Standalone pages cannot own a reference.component.');
        for (const key of ['examples', 'sources', 'aliases', 'migratedFrom', 'legacyIds', 'api']) {
          if (
            reference[key] !== undefined &&
            (!Array.isArray(reference[key]) ||
              !reference[key].length ||
              reference[key].some((value) => typeof value !== 'string' || !value.trim()) ||
              new Set(reference[key]).size !== reference[key].length)
          ) {
            fail(`reference.${key} must be a nonempty list of unique strings.`);
          }
        }
        const route = reference.route ?? guidance.replace(/\.md$/, '').toLowerCase();
        if (
          route !== 'index' &&
          !/^(components|templates|foundations|patterns|guides|overview)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
            route,
          )
        ) {
          fail('reference route must be a supported category/name or index.');
        }
        const [kind, id] = route === 'index' ? ['overview', 'home'] : route.split('/');
        if (
          reference.api &&
          (kind !== 'components' || reference.api.some((name) => !/^[$A-Z_a-z][$\w]*$/.test(name)))
        ) {
          fail('reference.api must name public exports on component pages.');
        }
        const usageGuide =
          reference.standalone ||
          (['components', 'templates'].includes(kind) && id === `using-${kind}`);
        if (['components', 'templates'].includes(kind) && !reference.component && !usageGuide)
          fail('component and template pages require reference.component.');
        if (
          !reference.component &&
          (reference.examples ||
            reference.sources ||
            reference.omitDecorators ||
            reference.exclude ||
            reference.singlePreview)
        )
          fail('Story settings require reference.component.');
        for (const alias of reference.aliases ?? []) {
          if (
            !/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)+$/.test(alias) ||
            /^\/(?:assets|source|llms)\//.test(alias)
          )
            fail('reference.aliases must be safe directory URLs.');
        }
        if ((reference.legacyIds ?? []).some((id) => !/^[a-z0-9][a-z0-9-]+$/.test(id)))
          fail('reference.legacyIds must be safe document IDs.');
        if (
          reference.label !== undefined &&
          (typeof reference.label !== 'string' || !reference.label.trim())
        )
          fail('reference.label must be a nonempty string.');
        if (
          reference.renderer !== undefined &&
          !standaloneRendererNames.includes(reference.renderer)
        )
          fail('Unknown page renderer.');
        if (reference.layout !== undefined && !['compact-guidance'].includes(reference.layout))
          fail('Unknown page layout.');
        if (reference.hideSummary !== undefined && typeof reference.hideSummary !== 'boolean')
          fail('reference.hideSummary must be a boolean.');
        if (reference.renderer && reference.component)
          fail('Custom renderers are for standalone pages.');
        for (const source of reference.sources ?? []) {
          if (
            !/^src\/stories\/templates\/[\w/-]+\.tsx$/.test(source) ||
            source.split('/').some((segment) => ['.', '..'].includes(segment))
          ) {
            fail('reference.sources must name TSX files under src/stories/templates/.');
          }
        }
        if (
          new Set((reference.sources ?? []).map((source) => path.basename(source))).size !==
          (reference.sources ?? []).length
        ) {
          fail('reference.sources must have unique filenames.');
        }
        if (kind === 'templates' && !reference.sources?.length && !usageGuide) {
          fail('template pages must provide reference.sources for copying.');
        }
        pages.push({
          ...reference,
          aliases: [...(reference.aliases ?? [])],
          status: data.status,
          renderer: reference.renderer,
          id,
          kind,
          guidance,
          route: route === 'index' ? '' : route,
        });
      }
    }
  }
  await walk(contentDirectory);
  pages.sort((first, second) =>
    `${first.kind}/${first.id}`.localeCompare(`${second.kind}/${second.id}`),
  );
  if (!pages.length) throw new Error('No Markdown pages declare reference metadata.');
  const declaredRoutes = pages.flatMap((page) => [
    `/${page.route}${page.route ? '/' : ''}`,
    ...(page.aliases ?? []),
  ]);
  if (new Set(declaredRoutes).size !== declaredRoutes.length)
    throw new Error('Duplicate reference page route or alias.');
  const routes = new Set(declaredRoutes);
  for (const page of pages) {
    const rootAlias = `/${page.id}/`;
    if (
      ['components', 'templates'].includes(page.kind) &&
      rootAlias !== `/${page.route}/` &&
      !routes.has(rootAlias)
    ) {
      page.aliases.push(rootAlias);
      routes.add(rootAlias);
    }
  }
  const components = pages.map((page) => page.component).filter(Boolean);
  if (new Set(components).size !== components.length)
    throw new Error('Duplicate reference component ownership.');
  const legacyIds = pages.flatMap((page) => [
    ...(page.legacyIds ?? []),
    ...(page.kind === 'templates' && page.component ? [`${page.component}--source-code`] : []),
  ]);
  if (new Set(legacyIds).size !== legacyIds.length)
    throw new Error('Duplicate legacy Markdown document ID.');
  return pages;
}
