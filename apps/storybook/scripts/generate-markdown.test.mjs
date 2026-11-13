// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { resolveDocEntry } from 'storybook/internal/toolsets-docs';
import { generateMarkdown } from './generate-markdown.mjs';

const componentId = 'components-widget';
const docId = 'guide--docs';
const attachedId = 'components-widget--guide';
const localSource =
  "import { Widget } from '@coreai-ds/react-components';\n" +
  'const text = `nested ``` and ```` backticks`;\nexport const Local = () => <Widget />;\n';
const upstreamSource =
  "// Source: upstream Fluent sample\nimport { Widget } from '@fluentui/react-components';\n" +
  'export const Upstream = () => <Widget />;';
const docContent =
  'Full standalone **Markdown**.\n\n## Details\n\n' +
  '| First | Second |\n| --- | --- |\n| one | two |\n\n```tsx\nconst value = 1;\n```\n';
const attachedContent =
  'Full attached documentation.\n\n### Nested heading\n\nKeep `<literal>` text.';

function fixture() {
  const stories = Array.from({ length: 5 }, (_, i) => ({
    id: `${componentId}--example-${i}`,
    name: `Variant ${i}`,
    description:
      `Full description ${i}.\n\nSource: ${i ? 'upstream Fluent' : 'local CoreAI'}.\n\n` +
      'No shortened examples.',
    snippet: i ? upstreamSource : localSource,
  }));
  const component = {
    id: componentId,
    name: 'Widget',
    summary: 'Complete summary.',
    description: 'Complete component description.\n\nAnother paragraph.',
    import: "import { Widget } from '@coreai-ds/react-components';",
    jsDocTags: {
      deprecated: ['Use the new Widget instead.'],
      example: ['const example = `example ``` fence`;'],
    },
    reactComponentMeta: {
      description: 'Full metadata description.',
      tags: { remarks: ['Additional JSDoc remarks.'] },
      jsDocTags: { since: ['1.0'] },
      props: {
        count: {
          name: 'count',
          required: true,
          type: { name: 'number' },
          defaultValue: { value: 0 },
          description: 'Zero is valid.',
        },
        disabled: {
          name: 'disabled',
          required: false,
          type: { name: 'boolean' },
          defaultValue: { value: false },
          description: 'False is valid.',
        },
        mode: {
          name: 'mode',
          required: false,
          type: { name: 'enum', raw: 'Map<string, "a" | "b">' },
          defaultValue: { value: '`first` | second' },
          description: 'Use `mode` | options.\r\nNext <line> & more\\text.',
        },
        children: {
          name: 'children',
          required: false,
          type: { name: 'ReactNode' },
          description: 'The full children description.',
        },
      },
    },
    subcomponents: {
      WidgetItem: {
        name: 'WidgetItem',
        description: 'Complete subcomponent description.\n\nSubcomponent details.',
        summary: 'Subcomponent summary.',
        import: "import { WidgetItem } from '@coreai-ds/react-components';",
        jsDocTags: { deprecated: ['Use Item instead.'] },
        reactComponentMeta: {
          props: {
            value: {
              name: 'value',
              required: true,
              type: { raw: 'string | number', name: 'enum' },
              defaultValue: { value: 0 },
              description: 'Subcomponent value.',
            },
          },
        },
      },
    },
    docs: {
      [attachedId]: {
        id: attachedId,
        name: 'Attached guide',
        title: 'Attached title',
        content: attachedContent,
      },
    },
    stories,
  };
  return {
    index: {
      v: 5,
      entries: {
        [docId]: { id: docId, title: 'Guides/Complete guide', name: 'Docs', type: 'docs' },
        ...Object.fromEntries(
          stories.map((story, i) => [
            story.id,
            {
              id: story.id,
              title: 'Components/Widget',
              name: `Display variant ${i}`,
              type: 'story',
            },
          ]),
        ),
      },
    },
    components: { v: 0, components: { [componentId]: component } },
    docs: {
      v: 0,
      docs: { [docId]: { id: docId, name: 'Guide', title: 'Fallback guide', content: docContent } },
    },
    files: {},
  };
}

async function writeJson(root, filename, value) {
  const target = path.join(root, filename);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeFixture(root, data) {
  await writeJson(root, 'index.json', data.index);
  await writeJson(root, path.join('manifests', 'components.json'), data.components);
  await writeJson(root, path.join('manifests', 'docs.json'), data.docs);
  for (const [filename, value] of Object.entries(data.files)) {
    await writeJson(root, filename, value);
  }
}

async function withFixture(run, prepare = () => {}) {
  // Keep isolated test output in the workspace rather than a shared system temp directory.
  const root = await fs.mkdtemp(path.join(process.cwd(), '.markdown-test-'));
  try {
    const data = fixture();
    await prepare(data);
    await writeFixture(root, data);
    await run(root, data);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

function readMarkdown(root, id = componentId) {
  return fs.readFile(path.join(root, 'llms', `${id}.md`), 'utf8');
}

async function declareProps(root, props, source, owner = 'WidgetProps', filename = 'props.d.ts') {
  const target = path.join(root, filename);
  await fs.writeFile(target, source);
  const fileName = path.relative(path.dirname(root), target);
  for (const prop of Object.values(props)) {
    prop.parent = { name: owner, fileName };
    prop.declarations = [{ name: 'TypeLiteral', fileName }];
  }
  return fileName;
}

test('omits indexed stories explicitly disabled for manifests', async () => {
  await withFixture(
    async (root, data) => {
      const index = await generateMarkdown({ buildDirectory: root });
      const disabled = Object.values(data.index.entries).find(
        (entry) => entry.type === 'story' && !entry.tags.includes('manifest'),
      );
      assert.ok(index.documents.every((document) => !document.storyIds.includes(disabled.id)));
    },
    (data) => {
      const disabled = data.components.components[componentId].stories.pop();
      for (const entry of Object.values(data.index.entries)) {
        if (entry.type === 'story')
          entry.tags = entry.id === disabled.id ? ['dev', 'test'] : ['manifest'];
      }
    },
  );
});

test('exports complete component descriptions, JSDoc, imports, props and every story', async () => {
  await withFixture(async (root, data) => {
    const index = await generateMarkdown({ buildDirectory: root });
    assert.deepEqual(index, {
      version: 1,
      documents: [
        {
          id: componentId,
          title: 'Components/Widget',
          kind: 'component',
          path: `llms/${componentId}.md`,
          storyIds: data.components.components[componentId].stories.map((story) => story.id),
        },
        {
          id: docId,
          title: 'Guides/Complete guide',
          kind: 'docs',
          path: `llms/${docId}.md`,
          storyIds: [],
        },
      ],
    });
    assert.deepEqual(
      JSON.parse(await fs.readFile(path.join(root, 'llms', 'index.json'), 'utf8')),
      index,
    );
    const markdown = await readMarkdown(root);
    assert.ok(markdown.startsWith('# Components/Widget\n'));
    for (const text of [
      'Complete summary.',
      'Complete component description.\n\nAnother paragraph.',
      'Full metadata description.',
      '**@deprecated**\n\nUse the new Widget instead.',
      '**@remarks**\n\nAdditional JSDoc remarks.',
      '**@since**\n\n1.0',
      'const example = `example ``` fence`;',
      data.components.components[componentId].import,
      '## Props',
      '| Name | Type | Required | Default | Description |',
      '| count | number | Yes | 0 | Zero is valid. |',
      '| disabled | boolean | No | false | False is valid. |',
      '| children | ReactNode | No |  | The full children description. |',
      '| mode | Map&lt;string, "a" &#124; "b"&gt; | No | &#96;first&#96; &#124; second | ' +
        'Use &#96;mode&#96; &#124; options.<br>Next &lt;line&gt; &amp; more&#92;text. |',
      '## Subcomponents',
      '### WidgetItem',
      'Complete subcomponent description.\n\nSubcomponent details.',
      'Subcomponent summary.',
      "import { WidgetItem } from '@coreai-ds/react-components';",
      '**@deprecated**\n\nUse Item instead.',
      '#### Props',
      '| value | string &#124; number | Yes | 0 | Subcomponent value. |',
      '## Examples',
      localSource,
      upstreamSource,
      '`````tsx\n' + localSource + '`````',
    ]) {
      assert.ok(markdown.includes(text), `Missing complete output: ${text}`);
    }
    assert.equal((markdown.match(/^### Display variant /gm) ?? []).length, 5);
    for (const story of data.components.components[componentId].stories) {
      assert.ok(markdown.includes(`Story ID: ${story.id}`));
      assert.ok(markdown.includes(story.description));
      assert.ok(markdown.includes(story.snippet));
    }
  });
});

test('preserves full standalone Markdown and attached docs with index titles', async () => {
  await withFixture(async (root) => {
    await generateMarkdown({ buildDirectory: root });
    assert.equal(await readMarkdown(root, docId), `# Guides/Complete guide\n\n${docContent}\n`);
    const markdown = await readMarkdown(root);
    assert.ok(markdown.includes(`## Attached docs\n\n### Attached title\n\n${attachedContent}`));
  });
});

test('resolves v1 split docgen, story and attached/standalone MDX references', async () => {
  await withFixture(
    async (root) => {
      const index = await generateMarkdown({ buildDirectory: root });
      assert.equal(index.documents.length, 2);
      const markdown = await readMarkdown(root);
      assert.ok(markdown.includes('| children | ReactNode'));
      assert.ok(markdown.includes('Complete subcomponent description.'));
      assert.ok(markdown.includes(attachedContent));
      assert.ok(markdown.includes(localSource));
      assert.ok(markdown.includes(upstreamSource));
      assert.equal(index.documents[0].storyIds.length, 5);
      assert.ok((await readMarkdown(root, docId)).includes(docContent));
    },
    (data) => {
      const component = data.components.components[componentId];
      const doc = data.docs.docs[docId];
      const payload = { ...component };
      delete payload.stories;
      delete payload.docs;
      data.components = {
        v: 1,
        components: {
          [componentId]: {
            id: componentId,
            name: component.name,
            description: component.description,
            docgen: { $ref: '../services/docgen.json#/components/components-widget' },
            stories: { $ref: '../services/stories.json#/components/components-widget' },
            docs: {
              [attachedId]: {
                id: attachedId,
                name: 'Guide',
                mdx: { $ref: '../services/mdx.json#/attached~1guide~0entry' },
              },
            },
          },
        },
      };
      data.docs = {
        v: 1,
        docs: {
          [docId]: {
            id: docId,
            name: doc.name,
            mdx: { $ref: '../services/mdx.json#/guide' },
          },
        },
      };
      data.files = {
        [path.join('services', 'docgen.json')]: { components: { [componentId]: payload } },
        [path.join('services', 'stories.json')]: {
          components: {
            [componentId]: {
              import: component.import,
              stories: Object.fromEntries(component.stories.map((story) => [story.id, story])),
            },
          },
        },
        [path.join('services', 'mdx.json')]: {
          guide: doc,
          'attached/guide~entry': component.docs[attachedId],
        },
      };
    },
  );
});

for (const engine of ['reactDocgenTypescript', 'reactDocgen']) {
  test(`uses the existing ${engine} parser`, async () => {
    await withFixture(
      async (root) => {
        await generateMarkdown({ buildDirectory: root });
        const markdown = await readMarkdown(root);
        assert.ok(markdown.includes('| count | number | Yes | 0 | Zero is valid. |'));
        assert.ok(markdown.includes('| children | ReactNode'));
        if (engine === 'reactDocgen') {
          assert.ok(markdown.includes('| mode | string &#124; number |'));
        }
      },
      (data) => {
        const component = data.components.components[componentId];
        component[engine] = component.reactComponentMeta;
        delete component.reactComponentMeta;
        if (engine === 'reactDocgen') {
          component.reactDocgen.props.mode.tsType = {
            name: 'union',
            elements: [{ name: 'string' }, { name: 'number' }],
          };
        }
      },
    );
  });
}

test('falls back to manifest names/titles when corresponding index entries are absent', async () => {
  await withFixture(
    async (root) => {
      const index = await generateMarkdown({ buildDirectory: root });
      assert.equal(index.documents[0].title, 'Widget');
      assert.equal(index.documents[1].title, 'Fallback guide');
      assert.ok((await readMarkdown(root)).includes('### Variant 4'));
    },
    (data) => {
      data.index.entries = {};
    },
  );
});

test('is deterministic, preserves unchanged mtimes and deletes only tracked stale Markdown', async () => {
  await withFixture(async (root, data) => {
    const first = await generateMarkdown({ buildDirectory: root });
    const directory = path.join(root, 'llms');
    await fs.writeFile(path.join(directory, 'stale-component.md'), 'stale generated');
    await fs.writeFile(path.join(directory, 'untracked.md'), 'leave untouched');
    await fs.writeFile(path.join(root, 'outside.md'), 'leave outside untouched');
    await writeJson(root, path.join('llms', 'index.json'), {
      version: 1,
      documents: [
        ...first.documents,
        {
          id: 'stale-component',
          title: 'Old',
          kind: 'component',
          path: 'llms/stale-component.md',
          storyIds: [],
        },
        { id: '../outside', path: 'llms/../outside.md' },
        { id: 'untracked', path: 'untracked.md' },
      ],
    });
    data.components.components[componentId].stories.reverse();
    data.components.components[componentId].reactComponentMeta.props = Object.fromEntries(
      Object.entries(data.components.components[componentId].reactComponentMeta.props).reverse(),
    );
    await writeFixture(root, data);
    assert.deepEqual(await generateMarkdown({ buildDirectory: root }), first);
    await assert.rejects(fs.access(path.join(directory, 'stale-component.md')), { code: 'ENOENT' });
    assert.equal(
      await fs.readFile(path.join(directory, 'untracked.md'), 'utf8'),
      'leave untouched',
    );
    assert.equal(
      await fs.readFile(path.join(root, 'outside.md'), 'utf8'),
      'leave outside untouched',
    );
    const files = ['index.json', ...first.documents.map((doc) => `${doc.id}.md`)];
    const oldTime = new Date('2001-01-01T00:00:00.000Z');
    const before = [];
    for (const name of files) {
      const filename = path.join(directory, name);
      await fs.utimes(filename, oldTime, oldTime);
      before.push({
        content: await fs.readFile(filename, 'utf8'),
        mtime: (await fs.stat(filename)).mtimeMs,
      });
    }
    assert.deepEqual(await generateMarkdown({ buildDirectory: root }), first);
    for (const [i, name] of files.entries()) {
      const filename = path.join(directory, name);
      assert.equal(await fs.readFile(filename, 'utf8'), before[i].content);
      assert.equal((await fs.stat(filename)).mtimeMs, before[i].mtime);
    }
  });
});

test('permits only known extraction errors and emits a notice instead of fabricated props', async () => {
  await withFixture(
    async (root) => {
      const index = await generateMarkdown({ buildDirectory: root });
      assert.equal(index.documents.filter((doc) => doc.kind === 'component').length, 3);
      for (const id of ['components-portal-tomountnodeprops', 'templates-shell-and-navigation']) {
        const markdown = await readMarkdown(root, id);
        assert.ok(markdown.includes('Extraction notice: No component found.'));
        assert.ok(markdown.includes('Known extractor limitation.'));
        assert.ok(!markdown.includes('| Name | Type |'));
      }
    },
    (data) => {
      for (const id of ['components-portal-tomountnodeprops', 'templates-shell-and-navigation']) {
        data.components.components[id] = {
          id,
          name: id,
          error: { name: 'No component found', message: 'Known extractor limitation.' },
        };
      }
    },
  );
});

test('allows an explicitly docs-only indexed variant without fabricating a snippet', async () => {
  await withFixture(
    async (root) => {
      await generateMarkdown({ buildDirectory: root });
      assert.ok((await readMarkdown(root)).includes('This docs-only entry has no code snippet.'));
    },
    (data) => {
      const story = data.components.components[componentId].stories[0];
      delete story.snippet;
      data.index.entries[story.id].docsOnly = true;
    },
  );
});

test('includes template stories in the same exhaustive index coverage', async () => {
  await withFixture(
    async (root) => {
      const index = await generateMarkdown({ buildDirectory: root });
      const template = index.documents.find((doc) => doc.id === 'templates-dashboard');
      assert.equal(template.title, 'Templates/Dashboard');
      assert.deepEqual(template.storyIds, ['templates-dashboard--default']);
      assert.ok((await readMarkdown(root, template.id)).includes(localSource));
      assert.deepEqual(
        index.documents.flatMap((doc) => doc.storyIds).sort(),
        [
          ...Array.from({ length: 5 }, (_, i) => `${componentId}--example-${i}`),
          'templates-dashboard--default',
        ].sort(),
      );
    },
    (data) => {
      const id = 'templates-dashboard';
      const storyId = `${id}--default`;
      data.components.components[id] = {
        id,
        name: 'Dashboard',
        stories: [{ id: storyId, name: 'Default', snippet: localSource }],
      };
      data.index.entries[storyId] = {
        id: storyId,
        title: 'Templates/Dashboard',
        type: 'story',
        name: 'Default',
      };
    },
  );
});

test('refuses an output directory junction even when its target is inside the build', async () => {
  await withFixture(async (root) => {
    const target = path.join(root, 'not-llms');
    await fs.mkdir(target);
    await fs.symlink(target, path.join(root, 'llms'), 'junction');
    await assert.rejects(generateMarkdown({ buildDirectory: root }), /Unsafe exported directory/);
    assert.deepEqual(await fs.readdir(target), []);
  });
});

test('refuses referenced directory junctions escaping the build root', async () => {
  await withFixture(async (root, data) => {
    const build = path.join(root, 'build');
    await fs.mkdir(build);
    const payload = path.join(root, 'outside-build');
    await fs.mkdir(payload);
    await writeJson(payload, 'docgen.json', { value: { props: {} } });
    data.components.v = 1;
    data.components.components[componentId].docgen = {
      $ref: '../services/docgen.json#/value',
    };
    await writeFixture(build, data);
    await fs.symlink(payload, path.join(build, 'services'), 'junction');
    await assert.rejects(
      generateMarkdown({ buildDirectory: build }),
      /Unsafe path outside build directory/,
    );
    await assert.rejects(fs.access(path.join(build, 'llms')), { code: 'ENOENT' });
  });
});

const propDeclarationSource = `
export interface UnrelatedProps {
  /** @deprecated UNRELATED WARNING MUST NOT LEAK */
  navigation?: string;
}
export type WidgetProps = BaseProps & {
  /**
   * @deprecated Arrow navigation is deprecated.
   * This full behavioral description must survive.
   * @remarks Choose \`linear\` | \`circular\`.
   * @see OtherProps Additional reference.
   * @example
   * const mode = \`nested \\\`\\\`\\\` fence\`;
   */
  navigation?: 'linear' | 'circular';
  /**
   * Recovered main description with {@link OtherProps}.
   * Second line.
   * @since 2.0
   */
  count?: number;
};
export interface WidgetItemProps {
  /**
   * Complete recovered subcomponent description.
   * @deprecated Use another value.
   * @defaultValue 0
   */
  'value': number;
}
`;

for (const engine of ['reactComponentMeta', 'reactDocgenTypescript', 'reactDocgen']) {
  test(`recovers exact declaration property JSDoc for main and subcomponent ${engine} props`, async () => {
    await withFixture(async (root, data) => {
      const component = data.components.components[componentId];
      const navigation = {
        name: 'navigation',
        required: false,
        type: { name: 'enum', raw: '"linear" | "circular"' },
        description: '',
        defaultValue: null,
      };
      component.reactComponentMeta.props.navigation = navigation;
      component.reactComponentMeta.props.count.description = '';
      const props = { navigation, count: component.reactComponentMeta.props.count };
      await declareProps(root, props, propDeclarationSource);
      const subcomponent = component.subcomponents.WidgetItem;
      subcomponent.reactComponentMeta.props.value.description = '';
      await declareProps(
        root,
        subcomponent.reactComponentMeta.props,
        propDeclarationSource,
        'WidgetItemProps',
        'subcomponent.d.ts',
      );
      for (const item of [component, subcomponent]) {
        item[engine] = item.reactComponentMeta;
        if (engine !== 'reactComponentMeta') delete item.reactComponentMeta;
      }
      await writeFixture(root, data);
      const index = await generateMarkdown({ buildDirectory: root });
      assert.equal(index.documents[0].storyIds.length, 5);
      const markdown = await readMarkdown(root);
      const navigationRow = markdown.split('\n').find((line) => line.startsWith('| navigation |'));
      assert.ok(navigationRow.includes('**@deprecated** Arrow navigation is deprecated.'));
      assert.ok(navigationRow.includes('This full behavioral description must survive.'));
      assert.ok(
        navigationRow.includes('**@remarks** Choose &#96;linear&#96; &#124; &#96;circular&#96;.'),
      );
      assert.ok(navigationRow.includes('**@see** OtherProps Additional reference.'));
      assert.ok(navigationRow.includes('**@example**'));
      assert.ok(navigationRow.includes('nested'));
      const countRow = markdown.split('\n').find((line) => line.startsWith('| count |'));
      assert.ok(
        countRow.includes('Recovered main description with {@link OtherProps}.<br>Second line.'),
      );
      assert.ok(countRow.includes('**@since** 2.0'));
      assert.ok(countRow.startsWith('| count | number | Yes | 0 |'));
      const subRow = markdown.split('\n').find((line) => line.startsWith('| value |'));
      assert.ok(subRow.includes('Complete recovered subcomponent description.'));
      assert.ok(subRow.includes('**@deprecated** Use another value.'));
      assert.ok(subRow.includes('**@defaultValue** 0'));
      assert.ok(!markdown.includes('UNRELATED WARNING'));
      assert.ok(markdown.includes(localSource));
      assert.ok(markdown.includes(upstreamSource));
      const before = markdown;
      await generateMarkdown({ buildDirectory: root });
      assert.equal(await readMarkdown(root), before);
    });
  });
}

test('preserves and deduplicates existing property tags, including metadata-only props', async () => {
  await withFixture(async (root, data) => {
    const prop = data.components.components[componentId].reactComponentMeta.props.count;
    prop.tags = { deprecated: ['Use another value.'], since: ['1.0'] };
    prop.jsDocTags = { remarks: ['Keep existing property remarks.'] };
    await declareProps(
      root,
      { count: prop },
      `export interface WidgetProps {
        /**
         * Zero is valid.
         * @deprecated Use another value.
         * @see OtherProps The reference.
         */
        count: number;
      }`,
    );
    const disabled = data.components.components[componentId].reactComponentMeta.props.disabled;
    disabled.tags = { deprecated: 'Metadata-only warning.' };
    await writeFixture(root, data);
    await generateMarkdown({ buildDirectory: root });
    const markdown = await readMarkdown(root);
    const row = markdown.split('\n').find((line) => line.startsWith('| count |'));
    assert.equal(row.split('Use another value.').length - 1, 1);
    assert.equal(row.split('Zero is valid.').length - 1, 1);
    assert.ok(row.includes('**@since** 1.0'));
    assert.ok(row.includes('**@remarks** Keep existing property remarks.'));
    assert.ok(row.includes('**@see** OtherProps The reference.'));
    assert.ok(markdown.includes('**@deprecated** Metadata-only warning.'));
  });
});

test('matches a named declaration without parent metadata, never an anonymous TypeLiteral', async () => {
  await withFixture(async (root, data) => {
    const prop = data.components.components[componentId].reactComponentMeta.props.count;
    const fileName = await declareProps(
      root,
      { count: prop },
      `export interface WidgetProps {
        /** @deprecated Exact named declaration. */
        count: number;
      }`,
    );
    delete prop.parent;
    prop.declarations = [{ name: 'WidgetProps', fileName }];
    await writeFixture(root, data);
    await generateMarkdown({ buildDirectory: root });
    assert.ok((await readMarkdown(root)).includes('**@deprecated** Exact named declaration.'));
    prop.declarations = [{ name: 'TypeLiteral', fileName }];
    await writeFixture(root, data);
    await generateMarkdown({ buildDirectory: root });
    const markdown = await readMarkdown(root);
    assert.ok(!markdown.includes('Exact named declaration.'));
    assert.ok(markdown.includes('Current source extraction caveat: "count"'));
  });
});

test('does not search nested property types or unrelated owners for a missing property', async () => {
  await withFixture(async (root, data) => {
    const prop = data.components.components[componentId].reactComponentMeta.props.count;
    await declareProps(
      root,
      { count: prop },
      `export interface OtherProps {
        /** @deprecated WRONG unrelated owner. */
        count: number;
      }
      export interface WidgetProps {
        nested: {
          /** @deprecated WRONG nested property. */
          count: number;
        };
      }`,
    );
    await writeFixture(root, data);
    await generateMarkdown({ buildDirectory: root });
    const markdown = await readMarkdown(root);
    assert.ok(!markdown.includes('WRONG'));
    assert.ok(markdown.includes('Current source extraction caveat: "count"'));
    assert.ok(markdown.includes('Zero is valid.'));
  });
});

test('refuses ambiguous namespace owners and supports explicitly qualified owners', async () => {
  await withFixture(async (root, data) => {
    const prop = data.components.components[componentId].reactComponentMeta.props.count;
    await declareProps(
      root,
      { count: prop },
      `declare namespace First {
        interface WidgetProps {
          /** @deprecated First namespace. */
          count: number;
        }
      }
      declare namespace Second {
        interface WidgetProps {
          /** @deprecated Second namespace. */
          count: number;
        }
      }`,
    );
    await writeFixture(root, data);
    await generateMarkdown({ buildDirectory: root });
    let markdown = await readMarkdown(root);
    assert.ok(markdown.includes('"count" has ambiguous owner/property'));
    assert.ok(!markdown.includes('First namespace.'));
    assert.ok(!markdown.includes('Second namespace.'));
    prop.parent.name = 'First.WidgetProps';
    await writeFixture(root, data);
    await generateMarkdown({ buildDirectory: root });
    markdown = await readMarkdown(root);
    assert.ok(markdown.includes('**@deprecated** First namespace.'));
    assert.ok(!markdown.includes('Second namespace.'));
  });
});

for (const failure of [
  'missing',
  'anonymous-missing',
  'additional-missing',
  'unsafe',
  'extension',
  'syntax',
]) {
  test(`rejects ${failure} declaration sources before writing output`, async () => {
    await withFixture(async (root, data) => {
      const prop = data.components.components[componentId].reactComponentMeta.props.count;
      const fileName = path.relative(path.dirname(root), path.join(root, 'missing.d.ts'));
      prop.parent = { name: 'WidgetProps', fileName };
      prop.declarations = [{ name: 'TypeLiteral', fileName }];
      let expected = /Cannot read declaration.*ENOENT/;
      if (failure === 'anonymous-missing') {
        delete prop.parent;
      } else if (failure === 'additional-missing') {
        await declareProps(
          root,
          { count: prop },
          'export interface WidgetProps { count: number; }',
        );
        prop.declarations.push({ name: 'TypeLiteral', fileName });
      } else if (failure === 'unsafe') {
        prop.parent.fileName = fileURLToPath(new URL('../../../../outside.d.ts', import.meta.url));
        expected = /Unsafe prop declaration source outside repository/;
      } else if (failure === 'extension') {
        prop.parent.fileName = fileName.replace(/\.d\.ts$/, '.json');
        expected = /Unsupported prop declaration source extension/;
      } else if (failure === 'syntax') {
        await declareProps(root, { count: prop }, 'export interface WidgetProps { count: }');
        expected = /Cannot parse prop declaration source/;
      }
      await writeFixture(root, data);
      await assert.rejects(generateMarkdown({ buildDirectory: root }), expected);
      await assert.rejects(fs.access(path.join(root, 'llms')), { code: 'ENOENT' });
    });
  });
}

test('current built Accordion metadata recovers the installed navigation deprecation read-only', async (t) => {
  const build = fileURLToPath(new URL('../storybook-static/', import.meta.url));
  let payload;
  try {
    payload = JSON.parse(
      await fs.readFile(
        path.join(build, 'services', 'core', 'docgen', 'components-accordion.json'),
        'utf8',
      ),
    );
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    t.skip('Requires an existing Storybook build; does not generate one.');
    return;
  }
  await withFixture(async (root, data) => {
    const component = payload.components['components-accordion'];
    const navigation = component.reactComponentMeta.props.navigation;
    assert.equal(navigation.parent.name, 'AccordionProps');
    for (const item of [component, ...Object.values(component.subcomponents ?? {})]) {
      for (const prop of Object.values(item.reactComponentMeta?.props ?? {})) {
        for (const source of [prop.parent, ...(prop.declarations ?? [])]) {
          if (source?.fileName) {
            source.fileName = path.resolve(path.dirname(build), source.fileName);
          }
        }
      }
    }
    data.components = { v: 0, components: { [component.id]: component } };
    data.index.entries = {};
    await writeFixture(root, data);
    await generateMarkdown({ buildDirectory: root });
    const markdown = await readMarkdown(root, component.id);
    const row = markdown.split('\n').find((line) => line.startsWith('| navigation |'));
    assert.ok(
      row.includes(
        '**@deprecated** Arrow keyboard navigation is not recommended for accordions. ' +
          'Consider using Tree if arrow navigation is a hard requirement.',
      ),
    );
    assert.ok(
      row.includes(
        'Indicates if keyboard navigation is available and gives two options, linear or circular navigation.',
      ),
    );
  });
});

function codeBlocks(markdown) {
  const result = [];
  function visit(node) {
    if (node.type === 'code') result.push({ lang: node.lang, value: node.value });
    for (const child of node.children ?? []) visit(child);
  }
  visit(unified().use(remarkParse).parse(markdown));
  return result;
}

test('cleans MDX ESM, Meta and comments without changing prose, tables or fenced template source', async () => {
  await withFixture(async (root, data) => {
    const template = [
      "import { Meta, Canvas } from '@storybook/addon-docs/blocks';",
      'export const Template = () => <Canvas />;',
      '{/* A comment inside source must survive. */}',
      'const text = "```";',
    ].join('\n');
    const authored = [
      '# Authored title',
      '',
      'Keep this **authored prose** and `inline code`.',
      '',
      '| Name | Value |',
      '| --- | --- |',
      '| One | Two |',
      '',
      '````tsx',
      template,
      '````',
    ].join('\n');
    data.docs.docs[docId].content = [
      '{/* AUTO-GENERATED source note */}',
      "import { Meta } from '@storybook/addon-docs/blocks';",
      '',
      '<Meta title="Guides/Complete guide" />',
      '',
      authored,
    ].join('\n');
    await writeFixture(root, data);
    await generateMarkdown({ buildDirectory: root });
    const markdown = await readMarkdown(root, docId);
    assert.ok(markdown.includes(authored));
    assert.ok(!markdown.includes('AUTO-GENERATED'));
    assert.ok(!markdown.includes('<Meta title='));
    assert.deepEqual(codeBlocks(markdown), [{ lang: 'tsx', value: template }]);
    assert.ok(!markdown.split('````tsx')[0].includes('import { Meta }'));
  });
});

test('renders aliased static Source blocks and explicitly references unexpanded Canvas', async () => {
  await withFixture(async (root, data) => {
    const example =
      "import { Button } from '@coreai-ds/react-components';\n" +
      'export const Example = () => <Button>{`nested ``` fence`}</Button>;\n';
    data.docs.docs[docId].content = [
      "import { Meta as StoryMeta, Source as ExampleSource, Canvas as ExampleCanvas } from '@storybook/addon-docs/blocks';",
      "import * as Stories from './Stories.stories';",
      `export const source = ${JSON.stringify(example)};`,
      '',
      '<StoryMeta title="Example" />',
      '',
      '## Static source',
      '',
      '<ExampleSource code={source} language="tsx" />',
      '',
      `<ExampleSource code={${JSON.stringify('const literal = 0;')}} language="ts" />`,
      '',
      '<ExampleCanvas of={Stories.Default} />',
    ].join('\n');
    await writeFixture(root, data);
    await generateMarkdown({ buildDirectory: root });
    const markdown = await readMarkdown(root, docId);
    assert.ok(markdown.includes(example));
    assert.ok(
      codeBlocks(markdown).some(
        (block) => block.lang === 'tsx' && block.value === example.trimEnd(),
      ),
    );
    assert.ok(
      codeBlocks(markdown).some(
        (block) => block.lang === 'ts' && block.value === 'const literal = 0;',
      ),
    );
    assert.ok(
      markdown.includes(
        'Interactive Storybook example reference: ` Stories.Default ` (not expanded).',
      ),
    );
    assert.ok(!markdown.includes('<ExampleSource'));
    assert.ok(!markdown.includes('<ExampleCanvas'));
    assert.ok(!markdown.includes('<StoryMeta'));
    assert.ok(markdown.includes(`export const source = ${JSON.stringify(example)};`));
  });
});

test('preserves source-linked raw template imports without executing MDX', async () => {
  await withFixture(async (root, data) => {
    const code = `${localSource}\n// Copy this complete source verbatim.\n`;
    await fs.writeFile(path.join(root, 'template.tsx'), code);
    data.docs.docs[docId].path = path.relative(path.dirname(root), path.join(root, 'page.mdx'));
    data.docs.docs[docId].content = [
      "import { Source } from '@storybook/addon-docs/blocks';",
      "import template from './template.tsx?raw';",
      '',
      '# Template',
      '',
      '<Source code={template} language="tsx" />',
    ].join('\n');
    await writeFixture(root, data);
    await generateMarkdown({ buildDirectory: root });
    const markdown = await readMarkdown(root, docId);
    assert.ok(markdown.includes(code));
    assert.deepEqual(codeBlocks(markdown), [{ lang: 'tsx', value: code.trimEnd() }]);
    assert.ok(!markdown.includes('import template from'));
  });
});

test('converts static JSX tables and inline HTML without losing authored text', async () => {
  await withFixture(async (root, data) => {
    data.docs.docs[docId].content = [
      '## Props',
      '',
      '<table className="props">',
      '  <thead>',
      '    <tr>',
      '      <th>Name</th>',
      '      <th>Description</th>',
      '    </tr>',
      '  </thead>',
      '  <tbody>',
      '    <tr>',
      '      <td><code>theme</code></td>',
      "      <td>Use <strong>CoreAI</strong>{' '}themes | variants.</td>",
      '    </tr>',
      '  </tbody>',
      '</table>',
      '',
      '<p>Read <a href="https://example.com/guide">the full guide</a>.</p>',
    ].join('\n');
    await writeFixture(root, data);
    await generateMarkdown({ buildDirectory: root });
    const markdown = await readMarkdown(root, docId);
    assert.ok(markdown.includes('| Name | Description |'));
    assert.ok(markdown.includes('theme'));
    assert.ok(markdown.includes('CoreAI'));
    assert.ok(markdown.includes('themes &#124; variants.'));
    assert.ok(markdown.includes('[the full guide](https://example.com/guide)'));
    assert.doesNotMatch(markdown, /<\/?(?:table|thead|tbody|tr|th|td|code|p|a)\b/);
    assert.ok(!markdown.includes("{' '}"));
  });
});

test('retains unsupported dynamic MDX as fenced source and never evaluates calls', async () => {
  await withFixture(async (root, data) => {
    data.docs.docs[docId].content = [
      "import { Source } from '@storybook/addon-docs/blocks';",
      "import { InteractiveContent } from './InteractiveContent';",
      '',
      'export const source = (() => { globalThis.__markdownExecuted = true; return "unsafe"; })();',
      '',
      '<Source code={source} />',
      '',
      '<InteractiveContent>',
      '',
      'Preserve this authored prose inside the custom component.',
      '',
      '</InteractiveContent>',
      '',
      '{(() => { globalThis.__markdownExecuted = true; return "unsafe"; })()}',
    ].join('\n');
    await writeFixture(root, data);
    assert.equal(globalThis.__markdownExecuted, undefined);
    await generateMarkdown({ buildDirectory: root });
    assert.equal(globalThis.__markdownExecuted, undefined);
    const markdown = await readMarkdown(root, docId);
    assert.ok(markdown.includes('Preserve this authored prose inside the custom component.'));
    assert.ok(markdown.includes('Current static extraction caveat:'));
    assert.ok(markdown.includes('Static MDX expression (not evaluated)'));
    assert.ok(
      codeBlocks(markdown).some((block) => block.value.includes('<Source code={source} />')),
    );
    assert.ok(codeBlocks(markdown).some((block) => block.value.includes('<InteractiveContent>')));
    assert.ok(
      codeBlocks(markdown).some((block) => block.value.includes('globalThis.__markdownExecuted')),
    );
  });
});

for (const failure of [
  'missing-source-path',
  'missing-raw-source',
  'outside-source-root',
  'invalid-mdx',
]) {
  test(`rejects ${failure} during MDX cleanup rather than losing source content`, async () => {
    await withFixture(async (root, data) => {
      const doc = data.docs.docs[docId];
      doc.path = path.relative(path.dirname(root), path.join(root, 'page.mdx'));
      let raw = './missing.tsx?raw';
      let expected = /ENOENT/;
      if (failure === 'missing-source-path') {
        delete doc.path;
        expected = /Missing source path for raw MDX import/;
      } else if (failure === 'outside-source-root') {
        raw = `${'../'.repeat(20)}outside.tsx?raw`;
        expected = /Unsafe path outside build directory/;
      }
      doc.content = [
        "import { Source } from '@storybook/addon-docs/blocks';",
        `import source from ${JSON.stringify(raw)};`,
        '',
        '<Source code={source} />',
      ].join('\n');
      if (failure === 'invalid-mdx') {
        doc.content = '<Meta invalid={';
        expected = /Cannot parse MDX documentation/;
      }
      await writeFixture(root, data);
      await assert.rejects(generateMarkdown({ buildDirectory: root }), expected);
      await assert.rejects(fs.access(path.join(root, 'llms')), { code: 'ENOENT' });
    });
  });
}

test('cleans current built Agent Skill, Theming and template MDX snapshots read-only', async (t) => {
  const build = fileURLToPath(new URL('../storybook-static/', import.meta.url));
  let manifest;
  try {
    manifest = JSON.parse(await fs.readFile(path.join(build, 'manifests', 'docs.json'), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    t.skip('Requires an existing Storybook build; does not generate one.');
    return;
  }
  const docs = {};
  for (const entry of Object.values(manifest.docs)) {
    docs[entry.id] = await resolveDocEntry(entry, undefined, (_request, filename) =>
      fs.readFile(path.resolve(build, filename), 'utf8'),
    );
  }
  await withFixture(async (root, data) => {
    data.components = { v: 0, components: {} };
    data.docs = {
      v: 0,
      docs: Object.fromEntries(
        Object.entries(docs).map(([id, doc]) => [
          id,
          {
            ...doc,
            path: doc.path
              ? path.relative(path.dirname(root), path.resolve(path.dirname(build), doc.path))
              : doc.path,
          },
        ]),
      ),
    };
    data.index.entries = {};
    await writeFixture(root, data);
    await generateMarkdown({ buildDirectory: root });
    for (const doc of Object.values(docs)) {
      const markdown = await readMarkdown(root, doc.id);
      const parsed = unified().use(remarkParse).parse(markdown);
      const code = [];
      const remaining = [];
      function visit(node) {
        if (node.type === 'code') code.push(node.value);
        else if (node.type === 'text' || node.type === 'html') remaining.push(node.value);
        for (const child of node.children ?? []) visit(child);
      }
      visit(parsed);
      assert.doesNotMatch(
        remaining.join('\n'),
        /(?:^|\n)import .+ from |<(?:Meta|Canvas|Source)\b|\{\/\*/,
      );
      for (const original of codeBlocks(doc.content)) {
        assert.ok(code.includes(original.value), `Missing complete authored code in ${doc.id}`);
      }
      if (doc.id === 'docs-theming--docs') {
        assert.ok(markdown.includes('components-coreaifluentprovider--default-theme'));
        assert.ok(markdown.includes('components-coreaifluentprovider--custom-brand-theme'));
        assert.ok(markdown.includes('The theme tokens to apply.'));
        const canonical = await fs.readFile(
          new URL('../../docsite/content/foundations/Theming.md', import.meta.url),
          'utf8',
        );
        for (const original of codeBlocks(canonical))
          assert.ok(code.includes(original.value), `Missing canonical Theming code in ${doc.id}`);
      }
      if (doc.id === 'docs-agent-skill--docs') {
        assert.ok(markdown.includes('https://microsoft.github.io/coreai-design-system/llms.txt'));
      }
    }
  });
});

const invalidFixtures = [
  [
    'missing snippet',
    (data) => {
      delete data.components.components[componentId].stories[4].snippet;
    },
    /Missing snippet for story/,
  ],
  [
    'empty snippet',
    (data) => {
      data.components.components[componentId].stories[0].snippet = ' \n';
    },
    /Missing snippet for story/,
  ],
  [
    'indexed variant missing from manifests',
    (data) => {
      data.components.components[componentId].stories.pop();
    },
    /Indexed story is missing/,
  ],
  [
    'unowned docs-only indexed variant',
    (data) => {
      const story = data.components.components[componentId].stories.pop();
      data.index.entries[story.id].docsOnly = true;
    },
    /Indexed story is missing/,
  ],
  [
    'duplicate story IDs',
    (data) => {
      const stories = data.components.components[componentId].stories;
      stories.push({ ...stories[0] });
    },
    /Duplicate story ID/,
  ],
  [
    'duplicate document IDs',
    (data) => {
      data.docs.docs[componentId] = {
        id: componentId,
        name: 'Conflicting document',
        content: 'Some content.',
      };
    },
    /Duplicate document ID/,
  ],
  [
    'unsafe document ID',
    (data) => {
      data.docs.docs['../escape'] = { id: '../escape', name: 'Unsafe', content: 'Some content.' };
    },
    /Unsafe or malformed Storybook ID/,
  ],
  [
    'unsafe story ID',
    (data) => {
      data.components.components[componentId].stories[0].id = '..\\escape';
    },
    /Unsafe or malformed Storybook ID/,
  ],
  [
    'Windows reserved ID',
    (data) => {
      data.docs.docs.con = { id: 'con', name: 'Reserved', content: 'Some content.' };
    },
    /Unsafe or malformed Storybook ID/,
  ],
  [
    'mismatched document key',
    (data) => {
      data.docs.docs[docId].id = 'another-id';
    },
    /key\/ID mismatch/,
  ],
  [
    'missing standalone content',
    (data) => {
      delete data.docs.docs[docId].content;
    },
    /Missing or empty standalone doc content/,
  ],
  [
    'empty standalone content',
    (data) => {
      data.docs.docs[docId].content = ' \n';
    },
    /Missing or empty standalone doc content/,
  ],
  [
    'empty attached content',
    (data) => {
      data.components.components[componentId].docs[attachedId].content = '';
    },
    /Missing or empty standalone doc content/,
  ],
  [
    'unknown component extraction error',
    (data) => {
      data.components.components[componentId].error = { name: 'Unknown', message: 'Failed.' };
    },
    /Unexpected Storybook manifest problems/,
  ],
  [
    'unknown story extraction error',
    (data) => {
      data.components.components[componentId].stories[0].error = {
        name: 'Unknown',
        message: 'Failed.',
      };
    },
    /Unexpected Storybook manifest problems/,
  ],
  [
    'story extraction warning',
    (data) => {
      data.components.components[componentId].stories[0].warning = 'Missing source.';
    },
    /Unexpected Storybook manifest problems/,
  ],
  [
    'missing referenced file',
    (data) => {
      data.components.v = 1;
      data.components.components[componentId].docgen = { $ref: '../services/missing.json#/value' };
    },
    /ENOENT/,
  ],
  [
    'broken reference pointer',
    (data) => {
      data.components.v = 1;
      data.components.components[componentId].docgen = { $ref: '../services/docgen.json#/absent' };
      data.files[path.join('services', 'docgen.json')] = { other: {} };
    },
    /could not be resolved/,
  ],
  [
    'resolved standalone docs identity mismatch',
    (data) => {
      data.docs.v = 1;
      data.docs.docs[docId].mdx = { $ref: '../services/docs.json#/value' };
      data.files[path.join('services', 'docs.json')] = {
        value: { id: 'different-docs', name: 'Different', content: 'Different document.' },
      };
    },
    /Resolved docs key\/ID mismatch/,
  ],
  [
    'invalid reference payload',
    (data) => {
      data.components.v = 1;
      data.components.components[componentId].docgen = { $ref: '../services/docgen.json#/value' };
      data.files[path.join('services', 'docgen.json')] = { value: [] };
    },
    /not a valid manifest payload/,
  ],
  [
    'path-traversing reference',
    (data) => {
      data.docs.docs[docId].mdx = { $ref: '../../outside.json#/value' };
    },
    /Unsafe path outside/,
  ],
  [
    'network reference',
    (data) => {
      data.docs.docs[docId].mdx = { $ref: 'https://example.com/docs.json#/value' };
    },
    /Unsafe or malformed manifest reference/,
  ],
  [
    'encoded reference traversal',
    (data) => {
      data.docs.docs[docId].mdx = { $ref: '%2e%2e/%2e%2e/outside.json#/value' };
    },
    /Unsafe or malformed manifest reference/,
  ],
  [
    'remaining nested reference',
    (data) => {
      data.components.components[componentId].subcomponents.WidgetItem.docgen = {
        $ref: '../services/docgen.json#/value',
      };
    },
    /Unresolved reference/,
  ],
];

for (const [name, prepare, expected] of invalidFixtures) {
  test(`rejects ${name} before writing generated files`, async () => {
    await withFixture(async (root) => {
      await assert.rejects(generateMarkdown({ buildDirectory: root }), expected);
      await assert.rejects(fs.access(path.join(root, 'llms')), { code: 'ENOENT' });
    }, prepare);
  });
}

for (const filename of [
  'index.json',
  path.join('manifests', 'components.json'),
  path.join('manifests', 'docs.json'),
]) {
  test(`rejects absent required file ${filename}`, async () => {
    await withFixture(async (root) => {
      await fs.rm(path.join(root, filename));
      await assert.rejects(generateMarkdown({ buildDirectory: root }), /ENOENT/);
      await assert.rejects(fs.access(path.join(root, 'llms')), { code: 'ENOENT' });
    });
  });
}
