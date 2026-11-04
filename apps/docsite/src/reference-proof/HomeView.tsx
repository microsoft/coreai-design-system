// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Button, LinkButton, Text } from '@coreai-ds/react-components';
import { Copy20Regular } from '@fluentui/react-icons';
import type { PageWidgetProps } from './FoundationViews';

const Logo = React.lazy(() =>
  import('../components/CoreAILogoCube').then((module) => ({ default: module.CoreAILogoCube })),
);

class GraphicBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.error('The optional 3D homepage graphic could not render.', error);
  }
  render() {
    return this.state.failed ? (
      <span className="sr-only">The 3D graphic is unavailable.</span>
    ) : (
      this.props.children
    );
  }
}

export default function HomeView({ model, sourceHtml }: PageWidgetProps) {
  const prompt = React.useMemo(
    () =>
      new DOMParser().parseFromString(sourceHtml, 'text/html').querySelector('[data-agent-prompt]')
        ?.textContent,
    [sourceHtml],
  );
  if (!prompt) throw new Error('Missing canonical agent starter prompt.');
  const base = new URL('.', new URL(model.markdownUrl, window.location.href));
  return (
    <div className="home-landing">
      <div className="home-foreground">
        <header className="home-heading">
          <div className="page-header__title-row">
            <Text as="h1" id={model.headingId} size={900} weight="regular" foreground={1}>
              {model.title}
            </Text>
          </div>
          <Text as="p" size={400} foreground={3}>
            <span dangerouslySetInnerHTML={{ __html: model.summaryHtml }} />
          </Text>
        </header>
        <div className="home-agent-content">
          <section className="home-agent-entry" aria-label="Agent resources">
            <Button
              appearance="primary"
              icon={<Copy20Regular aria-hidden="true" />}
              data-copy={prompt}
              data-copy-label="starter prompt"
            >
              Copy starter prompt
            </Button>
            <LinkButton
              appearance="outline"
              href={new URL('overview/introduction/#guidance-working-with-agents', base).href}
              role="link"
            >
              Learn more
            </LinkButton>
          </section>
          {/* <Accordion className="home-agent-preview" collapsible>
            <AccordionItem value="starter-prompt">
              <AccordionHeader expandIconPosition="end">Preview the prompt</AccordionHeader>
              <AccordionPanel>
                <CodeBlock code={prompt} language="text" />
              </AccordionPanel>
            </AccordionItem>
          </Accordion> */}
        </div>
      </div>
      <div className="home-visual">
        <GraphicBoundary>
          <React.Suspense fallback={null}>
            <Logo />
          </React.Suspense>
        </GraphicBoundary>
      </div>
    </div>
  );
}
