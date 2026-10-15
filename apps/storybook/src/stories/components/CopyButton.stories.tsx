// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { StoryObj } from '@storybook/react-vite';
import { CopyButton } from '@coreai-ds/react-components';

// `CopyButton` wraps the CoreAI `Button` with a copy icon and a "Copied"
// tooltip that appears briefly after a successful copy.

export const Default: StoryObj = {
  render: () => {
    const styles = /* css */ `
      .copy-button-example {
        display: flex;
        flex-direction: column;
        row-gap: var(--spacingVerticalL);
        align-items: flex-start;
        padding: var(--spacingVerticalL);
      }

      .copy-button-example__row {
        display: flex;
        align-items: center;
        column-gap: var(--spacingHorizontalS);
      }

      .copy-button-example__heading {
        margin: 0;
        font-size: var(--fontSizeBase200);
        color: var(--colorNeutralForeground3);
      }

      .copy-button-example__code {
        font-family: var(--fontFamilyMonospace);
        font-size: var(--fontSizeBase300);
        color: var(--colorNeutralForeground1);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="copy-button-example">
          <div className="copy-button-example__row">
            <p className="copy-button-example__heading">icon only</p>
            <CopyButton aria-label="Copy value" contentToCopy="Hello from CoreAI" />
          </div>

          <div className="copy-button-example__row">
            <code className="copy-button-example__code">npm i @coreai-ds/react-components</code>
            <CopyButton
              aria-label="Copy install command"
              contentToCopy="npm i @coreai-ds/react-components"
            />
          </div>

          <div className="copy-button-example__row">
            <p className="copy-button-example__heading">with text</p>
            <CopyButton aria-label="Copy value" contentToCopy="Hello from CoreAI">
              Copy
            </CopyButton>
          </div>
        </div>
      </>
    );
  },
};

/**
 * A `Button` preset for copy-to-clipboard actions: it copies the provided text,
 * swaps its icon to a checkmark, and shows a transient "Copied" tooltip.
 *
 * @summary A Button preset that copies text to the clipboard with transient confirmation.
 */
export default {
  title: 'Components/Button/CopyButton',
  component: CopyButton,
};
