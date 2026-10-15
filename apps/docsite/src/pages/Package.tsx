// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Button,
  CodeBlock,
  CopyButton,
  Link,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  Text,
} from '@coreai-ds/react-components';
import { PageLayout } from '../components/PageLayout';
import { siteLinks } from '../data/content';

const installPackages = `npm install @coreai-ds/react-components
npm install @fluentui/react-components @fluentui/react-icons # peer dependencies as needed`;

const usageExample = `import {
  CoreAIFluentProvider,
  coreaiLightTheme,
} from '@coreai-ds/react-components';

<CoreAIFluentProvider theme={coreaiLightTheme}>
  <App />
</CoreAIFluentProvider>`;

const packageSetupPrompt = `Read the @coreai-ds/react-components package README, then set up this project to use the package:

${siteLinks.packageReadme}

Follow the README's instructions for npm installation, optional Aptos setup and licensing, and CoreAIFluentProvider configuration. Make the required project changes directly and verify the result.`;

export function Package() {
  return (
    <PageLayout
      id="package"
      actions={
        <Button
          as="a"
          href={siteLinks.packageReadme}
          target="_blank"
          rel="noopener"
          appearance="outline"
        >
          View package README
        </Button>
      }
    >
      <div className="package-guide">
        <section className="page-section package-section package-section--setup">
          <MessageBar intent="brand" layout="multiline" icon={null}>
            <MessageBarBody>
              <MessageBarTitle>Let your agent handle setup.</MessageBarTitle>
              Pass the{' '}
              <Link href={siteLinks.packageReadme} target="_blank" rel="noopener" external>
                package README
              </Link>{' '}
              to your agent for current installation and configuration guidance.
            </MessageBarBody>
            <MessageBarActions
              containerAction={
                <CopyButton
                  aria-label="Copy package setup prompt"
                  contentToCopy={packageSetupPrompt}
                />
              }
            />
          </MessageBar>

          <div className="package-install">
            <div className="package-step">
              <span className="package-step__number">1</span>
              <div className="package-step__content">
                <Text as="h3" weight="semibold">
                  Install from npm
                </Text>
                <Text as="p" size={300} foreground={2}>
                  Run these commands in your project. If your project uses a custom default
                  registry, follow the package README to route the <code>@coreai-ds</code> scope to
                  npm.
                </Text>
                <CodeBlock code={installPackages} language="bash" />
              </div>
            </div>

            <div className="package-step">
              <span className="package-step__number">2</span>
              <div className="package-step__content">
                <Text as="h3" weight="semibold">
                  Set up Aptos (recommended)
                </Text>
                <Text as="p" size={300} foreground={2}>
                  Aptos is the preferred typeface, but font files are not included in the repository
                  or npm package. Follow the{' '}
                  <Link href={siteLinks.packageReadme} target="_blank" rel="noopener" external>
                    package README
                  </Link>{' '}
                  for opt-in setup from Microsoft&apos;s official download and review the license
                  for your intended use.
                </Text>
                <Text as="p" size={300} foreground={2}>
                  Without Aptos, proportional text falls back to Inter and then system fonts. Do not
                  commit downloaded fonts. Only Microsoft-hosted projects may host Aptos;
                  non-Microsoft projects must use Inter instead.
                </Text>
              </div>
            </div>

            <div className="package-step">
              <span className="package-step__number">3</span>
              <div className="package-step__content">
                <Text as="h3" weight="semibold">
                  Add it to your app
                </Text>
                <Text as="p" size={300} foreground={2}>
                  Wrap the app with the CoreAI provider. To recognize Aptos fonts already installed
                  on the device, you can optionally load{' '}
                  <code>@coreai-ds/react-components/fonts/fonts.css</code> once. The stylesheet does
                  not include font binaries.
                </Text>
                <CodeBlock code={usageExample} language="tsx" />
              </div>
            </div>
          </div>
        </section>

        <Text as="p" size={300} foreground={2}>
          Need CI setup, custom themes, CSS overrides, or agent configuration?{' '}
          <Link href={siteLinks.packageReadme} target="_blank" rel="noopener" external>
            Read the full package README
          </Link>
          .
        </Text>
      </div>
    </PageLayout>
  );
}
