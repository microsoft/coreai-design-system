// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Detects the active theme mode from the browser-resolved background token.
 * Fluent themes do not carry an explicit light/dark marker.
 */
import * as React from 'react';
import { useIsomorphicLayoutEffect } from '@fluentui/react-utilities';

export type FluentThemeMode = 'light' | 'dark';

const FluentThemeModeContext = React.createContext<FluentThemeMode>('light');

/** Read the current theme mode ('light' or 'dark'). */
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
      .map((character) => character + character)
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

/**
 * Paints a hidden probe beneath the themed element. Re-read it when the theme
 * changes so CSS variables and partial/nested themes resolve in the browser.
 */
export function FluentThemeModeProvider({
  theme,
  style,
  children,
}: {
  theme: unknown;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}): React.JSX.Element {
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [mode, setMode] = React.useState<FluentThemeMode>('light');

  useIsomorphicLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }
    // Use the owning document, including providers rendered into another window.
    const ownerDocument = anchor.ownerDocument;
    const probe = ownerDocument.createElement('div');
    probe.style.backgroundColor = 'var(--colorNeutralBackground1)';
    anchor.appendChild(probe);
    const background = ownerDocument.defaultView?.getComputedStyle(probe).backgroundColor;
    anchor.removeChild(probe);
    setMode(isDarkColor(background) ? 'dark' : 'light');
  }, [theme, style]);

  return (
    <FluentThemeModeContext.Provider value={mode}>
      <div ref={anchorRef} hidden aria-hidden className="fui-FluentThemeModeProvider__anchor" />
      {children}
    </FluentThemeModeContext.Provider>
  );
}
