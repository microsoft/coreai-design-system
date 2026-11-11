// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';
import { parse } from 'yaml';

test('Pages validates PRs but deploys only the verified testing branch without Azure', async () => {
  const source = await fs.readFile(new URL('../docs.yml', import.meta.url), 'utf8');
  const workflow = parse(source);
  assert.deepEqual(workflow.on.pull_request.branches, ['main']);
  assert.deepEqual(workflow.on.push.branches, ['feat/static-storybook-markdown']);
  assert.match(
    workflow.jobs.deploy.if,
    /github\.ref == 'refs\/heads\/feat\/static-storybook-markdown'/,
  );
  assert.match(workflow.jobs.deploy.if, /github\.event_name != 'pull_request'/);
  assert.equal(workflow.jobs.deploy.needs, 'build');
  const steps = workflow.jobs.build.steps;
  const verify = steps.findIndex((step) => step.run?.includes('run verify'));
  const upload = steps.findIndex((step) => step.uses?.startsWith('actions/upload-pages-artifact@'));
  assert.ok(verify >= 0 && upload > verify);
  assert.equal(steps[upload].with.path, 'apps/docsite/dist');
  assert.doesNotMatch(source, /azure\/login|az webapp|pull_request_target|secrets\./);
});
