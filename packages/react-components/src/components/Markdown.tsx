// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * `Markdown` — render a Markdown string as styled Fluent UI content.
 *
 * Built on [`react-markdown`][1] with [`remark-gfm`][2] for GitHub Flavored
 * Markdown (tables, strikethrough, task lists, …). Typography, lists, tables,
 * blockquotes, and inline code are themed with Fluent tokens via Griffel.
 *
 * Fenced code blocks render through CoreAI's `CodeBlock`, which handles its
 * own syntax highlighting (`rehype-highlight`) and copy-to-clipboard button.
 * Links render through Fluent's `Link` (external links open in a new tab).
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
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import type { Element } from 'hast';
import ReactMarkdown, { type Components, type Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock.js';
import { Link } from './Link.js';

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
  if (React.isValidElement(node)) {
    return getNodeText((node.props as { children?: React.ReactNode }).children);
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
  const Tag = (node?.tagName ?? 'h2') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
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

const useTableStyles = makeStyles({
  // Wrap wide tables so they scroll horizontally instead of overflowing.
  scroll: {
    overflowX: 'auto',
    maxWidth: '100%',
    marginTop: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM,
  },
});

function Table({
  node: _node,
  children,
  ...rest
}: { node?: Element } & React.ComponentProps<'table'>): React.JSX.Element {
  const styles = useTableStyles();
  return (
    <div className={styles.scroll}>
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

const useStyles = makeStyles({
  root: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    color: tokens.colorNeutralForeground2,

    // Lists.
    '& ul, & ol': { paddingLeft: tokens.spacingHorizontalXL },
    // No margin for nested lists.
    '& ul ul, & ol ol': { marginTop: 0, marginBottom: 0 },

    // Bold / heading weight.
    '& h1, & h2, & h3, & h4, & h5, & h6, & b, & strong, & th': {
      fontWeight: tokens.fontWeightSemibold,
    },

    // Primary foreground for emphasized elements.
    '& h1, & h2, & h3, & h4, & h5, & h6, & strong, & em, & th, & summary': {
      color: tokens.colorNeutralForeground1,
    },

    '& i, & em': { fontStyle: 'italic' },

    // Heading / block-quote scale.
    '& h1': {
      fontSize: tokens.fontSizeHero700,
      lineHeight: tokens.lineHeightHero700,
    },
    '& h2': {
      fontSize: tokens.fontSizeBase600,
      lineHeight: tokens.lineHeightBase600,
    },
    '& h3': {
      fontSize: tokens.fontSizeBase500,
      lineHeight: tokens.lineHeightBase500,
    },
    '& h4, & blockquote': {
      fontSize: tokens.fontSizeBase400,
      lineHeight: tokens.lineHeightBase400,
    },
    '& h5': {
      fontSize: tokens.fontSizeBase300,
      lineHeight: tokens.lineHeightBase300,
    },
    '& h6, & small': {
      fontSize: tokens.fontSizeBase200,
      lineHeight: tokens.lineHeightBase200,
    },

    // Blockquote.
    '& blockquote': {
      marginLeft: 0,
      marginRight: 0,
      paddingLeft: tokens.spacingHorizontalL,
      borderLeft: `${tokens.strokeWidthThick} solid ${tokens.colorNeutralStroke1}`,
      fontStyle: 'italic',
      color: tokens.colorNeutralForeground1,
    },

    '& q': {
      fontStyle: 'italic',
      color: tokens.colorNeutralForeground1,
    },

    '& code, & kbd, & samp, & pre': {
      fontFamily: tokens.fontFamilyMonospace,
    },

    '& del, & s': {
      textDecoration: 'line-through',
      color: tokens.colorNeutralForeground4,
    },

    // Inline code/kbd/samp inside text blocks (fenced/highlighted code is
    // rendered by `CodeBlock` and carries a class, so it's excluded here).
    '& :where(p, h1, h2, h3, h4, h5, h6, blockquote, ul, ol) :where(code, kbd, samp):not([class], [style])':
      {
        padding: '1px 4px',
        borderRadius: tokens.borderRadiusMedium,
        // Downscale inline monospace font so it has the same visual weight as sans.
        fontSize: '0.9em',
        color: tokens.colorNeutralForeground1,
        verticalAlign: 'bottom',
        backgroundColor: tokens.colorNeutralBackground3,
      },

    '& .fui-CodeBlock': {
      marginBlock: tokens.spacingVerticalM,
    },
    // covered by CodeBlock
    /* "& pre:not([class], [style])": {
      overflowX: "auto",
      padding: tokens.spacingHorizontalM,
      borderRadius: tokens.borderRadiusXLarge,
      fontFamily: tokens.fontFamilyMonospace,
    }, */

    // Horizontal rule.
    '& hr': {
      marginTop: tokens.spacingVerticalXL,
      marginBottom: tokens.spacingVerticalXL,
      marginLeft: 0,
      marginRight: 0,
      border: 'none',
      borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    },

    // Vertical rhythm between block elements.
    '& :where(div, p, h1, h2, h3, h4, h5, h6, blockquote, ul, ol):not([class], [style])': {
      marginTop: tokens.spacingVerticalM,
      marginBottom: tokens.spacingVerticalM,
    },

    '& :is(h1, h2, h3, h4, h5, h6):not([class], [style], :first-child)': {
      marginTop: '1em',
    },

    // Collapse outer margins of the first/last child.
    '& > :not([class], [style]):first-child': { marginTop: 0 },
    '& > :not([class], [style]):last-child': { marginBottom: 0 },

    '& img': {
      maxWidth: '100%',
      borderRadius: tokens.borderRadiusMedium,
    },

    // Tables.
    '& table': {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: 0,
      border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
      borderRadius: tokens.borderRadiusXLarge,
      overflow: 'hidden',
    },
    '& th, & td': {
      padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalL}`,
      borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
      textAlign: 'left',
    },
    '& th': {
      color: tokens.colorNeutralForeground1,
      fontWeight: tokens.fontWeightSemibold,
      backgroundColor: tokens.colorNeutralBackground3,
    },
    '& tr:last-child td': { borderBottom: 'none' },

    // Rendered footnotes (from `remark-gfm`).
    '& [data-footnotes]': {
      marginTop: tokens.spacingVerticalL,
      backgroundColor: tokens.colorNeutralBackground3,
      padding: tokens.spacingVerticalM,
      borderRadius: tokens.borderRadiusXLarge,
      fontSize: tokens.fontSizeBase200,
      lineHeight: tokens.lineHeightBase200,
    },
    '& [data-footnotes] h2': {
      fontSize: 'inherit',
      lineHeight: 'inherit',
    },
    '& [data-footnotes] :is(h2, p, ul, ol)': {
      marginBlock: '0 !important',
    },
  },
});

/**
 * Render a Markdown string as themed Fluent UI content.
 */
export function Markdown(props: MarkdownProps): React.JSX.Element {
  const { content, className, components, remarkPlugins, rehypePlugins, ...rest } = props;
  const styles = useStyles();

  return (
    <div className={mergeClasses('fui-Markdown', styles.root, className)}>
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
