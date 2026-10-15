// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash, randomUUID } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = path.join(root, '.local-fonts', `setup-test-${randomUUID()}`);
const isolatedRepo = path.join(fixture, 'repo');
const source = path.join(fixture, 'source');
const sample = Buffer.from('000100000000000000000000', 'hex');
const required = ['Aptos.ttf', 'Aptos-SemiBold.ttf', 'Aptos-Mono.ttf'];
let setupFonts;

before(async () => {
  await mkdir(path.join(isolatedRepo, 'scripts'), { recursive: true });
  await mkdir(path.join(source, 'nested'), { recursive: true });
  const script = path.join(isolatedRepo, 'scripts', 'setup-fonts.mjs');
  await copyFile(path.join(root, 'scripts', 'setup-fonts.mjs'), script);
  ({ setupFonts } = await import(pathToFileURL(script).href));
  for (const name of required) await writeFile(path.join(source, 'nested', name), sample);
});

after(async () => {
  await rm(fixture, { recursive: true, force: true });
});

test('requires explicit license acknowledgement without creating output', async () => {
  await assert.rejects(setupFonts({ source }), /--accept-license/);
  await assert.rejects(readdir(path.join(isolatedRepo, '.local-fonts')), { code: 'ENOENT' });
});

test('stages nested source for OS installation, records hashes, and never emits URL CSS', async () => {
  const result = await setupFonts({ source, acceptLicense: true });
  assert.equal(result.destination, path.join(isolatedRepo, '.local-fonts', 'aptos'));
  assert.deepEqual(result.files, required);
  assert.equal(result.missing.length, 5);
  const manifest = JSON.parse(await readFile(path.join(result.destination, 'setup.json'), 'utf8'));
  assert.equal(manifest.mode, 'local-installation-only');
  assert.equal(manifest.files[0].sha256, createHash('sha256').update(sample).digest('hex'));
  assert.deepEqual(await readFile(path.join(result.destination, required[0])), sample);
  await assert.rejects(readFile(path.join(result.destination, 'fonts.css')), { code: 'ENOENT' });
  await assert.rejects(setupFonts({ source, acceptLicense: true }), /must be empty/);
});

test('consumer assets require an explicit rights flag and cannot target repository assets', async () => {
  const output = path.join(fixture, 'consumer', 'public', 'fonts');
  await assert.rejects(setupFonts({ source, output, acceptLicense: true }), /--allow-web-hosting/);
  await assert.rejects(
    setupFonts({ source, acceptLicense: true, allowWebHosting: true }),
    /requires a consumer-owned/,
  );
  for (const directory of ['packages', 'apps', 'dist', '.local-fonts']) {
    await assert.rejects(
      setupFonts({
        source,
        output: path.join(isolatedRepo, directory, 'fonts'),
        acceptLicense: true,
        allowWebHosting: true,
      }),
      /outside this repository/,
    );
  }
  await setupFonts({ source, output, acceptLicense: true, allowWebHosting: true });
  const css = await readFile(path.join(output, 'fonts.css'), 'utf8');
  assert.equal((css.match(/@font-face/g) ?? []).length, 3);
  for (const filename of required) {
    assert.ok(css.includes(`url('./${filename}')`));
    assert.deepEqual(await readFile(path.join(output, filename)), sample);
  }
  assert.doesNotMatch(css, /https?:|local\(/);
});

test('rejects an archive, overlapping output, missing or invalid fonts before writing output', async () => {
  const output = path.join(fixture, 'invalid-output');
  const options = { output, acceptLicense: true, allowWebHosting: true };
  await assert.rejects(
    setupFonts({ ...options, source: path.join(source, 'nested', required[0]) }),
    /extracted directory/,
  );
  await assert.rejects(
    setupFonts({ ...options, source, output: path.join(source, 'output') }),
    /must not overlap/,
  );
  const incomplete = path.join(fixture, 'incomplete');
  await mkdir(incomplete);
  await assert.rejects(setupFonts({ ...options, source: incomplete }), /Required font missing/);
  for (const name of required) await writeFile(path.join(incomplete, name), 'not a font');
  await assert.rejects(setupFonts({ ...options, source: incomplete }), /Not a TrueType font/);
  await assert.rejects(readdir(output), { code: 'ENOENT' });
});

test('rejects ambiguous duplicates instead of choosing an arbitrary source', async () => {
  const duplicate = path.join(fixture, 'duplicate');
  await mkdir(path.join(duplicate, 'nested'), { recursive: true });
  await writeFile(path.join(duplicate, 'Aptos.ttf'), sample);
  await writeFile(path.join(duplicate, 'nested', 'aptos.ttf'), sample);
  await assert.rejects(
    setupFonts({
      source: duplicate,
      output: path.join(fixture, 'duplicate-output'),
      acceptLicense: true,
      allowWebHosting: true,
    }),
    /Ambiguous duplicate font/,
  );
});

test('shipped font CSS has only installed-font sources and theme retains Aptos-first fallbacks', async () => {
  const css = await readFile(
    path.join(root, 'packages', 'react-components', 'src', 'fonts', 'fonts.css'),
    'utf8',
  );
  assert.doesNotMatch(css, /url\s*\(/i);
  assert.equal((css.match(/@font-face/g) ?? []).length, 8);
  assert.equal((css.match(/src:\s*local\(/g) ?? []).length, 8);
  assert.match(css, /local\('Aptos'\)/);
  assert.match(css, /local\('Aptos Mono'\)/);
  const theme = await readFile(
    path.join(root, 'packages', 'react-components', 'src', 'theme', 'theme.ts'),
    'utf8',
  );
  assert.match(theme, /fontFamilyBase: 'Aptos, "Segoe UI", system-ui,.*sans-serif'/);
  assert.match(theme, /fontFamilyNumeric: 'Aptos, "Segoe UI", system-ui,.*sans-serif'/);
  assert.match(theme, /fontFamilyMonospace: '"Aptos Mono", Menlo, Monaco, Consolas, monospace'/);
  const docsiteCss = await readFile(
    path.join(root, 'apps', 'docsite', 'src', 'styles', 'fonts.css'),
    'utf8',
  );
  assert.match(docsiteCss, /@import '@coreai-ds\/react-components\/fonts\/fonts.css'/);
  assert.doesNotMatch(docsiteCss, /url\s*\(/i);
});
