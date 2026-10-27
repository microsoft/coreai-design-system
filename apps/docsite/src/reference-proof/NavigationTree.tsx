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
import { normalizeReferencePath } from './navigation.mjs';

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
  const groups = [
    { value: 'overview', label: 'Overview' },
    { value: 'guides', label: 'Guides' },
    { value: 'foundations', label: 'Foundations' },
    { value: 'patterns', label: 'Patterns' },
    { value: 'components', label: 'Components' },
    { value: 'templates', label: 'Templates' },
  ];
  const [openItems, setOpenItems] = React.useState<string[]>(() => [
    'overview',
    activePath.split('/')[1] || 'overview',
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
    const parent = activePath.split('/')[1] || 'overview';
    setOpenItems((current) => [...new Set([...current, parent])]);
  }, [activePath]);

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
                  <span className="app-search-result__path">{entry.path}</span>
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
    <div className="app-sidenav__section-shell">
      <Accordion
        multiple
        collapsible
        openItems={openItems}
        onToggle={(_event, data) => setOpenItems(data.openItems as string[])}
      >
        {groups.map((group) => {
          const items = entries.filter(
            (entry) => (entry.path.split('/')[1] || 'overview') === group.value,
          );
          return items.length ? (
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
          ) : null;
        })}
      </Accordion>
    </div>
  );
});
