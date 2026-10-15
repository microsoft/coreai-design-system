// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export interface StorybookStory {
  label: string;
  storyId: string;
}

export type ComponentSource =
  | {
      id: string;
      kind: 'storybook';
      label: string;
      url: string;
      storyId: string;
      stories?: StorybookStory[];
    }
  | {
      id: string;
      kind: 'figma' | 'fluent' | 'resource';
      label: string;
      url: string;
    };

export interface ComponentSummary {
  text: string;
}

export interface ComponentNavigation {
  group: 'Components' | 'Templates' | 'Assets';
  showInSidebar: boolean;
  canonicalId?: string;
}

export type ComponentStatus = 'complete' | 'under-construction';

export interface ComponentContent {
  id: string;
  title: string;
  navigation: ComponentNavigation;
  summary: ComponentSummary;
  sources: ComponentSource[];
  previewSourceId?: string;
  figmaPreviewSourceId?: string;
  status: ComponentStatus;
  resourceSourceIds: string[];
  anchors: { id: string; label: string }[];
  searchText?: string;
  markdown?: string;
}

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

function assertString(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }
}

function assertBoolean(value: unknown, label: string): asserts value is boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${label} must be a boolean.`);
  }
}

function assertExactKeys(value: Record<string, unknown>, keys: string[], label: string): void {
  const expected = new Set(keys);
  const unexpected = Object.keys(value).filter((key) => !expected.has(key));
  if (unexpected.length > 0) {
    throw new Error(`${label} contains unsupported fields: ${unexpected.join(', ')}.`);
  }
}

function parseSource(value: unknown, label: string): ComponentSource {
  assertObject(value, label);
  assertString(value.id, `${label}.id`);
  assertString(value.kind, `${label}.kind`);
  assertString(value.label, `${label}.label`);

  if (value.kind === 'storybook') {
    assertExactKeys(value, ['id', 'kind', 'label', 'url', 'storyId', 'stories'], label);
    assertString(value.url, `${label}.url`);
    try {
      new URL(value.url);
    } catch {
      throw new Error(`${label}.url must be a valid absolute URL.`);
    }
    assertString(value.storyId, `${label}.storyId`);
    let stories: StorybookStory[] | undefined;
    if (value.stories !== undefined) {
      if (!Array.isArray(value.stories) || value.stories.length === 0) {
        throw new Error(`${label}.stories must contain at least one story.`);
      }
      stories = value.stories.map((story, index) => {
        const storyLabel = `${label}.stories[${index}]`;
        assertObject(story, storyLabel);
        assertExactKeys(story, ['label', 'storyId'], storyLabel);
        assertString(story.label, `${storyLabel}.label`);
        assertString(story.storyId, `${storyLabel}.storyId`);
        return {
          label: story.label,
          storyId: story.storyId,
        };
      });
      const storyIds = new Set(stories.map((story) => story.storyId));
      if (storyIds.size !== stories.length) {
        throw new Error(`${label}.stories contains duplicate story IDs.`);
      }
      if (!storyIds.has(value.storyId)) {
        throw new Error(`${label}.stories must include the default storyId.`);
      }
    }
    return {
      id: value.id,
      kind: value.kind,
      label: value.label,
      url: value.url,
      storyId: value.storyId,
      stories,
    };
  }

  if (value.kind !== 'figma' && value.kind !== 'fluent' && value.kind !== 'resource') {
    throw new Error(`${label}.kind must be storybook, figma, fluent, or resource.`);
  }

  assertExactKeys(value, ['id', 'kind', 'label', 'url'], label);
  assertString(value.url, `${label}.url`);
  try {
    new URL(value.url);
  } catch {
    throw new Error(`${label}.url must be a valid absolute URL.`);
  }
  return {
    id: value.id,
    kind: value.kind,
    label: value.label,
    url: value.url,
  };
}

export function parseComponentContent(value: unknown, label: string): ComponentContent {
  assertObject(value, label);
  assertExactKeys(
    value,
    [
      'id',
      'title',
      'navigation',
      'summary',
      'sources',
      'previewSourceId',
      'figmaPreviewSourceId',
      'status',
      'resourceSourceIds',
      'anchors',
      'searchText',
      'markdown',
    ],
    label,
  );
  assertString(value.id, `${label}.id`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.id)) {
    throw new Error(`${label}.id must use kebab-case.`);
  }
  assertString(value.title, `${label}.title`);
  if (
    value.status !== undefined &&
    value.status !== 'complete' &&
    value.status !== 'under-construction'
  ) {
    throw new Error(`${label}.status must be complete or under-construction.`);
  }

  let navigation: ComponentNavigation = {
    group: 'Components',
    showInSidebar: true,
  };
  if (value.navigation !== undefined) {
    assertObject(value.navigation, `${label}.navigation`);
    assertExactKeys(
      value.navigation,
      ['group', 'showInSidebar', 'canonicalId'],
      `${label}.navigation`,
    );
    assertString(value.navigation.group, `${label}.navigation.group`);
    if (
      value.navigation.group !== 'Components' &&
      value.navigation.group !== 'Templates' &&
      value.navigation.group !== 'Assets'
    ) {
      throw new Error(`${label}.navigation.group must be Components, Templates, or Assets.`);
    }
    assertBoolean(value.navigation.showInSidebar, `${label}.navigation.showInSidebar`);
    if (value.navigation.canonicalId !== undefined) {
      assertString(value.navigation.canonicalId, `${label}.navigation.canonicalId`);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.navigation.canonicalId)) {
        throw new Error(`${label}.navigation.canonicalId must use kebab-case.`);
      }
      if (value.navigation.canonicalId === value.id) {
        throw new Error(`${label}.navigation.canonicalId must reference another component.`);
      }
    }
    navigation = {
      group: value.navigation.group,
      showInSidebar: value.navigation.showInSidebar,
      canonicalId: value.navigation.canonicalId as string | undefined,
    };
  }

  assertObject(value.summary, `${label}.summary`);
  assertExactKeys(value.summary, ['text'], `${label}.summary`);
  assertString(value.summary.text, `${label}.summary.text`);

  if (!Array.isArray(value.sources)) {
    throw new Error(`${label}.sources must be an array.`);
  }
  const sources = value.sources.map((source, index) =>
    parseSource(source, `${label}.sources[${index}]`),
  );
  const sourceIds = new Set(sources.map((source) => source.id));
  if (sourceIds.size !== sources.length) {
    throw new Error(`${label}.sources contains duplicate IDs.`);
  }

  if (value.previewSourceId !== undefined) {
    assertString(value.previewSourceId, `${label}.previewSourceId`);
    const previewSource = sources.find((source) => source.id === value.previewSourceId);
    if (previewSource?.kind !== 'storybook') {
      throw new Error(`${label}.previewSourceId must reference a Storybook source.`);
    }
  }

  if (value.figmaPreviewSourceId !== undefined) {
    if (value.previewSourceId !== undefined) {
      throw new Error(`${label} cannot define both previewSourceId and figmaPreviewSourceId.`);
    }
    assertString(value.figmaPreviewSourceId, `${label}.figmaPreviewSourceId`);
    const figmaPreviewSource = sources.find((source) => source.id === value.figmaPreviewSourceId);
    if (figmaPreviewSource?.kind !== 'figma') {
      throw new Error(`${label}.figmaPreviewSourceId must reference a Figma source.`);
    }
  }

  if (!Array.isArray(value.resourceSourceIds)) {
    throw new Error(`${label}.resourceSourceIds must be an array.`);
  }
  value.resourceSourceIds.forEach((sourceId, index) => {
    assertString(sourceId, `${label}.resourceSourceIds[${index}]`);
    if (!sourceIds.has(sourceId)) {
      throw new Error(`${label}.resourceSourceIds references unknown source "${sourceId}".`);
    }
  });

  if (!Array.isArray(value.anchors)) throw new Error(`${label}.anchors must be an array.`);
  const anchors = value.anchors.map((anchor, index) => {
    assertObject(anchor, `${label}.anchors[${index}]`);
    assertString(anchor.id, `${label}.anchor.id`);
    assertString(anchor.label, `${label}.anchor.label`);
    return { id: anchor.id, label: anchor.label };
  });

  if (value.markdown !== undefined) {
    assertString(value.markdown, `${label}.markdown`);
  }
  if (value.searchText !== undefined) {
    assertString(value.searchText, `${label}.searchText`);
  }

  return {
    id: value.id,
    title: value.title,
    navigation,
    summary: {
      text: value.summary.text,
    },
    sources,
    previewSourceId: value.previewSourceId as string | undefined,
    figmaPreviewSourceId: value.figmaPreviewSourceId as string | undefined,
    status: (value.status as ComponentStatus | undefined) ?? 'complete',
    resourceSourceIds: value.resourceSourceIds as string[],
    anchors,
    searchText: value.searchText as string | undefined,
    markdown: value.markdown as string | undefined,
  };
}

export function getComponentSource(component: ComponentContent, sourceId: string): ComponentSource {
  const source = component.sources.find((entry) => entry.id === sourceId);
  if (!source) {
    throw new Error(`Component "${component.id}" references unknown source "${sourceId}".`);
  }
  return source;
}

export function getComponentSourceUrl(source: ComponentSource, storyId?: string): string {
  return source.kind === 'storybook'
    ? `${source.url}/?path=/story/${storyId ?? source.storyId}`
    : source.url;
}

export function renderComponentMarkdown(component: ComponentContent): string {
  if (!component.markdown) {
    throw new Error(`Component "${component.id}" is missing generated agent Markdown.`);
  }
  return component.markdown;
}

export function renderLlmsIndex(components: ComponentContent[]): string {
  return `# CoreAI design system

> Canonical CoreAI component guidance for agents and humans.

## Machine-readable data

- [Storybook manifest](/storybook-manifest.json): Generated preview titles, story IDs, and labels.

## Components

${components
  .map(
    (component) =>
      `- [${component.title}](/components/${component.id}.md): ${component.summary.text}`,
  )
  .join('\n')}
`;
}

export function componentToRegistryPage(component: ComponentContent) {
  return {
    id: component.id,
    slug: `/${component.id}/`,
    group: component.navigation.group,
    navLabel: component.title,
    headerLabel: component.title,
    title: component.title,
    summary: component.summary.text,
    eyebrow: component.navigation.group,
    showInSidebar: component.navigation.showInSidebar,
    showInHeader: false,
    anchors: component.anchors,
    searchText: component.searchText,
  };
}
