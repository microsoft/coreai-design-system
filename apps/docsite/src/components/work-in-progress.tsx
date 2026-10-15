// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { LinkButton, Text } from '@coreai-ds/react-components';
import { Open16Filled } from '@fluentui/react-icons';
import { siteLinks } from '../data/content';
import { CoreAILogo } from './Icons';

const CoreAILogoCube = React.lazy(() =>
  import('./CoreAILogoCube').then((module) => ({ default: module.CoreAILogoCube })),
);

export function WorkInProgress({ standalone = false }: { standalone?: boolean }) {
  const headingId = React.useId();

  return (
    <section
      className={`work-in-progress${standalone ? ' work-in-progress--page' : ''}`}
      aria-labelledby={headingId}
    >
      <div className="work-in-progress__logo">
        <CoreAILogo className="work-in-progress__fallback" aria-hidden="true" />
        <React.Suspense fallback={null}>
          <CoreAILogoCube monochrome />
        </React.Suspense>
      </div>
      <Text as={standalone ? 'h1' : 'h2'} id={headingId} size={600} weight="semibold">
        Page under construction
      </Text>
      <Text as="p" size={300} foreground={2}>
        We're still working on this page.
      </Text>
      <LinkButton
        href={siteLinks.feedback}
        appearance="secondary"
        external
        icon={<Open16Filled aria-hidden="true" />}
      >
        Share a suggestion
        <span className="sr-only"> (opens in a new tab)</span>
      </LinkButton>
    </section>
  );
}
