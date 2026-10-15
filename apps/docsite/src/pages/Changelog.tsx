// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { PageLayout } from '../components/PageLayout';
import { ChangelogList } from '../components/ChangelogList';
import { changelogEntries } from '../data/changelog';

export function Changelog() {
  return (
    <PageLayout id="changelog">
      <ChangelogList entries={changelogEntries} />
    </PageLayout>
  );
}
