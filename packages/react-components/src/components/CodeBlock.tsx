// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * `CodeBlock` — render a string of source code with syntax highlighting.
 *
 * Highlighting is done with [`rehype-highlight`][1] (which wraps
 * `highlight.js`/`lowlight`). The code string is wrapped in a minimal
 * `<pre><code class="language-*">` hast tree, run through the rehype-highlight
 * transformer, then converted to React elements.
 *
 * Token colors use the Visual Studio highlight.js themes — `vs` (light) and
 * `vs2015` (dark) — ported into Griffel. The block reads the active theme mode
 * via `useFluentThemeMode` and swaps between the two palettes accordingly.
 *
 * [1]: https://github.com/rehypejs/rehype-highlight
 */
import * as React from 'react';
import {
  makeStyles,
  mergeClasses,
  tokens,
  type ForwardRefComponent,
} from '@fluentui/react-components';
import type { Root } from 'hast';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import rehypeHighlight from 'rehype-highlight';
import { unified } from 'unified';
import { useFluentThemeMode } from '../contexts/FluentThemeModeContext.js';
import { CopyButton } from './CopyButton.js';

// A single shared processor — `rehype-highlight` is the only plugin we run.
// Code without an explicit `language-*` class is left un-highlighted (grammar
// auto-detection is intentionally disabled — it guesses wrong too often).
const processor = unified().use(rehypeHighlight);

/** Build a minimal `<pre><code>` hast tree and highlight it in place. */
function highlight(code: string, language: string | undefined): Root {
  const tree: Root = {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'pre',
        properties: { className: ['fui-CodeBlock__pre'] },
        children: [
          {
            type: 'element',
            tagName: 'code',
            properties: {
              className: language ? [`language-${language}`] : [],
            },
            children: [{ type: 'text', value: code }],
          },
        ],
      },
    ],
  };

  return processor.runSync(tree) as Root;
}

export type CodeBlockProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** The source code to highlight. */
  code?: string;
  /** Content rendered in place of the code when `code` is empty or omitted. */
  fallbackContent?: React.ReactNode;
  /** Optional content rendered in a header above the code. */
  header?: React.ReactNode;
  /** Optional class name for the header element. */
  headerClassName?: string;
  /**
   * - divided header splits the codeblack and header with a border
   * - subtle header has no border and is flush with the codeblock
   * @default 'divided'
   */
  headerAppearance?: 'divided' | 'subtle';
  /** Optional content rendered in a footer below the code. */
  footer?: React.ReactNode;
  /** Optional class name for the footer element. */
  footerClassName?: string;
  /**
   * - divided footer separates the code and footer with a border
   * - subtle footer has no border and is flush with the codeblock
   * @default 'divided'
   */
  footerAppearance?: 'divided' | 'subtle';
  /**
   * Language hint (e.g. `"js"`, `"ts"`, `"css"`). Sets the `language-*` class
   * `rehype-highlight` keys off. When omitted, the code is left un-highlighted.
   */
  language?: string;
  /**
   * Visual style of the surrounding surface, matching `Card`'s appearances.
   * `subtle` is borderless, transparent, and also drops the inner padding.
   * @default 'filled-alternative'
   */
  appearance?: 'filled' | 'filled-alternative' | 'outline' | 'subtle';
  /** Whether to hide the copy button. @default false */
  hideCopybutton?: boolean;
};

const useStyles = makeStyles({
  root: {
    position: 'relative',
    borderRadius: tokens.borderRadiusXLarge,

    // Set in Appearance variants below
    backgroundColor: 'var(--fui-CodeBlock--background)',
    border: 'var(--fui-CodeBlock--border)',

    // For header padding:
    '--fui-CodeBlock--copyButton-height': '46px', // = copyButton height + top inset * 2

    display: 'flex',
    flexDirection: 'column',

    '& .fui-CodeBlock__pre': {
      margin: 0,
      overflowX: 'auto',
      padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,

      fontFamily: tokens.fontFamilyMonospace,
      color: tokens.colorNeutralForeground2,
      fontSize: tokens.fontSizeBase300,
      lineHeight: tokens.lineHeightBase300,
    },
    '& code': {
      fontFamily: 'inherit',
    },

    '& .hljs-emphasis': {
      fontStyle: 'italic',
    },
    '& .hljs-strong': {
      fontWeight: tokens.fontWeightSemibold,
    },
  },

  header: {
    boxSizing: 'border-box',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    paddingTop: tokens.spacingHorizontalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingBottom: tokens.spacingVerticalXXS,
    paddingRight: 'var(--fui-CodeBlock--copyButton-height)',
  },
  // headerSubtle: {} // has no extra styling
  headerDivided: {
    paddingTop: tokens.spacingHorizontalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalS,
    paddingRight: 'var(--fui-CodeBlock--copyButton-height)',
    minHeight: 'var(--fui-CodeBlock--copyButton-height)',
    borderBottom: `var(--fui-CodeBlock--border)`,
  },

  footer: {
    boxSizing: 'border-box',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    paddingTop: tokens.spacingVerticalXXS,
    paddingRight: tokens.spacingHorizontalL,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalL,
  },
  footerDivided: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    borderTop: `var(--fui-CodeBlock--border)`,
  },

  fallbackContent: {
    overflow: 'auto',
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
  },

  // Copy button pinned to the top-right corner, above the (scrolling) code.
  copyButton: {
    position: 'absolute',
    top: tokens.spacingVerticalSNudge,
    right: tokens.spacingHorizontalSNudge,
    zIndex: 1,
  },

  // Appearance variants (mirror `Card`'s appearances and ordering).
  filledAlternative: {
    '--fui-CodeBlock--background': tokens.colorNeutralBackground3,
    '--fui-CodeBlock--border': `${tokens.strokeWidthThin} solid ${tokens.colorNeutralBackground1}`,
  },
  filled: {
    '--fui-CodeBlock--background': tokens.colorNeutralBackground1,
    '--fui-CodeBlock--border': `${tokens.strokeWidthThin} solid ${tokens.colorNeutralBackground3}`,
  },
  outline: {
    '--fui-CodeBlock--background': tokens.colorTransparentBackground,
    '--fui-CodeBlock--border': `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
  },
  subtle: {
    '--fui-CodeBlock--background': tokens.colorTransparentBackground,
    '--fui-CodeBlock--border': 'none',
    // `subtle` is meant to sit inline with surrounding content, so drop the inner padding entirely.
    '& pre': {
      padding: 0,
    },
  },

  // Visual Studio light theme (highlight.js `vs.css`).
  light: {
    '& .hljs-comment, & .hljs-quote, & .hljs-variable': {
      color: '#008000',
    },
    '& .hljs-keyword, & .hljs-selector-tag, & .hljs-built_in, & .hljs-name, & .hljs-tag': {
      color: '#0000ff',
    },
    '& .hljs-string, & .hljs-title, & .hljs-section, & .hljs-attribute, & .hljs-literal, & .hljs-template-tag, & .hljs-template-variable, & .hljs-type, & .hljs-addition':
      {
        color: '#a31515',
      },
    '& .hljs-deletion, & .hljs-selector-attr, & .hljs-selector-pseudo, & .hljs-meta': {
      color: '#2b91af',
    },
    '& .hljs-doctag': {
      color: '#808080',
    },
    '& .hljs-attr': {
      color: '#ff0000',
    },
    '& .hljs-symbol, & .hljs-bullet, & .hljs-link': {
      color: '#00b0e8',
    },
  },

  // Visual Studio 2015 dark theme (highlight.js `vs2015.css`).
  dark: {
    '& .hljs-keyword, & .hljs-literal, & .hljs-symbol, & .hljs-name': {
      color: '#569cd6',
    },
    '& .hljs-link': {
      color: '#569cd6',
      textDecorationLine: 'underline',
    },
    '& .hljs-built_in, & .hljs-type': {
      color: '#4ec9b0',
    },
    '& .hljs-number, & .hljs-class': {
      color: '#b8d7a3',
    },
    '& .hljs-string, & .hljs-meta .hljs-string': {
      color: '#d69d85',
    },
    '& .hljs-regexp, & .hljs-template-tag': {
      color: '#9a5334',
    },
    '& .hljs-subst, & .hljs-function, & .hljs-title, & .hljs-params, & .hljs-formula': {
      color: '#dcdcdc',
    },
    '& .hljs-comment, & .hljs-quote': {
      color: '#57a64a',
      fontStyle: 'italic',
    },
    '& .hljs-doctag': {
      color: '#608b4e',
    },
    '& .hljs-meta, & .hljs-meta .hljs-keyword, & .hljs-tag': {
      color: '#9b9b9b',
    },
    '& .hljs-variable, & .hljs-template-variable': {
      color: '#bd63c5',
    },
    '& .hljs-attr, & .hljs-attribute': {
      color: '#9cdcfe',
    },
    '& .hljs-section': {
      color: '#ffd700',
    },
    '& .hljs-bullet, & .hljs-selector-tag, & .hljs-selector-id, & .hljs-selector-class, & .hljs-selector-attr, & .hljs-selector-pseudo':
      {
        color: '#d7ba7d',
      },
    '& .hljs-addition': {
      backgroundColor: '#144212',
      display: 'inline-block',
      width: '100%',
    },
    '& .hljs-deletion': {
      backgroundColor: '#660000',
      display: 'inline-block',
      width: '100%',
    },
  },
});

/**
 * Render source code with syntax highlighting via `rehype-highlight`.
 */
export const CodeBlock: ForwardRefComponent<CodeBlockProps> = React.forwardRef<
  HTMLDivElement,
  CodeBlockProps
>((props, ref) => {
  const {
    code,
    fallbackContent,
    language,
    header,
    headerClassName,
    headerAppearance = 'divided',
    footer,
    footerClassName,
    footerAppearance = 'divided',
    appearance = 'filled-alternative',
    hideCopybutton = false,
    className,
    ...rest
  } = props;
  const styles = useStyles();
  const mode = useFluentThemeMode();

  const appearanceClass = {
    filled: styles.filled,
    'filled-alternative': styles.filledAlternative,
    outline: styles.outline,
    subtle: styles.subtle,
  }[appearance];

  const highlightedContent = React.useMemo(
    () => (code ? toJsxRuntime(highlight(code, language), { Fragment, jsx, jsxs }) : null),
    [code, language],
  );

  const copyButton = React.useMemo(
    () =>
      hideCopybutton || !code ? null : (
        <CopyButton
          className={mergeClasses('fui-CodeBlock__CopyButton', styles.copyButton)}
          aria-label="Copy code"
          contentToCopy={code}
        />
      ),
    [code, hideCopybutton, styles.copyButton],
  );

  return (
    <div
      ref={ref}
      className={mergeClasses(
        'fui-CodeBlock',
        styles.root,
        appearanceClass,
        mode === 'dark' ? styles.dark : styles.light,
        className,
      )}
      {...rest}
    >
      {header != null && (
        <div
          className={mergeClasses(
            'fui-CodeBlock__header',
            styles.header,
            headerAppearance === 'divided' && styles.headerDivided,
            headerClassName,
          )}
        >
          {header}
          {copyButton}
        </div>
      )}
      {header == null && copyButton}
      {highlightedContent ??
        (fallbackContent != null && (
          <div className={mergeClasses('fui-CodeBlock__fallbackContent', styles.fallbackContent)}>
            {fallbackContent}
          </div>
        ))}
      {footer != null && (
        <div
          className={mergeClasses(
            'fui-CodeBlock__footer',
            styles.footer,
            footerAppearance === 'divided' && styles.footerDivided,
            footerClassName,
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';
