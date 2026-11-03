// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Tab,
  TabList,
} from '@coreai-ds/react-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { groupNavigationEntries, normalizeReferencePath } from './navigation.mjs';

export interface NavigationEntry {
  path: string;
  title: string;
  summary: string;
}

export interface NavigationTreeHandle {
  collapseAll: () => void;
  expandAll: () => void;
}

export const NavigationTree = React.forwardRef<
  NavigationTreeHandle,
  { entries: NavigationEntry[]; query: string }
>(function NavigationTree({ entries, query }, ref) {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = normalizeReferencePath(location.pathname);
  const groups = groupNavigationEntries(entries);
  const activeGroup =
    groups.find((group) => group.items.some((entry) => entry.path === activePath))?.value ??
    'getting-started';
  const [openItems, setOpenItems] = React.useState<string[]>(() => [
    ...new Set(['getting-started', activeGroup]),
  ]);
  React.useImperativeHandle(ref, () => ({
    collapseAll: () => setOpenItems([]),
    expandAll: () => setOpenItems(groups.map((group) => group.value)),
  }));
  const needle = query.trim().toLowerCase();
  const results = entries.filter(
    (entry) =>
      !needle ||
      entry.title.toLowerCase().includes(needle) ||
      entry.path.toLowerCase().includes(needle) ||
      entry.summary.toLowerCase().includes(needle),
  );

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
          <ul className="app-search-results__list">
            {results.map((entry) => (
              <li key={entry.path}>
                <button
                  type="button"
                  className="app-search-result"
                  onClick={() => navigate(entry.path)}
                >
                  <span className="app-search-result__title">
                    <HighlightedText text={entry.title} />
                  </span>
                  <span className="app-search-result__excerpt">
                    <HighlightedText text={entry.summary} />
                  </span>
                </button>
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
                  <TabList
                    vertical
                    appearance="subtle"
                    size="medium"
                    selectedValue={activePath}
                    onTabSelect={(_event, data) => navigate(String(data.value))}
                  >
                    {items.map((entry) => (
                      <Tab key={entry.path} value={entry.path}>
                        {entry.title}
                      </Tab>
                    ))}
                  </TabList>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </div>
        ) : null;
      })}
    </>
  );
});
