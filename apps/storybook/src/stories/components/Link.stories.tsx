// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { StoryObj } from '@storybook/react-vite';
import { figmaDesign } from '../../utils/figma';
import { Link } from '@coreai-ds/react-components';

// CoreAI's `Link` adds an `external` prop.

// ---------- Default (canonical Fluent story) ----------

export const Default: StoryObj = {
  render: () => {
    return <Link href="https://www.bing.com">This is a link</Link>;
  },
};

export const External: StoryObj = {
  render: () => {
    const styles = /* css */ `
      .link-external-example {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        row-gap: var(--spacingVerticalL);
        padding: var(--spacingVerticalL);
      }

      .link-external-example__field {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        row-gap: var(--spacingVerticalXS);
      }

      .link-external-example__prop-label {
        font-family: var(--fontFamilyMonospace);
        font-size: var(--fontSizeBase200);
        color: var(--colorNeutralForeground3);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="link-external-example">
          <div className="link-external-example__field">
            <code className="link-external-example__prop-label">external={'{false}'}</code>
            <Link href="https://example.com">Internal link</Link>
          </div>

          <div className="link-external-example__field">
            <code className="link-external-example__prop-label">external</code>
            <Link href="https://example.com" external>
              External link
            </Link>
          </div>
        </div>
      </>
    );
  },
};

/**
 * Links allow users to navigate between different locations. They can be used as standalone controls or inline with text.
 *
 * @summary Navigates between locations, inline with text or standalone.
 */
export default {
  title: 'Components/Link',
  component: Link,
  parameters: { ...figmaDesign('Link') },
};
