// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const navigationGroups = [
  {
    value: 'getting-started',
    label: 'Getting started',
    paths: [
      '/',
      '/overview/Introduction/',
      '/overview/Changelog/',
      '/guides/Package/',
      '/overview/Faq/',
    ],
  },
  {
    value: 'foundations',
    label: 'Foundations',
    paths: [
      '/foundations/Typography/',
      '/foundations/Colors/',
      '/foundations/Content/',
      '/foundations/Surfaces/',
      '/foundations/Spacing/',
      '/foundations/Layout/',
    ],
  },
  { value: 'components', label: 'Components', paths: [] },
  { value: 'templates', label: 'Templates', paths: [] },
  { value: 'guides', label: 'Guides', paths: [] },
];

export function groupNavigationEntries(entries) {
  const groups = navigationGroups.map((group) => ({ ...group, items: [] }));
  for (const entry of entries) {
    const path = normalizeReferencePath(entry.path);
    const group =
      groups.find((group) => group.paths.includes(path)) ??
      groups.find(
        (group) =>
          ['components', 'templates'].includes(group.value) && path.startsWith(`/${group.value}/`),
      ) ??
      groups.find((group) => group.value === 'guides');
    group.items.push(entry);
  }
  for (const group of groups) {
    const rank = (entry) => {
      const index = group.paths.indexOf(normalizeReferencePath(entry.path));
      return index < 0 ? group.paths.length : index;
    };
    group.items.sort(
      (first, second) => rank(first) - rank(second) || first.title.localeCompare(second.title),
    );
  }
  return groups.filter((group) => group.items.length);
}

export function normalizeReferencePath(pathname) {
  const path = pathname.replace(/\/index\.html$/, '/');
  return path.endsWith('/') ? path : `${path}/`;
}

export function clientNavigationTarget(href, options) {
  if (
    options.button !== 0 ||
    options.altKey ||
    options.ctrlKey ||
    options.metaKey ||
    options.shiftKey ||
    options.download ||
    (options.target && options.target !== '_self') ||
    href.startsWith('#')
  )
    return undefined;
  const url = new globalThis.URL(href, options.currentUrl);
  if (
    url.origin !== new globalThis.URL(options.currentUrl).origin ||
    !url.pathname.startsWith(options.basePath)
  )
    return undefined;
  const path = normalizeReferencePath(url.pathname.slice(options.basePath.length - 1));
  return options.paths.has(path) ? `${path}${url.search}${url.hash}` : undefined;
}
