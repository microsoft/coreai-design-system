// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { LinkButton } from '@coreai-ds/react-components';

export const Variants = () => {
  const styles = /* css */ `
    .link-button-variants-example {
      display: flex;
      flex-direction: column;
      column-gap: var(--spacingHorizontalXXL);
      row-gap: var(--spacingVerticalL);
      align-items: flex-start;
      padding: var(--spacingVerticalL);
    }

    .link-button-variants-example__column {
      display: flex;
      flex-direction: column;
      row-gap: var(--spacingVerticalS);
      align-items: flex-start;
    }

    .link-button-variants-example__heading {
      margin: 0;
      font-size: var(--fontSizeBase200);
      color: var(--colorNeutralForeground3);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="link-button-variants-example">
        <div className="link-button-variants-example__column">
          <p className="link-button-variants-example__heading">default (secondary)</p>
          <LinkButton href="https://example.com">Visit site</LinkButton>
        </div>

        <div className="link-button-variants-example__column">
          <p className="link-button-variants-example__heading">primary</p>
          <LinkButton appearance="primary" href="https://example.com">
            Get started
          </LinkButton>
        </div>

        <div className="link-button-variants-example__column">
          <p className="link-button-variants-example__heading">subtle</p>
          <LinkButton appearance="subtle" href="https://example.com">
            Learn more
          </LinkButton>
        </div>
      </div>
    </>
  );
};

const appearances = ['secondary', 'primary', 'outline', 'subtle', 'transparent'] as const;

export const Appearance = () => {
  const styles = /* css */ `
    .link-button-appearance-example {
      display: flex;
      flex-direction: column;
      column-gap: var(--spacingHorizontalXXL);
      row-gap: var(--spacingVerticalL);
      align-items: flex-start;
      padding: var(--spacingVerticalL);
    }

    .link-button-appearance-example__column {
      display: flex;
      flex-direction: column;
      row-gap: var(--spacingVerticalS);
      align-items: flex-start;
    }

    .link-button-appearance-example__heading {
      margin: 0;
      font-size: var(--fontSizeBase200);
      color: var(--colorNeutralForeground3);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="link-button-appearance-example">
        {appearances.map((appearance) => (
          <div key={appearance} className="link-button-appearance-example__column">
            <p className="link-button-appearance-example__heading">{appearance}</p>
            <LinkButton appearance={appearance} href="https://example.com">
              Visit site
            </LinkButton>
          </div>
        ))}
      </div>
    </>
  );
};

const shapes = ['rounded', 'circular', 'square'] as const;

export const Shape = () => {
  const styles = /* css */ `
    .link-button-shape-example {
      display: flex;
      flex-direction: column;
      column-gap: var(--spacingHorizontalXXL);
      row-gap: var(--spacingVerticalL);
      align-items: flex-start;
      padding: var(--spacingVerticalL);
    }

    .link-button-shape-example__column {
      display: flex;
      flex-direction: column;
      row-gap: var(--spacingVerticalS);
      align-items: flex-start;
    }

    .link-button-shape-example__heading {
      margin: 0;
      font-size: var(--fontSizeBase200);
      color: var(--colorNeutralForeground3);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="link-button-shape-example">
        {shapes.map((shape) => (
          <div key={shape} className="link-button-shape-example__column">
            <p className="link-button-shape-example__heading">{shape}</p>
            <LinkButton shape={shape} href="https://example.com">
              Visit site
            </LinkButton>
          </div>
        ))}
      </div>
    </>
  );
};

const sizes = ['small', 'medium', 'large'] as const;

export const Size = () => {
  const styles = /* css */ `
    .link-button-size-example {
      display: flex;
      flex-direction: column;
      column-gap: var(--spacingHorizontalXXL);
      row-gap: var(--spacingVerticalL);
      align-items: flex-start;
      padding: var(--spacingVerticalL);
    }

    .link-button-size-example__column {
      display: flex;
      flex-direction: column;
      row-gap: var(--spacingVerticalS);
      align-items: flex-start;
    }

    .link-button-size-example__heading {
      margin: 0;
      font-size: var(--fontSizeBase200);
      color: var(--colorNeutralForeground3);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="link-button-size-example">
        {sizes.map((size) => (
          <div key={size} className="link-button-size-example__column">
            <p className="link-button-size-example__heading">{size}</p>
            <LinkButton size={size} href="https://example.com">
              Visit site
            </LinkButton>
          </div>
        ))}
      </div>
    </>
  );
};

export const Disabled = () => {
  const styles = /* css */ `
    .link-button-disabled-example {
      display: flex;
      flex-direction: column;
      column-gap: var(--spacingHorizontalXXL);
      row-gap: var(--spacingVerticalL);
      align-items: flex-start;
      padding: var(--spacingVerticalL);
    }

    .link-button-disabled-example__column {
      display: flex;
      flex-direction: column;
      row-gap: var(--spacingVerticalS);
      align-items: flex-start;
    }

    .link-button-disabled-example__heading {
      margin: 0;
      font-size: var(--fontSizeBase200);
      color: var(--colorNeutralForeground3);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="link-button-disabled-example">
        {appearances.map((appearance) => (
          <div key={appearance} className="link-button-disabled-example__column">
            <p className="link-button-disabled-example__heading">{appearance}</p>
            <LinkButton appearance={appearance} disabled href="https://example.com">
              Visit site
            </LinkButton>
          </div>
        ))}
      </div>
    </>
  );
};

export default {
  title: 'Components/Button/LinkButton',
  component: LinkButton,
};
