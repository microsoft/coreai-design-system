// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { ButtonSlots } from '@fluentui/react-headless-components-preview/button';
import {
  slot,
  type ExtractSlotProps,
  type ForwardRefComponent,
  type SlotRenderFunction,
} from '@fluentui/react-utilities';
import { OpenFilled } from '@fluentui/react-icons/headless/svg/open';
import './Icon.css';
import { Button, type ButtonProps } from './Button.js';

export const linkButtonClassNames = {
  root: 'fui-LinkButton',
} as const;

type NativeAnchorProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'aria-disabled'>;
type AnchorRootProps = Extract<ExtractSlotProps<ButtonSlots['root']>, { as: 'a' }>;

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
>(function LinkButton(props, ref) {
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
  const iconOnly = Boolean(slot.resolveShorthand(resolvedIcon)?.children && !children);
  const content = iconOnly ? undefined : children;

  // A root renderer consumes Button's children; retain their content and visual metadata.
  const renderAnchor: SlotRenderFunction<AnchorRootProps> = (_Component, resolvedProps) => (
    <Root
      {...resolvedProps}
      data-has-content={children ? '' : undefined}
      data-icon-only={iconOnly ? '' : undefined}
    >
      {resolvedIconPosition === 'after' && content}
      {resolvedProps.children}
      {resolvedIconPosition !== 'after' && content}
    </Root>
  );

  return (
    <Button
      {...rest}
      {...externalProps}
      as="a"
      ref={ref}
      className={[linkButtonClassNames.root, className].filter(Boolean).join(' ')}
      icon={resolvedIcon}
      iconPosition={resolvedIconPosition}
    >
      {Root === 'a' ? children : renderAnchor}
    </Button>
  );
});

LinkButton.displayName = 'LinkButton';
