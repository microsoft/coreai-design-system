// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { RegistryPage } from './registry-builder';
import { faqGroups } from './faqs';
import { resourceGroups } from './resources';

export interface PageSearchResult {
  page: RegistryPage;
  excerpt: string;
  score: number;
}

const excerptLength = 150;

const authoredSearchText = new Map<string, string>([
  [
    'faqs',
    faqGroups
      .flatMap((group) => [
        group.title,
        ...group.items.flatMap((item) => [item.question, ...item.answer]),
      ])
      .join(' '),
  ],
  [
    'resources',
    resourceGroups
      .flatMap((group) => [
        group.title,
        ...group.resources.flatMap((resource) => [
          resource.title,
          resource.description,
          resource.destination,
        ]),
      ])
      .join(' '),
  ],
]);

function pageSearchText(page: RegistryPage): string {
  return [
    page.title,
    page.navLabel,
    page.summary,
    ...page.anchors.map((anchor) => anchor.label),
    page.searchText,
    authoredSearchText.get(page.id),
  ]
    .filter(Boolean)
    .join(' ');
}

function createExcerpt(text: string, query: string): string {
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  const matchIndex = normalizedText.toLowerCase().indexOf(query);
  if (matchIndex < 0 || normalizedText.length <= excerptLength) {
    return normalizedText;
  }

  const rawStart = Math.max(0, matchIndex - 50);
  const startBoundary = rawStart > 0 ? normalizedText.lastIndexOf(' ', rawStart) : -1;
  const start = startBoundary >= 0 ? startBoundary + 1 : 0;
  const rawEnd = Math.min(normalizedText.length, start + excerptLength);
  const endBoundary =
    rawEnd < normalizedText.length ? normalizedText.indexOf(' ', rawEnd) : normalizedText.length;
  const end = endBoundary >= 0 ? endBoundary : normalizedText.length;
  const excerpt = normalizedText.slice(start, end).trim();
  return `${start > 0 ? '…' : ''}${excerpt}${end < normalizedText.length ? '…' : ''}`;
}

export function searchPages(pages: RegistryPage[], rawQuery: string): PageSearchResult[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return [];
  }

  return pages
    .filter((page) => page.showInSidebar)
    .flatMap((page) => {
      const text = pageSearchText(page);
      const normalizedText = text.toLowerCase();
      if (!normalizedText.includes(query)) {
        return [];
      }

      const normalizedTitle = page.title.toLowerCase();
      const normalizedSummary = page.summary.toLowerCase();
      const score =
        (normalizedTitle === query ? 100 : 0) +
        (normalizedTitle.startsWith(query) ? 40 : 0) +
        (normalizedTitle.includes(query) ? 20 : 0) +
        (normalizedSummary.includes(query) ? 5 : 0);

      return [{ page, excerpt: createExcerpt(text, query), score }];
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.page.title.localeCompare(right.page.title, undefined, { sensitivity: 'base' }),
    );
}
