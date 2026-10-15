// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Portal, ToggleButton } from '@coreai-ds/react-components';
import type { StoryObj } from '@storybook/react-vite';

import * as React from 'react';

export const Default: StoryObj = {
  render: () => {
    const [mountNode, setMountNode] = React.useState<HTMLElement | null>(null);
    const [open, setOpen] = React.useState(false);

    const styles = /* css */ `
      .portal-default-example__container {
        display: flex;
        gap: var(--spacingHorizontalS);
      }

      .portal-default-example__controls {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-width: 200px;
      }

      .portal-default-example__state {
        font-family: var(--fontFamilyMonospace);
        border: var(--strokeWidthThin) solid var(--colorNeutralStroke1);
        padding: var(--spacingHorizontalXS);
        text-align: center;
      }

      .portal-default-example__clipping-container {
        font-family: var(--fontFamilyBase);
        font-size: var(--fontSizeBase400);
        font-weight: var(--fontWeightSemibold);
        line-height: var(--lineHeightBase400);
        background-color: var(--colorNeutralBackground1);
        color: var(--colorNeutralForeground1);
        border: var(--strokeWidthThick) solid var(--colorNeutralStroke1);
        padding: var(--spacingVerticalXXL) var(--spacingHorizontalS);
        overflow: hidden;
      }

      .portal-default-example__portal-content {
        font-family: var(--fontFamilyBase);
        font-size: var(--fontSizeBase500);
        font-weight: var(--fontWeightSemibold);
        line-height: var(--lineHeightBase500);
        background-color: var(--colorBrandBackground2);
        color: var(--colorBrandForeground2);
        border: var(--strokeWidthThick) dashed var(--colorBrandStroke2);
        padding: var(--spacingVerticalM) var(--spacingHorizontalSNudge);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="portal-default-example__container">
          <div className="portal-default-example__clipping-container">
            <span>Clipping parent container</span>

            {open && mountNode && (
              <Portal mountNode={mountNode}>
                <div className="portal-default-example__portal-content">Portal content</div>
              </Portal>
            )}
          </div>

          <div className="portal-default-example__controls">
            <ToggleButton checked={open} onClick={() => setOpen(!open)}>
              Toggle portal
            </ToggleButton>

            <code className="portal-default-example__state">
              {JSON.stringify({ open }, null, 2)}
            </code>
          </div>
        </div>

        <div ref={setMountNode} />
      </>
    );
  },
};

/**
 * A portal renders content outside of a DOM tree, at the end of the document.
 * This allows content to escape traditional boundaries caused by `"overflow: hidden"` CSS rules and keeps it on the top without using `z-index` rules.
 * This is useful for example in `Menu` and `Tooltip` scenarios, where the content should always overlay everything else.
 *
 * `Portal` component is a thin wrapper around React's [`ReactDOM.createPortal()`](https://reactjs.org/docs/portals.html)
 * that propagates Fluent styling (allows to use `tokens`) and text-direction handling to the content.
 * You can identify DOM created by `Portal` by looking for the `data-portal-node` attribute.
 *
 * @summary Renders content at the end of the document, outside the normal DOM tree.
 */
export default {
  title: 'Components/Portal/Portal',
  component: Portal,
};
