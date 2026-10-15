// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { coreaiDarkTheme, coreaiLightTheme } from '../../../packages/react-components/src/index.js';
import type { Theme } from '@fluentui/react-components';
import './fonts.css';
import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';
import { logoDark, logoLight } from './assets/logos';

const createManagerTheme = (base: 'light' | 'dark', theme: Theme) => {
  // All mode-conditional chrome tokens live here so light/dark stay in sync.
  const chrome =
    base === 'dark'
      ? {
          app: theme.colorNeutralBackground6,
          content: theme.colorNeutralBackground6,
          preview: theme.colorNeutralBackground6,
          bar: theme.colorNeutralBackground6,
          border: theme.colorNeutralStroke3,
        }
      : {
          app: theme.colorNeutralBackground2,
          content: theme.colorNeutralBackground4,
          preview: theme.colorNeutralBackground4,
          bar: theme.colorNeutralBackground2,
          border: theme.colorNeutralStroke1,
        };

  return create({
    base,
    brandTitle: 'CoreAI Design System',
    brandUrl: '/',
    brandImage: base === 'dark' ? logoDark : logoLight,
    brandTarget: '_self',

    colorPrimary: theme.colorBrandBackground,
    colorSecondary: theme.colorBrandForeground1,

    // Neutral subtle hover for sidebar/accordion rows. Without this, Storybook's
    // default appHoverBg (#233952, a slate blue) leaks through on hover.
    appHoverBg: theme.colorSubtleBackgroundHover,

    appBg: chrome.app,
    appContentBg: chrome.content,
    appPreviewBg: chrome.preview,
    appBorderColor: chrome.border,
    appBorderRadius: Number.parseInt(theme.borderRadiusLarge, 10),

    fontBase: theme.fontFamilyBase,
    fontCode: theme.fontFamilyMonospace,

    textColor: theme.colorNeutralForeground1,
    textInverseColor: theme.colorNeutralForegroundInverted,
    textMutedColor: theme.colorNeutralForeground3,

    barTextColor: theme.colorNeutralForeground2,
    barSelectedColor: theme.colorBrandForeground1,
    barHoverColor: theme.colorNeutralForeground1,
    barBg: chrome.bar,

    buttonBg: theme.colorNeutralBackground1,
    buttonBorder: theme.colorNeutralStroke1,
    booleanBg: theme.colorNeutralBackground5,
    booleanSelectedBg: theme.colorBrandBackground,

    inputBg: theme.colorNeutralBackground1,
    inputBorder: theme.colorNeutralStroke1,
    inputTextColor: theme.colorNeutralForeground1,
    inputBorderRadius: Number.parseInt(theme.borderRadiusMedium, 10),
  });
};

const managerThemes = {
  light: createManagerTheme('light', coreaiLightTheme),
  dark: createManagerTheme('dark', coreaiDarkTheme),
};

// Give the popover menus (the gear/"Storybook menu" and the top-bar toolbar
// dropdowns like Theme/Mode) their own elevated surface so they lift off the
// shell. Storybook renders the gear menu with react-aria
// (div.react-aria-Popover[role="dialog"]) and the toolbar dropdowns as a
// portaled div wrapping a ul[role="listbox"]; both tie their surface background
// to `background.app` (the shell), so there is no theme key for this. We inject
// a token-driven style targeting each surface instead. It is mode-aware because Storybook's mode is manual (not OS-level), so a static
// manager-head.html rule could not branch on it.
const menuSurface = {
  light: {
    bg: coreaiLightTheme.colorNeutralBackground1,
    border: coreaiLightTheme.colorNeutralStroke1,
  },
  dark: {
    bg: coreaiDarkTheme.colorNeutralBackground2,
    border: coreaiDarkTheme.colorNeutralStroke3,
  },
};

const applyMenuSurface = (mode: 'light' | 'dark') => {
  const id = 'coreai-menu-surface';
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = id;
    document.head.appendChild(el);
  }
  const { bg, border } = menuSurface[mode];
  // Two popover surfaces need the elevated treatment:
  //  1. The gear/"Storybook menu" — the direct child div of the react-aria popover.
  //  2. The top-bar toolbar dropdowns (Theme, Mode) — Storybook renders these as a
  //     portaled `div` (direct child of <body>) wrapping a `ul[role="listbox"]`.
  //     The wrapper's class is emotion-generated (unstable), so we match it by
  //     structure via :has() instead of the hashed class name.
  el.textContent = `
    .react-aria-Popover > div,
    body > div:has(> ul[role="listbox"]) {
      background: ${bg} !important;
      border: 1px solid ${border} !important;
    }
  `;
};

// Apply the CoreAI theme synchronously at config-load so the manager's very
// first paint is already themed (matches `initialGlobals.mode = "dark"` in
// preview.tsx). Without this, Storybook renders its stock theme first and the
// mode-sync addon below swaps it in later, causing a visible flash.
// `showPanel: false` hides the addon panel (Controls/Actions/Interactions) by
// default — it doesn't carry anything useful for our stories today. Users can
// still toggle it back on from the toolbar or with the `A` keyboard shortcut.
addons.setConfig({ theme: managerThemes.dark, showPanel: false });
applyMenuSurface('dark');

/**
 * Mirror the preview's `mode` global onto the Storybook manager UI chrome
 * (sidebar, toolbar, addons panel) so the whole window flips Light/Dark
 * in lockstep with the FluentProvider running inside the story canvas.
 */
addons.register('mode-sync', (api) => {
  let current: 'light' | 'dark' = 'dark';
  const apply = (mode: unknown) => {
    const next = mode === 'light' ? 'light' : 'dark';
    // Skip redundant setOptions calls (which trigger a manager re-render).
    if (next === current) return;
    current = next;
    api.setOptions({ theme: managerThemes[next] });
    applyMenuSurface(next);
  };

  // React to toolbar Mode changes.
  api.on('globalsUpdated', ({ globals }: { globals: Record<string, unknown> }) => {
    apply(globals.mode);
  });
});
