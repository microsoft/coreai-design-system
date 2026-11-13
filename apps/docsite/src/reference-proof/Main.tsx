// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { BrowserRouter, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { Button, SearchBox } from '@coreai-ds/react-components';
import '@coreai-ds/react-components/fonts/fonts.css';
import { ThemeProvider } from '../theme/ThemeProvider';
import { CoreAILogo } from '../components/Icons';
import { Header } from '../components/Header';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { useDocsiteInteractions } from '../hooks/UseDocsiteInteractions';
import { NavigationTree, type NavigationEntry, type NavigationTreeHandle } from './NavigationTree';
import { PageContent, type ReferencePage } from './PageContent';
import { clientNavigationTarget, normalizeReferencePath } from './Navigation.mjs';
import { readStoredValue, writeStoredValue, revealFragment } from '../BrowserState.mjs';
import '../styles/Docsite.css';
import './ReferenceProof.css';

const basePath = import.meta.env.BASE_URL;
const container = document.getElementById('reference-root');
const content = document.getElementById('reference-content');
if (!container || !content) throw new Error('Missing static documentation content.');
let fallbackHtml = content.outerHTML;
const parsed = new DOMParser().parseFromString(content.innerHTML, 'text/html');
const main = parsed.getElementById('main');
if (!main) throw new Error('Missing static documentation page.');
const initialPage: ReferencePage = {
  path: normalizeReferencePath(window.location.pathname.slice(basePath.length - 1)),
  title: document.title,
  html: main.innerHTML,
  status: 'ready',
};
main.replaceChildren();
const shellHtml = parsed.body.innerHTML;
const entries: NavigationEntry[] = [
  ...parsed.querySelectorAll<HTMLAnchorElement>('nav[aria-label="Documentation"] a'),
].map((link) => ({
  path: normalizeReferencePath(
    new URL(link.getAttribute('href') ?? '', window.location.href).pathname.slice(
      basePath.length - 1,
    ),
  ),
  title: link.textContent?.trim() ?? '',
  summary: link.dataset.navigationSummary ?? '',
}));
const paths = new Set(entries.map((entry) => entry.path));
const logoEffectFrames = [
  'single-logo-effect1-white.png',
  'single-logo-effect2-white.png',
  'single-logo-effect3-white.png',
  'single-logo-effect4-white.png',
];

function ShellSlot({
  target,
  children,
  className = 'reference-live-shell-slot',
}: {
  target: HTMLElement;
  children: React.ReactNode;
  className?: string;
}) {
  React.useEffect(() => {
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        for (const fallback of target.querySelectorAll(':scope > [data-shell-fallback]'))
          fallback.remove();
        target.classList.add('shell-slot-ready');
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [target]);
  return createPortal(<div className={className}>{children}</div>, target);
}

function DocumentationShell({
  page,
  renderedPage,
  onPageChange,
  onMainTarget,
}: {
  page: ReferencePage;
  renderedPage: ReferencePage | null;
  onPageChange: (page: ReferencePage) => void;
  onMainTarget: (target: HTMLElement) => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const pathname = normalizeReferencePath(location.pathname);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const treeRef = React.useRef<NavigationTreeHandle>(null);
  const lastPage = React.useRef(initialPage);
  const scrollPositions = React.useRef(new Map<string, number>());
  const initialLocation = React.useRef(location.key);
  const [slots, setSlots] = React.useState<Record<string, HTMLElement>>({});
  const [query, setQuery] = React.useState('');
  const [navigationOpen, setNavigationOpen] = React.useState(false);
  const [retry, setRetry] = React.useState(0);
  const [collapsed, setCollapsed] = React.useState(
    () => readStoredValue('localStorage', 'coreai-docsite-sidebar-collapsed') === 'true',
  );
  const isApplePlatform = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  const markup = React.useMemo(() => ({ __html: shellHtml }), []);
  const toggleNavigation = React.useCallback(() => {
    if (window.innerWidth <= 1100) setNavigationOpen((open) => !open);
    else setCollapsed((value) => !value);
  }, []);
  const focusSearch = React.useCallback(() => {
    setCollapsed(false);
    if (window.innerWidth <= 1100) setNavigationOpen(true);
    requestAnimationFrame(() => {
      searchRef.current?.focus();
      searchRef.current?.select();
    });
  }, []);
  const collapseGroups = React.useCallback(() => {
    setQuery('');
    treeRef.current?.collapseAll();
  }, []);
  const expandGroups = React.useCallback(() => {
    setQuery('');
    treeRef.current?.expandAll();
  }, []);
  const navigatePage = React.useCallback(
    (direction: -1 | 1) => {
      const index = entries.findIndex((entry) => entry.path === pathname);
      const next = entries[index + direction];
      if (index >= 0 && next) navigate(next.path);
    },
    [pathname, navigate],
  );
  useDocsiteInteractions({
    onToggleNavigation: toggleNavigation,
    onCollapseNavigation: collapseGroups,
    onExpandNavigation: expandGroups,
    onNavigatePage: navigatePage,
    onFocusSearch: focusSearch,
    isApplePlatform,
  });

  React.useLayoutEffect(() => {
    const root = contentRef.current;
    const target = root?.querySelector<HTMLElement>('#main');
    const nav = root?.querySelector<HTMLElement>('nav[aria-label="Documentation"]');
    if (!root || !target || !nav) throw new Error('Missing documentation shell slots.');
    const next: Record<string, HTMLElement> = { navigation: nav };
    for (const name of ['logo', 'theme', 'search', 'header']) {
      const element = root.querySelector<HTMLElement>(`[data-shell-${name}]`);
      if (!element) throw new Error(`Missing documentation shell slot: ${name}`);
      next[name] = element;
    }
    setSlots(next);
    onMainTarget(target);
  }, [onMainTarget]);

  React.useEffect(() => {
    const sidebar = contentRef.current?.querySelector<HTMLElement>('#app-navigation');
    sidebar?.classList.toggle('is-collapsed', collapsed && window.innerWidth > 1100);
    writeStoredValue('localStorage', 'coreai-docsite-sidebar-collapsed', String(collapsed));
  }, [collapsed, slots]);

  React.useLayoutEffect(() => {
    const home = page.path === '/' && page.status === 'ready';
    contentRef.current?.querySelector('.app-content')?.classList.toggle('app-content--home', home);
    contentRef.current?.querySelector('.app-page')?.classList.toggle('app-page--home', home);
  }, [page.path, page.status]);

  React.useEffect(() => {
    setQuery('');
    setNavigationOpen(false);
    if (lastPage.current.path === pathname) {
      onPageChange(lastPage.current);
      return;
    }
    const controller = new AbortController();
    async function loadPage() {
      try {
        const response = await fetch(`${basePath}${pathname.slice(1)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status} while loading ${pathname}`);
        if (!response.headers.get('content-type')?.includes('text/html'))
          throw new Error(`Expected HTML at ${pathname}`);
        const document = new DOMParser().parseFromString(await response.text(), 'text/html');
        const main = document.getElementById('main');
        const staticContent = document.getElementById('reference-content');
        if (!main || !staticContent || !document.querySelector('.reference-shell'))
          throw new Error(`Invalid documentation page at ${pathname}`);
        if (controller.signal.aborted) return;
        fallbackHtml = staticContent.outerHTML;
        const loaded: ReferencePage = {
          path: pathname,
          title: document.title,
          html: main.innerHTML,
          status: 'ready',
        };
        lastPage.current = loaded;
        onPageChange(loaded);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Could not load documentation page.', error);
        onPageChange({
          path: pathname,
          title: 'Documentation unavailable | CoreAI design system',
          html: '',
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
    void loadPage();
    return () => controller.abort();
  }, [pathname, retry, onPageChange]);

  React.useEffect(() => {
    document.title = page.title;
  }, [page.title]);
  React.useEffect(() => {
    const root = document.getElementById('reference-root');
    if (!root) throw new Error('Missing documentation application root.');
    const followLink = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        !(event.target instanceof Element) ||
        event.target.closest('[data-example-id]')
      )
        return;
      const link = event.target.closest<HTMLAnchorElement>('a[href]');
      if (!link) return;
      const target = clientNavigationTarget(link.getAttribute('href') ?? link.href, {
        currentUrl: window.location.href,
        basePath,
        paths,
        button: event.button,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        download: link.hasAttribute('download'),
        target: link.target,
      });
      if (target === undefined) return;
      event.preventDefault();
      navigate(target);
    };
    root.addEventListener('click', followLink);
    return () => root.removeEventListener('click', followLink);
  }, [navigate]);
  React.useLayoutEffect(() => {
    const region = contentRef.current?.querySelector<HTMLElement>('.app-page');
    return () => {
      if (region) scrollPositions.current.set(location.key, region.scrollTop);
    };
  }, [location.key]);
  React.useLayoutEffect(() => {
    if (page !== renderedPage || page.path !== pathname || page.status !== 'ready') return;
    const root = contentRef.current;
    const region = root?.querySelector<HTMLElement>('.app-page');
    if (!region) return;
    region.scrollTop =
      navigationType === 'POP' ? (scrollPositions.current.get(location.key) ?? 0) : 0;
    if (location.key !== initialLocation.current)
      root?.querySelector<HTMLElement>('#main')?.focus({ preventScroll: true });
    if (location.hash) {
      revealFragment(location.hash)?.scrollIntoView({ block: 'start' });
    }
  }, [page, renderedPage, pathname, location.key, location.hash, navigationType]);

  React.useEffect(() => {
    const sidebar = contentRef.current?.querySelector<HTMLElement>('#app-navigation');
    const body = contentRef.current?.querySelector<HTMLElement>('.app-content');
    if (!sidebar || !body) return;
    sidebar.classList.toggle('is-open', navigationOpen);
    sidebar.setAttribute(
      'aria-label',
      navigationOpen ? 'Site navigation dialog' : 'Site navigation',
    );
    if (navigationOpen) {
      sidebar.setAttribute('role', 'dialog');
      sidebar.setAttribute('aria-modal', 'true');
      sidebar.querySelector<HTMLInputElement>('input')?.focus();
    } else {
      sidebar.removeAttribute('role');
      sidebar.removeAttribute('aria-modal');
    }
    body.inert = navigationOpen;
    const syncSidebarState = () => {
      const mobile = window.innerWidth <= 1100;
      sidebar.inert = mobile && !navigationOpen;
      if (!mobile) setNavigationOpen(false);
    };
    syncSidebarState();
    const close = () => {
      setNavigationOpen(false);
      requestAnimationFrame(() => menuButtonRef.current?.focus());
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!navigationOpen) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
      if (event.key === 'Tab') {
        const controls = [
          ...sidebar.querySelectorAll<HTMLElement>('a[href], button, input, [tabindex]'),
        ].filter((element) => element.tabIndex >= 0 && element.getClientRects().length);
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const dismiss = sidebar.querySelector('[data-close-navigation]');
    dismiss?.addEventListener('click', close);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', syncSidebarState);
    return () => {
      dismiss?.removeEventListener('click', close);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', syncSidebarState);
    };
  }, [navigationOpen, slots]);

  return (
    <div className="reference-application">
      <div ref={contentRef} dangerouslySetInnerHTML={markup} />
      {slots.logo ? (
        <ShellSlot target={slots.logo}>
          <>
            <span className="app-sidenav__search-logo-static">
              <CoreAILogo />
            </span>
            <span className="app-sidenav__search-logo-effects" aria-hidden="true">
              {logoEffectFrames.map((frame) => (
                <img key={frame} src={`${basePath}logo-effects/${frame}`} alt="" />
              ))}
            </span>
          </>
        </ShellSlot>
      ) : null}
      {slots.navigation ? (
        <ShellSlot target={slots.navigation} className="reference-live-navigation">
          <NavigationTree ref={treeRef} entries={entries} query={query} />
        </ShellSlot>
      ) : null}
      {slots.theme ? (
        <ShellSlot target={slots.theme}>
          <ThemeSwitcher
            key={`${pathname}:${collapsed}:${navigationOpen}`}
            isApplePlatform={isApplePlatform}
          />
        </ShellSlot>
      ) : null}
      {slots.search ? (
        <ShellSlot target={slots.search}>
          <SearchBox
            ref={searchRef}
            aria-label="Search navigation"
            placeholder="Search"
            title="Search documentation"
            contentBefore={null}
            contentAfter={
              <span className="app-sidenav__search-shortcut" aria-hidden="true">
                <span
                  className={
                    isApplePlatform
                      ? 'app-sidenav__search-shortcut-command'
                      : 'app-sidenav__search-shortcut-control'
                  }
                >
                  {isApplePlatform ? '⌘' : 'Ctrl'}
                </span>
                <span className="app-sidenav__search-shortcut-key">K</span>
              </span>
            }
            value={query}
            onChange={(_event, data) => setQuery(data.value)}
          />
        </ShellSlot>
      ) : null}
      {slots.header
        ? createPortal(
            <>
              <Header
                menuButtonRef={menuButtonRef}
                navigationOpen={navigationOpen}
                onNavigationOpen={() => setNavigationOpen(true)}
              />
              {page.status === 'error' ? (
                <Button className="reference-retry" onClick={() => setRetry((value) => value + 1)}>
                  Retry page loading
                </Button>
              ) : null}
            </>,
            slots.header,
          )
        : null}
    </div>
  );
}

function ReferenceApp() {
  const [page, setPage] = React.useState<ReferencePage>(initialPage);
  const [renderedPage, setRenderedPage] = React.useState<ReferencePage | null>(null);
  const [mainTarget, setMainTarget] = React.useState<HTMLElement | null>(null);
  return (
    <ThemeProvider>
      <BrowserRouter basename={basePath}>
        <DocumentationShell
          page={page}
          renderedPage={renderedPage}
          onPageChange={setPage}
          onMainTarget={setMainTarget}
        />
      </BrowserRouter>
      {mainTarget
        ? createPortal(
            <PageContent
              key={`${page.path}:${page.status}`}
              page={page}
              onReady={setRenderedPage}
            />,
            mainTarget,
          )
        : null}
    </ThemeProvider>
  );
}

class DocumentationBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.error('Interactive documentation failed; restoring the static page.', error);
    delete document.documentElement.dataset.referenceEnhanced;
  }
  render() {
    return this.state.failed ? (
      <>
        <p role="alert">
          Interactive features are unavailable. Documentation and source remain readable.
        </p>
        <div dangerouslySetInnerHTML={{ __html: fallbackHtml }} />
      </>
    ) : (
      this.props.children
    );
  }
}

createRoot(container).render(
  <DocumentationBoundary>
    <ReferenceApp />
  </DocumentationBoundary>,
);
container.addEventListener('click', async (event) => {
  const button =
    event.target instanceof Element
      ? event.target.closest<HTMLButtonElement>('[data-copy-source]')
      : null;
  if (!button) return;
  const id = button.dataset.copySource;
  const source = id ? document.getElementById(id) : null;
  const status = container.querySelector<HTMLElement>(`[data-copy-status="${id}"]`);
  if (!source || !status) throw new Error(`Missing copyable reference source: ${id}`);
  try {
    await navigator.clipboard.writeText(source.textContent ?? '');
    status.textContent = 'Copied.';
  } catch (error) {
    console.error('Could not copy reference source.', error);
    status.textContent = 'Copy failed. Select the source text or use Download source.';
  }
});
