// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const packages = ['@fluentui/react-components', '@fluentui/react-icons'];
export const manifestPath = 'packages/react-components/package.json';

export function updateBaseline(manifest, latest) {
  const updated = globalThis.structuredClone(manifest);
  const rows = [];
  for (const name of packages) {
    const version = latest[name];
    if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) {
      throw new Error(`Expected a stable release version for ${name}.`);
    }
    const current = manifest.devDependencies[name];
    if (!current) throw new Error(`Missing development dependency ${name}.`);
    if (current !== version) {
      updated.devDependencies[name] = version;
      rows.push(`| ${name} | ${current} | ${version} |`);
    }
  }
  return { updated, rows };
}

export function main() {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const latest = Object.fromEntries(
    packages.map((name) => [
      name,
      execFileSync('npm', ['view', `${name}@latest`, 'version'], { encoding: 'utf8' }).trim(),
    ]),
  );
  const { updated, rows } = updateBaseline(manifest, latest);
  appendFileSync(process.env.GITHUB_OUTPUT, `changed=${rows.length > 0}\n`);
  if (!rows.length) return;
  writeFileSync(manifestPath, `${JSON.stringify(updated, null, 2)}\n`);
  writeFileSync(
    '.fluent-update-pr.md',
    `## Fluent UI development baseline updates

| Package | Current | Latest |
| --- | --- | --- |
${rows.join('\n')}

The workflow validated the package against the latest development dependencies and the
unchanged minimum peer versions. This update does not change the supported consumer range.

Review the [Fluent UI releases](https://github.com/microsoft/fluentui/releases) and
check Storybook for visual regressions before merging.

**CI note:** pull requests created using \`GITHUB_TOKEN\` do not trigger other workflows.
A maintainer must close and reopen this PR to trigger required pull-request CI.
Do not bypass required checks.
`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
