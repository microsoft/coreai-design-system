// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  mergeClasses,
  type ButtonProps,
  type ForwardRefComponent,
} from '@fluentui/react-components';
import { OpenFilled } from '@fluentui/react-icons';
import { Button } from './Button.js';

type NativeAnchorProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'aria-disabled'>;

export type LinkButtonProps = Omit<ButtonProps, keyof NativeAnchorProps | 'as'> &
  NativeAnchorProps & {
    /** An anchor-compatible component used to render the root. */
    as?: React.ElementType<NativeAnchorProps>;
    /**
     * When `true`, renders an external-link icon after the content and defaults
     * `target` to `_blank` and `rel` to `noopener noreferrer`.
     */
    external?: boolean;
  };

/**
 * A native anchor with the complete CoreAI Button visual and content API.
 */
export const LinkButton: ForwardRefComponent<LinkButtonProps> = React.forwardRef<
  HTMLAnchorElement,
  LinkButtonProps
>((props, ref) => {
  const {
    as: Root = 'a',
    external = false,
    className,
    children,
    target,
    rel,
    icon,
    iconPosition,
    ...rest
  } = props;
  const externalProps = external
    ? { target: target ?? '_blank', rel: rel ?? 'noopener noreferrer' }
    : { target, rel };
  const resolvedIcon = external && icon === undefined ? <OpenFilled aria-hidden /> : icon;
  const resolvedIconPosition = external && iconPosition === undefined ? 'after' : iconPosition;

  return (
    <Button
      {...rest}
      {...externalProps}
      as={Root as 'a'}
      ref={ref}
      className={mergeClasses('fui-LinkButton', className)}
      icon={resolvedIcon}
      iconPosition={resolvedIconPosition}
    >
      {children}
    </Button>
  );
}) as ForwardRefComponent<LinkButtonProps>;

LinkButton.displayName = 'LinkButton';
