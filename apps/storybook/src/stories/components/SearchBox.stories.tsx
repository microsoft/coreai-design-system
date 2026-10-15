// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Field,
  SearchBox,
  type JSXElement,
  type SearchBoxProps,
} from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (props: SearchBoxProps): JSXElement => {
  return (
    <Field label="Sample SearchBox">
      <SearchBox {...props} />
    </Field>
  );
};

Default.argTypes = {
  // Add these native props to the props table and controls pane
  placeholder: {
    description:
      'Placeholder text for the SearchBox. If using this instead of a label (which is ' +
      'not recommended), be sure to provide an `aria-label` for screen reader users.',
    type: { name: 'string', required: false }, // for inferring control type
    table: { type: { summary: 'string' } }, // for showing type in prop table
  },
  disabled: {
    description: 'Whether the SearchBox is disabled',
    type: { name: 'boolean', required: false },
    table: { type: { summary: 'boolean' } },
  },
  // Hide these from the props table and controls pane
  children: { table: { disable: true } },
  as: { table: { disable: true } },
};

/**
 * The `SearchBox` component allows the users to access information with ease, providing flexibility and the ability to clear and filter the search.
 *
 * @summary Input specialized for entering search queries.
 */
export default {
  title: 'Components/SearchBox',
  component: SearchBox,
  parameters: {
    ...figmaDesign('SearchBox'),
  },
};
