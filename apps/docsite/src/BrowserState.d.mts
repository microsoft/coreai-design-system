// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export function readStoredValue(
  storageName: 'localStorage' | 'sessionStorage',
  key: string,
): string | null;
export function writeStoredValue(
  storageName: 'localStorage' | 'sessionStorage',
  key: string,
  value: string,
): void;
export function fragmentId(hash: string): string | undefined;
export function revealFragment(hash: string): HTMLElement | null;
