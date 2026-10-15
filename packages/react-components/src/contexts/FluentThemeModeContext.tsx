// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Detects whether the active Fluent theme is a light or dark theme and
 * publishes the answer as a simple `'light' | 'dark'` mode.
 *
 * Fluent themes don't carry an explicit light/dark marker, so rather than
 * sniffing individual token values we let the browser resolve them: a hidden
 * probe element is painted with `var(--colorNeutralBackground1)`, its computed
 * background color is read back, and its luminance decides the mode. The probe
 * is re-read whenever the `theme` changes.
 *
 * Consume the result with {@link useFluentThemeMode}. The provider is wired
 * into `CoreAIFluentProvider`, so any component beneath it can read the mode.
 */
import * as React from 'react';

export type FluentThemeMode = 'light' | 'dark';

const FluentThemeModeContext = React.createContext<FluentThemeMode>('light');

/** Read the current theme mode (`'light'` or `'dark'`). */
export const useFluentThemeMode = (): FluentThemeMode => React.useContext(FluentThemeModeContext);

/** Decide whether a resolved CSS color string represents a dark surface. */
function isDarkColor(color: string | undefined): boolean {
  if (!color) {
    return false;
  }

  const value = color.trim().toLowerCase();

  const rgb = value.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (rgb) {
    const [r, g, b] = [rgb[1], rgb[2], rgb[3]].map(Number);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5;
  }

  const hsl = value.match(/hsl\(\s*[\d.]+(?:deg)?[\s,]+[\d.]+%?[\s,]+([\d.]+)%/);
  if (hsl) {
    return Number.parseFloat(hsl[1]) < 50;
  }

  let hex = value.startsWith('#') ? value.slice(1) : '';
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (hex.length >= 6) {
    const r = Number.parseInt(hex.slice(0, 2), 16);
    const g = Number.parseInt(hex.slice(2, 4), 16);
    const b = Number.parseInt(hex.slice(4, 6), 16);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5;
  }

  return false;
}

export interface FluentThemeModeProviderProps {
  /**
   * The active theme. Used only as a change signal — when it changes the probe
   * is re-read so the mode follows theme swaps.
   */
  theme?: unknown;
  children?: React.ReactNode;
}

/**
 * Paints a hidden probe with `var(--colorNeutralBackground1)`, classifies the
 * resolved color as light or dark, and publishes the mode to descendants.
 *
 * Must be rendered *inside* the element that applies the theme's CSS variables
 * (i.e. beneath `FluentProvider`) so the probe resolves the active theme.
 */
export function FluentThemeModeProvider(props: FluentThemeModeProviderProps): React.JSX.Element {
  const { theme, children } = props;
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [mode, setMode] = React.useState<FluentThemeMode>('light');

  React.useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }
    // Paint a throwaway probe inside the themed subtree so the browser resolves
    // `var(--colorNeutralBackground1)` for us, read it back, then remove it.
    const probe = document.createElement('div');
    probe.style.backgroundColor = 'var(--colorNeutralBackground1)';
    anchor.appendChild(probe);
    const bg = getComputedStyle(probe).backgroundColor;
    anchor.removeChild(probe);
    setMode(isDarkColor(bg) ? 'dark' : 'light');
  }, [theme]);

  return (
    <FluentThemeModeContext.Provider value={mode}>
      <div
        ref={anchorRef}
        aria-hidden
        className="fui-FluentThemeModeProvider__anchor"
        style={{
          position: 'absolute',
          width: 0,
          height: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
        }}
      />
      {children}
    </FluentThemeModeContext.Provider>
  );
}
