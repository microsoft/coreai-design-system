// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderLink,
  useLink,
  useLinkContext,
  type LinkProps as HeadlessLinkProps,
} from '@fluentui/react-headless-components-preview/link';
import { OpenFilled } from '@fluentui/react-icons/headless/svg/open';
import { useBackgroundAppearance } from '@fluentui/react-shared-contexts';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import styles from './Link.module.css';
import overrides from './Link.overrides.module.css';

export type { LinkSlots } from '@fluentui/react-headless-components-preview/link';

export const linkClassNames = {
  root: 'fui-Link',
  externalIcon: 'fui-Link__externalIcon',
} as const;

export type LinkProps = HeadlessLinkProps & {
  /** Visual emphasis. @default 'default' */
  appearance?: 'default' | 'subtle';
  /** Underlines a link used alongside text. Inherits the public Link context when omitted. */
  inline?: boolean;
  /**
   * Appends a decorative external-link glyph and defaults target to "_blank"
   * and rel to "noopener noreferrer" for anchors. Explicit navigation props take precedence.
   * @default false
   */
  external?: boolean;
};

export const Link: ForwardRefComponent<LinkProps> = React.forwardRef<HTMLSpanElement, LinkProps>(
  function Link({ appearance = 'default', inline: inlineProp, external = false, ...props }, ref) {
    const { inline: inlineContext } = useLinkContext();
    const inline = inlineProp ?? !!inlineContext;
    const backgroundAppearance = useBackgroundAppearance();
    let nativeProps: HeadlessLinkProps = props;
    if (
      external &&
      (props.as === 'a' || props.as === undefined) &&
      (props.as === 'a' || props.href)
    ) {
      nativeProps = {
        ...props,
        target: props.target ?? '_blank',
        rel: props.rel ?? 'noopener noreferrer',
      };
    }
    const state = useLink(nativeProps, ref);

    Object.assign(state.root, {
      'data-appearance': appearance,
      'data-background-appearance': backgroundAppearance,
      'data-inline': inline ? '' : undefined,
      'data-external': external ? '' : undefined,
      'data-has-href': state.root.as === 'a' && state.root.href ? '' : undefined,
    });
    state.root.className = [
      linkClassNames.root,
      styles.Link,
      external && overrides.Link,
      state.root.className,
    ]
      .filter(Boolean)
      .join(' ');

    if (external) {
      // Keep the resolved root slot and its caller render function. The glyph is default content.
      state.root.children = (
        <>
          {state.root.children}
          <OpenFilled
            className={[
              linkClassNames.externalIcon,
              styles.Link__externalIcon,
              overrides.Link__externalIcon,
            ].join(' ')}
            aria-hidden
          />
        </>
      );
    }

    return renderLink(state);
  },
);

Link.displayName = 'Link';
