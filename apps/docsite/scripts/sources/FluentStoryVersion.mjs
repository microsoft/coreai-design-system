// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export function assertFluentStoryVersion(expected, installed, source = expected) {
  if (installed !== expected || source !== expected) {
    throw new Error(
      `Fluent story version mismatch: pinned ${expected}, installed ${installed}, source ${source}. ` +
        'Resolve the exact installed @fluentui/react-components release tag, update version/ref ' +
        'in apps/docsite/scripts/sources/SetupFluentStories.mjs, then run stories:update.',
    );
  }
}
