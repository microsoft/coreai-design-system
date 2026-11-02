// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  groupNavigationEntries,
  clientNavigationTarget,
  normalizeReferencePath,
} from '../src/reference-proof/navigation.mjs';

const options = {
  basePath: '/coreai-design-system/',
  currentUrl: 'https://example.com/coreai-design-system/components/button/',
  paths: new Set(['/', '/guides/package/', '/components/button/', '/components/tree/']),
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
    { path: '/components/button/', title: 'Button' },
    { path: '/templates/empty-state/', title: 'Empty State' },
    { path: '/guides/use-with-agents/', title: 'Build with your agent' },
    { path: '/patterns/forms/', title: 'Forms' },
    { path: '/foundations/content/', title: 'Content' },
    { path: '/foundations/theming/', title: 'Theming' },
    { path: '/overview/faq/', title: 'FAQ' },
    { path: '/overview/changelog/', title: 'Changelog' },
    { path: '/overview/introduction/', title: 'Introduction' },
    { path: '/', title: 'Home' },
    { path: '/foundations/layout/', title: 'Layout' },
    { path: '/foundations/spacing/', title: 'Spacing' },
    { path: '/foundations/surfaces/', title: 'Surfaces' },
    { path: '/foundations/color/', title: 'Color' },
    { path: '/foundations/typography/', title: 'Typography' },
  ];
  const groups = groupNavigationEntries(entries);
  assert.deepEqual(
    groups.map((group) => group.label),
    ['Getting started', 'Foundations', 'Components', 'Templates', 'Guides'],
  );
  assert.deepEqual(
    groups.map((group) => group.items.map((entry) => entry.title)),
    [
      ['Home', 'Introduction', 'Changelog', 'FAQ'],
      ['Typography', 'Color', 'Surfaces', 'Spacing', 'Layout'],
      ['Button'],
      ['Empty State'],
      ['Build with your agent', 'Content', 'Forms', 'Theming'],
    ],
  );
  assert.equal(groups.flatMap((group) => group.items).length, entries.length);
  assert.deepEqual(
    groupNavigationEntries([{ path: '/components/button', title: 'Button' }])[0].value,
    'components',
  );
});

test('client navigation preserves the Pages base path, query and fragment', () => {
  assert.equal(
    clientNavigationTarget(
      '/coreai-design-system/components/tree/?mode=test#guidance-best-practices',
      options,
    ),
    '/components/tree/?mode=test#guidance-best-practices',
  );
  assert.equal(clientNavigationTarget('/coreai-design-system/', options), '/');
  assert.equal(clientNavigationTarget('../tree/', options), '/components/tree/');
  assert.equal(
    clientNavigationTarget('/components/tree/', {
      ...options,
      basePath: '/',
      currentUrl: 'https://example.com/components/button/',
    }),
    '/components/tree/',
  );
  assert.equal(normalizeReferencePath('/components/tree/index.html'), '/components/tree/');
  assert.equal(normalizeReferencePath('/components/tree'), '/components/tree/');
});

test('Markdown, source downloads, external and unknown pages retain native navigation', () => {
  for (const href of [
    '/coreai-design-system/components/tree.md',
    '/coreai-design-system/source/examples/tree.tsx',
    '/coreai-design-system/llms.txt',
    '/coreai-design-system/components/missing/',
    '/another-site/components/tree/',
    'https://other.example/coreai-design-system/components/tree/',
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
      clientNavigationTarget('/coreai-design-system/components/tree/', { ...options, ...modifier }),
      undefined,
    );
  }
  assert.equal(
    clientNavigationTarget('/coreai-design-system/components/tree/', {
      ...options,
      target: '_self',
    }),
    '/components/tree/',
  );
});
