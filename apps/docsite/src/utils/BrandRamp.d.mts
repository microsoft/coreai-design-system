// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export type BrandStep =
  10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100 | 110 | 120 | 130 | 140 | 150 | 160;

export const BRAND_STEPS: BrandStep[];

export function normalizeHex(value: unknown): string | undefined;

export function contrastRatio(a: string, b: string): number;

export function createBrandRamp(keyColor: string): Record<BrandStep, string>;
