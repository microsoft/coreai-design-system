// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { CodeBlock as LegacyCodeBlock } from '@coreai-ds/react-components';
import {
  CodeBlock,
  type CodeBlockProps,
} from '../../../../../packages/react-headless-components/src/CodeBlock.js';
import type { CoreAIFluentProviderProps } from '../../../../../packages/react-headless-components/src/CoreAIFluentProvider.js';
import { useFluentThemeMode } from '../../../../../packages/react-headless-components/src/FluentThemeModeContext.js';
import {
  coreaiDarkTheme,
  coreaiLightTheme,
} from '../../../../../packages/react-headless-components/src/theme.js';
import { ComparisonProvider } from './ComparisonProvider.js';
import styles from './CodeBlockComparison.module.css';

export interface CodeBlockExample {
  name: string;
  props: CodeBlockProps;
}

export const codeBlockSource = '// CoreAI example\nconst message = "Ready";\nconsole.log(message);';
export const codeBlockLongSource = Array.from(
  { length: 40 },
  (_, index) => `const line${index} = ${index};`,
).join('\n');

export const codeBlockExamples: readonly CodeBlockExample[] = [
  { name: 'No language detection', props: { code: codeBlockSource } },
  {
    name: 'Filled with divided header and footer',
    props: {
      code: codeBlockSource,
      language: 'javascript',
      appearance: 'filled',
      header: <strong>example.js</strong>,
      footer: <span>JavaScript example</span>,
    },
  },
  {
    name: 'Alternative with subtle header and footer',
    props: {
      code: 'interface Project {\n  name: string;\n}\nconst project: Project = { name: "CoreAI" };',
      language: 'typescript',
      header: 'project.ts',
      headerAppearance: 'subtle',
      footer: 'TypeScript example',
      footerAppearance: 'subtle',
    },
  },
  {
    name: 'Outline',
    props: {
      code: '.example:hover {\n  color: #008000;\n}',
      language: 'css',
      appearance: 'outline',
      header: 'example.css',
      footer: 'Hover styles',
    },
  },
  {
    name: 'Subtle without copy',
    props: {
      code: codeBlockSource,
      language: 'js',
      appearance: 'subtle',
      hideCopybutton: true,
    },
  },
  {
    name: 'Diff palette',
    props: { code: '- Removed line\n+ Added line', language: 'diff', header: 'Changes' },
  },
  {
    name: 'Markup palette',
    props: {
      code: '<!-- Example -->\n<section class="example">Ready &amp; safe</section>',
      language: 'html',
      header: 'example.html',
    },
  },
  {
    name: 'Empty code fallback',
    props: {
      code: '',
      header: 'Waiting for code',
      fallbackContent: <span role="status">Loading code</span>,
      footer: 'No copy action until code is available',
    },
  },
  {
    name: 'Omitted code and numeric content',
    props: { header: 0, footer: 0, fallbackContent: <em>No example yet</em> },
  },
  {
    name: 'Fixed-height scrolling',
    props: {
      code: codeBlockLongSource,
      language: 'js',
      header: 'long-example.js',
      footer: 'End of example',
      style: { height: 200 },
    },
  },
  {
    name: 'Wide code',
    props: {
      code: `const description = "${'A long native scrolling line. '.repeat(12)}";`,
      language: 'js',
      header: 'Wide example',
    },
  },
  {
    name: 'Explicitly undefined appearances',
    props: {
      code: codeBlockSource,
      language: 'js',
      appearance: undefined,
      header: 'Default header',
      headerAppearance: undefined,
      footer: 'Default footer',
      footerAppearance: undefined,
      hideCopybutton: undefined,
    },
  },
];

export const codeBlockConsumerExample: CodeBlockExample = {
  name: 'Consumer CSS priority',
  props: {
    code: codeBlockSource,
    language: 'js',
    header: 'Consumer header',
    footer: 'Consumer footer',
    className: styles.consumerRoot,
    headerClassName: styles.consumerHeader,
    footerClassName: styles.consumerFooter,
  },
};

export function CodeBlockComparison({
  examples = codeBlockExamples,
  theme,
  dir = 'ltr',
}: {
  examples?: readonly CodeBlockExample[];
  theme?: CoreAIFluentProviderProps['theme'];
  dir?: 'ltr' | 'rtl';
}): React.ReactElement {
  const mode = useFluentThemeMode();
  const resolvedTheme = theme ?? (mode === 'dark' ? coreaiDarkTheme : coreaiLightTheme);
  return (
    <ComparisonProvider theme={resolvedTheme} dir={dir}>
      <div className={styles.examples}>
        <div className={styles.parking} data-testid="code-block-pointer-parking" aria-hidden />
        <div className={styles.row}>
          <strong>Case</strong>
          <strong>Current CoreAI / Griffel</strong>
          <strong>CoreAI / CSS Modules</strong>
        </div>
        {examples.map(({ name, props }) => (
          <div className={styles.row} data-code-block-case={name} key={name}>
            <span>{name}</span>
            <div className={styles.cell}>
              <LegacyCodeBlock {...props} data-code-block-implementation="legacy" />
            </div>
            <div className={styles.cell}>
              <CodeBlock {...props} data-code-block-implementation="headless" />
            </div>
          </div>
        ))}
      </div>
    </ComparisonProvider>
  );
}

export function CodeBlockFlow(): React.ReactElement {
  const [code, setCode] = React.useState(codeBlockSource);
  const [copyClicks, setCopyClicks] = React.useState(0);
  const [submission, setSubmission] = React.useState('No submission');
  const [root, setRoot] = React.useState<HTMLDivElement | null>(null);
  return (
    <form
      className={styles.flow}
      onSubmit={(event) => {
        event.preventDefault();
        const submitter =
          event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : undefined;
        const data = new FormData(event.currentTarget, submitter);
        setSubmission(`${data.get('title')} | ${data.get('source')} | ${data.get('action')}`);
      }}
    >
      <label>
        Source code
        <textarea name="source" value={code} onChange={(event) => setCode(event.target.value)} />
      </label>
      <CodeBlock
        ref={setRoot}
        role="region"
        aria-label="Editable code example"
        code={code}
        language="javascript"
        header={
          <label>
            Example title
            <input name="title" defaultValue="example.js" />
          </label>
        }
        footer={
          <>
            <button type="submit" name="action" value="save">
              Save example
            </button>
            <button type="button" onClick={() => setCode('const updated = "New content";')}>
              Load alternative
            </button>
          </>
        }
        fallbackContent={<span role="status">Enter source code</span>}
        onClick={(event) => {
          if (
            event.target instanceof Element &&
            event.target.closest('button[aria-label="Copy code"]')
          ) {
            setCopyClicks((value) => value + 1);
          }
        }}
      />
      <output aria-label="Code copy clicks">{copyClicks} copy clicks</output>
      <output aria-label="Code root ref">{root?.tagName ?? 'Not mounted'}</output>
      <output aria-label="Code form result">{submission}</output>
    </form>
  );
}
