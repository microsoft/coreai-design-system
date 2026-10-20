// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import semver from 'semver';

const packageName = '@coreai-ds/react-components';
const repository = 'microsoft/coreai-design-system';
const manifestPath = 'packages/react-components/package.json';
const changelogPath = 'packages/react-components/CHANGELOG.md';
const registry = 'https://registry.npmjs.org';

export function validateRelease(manifest, changelog, previous) {
  assert.equal(manifest.name, packageName);
  assert.equal(semver.valid(manifest.version), manifest.version, 'Invalid release version');
  assert.ok(semver.gt(manifest.version, previous), 'Release version must increase');
  assert.equal(manifest.private, false);
  assert.equal(manifest.repository.url, `git+https://github.com/${repository}.git`);
  assert.equal(manifest.publishConfig.registry, `${registry}/`);
  assert.equal(manifest.publishConfig.access, 'public');
  assert.equal(manifest.license, 'MIT');
  const heading = `## [${manifest.version}] - `;
  const section = changelog.split('\n').findIndex((line) => line.startsWith(heading));
  assert.ok(section >= 0, 'Roll the changelog before publishing');
  const lines = changelog.split('\n').slice(section + 1);
  const end = lines.findIndex((line) => line.startsWith('## '));
  const notes = (end < 0 ? lines : lines.slice(0, end)).join('\n').trim();
  assert.ok(notes, 'Release notes must not be empty');
  return notes;
}

export async function readRegistry(request = fetch) {
  const response = await request(`${registry}/${encodeURIComponent(packageName)}`, {
    signal: AbortSignal.timeout(30_000),
  });
  if (response.status === 404) return null;
  assert.equal(response.status, 200, `npm registry lookup failed: HTTP ${response.status}`);
  const metadata = await response.json();
  assert.equal(metadata.name, packageName, 'Unexpected registry package');
  assert.ok(metadata.versions && typeof metadata.versions === 'object', 'Missing npm versions');
  return metadata;
}

export function publishDecision(version, metadata, integrity) {
  if (metadata === null) {
    assert.equal(version, '0.12.0', 'Only 0.12.0 is approved as the initial public release');
    return 'publish';
  }
  const existing = metadata.versions[version];
  if (existing) {
    assert.equal(
      existing.dist?.integrity,
      integrity,
      'Published tarball differs; refusing recovery',
    );
    return 'recover';
  }
  const versions = Object.keys(metadata.versions);
  assert.ok(versions.length > 0 && versions.every((v) => semver.valid(v)), 'Invalid npm versions');
  const stable = versions.filter((v) => !semver.prerelease(v));
  const baseline = semver.prerelease(version) ? versions : stable;
  assert.ok(
    baseline.every((v) => semver.gt(version, v)),
    'Release must be newer than published versions in its channel',
  );
  return 'publish';
}

export function verifyPublication(version, metadata, integrity) {
  assert.equal(metadata?.versions?.[version]?.dist?.integrity, integrity, 'npm integrity mismatch');
  const channel = semver.prerelease(version) ? 'next' : 'latest';
  assert.equal(metadata['dist-tags']?.[channel], version, `npm ${channel} does not match`);
}

export class RegistryRetryError extends Error {}

export async function registryJson(url, request = fetch, log = console.log) {
  let response;
  try {
    response = await request(url, {
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    throw new RegistryRetryError(`Registry transport failure: ${error.cause?.code ?? error.name}`, {
      cause: error,
    });
  }
  const cache = ['age', 'cache-control', 'cf-cache-status', 'x-cache', 'retry-after']
    .map((name) => `${name}=${response.headers.get(name) ?? '-'}`)
    .join(', ');
  log(`npm verification: HTTP ${response.status}, ${cache}`);
  if ([404, 408, 429].includes(response.status) || response.status >= 500) {
    throw new RegistryRetryError(`npm verification HTTP ${response.status}`);
  }
  assert.equal(response.status, 200, `npm verification refused: HTTP ${response.status}`);
  return response.json();
}

export async function verifyRegistry(
  version,
  integrity,
  {
    request = fetch,
    sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay)),
    log = console.log,
    delays = [0, 5000, 10000, 20000, 40000, 60000, 60000, 60000, 60000],
  } = {},
) {
  assert.ok(delays.length > 0, 'Verification needs at least one attempt');
  let last;
  for (const [attempt, delay] of delays.entries()) {
    if (delay) await sleep(delay);
    log(`npm public verification attempt ${attempt + 1}/${delays.length}`);
    try {
      const published = await registryJson(
        `${registry}/${encodeURIComponent(packageName)}/${version}`,
        request,
        log,
      );
      assert.equal(published.name, packageName, 'Unexpected registry package');
      assert.equal(published.version, version, 'Unexpected registry version');
      assert.equal(published.dist?.integrity, integrity, 'npm integrity mismatch');
      const tags = await registryJson(
        `${registry}/-/package/${encodeURIComponent(packageName)}/dist-tags`,
        request,
        log,
      );
      assert.ok(
        tags && typeof tags === 'object' && !Array.isArray(tags),
        'Malformed npm dist-tags',
      );
      const channel = semver.prerelease(version) ? 'next' : 'latest';
      assert.ok(
        tags[channel] === undefined || semver.valid(tags[channel]),
        'Invalid npm channel version',
      );
      if (tags[channel] !== version) {
        if (semver.valid(tags[channel]) && semver.gt(tags[channel], version)) {
          throw new Error(
            `npm ${channel} has advanced to ${tags[channel]}; do not replay publication`,
          );
        }
        throw new RegistryRetryError(
          `npm ${channel} is ${tags[channel] ?? 'absent'}; awaiting ${version}`,
        );
      }
      return;
    } catch (error) {
      if (!(error instanceof RegistryRetryError)) throw error;
      last = error.message;
      log(`Waiting for public registry visibility: ${last}`);
    }
  }
  throw new Error(
    `Public verification incomplete after ${delays.length} attempts: ${last}. ` +
      'Publication may have succeeded. Use completion recovery; do not republish blindly.',
  );
}

async function github(path, method = 'GET', body) {
  assert.ok(process.env.GH_TOKEN, 'Missing GitHub release token');
  const response = await fetch(`https://api.github.com/repos/${repository}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30_000),
  });
  if (method === 'GET' && response.status === 404) return null;
  assert.ok(response.ok, `GitHub ${method} ${path} failed: HTTP ${response.status}`);
  return response.json();
}

export async function checkTag(tag, sha, request = github) {
  const ref = await request(`git/ref/tags/${tag}`);
  if (!ref) return false;
  let object = ref.object;
  while (object.type === 'tag') {
    object = (await request(`git/tags/${object.sha}`)).object;
  }
  assert.equal(object.type, 'commit');
  assert.equal(object.sha, sha, 'Release tag already points to another commit');
  return true;
}

export async function recordRelease(version, sha, notes, request = github) {
  const tag = `v${version}`;
  if (!(await checkTag(tag, sha, request))) {
    await request('git/refs', 'POST', { ref: `refs/tags/${tag}`, sha });
  }
  const existing = await request(`releases/tags/${tag}`);
  if (existing) {
    assert.equal(existing.draft, false, 'Existing release is still a draft');
    return;
  }
  await request('releases', 'POST', {
    tag_name: tag,
    target_commitish: sha,
    name: tag,
    body: notes,
    prerelease: Boolean(semver.prerelease(version)),
    make_latest: semver.prerelease(version) ? 'false' : 'true',
  });
}

function output(name, value) {
  assert.ok(process.env.GITHUB_OUTPUT, 'Missing GITHUB_OUTPUT');
  appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
}

function releaseContext() {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const previous = JSON.parse(
    execFileSync('git', ['show', `HEAD^:${manifestPath}`], { encoding: 'utf8' }),
  ).version;
  const notes = validateRelease(manifest, readFileSync(changelogPath, 'utf8'), previous);
  for (const license of ['LICENSE-CODE', 'packages/react-components/LICENSE']) {
    assert.ok(
      readFileSync(license, 'utf8').includes('MIT License'),
      `Missing MIT license: ${license}`,
    );
  }
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  assert.equal(sha, process.env.RELEASE_SHA, 'Checkout differs from CI-approved commit');
  execFileSync('git', ['merge-base', '--is-ancestor', sha, 'origin/main']);
  return { manifest, notes, sha };
}

export function createBundle() {
  const { manifest, notes, sha } = releaseContext();
  const files = readdirSync('package-artifacts').filter((name) => name.endsWith('.tgz'));
  assert.equal(files.length, 1, 'Expected exactly one release tarball');
  const filename = files[0];
  assert.match(filename, /^[a-z0-9.-]+\.tgz$/, 'Unsafe release tarball name');
  const integrity = `sha512-${createHash('sha512')
    .update(readFileSync(`package-artifacts/${filename}`))
    .digest('base64')}`;
  const bundle = {
    name: packageName,
    version: manifest.version,
    sha,
    filename,
    integrity,
    notes,
    channel: semver.prerelease(manifest.version) ? 'next' : 'latest',
  };
  writeFileSync('package-artifacts/release.json', `${JSON.stringify(bundle, null, 2)}\n`);
  return bundle;
}

export function loadBundle() {
  const bundle = JSON.parse(readFileSync('package-artifacts/release.json', 'utf8'));
  assert.equal(bundle.name, packageName);
  assert.equal(semver.valid(bundle.version), bundle.version, 'Invalid artifact version');
  assert.match(bundle.sha ?? '', /^[0-9a-f]{40}$/, 'Invalid artifact source SHA');
  if (process.env.RELEASE_SHA)
    assert.equal(bundle.sha, process.env.RELEASE_SHA, 'Artifact source mismatch');
  assert.match(bundle.filename ?? '', /^[a-z0-9.-]+\.tgz$/, 'Unsafe release tarball name');
  const source = (revision, path) =>
    execFileSync('git', ['show', `${revision}:${path}`], { encoding: 'utf8' });
  execFileSync('git', ['merge-base', '--is-ancestor', bundle.sha, 'origin/main']);
  const manifest = JSON.parse(source(bundle.sha, manifestPath));
  const previous = JSON.parse(source(`${bundle.sha}^`, manifestPath));
  const notes = validateRelease(manifest, source(bundle.sha, changelogPath), previous.version);
  assert.equal(bundle.version, manifest.version, 'Artifact version differs from source');
  assert.equal(bundle.notes, notes, 'Artifact release notes differ from source');
  assert.equal(bundle.channel, semver.prerelease(bundle.version) ? 'next' : 'latest');
  const integrity = `sha512-${createHash('sha512')
    .update(readFileSync(`package-artifacts/${bundle.filename}`))
    .digest('base64')}`;
  assert.equal(bundle.integrity, integrity, 'Retained tarball checksum mismatch');
  return bundle;
}

export function releaseSummary(env) {
  const publication =
    env.PUBLISH_RESULT === 'success'
      ? 'Published to npm.'
      : env.PUBLISH_DECISION === 'false'
        ? 'Existing npm version matches the retained artifact; publication skipped.'
        : env.PUBLISH_RESULT === 'failure'
          ? 'Publish command failed; inspect npm before any retry.'
          : 'Publish command did not run in this attempt.';
  return [
    '## npm release status',
    `- Publication: ${publication}`,
    `- Public verification: ${env.VERIFY_RESULT || 'not run'}`,
    `- Git tag / GitHub release: ${env.RECORD_RESULT || 'not run'}`,
    `- Retained artifact upload: ${env.ARTIFACT_RESULT || 'not applicable (completion recovery)'}`,
    '',
    'If publication succeeded but completion failed, use **Complete npm release** with the original publishing run ID. Do not bump or republish to repair release records.',
    '',
  ].join('\n');
}

export async function main(command = process.argv[2]) {
  if (command === 'summary') {
    assert.ok(process.env.GITHUB_STEP_SUMMARY, 'Missing GITHUB_STEP_SUMMARY');
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, releaseSummary(process.env));
    return;
  }
  if (command === 'bundle') {
    createBundle();
    return;
  }
  const bundle = loadBundle();
  const { version, integrity, sha, notes, filename, channel } = bundle;
  if (process.env.CONFIRMATION) {
    assert.equal(
      process.env.CONFIRMATION,
      `complete ${packageName}@${version}`,
      'Completion confirmation does not match artifact',
    );
  }
  const verification = {
    sha,
    integrity,
    run: process.env.GITHUB_RUN_ID,
    attempt: process.env.GITHUB_RUN_ATTEMPT,
  };
  if (command === 'verify') {
    assert.ok(verification.run && verification.attempt, 'Missing verification workflow identity');
    await verifyRegistry(version, integrity);
    writeFileSync('package-artifacts/verified.json', JSON.stringify(verification));
    return;
  }
  if (command === 'record') {
    assert.ok(verification.run && verification.attempt, 'Missing recording workflow identity');
    assert.deepEqual(
      JSON.parse(readFileSync('package-artifacts/verified.json', 'utf8')),
      verification,
      'Verify this artifact in the current workflow attempt before recording',
    );
    return recordRelease(version, sha, notes);
  }
  if (command === 'inspect') {
    assert.equal(
      process.env.CONFIRMATION,
      `complete ${packageName}@${version}`,
      'Confirm completion of this package/version',
    );
    return;
  }
  assert.equal(command, 'prepare');
  const decision = publishDecision(version, await readRegistry(), integrity);
  await checkTag(`v${version}`, sha);
  output('publish', decision === 'publish');
  output('version', version);
  output('integrity', integrity);
  output('tarball', `./package-artifacts/${filename}`);
  output('channel', channel);
  console.log(`${decision}: ${packageName}@${version} at ${sha}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
