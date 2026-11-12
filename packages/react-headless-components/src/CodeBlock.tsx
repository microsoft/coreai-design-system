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
 * `vs2015` (dark) — translated from the CoreAI source into CSS Modules. The
 * block reads the active theme mode via the local `useFluentThemeMode`.
 *
 * [1]: https://github.com/rehypejs/rehype-highlight
 */
import * as React from 'react';
import type { RefAttributes } from '@fluentui/react-utilities';
import type { Root } from 'hast';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import rehypeHighlight from 'rehype-highlight';
import { unified } from 'unified';
import { useFluentThemeMode } from './FluentThemeModeContext.js';
import { CopyButton } from './CopyButton.js';
import styles from './CodeBlock.module.css';

export const codeBlockClassNames = {
  root: 'fui-CodeBlock',
  pre: 'fui-CodeBlock__pre',
  header: 'fui-CodeBlock__header',
  footer: 'fui-CodeBlock__footer',
  fallbackContent: 'fui-CodeBlock__fallbackContent',
  copyButton: 'fui-CodeBlock__CopyButton',
} as const;

// A single shared processor — `rehype-highlight` is the only plugin we run.
// Code without an explicit `language-*` class is left un-highlighted (grammar
// auto-detection is intentionally disabled — it guesses wrong too often).
// The transformer mutates a HAST Root in place; keep both pipeline trees typed.
const processor = unified().use<Parameters<typeof rehypeHighlight>, Root, Root>(rehypeHighlight);

/** Build a minimal `<pre><code>` hast tree and highlight it in place. */
function highlight(code: string, language: string | undefined): Root {
  const tree: Root = {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'pre',
        properties: { className: [codeBlockClassNames.pre, styles.CodeBlock__pre] },
        children: [
          {
            type: 'element',
            tagName: 'code',
            properties: { className: language ? [`language-${language}`] : [] },
            children: [{ type: 'text', value: code }],
          },
        ],
      },
    ],
  };

  return processor.runSync(tree);
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
   * - divided header splits the code block and header with a border
   * - subtle header has no border and is flush with the code block
   * @default 'divided'
   */
  headerAppearance?: 'divided' | 'subtle';
  /** Optional content rendered in a footer below the code. */
  footer?: React.ReactNode;
  /** Optional class name for the footer element. */
  footerClassName?: string;
  /**
   * - divided footer separates the code and footer with a border
   * - subtle footer has no border and is flush with the code block
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

/** Render source code with syntax highlighting via `rehype-highlight`. */
export const CodeBlock: React.NamedExoticComponent<CodeBlockProps & RefAttributes<HTMLDivElement>> =
  React.forwardRef<HTMLDivElement, CodeBlockProps>(function CodeBlock(
    {
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
    },
    ref,
  ) {
    const mode = useFluentThemeMode();
    const highlightedContent = React.useMemo(
      () => (code ? toJsxRuntime(highlight(code, language), { Fragment, jsx, jsxs }) : null),
      [code, language],
    );
    const copyButton = React.useMemo(
      () =>
        hideCopybutton || !code ? null : (
          <CopyButton
            className={[codeBlockClassNames.copyButton, styles.CodeBlock__copyButton].join(' ')}
            aria-label="Copy code"
            contentToCopy={code}
          />
        ),
      [code, hideCopybutton],
    );

    return (
      <div
        {...rest}
        ref={ref}
        className={[codeBlockClassNames.root, styles.CodeBlock, className]
          .filter(Boolean)
          .join(' ')}
        data-appearance={appearance}
        data-theme-mode={mode}
      >
        {header != null && (
          <div
            className={[codeBlockClassNames.header, styles.CodeBlock__header, headerClassName]
              .filter(Boolean)
              .join(' ')}
            data-appearance={headerAppearance}
          >
            {header}
            {copyButton}
          </div>
        )}
        {header == null && copyButton}
        {highlightedContent ??
          (fallbackContent != null && (
            <div
              className={[
                codeBlockClassNames.fallbackContent,
                styles.CodeBlock__fallbackContent,
              ].join(' ')}
            >
              {fallbackContent}
            </div>
          ))}
        {footer != null && (
          <div
            className={[codeBlockClassNames.footer, styles.CodeBlock__footer, footerClassName]
              .filter(Boolean)
              .join(' ')}
            data-appearance={footerAppearance}
          >
            {footer}
          </div>
        )}
      </div>
    );
  });

CodeBlock.displayName = 'CodeBlock';
