// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import changelogJson from '../../changelog.json';

export interface ChangelogSection {
  title: string;
  items: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  summary: string;
  url: string;
  sections: ChangelogSection[];
}

export interface ChangelogData {
  updated: string;
  entries: ChangelogEntry[];
}

export const changelog = changelogJson as ChangelogData;
export const changelogEntries = changelog.entries;
