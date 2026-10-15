// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export function publicMarkdown(content, file) {
  return file.replaceAll('\\', '/').includes('/fluent-stories/')
    ? content.replace(
        /\[([^\]]+)\]\(https?:\/\/(?:[^/)]+\.)?(?:visualstudio\.com|dev\.azure\.com)\/[^)]+\)/gi,
        '$1',
      )
    : content;
}
