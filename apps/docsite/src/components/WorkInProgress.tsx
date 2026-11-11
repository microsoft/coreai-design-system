// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { LinkButton, Text } from '@coreai-ds/react-components';
import { Open16Filled } from '@fluentui/react-icons';
import { siteLinks } from '../../../../shared/site-links';

const CoreAILogoCube = React.lazy(() =>
  import('./CoreAILogoCube').then((module) => ({ default: module.CoreAILogoCube })),
);

class GraphicBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function WorkInProgress({ standalone = false }: { standalone?: boolean }) {
  const headingId = React.useId();

  return (
    <section
      className={`work-in-progress${standalone ? ' work-in-progress--page' : ''}`}
      aria-labelledby={headingId}
    >
      <div className="work-in-progress__logo">
        <GraphicBoundary>
          <React.Suspense fallback={null}>
            <CoreAILogoCube monochrome />
          </React.Suspense>
        </GraphicBoundary>
      </div>
      <Text
        as={standalone ? 'h1' : 'h2'}
        id={headingId}
        size={600}
        weight="semibold"
        foreground={1}
      >
        Page under construction
      </Text>
      <Text as="p" size={300} foreground={3}>
        We're still working on this page.
      </Text>
      <LinkButton
        href={siteLinks.feedback}
        appearance="outline"
        shape="circular"
        external
        icon={<Open16Filled aria-hidden="true" />}
      >
        Share a suggestion
        <span className="sr-only"> (opens in a new tab)</span>
      </LinkButton>
    </section>
  );
}
