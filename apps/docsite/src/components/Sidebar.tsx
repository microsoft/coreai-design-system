// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  type AccordionToggleEventHandler,
} from '@coreai-ds/react-components';
import { SearchBox } from '@coreai-ds/react-components';
import { TabList, Tab, type SelectTabData, type SelectTabEvent } from '@coreai-ds/react-components';
import { Link } from '@coreai-ds/react-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { normalizeRoutePath, pages, sidebarGroups } from '../data/registry';
import { searchPages } from '../data/search';
import { siteLinks } from '../data/content';
import { CoreAILogo, ExternalIcon } from './Icons';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useDocsiteInteractions } from '../hooks/useDocsiteInteractions';

const sidebarStorageKey = 'coreai-docsite-sidebar-collapsed';
const navigationPages = sidebarGroups.flatMap((group) => group.items);

const logoEffectFrames = [
  '/logo-effects/single-logo-effect1-white.png',
  '/logo-effects/single-logo-effect2-white.png',
  '/logo-effects/single-logo-effect3-white.png',
  '/logo-effects/single-logo-effect4-white.png',
];

interface SidebarProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const parts: React.ReactNode[] = [];
  const normalizedText = text.toLowerCase();
  let cursor = 0;
  let matchIndex = normalizedText.indexOf(query);

  while (matchIndex >= 0) {
    if (matchIndex > cursor) {
      parts.push(text.slice(cursor, matchIndex));
    }
    const matchEnd = matchIndex + query.length;
    parts.push(
      <mark key={`${matchIndex}-${text.slice(matchIndex, matchEnd)}`}>
        {text.slice(matchIndex, matchEnd)}
      </mark>,
    );
    cursor = matchEnd;
    matchIndex = normalizedText.indexOf(query, cursor);
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return <>{parts}</>;
}

export function Sidebar({ isOpen, onOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = React.useRef<HTMLElement>(null);
  const navigationRef = React.useRef<HTMLElement>(null);
  const revealActivePageRef = React.useRef(true);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const logoButtonRef = React.useRef<HTMLButtonElement>(null);
  const [isCollapsed, setIsCollapsed] = React.useState(
    () => typeof localStorage !== 'undefined' && localStorage.getItem(sidebarStorageKey) === 'true',
  );
  const [query, setQuery] = React.useState('');
  const toggleNavigation = React.useCallback(() => {
    if (sidebarRef.current && getComputedStyle(sidebarRef.current).position === 'fixed') {
      if (isOpen) {
        onClose();
      } else {
        onOpen();
      }
    } else {
      setIsCollapsed((current) => !current);
    }
  }, [isOpen, onClose, onOpen]);

  const toggleNavigationFromShortcut = React.useCallback(() => {
    const focusedElement = document.activeElement;
    if (focusedElement instanceof HTMLElement && sidebarRef.current?.contains(focusedElement)) {
      focusedElement.blur();
    }
    toggleNavigation();
  }, [toggleNavigation]);

  const isApplePlatform =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  const activePagePath = normalizeRoutePath(location.pathname);
  const activeGroup = sidebarGroups.find((group) =>
    group.items.some((page) => normalizeRoutePath(page.slug) === activePagePath),
  );
  const [openGroups, setOpenGroups] = React.useState<string[]>(() =>
    sidebarGroups
      .filter((group) => group.label === 'Overview' || group.label === activeGroup?.label)
      .map((group) => group.label),
  );

  const collapseNavigation = React.useCallback(() => {
    if (sidebarRef.current?.contains(document.activeElement)) {
      logoButtonRef.current?.focus();
    }
    setQuery('');
    setOpenGroups([]);
  }, []);

  const expandNavigation = React.useCallback(() => {
    setQuery('');
    setOpenGroups(sidebarGroups.map((group) => group.label));
  }, []);

  const navigatePage = React.useCallback(
    (direction: -1 | 1) => {
      const currentIndex = navigationPages.findIndex(
        (page) => normalizeRoutePath(page.slug) === activePagePath,
      );
      const nextPage = currentIndex >= 0 ? navigationPages[currentIndex + direction] : undefined;
      if (!nextPage) return;
      setQuery('');
      navigate(nextPage.slug);
      onClose();
      requestAnimationFrame(() => document.getElementById('main-content')?.focus());
    },
    [activePagePath, navigate, onClose],
  );

  const focusSearch = React.useCallback(() => {
    if (sidebarRef.current && getComputedStyle(sidebarRef.current).position === 'fixed') {
      onOpen();
    }
    setIsCollapsed(false);
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
  }, [onOpen]);

  useDocsiteInteractions({
    onToggleNavigation: toggleNavigationFromShortcut,
    onCollapseNavigation: collapseNavigation,
    onExpandNavigation: expandNavigation,
    onNavigatePage: navigatePage,
    onFocusSearch: focusSearch,
    isApplePlatform,
  });

  React.useEffect(() => {
    revealActivePageRef.current = true;
    if (!activeGroup) return;
    setOpenGroups((current) =>
      current.includes(activeGroup.label) ? current : [...current, activeGroup.label],
    );
  }, [activeGroup, activePagePath]);

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!revealActivePageRef.current) return;
      const navigation = navigationRef.current;
      const activeTab = navigation?.querySelector<HTMLElement>(
        '[role="tab"][aria-selected="true"]',
      );
      if (!navigation || !activeTab || !activeTab.getClientRects().length) return;
      revealActivePageRef.current = false;
      const viewport = navigation.getBoundingClientRect();
      const item = activeTab.getBoundingClientRect();
      if (item.bottom > viewport.bottom) {
        navigation.scrollTop += item.bottom - viewport.bottom;
      } else if (item.top < viewport.top) {
        navigation.scrollTop += item.top - viewport.top;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [activePagePath, openGroups, isCollapsed, isOpen, query]);

  React.useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(sidebarStorageKey, String(isCollapsed));
  }, [isCollapsed]);

  const onTabSelect = React.useCallback(
    (_event: SelectTabEvent, data: SelectTabData) => {
      if (query.trim()) {
        setQuery('');
      }
      navigate(String(data.value));
      onClose();
    },
    [navigate, onClose, query],
  );

  const needle = query.trim().toLowerCase();
  const searchResults = React.useMemo(() => searchPages(pages, needle), [needle]);
  const resultCount = searchResults.length;
  const groups = sidebarGroups;
  const standaloneGroups = groups.filter((group) => group.layout === 'standalone');
  const combinedGroups = groups.filter((group) => group.layout === 'combined');

  const openItems = openGroups;
  const createSectionToggleHandler =
    (sectionGroups: typeof groups): AccordionToggleEventHandler =>
    (_event, data) => {
      const sectionLabels = new Set(sectionGroups.map((group) => group.label));
      setOpenGroups((current) => [
        ...current.filter((label) => !sectionLabels.has(label)),
        ...(data.openItems as string[]),
      ]);
    };

  const renderGroup = (group: (typeof groups)[number]) => (
    <AccordionItem value={group.label} key={group.label}>
      <AccordionHeader expandIconPosition="end" size="small">
        {group.label}
      </AccordionHeader>
      <AccordionPanel>
        <TabList
          vertical
          appearance="subtle"
          size="medium"
          selectedValue={activePagePath}
          onTabSelect={onTabSelect}
        >
          {group.items.map((page) => (
            <Tab key={page.id} value={normalizeRoutePath(page.slug)}>
              {page.navLabel}
            </Tab>
          ))}
        </TabList>
      </AccordionPanel>
    </AccordionItem>
  );

  const selectSearchResult = React.useCallback(
    (slug: string) => {
      setQuery('');
      navigate(slug);
      onClose();
    },
    [navigate, onClose],
  );

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusFrame = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof Node && !sidebarRef.current?.contains(event.target)) {
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !sidebarRef.current) {
        return;
      }

      const focusable = Array.from(
        sidebarRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) {
        return;
      }

      if (
        event.shiftKey &&
        (document.activeElement === first || !sidebarRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <aside
      ref={sidebarRef}
      id="app-navigation"
      className={`app-sidenav${isOpen ? ' is-open' : ''}${isCollapsed ? ' is-collapsed' : ''}`}
      role={isOpen ? 'dialog' : undefined}
      aria-modal={isOpen || undefined}
      aria-label={isOpen ? 'Site navigation' : undefined}
      data-docsite-sidebar
    >
      <div className="app-sidenav__header">
        <div className="app-sidenav__search-row">
          <button
            ref={logoButtonRef}
            type="button"
            className="app-sidenav__search-logo"
            aria-label={isOpen || !isCollapsed ? 'Hide navigation' : 'Show navigation'}
            aria-expanded={isOpen || !isCollapsed}
            aria-controls="app-navigation-links"
            aria-keyshortcuts="Alt+s"
            title={`Toggle navigation (${isApplePlatform ? 'Option' : 'Alt'}+S)`}
            onClick={toggleNavigation}
          >
            <span className="app-sidenav__search-logo-static">
              <CoreAILogo />
            </span>
            <span className="app-sidenav__search-logo-effects" aria-hidden="true">
              {logoEffectFrames.map((frame) => (
                <img key={frame} src={frame} alt="" />
              ))}
            </span>
          </button>
          <SearchBox
            ref={searchInputRef}
            placeholder="Search"
            value={query}
            onChange={(_event, data) => setQuery(data.value)}
            aria-label="Search navigation"
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
          />
          <ThemeSwitcher
            key={`${location.pathname}:${isCollapsed}:${isOpen}`}
            isApplePlatform={isApplePlatform}
          />
          <button
            type="button"
            className="app-sidenav__dismiss"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <nav
        ref={navigationRef}
        id="app-navigation-links"
        className="app-sidenav__nav"
        aria-label="Section navigation"
      >
        {needle ? (
          <div className="app-search-results">
            <div className="app-search-results__header" role="status">
              {resultCount} {resultCount === 1 ? 'result' : 'results'} for “{query.trim()}”
            </div>
            {searchResults.length > 0 ? (
              <ul className="app-search-results__list">
                {searchResults.map(({ page, excerpt }) => (
                  <li key={page.id}>
                    <button
                      type="button"
                      className="app-search-result"
                      onClick={() => selectSearchResult(normalizeRoutePath(page.slug))}
                    >
                      <span className="app-search-result__path">{page.slug}</span>
                      <span className="app-search-result__title">
                        <HighlightedText text={page.title} query={needle} />
                      </span>
                      <span className="app-search-result__excerpt">
                        <HighlightedText text={excerpt} query={needle} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="app-search-results__empty">Try a different word or phrase.</p>
            )}
          </div>
        ) : (
          <>
            {combinedGroups.length > 0 ? (
              <div className="app-sidenav__section-shell">
                <Accordion
                  multiple
                  collapsible
                  openItems={openItems.filter((item) =>
                    combinedGroups.some((group) => group.label === item),
                  )}
                  onToggle={createSectionToggleHandler(combinedGroups)}
                >
                  {combinedGroups.map(renderGroup)}
                </Accordion>
              </div>
            ) : null}
            {standaloneGroups.map((group) => (
              <div className="app-sidenav__section-shell" key={group.label}>
                <Accordion
                  multiple
                  collapsible
                  openItems={openItems.filter((item) => item === group.label)}
                  onToggle={createSectionToggleHandler([group])}
                >
                  {renderGroup(group)}
                </Accordion>
              </div>
            ))}
          </>
        )}
      </nav>

      <div className="app-sidenav__footer">
        <Link className="app-sidenav__link" href={siteLinks.contact} target="_blank" rel="noopener">
          <span className="app-sidenav__link-title">
            <span>Questions?</span>
            <ExternalIcon className="app-sidenav__link-external" />
          </span>
        </Link>
        <Link
          className="app-sidenav__link"
          href={siteLinks.feedback}
          target="_blank"
          rel="noopener"
        >
          <span className="app-sidenav__link-title">
            <span>Feedback</span>
            <ExternalIcon className="app-sidenav__link-external" />
          </span>
        </Link>
      </div>
    </aside>
  );
}
