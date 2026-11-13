// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  Button,
  LinkButton,
  Menu,
  MenuButton,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Tooltip,
} from '@coreai-ds/react-components';
import { loadExamples } from 'virtual:reference-proof-examples';
import {
  PageHeader,
  ResourceCards,
  ResourceIcon,
  isShowcaseResource,
  readPagePresentation,
  type PageResource,
  type PagePresentation,
} from './PagePresentation';
import type { PageWidgetProps } from './FoundationViews';
import { PageTabs, preparePageTabs, type PageTab, type PageTabTargets } from './PageTabs';

const standaloneViewNames = new Set([
  'resources',
  'agent-cards',
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

function PageWidgetSlot({ target, children }: { target: HTMLElement; children: React.ReactNode }) {
  React.useLayoutEffect(() => {
    target.classList.add('page-widget-ready');
    return () => target.classList.remove('page-widget-ready');
  }, [target]);
  return createPortal(children, target);
}

function HomeWidgetSlot({ target, children }: { target: HTMLElement; children: React.ReactNode }) {
  const liveRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        for (const child of [...target.children]) if (child !== liveRef.current) child.remove();
        target.classList.add('page-widget-ready');
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [target]);
  return createPortal(
    <div ref={liveRef} className="reference-live-home-view">
      {children}
    </div>,
    target,
  );
}

function ShowcaseToolbar({
  title,
  selected,
  options,
  resources,
  onSelect,
}: {
  title: string;
  selected: string;
  options: NonNullable<PageTabTargets['showcase']>['options'];
  resources: PageResource[];
  onSelect: (id: string) => void;
}) {
  const selectedOption = options.find((option) => option.id === selected) ?? options[0];
  return (
    <span className="reference-showcase-toolbar">
      {options.length > 1 ? (
        <Menu checkedValues={{ showcase: [selected] }} positioning={{ autoSize: true }}>
          <MenuTrigger disableButtonEnhancement>
            <MenuButton
              appearance="subtle"
              size="medium"
              shape="rounded"
              aria-label={`Choose ${title} example`}
              className="reference-showcase-menu__trigger"
            >
              Example: {selectedOption.label}
            </MenuButton>
          </MenuTrigger>
          <MenuPopover className="reference-showcase-menu__popover">
            <MenuList>
              {options.map((option) => (
                <MenuItemRadio
                  key={option.id}
                  name="showcase"
                  value={option.id}
                  onClick={() => onSelect(option.id)}
                >
                  {option.label}
                </MenuItemRadio>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>
      ) : null}
      {resources.length ? (
        <span className="reference-showcase-toolbar__actions">
          {resources.map((resource) => (
            <Tooltip key={resource.href} content={resource.label} relationship="label">
              <LinkButton
                href={resource.href}
                external
                appearance="subtle"
                size="medium"
                shape="rounded"
                icon={<ResourceIcon href={resource.href} />}
                aria-label={resource.label}
                className="reference-showcase-toolbar__action"
              />
            </Tooltip>
          ))}
        </span>
      ) : null}
    </span>
  );
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
  const [pageTabs, setPageTabs] = React.useState<PageTabTargets | null>(null);
  const [selectedPageTab, setSelectedPageTab] = React.useState<PageTab>('usage');
  const [activeExample, setActiveExample] = React.useState<string>();
  const [selectedShowcase, setSelectedShowcase] = React.useState<string>();
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
  const loading = page.status === 'ready' && targets === null && !loadError;
  React.useLayoutEffect(() => {
    if (page.status !== 'ready') return;
    let active = true;
    const containers = [
      ...(contentRef.current?.querySelectorAll<HTMLElement>('[data-example-id]') ?? []),
    ];
    const root = contentRef.current;
    if (!root) throw new Error('Missing page content.');
    const tabs = preparePageTabs(root);
    const model = readPagePresentation(root);
    const header = root.querySelector<HTMLElement>('[data-page-header]');
    if (!header) throw new Error('Missing page header.');
    const resources = model.home ? null : root.querySelector<HTMLElement>('[data-page-resources]');
    if (
      resources &&
      tabs?.showcase &&
      model.resources.every((resource) => isShowcaseResource(resource))
    ) {
      resources.hidden = true;
    }
    const pageWidgets = [...root.querySelectorAll<HTMLElement>('[data-page-widget]')].map(
      (element) => {
        const name = element.dataset.pageWidget;
        if (!name) throw new Error('Unnamed page widget.');
        return { name, element, sourceHtml: element.innerHTML };
      },
    );
    header.replaceChildren();
    resources?.replaceChildren();
    setTargets(null);
    setExamples({});
    setLoadError(undefined);
    setActiveExample(undefined);
    setWidgets([]);
    setViews({});
    setPresentation({ model, header, resources });
    setPageTabs(tabs);
    setSelectedPageTab('usage');
    setSelectedShowcase(tabs?.showcase?.defaultId);
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
        for (const widget of pageWidgets)
          if (widget.name !== 'home') widget.element.replaceChildren();
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
        if (active) {
          for (const widget of pageWidgets) widget.element.classList.add('page-widget-ready');
          setLoadError('Could not load examples. Reload this page or use the source downloads.');
        }
      });
    return () => {
      active = false;
    };
  }, [page, onReady]);
  React.useLayoutEffect(() => {
    if (!pageTabs?.showcase || !selectedShowcase) return;
    pageTabs.showcase.preview.dataset.showcaseExample =
      selectedPageTab === 'usage' ? selectedShowcase : pageTabs.showcase.defaultId;
  }, [pageTabs, selectedPageTab, selectedShowcase]);
  const handlePageTabChange = React.useCallback(
    (tab: PageTab) => {
      setSelectedPageTab(tab);
      if (tab === 'usage')
        setActiveExample((current) =>
          current ? (pageTabs?.showcase?.defaultId ?? current) : current,
        );
    },
    [pageTabs],
  );
  return (
    <div
      aria-busy={page.status === 'loading' || loading}
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
      {presentation && pageTabs
        ? createPortal(
            <PageTabs
              key={pageTabs.prefix}
              targets={pageTabs}
              title={presentation.model.title}
              onTabChange={handlePageTabChange}
            />,
            pageTabs.host,
          )
        : null}
      {presentation && pageTabs?.showcase && selectedShowcase
        ? createPortal(
            <ShowcaseToolbar
              title={presentation.model.title}
              selected={selectedShowcase}
              options={pageTabs.showcase.options}
              resources={presentation.model.resources.filter(isShowcaseResource)}
              onSelect={(id) => {
                setSelectedShowcase(id);
                if (activeExample) setActiveExample(pageTabs.showcase?.defaultId);
              }}
            />,
            pageTabs.showcase.host,
          )
        : null}
      {presentation?.resources
        ? createPortal(
            <ResourceCards
              model={presentation.model}
              omitShowcaseResources={Boolean(pageTabs?.showcase)}
            />,
            presentation.resources,
          )
        : null}
      {presentation
        ? widgets.map((widget, index) => {
            const View = views[widget.name];
            if (!View) throw new Error(`Unknown custom page view: ${widget.name}`);
            const view = <View sourceHtml={widget.sourceHtml} model={presentation.model} />;
            if (widget.name === 'home')
              return (
                <HomeWidgetSlot key={`page-view-${index}`} target={widget.element}>
                  {view}
                </HomeWidgetSlot>
              );
            return (
              <PageWidgetSlot key={`page-view-${index}`} target={widget.element}>
                {view}
              </PageWidgetSlot>
            );
          })
        : null}
      {targets?.map((container) => {
        const id = container.dataset.exampleId;
        const showcasePreview = pageTabs?.showcase?.preview === container;
        const renderedId =
          showcasePreview && selectedPageTab === 'usage' && selectedShowcase
            ? selectedShowcase
            : id;
        const Example = renderedId ? examples[renderedId] : undefined;
        if (!id || !renderedId || !Example)
          throw new Error(`Unknown reference example: ${renderedId ?? id}`);
        const inactive =
          activeExample &&
          (showcasePreview ? activeExample !== pageTabs.showcase?.defaultId : activeExample !== id);
        return createPortal(
          <ExampleBoundary key={renderedId} id={renderedId}>
            {inactive ? (
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
