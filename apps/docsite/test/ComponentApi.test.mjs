// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import {
  createComponentApiReader,
  componentApiMarkdown,
  componentApiSource,
} from '../scripts/sources/ComponentApi.mjs';
import { componentBindings } from '../scripts/sources/ComponentBindings.mjs';
import { readSourceCatalog } from '../scripts/sources/Catalog.mjs';
import { readReferencePages } from '../scripts/ReadReferencePages.mjs';
import { appRoot, pageMarkdown, componentPageGuidanceHtml } from '../scripts/BuildDocsite.mjs';

test('docgen reads CoreAI defaults, inherited props, required slots and component sets', async () => {
  const reader = createComponentApiReader();
  const catalog = await readSourceCatalog();
  const api = reader.readComponent(
    catalog.components.find((component) => component.id === 'components-accordion'),
  );
  assert.deepEqual(
    api.map((member) => member.name),
    ['Accordion', 'AccordionHeader', 'AccordionItem', 'AccordionPanel'],
  );
  assert.equal(
    reader.read('AccordionItem').props.find((prop) => prop.name === 'value').required,
    true,
  );
  const shape = reader.read('Button').props.find((prop) => prop.name === 'shape');
  assert.equal(shape.defaultValue, "'circular'");
  assert.match(shape.type, /rounded.*square|square.*rounded/);
  assert.match(shape.description, /rounded, circular, or square/);
  const size = reader.read('Button').props.find((prop) => prop.name === 'size').type;
  for (const value of ['"small"', '"medium"', '"large"']) assert.ok(size.includes(value));
  assert.equal(
    reader.read('Input').props.find((prop) => prop.name === 'appearance').defaultValue,
    "'outline'",
  );
  const provider = reader.read('PopoverProvider');
  assert.equal(provider.props.find((prop) => prop.name === 'value').required, true);
  assert.equal(provider.props.find((prop) => prop.name === 'value').type, 'PopoverContextValue');
  assert.ok(reader.read('Text').props.some((prop) => prop.name === 'preset'));
  assert.ok(reader.read('Dropdown').props.some((prop) => prop.name === 'label'));
  assert.ok(
    !reader
      .read('Button')
      .props.some((prop) => prop.name === 'aria-label' || prop.name === 'onMouseMove'),
  );
  assert.throws(() => reader.read('MissingComponent'), /Unknown CoreAI API export/);
  assert.doesNotMatch(JSON.stringify(api), /import\(["'][A-Z]:|[/\\]node_modules[/\\]/);
  assert.equal(reader.read('toMountNodeProps').kind, 'function');
  assert.ok(reader.read('toMountNodeProps').signatures.length > 0);
  const pages = await readReferencePages(path.join(appRoot, 'content'));
  for (const page of pages.filter((page) => page.kind === 'components' && page.component)) {
    for (const member of reader.readComponent(
      catalog.components.find((component) => component.id === page.component),
      page.api,
    )) {
      const source = componentApiSource(member);
      const ast = ts.createSourceFile(
        'api.ts',
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
      );
      assert.deepEqual(
        ast.parseDiagnostics.map((diagnostic) =>
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        ),
        [],
        `${member.name}: valid TypeScript summary`,
      );
    }
  }
});

test('docgen keeps JSDoc, defaults, union props and required flags without copying generic caches', async () => {
  await fs.mkdir(path.join(appRoot, '.cache'), { recursive: true });
  const directory = await fs.mkdtemp(path.join(appRoot, '.cache', 'api-test-'));
  try {
    const entry = path.join(directory, 'components.tsx');
    await fs.writeFile(
      entry,
      `
import * as React from 'react';
export type ExampleProps = {
  /** A required title. */
  title: string;
  /** Number of results.
   * @default 0
   */
  count?: number;
  /** @deprecated Use title instead. */
  legacy?: string;
} & ({ variant: 'link'; href: string } | { variant: 'button'; onPress: () => void });
export function Example(_props: ExampleProps) { return null; }
export const StringProvider = React.createContext('').Provider;
export const NumberProvider = React.createContext(0).Provider;
`,
    );
    const reader = createComponentApiReader({ entry });
    const api = reader.read('Example');
    assert.equal(api.props.find((prop) => prop.name === 'title').required, true);
    assert.equal(api.props.find((prop) => prop.name === 'count').defaultValue, '0');
    assert.match(api.props.find((prop) => prop.name === 'legacy').deprecated, /Use title/);
    assert.ok(api.props.some((prop) => prop.name === 'href'));
    assert.ok(api.props.some((prop) => prop.name === 'onPress'));
    assert.equal(api.props.find((prop) => prop.name === 'href').conditional, true);
    assert.equal(api.props.find((prop) => prop.name === 'href').required, false);
    assert.equal(api.props.find((prop) => prop.name === 'onPress').conditional, true);
    assert.equal(
      reader.read('StringProvider').props.find((prop) => prop.name === 'value').type,
      'string',
    );
    assert.equal(
      reader.read('NumberProvider').props.find((prop) => prop.name === 'value').type,
      'number',
    );
    assert.match(componentApiMarkdown([api]), /@deprecated Use title/);
    const summary = componentApiSource(api);
    assert.match(summary, /title: string;/);
    assert.match(summary, /count\?: number;/);
    assert.match(summary, /@default 0/);
    assert.match(summary, /@remarks Required in some prop variants/);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('component bindings share local-over-Fluent member ownership with Storybook', () => {
  const imports = [
    {
      specifier: '@coreai-ds/react-components',
      source:
        "import { Accordion as Root, AccordionHeader as Header, AccordionPanel as Panel } from '@coreai-ds/react-components';",
    },
  ];
  const bindings = componentBindings({
    id: 'accordion',
    sources: [
      {
        sourceFile: 'upstream',
        metadata: { component: 'Root', subcomponents: '{ Header, Panel }' },
        imports,
      },
      {
        sourceFile: 'local',
        metadata: { component: 'Root', subcomponents: '{ Header }' },
        imports,
      },
    ],
  });
  assert.deepEqual(bindings.componentNames, ['Accordion', 'AccordionHeader']);
  assert.match(bindings.imports[0], /Accordion as Root/);
});

test('Default precedes separate APIs and guidance without duplicating the example source', () => {
  const basic = {
    id: 'button--default',
    name: 'Default',
    origin: 'local',
    description: 'Basic button.',
    sourcePath: 'source/default.tsx',
    source: 'export default () => <button>Basic</button>;',
  };
  const extra = {
    ...basic,
    id: 'button--other',
    name: 'Other',
    source: 'export default () => <button>Other</button>;',
  };
  const api = [
    {
      name: 'Button',
      kind: 'component',
      propsType: 'ButtonProps',
      props: [
        {
          name: 'shape',
          type: '"circular" | "square"',
          required: false,
          defaultValue: "'circular'",
          description: 'Shape.',
        },
      ],
    },
  ];
  const page = {
    title: 'Button',
    route: 'components/Button',
    guidance: '# Button\n\nA basic button.\n\n## Best practices\n\nUse buttons for actions.',
    examples: [basic, extra],
    defaultExampleId: basic.id,
    api,
    resources: [],
    templateSources: [],
  };
  const metadata = {
    basePath: '/repo/',
    versions: { '@coreai-ds/react-components': '1', '@fluentui/react-components': '2' },
    pages: [page],
  };
  const markdown = pageMarkdown(page, metadata);
  assert.ok(markdown.indexOf('## Default') < markdown.indexOf('## API'));
  assert.ok(markdown.indexOf('## API') < markdown.indexOf('## Best practices'));
  assert.ok(markdown.indexOf('## Best practices') < markdown.indexOf('## Other'));
  assert.equal(markdown.split(basic.source).length, 2);
  assert.match(markdown, /interface ButtonProps \{/);
  assert.match(markdown, /shape\?: "circular" \| "square";/);
  assert.doesNotMatch(markdown, /\| Name \| Type \|/);
  const html = componentPageGuidanceHtml(page, metadata);
  assert.ok(html.indexOf('data-page-header') < html.indexOf('data-basic-example'));
  assert.ok(html.indexOf('data-basic-example') < html.indexOf('Best practices'));
  assert.ok(html.indexOf('Best practices') < html.indexOf('class="reference-api"'));
  assert.match(html, /<details><summary><strong>API reference<\/strong>/);
  assert.match(html, /<details class="reference-basic-source"><summary>View example source/);
  assert.equal((html.match(/data-example-id="button--default"/g) ?? []).length, 1);
});

test('API summaries quote property names and protect JSDoc and Markdown fences', () => {
  const api = {
    name: 'Example',
    kind: 'component',
    props: [
      {
        name: 'data-label',
        type: 'string',
        required: false,
        description: 'Preserve */ and ``` in documentation.',
        defaultValue: '""',
      },
    ],
  };
  const source = componentApiSource(api);
  assert.match(source, /"data-label"\?: string;/);
  assert.match(source, /Preserve \* \/ and ```/);
  assert.match(componentApiMarkdown([api]), /````ts/);
  assert.equal(
    ts.createSourceFile('api.ts', source, ts.ScriptTarget.Latest, true).parseDiagnostics.length,
    0,
  );
});
