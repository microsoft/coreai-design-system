// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Link,
  Switch,
  Text,
  Spinner,
  Button,
  CoreAIFluentProvider,
  coreaiLightTheme,
  coreaiDarkTheme,
  createCoreAILightTheme,
  createCoreAIDarkTheme,
  azureLightTheme,
  azureDarkTheme,
  type BrandVariants,
  type CoreAITheme,
} from '@coreai-ds/react-components';
import type { StoryObj } from '@storybook/react-vite';

/**
 * Customize the brand colors and feed the resulting theme to a nested
 * `CoreAIFluentProvider`. Each provider re-themes only its own subtree, so the
 * surrounding Storybook canvas keeps the toolbar-selected CoreAI theme.
 */
export const CustomBrandTheme: StoryObj = {
  render: () => {
    // 1. A custom brand ramp. Fluent's theme factories derive every
    //    `colorBrand*`/`colorCompoundBrand*` token from these 16 stops.
    //    Key Color: #0000FF
    const maxBlue: BrandVariants = {
      10: '#09000C',
      20: '#280044',
      30: '#37006D',
      40: '#3E0097',
      50: '#3800CA',
      60: '#0B10FF',
      70: '#2A34FF',
      80: '#3E4BFF',
      90: '#4F5FFF',
      100: '#5F72FF',
      110: '#6F83FF',
      120: '#8094FF',
      130: '#90A5FF',
      140: '#A2B5FF',
      150: '#B4C6FF',
      160: '#C7D6FF',
    };

    // 2. Build CoreAI themes from the custom ramp. The factories layer CoreAI's
    //    neutral-stroke, interactive-token, and font overrides on top of Fluent's
    //    generated brand + neutral tokens, so only the brand color changes.
    const maxBlueLightTheme: CoreAITheme = createCoreAILightTheme(maxBlue);

    const maxBlueDarkTheme: CoreAITheme = {
      ...createCoreAIDarkTheme(maxBlue),
      // The factory-generated brand foregrounds are too dark for dark-mode
      // contrast; lighten them the same way CoreAI does for its own ramp.
      colorBrandForeground1: maxBlue[110],
      colorBrandForeground2: maxBlue[120],
    };

    const BrandSample = () => {
      const [checked, setChecked] = React.useState(true);

      return (
        <div className="coreai-provider-custom-brand-example__panel">
          <Text preset="heading4">Max Blue</Text>
          <Text preset="body">
            Components below inherit the custom brand ramp while keeping every CoreAI neutral, font,
            and custom-token override.
          </Text>
          <div className="coreai-provider-custom-brand-example__buttons">
            <Button appearance="primary">Primary</Button>
            <Button appearance="outline">Outline</Button>
            <Button appearance="subtle">Subtle</Button>
          </div>
          <div className="coreai-provider-custom-brand-example__buttons">
            <Switch
              checked={checked}
              onChange={(_, data) => setChecked(data.checked)}
              label="Brand switch"
            />
            <Spinner size="tiny" />
            <Link href="#">Brand link</Link>
          </div>
        </div>
      );
    };

    const styles = /* css */ `
      .coreai-provider-custom-brand-example {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacingHorizontalL);
      }

      .coreai-provider-custom-brand-example__panel {
        flex: 1 1 280px;
        min-width: 280px;
        display: flex;
        flex-direction: column;
        row-gap: var(--spacingVerticalS);
        padding: var(--spacingHorizontalL);
        border-radius: var(--borderRadiusXLarge);
        background-color: var(--colorNeutralBackground1);
        color: var(--colorNeutralForeground1);
      }

      .coreai-provider-custom-brand-example__buttons {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacingHorizontalS);
        align-items: center;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="coreai-provider-custom-brand-example">
          <CoreAIFluentProvider theme={maxBlueLightTheme}>
            <BrandSample />
          </CoreAIFluentProvider>
          <CoreAIFluentProvider theme={maxBlueDarkTheme}>
            <BrandSample />
          </CoreAIFluentProvider>
        </div>
      </>
    );
  },
};

/**
 * Pre-built Azure / Coherence brand themes. These apply the Azure blue brand
 * ramp while sharing CoreAI's neutral palette, Aptos fonts, and interactive
 * background tokens.
 */
export const AzureBrandTheme: StoryObj = {
  render: () => {
    const AzureSample = ({ mode }: { mode: 'light' | 'dark' }) => {
      const [checked, setChecked] = React.useState(true);

      return (
        <div className="coreai-provider-azure-brand-example__panel">
          <Text preset="heading4">Azure {mode === 'light' ? 'Light' : 'Dark'}</Text>
          <Text preset="body">
            Components below inherit the Azure brand ramp while keeping every CoreAI neutral, font,
            and custom-token override.
          </Text>
          <div className="coreai-provider-azure-brand-example__buttons">
            <Button appearance="primary">Primary</Button>
            <Button appearance="outline">Outline</Button>
            <Button appearance="subtle">Subtle</Button>
          </div>
          <div className="coreai-provider-azure-brand-example__buttons">
            <Switch
              checked={checked}
              onChange={(_, data) => setChecked(data.checked)}
              label="Brand switch"
            />
            <Spinner size="tiny" />
            <Link href="#">Brand link</Link>
          </div>
        </div>
      );
    };

    const styles = /* css */ `
      .coreai-provider-azure-brand-example {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacingHorizontalL);
      }

      .coreai-provider-azure-brand-example__panel {
        flex: 1 1 280px;
        min-width: 280px;
        display: flex;
        flex-direction: column;
        row-gap: var(--spacingVerticalS);
        padding: var(--spacingHorizontalL);
        border-radius: var(--borderRadiusXLarge);
        background-color: var(--colorNeutralBackground1);
        color: var(--colorNeutralForeground1);
      }

      .coreai-provider-azure-brand-example__buttons {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacingHorizontalS);
        align-items: center;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="coreai-provider-azure-brand-example">
          <CoreAIFluentProvider theme={azureLightTheme}>
            <AzureSample mode="light" />
          </CoreAIFluentProvider>
          <CoreAIFluentProvider theme={azureDarkTheme}>
            <AzureSample mode="dark" />
          </CoreAIFluentProvider>
        </div>
      </>
    );
  },
};

/**
 * The default CoreAI theme in light and dark modes side by side.
 */
export const DefaultTheme: StoryObj = {
  render: () => {
    const CoreAISample = ({ mode }: { mode: 'light' | 'dark' }) => {
      const [checked, setChecked] = React.useState(true);

      return (
        <div className="coreai-provider-default-theme-example__panel">
          <Text preset="heading4">CoreAI {mode === 'light' ? 'Light' : 'Dark'}</Text>
          <Text preset="body">
            The default CoreAI brand ramp with all neutral, font, and custom-token overrides
            applied.
          </Text>
          <div className="coreai-provider-default-theme-example__buttons">
            <Button appearance="primary">Primary</Button>
            <Button appearance="outline">Outline</Button>
            <Button appearance="subtle">Subtle</Button>
          </div>
          <div className="coreai-provider-default-theme-example__buttons">
            <Switch
              checked={checked}
              onChange={(_, data) => setChecked(data.checked)}
              label="Brand switch"
            />
            <Spinner size="tiny" />
            <Link href="#">Brand link</Link>
          </div>
        </div>
      );
    };

    const styles = /* css */ `
      .coreai-provider-default-theme-example {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacingHorizontalL);
      }

      .coreai-provider-default-theme-example__panel {
        flex: 1 1 280px;
        min-width: 280px;
        display: flex;
        flex-direction: column;
        row-gap: var(--spacingVerticalS);
        padding: var(--spacingHorizontalL);
        border-radius: var(--borderRadiusXLarge);
        background-color: var(--colorNeutralBackground1);
        color: var(--colorNeutralForeground1);
      }

      .coreai-provider-default-theme-example__buttons {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacingHorizontalS);
        align-items: center;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="coreai-provider-default-theme-example">
          <CoreAIFluentProvider theme={coreaiLightTheme}>
            <CoreAISample mode="light" />
          </CoreAIFluentProvider>
          <CoreAIFluentProvider theme={coreaiDarkTheme}>
            <CoreAISample mode="dark" />
          </CoreAIFluentProvider>
        </div>
      </>
    );
  },
};

/**
 * Root provider that layers the CoreAI theme, global styles, and
 * component-default style hooks on top of Fluent's `FluentProvider`. Use it
 * once at the root of an app.
 *
 * @summary Root provider applying the CoreAI theme, global styles, and component defaults over Fluent's FluentProvider.
 */
export default {
  title: 'Components/CoreAIFluentProvider',
  component: CoreAIFluentProvider,
};
