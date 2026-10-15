// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Avatar,
  Field,
  Tag,
  TagPicker,
  TagPickerButton,
  TagPickerControl,
  TagPickerGroup,
  TagPickerInput,
  TagPickerList,
  TagPickerOption,
  type JSXElement,
  type TagPickerProps,
} from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

const options = [
  'John Doe',
  'Jane Doe',
  'Max Mustermann',
  'Erika Mustermann',
  'Pierre Dupont',
  'Amelie Dupont',
  'Mario Rossi',
  'Maria Rossi',
];

export const Default = (): JSXElement => {
  const [selectedOptions, setSelectedOptions] = React.useState<string[]>([]);
  const onOptionSelect: TagPickerProps['onOptionSelect'] = (e, data) => {
    if (data.value === 'no-options') {
      return;
    }
    setSelectedOptions(data.selectedOptions);
  };
  const tagPickerOptions = options.filter((option) => !selectedOptions.includes(option));

  return (
    <Field label="Select Employees" style={{ maxWidth: 400 }}>
      <TagPicker onOptionSelect={onOptionSelect} selectedOptions={selectedOptions}>
        <TagPickerControl>
          <TagPickerGroup aria-label="Selected Employees">
            {selectedOptions.map((option) => (
              <Tag
                key={option}
                shape="rounded"
                media={<Avatar aria-hidden name={option} color="colorful" />}
                value={option}
              >
                {option}
              </Tag>
            ))}
          </TagPickerGroup>
          <TagPickerInput aria-label="Select Employees" />
        </TagPickerControl>
        <TagPickerList>
          {tagPickerOptions.length > 0 ? (
            tagPickerOptions.map((option) => (
              <TagPickerOption
                media={<Avatar shape="square" aria-hidden name={option} color="colorful" />}
                value={option}
                key={option}
              >
                {option}
              </TagPickerOption>
            ))
          ) : (
            <TagPickerOption value="no-options">No options available</TagPickerOption>
          )}
        </TagPickerList>
      </TagPicker>
    </Field>
  );
};

/**
 * A `TagPicker` combines a text field and a dropdown giving people a way to select an option from a list or enter their own choice.
 * It is a specialized version of a `Combobox` where selecting an option from a list results in a `Tag` being added close to the text field.
 *
 * @summary Text field with a dropdown for selecting multiple tags or entering custom ones. Subcomponents: TagPickerControl, TagPickerGroup, TagPickerButton, TagPickerInput, TagPickerList, TagPickerOption.
 */
export default {
  title: 'Components/TagPicker',
  component: TagPicker,
  subcomponents: {
    TagPickerControl,
    TagPickerGroup,
    TagPickerButton,
    TagPickerInput,
    TagPickerList,
    TagPickerOption,
  },
  parameters: {
    ...figmaDesign('TagPicker'),
  },
};
