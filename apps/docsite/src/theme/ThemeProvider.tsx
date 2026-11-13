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

export type ThemeMode = 'light' | 'dark';
export type ThemePreference = ThemeMode;
export type BrandPreference = 'coreai' | 'azure';

const STORAGE_KEY = 'coreai-docsite-theme';
const BRAND_STORAGE_KEY = 'coreai-docsite-brand';

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
  setPreference: (preference: ThemePreference) => void;
  setBrand: (brand: BrandPreference) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function readStoredPreference(): ThemePreference {
  const stored = readStoredValue('localStorage', STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

function readStoredBrand(): BrandPreference {
  const stored = readStoredValue('localStorage', BRAND_STORAGE_KEY);
  if (stored === 'coreai' || stored === 'azure') return stored;
  return 'coreai';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = React.useState<ThemePreference>(readStoredPreference);
  const [brand, setBrandState] = React.useState<BrandPreference>(readStoredBrand);
  const mode = preference;
  const theme = brands[brand][mode];
  const brandVariants = brands[brand].variants;

  React.useEffect(() => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: light)');
    const followSystemTheme = () => {
      const stored = readStoredValue('localStorage', STORAGE_KEY);
      if (stored !== 'light' && stored !== 'dark') {
        setPreferenceState(systemTheme.matches ? 'light' : 'dark');
      }
    };
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

  const setBrand = React.useCallback((next: BrandPreference) => {
    setBrandState(next);
    writeStoredValue('localStorage', BRAND_STORAGE_KEY, next);
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({ preference, mode, brand, theme, brandVariants, setPreference, setBrand }),
    [preference, mode, brand, theme, brandVariants, setPreference, setBrand],
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
