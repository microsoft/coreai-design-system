// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { format } from 'prettier';
import ts from 'typescript';
import { convertStyleSource, readInstalledStyleSource } from './convert-fluent-styles.mjs';

const convert = (source) =>
  convertStyleSource(source, { component: 'Example', filename: 'example.styles.ts' });

test('resolves constants, aliases, templates, arithmetic, typography spreads, and shorthand helpers', () => {
  const result = convert(`
    import { makeStyles as styles, shorthands as s } from '@griffel/react';
    import { tokens as t, typographyStyles as typography } from '@fluentui/react-theme';
    const spacing = { small: '3px' };
    const customProperty = '--example-spacing';
    const useStyles = styles({
      root: {
        ...typography.body1,
        fontWeight: 700,
        padding: \`\${spacing['small']} \${t.spacingHorizontalM}\`,
        [customProperty]: '4px',
        ...s.borderColor('red', 'blue'),
        zIndex: 1 + 2,
        marginLeft: -1,
      },
    });
  `);
  assert.deepEqual(result.report.diagnostics, []);
  assert.deepEqual(result.blocks[0].styles, {
    fontFamily: 'var(--fontFamilyBase)',
    fontSize: 'var(--fontSizeBase300)',
    fontWeight: 700,
    lineHeight: 'var(--lineHeightBase300)',
    padding: '3px var(--spacingHorizontalM)',
    '--example-spacing': '4px',
    borderTopColor: 'red',
    borderRightColor: 'blue',
    borderBottomColor: 'red',
    borderLeftColor: 'blue',
    zIndex: 3,
    marginLeft: -1,
  });
  assert.match(result.css, /--example-spacing: 4px;/);
  assert.match(result.css, /font-weight: 700;/);
});

test('preserves reset styles, variants, empty blocks, fallback arrays, and declaration override order', () => {
  const result = convert(`
    import { makeStyles, makeResetStyles } from '@griffel/react';
    const base = { display: 'block', margin: 0 };
    const useBase = makeResetStyles({ ...base, display: ['inline-flex', 'flex'] });
    const useVariants = makeStyles({ small: { fontSize: '12px' }, medium: {} });
  `);
  assert.equal(result.report.summary.factories, 2);
  assert.equal(result.blocks.length, 3);
  assert.deepEqual(
    result.blocks.map(({ variant }) => variant),
    [null, 'small', 'medium'],
  );
  assert.match(result.css, /display: inline-flex;\n\s+display: flex;/);
  assert.equal(result.report.summary.declarations, 4);
});

test('retains nested selector lists, pseudo-elements, media/supports rules, and stable global selectors', async () => {
  const result = convert(`
    import { makeStyles } from '@griffel/react';
    import { iconRegularClassName } from '@fluentui/react-icons';
    const classNames = { icon: 'fui-Example__icon' };
    const useStyles = makeStyles({
      root: {
        ':hover:active,:active:focus-visible': { color: 'red' },
        ':is(:hover, :focus),:not([data-kind="x,y"])': { color: 'blue' },
        '::after': { content: '""' },
        '> svg': { fontSize: '20px' },
        [\`& .\${classNames.icon}\`]: {
          [\`& .\${iconRegularClassName}\`]: { display: 'none' },
        },
        '@media (forced-colors: active)': {
          ':hover': { color: 'Highlight' },
        },
        '@supports (-moz-appearance:button)': { boxShadow: 'none' },
      },
    });
  `);
  assert.match(result.css, /&:hover:active, &:active:focus-visible/);
  assert.match(result.css, /&:is\(:hover, :focus\), &:not\(\[data-kind="x,y"\]\)/);
  assert.match(result.css, /&::after/);
  assert.match(result.css, /& > svg/);
  assert.match(result.css, /& :global\(\.fui-Example__icon\)/);
  assert.match(result.css, /& :global\(\.fui-Icon-regular\)/);
  assert.match(result.css, /@media \(forced-colors: active\)/);
  assert.match(result.css, /@supports \(-moz-appearance:button\)/);
  await assert.doesNotReject(() => format(result.css, { parser: 'css' }));
});

test('reports unsupported helpers without executing source or guessing replacement focus selectors', () => {
  const result = convert(`
    import { makeStyles } from '@griffel/react';
    import { createCustomFocusIndicatorStyle } from '@fluentui/react-tabster';
    const dangerous = () => { throw new Error('must not execute'); };
    const useStyles = makeStyles({
      root: {
        color: 'red',
        ...createCustomFocusIndicatorStyle({ outline: '2px solid red' }),
        width: dangerous(),
      },
    });
  `);
  assert.equal(result.report.status, 'partial-draft');
  assert.equal(result.report.diagnostics.length, 2);
  assert.ok(result.report.diagnostics.every(({ line, column }) => line > 0 && column > 0));
  assert.match(result.report.diagnostics[0].expression, /^createCustomFocusIndicatorStyle\(/);
  assert.match(result.report.diagnostics[1].expression, /^dangerous\(/);
  assert.deepEqual(result.blocks[0].styles, { color: 'red' });
  assert.match(result.css, /INCOMPLETE: see report/);
  assert.doesNotMatch(result.css, /:focus-visible/);
});

test('reports unresolved constants, computed keys, and state-dependent expressions explicitly', () => {
  const result = convert(`
    import { makeStyles } from '@griffel/react';
    const useStyles = makeStyles({
      root: {
        color: missing,
        [unknownSelector]: { color: 'red' },
        width: state.small ? '10px' : '20px',
      },
    });
  `);
  assert.equal(result.report.diagnostics.length, 3);
  assert.equal(result.report.summary.declarations, 0);
  assert.ok(result.report.diagnostics.every(({ contexts }) => contexts.includes('useStyles.root')));
});

test('deduplicates diagnostic locations while retaining all affected style blocks', () => {
  const result = convert(`
    import { makeStyles } from '@griffel/react';
    const unresolved = helper();
    const useStyles = makeStyles({
      small: { color: unresolved },
      large: { color: unresolved },
    });
  `);
  assert.equal(result.report.diagnostics.length, 1);
  assert.deepEqual(result.report.diagnostics[0].contexts, ['useStyles.small', 'useStyles.large']);
});

test('detects circular constants and preserves unrelated declarations', () => {
  const result = convert(`
    import { makeResetStyles } from '@griffel/react';
    const a = b;
    const b = a;
    const useStyles = makeResetStyles({ color: a, display: 'block' });
  `);
  assert.equal(result.report.diagnostics.length, 1);
  assert.match(result.report.diagnostics[0].message, /Circular constant/);
  assert.deepEqual(result.blocks[0].styles, { display: 'block' });
});

test('does not treat mutable bindings as static constants', () => {
  const result = convert(`
    import { makeResetStyles } from '@griffel/react';
    let color = 'red';
    color = 'blue';
    const useStyles = makeResetStyles({ color: color });
  `);
  assert.equal(result.report.diagnostics.length, 1);
  assert.match(result.report.diagnostics[0].message, /Unresolved identifier: color/);
});

test('rejects malformed source, unsupported factories/tables, and invalid component names', () => {
  assert.throws(() => convert('const broken = {'), /expected|'}'/);
  assert.throws(
    () =>
      convert(
        `import { makeStyles } from 'unrecognized-package'; const useStyles = makeStyles({});`,
      ),
    /No supported/,
  );
  assert.throws(
    () =>
      convert(`import { makeStyles } from '@griffel/react'; const useStyles = makeStyles(other);`),
    /literal table/,
  );
  assert.throws(() => convertStyleSource('', { component: '../Button' }), /PascalCase/);
});

function countDeclarations(styles) {
  return Object.values(styles).reduce(
    (count, value) =>
      count +
      (value && typeof value === 'object' && !Array.isArray(value)
        ? countDeclarations(value)
        : Array.isArray(value)
          ? value.length
          : 1),
    0,
  );
}

function withoutLegacyFocus(styles) {
  return Object.fromEntries(
    Object.entries(styles)
      .filter(([key]) => key !== '&[data-fui-focus-visible]')
      .map(([key, value]) => [
        key,
        value && typeof value === 'object' && !Array.isArray(value)
          ? withoutLegacyFocus(value)
          : value,
      ]),
  );
}

// Only the two installed upstream fixtures execute here, as an independent test oracle.
// The converter itself parses source and never executes it.
function captureUpstreamObjects(input) {
  const fixtureRequire = createRequire(input.filename);
  const captured = [];
  const compiled = ts.transpileModule(input.source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  new vm.Script(compiled, { filename: input.filename }).runInNewContext({
    exports: {},
    require(specifier) {
      const actual = fixtureRequire(specifier);
      if (specifier !== '@griffel/react') return actual;
      return {
        ...actual,
        makeStyles(styles) {
          captured.push(...Object.values(styles));
          return () => ({});
        },
        makeResetStyles(styles) {
          captured.push(styles);
          return () => '';
        },
      };
    },
  });
  return JSON.parse(JSON.stringify(captured));
}

for (const component of ['Button', 'Input']) {
  test(`matches the actual installed ${component} style objects except explicitly reported focus helpers`, async (t) => {
    const input = await readInstalledStyleSource(
      `@fluentui/react-${component.toLowerCase()}`,
      component,
    );
    const result = convertStyleSource(input.source, { component, filename: input.filename });
    const upstream = captureUpstreamObjects(input);
    assert.equal(result.blocks.length, upstream.length);
    for (let index = 0; index < upstream.length; index += 1) {
      assert.deepEqual(
        result.blocks[index].styles,
        component === 'Button' ? withoutLegacyFocus(upstream[index]) : upstream[index],
        result.blocks[index].className,
      );
    }
    if (component === 'Button') {
      assert.ok(result.report.diagnostics.length > 0);
      assert.ok(
        result.report.diagnostics.every(({ message }) =>
          message.startsWith('Unsupported helper: createCustomFocusIndicatorStyle.'),
        ),
      );
    } else {
      assert.deepEqual(result.report.diagnostics, []);
    }
    await format(result.css, { parser: 'css' });
    const original = upstream.reduce((count, styles) => count + countDeclarations(styles), 0);
    t.diagnostic(
      `${component}@${input.provenance.version}: ${upstream.length} blocks; ` +
        `${result.report.summary.declarations}/${original} expanded declarations retained; ` +
        `${result.report.diagnostics.length} explicit unsupported helper sites.`,
    );
  });
}

test('CLI writes separate drafts with provenance, signals partial output, and refuses accidental overwrites', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'coreai-style-draft-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const script = fileURLToPath(new URL('./convert-fluent-styles.mjs', import.meta.url));
  for (const component of ['Button', 'Input']) {
    const args = [
      script,
      '--package',
      `@fluentui/react-${component.toLowerCase()}`,
      '--component',
      component,
      '--out-dir',
      directory,
    ];
    const result = spawnSync(process.execPath, args, { cwd: directory, encoding: 'utf8' });
    assert.equal(result.status, component === 'Button' ? 2 : 0, result.stderr);
    const cssPath = path.join(directory, `${component}.draft.module.css`);
    const css = await readFile(cssPath, 'utf8');
    const report = JSON.parse(
      await readFile(path.join(directory, `${component}.draft.json`), 'utf8'),
    );
    assert.equal(report.component, component);
    assert.equal(report.provenance.package, `@fluentui/react-${component.toLowerCase()}`);
    assert.match(report.sha256, /^[a-f0-9]{64}$/);
    assert.match(css, /GENERATED DRAFT ONLY/);
    if (component === 'Button') assert.match(result.stderr, /REVIEW .*Unsupported helper/);
    const repeated = spawnSync(process.execPath, args, { cwd: directory, encoding: 'utf8' });
    assert.equal(repeated.status, 1);
    assert.match(repeated.stderr, /EEXIST/);
    assert.equal(await readFile(cssPath, 'utf8'), css);
  }
});
