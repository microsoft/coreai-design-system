// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync, readdirSync } from 'node:fs';
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

export async function main(command = process.argv[2]) {
  const { manifest, notes, sha } = releaseContext();
  const { version } = manifest;
  if (command === 'record') {
    await verifyRegistry(version, process.env.RELEASE_INTEGRITY);
    await recordRelease(version, sha, notes);
    return;
  }
  assert.equal(command, 'prepare');
  const files = readdirSync('package-artifacts').filter((name) => name.endsWith('.tgz'));
  assert.equal(files.length, 1, 'Expected exactly one release tarball');
  const tarball = `package-artifacts/${files[0]}`;
  const integrity = `sha512-${createHash('sha512').update(readFileSync(tarball)).digest('base64')}`;
  const decision = publishDecision(version, await readRegistry(), integrity);
  await checkTag(`v${version}`, sha);
  output('publish', decision === 'publish');
  output('version', version);
  output('integrity', integrity);
  output('tarball', tarball);
  output('channel', semver.prerelease(version) ? 'next' : 'latest');
  console.log(`${decision}: ${packageName}@${version} at ${sha}`);
}

async function verifyRegistry(version, integrity) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const metadata = await readRegistry();
    if (metadata?.versions?.[version]) {
      verifyPublication(version, metadata, integrity);
      return;
    }
    if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error('Published version is not visible on npm; inspect before rerunning');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
