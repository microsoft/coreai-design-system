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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const sha = await resolveReleaseTarget(event, process.env);
    assert.ok(process.env.GITHUB_OUTPUT, 'Missing GITHUB_OUTPUT');
    appendFileSync(process.env.GITHUB_OUTPUT, `sha=${sha}\n`);
    console.log(`CI-approved release commit: ${sha}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
