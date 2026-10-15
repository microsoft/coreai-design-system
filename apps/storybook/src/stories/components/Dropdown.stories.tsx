// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { figmaDesign } from '../../utils/figma';
import { useId, Dropdown, Option } from '@coreai-ds/react-components';
import type { StoryObj } from '@storybook/react-vite';

// CoreAI's `Dropdown` supports an inline label rendered inside the trigger
// and `truncateTextOverflow`.

// ---------- Default (canonical Fluent story) ----------

export const Default: StoryObj = {
  render: () => {
    const dropdownId = useId('dropdown-default');
    const options = [
      'Cat',
      'Caterpillar',
      'Corgi',
      'Chupacabra',
      'Dog',
      'Ferret',
      'Fish',
      'Fox',
      'Hamster',
      'Snake',
    ];
    const styles = /* css */ `
      .dropdown-default-example {
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
        <div className="dropdown-default-example">
          <label htmlFor={dropdownId}>Best pet</label>
          <Dropdown id={dropdownId} placeholder="Select an animal">
            {options.map((option) => (
              <Option key={option} disabled={option === 'Ferret'}>
                {option}
              </Option>
            ))}
          </Dropdown>
        </div>
      </>
    );
  },
};

export const InlineLabel: StoryObj = {
  render: () => {
    const statusOptions = ['Not started', 'In progress', 'Blocked', 'Completed'];
    const [status, setStatus] = React.useState<string>('');
    const [dynamicStatus, setDynamicStatus] = React.useState<string>('');
    const styles = /* css */ `
      .dropdown-inline-label-example {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        row-gap: var(--spacingVerticalL);
        max-width: 320px;
        padding: var(--spacingVerticalL);
      }

      .dropdown-inline-label-example__field {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        row-gap: var(--spacingVerticalXS);
      }

      .dropdown-inline-label-example__prop-label {
        font-family: var(--fontFamilyMonospace);
        font-size: var(--fontSizeBase200);
        color: var(--colorNeutralForeground3);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="dropdown-inline-label-example">
          <div className="dropdown-inline-label-example__field">
            <code className="dropdown-inline-label-example__prop-label">label</code>
            <Dropdown
              label="Status"
              placeholder="Select a status"
              value={status}
              selectedOptions={status ? [status] : []}
              clearable
              onOptionSelect={(_event, data) => setStatus(data.optionValue ?? '')}
            >
              {statusOptions.map((option) => (
                <Option key={option}>{option}</Option>
              ))}
            </Dropdown>
          </div>

          <div className="dropdown-inline-label-example__field">
            <code className="dropdown-inline-label-example__prop-label">label, dynamicWidth</code>
            <Dropdown
              label="Status"
              dynamicWidth
              value={dynamicStatus}
              selectedOptions={dynamicStatus ? [dynamicStatus] : []}
              clearable
              onOptionSelect={(_event, data) => setDynamicStatus(data.optionValue ?? '')}
            >
              {statusOptions.map((option) => (
                <Option key={option}>{option}</Option>
              ))}
            </Dropdown>
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
      .dropdown-truncate-example {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        row-gap: var(--spacingVerticalL);
        max-width: 320px;
        padding: var(--spacingVerticalL);
      }

      .dropdown-truncate-example__field {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        row-gap: var(--spacingVerticalXS);
      }

      .dropdown-truncate-example__prop-label {
        font-family: var(--fontFamilyMonospace);
        font-size: var(--fontSizeBase200);
        color: var(--colorNeutralForeground3);
      }

      .dropdown-truncate-example__dropdown--narrow {
        width: 220px;
      }

      .dropdown-truncate-example__dropdown--narrower {
        width: 160px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="dropdown-truncate-example">
          <div className="dropdown-truncate-example__field">
            <code className="dropdown-truncate-example__prop-label">truncateTextOverflow</code>
            <Dropdown
              className="dropdown-truncate-example__dropdown--narrow"
              aria-label="Status"
              placeholder="Select a status"
              truncateTextOverflow
              value={status}
              selectedOptions={status ? [status] : []}
              clearable
              onOptionSelect={(_event, data) => setStatus(data.optionValue ?? '')}
            >
              {longOptions.map((option) => (
                <Option key={option}>{option}</Option>
              ))}
            </Dropdown>
          </div>

          <div className="dropdown-truncate-example__field">
            <code className="dropdown-truncate-example__prop-label">truncateTextOverflow</code>
            <Dropdown
              className="dropdown-truncate-example__dropdown--narrower"
              aria-label="Status"
              placeholder="Select a status"
              truncateTextOverflow
              value={status}
              selectedOptions={status ? [status] : []}
              clearable
              onOptionSelect={(_event, data) => setStatus(data.optionValue ?? '')}
            >
              {longOptions.map((option) => (
                <Option key={option}>{option}</Option>
              ))}
            </Dropdown>
          </div>
        </div>
      </>
    );
  },
};

/**
 * A Dropdown is a selection component composed of a button and a list of options. The button displays the current selected item or a placeholder, and the list is visible on demand by clicking the button. Dropdowns are typically used in forms.
 *
 * @summary Button paired with a list of options for selecting one or more values.
 */
export default {
  title: 'Components/Dropdown',
  component: Dropdown,
  parameters: { ...figmaDesign('Dropdown') },
};
