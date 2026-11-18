// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  CoreAIFluentProvider,
  coreaiLightTheme,
  coreaiDarkTheme,
  coreaiBrandVariants,
  azureLightTheme,
  azureDarkTheme,
  azureBrandVariants,
  type BrandVariants,
  type CoreAITheme,
} from '@coreai-ds/react-components';
import { readStoredValue, writeStoredValue } from '../BrowserState.mjs';
import { normalizeHex } from '../utils/BrandRamp.mjs';
import { createCustomBrand, DEFAULT_CUSTOM_COLOR } from './custom-brand.mjs';

export { DEFAULT_CUSTOM_COLOR } from './custom-brand.mjs';

export type ThemeMode = 'light' | 'dark';
export type ThemePreference = ThemeMode | 'system';
export type BrandPreference = 'coreai' | 'azure' | 'custom';

const STORAGE_KEY = 'coreai-docsite-theme';
const BRAND_STORAGE_KEY = 'coreai-docsite-brand';
const CUSTOM_COLOR_STORAGE_KEY = 'coreai-docsite-custom-color';

const brands = {
  coreai: { light: coreaiLightTheme, dark: coreaiDarkTheme, variants: coreaiBrandVariants },
  azure: { light: azureLightTheme, dark: azureDarkTheme, variants: azureBrandVariants },
};

interface ThemeContextValue {
  preference: ThemePreference;
  mode: ThemeMode;
  brand: BrandPreference;
  theme: CoreAITheme;
  brandVariants: BrandVariants;
  customColor: string;
  setPreference: (preference: ThemePreference) => void;
  setBrand: (brand: BrandPreference) => void;
  setCustomColor: (color: string) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function readStoredPreference(): ThemePreference {
  const stored = readStoredValue('localStorage', STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

function readSystemMode(): ThemeMode {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

function readStoredBrand(): BrandPreference {
  const stored = readStoredValue('localStorage', BRAND_STORAGE_KEY);
  if (stored === 'coreai' || stored === 'azure' || stored === 'custom') return stored;
  return 'coreai';
}

function readStoredCustomColor(): string {
  return (
    normalizeHex(readStoredValue('localStorage', CUSTOM_COLOR_STORAGE_KEY)) ?? DEFAULT_CUSTOM_COLOR
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = React.useState<ThemePreference>(readStoredPreference);
  const [systemMode, setSystemMode] = React.useState<ThemeMode>(readSystemMode);
  const [brand, setBrandState] = React.useState<BrandPreference>(readStoredBrand);
  const [customColor, setCustomColorState] = React.useState<string>(readStoredCustomColor);
  // Dragging the color picker updates the picker at once; the site theme follows.
  const deferredCustomColor = React.useDeferredValue(customColor);
  const mode = preference === 'system' ? systemMode : preference;
  const customBrand = React.useMemo(
    () => (brand === 'custom' ? createCustomBrand(deferredCustomColor) : undefined),
    [brand, deferredCustomColor],
  );
  const activeBrand = customBrand ?? brands[brand as Exclude<BrandPreference, 'custom'>];
  const theme = activeBrand[mode];
  const brandVariants = activeBrand.variants;

  React.useEffect(() => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: light)');
    const followSystemTheme = () => setSystemMode(systemTheme.matches ? 'light' : 'dark');
    systemTheme.addEventListener('change', followSystemTheme);
    followSystemTheme();
    return () => systemTheme.removeEventListener('change', followSystemTheme);
  }, []);

  React.useLayoutEffect(() => {
    const root = document.documentElement;
    // Paint the new theme before restoring hover and layout transitions.
    root.classList.add('theme-transitioning');
    root.dataset.theme = mode;
    root.dataset.themePreference = preference;
    root.dataset.brand = brand;
    root.style.colorScheme = mode;
    let restoreFrame = 0;
    const paintFrame = requestAnimationFrame(() => {
      restoreFrame = requestAnimationFrame(() => root.classList.remove('theme-transitioning'));
    });
    return () => {
      cancelAnimationFrame(paintFrame);
      cancelAnimationFrame(restoreFrame);
      root.classList.remove('theme-transitioning');
    };
  }, [mode, preference, brand]);

  const setPreference = React.useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    writeStoredValue('localStorage', STORAGE_KEY, next);
  }, []);

  const setCustomColor = React.useCallback((next: string) => {
    const color = normalizeHex(next);
    if (!color) return;
    setCustomColorState(color);
    writeStoredValue('localStorage', CUSTOM_COLOR_STORAGE_KEY, color);
  }, []);

  const setBrand = React.useCallback((next: BrandPreference) => {
    setBrandState(next);
    writeStoredValue('localStorage', BRAND_STORAGE_KEY, next);
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      preference,
      mode,
      brand,
      theme,
      brandVariants,
      customColor,
      setPreference,
      setBrand,
      setCustomColor,
    }),
    [
      preference,
      mode,
      brand,
      theme,
      brandVariants,
      customColor,
      setPreference,
      setBrand,
      setCustomColor,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>
      <CoreAIFluentProvider
        className="coreai-docsite-provider"
        theme={theme}
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: 'transparent',
        }}
      >
        {children}
      </CoreAIFluentProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
}
