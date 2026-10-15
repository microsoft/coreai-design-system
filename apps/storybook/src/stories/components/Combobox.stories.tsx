// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { figmaDesign } from '../../utils/figma';
import { useId, Combobox, Option } from '@coreai-ds/react-components';
import type { StoryObj } from '@storybook/react-vite';

// CoreAI's `Combobox` supports an inline `label` and `truncateTextOverflow`.

// ---------- Default (canonical Fluent story) ----------

export const Default: StoryObj = {
  render: () => {
    const comboId = useId('combo-default');
    const options = ['Cat', 'Dog', 'Ferret', 'Fish', 'Hamster', 'Snake'];
    const styles = /* css */ `
      .combobox-default-example {
        display: grid;
        grid-template-rows: repeat(1fr);
        justify-items: start;
        gap: var(--spacingVerticalXXS);
        max-width: 400px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="combobox-default-example">
          <label id={comboId}>Best pet</label>
          <Combobox aria-labelledby={comboId} placeholder="Select an animal">
            {options.map((option) => (
              <Option key={option} disabled={option === 'Ferret'}>
                {option}
              </Option>
            ))}
          </Combobox>
        </div>
      </>
    );
  },
};

export const InlineLabel: StoryObj = {
  render: () => {
    const statusOptions = ['Not started', 'In progress', 'Blocked', 'Completed'];
    const [status, setStatus] = React.useState<string>('');
    const styles = /* css */ `
      .combobox-inline-label-example {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        row-gap: var(--spacingVerticalL);
        max-width: 320px;
        padding: var(--spacingVerticalL);
      }

      .combobox-inline-label-example__field {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        row-gap: var(--spacingVerticalXS);
      }

      .combobox-inline-label-example__prop-label {
        font-family: var(--fontFamilyMonospace);
        font-size: var(--fontSizeBase200);
        color: var(--colorNeutralForeground3);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="combobox-inline-label-example">
          <div className="combobox-inline-label-example__field">
            <code className="combobox-inline-label-example__prop-label">label</code>
            <Combobox
              label="Status"
              placeholder="Select a status"
              value={status}
              selectedOptions={status ? [status] : []}
              clearable
              onOptionSelect={(_event, data) => setStatus(data.optionText ?? '')}
            >
              {statusOptions.map((option) => (
                <Option key={option}>{option}</Option>
              ))}
            </Combobox>
          </div>

          <div className="combobox-inline-label-example__field">
            <code className="combobox-inline-label-example__prop-label">label, dynamicWidth</code>
            <Combobox label="Status" dynamicWidth clearable onOptionSelect={() => undefined}>
              {statusOptions.map((option) => (
                <Option key={option}>{option}</Option>
              ))}
            </Combobox>
          </div>
        </div>
      </>
    );
  },
};

export const Truncate: StoryObj = {
  render: () => {
    const longOptions = [
      'Awaiting stakeholder review and final sign-off',
      'Blocked by an upstream dependency in another team',
      'In progress — implementation roughly halfway complete',
      'Completed and deployed to the production environment',
    ];
    const [status, setStatus] = React.useState<string>(longOptions[0]);
    const styles = /* css */ `
      .combobox-truncate-example {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        row-gap: var(--spacingVerticalL);
        max-width: 320px;
        padding: var(--spacingVerticalL);
      }

      .combobox-truncate-example__field {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        row-gap: var(--spacingVerticalXS);
      }

      .combobox-truncate-example__prop-label {
        font-family: var(--fontFamilyMonospace);
        font-size: var(--fontSizeBase200);
        color: var(--colorNeutralForeground3);
      }

      .combobox-truncate-example__combobox {
        width: 220px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="combobox-truncate-example">
          <div className="combobox-truncate-example__field">
            <code className="combobox-truncate-example__prop-label">
              label, truncateTextOverflow
            </code>
            <Combobox
              className="combobox-truncate-example__combobox"
              label="Status"
              placeholder="Select a status"
              truncateTextOverflow
              value={status}
              selectedOptions={status ? [status] : []}
              clearable
              onOptionSelect={(_event, data) => setStatus(data.optionText ?? '')}
            >
              {longOptions.map((option) => (
                <Option key={option}>{option}</Option>
              ))}
            </Combobox>
          </div>

          <div className="combobox-truncate-example__field">
            <code className="combobox-truncate-example__prop-label">truncateTextOverflow</code>
            <Combobox
              className="combobox-truncate-example__combobox"
              placeholder="Select a status"
              truncateTextOverflow
              value={status}
              selectedOptions={status ? [status] : []}
              clearable
              onOptionSelect={(_event, data) => setStatus(data.optionText ?? '')}
            >
              {longOptions.map((option) => (
                <Option key={option}>{option}</Option>
              ))}
            </Combobox>
          </div>
        </div>
      </>
    );
  },
};

/**
 * A combobox (`Combobox`) combines a text field and a dropdown giving people a way to select an option from a list or enter their own choice.
 *
 * @summary Text field combined with a dropdown for selecting an option or typing a custom value.
 */
export default {
  title: 'Components/Combobox',
  component: Combobox,
  parameters: { ...figmaDesign('Combobox') },
};
