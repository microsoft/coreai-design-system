// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Button,
  CodeBlock,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  LinkButton,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  SplitButton,
  Text,
  useRestoreFocusTarget,
  type MenuButtonProps,
} from '@coreai-ds/react-components';
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
  const promptMenuFocusTarget = useRestoreFocusTarget();
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
            <Dialog>
              <Menu positioning="below-end">
                <MenuTrigger disableButtonEnhancement>
                  {(triggerProps: MenuButtonProps) => (
                    <SplitButton
                      appearance="primary"
                      icon={<Copy20Regular aria-hidden="true" />}
                      menuButton={{
                        ...triggerProps,
                        ...promptMenuFocusTarget,
                        'aria-label': 'Starter prompt options',
                      }}
                      primaryActionButton={{
                        'data-copy': prompt,
                        'data-copy-label': 'starter prompt',
                      }}
                    >
                      Copy starter prompt
                    </SplitButton>
                  )}
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    <DialogTrigger disableButtonEnhancement>
                      <MenuItem>Show starter prompt</MenuItem>
                    </DialogTrigger>
                  </MenuList>
                </MenuPopover>
              </Menu>
              <DialogSurface className="home-prompt-preview">
                <DialogBody>
                  <DialogTitle>Starter prompt</DialogTitle>
                  <DialogContent>
                    <CodeBlock code={prompt} language="text" />
                  </DialogContent>
                  <DialogActions>
                    <DialogTrigger disableButtonEnhancement>
                      <Button appearance="secondary">Close</Button>
                    </DialogTrigger>
                  </DialogActions>
                </DialogBody>
              </DialogSurface>
            </Dialog>
            <LinkButton
              appearance="outline"
              href={new URL('overview/introduction/#guidance-working-with-agents', base).href}
              role="link"
            >
              Learn more
            </LinkButton>
          </section>
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
