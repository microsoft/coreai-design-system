// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup, render } from 'vitest-browser-react';
import { useProviderContext } from '@fluentui/react-headless-components-preview/provider';
import { webDarkTheme, webLightTheme } from '@fluentui/react-theme';
import { createFluentIcon } from '@fluentui/react-icons/headless/utils';
import * as legacy from '@coreai-ds/react-components';
import {
  CoreAIFluentProviderComparison,
  captureProviderStyles,
  providerThemes,
} from '../../../apps/storybook/src/stories/experiments/CoreAIFluentProviderComparison.js';
import { CoreAIFluentProvider } from './CoreAIFluentProvider.js';
import { useCoreAIDefaults } from './ComponentDefaultsContext.js';
import { useFluentThemeMode } from './FluentThemeModeContext.js';
import {
  coreaiBrandVariants,
  coreaiDarkTheme,
  coreaiLightTheme,
  createCoreAIDarkTheme,
  createCoreAILightTheme,
} from './theme.js';
import { azureBrandVariants, azureDarkTheme, azureLightTheme } from './azureTheme.js';
import { Button } from './Button.js';

afterEach(cleanup);

const DirectionalGlyph = createFluentIcon('ProviderDirectionalGlyph', '1em', ['M1 1h2v2H1z'], {
  flipInRtl: true,
});

function getProvider(implementation: 'legacy' | 'headless'): HTMLElement {
  const element = document.querySelector<HTMLElement>(
    `[data-provider-implementation="${implementation}"]`,
  );
  if (!element) throw new Error(`Missing ${implementation} provider`);
  return element;
}

test('preserves all CoreAI and Azure token values and theme factories', () => {
  expect(coreaiBrandVariants).toEqual(legacy.coreaiBrandVariants);
  expect(azureBrandVariants).toEqual(legacy.azureBrandVariants);
  expect(coreaiLightTheme).toEqual(legacy.coreaiLightTheme);
  expect(coreaiDarkTheme).toEqual(legacy.coreaiDarkTheme);
  expect(azureLightTheme).toEqual(legacy.azureLightTheme);
  expect(azureDarkTheme).toEqual(legacy.azureDarkTheme);
  expect(createCoreAILightTheme(azureBrandVariants)).toEqual(
    legacy.createCoreAILightTheme(azureBrandVariants),
  );
  expect(createCoreAIDarkTheme(azureBrandVariants)).toEqual(
    legacy.createCoreAIDarkTheme(azureBrandVariants),
  );
});

for (const [name, theme] of Object.entries({
  ...providerThemes,
  'Web light': webLightTheme,
  'Web dark': webDarkTheme,
})) {
  for (const dir of ['ltr', 'rtl'] as const) {
    test(`matches provider typography, colors, tracking and scrollbars in ${name}, ${dir}`, async () => {
      await render(<CoreAIFluentProviderComparison theme={theme} dir={dir} />);
      const actualStyles = captureProviderStyles(getProvider('headless'));
      const legacyStyles = captureProviderStyles(getProvider('legacy'));
      expect(legacyStyles['text-align']).toBe('left');
      expect(actualStyles).toEqual({
        ...legacyStyles,
        'text-align': dir === 'rtl' ? 'right' : 'left',
      });
      const actual = getProvider('headless').style;
      for (const [token, value] of Object.entries(theme)) {
        expect(actual.getPropertyValue(`--${token}`).trim(), token).toBe(String(value).trim());
      }
    });
  }
}

test('retains stock Fluent RTL alignment instead of the old CoreAI mixed-direction class collision', async () => {
  const screen = await render(
    <legacy.FluentProvider theme={coreaiLightTheme} dir="rtl" data-testid="stock-rtl">
      Stock Fluent
    </legacy.FluentProvider>,
  );
  expect(getComputedStyle(screen.getByTestId('stock-rtl').element()).textAlign).toBe('right');
});

function ContextProbe({ targetDocument }: { targetDocument?: Document }): React.ReactElement {
  const context = useProviderContext();
  return (
    <output
      data-testid="context"
      data-direction={context.dir}
      data-target-matches={context.targetDocument === targetDocument}
      data-defaults={useCoreAIDefaults()}
      data-mode={useFluentThemeMode()}
    />
  );
}

test('applies the responsive tracking ramp and its 0.01em floor without an old provider', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      {[10, 12, 14, 16, 18, 24].map((size) => (
        <span key={size} data-testid={`tracking-${size}`} style={{ fontSize: size }}>
          Tracking
        </span>
      ))}
    </CoreAIFluentProvider>,
  );
  for (const size of [10, 12, 14, 16, 18, 24]) {
    const tracking = Number.parseFloat(
      getComputedStyle(screen.getByTestId(`tracking-${size}`).element()).letterSpacing,
    );
    expect(tracking).toBeCloseTo(Math.max(0.01, 0.01 + (18 - size) * 0.007) * size, 4);
  }
});

test('supplies current headless contexts, native props, caller styles and a div ref', async () => {
  const ref = React.createRef<HTMLDivElement>();
  const targetDocument = document.implementation.createHTMLDocument('Target document');
  const screen = await render(
    <CoreAIFluentProvider
      ref={ref}
      id="provider-native-props"
      className="consumer-provider"
      data-testid="provider"
      aria-label="Themed application"
      dir="rtl"
      targetDocument={targetDocument}
      theme={coreaiDarkTheme}
      style={{ padding: 9, '--consumer-token': 'preserved' }}
    >
      <ContextProbe targetDocument={targetDocument} />
    </CoreAIFluentProvider>,
  );
  const provider = screen.getByTestId('provider').element();
  expect(ref.current).toBe(provider);
  expect(provider.id).toBe('provider-native-props');
  expect(provider.classList.contains('consumer-provider')).toBe(true);
  expect(provider.classList.contains('fui-FluentProvider')).toBe(true);
  expect(provider.getAttribute('aria-label')).toBe('Themed application');
  expect(getComputedStyle(provider).paddingTop).toBe('9px');
  expect(provider.style.getPropertyValue('--consumer-token')).toBe('preserved');
  const probe = screen.getByTestId('context');
  await expect.element(probe).toHaveAttribute('data-direction', 'rtl');
  await expect.element(probe).toHaveAttribute('data-target-matches', 'true');
  await expect.element(probe).toHaveAttribute('data-defaults', 'true');
  await expect.element(probe).toHaveAttribute('data-mode', 'dark');
  expect(provider.querySelector('[data-make-styles-bucket]')).toBeNull();
});

test('supports partial nested themes and independent defaults without the old provider', async () => {
  const screen = await render(
    <CoreAIFluentProvider theme={coreaiDarkTheme} dir="rtl">
      <Button data-testid="outer-button">Outer</Button>
      <CoreAIFluentProvider
        theme={{ colorBrandBackground: 'rgb(12, 34, 56)' }}
        withComponentDefaults={false}
        data-testid="nested"
      >
        <ContextProbe targetDocument={document} />
        <Button data-testid="inner-button">Inner</Button>
      </CoreAIFluentProvider>
    </CoreAIFluentProvider>,
  );
  const nested = screen.getByTestId('nested').element();
  const computed = getComputedStyle(nested);
  expect(computed.getPropertyValue('--colorBrandBackground').trim()).toBe('rgb(12, 34, 56)');
  expect(computed.getPropertyValue('--colorNeutralBackground1').trim()).toBe(
    coreaiDarkTheme.colorNeutralBackground1,
  );
  await expect.element(screen.getByTestId('context')).toHaveAttribute('data-direction', 'rtl');
  await expect.element(screen.getByTestId('context')).toHaveAttribute('data-mode', 'dark');
  await expect.element(screen.getByTestId('context')).toHaveAttribute('data-defaults', 'false');
  expect(screen.getByTestId('outer-button').element().getAttribute('data-shape')).toBe('circular');
  expect(screen.getByTestId('inner-button').element().getAttribute('data-shape')).toBe('rounded');
});

test('updates variables and theme mode when a theme changes and preserves inline priority', async () => {
  const view = (dark: boolean) => (
    <CoreAIFluentProvider
      theme={dark ? coreaiDarkTheme : coreaiLightTheme}
      style={{ '--colorBrandBackground': 'rgb(1, 2, 3)' }}
      data-testid="provider"
    >
      <ContextProbe />
    </CoreAIFluentProvider>
  );
  const screen = await render(view(false));
  await expect.element(screen.getByTestId('context')).toHaveAttribute('data-mode', 'light');
  await screen.rerender(view(true));
  await expect.element(screen.getByTestId('context')).toHaveAttribute('data-mode', 'dark');
  expect(
    getComputedStyle(screen.getByTestId('provider').element())
      .getPropertyValue('--colorBrandBackground')
      .trim(),
  ).toBe('rgb(1, 2, 3)');
});

test('retains the safe defaults outside a provider', async () => {
  const screen = await render(<ContextProbe />);
  await expect.element(screen.getByTestId('context')).toHaveAttribute('data-defaults', 'false');
  await expect.element(screen.getByTestId('context')).toHaveAttribute('data-mode', 'light');
});

test('resolves inline token overrides when only the provider style changes', async () => {
  const view = (background: string) => (
    <CoreAIFluentProvider
      theme={coreaiLightTheme}
      style={{ '--colorNeutralBackground1': background }}
    >
      <ContextProbe />
    </CoreAIFluentProvider>
  );
  const screen = await render(view('rgb(0, 0, 0)'));
  await expect.element(screen.getByTestId('context')).toHaveAttribute('data-mode', 'dark');
  await screen.rerender(view('rgb(255, 255, 255)'));
  await expect.element(screen.getByTestId('context')).toHaveAttribute('data-mode', 'light');
});

test('shares the current icon direction context with consumer-supplied headless glyphs', async () => {
  const view = (dir: 'ltr' | 'rtl') => (
    <CoreAIFluentProvider dir={dir}>
      <DirectionalGlyph data-testid="directional-glyph" />
    </CoreAIFluentProvider>
  );
  const screen = await render(view('rtl'));
  const glyph = screen.getByTestId('directional-glyph');
  await expect.element(glyph).toHaveAttribute('data-fui-icon-rtl', '');
  expect(getComputedStyle(glyph.element()).transform).toBe('matrix(-1, 0, 0, 1, 0, 0)');
  await screen.rerender(view('ltr'));
  await expect.element(glyph).not.toHaveAttribute('data-fui-icon-rtl');
  expect(getComputedStyle(glyph.element()).transform).toBe('none');
});
