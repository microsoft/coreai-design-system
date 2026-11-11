// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { CoreAITheme, TextPreset, TextProps } from '@coreai-ds/react-components';

export interface FoundationData {
  colors: { name: string; token: keyof CoreAITheme; description: string }[];
  dataViz: { slot: string; label: string; description: string; value: string }[];
  typography: {
    strongPreset: TextPreset;
    strongLabel: string;
    regularPreset?: TextPreset;
    regularLabel?: string;
    fluent: string;
    usage: string;
  }[];
  fonts: {
    name: string;
    variant: NonNullable<TextProps['font']>;
    sample: string;
    suffix: string;
    token: string;
    description: string;
    download: string;
  }[];
}
