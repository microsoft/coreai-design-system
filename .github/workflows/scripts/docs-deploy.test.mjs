// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { parse } from 'yaml';

test('Pages validates PRs but deploys only verified main output', async () => {
  const source = await fs.readFile(new URL('../docs.yml', import.meta.url), 'utf8');
  const workflow = parse(source);
  assert.deepEqual(workflow.on.pull_request.branches, ['main']);
  assert.deepEqual(workflow.on.push.branches, ['main']);
  assert.ok(Object.hasOwn(workflow.on, 'workflow_dispatch'));
  assert.match(workflow.jobs.deploy.if, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow.jobs.deploy.if, /github\.event_name != 'pull_request'/);
  assert.equal(workflow.jobs.deploy.needs, 'build');
  const steps = workflow.jobs.build.steps;
  const checkout = steps.find((step) => step.uses?.startsWith('actions/checkout@'));
  assert.equal(checkout.with['fetch-depth'], 0);
  const release = steps.findIndex((step) => step.run?.includes('run check:release'));
  const build = steps.findIndex((step) => step.run?.includes('run build'));
  assert.ok(release >= 0 && build > release);
  assert.equal(
    steps[release].if,
    "github.event_name == 'pull_request' || github.event_name == 'push'",
  );
  assert.equal(
    steps[release].env.DOCS_RELEASE_BASE,
    '${{ github.event.pull_request.base.sha || github.event.before }}',
  );
  assert.match(steps[release].run, /--base="\$DOCS_RELEASE_BASE"/);
  const verify = steps.findIndex((step) => step.run?.includes('run verify'));
  const upload = steps.findIndex((step) => step.uses?.startsWith('actions/upload-pages-artifact@'));
  assert.ok(verify >= 0 && upload > verify);
  assert.equal(steps[upload].with.path, 'apps/docsite/dist');
  assert.doesNotMatch(source, /pull_request_target|secrets\./);
});
