// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { figmaDesign } from '../../utils/figma';
import { useId, Label, Input } from '@coreai-ds/react-components';
import type { StoryObj } from '@storybook/react-vite';

// CoreAI's `Input` defaults to `filled-darker`, supports an inline `label`,
// and surfaces a `CopyButton` when `readOnly`.

// ---------- Default (canonical Fluent story) ----------

export const Default: StoryObj = {
  render: () => {
    const inputId = useId('input');
    const styles = /* css */ `
      .input-default-example {
        display: flex;
        flex-direction: column;
        gap: var(--spacingVerticalXXS);
        max-width: 400px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="input-default-example">
          <Label htmlFor={inputId}>Sample input</Label>
          <Input id={inputId} />
        </div>
      </>
    );
  },
};

// ---------- InlineLabel ----------

export const InlineLabel: StoryObj = {
  render: () => {
    const [name, setName] = React.useState<string>('');
    const styles = /* css */ `
      .input-inline-label-example {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        row-gap: var(--spacingVerticalL);
        max-width: 320px;
        padding: var(--spacingVerticalL);
      }

      .input-inline-label-example__field {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        row-gap: var(--spacingVerticalXS);
      }

      .input-inline-label-example__prop-label {
        font-family: var(--fontFamilyMonospace);
        font-size: var(--fontSizeBase200);
        color: var(--colorNeutralForeground3);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="input-inline-label-example">
          <div className="input-inline-label-example__field">
            <code className="input-inline-label-example__prop-label">label</code>
            <Input
              label="Name"
              placeholder="Enter a name"
              value={name}
              onChange={(_event, data) => setName(data.value)}
            />
          </div>

          <div className="input-inline-label-example__field">
            <code className="input-inline-label-example__prop-label">label, dynamicWidth</code>
            <Input label="Name" dynamicWidth placeholder="Enter a name" />
          </div>
        </div>
      </>
    );
  },
};

// ---------- ReadOnly ----------

export const ReadOnly: StoryObj = {
  render: () => {
    const idPrefix = 'input-readonly-story';
    const inputIds = {
      token: useId(idPrefix),
      editable: useId(idPrefix),
    };
    const styles = /* css */ `
      .input-read-only-example {
        display: flex;
        flex-direction: column;
        max-width: 400px;
      }

      .input-read-only-example__field {
        display: grid;
        row-gap: var(--spacingVerticalXXS);
        margin-top: var(--spacingVerticalL);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="input-read-only-example">
          <div className="input-read-only-example__field">
            <Label htmlFor={inputIds.token}>Read-only (with copy button)</Label>
            <Input readOnly id={inputIds.token} value="sk-9f3c1a7b2e4d6f80" />
          </div>

          <div className="input-read-only-example__field">
            <Input readOnly label="API key" value="sk-9f3c1a7b2e4d6f80" />
          </div>

          <div className="input-read-only-example__field">
            <Label htmlFor={inputIds.editable}>Editable (no copy button)</Label>
            <Input id={inputIds.editable} defaultValue="Type to edit me" />
          </div>
        </div>
      </>
    );
  },
};

/**
 * Input allows the user to enter and edit text.
 *
 * @summary Single-line field for entering and editing text.
 */
export default {
  title: 'Components/Input',
  component: Input,
  parameters: { ...figmaDesign('Input') },
};
