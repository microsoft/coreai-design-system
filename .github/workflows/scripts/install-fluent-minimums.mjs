// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { manifestPath, packages } from './update-fluent.mjs';

export function peerMinimums(before, after) {
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    throw new Error('Fluent update changed the peer dependency compatibility floor.');
  }
  return Object.fromEntries(
    packages.map((name) => {
      const match = /^\^(\d+\.\d+\.\d+)$/.exec(after[name]);
      if (!match) throw new Error(`${name} must use a simple caret peer range.`);
      return [name, match[1]];
    }),
  );
}

export function main() {
  const before = JSON.parse(
    execFileSync('git', ['show', `HEAD:${manifestPath}`], { encoding: 'utf8' }),
  ).peerDependencies;
  const after = JSON.parse(readFileSync(manifestPath, 'utf8')).peerDependencies;
  const minimums = peerMinimums(before, after);
  execFileSync(
    'npm',
    [
      'install',
      '--no-save',
      '--package-lock=false',
      '--prefix',
      'packages/react-components',
      '--workspaces=false',
      ...Object.entries(minimums).map(([name, version]) => `${name}@${version}`),
    ],
    { stdio: 'inherit' },
  );
  const require = createRequire(path.resolve('packages/react-components/minimum-check.cjs'));
  for (const [name, expected] of Object.entries(minimums)) {
    let packagePath;
    try {
      packagePath = require.resolve(`${name}/package.json`);
    } catch {
      let directory = path.dirname(require.resolve(name));
      while (!existsSync(path.join(directory, 'package.json'))) {
        const parent = path.dirname(directory);
        if (parent === directory) throw new Error(`Cannot resolve package metadata for ${name}.`);
        directory = parent;
      }
      packagePath = path.join(directory, 'package.json');
    }
    const actual = JSON.parse(readFileSync(packagePath, 'utf8')).version;
    if (actual !== expected)
      throw new Error(`${name} did not resolve to its minimum peer version.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
