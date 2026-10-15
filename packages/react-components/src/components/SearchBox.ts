// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  SearchBox as FluentSearchBox,
  type ForwardRefComponent,
  type SearchBoxProps as FluentSearchBoxProps,
} from '@fluentui/react-components';

import {
  withComponentDefaults,
  type WithDefaultPropDocs,
} from '../contexts/withComponentDefaults.js';

interface CoreAISearchBoxAppearanceProps {
  /**
   * Controls the colors and borders of the input.
   * @default 'filled-darker'
   */
  appearance?: FluentSearchBoxProps['appearance'];
}

export type SearchBoxProps = WithDefaultPropDocs<
  FluentSearchBoxProps,
  CoreAISearchBoxAppearanceProps
>;

export const SearchBox = withComponentDefaults<SearchBoxProps>(FluentSearchBox, {
  appearance: 'filled-darker',
}) as ForwardRefComponent<SearchBoxProps>;
