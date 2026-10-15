// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { useId, Label, Switch, Input } from '@coreai-ds/react-components';

// ---------- Appearance ----------

export const Appearance = () => {
  const idPrefix = 'input-appearance-story';
  const inputIds = {
    filledDarker: useId(idPrefix),
    outline: useId(idPrefix),
    underline: useId(idPrefix),
    filledLighter: useId(idPrefix),
  };

  const styles = /* css */ `
    .input-appearance-example {
      display: flex;
      flex-direction: column;
      max-width: 400px;
    }

    .input-appearance-example__field {
      display: grid;
      row-gap: var(--spacingVerticalXXS);
      margin-top: var(--spacingVerticalL);
    }

    .input-appearance-example__field--filled-lighter {
      margin-inline: -48px;
      padding-block: var(--spacingVerticalXXL);
      padding-inline: 48px;
      background-color: var(--colorNeutralBackground3);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="input-appearance-example">
        <div className="input-appearance-example__field">
          <Label htmlFor={inputIds.outline}>Outline appearance</Label>
          <Input appearance="outline" id={inputIds.outline} />
        </div>
        <div className="input-appearance-example__field">
          <Label htmlFor={inputIds.filledDarker}>Filled darker appearance (CoreAI default)</Label>
          <Input appearance="filled-darker" id={inputIds.filledDarker} />
        </div>
        <div className="input-appearance-example__field input-appearance-example__field--filled-lighter">
          <Label htmlFor={inputIds.filledLighter}>Filled lighter appearance</Label>
          <Input appearance="filled-lighter" id={inputIds.filledLighter} />
        </div>
        <div className="input-appearance-example__field">
          <Label htmlFor={inputIds.underline}>Underline appearance</Label>
          <Input appearance="underline" id={inputIds.underline} />
        </div>
      </div>
    </>
  );
};

// ---------- Disabled ----------

export const Disabled = () => {
  const idPrefix = 'input-disabled-story';
  const inputIds = {
    default: useId(idPrefix),
    filledDarker: useId(idPrefix),
    filledLighter: useId(idPrefix),
    underline: useId(idPrefix),
  };

  const [disabled, setDisabled] = React.useState(true);

  const styles = /* css */ `
    .input-disabled-example {
      display: flex;
      flex-direction: column;
      max-width: 400px;
    }

    .input-disabled-example__field {
      display: grid;
      row-gap: var(--spacingVerticalXXS);
      margin-top: var(--spacingVerticalL);
    }

    .input-disabled-example__field--filled-lighter {
      margin-inline: -48px;
      padding-block: var(--spacingVerticalXXL);
      padding-inline: 48px;
      background-color: var(--colorNeutralBackground3);
    }

    .input-disabled-example__toggle {
      margin-top: var(--spacingVerticalXL);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="input-disabled-example">
        <div className="input-disabled-example__field">
          <Label htmlFor={inputIds.default}>Disabled (outline appearance)</Label>
          <Input
            appearance="outline"
            disabled={disabled}
            id={inputIds.default}
            defaultValue="disabled value"
          />
        </div>
        <div className="input-disabled-example__field">
          <Label htmlFor={inputIds.filledDarker}>
            Disabled (filled darker appearance, CoreAI default)
          </Label>
          <Input
            appearance="filled-darker"
            disabled={disabled}
            id={inputIds.filledDarker}
            defaultValue="disabled value"
          />
        </div>
        <div className="input-disabled-example__field input-disabled-example__field--filled-lighter">
          <Label htmlFor={inputIds.filledLighter}>Disabled (filled lighter appearance)</Label>
          <Input
            appearance="filled-lighter"
            disabled={disabled}
            id={inputIds.filledLighter}
            defaultValue="disabled value"
          />
        </div>
        <div className="input-disabled-example__field">
          <Label htmlFor={inputIds.underline}>Disabled (underline appearance)</Label>
          <Input
            appearance="underline"
            disabled={disabled}
            id={inputIds.underline}
            defaultValue="disabled value"
          />
        </div>
        <Switch
          className="input-disabled-example__toggle"
          checked={disabled}
          label="Disabled"
          onChange={(_e, data) => setDisabled(data.checked)}
        />
      </div>
    </>
  );
};

export default {
  title: 'Components/Input',
  component: Input,
};
