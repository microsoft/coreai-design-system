// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { figmaDesign } from '../../utils/figma';
import { type JSXElement, DropdownButton, Option } from '@coreai-ds/react-components';
// `DropdownButton` renders a `Dropdown` with a button-style trigger and a
// required inline `label`.

const sortOptions = ['Newest', 'Oldest', 'Most popular', 'Trending'];

/**
 * With no `value`/`selectedOptions`, `DropdownButton` renders just its
 * `label` (e.g. `Sort by`) instead of a `label: value` pair — it reads like a
 * menu trigger until an option is picked. Pass `clearable` if users should be
 * able to return to this unselected state after choosing a value.
 */
export const Default = (): JSXElement => (
  <DropdownButton label="Sort by" clearable onOptionSelect={() => undefined}>
    {sortOptions.map((option) => (
      <Option key={option}>{option}</Option>
    ))}
  </DropdownButton>
);

/**
 * A `Dropdown` whose trigger is rendered with native Fluent `Button` chrome — a
 * compact, labelled, button-like trigger (e.g. `Sort by: Newest`) instead of a
 * text-input-style field.
 *
 * @summary A Dropdown with a labelled, button-like trigger instead of an input field.
 */
export default {
  title: 'Components/Button/DropdownButton',
  component: DropdownButton,
  parameters: { ...figmaDesign('Dropdown button') },
};
