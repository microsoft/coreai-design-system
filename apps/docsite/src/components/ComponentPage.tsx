// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Dropdown,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuItemLink,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Option,
  Text,
} from '@coreai-ds/react-components';
import { Copy20Regular, DocumentText20Regular } from '@fluentui/react-icons';
import {
  getComponentSource,
  getComponentSourceUrl,
  type ComponentContent,
  type ComponentSource,
} from '../data/component-content';
import { useThemeMode } from '../theme/ThemeProvider';
import { ExternalIcon, FigmaLogo, FluentLogo, StorybookLogo } from './Icons';
import { EmbedFrame } from './EmbedFrame';
import { PageLayout } from './PageLayout';
import { WorkInProgress } from './work-in-progress';

function SourceIcon({ source }: { source: ComponentSource }) {
  if (source.kind === 'storybook') {
    return <StorybookLogo className="component-resource-card__brand" />;
  }
  if (source.kind === 'figma') {
    return <FigmaLogo className="component-resource-card__brand" />;
  }
  if (source.kind === 'fluent') {
    return <FluentLogo className="component-resource-card__brand" />;
  }
  return <ExternalIcon className="component-resource-card__brand" />;
}

export function ComponentPage({ content, html }: { content: ComponentContent; html: string }) {
  const { mode } = useThemeMode();
  const [selectedStoryId, setSelectedStoryId] = React.useState<string>();
  const [copyStatus, setCopyStatus] = React.useState<'idle' | 'copied' | 'error'>('idle');
  const copyStatusTimer = React.useRef<number>();
  const storySelectId = React.useId();
  const previewSource = content.previewSourceId
    ? getComponentSource(content, content.previewSourceId)
    : undefined;
  const storyOptions = previewSource?.kind === 'storybook' ? previewSource.stories : undefined;
  const activeStoryId =
    previewSource?.kind === 'storybook' &&
    storyOptions?.some((story) => story.storyId === selectedStoryId)
      ? selectedStoryId
      : previewSource?.kind === 'storybook'
        ? previewSource.storyId
        : undefined;
  const storyUrl =
    previewSource?.kind === 'storybook'
      ? getComponentSourceUrl(previewSource, activeStoryId)
      : undefined;
  const embedUrl = storyUrl ? new URL(storyUrl) : undefined;
  if (embedUrl) {
    embedUrl.searchParams.set('full', '1');
    embedUrl.searchParams.set('shortcuts', 'false');
    embedUrl.searchParams.set('singleStory', 'true');
    const globals = (embedUrl.searchParams.get('globals') ?? '')
      .split(';')
      .filter((entry) => entry && !entry.startsWith('mode:'));
    globals.push(`mode:${mode}`);
    embedUrl.searchParams.set('globals', globals.join(';'));
  }
  const figmaPreviewSource = content.figmaPreviewSourceId
    ? getComponentSource(content, content.figmaPreviewSourceId)
    : undefined;
  const figmaEmbedUrl =
    figmaPreviewSource?.kind === 'figma'
      ? `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(figmaPreviewSource.url)}`
      : undefined;
  const hasStorybookResource = content.resourceSourceIds.some(
    (sourceId) => getComponentSource(content, sourceId).kind === 'storybook',
  );
  const markdownUrl = `/components/${content.id}.md`;

  React.useEffect(
    () => () => {
      if (copyStatusTimer.current) {
        window.clearTimeout(copyStatusTimer.current);
      }
    },
    [],
  );

  React.useEffect(() => {
    setSelectedStoryId(undefined);
  }, [content.id]);

  const showCopyStatus = (status: 'copied' | 'error') => {
    if (copyStatusTimer.current) {
      window.clearTimeout(copyStatusTimer.current);
    }
    setCopyStatus(status);
    copyStatusTimer.current = window.setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const copyMarkdown = async () => {
    try {
      const response = await fetch(markdownUrl);
      if (!response.ok) {
        throw new Error(`Markdown request failed with status ${response.status}`);
      }
      await navigator.clipboard.writeText(await response.text());
      showCopyStatus('copied');
    } catch (error) {
      console.error('Failed to copy component Markdown.', error);
      showCopyStatus('error');
    }
  };

  return (
    <PageLayout
      id={content.id}
      title={content.title}
      summary={content.summary.text}
      actions={
        <>
          <Menu positioning={{ autoSize: true }}>
            <MenuTrigger disableButtonEnhancement>
              <MenuButton
                appearance="subtle"
                icon={<Copy20Regular />}
                className="component-copy-menu__trigger"
              >
                {copyStatus === 'copied'
                  ? 'Copied'
                  : copyStatus === 'error'
                    ? 'Copy failed'
                    : 'Copy for LLM'}
              </MenuButton>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem icon={<Copy20Regular />} onClick={() => void copyMarkdown()}>
                  Copy page as Markdown
                </MenuItem>
                <MenuItemLink
                  href={markdownUrl}
                  target="_blank"
                  rel="noopener"
                  icon={<DocumentText20Regular />}
                >
                  View as Markdown
                </MenuItemLink>
              </MenuList>
            </MenuPopover>
          </Menu>
          <span className="sr-only" aria-live="polite">
            {copyStatus === 'copied'
              ? 'Page Markdown copied.'
              : copyStatus === 'error'
                ? 'Page Markdown could not be copied.'
                : ''}
          </span>
        </>
      }
    >
      <div className="component-guidance">
        {content.status === 'under-construction' ? <WorkInProgress /> : null}
        {embedUrl ? (
          <section className="component-demo" aria-label={`Interactive ${content.title} example`}>
            {storyOptions && storyOptions.length > 1 ? (
              <div className="component-demo__toolbar">
                <Dropdown
                  id={storySelectId}
                  aria-label="Story"
                  appearance="filled-darker"
                  size="small"
                  selectedOptions={activeStoryId ? [activeStoryId] : []}
                  value={storyOptions.find((story) => story.storyId === activeStoryId)?.label ?? ''}
                  onOptionSelect={(_event, data) => {
                    setSelectedStoryId(data.optionValue);
                  }}
                >
                  {storyOptions.map((story) => (
                    <Option key={story.storyId} value={story.storyId} text={story.label}>
                      {story.label}
                    </Option>
                  ))}
                </Dropdown>
              </div>
            ) : null}
            <EmbedFrame
              src={embedUrl.toString()}
              title={`Interactive ${content.title} example`}
              loadingLabel="Loading preview"
              allow="clipboard-write"
              signInUrl={storyUrl}
            />
          </section>
        ) : figmaEmbedUrl ? (
          <section className="component-demo" aria-label={`${content.title} Figma page`}>
            <EmbedFrame
              src={figmaEmbedUrl}
              title={`${content.title} Figma page`}
              loadingLabel="Loading Figma preview"
              className="component-embed--figma"
              allowFullScreen
            />
          </section>
        ) : null}

        {content.resourceSourceIds.length > 0 ? (
          <section
            className="component-resources-section"
            aria-labelledby={`${content.id}-resources`}
          >
            <Text as="h2" id={`${content.id}-resources`} preset="heading3">
              Resources
            </Text>
            <nav className="component-resources" aria-label={`${content.title} resources`}>
              {content.figmaPreviewSourceId && !hasStorybookResource ? (
                <span
                  className="component-resource-card component-resource-card--disabled"
                  aria-disabled="true"
                >
                  <span className="component-resource-card__icon">
                    <StorybookLogo className="component-resource-card__brand" />
                  </span>
                  <span className="component-resource-card__content">
                    <strong>Storybook</strong>
                    <span>Code work in progress</span>
                  </span>
                </span>
              ) : null}
              {content.resourceSourceIds.map((sourceId) => {
                const source = getComponentSource(content, sourceId);
                return (
                  <Link
                    key={source.id}
                    href={
                      source.id === content.previewSourceId
                        ? getComponentSourceUrl(source, activeStoryId)
                        : getComponentSourceUrl(source)
                    }
                    target="_blank"
                    rel="noopener"
                    className="component-resource-card"
                  >
                    <span className="component-resource-card__icon">
                      <SourceIcon source={source} />
                      <ExternalIcon className="component-resource-card__open" />
                    </span>
                    <strong>{source.label}</strong>
                  </Link>
                );
              })}
            </nav>
          </section>
        ) : null}

        <div className="component-markdown" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </PageLayout>
  );
}
