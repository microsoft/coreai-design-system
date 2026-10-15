// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Avatar as FluentAvatar,
  makeStyles,
  mergeClasses,
  tokens,
  type AvatarProps as FluentAvatarProps,
  type ForwardRefComponent,
} from '@fluentui/react-components';

/**
 * CoreAI Avatar color options. Extends Fluent's `color` prop with an
 * additional `"neutral-alt"` value.
 *
 * - `"neutral"` → `colorNeutralBackground4`
 * - `"neutral-alt"` → `colorNeutralBackground1`
 */
export type AvatarColor = NonNullable<FluentAvatarProps['color']> | 'neutral-alt';

export type AvatarProps = Omit<FluentAvatarProps, 'color'> & {
  /**
   * The color of the avatar. In addition to Fluent's options, CoreAI adds
   * `"neutral-alt"` so a neutral avatar can sit on either a low- or
   * high-elevation surface with appropriate contrast.
   *
   * - `"neutral"` uses `colorNeutralBackground4`
   * - `"neutral-alt"` uses `colorNeutralBackground1`
   */
  color?: AvatarColor;
};

const useAvatarStyles = makeStyles({
  neutral: {
    '& .fui-Avatar__initials, & .fui-Avatar__icon': {
      backgroundColor: tokens.colorNeutralBackground4,
    },
  },
  neutralAlt: {
    '& .fui-Avatar__initials, & .fui-Avatar__icon': {
      backgroundColor: tokens.colorNeutralBackground1,
    },
  },
});

export const Avatar: ForwardRefComponent<AvatarProps> = React.forwardRef<
  HTMLSpanElement,
  AvatarProps
>((props, ref) => {
  const { color = 'neutral', className, ...rest } = props;
  const styles = useAvatarStyles();

  const isNeutral = color === 'neutral';
  const isNeutralAlt = color === 'neutral-alt';

  return (
    <FluentAvatar
      ref={ref}
      // `neutral-alt` is a CoreAI-only value; map it back to Fluent's
      // `neutral` so the underlying component renders correctly, then layer
      // our background override on top.
      color={isNeutralAlt ? 'neutral' : color}
      className={mergeClasses(
        isNeutral && styles.neutral,
        isNeutralAlt && styles.neutralAlt,
        className,
      )}
      {...rest}
    />
  );
}) as ForwardRefComponent<AvatarProps>;

Avatar.displayName = 'Avatar';
