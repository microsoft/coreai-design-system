// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Text } from '@coreai-ds/react-components';
import { changelogEntries, type ChangelogEntry } from '../data/changelog';
import { ChevronRight } from './Icons';

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

function getMonth(date: string): string {
  return date.slice(0, 7);
}

function formatMonth(month: string): string {
  return monthFormatter.format(new Date(`${month}-01T00:00:00Z`));
}

function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function groupEntries(entries: ChangelogEntry[]) {
  const groups = new Map<string, ChangelogEntry[]>();
  for (const entry of entries) {
    const month = getMonth(entry.date);
    const group = groups.get(month);
    if (group) {
      group.push(entry);
    } else {
      groups.set(month, [entry]);
    }
  }
  return Array.from(groups);
}

function ReleaseEntry({ entry, compact }: { entry: ChangelogEntry; compact: boolean }) {
  return (
    <article className="changelog-entry">
      <div className="changelog-entry__version">
        <a href={entry.url}>Version {entry.version}</a>
        <time dateTime={entry.date}>{formatDate(entry.date)}</time>
      </div>
      <div className="changelog-entry__content">
        <div className="changelog-entry__summary">
          <Text as="h3" weight="semibold">
            {entry.title}
          </Text>
          <Text as="p" foreground={2}>
            {entry.summary}
          </Text>
        </div>
        {!compact ? (
          <div className="changelog-entry__sections">
            {entry.sections.map((section) => (
              <section className="changelog-entry__section" key={section.title}>
                <Text as="h4" weight="semibold">
                  {section.title}
                </Text>
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function ChangelogList({
  entries = changelogEntries,
  compact = false,
}: {
  entries?: ChangelogEntry[];
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="changelog-list changelog-list--compact">
        {entries.map((entry) => (
          <ReleaseEntry key={entry.version} entry={entry} compact />
        ))}
      </div>
    );
  }

  return (
    <div className="changelog-list">
      {groupEntries(entries).map(([month, monthEntries]) => {
        const headingId = `changelog-${month}`;
        return (
          <details className="changelog-month" key={month} open>
            <summary className="changelog-month__header">
              <Text as="h2" id={headingId} size={500} weight="semibold">
                {formatMonth(month)}
              </Text>
              <ChevronRight className="changelog-month__chevron" aria-hidden="true" />
            </summary>
            <div className="changelog-month__entries">
              {monthEntries.map((entry) => (
                <ReleaseEntry key={entry.version} entry={entry} compact={false} />
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}
