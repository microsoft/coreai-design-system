// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { StoryObj } from '@storybook/react-vite';
import { figmaDesign } from '../../utils/figma';
import { Link, InfoButton } from '@coreai-ds/react-components';

// `InfoButton` reveals supplemental information in a Popover. Fluent no longer
// ships it standalone, so Core AI Design System keeps a wrapped, accessibility-hardened
// version that mirrors primitive `info` content into the surface's name.

export const Default: StoryObj = {
  render: () => (
    <InfoButton
      aria-label="More information about pricing"
      info={
        <>
          Pricing is billed monthly per seat.{' '}
          <Link href="https://react.fluentui.dev">Learn more</Link>
        </>
      }
    />
  ),
};

export const PrimitiveInfo: StoryObj = {
  render: () => {
    const styles = /* css */ `
      .info-button-primitive-example__row {
        display: flex;
        align-items: center;
        column-gap: var(--spacingHorizontalS);
      }

      .info-button-primitive-example__label {
        font-size: var(--fontSizeBase300);
        color: var(--colorNeutralForeground1);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="info-button-primitive-example__row">
          <span className="info-button-primitive-example__label">Username</span>
          <InfoButton
            aria-label="More information about usernames"
            info="Your username must be unique and is visible to other members."
          />
        </div>
      </>
    );
  },
};

export const Sizes: StoryObj = {
  render: () => {
    const styles = /* css */ `
      .info-button-sizes-example {
        display: flex;
        flex-direction: column;
        row-gap: var(--spacingVerticalL);
        align-items: flex-start;
        padding: var(--spacingVerticalL);
      }

      .info-button-sizes-example__row {
        display: flex;
        align-items: center;
        column-gap: var(--spacingHorizontalS);
      }

      .info-button-sizes-example__label {
        font-size: var(--fontSizeBase300);
        color: var(--colorNeutralForeground1);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="info-button-sizes-example">
          <div className="info-button-sizes-example__row">
            <span className="info-button-sizes-example__label">Small</span>
            <InfoButton
              size="small"
              aria-label="Small info button"
              info="Example small InfoButton."
            />
          </div>
          <div className="info-button-sizes-example__row">
            <span className="info-button-sizes-example__label">Medium</span>
            <InfoButton
              size="medium"
              aria-label="Medium info button"
              info="Example medium InfoButton."
            />
          </div>
          <div className="info-button-sizes-example__row">
            <span className="info-button-sizes-example__label">Large</span>
            <InfoButton
              size="large"
              aria-label="Large info button"
              info="Example large InfoButton."
            />
          </div>
        </div>
      </>
    );
  },
};

/**
 * A button that reveals supplemental information in a `Popover`. It requires an
 * accessible name and mirrors primitive `info` content into the popover surface
 * so screen readers announce it.
 *
 * @summary A button that reveals supplemental information in a popover.
 */
export default {
  title: 'Components/InfoButton',
  component: InfoButton,
  parameters: { ...figmaDesign('InfoButton') },
};
