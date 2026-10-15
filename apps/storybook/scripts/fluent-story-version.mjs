// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export function assertFluentStoryVersion(expected, installed, source = expected) {
  if (installed !== expected || source !== expected) {
    throw new Error(
      `Fluent story version mismatch: pinned ${expected}, installed ${installed}, source ${source}. ` +
        'Resolve the exact installed @fluentui/react-components release tag, update version/ref ' +
        'in scripts/setup-fluent-stories.mjs, then run stories:update.',
    );
  }
}
