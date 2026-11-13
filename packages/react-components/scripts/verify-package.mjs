// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { log } from 'node:console';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scratch = process.argv[2] ? undefined : mkdtempSync(path.join(packageRoot, '.pack-check-'));

try {
  let tarball = process.argv[2] && path.resolve(process.argv[2]);
  if (!tarball) {
    assert.ok(process.env.npm_execpath, 'Run this check with npm run test:package');
    const result = execFileSync(
      process.execPath,
      [
        process.env.npm_execpath,
        'pack',
        '--ignore-scripts',
        '--json',
        '--pack-destination',
        scratch,
      ],
      { cwd: packageRoot, encoding: 'utf8' },
    );
    const [{ filename }] = JSON.parse(result);
    tarball = path.join(scratch, filename);
  }

  const entries = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
    .trim()
    .split(/\r?\n/)
    .filter((entry) => !entry.endsWith('/'));
  const read = (entry) =>
    execFileSync('tar', ['-xOzf', tarball, entry], {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
  const manifest = JSON.parse(read('package/package.json'));
  const catalog = JSON.parse(
    readFileSync(path.join(packageRoot, 'illicons/manifest.json'), 'utf8'),
  );
  const registry = read('package/dist/illicons.generated.js');
  for (const icon of catalog.icons) {
    const original = readFileSync(path.join(packageRoot, 'illicons', icon.file));
    assert.ok(
      registry.includes(`data:image/svg+xml;base64,${original.toString('base64')}`),
      `Packaged artwork must remain byte-identical: ${icon.file}`,
    );
  }

  assert.equal(manifest.name, '@coreai-ds/react-components');
  assert.equal(manifest.private, false);
  assert.equal(manifest.publishConfig.registry, 'https://registry.npmjs.org/');
  assert.equal(manifest.publishConfig.access, 'public');
  assert.equal(manifest.license, 'MIT');
  assert.equal(manifest.main, './dist/index.js');
  assert.equal(manifest.types, './dist/index.d.ts');
  assert.deepEqual(manifest.exports, {
    '.': { types: './dist/index.d.ts', import: './dist/index.js' },
    './fonts/fonts.css': './src/fonts/fonts.css',
  });

  for (const target of [manifest.main, manifest.types, manifest.exports['./fonts/fonts.css']]) {
    assert.ok(entries.includes(`package/${target.slice(2)}`), `Missing export: ${target}`);
  }

  for (const entry of entries) {
    assert.ok(
      /^package\/dist\/.+\.(?:js|d\.ts)$/.test(entry) ||
        [
          'package/package.json',
          'package/README.md',
          'package/CHANGELOG.md',
          'package/LICENSE',
          'package/LICENSE.md',
          'package/agent/SKILL.md',
          'package/src/fonts/fonts.css',
          'package/src/fonts/README.md',
        ].includes(entry),
      `Unexpected packed file (including fonts, tests, credentials or local assets): ${entry}`,
    );
    assert.ok(!/\.(?:ttf|otf|woff2?|eot)$/i.test(entry), `Font binary must not ship: ${entry}`);
    if (entry.endsWith('.js') || entry.endsWith('.d.ts')) {
      for (const [, relativeImport] of read(entry).matchAll(
        /(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g,
      )) {
        const target = path.posix.normalize(
          path.posix.join(path.posix.dirname(entry), relativeImport),
        );
        assert.ok(
          entries.includes(target) ||
            (entry.endsWith('.d.ts') && entries.includes(target.replace(/\.js$/, '.d.ts'))),
          `Unresolved packed relative import: ${entry} -> ${relativeImport}`,
        );
      }
    }
  }

  assert.ok(
    !/url\s*\(/i.test(read('package/src/fonts/fonts.css')),
    'The public font stylesheet must not reference bundled or remotely downloaded font binaries',
  );
  assert.ok(entries.includes('package/LICENSE'), 'The package must include its MIT license text');
  log(
    `Verified ${manifest.name}@${manifest.version}: ${entries.length} packed files, compiled exports, no font binaries.`,
  );
} finally {
  if (scratch) rmSync(scratch, { recursive: true, force: true });
}
