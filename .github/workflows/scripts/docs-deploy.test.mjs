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
  const verify = steps.findIndex((step) => step.run?.includes('run verify'));
  const upload = steps.findIndex((step) => step.uses?.startsWith('actions/upload-pages-artifact@'));
  assert.ok(verify >= 0 && upload > verify);
  assert.equal(steps[upload].with.path, 'apps/docsite/dist');
  assert.doesNotMatch(source, /pull_request_target|secrets\./);
});
