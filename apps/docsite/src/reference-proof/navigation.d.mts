// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export function groupNavigationEntries<T extends { path: string; title: string }>(
  entries: T[],
): { value: string; label: string; items: T[] }[];
export function normalizeReferencePath(pathname: string): string;
export function clientNavigationTarget(
  href: string,
  options: {
    currentUrl: string;
    basePath: string;
    paths: ReadonlySet<string>;
    button: number;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
    download: boolean;
    target: string;
  },
): string | undefined;
