// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Link, Text } from '@coreai-ds/react-components';
import { PageLayout } from '../components/PageLayout';
import { ExternalIcon, FigmaLogo, NpmLogo, StorybookLogo } from '../components/Icons';
import { siteLinks } from '../data/content';

const CoreAILogoCube = React.lazy(() =>
  import('../components/CoreAILogoCube').then((module) => ({ default: module.CoreAILogoCube })),
);

export function Introduction() {
  return (
    <PageLayout id="home" hideTitle>
      <div className="home-landing">
        <div className="home-foreground">
          <header className="home-heading">
            <Text as="h1" weight="regular" foreground={1}>
              CoreAI Design System
            </Text>
            <Text as="p" size={400} foreground={2}>
              Shared components, patterns, and tools for building consistent, accessible CoreAI
              experiences.
            </Text>
          </header>
          {/* Audience cards will return when their supporting content is ready. */}
          <div className="home-resource-links app-sidenav__quick-links">
            <Link
              className="app-sidenav__quick-link"
              href={siteLinks.storybook}
              target="_blank"
              rel="noopener noreferrer"
            >
              <StorybookLogo className="app-sidenav__quick-link-brand" />
              <span className="app-sidenav__quick-link-title">
                <span>Storybook</span>
                <ExternalIcon className="app-sidenav__quick-link-open" />
              </span>
            </Link>
            <Link
              className="app-sidenav__quick-link"
              href={siteLinks.figma}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FigmaLogo className="app-sidenav__quick-link-brand app-sidenav__figma-logo" />
              <span className="app-sidenav__quick-link-title">
                <span>Figma</span>
                <ExternalIcon className="app-sidenav__quick-link-open" />
              </span>
            </Link>
            <Link
              className="app-sidenav__quick-link"
              href={siteLinks.npmPackage}
              target="_blank"
              rel="noopener noreferrer"
            >
              <NpmLogo className="app-sidenav__quick-link-brand" />
              <span className="app-sidenav__quick-link-title">
                <span>npm</span>
                <ExternalIcon className="app-sidenav__quick-link-open" />
              </span>
            </Link>
          </div>
        </div>
        <div className="home-visual">
          <React.Suspense fallback={null}>
            <CoreAILogoCube />
          </React.Suspense>
        </div>
      </div>
    </PageLayout>
  );
}
