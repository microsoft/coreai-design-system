// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
  checkTag,
  main,
  publishDecision,
  readRegistry,
  recordRelease,
  validateRelease,
  verifyPublication,
} from './release-package.mjs';

const integrity = 'sha512-test';
const manifest = {
  name: '@coreai-ds/react-components',
  version: '0.12.0',
  private: false,
  license: 'MIT',
  repository: { url: 'git+https://github.com/microsoft/coreai-design-system.git' },
  publishConfig: { registry: 'https://registry.npmjs.org/', access: 'public' },
};
const metadata = (versions, tags = {}) => ({
  name: manifest.name,
  versions: Object.fromEntries(versions.map((v) => [v, { dist: { integrity } }])),
  'dist-tags': tags,
});
const changelog =
  '# Changelog\n\n## [Unreleased]\n\n## [0.12.0] - 2026-10-16\n\n### Changed\n\n- Public npm release.\n\n## [0.11.2] - 2026-10-05\n\n- Earlier fix.\n';

test('release metadata requires the selected public package, increasing version and release notes', () => {
  assert.equal(
    validateRelease(manifest, changelog, '0.11.1'),
    '### Changed\n\n- Public npm release.',
  );
  for (const invalid of [
    { name: 'another-package' },
    { version: '0.11.1' },
    { version: 'invalid' },
    { private: true },
    { license: 'UNLICENSED' },
    { publishConfig: { registry: 'https://another-registry/', access: 'public' } },
    { publishConfig: { registry: 'https://registry.npmjs.org/', access: 'restricted' } },
    { repository: { url: 'https://github.com/another/repository' } },
  ]) {
    assert.throws(() => validateRelease({ ...manifest, ...invalid }, changelog, '0.11.1'));
  }
  assert.throws(() => validateRelease(manifest, '## [Unreleased]', '0.11.1'));
  assert.throws(() =>
    validateRelease(manifest, '## [0.12.0] - 2026-10-16\n\n## [0.11.2]', '0.11.1'),
  );
});

test('only a registry 404 permits the initial-release path', async () => {
  assert.equal(await readRegistry(async () => ({ status: 404 })), null);
  for (const status of [401, 403, 429, 500]) {
    await assert.rejects(
      readRegistry(async () => ({ status })),
      /lookup failed/,
    );
  }
  await assert.rejects(
    readRegistry(async () => {
      throw new Error('Network unavailable');
    }),
    /Network unavailable/,
  );
  await assert.rejects(
    readRegistry(async () => ({ status: 200, json: async () => ({ name: 'wrong' }) })),
    /Unexpected registry package/,
  );
  const result = metadata(['0.12.0']);
  assert.deepEqual(
    await readRegistry(async () => ({ status: 200, json: async () => result })),
    result,
  );
});

test('first publication is explicitly limited to 0.12.0', () => {
  assert.equal(publishDecision('0.12.0', null, integrity), 'publish');
  assert.throws(() => publishDecision('0.11.1', null, integrity), /initial public release/);
  assert.throws(() => publishDecision('0.13.0', null, integrity), /initial public release/);
});

test('semantic version ordering is numeric and rejects downgrades', () => {
  assert.equal(publishDecision('0.12.0', metadata(['0.9.0', '0.11.2']), integrity), 'publish');
  assert.throws(() => publishDecision('0.12.0', metadata(['0.13.0']), integrity), /newer/);
  assert.throws(() => publishDecision('0.12.0', metadata(['invalid']), integrity), /Invalid npm/);
  assert.throws(() => publishDecision('0.12.0', metadata([]), integrity), /Invalid npm/);
});

test('stable and prerelease channels retain their version ordering', () => {
  assert.equal(publishDecision('0.13.0-beta.2', metadata(['0.13.0-beta.1']), integrity), 'publish');
  assert.throws(
    () => publishDecision('0.13.0-beta.1', metadata(['0.13.0-beta.2']), integrity),
    /newer/,
  );
  assert.equal(
    publishDecision('0.12.1', metadata(['0.12.0', '0.13.0-beta.1']), integrity),
    'publish',
  );
});

test('recovery never republishes and requires identical tarball integrity', () => {
  assert.equal(publishDecision('0.12.0', metadata(['0.12.0']), integrity), 'recover');
  assert.throws(
    () => publishDecision('0.12.0', metadata(['0.12.0']), 'sha512-different'),
    /tarball differs/,
  );
});

test('verification requires public metadata, matching artifact and matching channel', () => {
  verifyPublication('0.12.0', metadata(['0.12.0'], { latest: '0.12.0' }), integrity);
  verifyPublication(
    '0.13.0-beta.1',
    metadata(['0.13.0-beta.1'], { next: '0.13.0-beta.1' }),
    integrity,
  );
  assert.throws(() => verifyPublication('0.12.0', null, integrity), /integrity mismatch/);
  assert.throws(() => verifyPublication('0.12.0', metadata(['0.12.0']), integrity), /latest/);
  assert.throws(
    () => verifyPublication('0.12.0', metadata(['0.12.0'], { latest: '0.13.0' }), integrity),
    /latest/,
  );
});

test('existing lightweight and annotated tags must identify the exact release commit', async () => {
  assert.equal(await checkTag('v0.12.0', 'merge-sha', async () => null), false);
  assert.equal(
    await checkTag('v0.12.0', 'merge-sha', async () => ({
      object: { type: 'commit', sha: 'merge-sha' },
    })),
    true,
  );
  const responses = [
    { object: { type: 'tag', sha: 'tag-sha' } },
    { object: { type: 'commit', sha: 'merge-sha' } },
  ];
  assert.equal(await checkTag('v0.12.0', 'merge-sha', async () => responses.shift()), true);
  await assert.rejects(
    checkTag('v0.12.0', 'merge-sha', async () => ({ object: { type: 'commit', sha: 'other' } })),
    /another commit/,
  );
});

test('recording creates the plain version tag and release on the exact SHA', async () => {
  const writes = [];
  await recordRelease('0.12.0', 'merge-sha', 'Release notes', async (path, method, body) => {
    if (!method) return null;
    writes.push({ path, method, body });
  });
  assert.deepEqual(writes, [
    {
      path: 'git/refs',
      method: 'POST',
      body: { ref: 'refs/tags/v0.12.0', sha: 'merge-sha' },
    },
    {
      path: 'releases',
      method: 'POST',
      body: {
        tag_name: 'v0.12.0',
        target_commitish: 'merge-sha',
        name: 'v0.12.0',
        body: 'Release notes',
        prerelease: false,
        make_latest: 'true',
      },
    },
  ]);
});

test('recording is retryable without overwriting tags or duplicating releases', async () => {
  const request = async (path, method) => {
    assert.equal(method, undefined, 'Recovery must not write an existing release');
    return path.startsWith('git/')
      ? { object: { type: 'commit', sha: 'merge-sha' } }
      : { draft: false };
  };
  await recordRelease('0.12.0', 'merge-sha', 'Release notes', request);
});

test('failed tag creation is surfaced and does not create a GitHub release', async () => {
  const calls = [];
  await assert.rejects(
    recordRelease('0.12.0', 'merge-sha', 'notes', async (path, method) => {
      calls.push(path);
      if (method) throw new Error('Tag creation denied');
      return null;
    }),
    /Tag creation denied/,
  );
  assert.deepEqual(calls, ['git/ref/tags/v0.12.0', 'git/refs']);
});

test('release commands keep the version-changing commit even when main advances', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'coreai-release-test-'));
  const cwd = process.cwd();
  const saved = Object.fromEntries(
    ['GH_TOKEN', 'RELEASE_SHA', 'RELEASE_INTEGRITY', 'GITHUB_OUTPUT'].map((key) => [
      key,
      process.env[key],
    ]),
  );
  t.after(() => {
    process.chdir(cwd);
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    rmSync(directory, { recursive: true, force: true });
  });
  process.chdir(directory);
  const git = (...args) =>
    execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const commit = () => {
    git('add', '.');
    git(
      '-c',
      'user.name=Release test',
      '-c',
      'user.email=release@example.invalid',
      'commit',
      '-m',
      'Release fixture\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>',
    );
  };
  git('init', '--initial-branch=main');
  mkdirSync('packages/react-components', { recursive: true });
  writeFileSync(
    'packages/react-components/package.json',
    JSON.stringify({ ...manifest, version: '0.11.1' }),
  );
  writeFileSync('packages/react-components/CHANGELOG.md', changelog);
  writeFileSync('LICENSE-CODE', 'MIT License');
  writeFileSync('packages/react-components/LICENSE', 'MIT License');
  commit();
  writeFileSync('packages/react-components/package.json', JSON.stringify(manifest));
  commit();
  const releaseSha = git('rev-parse', 'HEAD');
  writeFileSync('later-change.txt', 'Main advances after the release commit.');
  commit();
  git('update-ref', 'refs/remotes/origin/main', 'HEAD');
  git('checkout', '--detach', releaseSha);
  mkdirSync('package-artifacts');
  writeFileSync('package-artifacts/package.tgz', 'deterministic test artifact');
  process.env.GH_TOKEN = 'test-only';
  process.env.RELEASE_SHA = releaseSha;
  process.env.GITHUB_OUTPUT = join(directory, 'output');
  let published = null;
  const writes = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.startsWith('https://registry.npmjs.org/')) {
      return { status: published ? 200 : 404, json: async () => published };
    }
    assert.ok(url.startsWith('https://api.github.com/repos/microsoft/coreai-design-system/'));
    if (options.method === 'GET') return { status: 404 };
    writes.push(JSON.parse(options.body));
    return { ok: true, status: 201, json: async () => ({}) };
  });
  await main('prepare');
  const outputs = Object.fromEntries(
    readFileSync(process.env.GITHUB_OUTPUT, 'utf8')
      .trim()
      .split('\n')
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)];
      }),
  );
  assert.equal(outputs.publish, 'true');
  assert.equal(outputs.version, '0.12.0');
  assert.equal(outputs.channel, 'latest');
  assert.equal(outputs.tarball, 'package-artifacts/package.tgz');
  assert.match(outputs.integrity, /^sha512-/);
  assert.deepEqual(writes, [], 'Preparation must not write tags or releases');
  published = metadata(['0.12.0'], { latest: '0.12.0' });
  published.versions['0.12.0'].dist.integrity = outputs.integrity;
  process.env.RELEASE_INTEGRITY = outputs.integrity;
  await main('record');
  assert.equal(writes[0].ref, 'refs/tags/v0.12.0');
  assert.equal(writes[0].sha, releaseSha);
  assert.equal(writes[1].target_commitish, releaseSha);
  process.env.RELEASE_SHA = 'wrong-sha';
  await assert.rejects(main('prepare'), /CI-approved commit/);
});
