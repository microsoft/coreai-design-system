// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { validateCatalog, validateSvg } from './validate-illicons.mjs';
import { generateIllicons } from './generate-illicons.mjs';
import { readFileSync } from 'node:fs';

const svg = (body, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140" viewBox="0 0 140 140" ${extra}>${body}</svg>`;
const circle = '<circle cx="70" cy="70" r="1" fill="#222222"/>';
const entry = {
  title: 'Test dot',
  tags: ['dot', 'test'],
  file: 'test-dot.svg',
  author: 'test-author',
};

function fixture(t, icons = [entry], files = { 'test-dot.svg': svg(circle) }) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'illicon-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify({ version: 1, icons }));
  for (const [filename, content] of Object.entries(files)) {
    writeFileSync(path.join(directory, filename), content);
  }
  return directory;
}

test('accepts empty catalogs and unchanged circle/path artwork with local shape references', (t) => {
  assert.deepEqual(validateCatalog(fixture(t, [], {})), { version: 1, icons: [] });
  const original = svg(
    '<title>Test</title><defs><path id="dot" d="M70 70h1v1z"/></defs>' +
      '<g transform="translate(0 0)"><use href="#dot"/></g>' +
      circle,
    'role="img" aria-label="Test artwork"',
  );
  const directory = fixture(t, [entry], { 'test-dot.svg': original });
  assert.equal(validateCatalog(directory).icons[0].title, 'Test dot');
  const output = path.join(directory, 'registry.ts');
  generateIllicons(directory, output);
  const registry = readFileSync(output, 'utf8');
  assert.ok(registry.includes('export type IlliconName = "test-dot"'));
  assert.ok(registry.includes('"id":"test-dot","name":"Test dot"'));
  assert.ok(
    registry.includes(`data:image/svg+xml;base64,${Buffer.from(original).toString('base64')}`),
  );
});

test('accepts artwork without optional search tags', (t) => {
  const directory = fixture(t, [{ ...entry, tags: [] }]);
  assert.deepEqual(validateCatalog(directory).icons[0].tags, []);
  const output = path.join(directory, 'registry.ts');
  generateIllicons(directory, output);
  assert.ok(readFileSync(output, 'utf8').includes('"tags":[]'));
});

for (const [label, change] of [
  ['duplicate files', [entry, { ...entry, title: 'Another title' }]],
  ['duplicate titles', [entry, { ...entry, file: 'other.svg' }]],
  ['path traversal', [{ ...entry, file: '../test-dot.svg' }]],
  ['uppercase filename', [{ ...entry, file: 'Test-Dot.svg' }]],
  ['missing filename', [{ ...entry, file: undefined }]],
  ['non-SVG filename', [{ ...entry, file: 'test-dot.png' }]],
  ['missing author', [{ ...entry, author: undefined }]],
  ['missing tags array', [{ ...entry, tags: undefined }]],
  ['empty tag', [{ ...entry, tags: [''] }]],
  ['duplicate tags', [{ ...entry, tags: ['dot', 'dot'] }]],
  ['untrimmed title', [{ ...entry, title: ' Test dot ' }]],
]) {
  test(`rejects ${label}`, (t) => {
    assert.throws(() => validateCatalog(fixture(t, change)));
  });
}

test('rejects missing, unlisted, and symlinked SVGs', (t) => {
  assert.throws(() => validateCatalog(fixture(t, [entry], {})), /ENOENT/);
  assert.throws(() => validateCatalog(fixture(t, [], { 'extra.svg': svg(circle) })), /Unlisted/);
  const directory = fixture(t, [entry], { 'original.svg': svg(circle) });
  symlinkSync(path.join(directory, 'original.svg'), path.join(directory, 'test-dot.svg'));
  assert.throws(() => validateCatalog(directory), /regular SVG file/);
});

test('generation rejects unsafe artwork without writing a registry', (t) => {
  const unsafe = fixture(t, [entry], { 'test-dot.svg': svg('<script/>' + circle) });
  assert.throws(
    () => generateIllicons(unsafe, path.join(unsafe, 'registry.ts')),
    /Unsupported SVG element/,
  );
});

for (const [label, source] of [
  ['script', svg('<script>alert(1)</script>' + circle)],
  ['event handlers', svg('<circle r="1" onload="alert(1)"/>')],
  ['CSS', svg('<style>circle { fill: red }</style>' + circle)],
  ['inline style', svg('<circle r="1" style="fill:red"/>')],
  ['embedded content', svg('<foreignObject/>' + circle)],
  ['remote use', svg('<use href="https://example.com/image.svg"/>' + circle)],
  ['encoded remote use', svg('<use href="&#104;ttps://example.com/image.svg"/>' + circle)],
  ['paint URLs', svg('<circle r="1" fill="url(https://example.com)"/>')],
  ['namespace spoofing', svg('<g xmlns="https://example.com"><circle r="1"/></g>')],
  ['malformed XML', svg(circle).replace('</svg>', '')],
  ['wrong dimensions', svg(circle).replace('width="140"', 'width="280"')],
  ['empty artwork', svg('')],
  ['dangling references', svg(circle + '<use href="#missing"/>')],
  ['recursive references', svg('<g id="loop"><use href="#loop"/></g>' + circle)],
  ['DOCTYPE', '<!DOCTYPE svg [<!ENTITY x "test">]>' + svg(circle)],
  ['processing instructions', '<?xml-stylesheet href="https://example.com/style"?>' + svg(circle)],
]) {
  test(`rejects SVG ${label}`, () => assert.throws(() => validateSvg(source)));
}
