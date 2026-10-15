// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  webLightTheme,
  webDarkTheme,
  teamsLightTheme,
  teamsDarkTheme,
  type Theme,
} from '@fluentui/react-components';
// Teams v2.1 themes are not exported by the CoreAI barrel's minimum Fluent version (9.70.0).
import { teamsLightV21Theme, teamsDarkV21Theme } from '@fluentui/react-theme';
import type { Preview } from '@storybook/react-vite';
import { DocsContainer } from '@storybook/addon-docs/blocks';
import { SyntaxHighlighter } from 'storybook/internal/components';
import {
  coreaiLightTheme,
  coreaiDarkTheme,
  azureLightTheme,
  azureDarkTheme,
  CoreAIFluentProvider,
} from '@coreai-ds/react-components';
import './fonts.css';

// Storybook's docs code blocks only bundle a curated set of Prism/refractor
// languages (bash, css, graphql, js, json, jsx, tsx, ...). `diff` is not among
// them, so ```diff fences render as a single un-tokenized (monochrome) block.
// Register the standard Prism `diff` grammar so added/removed lines get their
// own tokens, which the docs container then colors green/red (see the
// `.token.inserted` / `.token.deleted` rules below).
/* eslint-disable @typescript-eslint/no-explicit-any */
function diffLanguage(Prism: any): void {
  Prism.languages.diff = {
    coord: [/^(?:\*{3}|-{3}|\+{3}).*$/m, /^@@.*@@$/m, /^\d.*$/m],
  };
  const PREFIXES: Record<string, string> = {
    'deleted-sign': '-',
    'deleted-arrow': '<',
    'inserted-sign': '+',
    'inserted-arrow': '>',
    unchanged: ' ',
    diff: '!',
  };
  Object.keys(PREFIXES).forEach((name) => {
    const prefix = PREFIXES[name];
    const alias: string[] = [];
    if (/^(?:deleted|inserted)/.test(name)) {
      alias.push('line', name.split('-')[0]);
    } else if (name === 'unchanged') {
      alias.push('line');
    } else if (name === 'diff') {
      alias.push('important');
    }
    Prism.languages.diff[name] = {
      pattern: RegExp('^(?:[' + prefix + '].*(?:\r\n?|\n|(?![\\s\\S])))+', 'm'),
      alias,
      inside: {
        line: { pattern: /(.)(?=[\s\S]).*(?:\r\n?|\n)?/, lookbehind: true },
        prefix: {
          pattern: /[\s\S]/,
          alias: /^[+-]/.test(prefix) ? name.split('-')[0] : 'unchanged',
        },
      },
    };
  });
}
diffLanguage.displayName = 'diff';
diffLanguage.aliases = [] as string[];
(SyntaxHighlighter as any).registerLanguage?.('diff', diffLanguage);
/* eslint-enable @typescript-eslint/no-explicit-any */

// Storybook paints a full-viewport white overlay (`.sb-preparing-story`,
// `.sb-preparing-docs`) while a story/docs page is preparing, which flashes
// pure white in dark mode. Repaint it via a CSS variable that the decorator
// below keeps in sync with the active `mode` global (black in dark, white in
// light). The fallback is `black` to match the default dark mode and avoid a
// first-paint flash before the decorator runs.
if (typeof document !== 'undefined') {
  const styleId = 'mode-sync-preparing-bg';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .sb-preparing-story, .sb-preparing-docs {
        background-color: var(--sb-preparing-bg, black) !important;
      }
    `;
    document.head.appendChild(style);
  }
}

type ThemeKey = 'coreai' | 'azure' | 'web' | 'teams' | 'teamsV21';
type ModeKey = 'light' | 'dark';

const themeMap: Record<ThemeKey, Record<ModeKey, Theme>> = {
  coreai: { light: coreaiLightTheme, dark: coreaiDarkTheme },
  azure: { light: azureLightTheme, dark: azureDarkTheme },
  web: { light: webLightTheme, dark: webDarkTheme },
  teams: { light: teamsLightTheme, dark: teamsDarkTheme },
  teamsV21: { light: teamsLightV21Theme, dark: teamsDarkV21Theme },
};

const pickTheme = (globals: Record<string, unknown> | undefined): Theme => {
  const themeKey = (globals?.theme as ThemeKey) ?? 'coreai';
  const mode = (globals?.mode as ModeKey) ?? 'dark';
  return themeMap[themeKey]?.[mode] ?? coreaiDarkTheme;
};

/**
 * Two top-bar toolbar dropdowns:
 *  - `theme`: which Fluent theme family to apply (CoreAI, Web, Teams, Teams v2.1)
 *  - `mode`:  light vs dark; also drives the Storybook UI chrome (see manager.tsx)
 */
export const globalTypes: Preview['globalTypes'] = {
  theme: {
    name: 'Theme',
    description: 'Fluent theme family',
    defaultValue: 'coreai',
    toolbar: {
      icon: 'paintbrush',
      title: 'Theme',
      items: [
        { value: 'coreai', title: 'Theme: CoreAI' },
        { value: 'azure', title: 'Theme: Azure' },
        { value: 'web', title: 'Theme: Web' },
        { value: 'teams', title: 'Theme: Teams' },
        { value: 'teamsV21', title: 'Theme: Teams v2.1' },
      ],
      dynamicTitle: true,
    },
  },
  mode: {
    name: 'Mode',
    description: 'Light or dark mode (also recolors the Storybook UI)',
    defaultValue: 'dark',
    toolbar: {
      icon: 'circlehollow',
      title: 'Mode',
      items: [
        { value: 'light', title: 'Mode: Light', icon: 'sun' },
        { value: 'dark', title: 'Mode: Dark', icon: 'moon' },
      ],
      dynamicTitle: true,
    },
  },
};

export const initialGlobals: Preview['initialGlobals'] = {
  theme: 'coreai',
  mode: 'dark',
};

const preview: Preview = {
  parameters: {
    // `fullscreen` removes Storybook's `.sb-main-padded` 16px body padding
    // so the FluentProvider's background extends edge-to-edge.
    layout: 'fullscreen',
    controls: { expanded: true, disable: true },
    backgrounds: { disable: true }, // FluentProvider handles backgrounds via tokens
    docs: {
      // Wrap each MDX docs page in a FluentProvider that follows the active
      // Theme + Mode globals. Without this, raw `<Colors />`-style imports
      // in the Theme/* docs render unstyled (no FluentProvider in scope)
      // and pick up Griffel's default web-light fallback regardless of mode.
      container: ({ children, context }: { children: React.ReactNode; context: unknown }) => {
        const readGlobals = (): Record<string, unknown> => {
          const w = window as unknown as {
            __STORYBOOK_PREVIEW__?: {
              storyStore?: {
                userGlobals?: { get?: () => Record<string, unknown> };
              };
            };
          };
          return w.__STORYBOOK_PREVIEW__?.storyStore?.userGlobals?.get?.() ?? {};
        };
        const [globals, setGlobals] = React.useState<Record<string, unknown>>(readGlobals);
        React.useEffect(() => {
          // Storybook's preview exposes a channel; subscribe to global updates
          // so the docs page re-themes live when the toolbar Mode/Theme changes.
          const w = window as unknown as {
            __STORYBOOK_ADDONS_CHANNEL__?: {
              on: (e: string, cb: (p: { globals: Record<string, unknown> }) => void) => void;
              off: (e: string, cb: (p: { globals: Record<string, unknown> }) => void) => void;
            };
          };
          const channel = w.__STORYBOOK_ADDONS_CHANNEL__;
          if (!channel) return;
          const handler = ({ globals: next }: { globals: Record<string, unknown> }) =>
            setGlobals(next);
          channel.on('globalsUpdated', handler);
          return () => channel.off('globalsUpdated', handler);
        }, []);
        const theme = pickTheme(globals);
        const themeKey = (globals?.theme as ThemeKey) ?? 'coreai';
        const isDark = ((globals?.mode as ModeKey) ?? 'dark') === 'dark';
        // VS Code Dark+ / Light+ syntax token palette
        const syn = isDark
          ? {
              comment: '#6a9955',
              keyword: '#569cd6',
              string: '#f0a27a',
              number: '#b5cea8',
              fn: '#dcdcaa',
              cls: '#4ec9b0',
              tag: '#4ec9b0',
              attrName: '#9cdcfe',
              attrValue: '#f0a27a',
              punct: '#d4d4d4',
              plain: '#d4d4d4',
              added: '#89d185',
              removed: '#f48771',
              coord: '#569cd6',
            }
          : {
              comment: '#008000',
              keyword: '#0000ff',
              string: '#a31515',
              number: '#098658',
              fn: '#795e26',
              cls: '#267f99',
              tag: '#800000',
              attrName: '#e50000',
              attrValue: '#0000ff',
              punct: '#333333',
              plain: '#1e1e1e',
              added: '#22863a',
              removed: '#b31d28',
              coord: '#005cc5',
            };
        return (
          <CoreAIFluentProvider
            theme={theme}
            withComponentDefaults={themeKey === 'coreai' || themeKey === 'azure'}
            style={{
              background: theme.colorNeutralBackground1,
              minHeight: '100vh',
            }}
          >
            {/*
              Storybook's docs CSS hardcodes a white background and dark
              text on `.sbdocs-wrapper` / `.sbdocs-content`, which makes
              the Theme docs unreadable in dark mode (white-on-white
              labels). Repaint those wrappers with the active Fluent
              tokens so the docs follow the chosen Mode.
            */}
            <style>{`
              .sbdocs.sbdocs-wrapper { background: transparent !important; }
              .sbdocs.sbdocs-content { color: ${theme.colorNeutralForeground1}; }
              .sbdocs.sbdocs-content h1, .sbdocs.sbdocs-content h2,
              .sbdocs.sbdocs-content h3, .sbdocs.sbdocs-content h4 {
                color: ${theme.colorNeutralForeground1};
              }
              .sbdocs.sbdocs-content p,
              .sbdocs.sbdocs-content li,
              .sbdocs.sbdocs-content td,
              .sbdocs.sbdocs-content th {
                color: ${theme.colorNeutralForeground2};
              }
              .sbdocs.sbdocs-content a:not([class]) {
                color: ${theme.colorBrandForegroundLink};
              }
              .sbdocs.sbdocs-content a:not([class]):hover {
                color: ${theme.colorBrandForegroundLinkHover};
              }
              .sbdocs.sbdocs-content a:not([class]):active {
                color: ${theme.colorBrandForegroundLinkPressed};
              }
              .sbdocs.sbdocs-content table {
                border-color: ${theme.colorNeutralStroke2};
              }
              .sbdocs.sbdocs-content .coreai-props-table {
                table-layout: fixed;
                width: 100%;
              }
              .sbdocs.sbdocs-content .coreai-props-table th:nth-child(1) { width: 22%; }
              .sbdocs.sbdocs-content .coreai-props-table th:nth-child(2) { width: 28%; }
              .sbdocs.sbdocs-content .coreai-props-table th:nth-child(3) { width: 16%; }
              .sbdocs.sbdocs-content .coreai-props-table th:nth-child(4) { width: 34%; }
              .sbdocs.sbdocs-content .coreai-props-table td code {
                overflow-wrap: anywhere;
              }
              .sbdocs.sbdocs-content tr {
                border-color: ${theme.colorNeutralStroke2};
                background: transparent;
              }
              .sbdocs.sbdocs-content thead tr {
                background: ${theme.colorNeutralBackground2};
              }
              .sbdocs.sbdocs-content :not(pre) > code {
                background: ${theme.colorNeutralBackground3};
                color: ${theme.colorNeutralForeground1};
                border: 1px solid ${theme.colorNeutralStroke2};
                border-radius: 4px;
                padding: 1px 5px;
              }
              .sbdocs.sbdocs-content [class*="docblock-source"],
              .sbdocs.sbdocs-preview > [id] > div,
              .sbdocs.sbdocs-content [class*="sto-"] > pre {
                background: ${theme.colorNeutralBackground3} !important;
                border-color: ${theme.colorNeutralStroke2} !important;
              }
              .sbdocs.sbdocs-content pre {
                background: transparent !important;
                border: none !important;
                border-radius: 0 !important;
                margin: 0;
              }
              .sbdocs.sbdocs-content pre code {
                background: transparent !important;
                border: none;
                padding: 0;
              }
              /*
                Base text color for code blocks. Untokenized languages (the
                plain "text" fence) and un-highlighted lines leave content as
                raw text nodes on the code container rather than in token
                spans; without this they inherit Storybook's hardcoded
                (light-theme) syntax color and turn near-invisible in dark mode.
              */
              .sbdocs.sbdocs-content pre,
              .sbdocs.sbdocs-content pre code,
              .sbdocs.sbdocs-content pre [class*="language-"] { color: ${syn.plain} !important; }
              .sbdocs.sbdocs-content pre span { color: ${syn.plain} !important; }
              .sbdocs.sbdocs-content pre .token.comment,
              .sbdocs.sbdocs-content pre .token.prolog,
              .sbdocs.sbdocs-content pre .token.cdata { color: ${syn.comment} !important; font-style: italic; }
              .sbdocs.sbdocs-content pre .token.keyword,
              .sbdocs.sbdocs-content pre .token.boolean,
              .sbdocs.sbdocs-content pre .token.imports { color: ${syn.keyword} !important; }
              .sbdocs.sbdocs-content pre .token.string,
              .sbdocs.sbdocs-content pre .token.attr-value,
              .sbdocs.sbdocs-content pre .token.template-string { color: ${syn.string} !important; }
              .sbdocs.sbdocs-content pre .token.number { color: ${syn.number} !important; }
              .sbdocs.sbdocs-content pre .token.function { color: ${syn.fn} !important; }
              .sbdocs.sbdocs-content pre .token.class-name,
              .sbdocs.sbdocs-content pre .token.maybe-class-name { color: ${syn.cls} !important; }
              .sbdocs.sbdocs-content pre .token.tag,
              .sbdocs.sbdocs-content pre .token.tag .token.tag { color: ${syn.tag} !important; }
              .sbdocs.sbdocs-content pre .token.attr-name { color: ${syn.attrName} !important; }
              .sbdocs.sbdocs-content pre .token.punctuation,
              .sbdocs.sbdocs-content pre .token.operator { color: ${syn.punct} !important; }
              .sbdocs.sbdocs-content pre .token.plain,
              .sbdocs.sbdocs-content pre .token.parameter { color: ${syn.plain} !important; }
              /* diff blocks: color added/removed lines and hunk headers */
              .sbdocs.sbdocs-content pre .token.inserted,
              .sbdocs.sbdocs-content pre .token.inserted span { color: ${syn.added} !important; }
              .sbdocs.sbdocs-content pre .token.deleted,
              .sbdocs.sbdocs-content pre .token.deleted span { color: ${syn.removed} !important; }
              .sbdocs.sbdocs-content pre .token.coord { color: ${syn.coord} !important; }
            `}</style>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <DocsContainer context={context as any}>{children}</DocsContainer>
          </CoreAIFluentProvider>
        );
      },
    },
    options: {
      // Top-level sidebar order; anything not listed falls back to alphabetical.
      storySort: {
        method: 'alphabetical',
        order: ['Introduction', 'Components', 'Compat Components', 'Preview Components', '*'],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const themeKey = (context.globals.theme as ThemeKey) ?? 'coreai';
      const mode = (context.globals.mode as ModeKey) ?? 'dark';
      const theme = themeMap[themeKey]?.[mode] ?? coreaiDarkTheme;
      const bg = theme.colorNeutralBackground1;
      // Paint the iframe's <html>/<body> so the theme color reaches every
      // pixel (otherwise the browser's default white shows through behind
      // FluentProvider, producing a white "outline" in dark mode).
      React.useLayoutEffect(() => {
        const prevHtml = document.documentElement.style.background;
        const prevBody = document.body.style.background;
        const prevScheme = document.documentElement.style.colorScheme;
        const prevPreparing = document.documentElement.style.getPropertyValue('--sb-preparing-bg');
        document.documentElement.style.background = bg;
        document.body.style.background = bg;
        document.documentElement.style.colorScheme = mode;
        document.documentElement.style.setProperty(
          '--sb-preparing-bg',
          mode === 'dark' ? 'black' : 'white',
        );
        return () => {
          document.documentElement.style.background = prevHtml;
          document.body.style.background = prevBody;
          document.documentElement.style.colorScheme = prevScheme;
          if (prevPreparing) {
            document.documentElement.style.setProperty('--sb-preparing-bg', prevPreparing);
          } else {
            document.documentElement.style.removeProperty('--sb-preparing-bg');
          }
        };
      }, [bg, mode]);
      // Full-page stories (e.g. Templates/Shell and Navigation) opt out of the
      // padded canvas via `parameters.fullBleed`. A dedicated param is needed
      // because `layout: 'fullscreen'` is set globally and can't distinguish them.
      const isFullBleed = context.parameters.fullBleed === true;
      const isDocs = context.viewMode === 'docs';
      const shouldCenter = !isDocs && !isFullBleed && context.parameters.centered !== false;
      return (
        <CoreAIFluentProvider
          theme={theme}
          withComponentDefaults={themeKey === 'coreai' || themeKey === 'azure'}
          style={{
            ...(!isDocs && { minHeight: '100vh' }),
            background: bg,
            boxSizing: 'border-box',
            ...(isFullBleed
              ? { padding: 0 }
              : {
                  padding: '24px',
                  ...(shouldCenter && {
                    display: 'flex',
                    alignItems: 'safe center',
                    justifyContent: 'safe center',
                  }),
                }),
          }}
        >
          {shouldCenter ? (
            <div style={{ maxWidth: '100%' }}>
              <Story />
            </div>
          ) : (
            <Story />
          )}
        </CoreAIFluentProvider>
      );
    },
  ],
};

export default preview;
