// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { figmaDesign } from '../../utils/figma';
import { type JSXElement, Avatar } from '@coreai-ds/react-components';

// `Avatar` is the CoreAI-wrapped avatar — it extends Fluent's `color` prop
// with an additional `"neutral-alt"` value.

// ---------- Default (canonical Fluent story) ----------

export const Default = (): JSXElement => <Avatar aria-label="Guest" />;

export const ColorNeutral = (): JSXElement => {
  const styles = /* css */ `
      .avatar-example {
        display: flex;
        column-gap: var(--spacingHorizontalXXL);
      }

      .avatar-example__surface {
        display: flex;
        flex-direction: column;
        align-items: center;
        row-gap: var(--spacingVerticalS);
        padding: var(--spacingVerticalXXL);
        border-radius: var(--borderRadiusMedium);
      }

      .avatar-example__surface--background-4 {
        background-color: var(--colorNeutralBackground4);
      }

      .avatar-example__surface--background-1 {
        background-color: var(--colorNeutralBackground1);
      }

      .avatar-example__label {
        font-size: var(--fontSizeBase200);
        color: var(--colorNeutralForeground2);
      }
    `;

  return (
    <>
      <style>{styles}</style>
      <div className="avatar-example">
        <div className="avatar-example__surface avatar-example__surface--background-1">
          <Avatar name="Alex Britez" color="neutral" />
          <span className="avatar-example__label">color="neutral" (colorNeutralBackground4)</span>
        </div>
        <div className="avatar-example__surface avatar-example__surface--background-4">
          <Avatar name="Alex Britez" color="neutral-alt" />
          <span className="avatar-example__label">
            color="neutral-alt" (colorNeutralBackground1)
          </span>
        </div>
      </div>
    </>
  );
};

/**
 * An Avatar is a graphical representation of a user, team, or entity.
 *
 * Avatar can display an image, icon, or initials, and supports various sizes and shapes.
 *
 * @summary Graphical representation of a user or entity, showing an image, icon, or initials.
 */
export default {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: { ...figmaDesign('Avatar') },
};
