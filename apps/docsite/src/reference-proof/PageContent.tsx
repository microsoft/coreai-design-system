// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@coreai-ds/react-components';
import { loadExamples } from 'virtual:reference-proof-examples';
import {
  PageHeader,
  ResourceCards,
  readPagePresentation,
  type PagePresentation,
} from './PagePresentation';
import type { PageWidgetProps } from './FoundationViews';

const standaloneViewNames = new Set([
  'resources',
  'faqs',
  'package',
  'changelog',
  'package-skill',
  'agent-workflow',
  'content',
]);

export interface ReferencePage {
  path: string;
  title: string;
  html: string;
  status: 'ready' | 'loading' | 'error';
  message?: string;
}

class ExampleBoundary extends React.Component<
  { children: React.ReactNode; id: string },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.error(`Reference example failed: ${this.props.id}`, error);
  }
  render() {
    return this.state.failed ? (
      <p role="alert" data-preview-error>
        This preview failed to render. See the console for details.
      </p>
    ) : (
      this.props.children
    );
  }
}

// This subtree shares the theme, but not the site's router: examples may supply their own routers.
export function PageContent({
  page,
  onReady,
}: {
  page: ReferencePage;
  onReady: (page: ReferencePage) => void;
}) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const markup = React.useMemo(() => ({ __html: page.html }), [page.html]);
  const [targets, setTargets] = React.useState<HTMLElement[] | null>(null);
  const [examples, setExamples] = React.useState<Record<string, React.ComponentType>>({});
  const [loadError, setLoadError] = React.useState<string>();
  const [activeExample, setActiveExample] = React.useState<string>();
  const [presentation, setPresentation] = React.useState<{
    model: PagePresentation;
    header: HTMLElement;
    resources: HTMLElement | null;
  }>();
  const [widgets, setWidgets] = React.useState<
    { name: string; element: HTMLElement; sourceHtml: string }[]
  >([]);
  const [views, setViews] = React.useState<Record<string, React.ComponentType<PageWidgetProps>>>(
    {},
  );
  React.useEffect(() => {
    if (page.status !== 'ready') return;
    let active = true;
    const containers = [
      ...(contentRef.current?.querySelectorAll<HTMLElement>('[data-example-id]') ?? []),
    ];
    const root = contentRef.current;
    if (!root) throw new Error('Missing page content.');
    const model = readPagePresentation(root);
    const header = root.querySelector<HTMLElement>('[data-page-header]');
    if (!header) throw new Error('Missing page header.');
    const resources = model.home ? null : root.querySelector<HTMLElement>('[data-page-resources]');
    const pageWidgets = [...root.querySelectorAll<HTMLElement>('[data-page-widget]')].map(
      (element) => {
        const name = element.dataset.pageWidget;
        if (!name) throw new Error('Unnamed page widget.');
        return { name, element, sourceHtml: element.innerHTML };
      },
    );
    const components = [
      ...new Set(containers.map((container) => container.dataset.exampleId?.split('--')[0])),
    ];
    const loaders = components.map((component) => {
      const load = component ? loadExamples[component] : undefined;
      if (!load) throw new Error(`Missing component example bundle: ${component}`);
      return load();
    });
    Promise.all([
      Promise.all(loaders),
      pageWidgets.some((widget) => widget.name !== 'home')
        ? import('./FoundationViews').then((module) => module.foundationViews)
        : Promise.resolve({}),
      pageWidgets.some((widget) => standaloneViewNames.has(widget.name))
        ? import('./StandaloneViews').then((module) => module.standaloneViews)
        : Promise.resolve({}),
      pageWidgets.some((widget) => widget.name === 'home')
        ? import('./HomeView').then((module) => ({ home: module.default }))
        : Promise.resolve({}),
    ])
      .then(([loaded, foundationViews, standaloneViews, homeView]) => {
        if (!active) return;
        for (const container of containers) container.replaceChildren();
        header.replaceChildren();
        resources?.replaceChildren();
        for (const widget of pageWidgets) widget.element.replaceChildren();
        setPresentation({ model, header, resources });
        setViews({ ...foundationViews, ...standaloneViews, ...homeView });
        setWidgets(pageWidgets);
        setExamples(
          Object.fromEntries(loaded.flatMap((module) => Object.entries(module.examples))),
        );
        if (contentRef.current?.querySelector('[data-single-preview]')) {
          setActiveExample(
            (
              containers.find((container) => container.dataset.exampleId?.endsWith('--default')) ??
              containers[0]
            )?.dataset.exampleId,
          );
        }
        setTargets(containers);
        onReady(page);
      })
      .catch((error: unknown) => {
        console.error('Could not load documentation examples.', error);
        if (active)
          setLoadError('Could not load examples. Reload this page or use the source downloads.');
      });
    return () => {
      active = false;
    };
  }, [page, onReady]);
  return (
    <div
      aria-busy={page.status === 'loading'}
      data-reference-ready={page.status === 'ready' && targets !== null}
    >
      {page.status === 'loading' ? (
        <p role="status">Loading documentation…</p>
      ) : page.status === 'error' ? (
        <>
          <h1>Unable to load documentation</h1>
          <p role="alert" data-navigation-error>
            {page.message}
          </p>
        </>
      ) : (
        <div ref={contentRef} dangerouslySetInnerHTML={markup} />
      )}
      {loadError ? (
        <p role="alert" data-preview-error>
          {loadError}
        </p>
      ) : null}
      {presentation
        ? createPortal(<PageHeader model={presentation.model} />, presentation.header)
        : null}
      {presentation?.resources
        ? createPortal(<ResourceCards model={presentation.model} />, presentation.resources)
        : null}
      {presentation
        ? widgets.map((widget, index) => {
            const View = views[widget.name];
            if (!View) throw new Error(`Unknown custom page view: ${widget.name}`);
            return createPortal(
              <View sourceHtml={widget.sourceHtml} model={presentation.model} />,
              widget.element,
              `page-view-${index}`,
            );
          })
        : null}
      {targets?.map((container) => {
        const id = container.dataset.exampleId;
        const Example = id ? examples[id] : undefined;
        if (!id || !Example) throw new Error(`Unknown reference example: ${id}`);
        return createPortal(
          <ExampleBoundary id={id}>
            {activeExample && activeExample !== id ? (
              <Button onClick={() => setActiveExample(id)}>Run this example</Button>
            ) : (
              <Example />
            )}
          </ExampleBoundary>,
          container,
          id,
        );
      })}
    </div>
  );
}
