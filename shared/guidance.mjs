// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import GithubSlugger from 'github-slugger';
import { toString } from 'mdast-util-to-string';
import fs from 'node:fs/promises';
import matter from 'gray-matter';

export const guidanceDirectory = new URL('../apps/docsite/content/components/', import.meta.url);

export async function readGuidance(directory = guidanceDirectory) {
  const names = (await fs.readdir(directory)).filter((name) => name.endsWith('.md')).sort();
  if (!names.length) throw new Error('No Markdown guidance found.');
  const records = await Promise.all(
    names.map(async (name) => {
      const { data, content } = matter(await fs.readFile(new URL(name, directory), 'utf8'));
      const keys = [
        'id',
        'title',
        'summary',
        'navigation',
        'storybookTitles',
        'storybookDefaultStory',
        'figmaPageId',
        'figmaPreviewUrl',
        'preview',
        'resources',
        'reference',
      ];
      for (const key of Object.keys(data)) {
        if (!keys.includes(key)) throw new Error(`${name}: unsupported metadata "${key}".`);
      }
      if (typeof data.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.id)) {
        throw new Error(`${name}: id must be kebab-case.`);
      }
      for (const key of ['title', 'summary']) {
        if (typeof data[key] !== 'string' || !data[key].trim())
          throw new Error(`${name}: ${key} is required.`);
      }
      if (data.preview !== undefined && !['storybook', 'figma'].includes(data.preview))
        throw new Error(`${name}: invalid preview.`);
      if (
        data.storybookTitles !== undefined &&
        (!Array.isArray(data.storybookTitles) ||
          data.storybookTitles.some((title) => typeof title !== 'string' || !title.trim()) ||
          new Set(data.storybookTitles).size !== data.storybookTitles.length)
      )
        throw new Error(`${name}: invalid storybookTitles.`);
      if (data.navigation !== undefined) {
        if (
          !data.navigation ||
          typeof data.navigation !== 'object' ||
          Array.isArray(data.navigation)
        )
          throw new Error(`${name}: invalid navigation.`);
        for (const key of Object.keys(data.navigation)) {
          if (!['group', 'showInSidebar', 'canonicalId'].includes(key))
            throw new Error(`${name}: invalid navigation key ${key}.`);
        }
        if (
          data.navigation.group !== undefined &&
          !['Components', 'Templates', 'Assets'].includes(data.navigation.group)
        )
          throw new Error(`${name}: invalid group.`);
        if (
          data.navigation.showInSidebar !== undefined &&
          typeof data.navigation.showInSidebar !== 'boolean'
        )
          throw new Error(`${name}: invalid sidebar visibility.`);
      }
      if (data.figmaPageId !== undefined && !/^\d+:\d+$/.test(data.figmaPageId))
        throw new Error(`${name}: invalid figmaPageId.`);
      if (!Array.isArray(data.resources)) throw new Error(`${name}: resources must be an array.`);
      for (const resource of data.resources) {
        if (!resource.label || !['https:', 'http:'].includes(new URL(resource.url).protocol)) {
          throw new Error(`${name}: resource must have a label and HTTP(S) URL.`);
        }
      }
      return { ...data, body: content.trim() };
    }),
  );
  records.sort((first, second) => (first.id < second.id ? -1 : first.id > second.id ? 1 : 0));
  if (new Set(records.map((record) => record.id)).size !== records.length)
    throw new Error('Duplicate guidance id.');
  for (const record of records) {
    const canonicalId = record.navigation?.canonicalId;
    if (canonicalId !== undefined) {
      const visited = new Set([record.id]);
      let targetId = canonicalId;
      while (targetId !== undefined) {
        const target = records.find((candidate) => candidate.id === targetId);
        if (!target || visited.has(targetId) || record.navigation.showInSidebar !== false) {
          throw new Error(`${record.id}: invalid or cyclic canonicalId, or visible alias.`);
        }
        visited.add(targetId);
        record.navigation.canonicalId = target.id;
        targetId = target.navigation?.canonicalId;
      }
    }
  }
  return records;
}

export function guidanceMarkdown(record, resources = record.resources) {
  const links = resources.map(({ label, url }) => `- [${label}](${url})`).join('\n');
  const resourceSection = links ? `\n\n## Resources\n\n${links}` : '';
  return `# ${record.title}\n\n${record.summary}\n\n${record.body}${resourceSection}\n`;
}

function bestPracticesCards() {
  return (tree) => {
    const headingIs = (node, tag) => node.type === 'element' && node.tagName === tag;
    for (let index = 0; index < tree.children.length; index += 1) {
      const heading = tree.children[index];
      if (!headingIs(heading, 'h2') || toString(heading) !== 'Best practices') continue;
      let end = index + 1;
      while (
        end < tree.children.length &&
        !['h1', 'h2'].some((tag) => headingIs(tree.children[end], tag))
      )
        end += 1;
      const section = tree.children.slice(index + 1, end);
      const subheadings = section.flatMap((node, position) =>
        headingIs(node, 'h3') ? [position] : [],
      );
      if (subheadings.length !== 2) continue;
      const cards = subheadings.map((start, cardIndex) => {
        const label = toString(section[start]).replaceAll('\u2019', "'");
        const children = section.slice(start, subheadings[cardIndex + 1] ?? section.length);
        const hasContent = children.slice(1).some((node) => node.type === 'element');
        return { label, children, hasContent };
      });
      const dos = cards.find((card) => card.label === 'Do');
      const donts = cards.find((card) => card.label === "Don't");
      if (!dos?.hasContent || !donts?.hasContent) continue;
      const grid = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['do-dont-grid'] },
        children: [dos, donts].map((card, cardIndex) => ({
          type: 'element',
          tagName: 'div',
          properties: {
            className: [
              'do-dont-card',
              cardIndex === 0 ? 'do-dont-card--do' : 'do-dont-card--dont',
            ],
          },
          children: card.children,
        })),
      };
      const start = index + 1 + subheadings[0];
      tree.children.splice(start, end - start, grid);
    }
  };
}

function headingSections() {
  return (tree) => {
    const children = tree.children;
    tree.children = [];
    const stack = [{ depth: 0, node: tree }];
    for (const child of children) {
      if (child.type === 'text' && !child.value.trim()) continue;
      const depth =
        child.type === 'element' && /^h[2-6]$/.test(child.tagName)
          ? Number(child.tagName.slice(1))
          : undefined;
      if (depth !== undefined) {
        while (stack.at(-1).depth >= depth) stack.pop();
        const section = {
          type: 'element',
          tagName: 'section',
          properties: {
            className: ['guidance-section'],
            ariaLabelledBy: child.properties.id,
          },
          children: [child],
        };
        stack.at(-1).node.children.push(section);
        stack.push({ depth, node: section });
      } else {
        if (stack.length === 1) {
          const section = {
            type: 'element',
            tagName: 'section',
            properties: { className: ['guidance-section'] },
            children: [],
          };
          tree.children.push(section);
          stack.push({ depth: Infinity, node: section });
        }
        stack.at(-1).node.children.push(child);
      }
    }
  };
}

export function renderGuidance(markdown, { examples = {}, views = {}, sections = false } = {}) {
  const processor = unified().use(remarkParse).use(remarkGfm);
  const tree = processor.parse(markdown);
  for (let index = 0; index < tree.children.length; index++) {
    const node = tree.children[index];
    const marker = node.type === 'html' && node.value.match(/^<!-- view:([\w-]+) -->$/);
    if (!marker) continue;
    if (!Object.hasOwn(views, marker[1])) throw new Error(`Unknown page view: ${marker[1]}`);
    const end = tree.children.findIndex(
      (child, childIndex) =>
        childIndex > index &&
        child.type === 'html' &&
        child.value === `<!-- /view:${marker[1]} -->`,
    );
    if (end < 0) throw new Error(`Unclosed page view: ${marker[1]}`);
    tree.children.splice(index, end - index + 1, {
      type: 'blockquote',
      children: tree.children.slice(index + 1, end),
      data: { hName: 'div', hProperties: { dataPageWidget: marker[1] } },
    });
  }
  for (const node of tree.children) {
    if (node.type !== 'html') continue;
    const marker = node.value.match(/^<!-- live-example:([\w-]+) -->$/);
    if (!marker) continue;
    if (!Object.hasOwn(examples, marker[1]))
      throw new Error(`Missing live example for guidance: ${marker[1]}`);
    const example = examples[marker[1]];
    node.type = 'paragraph';
    node.children = [];
    node.data = {
      hName: 'div',
      hProperties: {
        className: ['preview'],
        dataExampleId: example.id,
        ariaLabel: `${example.name} preview`,
      },
      hChildren: [
        {
          type: 'element',
          tagName: 'p',
          properties: {},
          children: [
            { type: 'text', value: 'Loading interactive example. Full source is available below.' },
          ],
        },
      ],
    };
  }
  const slugger = new GithubSlugger();
  const anchors = [];
  const annotateHeading = (node) => {
    if (node.type === 'heading') {
      const label = toString(node);
      const id = slugger.slug(label);
      node.data = { hProperties: { id } };
      if (node.depth === 2) anchors.push({ id: `guidance-${id}`, label });
    }
    node.children?.forEach(annotateHeading);
  };
  tree.children.forEach(annotateHeading);
  const updateLinks = (node) => {
    if (
      ['link', 'definition'].includes(node.type) &&
      node.url.startsWith('#') &&
      node.url.length > 1 &&
      !/^#(?:guidance-|components-|templates-)/.test(node.url)
    )
      node.url = `#guidance-${node.url.slice(1)}`;
    node.children?.forEach(updateLinks);
  };
  updateLinks(tree);
  const renderer = unified()
    .use(remarkRehype)
    .use(rehypeSanitize, {
      ...defaultSchema,
      attributes: {
        ...defaultSchema.attributes,
        div: [
          ...(defaultSchema.attributes.div ?? []),
          'className',
          'dataExampleId',
          'ariaLabel',
          'dataPageWidget',
        ],
      },
      clobberPrefix: 'guidance-',
    })
    .use(bestPracticesCards);
  if (sections) renderer.use(headingSections);
  renderer.use(rehypeStringify);
  return { html: renderer.stringify(renderer.runSync(tree)), anchors };
}
