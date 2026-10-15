// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Button,
  CodeBlock,
  Markdown,
  Tab,
  TabList,
  Text,
  type SelectTabData,
  type SelectTabEvent,
} from '@coreai-ds/react-components';
import { ArrowDownload20Regular } from '@fluentui/react-icons';
import { PageLayout } from '../components/PageLayout';
import agentSkill from '../../../../packages/react-components/agent/SKILL.md?raw';

function stripFrontmatter(source: string) {
  const match = source.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  return match ? source.slice(match[0].length).trimStart() : source;
}

function downloadAgentSkill() {
  try {
    const url = URL.createObjectURL(
      new Blob([agentSkill], { type: 'text/markdown;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'SKILL.md';
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download agent skill.', error);
  }
}

export function CoreAISkill() {
  const [view, setView] = React.useState<'markdown' | 'text'>('markdown');

  const onViewSelect = (_event: SelectTabEvent, data: SelectTabData) => {
    setView(data.value as 'markdown' | 'text');
  };

  return (
    <PageLayout id="coreai-skill">
      <div className="coreai-skill-view">
        <div className="coreai-skill-intro">
          <Text as="h2" preset="heading4">
            Install the skill
          </Text>
          <Text as="p" foreground={2}>
            Download <code>SKILL.md</code>, then add it to the consuming repository at{' '}
            <code>.github/skills/coreai-ds-fluentui-react/SKILL.md</code>. Coding agents that
            support workspace skills load it automatically; for other clients, use the equivalent
            skills directory.
          </Text>
        </div>

        <div className="coreai-skill-toolbar">
          <TabList appearance="elevated" selectedValue={view} onTabSelect={onViewSelect}>
            <Tab value="markdown">Markdown</Tab>
            <Tab value="text">Text</Tab>
          </TabList>
          <Button
            appearance="outline"
            icon={<ArrowDownload20Regular />}
            onClick={downloadAgentSkill}
          >
            Download
          </Button>
        </div>

        {view === 'markdown' ? (
          <CodeBlock
            className="coreai-skill-code"
            code={agentSkill}
            language="markdown"
            header={
              <Text preset="heading6" foreground={3}>
                .github/skills/coreai-ds-fluentui-react/SKILL.md
              </Text>
            }
            headerAppearance="subtle"
          />
        ) : (
          <Markdown content={stripFrontmatter(agentSkill)} />
        )}
      </div>
    </PageLayout>
  );
}
