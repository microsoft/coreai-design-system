// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { StoryObj } from '@storybook/react-vite';
import { figmaDesign } from '../../utils/figma';
import { Divider, Text } from '@coreai-ds/react-components';

// `Divider` is the CoreAI-wrapped divider — a styled `<hr>` that keeps only
// `appearance`, `inset`, and `vertical` (no inline content/label support).

/**
 * Unlike Fluent's `Divider`, this `Divider` drops the `children` and
 * `alignContent` props entirely — there's no inline content/label slot, just
 * a plain line. Use it purely to visually separate two pieces of content, as
 * below. If you need a labelled divider, use the Fluent-compatible
 * `DividerLabeled` export instead.
 */
export const Default: StoryObj = {
  render: () => {
    const styles = /* css */ `
      .divider-example {
        display: flex;
        flex-direction: column;
        row-gap: var(--spacingVerticalM);
        max-width: 480px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="divider-example">
          <Text as="p" block>
            Q3 revenue grew 12% year-over-year, driven primarily by increased adoption in the
            enterprise segment.
          </Text>
          <Divider />
          <Text as="p" block>
            Looking ahead to Q4, the team is prioritizing platform stability and onboarding
            improvements for new customers.
          </Text>
        </div>
      </>
    );
  },
};

/**
 * A divider visually separates two pieces of content.
 *
 * @summary Visually separates two pieces of content.
 */
export default {
  title: 'Components/Divider',
  component: Divider,
  parameters: { ...figmaDesign('Divider') },
};
