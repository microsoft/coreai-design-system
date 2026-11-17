// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  LinkButton,
} from '@coreai-ds/react-components';
import { useLocation } from 'react-router-dom';
import {
  groupNavigationEntries,
  normalizeReferencePath,
  searchNavigationEntries,
} from './Navigation.mjs';

export interface NavigationEntry {
  path: string;
  title: string;
  summary: string;
  searchText: string;
  showInSidebar: boolean;
}

export interface NavigationTreeHandle {
  collapseAll: () => void;
  expandAll: () => void;
  focusFirstResult: () => void;
}

export const NavigationTree = React.forwardRef<
  NavigationTreeHandle,
  {
    entries: NavigationEntry[];
    query: string;
    onExitSearch: () => void;
  }
>(function NavigationTree({ entries, query, onExitSearch }, ref) {
  const location = useLocation();
  const activePath = normalizeReferencePath(location.pathname);
  const groups = groupNavigationEntries(entries.filter((entry) => entry.showInSidebar));
  const resultsRef = React.useRef<HTMLUListElement>(null);
  const activeGroup =
    groups.find((group) => group.items.some((entry) => entry.path === activePath))?.value ??
    'getting-started';
  const [openItems, setOpenItems] = React.useState<string[]>(() => [
    ...new Set(['getting-started', activeGroup]),
  ]);
  React.useImperativeHandle(ref, () => ({
    collapseAll: () => setOpenItems([]),
    expandAll: () => setOpenItems(groups.map((group) => group.value)),
    focusFirstResult: () => resultsRef.current?.querySelector<HTMLAnchorElement>('a')?.focus(),
  }));
  const needle = query.trim().toLowerCase();
  const results = searchNavigationEntries(entries, needle);

  React.useEffect(() => {
    setOpenItems((current) => [...new Set([...current, activeGroup])]);
  }, [activeGroup, activePath]);

  function HighlightedText({ text }: { text: string }) {
    const start = text.toLowerCase().indexOf(needle);
    if (start < 0) return text;
    return (
      <>
        {text.slice(0, start)}
        <mark>{text.slice(start, start + needle.length)}</mark>
        {text.slice(start + needle.length)}
      </>
    );
  }

  if (needle) {
    return (
      <div className="app-search-results">
        <div className="app-search-results__header" role="status">
          {results.length} {results.length === 1 ? 'result' : 'results'} for “{query.trim()}”
        </div>
        {results.length ? (
          <ul
            ref={resultsRef}
            className="app-search-results__list"
            aria-label="Search results"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                onExitSearch();
                return;
              }
              const links = [...event.currentTarget.querySelectorAll<HTMLAnchorElement>('a')];
              const index = links.findIndex((link) => link === event.target);
              if (index < 0) return;
              let next: number;
              switch (event.key) {
                case 'ArrowDown':
                  next = Math.min(index + 1, links.length - 1);
                  break;
                case 'ArrowUp':
                  next = Math.max(0, index - 1);
                  break;
                case 'Home':
                  next = 0;
                  break;
                case 'End':
                  next = links.length - 1;
                  break;
                default:
                  return;
              }
              event.preventDefault();
              links[next]?.focus();
            }}
          >
            {results.map(({ entry, excerpt }) => (
              <li key={entry.path}>
                <a
                  href={`${import.meta.env.BASE_URL}${entry.path.slice(1)}`}
                  className="app-search-result"
                  aria-current={entry.path === activePath ? 'page' : undefined}
                >
                  <span className="app-search-result__title">
                    <HighlightedText text={entry.title} />
                  </span>
                  <span className="app-search-result__excerpt">
                    <HighlightedText text={excerpt} />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="app-search-results__empty">Try a different word or phrase.</p>
        )}
      </div>
    );
  }

  return (
    <>
      {groups.map((group) => {
        const items = group.items;
        return items.length ? (
          <div className="app-sidenav__section-shell" key={group.value}>
            <Accordion
              collapsible
              openItems={openItems.includes(group.value) ? [group.value] : []}
              onToggle={(_event, data) => {
                const isOpen = (data.openItems as string[]).includes(group.value);
                setOpenItems((current) =>
                  isOpen
                    ? [...new Set([...current, group.value])]
                    : current.filter((value) => value !== group.value),
                );
              }}
            >
              <AccordionItem value={group.value} key={group.value}>
                <AccordionHeader expandIconPosition="end" size="small">
                  {group.label}
                </AccordionHeader>
                <AccordionPanel>
                  <div className="reference-navigation-links">
                    {items.map((entry) => (
                      <LinkButton
                        key={entry.path}
                        href={`${import.meta.env.BASE_URL}${entry.path.slice(1)}`}
                        appearance="subtle"
                        className="reference-navigation-link"
                        aria-current={entry.path === activePath ? 'page' : undefined}
                      >
                        {entry.title}
                      </LinkButton>
                    ))}
                  </div>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </div>
        ) : null;
      })}
    </>
  );
});
