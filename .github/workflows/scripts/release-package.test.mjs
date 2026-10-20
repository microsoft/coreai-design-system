// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { execFileSync, execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { resolveCompletionArtifact, resolveReleaseTarget } from './release-target.mjs';
import {
  checkTag,
  main,
  publishDecision,
  readRegistry,
  recordRelease,
  validateRelease,
  verifyPublication,
  verifyRegistry,
  loadBundle,
  releaseSummary,
} from './release-package.mjs';

const integrity = 'sha512-test';
const approvedRun = {
  repository: { full_name: 'microsoft/coreai-design-system' },
  head_repository: { full_name: 'microsoft/coreai-design-system' },
  path: '.github/workflows/ci.yml',
  event: 'push',
  head_branch: 'main',
  status: 'completed',
  conclusion: 'success',
  head_sha: '24fee07fbbe36e480efde8f0b14902be06191bb8',
};
const recoveryEnv = {
  GITHUB_REPOSITORY: 'microsoft/coreai-design-system',
  GITHUB_EVENT_NAME: 'workflow_dispatch',
  GITHUB_REF: 'refs/heads/main',
  GH_TOKEN: 'test-only',
};

test('manual recovery resolves the original successful CI run, not current main', async () => {
  const sha = await resolveReleaseTarget(
    { inputs: { ci_run_id: '39469177924' } },
    recoveryEnv,
    async (url) => {
      assert.equal(
        url,
        'https://api.github.com/repos/microsoft/coreai-design-system/actions/runs/39469177924',
      );
      return { ok: true, json: async () => approvedRun };
    },
  );
  assert.equal(sha, approvedRun.head_sha);
});

test('automatic release retains the successful CI source SHA', async () => {
  assert.equal(
    await resolveReleaseTarget(
      { workflow_run: approvedRun },
      { ...recoveryEnv, GITHUB_EVENT_NAME: 'workflow_run' },
    ),
    approvedRun.head_sha,
  );
});

test('recovery rejects non-main dispatch, invalid run IDs, and failed API requests', async () => {
  const event = { inputs: { ci_run_id: '39469177924' } };
  await assert.rejects(
    resolveReleaseTarget(event, { ...recoveryEnv, GITHUB_REF: 'refs/heads/feature' }),
    /main only/,
  );
  await assert.rejects(
    resolveReleaseTarget({ inputs: { ci_run_id: '../other' } }, recoveryEnv),
    /run ID/,
  );
  for (const status of [401, 403, 404, 500]) {
    await assert.rejects(
      resolveReleaseTarget(event, recoveryEnv, async () => ({ ok: false, status })),
      /Cannot verify/,
    );
  }
});

test('recovery rejects other workflows, failed CI, PRs, forks, and malformed source SHAs', async () => {
  for (const invalid of [
    { repository: { full_name: 'other/repository' } },
    { head_repository: { full_name: 'other/repository' } },
    { path: '.github/workflows/publish-package.yml' },
    { event: 'pull_request' },
    { head_branch: 'feature' },
    { status: 'in_progress' },
    { conclusion: 'failure' },
    { head_sha: 'main' },
  ]) {
    await assert.rejects(
      resolveReleaseTarget({ inputs: { ci_run_id: '39469177924' } }, recoveryEnv, async () => ({
        ok: true,
        json: async () => ({ ...approvedRun, ...invalid }),
      })),
    );
  }
});

test('workflow publishes an explicit local tarball and pins both checkouts to the approved SHA', () => {
  const workflow = readFileSync(new URL('../publish-package.yml', import.meta.url), 'utf8');
  assert.ok(workflow.includes('npm publish "$TARBALL" --ignore-scripts'));
  assert.ok(workflow.includes('npm publish ./package-artifacts/*.tgz --dry-run'));
  assert.ok(workflow.includes('ref: ${{ steps.target.outputs.sha }}'));
  assert.ok(workflow.includes('ref: ${{ needs.detect.outputs.sha }}'));
  assert.ok(workflow.includes('RELEASE_SHA: ${{ needs.detect.outputs.sha }}'));
  assert.ok(workflow.includes('assert.notEqual(before.version, after.version'));
  assert.ok(workflow.includes('publish ${after.name}@${after.version}'));
});
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
    [
      'GH_TOKEN',
      'RELEASE_SHA',
      'RELEASE_INTEGRITY',
      'GITHUB_OUTPUT',
      'GITHUB_RUN_ID',
      'GITHUB_RUN_ATTEMPT',
      'CONFIRMATION',
    ].map((key) => [key, process.env[key]]),
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
  process.env.GITHUB_RUN_ID = '12345';
  process.env.GITHUB_RUN_ATTEMPT = '1';
  let published = null;
  const writes = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.startsWith('https://registry.npmjs.org/')) {
      if (url.endsWith('/dist-tags')) return Response.json(published['dist-tags']);
      if (url.endsWith('/0.12.0') && published)
        return Response.json({
          name: manifest.name,
          version: '0.12.0',
          dist: published.versions['0.12.0'].dist,
        });
      return { status: published ? 200 : 404, json: async () => published };
    }
    assert.ok(url.startsWith('https://api.github.com/repos/microsoft/coreai-design-system/'));
    if (options.method === 'GET') return { status: 404 };
    writes.push(JSON.parse(options.body));
    return { ok: true, status: 201, json: async () => ({}) };
  });
  await main('bundle');
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
  assert.equal(outputs.tarball, './package-artifacts/package.tgz');
  assert.match(outputs.integrity, /^sha512-/);
  assert.deepEqual(writes, [], 'Preparation must not write tags or releases');
  published = metadata(['0.12.0'], { latest: '0.12.0' });
  published.versions['0.12.0'].dist.integrity = outputs.integrity;
  process.env.RELEASE_INTEGRITY = outputs.integrity;
  await assert.rejects(main('record'), /ENOENT/);
  await main('verify');
  await main('record');
  assert.equal(writes[0].ref, 'refs/tags/v0.12.0');
  assert.equal(writes[0].sha, releaseSha);
  assert.equal(writes[1].target_commitish, releaseSha);
  process.env.GITHUB_RUN_ATTEMPT = '2';
  await assert.rejects(main('record'), /current workflow attempt/);
  process.env.RELEASE_SHA = 'wrong-sha';
  await assert.rejects(main('prepare'), /Artifact source mismatch/);
  delete process.env.RELEASE_SHA;
  git('checkout', 'main');
  assert.equal(
    loadBundle().sha,
    releaseSha,
    'Completion uses the retained source, not current HEAD',
  );
  process.env.CONFIRMATION = 'complete @coreai-ds/react-components@0.12.1';
  await assert.rejects(main('inspect'), /does not match artifact/);
  process.env.CONFIRMATION = 'complete @coreai-ds/react-components@0.12.0';
  await main('inspect');
  const originalBundle = readFileSync('package-artifacts/release.json', 'utf8');
  const bundle = JSON.parse(originalBundle);
  for (const [change, expected] of [
    [{ filename: '../package.tgz' }, /Unsafe release tarball/],
    [{ notes: 'Different notes' }, /release notes differ/],
    [{ version: '0.12.1' }, /version differs/],
    [{ sha: 'main' }, /Invalid artifact source SHA/],
  ]) {
    writeFileSync('package-artifacts/release.json', JSON.stringify({ ...bundle, ...change }));
    assert.throws(() => loadBundle(), expected);
  }
  writeFileSync('package-artifacts/release.json', originalBundle);
  writeFileSync('package-artifacts/package.tgz', 'changed artifact');
  assert.throws(() => loadBundle(), /checksum mismatch/);
});

test('verification retries exact-version visibility and channel propagation for over five minutes', async () => {
  let calls = 0;
  const waits = [];
  const logs = [];
  await verifyRegistry('0.12.0', integrity, {
    sleep: async (delay) => waits.push(delay),
    log: (line) => logs.push(line),
    request: async (url) => {
      calls++;
      if (calls < 9)
        return new Response(null, { status: 404, headers: { age: '12', 'x-cache': 'HIT' } });
      if (url.endsWith('/dist-tags')) return Response.json({ latest: '0.12.0' });
      assert.ok(url.endsWith('/0.12.0'));
      return Response.json({ name: manifest.name, version: '0.12.0', dist: { integrity } });
    },
  });
  assert.equal(calls, 10);
  assert.equal(
    waits.reduce((sum, delay) => sum + delay, 0),
    315_000,
  );
  assert.ok(
    logs.some(
      (line) =>
        line.includes('HTTP 404') && line.includes('age=12') && line.includes('x-cache=HIT'),
    ),
  );
});

test('verification retries rate limits, server errors, network failures, and stale channels', async () => {
  const replies = [
    new Response(null, { status: 429 }),
    new Response(null, { status: 503 }),
    new Error('connection reset'),
    Response.json({ name: manifest.name, version: '0.12.0', dist: { integrity } }),
    Response.json({ latest: '0.11.2' }),
    Response.json({ name: manifest.name, version: '0.12.0', dist: { integrity } }),
    Response.json({ latest: '0.12.0' }),
  ];
  await verifyRegistry('0.12.0', integrity, {
    delays: [0, 1, 1, 1, 1],
    sleep: async () => {},
    log: () => {},
    request: async () => {
      const reply = replies.shift();
      if (reply instanceof Error) throw reply;
      return reply;
    },
  });
  assert.equal(replies.length, 0);
});

test('verification fails immediately on authorization, malformed data, integrity mismatch and channel advancement', async () => {
  for (const response of [
    new Response(null, { status: 401 }),
    new Response(null, { status: 403 }),
    new Response('{', { status: 200 }),
    Response.json({ name: manifest.name, version: '0.12.0', dist: { integrity: 'wrong' } }),
  ]) {
    let calls = 0;
    await assert.rejects(
      verifyRegistry('0.12.0', integrity, {
        log: () => {},
        request: async () => {
          calls++;
          return response;
        },
        sleep: async () => assert.fail('Must not retry a permanent error'),
      }),
    );
    assert.equal(calls, 1);
  }
  let calls = 0;
  await assert.rejects(
    verifyRegistry('0.12.0', integrity, {
      log: () => {},
      request: async () =>
        ++calls === 1
          ? Response.json({ name: manifest.name, version: '0.12.0', dist: { integrity } })
          : Response.json({ latest: '0.12.1' }),
    }),
    /advanced/,
  );
});

test('verification timeout reports the last failure and warns against republishing', async () => {
  await assert.rejects(
    verifyRegistry('0.12.0', integrity, {
      delays: [0, 1],
      sleep: async () => {},
      log: () => {},
      request: async () => new Response(null, { status: 404 }),
    }),
    /after 2 attempts: npm verification HTTP 404.*do not republish blindly/,
  );
});

test('stage summary distinguishes successful publication from incomplete verification and records', () => {
  const summary = releaseSummary({
    PUBLISH_RESULT: 'success',
    VERIFY_RESULT: 'failure',
    RECORD_RESULT: 'skipped',
    ARTIFACT_RESULT: 'success',
  });
  assert.match(summary, /Published to npm/);
  assert.match(summary, /Public verification: failure/);
  assert.match(summary, /Git tag \/ GitHub release: skipped/);
  assert.match(summary, /Complete npm release/);
  assert.match(releaseSummary({ PUBLISH_DECISION: 'false' }), /publication skipped/);
  assert.match(releaseSummary({ PUBLISH_RESULT: 'failure' }), /inspect npm/);
  assert.match(releaseSummary({}), /did not run/);
});

test('completion selects only retained artifacts from a finished publishing run on main', async () => {
  const run = {
    ...approvedRun,
    path: '.github/workflows/publish-package.yml',
    event: 'workflow_run',
    conclusion: 'failure',
  };
  const event = { inputs: { publish_run_id: '123' } };
  const artifacts = {
    total_count: 3,
    artifacts: [
      { id: 1, name: 'npm-release-1', expired: false },
      { id: 2, name: 'npm-release-2', expired: false },
      { id: 3, name: 'unrelated', expired: false },
    ],
  };
  const read = (value) => async (url) => ({
    ok: true,
    json: async () => (url.endsWith('/artifacts?per_page=100') ? value : run),
  });
  assert.equal(await resolveCompletionArtifact(event, recoveryEnv, read(artifacts)), 2);
  await assert.rejects(
    resolveCompletionArtifact(
      event,
      recoveryEnv,
      read({ total_count: 1, artifacts: [{ id: 1, name: 'npm-release-1', expired: true }] }),
    ),
    /No retained bundle/,
  );
  for (const invalid of [
    { path: '.github/workflows/ci.yml' },
    { head_branch: 'feature' },
    { head_repository: { full_name: 'other/repository' } },
    { status: 'in_progress' },
  ]) {
    await assert.rejects(
      resolveCompletionArtifact(event, recoveryEnv, async () => ({
        ok: true,
        json: async () => ({ ...run, ...invalid }),
      })),
    );
  }
});

test('completion has neither a publication command nor an npm token or OIDC permission', () => {
  const workflow = readFileSync(
    new URL('../complete-package-release.yml', import.meta.url),
    'utf8',
  );
  assert.ok(!workflow.includes('npm publish'));
  assert.ok(!workflow.includes('id-token:'));
  assert.ok(!workflow.includes('NPM_TOKEN'));
  assert.ok(workflow.includes('release-package.mjs verify'));
  assert.ok(workflow.includes('release-package.mjs record'));
  const publish = readFileSync(new URL('../publish-package.yml', import.meta.url), 'utf8');
  assert.ok(publish.includes('id-token: write'));
  assert.ok(!publish.includes('secrets.NPM_TOKEN'));
  assert.ok(
    publish.indexOf('actions/upload-artifact@') <
      publish.indexOf('- name: Publish the verified tarball'),
  );
});

test('actual npm dry-run accepts the retained local tarball without publishing', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'coreai-npm-path-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  mkdirSync(join(directory, 'package-artifacts'));
  writeFileSync(
    join(directory, 'package.json'),
    JSON.stringify({
      name: 'coreai-release-path-smoke-test',
      version: '0.0.0',
      license: 'MIT',
    }),
  );
  const env = { ...process.env };
  delete env.NODE_AUTH_TOKEN;
  delete env.NPM_TOKEN;
  const options = {
    cwd: directory,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 30_000,
  };
  execSync('npm pack --ignore-scripts --pack-destination package-artifacts', options);
  const output = execSync(
    'npm publish ./package-artifacts/coreai-release-path-smoke-test-0.0.0.tgz --dry-run --ignore-scripts --access public --registry https://registry.npmjs.org/ --json',
    options,
  );
  assert.equal(JSON.parse(output).id, 'coreai-release-path-smoke-test@0.0.0');
});
