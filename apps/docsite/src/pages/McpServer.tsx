// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { CodeBlock, CopyButton, Link } from '@coreai-ds/react-components';
import {
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
} from '@coreai-ds/react-components';
import { Tab, TabList, type SelectTabData, type SelectTabEvent } from '@coreai-ds/react-components';
import { Text } from '@coreai-ds/react-components';
import { PageLayout } from '../components/PageLayout';
import { siteLinks } from '../data/content';

const vscodeConfig = `{
  "servers": {
    // CoreAI Design System MCP
    "coreai-ds-docs": {
      "type": "http",
      "url": "${siteLinks.mcp}"
    }
  },
  "inputs": []
}`;

const serverDetails = `Name: coreai-ds-docs
Type: http
URL: ${siteLinks.mcp}
Authentication: none

Headers: none`;

const copilotAppServerDetails = `Add Server
Name: coreai-ds-docs
Type: HTTP
URL: ${siteLinks.mcp}`;

const clients = {
  vscode: {
    label: 'VS Code',
    location: '.vscode/mcp.json',
    stepTitle: 'Open .vscode/mcp.json',
    setup:
      'Create or update the workspace MCP configuration. This keeps the server available to everyone using the repository.',
    config: vscodeConfig,
    language: 'json',
    verify:
      'Start the configured server in VS Code, then open an agent session and confirm that docs-list, docs-show, and docs-show-story are available.',
  },
  copilot: {
    label: 'Copilot CLI',
    location: 'Copilot CLI /mcp add flow',
    stepTitle: 'Run /mcp add',
    setup:
      'Enter /mcp add inside Copilot CLI, choose the HTTP server type, then provide the connection details below.',
    config: serverDetails,
    language: 'text',
    verify: 'Run /mcp show to confirm the server is connected, then start an agent session.',
  },
  copilotApp: {
    label: 'Copilot App',
    location: 'Customize > Add > MCP Server',
    stepTitle: 'Open the MCP Server form',
    setup:
      'In the left sidebar, open Customize. In the top-right corner, select Add, then choose MCP Server from the dropdown.',
    config: copilotAppServerDetails,
    language: 'text',
    verify:
      'Select Add Server, then start an agent session and confirm that the documentation tools are available.',
  },
} as const;

type ClientId = keyof typeof clients;

export function McpServer() {
  const [clientId, setClientId] = React.useState<ClientId>('vscode');
  const client = clients[clientId];
  const setupPrompt = `Set up the CoreAI documentation MCP server in ${client.label}.

This server returns read-only documentation, including selected Fluent stories and CoreAI overrides. It does not access project files or execute code. Review its scope, safety, and data-handling notice before connecting:
${siteLinks.storybookDocs.mcpSetup}

Use this location or setup surface: ${client.location}

${client.setup}

Show the proposed configuration and its destination, then ask for confirmation before changing it.

Configuration:
${client.config}

Do not add headers, API keys, or bearer tokens. ${client.verify}`;

  const onClientSelect = (_event: SelectTabEvent, data: SelectTabData) => {
    setClientId(data.value as ClientId);
  };

  return (
    <PageLayout id="mcp-server">
      <div className="mcp-guide">
        <section className="mcp-section">
          <Text as="p" size={300} foreground={2}>
            The CoreAI MCP returns read-only component documentation, examples, and templates. It
            combines selected Fluent stories with CoreAI stories and overrides.
          </Text>
          <Text as="p" size={300} foreground={2}>
            The server does not read your project or execute returned code. Do not send secrets or
            confidential content in tool arguments. Review and test examples before using them. Read
            the{' '}
            <Link href={siteLinks.storybookDocs.mcpSetup} target="_blank" rel="noopener" external>
              MCP scope, safety, and data-handling notice
            </Link>{' '}
            before connecting.
          </Text>
          <TabList
            className="mcp-client-tabs"
            appearance="elevated"
            selectedValue={clientId}
            onTabSelect={onClientSelect}
          >
            {Object.entries(clients).map(([id, entry]) => (
              <Tab key={id} value={id}>
                {entry.label}
              </Tab>
            ))}
          </TabList>

          <MessageBar intent="brand" layout="multiline" icon={null}>
            <MessageBarBody>
              <MessageBarTitle>Let your agent handle setup.</MessageBarTitle>
              Copy a prompt tailored to the selected MCP client.
            </MessageBarBody>
            <MessageBarActions
              containerAction={
                <CopyButton
                  aria-label={`Copy ${client.label} setup prompt`}
                  contentToCopy={setupPrompt}
                />
              }
            />
          </MessageBar>

          <div className="package-install">
            <div className="package-step">
              <span className="package-step__number">1</span>
              <div className="package-step__content">
                <Text as="h3" weight="semibold">
                  {client.stepTitle}
                </Text>
                <Text as="p" size={300} foreground={2}>
                  {client.setup}
                </Text>
              </div>
            </div>

            <div className="package-step">
              <span className="package-step__number">2</span>
              <div className="package-step__content">
                <Text as="h3" weight="semibold">
                  Add the CoreAI MCP server
                </Text>
                <Text as="p" size={300} foreground={2}>
                  Add the CoreAI server using the configuration format expected by {client.label}.
                </Text>
                <CodeBlock
                  code={client.config}
                  language={client.language}
                  header={
                    clientId === 'vscode' ? (
                      <Text preset="heading6" foreground={3}>
                        .vscode/mcp.json
                      </Text>
                    ) : undefined
                  }
                  headerAppearance="subtle"
                />
              </div>
            </div>

            <div className="package-step">
              <span className="package-step__number">3</span>
              <div className="package-step__content">
                <Text as="h3" weight="semibold">
                  Start an agent session
                </Text>
                <Text as="p" size={300} foreground={2}>
                  {client.verify}
                </Text>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
