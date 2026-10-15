// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { ComponentPage } from '../components/ComponentPage';
import { PageLayout } from '../components/PageLayout';
import { WorkInProgress } from '../components/work-in-progress';
import { getComponentContent } from '../data/components';

const unfinishedTemplateIds = new Set(['empty-state', 'page-header', 'top-nav']);

const pages = import.meta.glob<string>('../../content/generated/pages/*.html', {
  query: '?raw',
  import: 'default',
});
const renderedPages = new Map(
  Object.entries(pages).map(([path, load]) => {
    const id = path
      .split('/')
      .pop()!
      .replace(/\.html$/, '');
    return [
      id,
      React.lazy(async () => {
        const html = await load();
        const content = getComponentContent(id);
        if (!content) throw new Error(`No component content registered for "${id}".`);
        return { default: () => <ComponentPage content={content} html={html} /> };
      }),
    ];
  }),
);

export function Component({ componentId }: { componentId: string }) {
  if (unfinishedTemplateIds.has(componentId)) {
    return (
      <PageLayout id={componentId} hideTitle summary="">
        <WorkInProgress key={componentId} standalone />
      </PageLayout>
    );
  }
  const Page = renderedPages.get(componentId);
  if (!Page) {
    throw new Error(`No component content registered for "${componentId}".`);
  }
  return <Page />;
}
