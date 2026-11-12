// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Markdown as LegacyMarkdown } from '@coreai-ds/react-components';
import type { Root as HastRoot } from 'hast';
import type { Root as MarkdownRoot } from 'mdast';
import type { Plugin } from 'unified';
import {
  Markdown,
  type MarkdownProps,
} from '../../../../../packages/react-headless-components/src/Markdown.js';
import type { CoreAIFluentProviderProps } from '../../../../../packages/react-headless-components/src/CoreAIFluentProvider.js';
import { useFluentThemeMode } from '../../../../../packages/react-headless-components/src/FluentThemeModeContext.js';
import {
  coreaiDarkTheme,
  coreaiLightTheme,
} from '../../../../../packages/react-headless-components/src/theme.js';
import { ComparisonProvider } from './ComparisonProvider.js';
import styles from './MarkdownComparison.module.css';

export interface MarkdownExample {
  name: string;
  props: MarkdownProps;
}

export const markdownTypographySource = [
  '# Release **guide**',
  'A paragraph with **strong**, *emphasis*, ~~removed text~~, and `inline code`.',
  '## Details & `API`',
  '[External guide](https://example.com) and [Jump to details](#details-api).',
  '### Third level\n\n#### Fourth level\n\n##### Fifth level\n\n###### Sixth level',
  '> A quote with *emphasis* and `inline code`.',
  '- First item\n  - Nested item\n- Second item',
  '1. First step\n   1. Nested step\n2. Second step',
  '---',
  'Last paragraph.',
].join('\n\n');

export const markdownGfmSource = [
  '## Native table and tasks',
  '| Name | State | Count |\n| :--- | :---: | ---: |\n| CoreAI | Ready | 3 |\n| Docs | Draft | 12 |',
  '- [x] Tested\n- [ ] Reviewed',
  'A footnote reference.[^note]',
  '[^note]: A note with **emphasis** and `code`.',
].join('\n\n');

export const markdownCodeSource = [
  '## Code examples',
  '```javascript\n// A safe source string\nconst message = "Ready";\nconsole.log(message);\n```',
  '```diff\n- Removed line\n+ Added line\n```',
  '```\n<plain-text>Not HTML</plain-text>\n```',
].join('\n\n');

const appendRemarkNote: Plugin<[], MarkdownRoot> = () => (tree) => {
  tree.children.push({
    type: 'paragraph',
    children: [{ type: 'text', value: 'Remark extension content.' }],
  });
};

const appendRehypeNote: Plugin<[], HastRoot> = () => (tree) => {
  tree.children.push({
    type: 'element',
    tagName: 'p',
    properties: { dataPlugin: 'rehype' },
    children: [{ type: 'text', value: 'Rehype extension content.' }],
  });
};

export const markdownExtendedExample: MarkdownExample = {
  name: 'Plugins and renderer extensions',
  props: {
    content:
      '## Consumer heading\n\n[Consumer link](#consumer)\n\n```js\nconst extended = true;\n```',
    remarkPlugins: [appendRemarkNote],
    rehypePlugins: [appendRehypeNote],
    components: {
      h2: ({ children }) => <h2 className={styles.extensionHeading}>Extended {children}</h2>,
      a: ({ children, href }) => (
        <a href={href} data-renderer="consumer-link" className={styles.extensionLink}>
          {children}
        </a>
      ),
    },
  },
};

export const markdownExamples: readonly MarkdownExample[] = [
  { name: 'Typography and native links', props: { content: markdownTypographySource } },
  { name: 'GFM table tasks and footnotes', props: { content: markdownGfmSource } },
  { name: 'CodeBlock composition', props: { content: markdownCodeSource } },
  {
    name: 'Wide native table',
    props: {
      content: [
        '| Description | Status |',
        '| --- | --- |',
        `| ${'A_long_unbroken_description_'.repeat(10)} | Ready |`,
      ].join('\n'),
    },
  },
  markdownExtendedExample,
  {
    name: 'Safe HTML omission option',
    props: {
      content: '## Safe content\n\n<div>Omitted raw HTML</div>\n\nKept text.',
      skipHtml: true,
    },
  },
  { name: 'Math stays plain by default', props: { content: 'Inline $x^2$ and $$y = x + 1$$.' } },
];

export const markdownConsumerExample: MarkdownExample = {
  name: 'Consumer CSS priority',
  props: {
    content:
      '## Consumer heading\n\nConsumer paragraph with `code`.\n\n| Name | State |\n| --- | --- |\n| CoreAI | Ready |',
    className: styles.consumerRoot,
  },
};

export function MarkdownComparison({
  examples = markdownExamples,
  theme,
  dir = 'ltr',
}: {
  examples?: readonly MarkdownExample[];
  theme?: CoreAIFluentProviderProps['theme'];
  dir?: 'ltr' | 'rtl';
}): React.ReactElement {
  const mode = useFluentThemeMode();
  const resolvedTheme = theme ?? (mode === 'dark' ? coreaiDarkTheme : coreaiLightTheme);
  return (
    <ComparisonProvider theme={resolvedTheme} dir={dir}>
      <div className={styles.examples}>
        <div className={styles.parking} data-testid="markdown-pointer-parking" aria-hidden />
        <div className={styles.row}>
          <strong>Case</strong>
          <strong>Current CoreAI / Griffel</strong>
          <strong>CoreAI / CSS Modules</strong>
        </div>
        {examples.map(({ name, props }) => (
          <div className={styles.row} data-markdown-case={name} key={name}>
            <span>{name}</span>
            <div className={styles.cell} data-markdown-implementation="legacy">
              <LegacyMarkdown {...props} />
            </div>
            <div className={styles.cell} data-markdown-implementation="headless">
              <Markdown {...props} />
            </div>
          </div>
        ))}
      </div>
    </ComparisonProvider>
  );
}

export const markdownFlowSource = [
  '# Release guide',
  '[Jump to release details](#release-details) and [External guide](https://example.com).',
  '## Release details',
  '```js\nconst version = "1.0";\n```',
  '| State | Owner |\n| --- | --- |\n| Ready | CoreAI |',
].join('\n\n');

export function MarkdownFlow(): React.ReactElement {
  const [content, setContent] = React.useState(markdownFlowSource);
  const [lastLink, setLastLink] = React.useState('No link activated');
  const [submission, setSubmission] = React.useState('No submission');
  return (
    <form
      className={styles.flow}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSubmission(String(data.get('document')));
      }}
      onClick={(event) => {
        const anchor = event.target instanceof Element ? event.target.closest('a') : null;
        if (anchor) {
          setLastLink(anchor.getAttribute('href') ?? 'No destination');
          if (anchor.target === '_blank') event.preventDefault();
        }
      }}
    >
      <label>
        Markdown source
        <textarea
          name="document"
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
      </label>
      <Markdown content={content} />
      <button type="submit">Save Markdown</button>
      <button type="button" onClick={() => setContent('## Updated content\n\nA new document.')}>
        Load new document
      </button>
      <output aria-label="Markdown link result">{lastLink}</output>
      <output aria-label="Markdown form result">{submission}</output>
    </form>
  );
}
