// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Wrapped `Link` that adds an `external` prop to Fluent UI's Link.
 *
 * When `external` is `true`, an open-in-new / external-link icon
 * (`Open16Regular`) is rendered inline immediately after the link text. The
 * icon is decorative (`aria-hidden`) and scales with the surrounding font
 * size. Everything else about Fluent's `Link` is preserved.
 *
 * Styling is expressed with Griffel `makeStyles` + Fluent `tokens`.
 */
import * as React from 'react';
import {
  Link as FluentLink,
  makeStyles,
  mergeClasses,
  tokens,
  type ForwardRefComponent,
  type LinkProps as FluentLinkProps,
} from '@fluentui/react-components';
import { OpenFilled } from '@fluentui/react-icons';

const useLinkStyles = makeStyles({
  // Lay the text and trailing icon out on a single inline baseline row so the
  // icon sits right after the text and wraps with it.
  external: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXXS,
  },

  // Scale the icon with the link's font size
  icon: {
    fontSize: '1.1em',
  },
});

export type LinkProps = FluentLinkProps & {
  /**
   * When `true`, renders an external-link icon inline after the link text to
   * signal that the destination opens outside the current context.
   * Defaults `target` to `_blank` and `rel` to `noopener noreferrer`.
   */
  external?: boolean;
  target?: React.AnchorHTMLAttributes<HTMLAnchorElement>['target'];
  rel?: React.AnchorHTMLAttributes<HTMLAnchorElement>['rel'];
};

/**
 * A link component that extends Fluent UI's Link with an `external` flag that
 * appends an inline external-link icon after the link text.
 */
export const Link: ForwardRefComponent<LinkProps> = React.forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  LinkProps
>((props, ref) => {
  const { external = false, className, children, target, rel, ...rest } = props;
  const styles = useLinkStyles();
  const externalProps = external
    ? { target: target ?? '_blank', rel: rel ?? 'noopener noreferrer' }
    : { target, rel };

  return (
    <FluentLink
      ref={ref}
      className={mergeClasses(external && styles.external, className)}
      {...externalProps}
      {...rest}
    >
      {children}
      {external && <OpenFilled className={styles.icon} aria-hidden />}
    </FluentLink>
  );
}) as ForwardRefComponent<LinkProps>;

Link.displayName = 'Link';
