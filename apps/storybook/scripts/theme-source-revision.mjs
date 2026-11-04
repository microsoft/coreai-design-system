// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

export function themeSourceRevision(directory) {
  const hash = createHash('sha256');
  const files = readdirSync(directory, { recursive: true })
    .filter(
      (file) => /\.(?:tsx?|css)$/.test(file) && lstatSync(path.join(directory, file)).isFile(),
    )
    .sort();
  for (const file of files) {
    hash
      .update(file)
      .update('\0')
      .update(readFileSync(path.join(directory, file)))
      .update('\0');
  }
  return hash.digest('hex');
}
