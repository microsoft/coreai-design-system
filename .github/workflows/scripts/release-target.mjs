// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const repository = 'microsoft/coreai-design-system';

export async function resolveReleaseTarget(event, env, request = fetch) {
  assert.equal(env.GITHUB_REPOSITORY, repository, 'Unexpected release repository');
  let run;
  if (env.GITHUB_EVENT_NAME === 'workflow_dispatch') {
    assert.equal(env.GITHUB_REF, 'refs/heads/main', 'Dispatch recovery from main only');
    const id = event.inputs?.ci_run_id;
    assert.match(id ?? '', /^[1-9]\d*$/, 'Specify the original CI run ID');
    assert.ok(env.GH_TOKEN, 'Missing GitHub token for CI verification');
    const response = await request(
      `https://api.github.com/repos/${repository}/actions/runs/${id}`,
      {
        headers: {
          Authorization: `Bearer ${env.GH_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        signal: AbortSignal.timeout(30_000),
      },
    );
    assert.ok(response.ok, `Cannot verify original CI run: HTTP ${response.status}`);
    run = await response.json();
  } else {
    assert.equal(env.GITHUB_EVENT_NAME, 'workflow_run', 'Unexpected release event');
    run = event.workflow_run;
  }
  assert.equal(run?.repository?.full_name, repository, 'CI run belongs to another repository');
  assert.equal(
    run.head_repository?.full_name,
    repository,
    'CI source belongs to another repository',
  );
  assert.equal(run.path, '.github/workflows/ci.yml', 'Select a CI workflow run');
  assert.equal(run.event, 'push', 'Select a push CI run');
  assert.equal(run.head_branch, 'main', 'Select a main CI run');
  assert.equal(run.status, 'completed', 'CI has not completed');
  assert.equal(run.conclusion, 'success', 'CI must have succeeded');
  assert.match(run.head_sha ?? '', /^[0-9a-f]{40}$/, 'Invalid CI source SHA');
  return run.head_sha;
}

export async function resolveCompletionArtifact(event, env, request = fetch) {
  assert.equal(env.GITHUB_REPOSITORY, repository);
  assert.equal(env.GITHUB_EVENT_NAME, 'workflow_dispatch');
  assert.equal(env.GITHUB_REF, 'refs/heads/main', 'Complete from main only');
  assert.ok(env.GH_TOKEN, 'Missing GitHub token');
  const id = event.inputs?.publish_run_id;
  assert.match(id ?? '', /^[1-9]\d*$/, 'Specify the original publishing run ID');
  const read = async (path) => {
    const response = await request(`https://api.github.com/repos/${repository}/${path}`, {
      headers: {
        Authorization: `Bearer ${env.GH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(30_000),
    });
    assert.ok(response.ok, `Cannot read release artifact provenance: HTTP ${response.status}`);
    return response.json();
  };
  const run = await read(`actions/runs/${id}`);
  assert.equal(run.repository?.full_name, repository);
  assert.equal(run.head_repository?.full_name, repository);
  assert.equal(run.path, '.github/workflows/publish-package.yml', 'Select a publishing run');
  assert.equal(run.head_branch, 'main', 'Select a main publishing run');
  assert.ok(
    ['workflow_run', 'workflow_dispatch'].includes(run.event),
    'Unexpected publishing event',
  );
  assert.equal(run.status, 'completed', 'Wait until publishing has stopped before completion');
  const result = await read(`actions/runs/${id}/artifacts?per_page=100`);
  assert.ok(result.total_count <= 100, 'Too many artifacts; select a more recent publishing run');
  const artifacts = result.artifacts
    .filter((artifact) => /^npm-release-[1-9]\d*$/.test(artifact.name) && !artifact.expired)
    .sort((a, b) => b.id - a.id);
  assert.ok(
    artifacts.length,
    'No retained bundle. Do not rebuild or republish blindly; inspect the original release',
  );
  assert.ok(Number.isSafeInteger(artifacts[0].id) && artifacts[0].id > 0);
  return artifacts[0].id;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    assert.ok(process.env.GITHUB_OUTPUT, 'Missing GITHUB_OUTPUT');
    if (process.argv[2] === 'complete') {
      const artifact = await resolveCompletionArtifact(event, process.env);
      appendFileSync(process.env.GITHUB_OUTPUT, `artifact=${artifact}\n`);
      console.log(`Retained release artifact: ${artifact}`);
    } else {
      const sha = await resolveReleaseTarget(event, process.env);
      appendFileSync(process.env.GITHUB_OUTPUT, `sha=${sha}\n`);
      console.log(`CI-approved release commit: ${sha}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
