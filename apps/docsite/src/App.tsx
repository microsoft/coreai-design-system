// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Link,
  Text,
} from '@coreai-ds/react-components';
import { Navigate, Routes, Route } from 'react-router-dom';
import { Shell } from './components/Shell';
import { PageLayout } from './components/PageLayout';
import { Section } from './components/Section';
import { WorkInProgress } from './components/WorkInProgress';
import { faqGroups } from './data/Faqs';
import { pages, redirects } from './data/Registry';

const Introduction = React.lazy(() =>
  import('./pages/Introduction').then((module) => ({
    default: module.Introduction,
  })),
);
const Changelog = React.lazy(() =>
  import('./pages/Changelog').then((module) => ({
    default: module.Changelog,
  })),
);
const Colors = React.lazy(() =>
  import('./pages/Colors').then((module) => ({ default: module.Colors })),
);
const Typography = React.lazy(() =>
  import('./pages/Typography').then((module) => ({
    default: module.Typography,
  })),
);
const Materials = React.lazy(() =>
  import('./pages/Materials').then((module) => ({
    default: module.Materials,
  })),
);
const Content = React.lazy(() =>
  import('./pages/Content').then((module) => ({
    default: module.Content,
  })),
);
const Component = React.lazy(() =>
  import('./pages/Component').then((module) => ({
    default: module.Component,
  })),
);
const Package = React.lazy(() =>
  import('./pages/Package').then((module) => ({
    default: module.Package,
  })),
);
const NotFound = React.lazy(() =>
  import('./pages/NotFound').then((module) => ({
    default: module.NotFound,
  })),
);

const routeComponents: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  home: Introduction,
  changelog: Changelog,
  colors: Colors,
  typography: Typography,
  content: Content,
  materials: Materials,
  package: Package,
};

const blankPageIds = new Set(['content', 'materials']);

export function App() {
  return (
    <>
      <Routes>
        <Route element={<Shell />}>
          {pages.map((page) => {
            if (page.id === 'faqs') {
              return (
                <Route
                  key={page.id}
                  path={page.slug}
                  element={
                    <PageLayout id={page.id}>
                      {faqGroups.map((group) => (
                        <Section key={group.id} id={group.id} title={group.title}>
                          <Accordion className="faq-list" multiple collapsible>
                            {group.items.map((item) => (
                              <AccordionItem key={item.id} value={item.id}>
                                <AccordionHeader
                                  expandIconPosition="end"
                                  size="large"
                                  role="heading"
                                  aria-level={3}
                                >
                                  <Text size={400} weight="regular">
                                    {item.question}
                                  </Text>
                                </AccordionHeader>
                                <AccordionPanel>
                                  <div className="faq-answer">
                                    {item.answer.map((paragraph) => (
                                      <Text as="p" size={300} foreground={3} key={paragraph}>
                                        {paragraph}
                                      </Text>
                                    ))}
                                    {item.links?.length ? (
                                      <div className="faq-links">
                                        {item.links.map((link) => (
                                          <Link key={link.href} href={link.href} external>
                                            {link.label}
                                            <span className="sr-only"> (opens in a new tab)</span>
                                          </Link>
                                        ))}
                                      </div>
                                    ) : null}
                                  </div>
                                </AccordionPanel>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </Section>
                      ))}
                    </PageLayout>
                  }
                />
              );
            }
            if (blankPageIds.has(page.id)) {
              return (
                <Route
                  key={page.id}
                  path={page.slug}
                  element={
                    <PageLayout id={page.id} hideTitle summary="">
                      <WorkInProgress key={page.id} standalone />
                    </PageLayout>
                  }
                />
              );
            }
            if (
              page.group === 'Components' ||
              page.group === 'Templates' ||
              page.group === 'Assets'
            ) {
              return (
                <Route
                  key={page.id}
                  path={page.slug}
                  element={<Component componentId={page.id} />}
                />
              );
            }
            const Page = routeComponents[page.id];
            if (!Page) {
              throw new Error(`No route component registered for "${page.id}"`);
            }
            return <Route key={page.id} path={page.slug} element={<Page />} />;
          })}
          {redirects.map((redirect) => (
            <Route
              key={redirect.from}
              path={redirect.from}
              element={<Navigate to={redirect.to} replace />}
            />
          ))}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
