// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  groupNavigationEntries,
  clientNavigationTarget,
  normalizeReferencePath,
} from '../src/reference-proof/Navigation.mjs';

const options = {
  basePath: '/coreai-design-system/',
  currentUrl: 'https://example.com/coreai-design-system/components/Button/',
  paths: new Set(['/', '/guides/Package/', '/components/Button/', '/components/Tree/']),
  button: 0,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  download: false,
  target: '',
};

test('site sections use the requested order with alphabetized component and template catalogs', () => {
  const entries = [
    { path: '/components/Button/', title: 'Button' },
    { path: '/templates/EmptyState/', title: 'Empty State' },
    { path: '/guides/UseWithAgents/', title: 'Build with your agent' },
    { path: '/patterns/Forms/', title: 'Forms' },
    { path: '/foundations/Content/', title: 'Content' },
    { path: '/foundations/Theming/', title: 'Theming' },
    { path: '/overview/Faq/', title: 'FAQ' },
    { path: '/overview/Changelog/', title: 'Changelog' },
    { path: '/guides/Package/', title: 'NPM package' },
    { path: '/overview/Introduction/', title: 'Introduction' },
    { path: '/', title: 'Home' },
    { path: '/foundations/Layout/', title: 'Layout' },
    { path: '/foundations/Spacing/', title: 'Spacing' },
    { path: '/foundations/Surfaces/', title: 'Surfaces' },
    { path: '/foundations/Colors/', title: 'Colors' },
    { path: '/foundations/Typography/', title: 'Typography' },
  ];
  const groups = groupNavigationEntries(entries);
  assert.deepEqual(
    groups.map((group) => group.label),
    ['Getting started', 'Foundations', 'Components', 'Templates', 'Guides'],
  );
  assert.deepEqual(
    groups.map((group) => group.items.map((entry) => entry.title)),
    [
      ['Home', 'Introduction', 'Changelog', 'NPM package', 'FAQ'],
      ['Typography', 'Colors', 'Content', 'Surfaces', 'Spacing', 'Layout'],
      ['Button'],
      ['Empty State'],
      ['Build with your agent', 'Forms', 'Theming'],
    ],
  );
  assert.equal(groups.flatMap((group) => group.items).length, entries.length);
  assert.deepEqual(
    groupNavigationEntries([{ path: '/components/Button', title: 'Button' }])[0].value,
    'components',
  );
});

test('client navigation preserves the Pages base path, query and fragment', () => {
  assert.equal(
    clientNavigationTarget(
      '/coreai-design-system/components/Tree/?mode=test#guidance-best-practices',
      options,
    ),
    '/components/Tree/?mode=test#guidance-best-practices',
  );
  assert.equal(clientNavigationTarget('/coreai-design-system/', options), '/');
  assert.equal(clientNavigationTarget('../Tree/', options), '/components/Tree/');
  assert.equal(
    clientNavigationTarget('/components/Tree/', {
      ...options,
      basePath: '/',
      currentUrl: 'https://example.com/components/Button/',
    }),
    '/components/Tree/',
  );
  assert.equal(normalizeReferencePath('/components/Tree/index.html'), '/components/Tree/');
  assert.equal(normalizeReferencePath('/components/Tree'), '/components/Tree/');
});

test('Markdown, source downloads, external and unknown pages retain native navigation', () => {
  for (const href of [
    '/coreai-design-system/components/Tree.md',
    '/coreai-design-system/source/examples/tree.tsx',
    '/coreai-design-system/llms.txt',
    '/coreai-design-system/components/missing/',
    '/another-site/components/Tree/',
    'https://other.example/coreai-design-system/components/Tree/',
    '#guidance-best-practices',
    'mailto:design@example.com',
  ])
    assert.equal(clientNavigationTarget(href, options), undefined, href);
});

test('modified clicks, new tabs, and download attributes retain native navigation', () => {
  for (const modifier of [
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { altKey: true },
    { button: 1 },
    { button: 2 },
    { target: '_blank' },
    { download: true },
  ]) {
    assert.equal(
      clientNavigationTarget('/coreai-design-system/components/Tree/', { ...options, ...modifier }),
      undefined,
    );
  }
  assert.equal(
    clientNavigationTarget('/coreai-design-system/components/Tree/', {
      ...options,
      target: '_self',
    }),
    '/components/Tree/',
  );
});
