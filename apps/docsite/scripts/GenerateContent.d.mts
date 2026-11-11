// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export function generateContent(options?: {
  outputDirectory?: string;
  snapshotPath?: string | URL;
  indexPath?: string | null;
  refresh?: boolean;
  storybookRoot?: string;
  indexUrl?: string;
  contentDirectory?: URL;
  storybookMarkdownDirectory?: string | null;
  requireStorybookMarkdown?: boolean;
}): Promise<void>;
