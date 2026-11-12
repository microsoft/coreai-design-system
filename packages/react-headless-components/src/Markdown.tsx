// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * `Markdown` — render a Markdown string as styled CoreAI content.
 *
 * Built on [`react-markdown`][1] with [`remark-gfm`][2] for GitHub Flavored
 * Markdown (tables, strikethrough, task lists, …). Typography, lists, tables,
 * blockquotes, and inline code use themed CSS Modules.
 *
 * Fenced code blocks render through the local `CodeBlock`, which handles its
 * own syntax highlighting (`rehype-highlight`) and copy-to-clipboard button.
 * Links render through the local CoreAI `Link` (external links open in a new tab).
 *
 * Math is not rendered by default. To enable it, pass the `remark-math` /
 * `rehype-katex` plugins and KaTeX's stylesheet from the consuming app:
 *
 * ```tsx
 * import remarkMath from "remark-math";
 * import rehypeKatex from "rehype-katex";
 * import "katex/dist/katex.min.css";
 *
 * <Markdown content={md} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} />
 * ```
 *
 * [1]: https://github.com/remarkjs/react-markdown
 * [2]: https://github.com/remarkjs/remark-gfm
 */
import * as React from 'react';
import type { Element } from 'hast';
import ReactMarkdown, { type Components, type Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock.js';
import { Link } from './Link.js';
import styles from './Markdown.module.css';

export const markdownClassNames = { root: 'fui-Markdown' } as const;

export type MarkdownProps = Omit<Options, 'children' | 'components'> & {
  /** The Markdown source to render. */
  content: string;
  /** Additional class applied to the wrapping element. */
  className?: string;
  /** Override or extend the default element renderers. */
  components?: Components;
};

/** Recursively flatten a React node tree down to its visible text content. */
function getNodeText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getNodeText).join('');
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return getNodeText(node.props.children);
  }
  return '';
}

/**
 * Derive a slug-style `id` from a heading so anchor links resolve. Inline
 * formatting (bold, links, code, …) is flattened to plain text first, then
 * everything but letters and numbers is collapsed to hyphens.
 */
function getHeadingId(children: React.ReactNode): string | undefined {
  const slug = getNodeText(children)
    .toLowerCase()
    .replace(/[^\da-z]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return slug || undefined;
}

/** Pull the raw source + language hint out of a `<pre>`'s child `<code>`. */
function extractCode(node: Element | undefined): { code: string; language?: string } | null {
  const codeEl = node?.children.find(
    (child): child is Element => child.type === 'element' && child.tagName === 'code',
  );
  if (!codeEl) {
    return null;
  }

  const rawClassName = codeEl.properties?.className;
  const className = Array.isArray(rawClassName)
    ? rawClassName.join(' ')
    : String(rawClassName ?? '');
  const language = /language-(\w+)/.exec(className)?.[1];
  const code = codeEl.children
    .map((child) => (child.type === 'text' ? child.value : ''))
    .join('')
    .replace(/\n$/, '');

  return { code, language };
}

function Heading({
  node,
  children,
}: { node?: Element } & React.PropsWithChildren): React.JSX.Element {
  const name = node?.tagName;
  const Tag =
    name === 'h1' ||
    name === 'h2' ||
    name === 'h3' ||
    name === 'h4' ||
    name === 'h5' ||
    name === 'h6'
      ? name
      : 'h2';
  return <Tag id={getHeadingId(children)}>{children}</Tag>;
}

function Anchor({
  href,
  children,
}: { href?: string } & React.PropsWithChildren): React.JSX.Element {
  const isExternal = !!href && !href.startsWith('#');
  return (
    <Link href={href} external={isExternal}>
      {children}
    </Link>
  );
}

function Pre({ node, children }: { node?: Element } & React.PropsWithChildren): React.JSX.Element {
  const info = extractCode(node);
  // Fall back to a plain `<pre>` for the (invalid) case of no inner `<code>`.
  if (!info) {
    return <pre>{children}</pre>;
  }
  return <CodeBlock code={info.code} language={info.language} />;
}

function Table({
  node: _node,
  children,
  ...rest
}: { node?: Element } & React.ComponentProps<'table'>): React.JSX.Element {
  return (
    <div className={styles.Markdown__tableScroll}>
      <table {...rest}>{children}</table>
    </div>
  );
}

const defaultComponents: Components = {
  pre: Pre,
  a: Anchor,
  table: Table,
  h1: Heading,
  h2: Heading,
  h3: Heading,
  h4: Heading,
  h5: Heading,
  h6: Heading,
};

/** Render a Markdown string as themed CoreAI content. */
export function Markdown({
  content,
  className,
  components,
  remarkPlugins,
  rehypePlugins,
  ...rest
}: MarkdownProps): React.JSX.Element {
  return (
    <div
      className={[markdownClassNames.root, styles.Markdown, className].filter(Boolean).join(' ')}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, ...(remarkPlugins ?? [])]}
        rehypePlugins={[...(rehypePlugins ?? [])]}
        components={{ ...defaultComponents, ...components }}
        {...rest}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

Markdown.displayName = 'Markdown';
