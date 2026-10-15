// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Link as RouterLink,
  NavLink as RouterNavLink,
  type LinkProps as RouterLinkProps,
  type NavLinkProps as RouterNavLinkProps,
} from 'react-router-dom';

const routerLinkPropNames = [
  'defaultShouldRevalidate',
  'discover',
  'download',
  'hrefLang',
  'mask',
  'media',
  'ping',
  'prefetch',
  'preventScrollReset',
  'referrerPolicy',
  'relative',
  'rel',
  'reloadDocument',
  'replace',
  'state',
  'target',
  'to',
  'type',
  'viewTransition',
] as const satisfies readonly (keyof RouterLinkProps)[];

type RouterLinkSlotProps = Pick<RouterLinkProps, (typeof routerLinkPropNames)[number]>;
type ComponentProps<T> = Omit<T, keyof RouterLinkSlotProps>;
type SlotRootProps = React.ComponentPropsWithoutRef<'a'> & {
  as?: unknown;
  disabled?: boolean;
  value?: unknown;
};

function splitRouterLinkProps<T extends RouterLinkSlotProps>(
  props: T,
): [RouterLinkSlotProps, ComponentProps<T>] {
  const routerProps: Record<string, unknown> = {};
  const componentProps: Record<string, unknown> = { ...props };

  for (const name of routerLinkPropNames) {
    routerProps[name] = props[name];
    delete componentProps[name];
  }

  return [routerProps as RouterLinkSlotProps, componentProps as ComponentProps<T>];
}

function useStableRouterLinkProps(props: RouterLinkSlotProps): RouterLinkSlotProps {
  const {
    defaultShouldRevalidate,
    discover,
    download,
    hrefLang,
    mask,
    media,
    ping,
    prefetch,
    preventScrollReset,
    referrerPolicy,
    relative,
    rel,
    reloadDocument,
    replace,
    state,
    target,
    to,
    type,
    viewTransition,
  } = props;

  return React.useMemo(
    () => ({
      defaultShouldRevalidate,
      discover,
      download,
      hrefLang,
      mask,
      media,
      ping,
      prefetch,
      preventScrollReset,
      referrerPolicy,
      relative,
      rel,
      reloadDocument,
      replace,
      state,
      target,
      to,
      type,
      viewTransition,
    }),
    [
      defaultShouldRevalidate,
      discover,
      download,
      hrefLang,
      mask,
      media,
      ping,
      prefetch,
      preventScrollReset,
      referrerPolicy,
      relative,
      rel,
      reloadDocument,
      replace,
      state,
      target,
      to,
      type,
      viewTransition,
    ],
  );
}

export function useRouterLinkSlot<T extends RouterLinkSlotProps>(
  props: T,
): [
  React.ForwardRefExoticComponent<SlotRootProps & React.RefAttributes<HTMLAnchorElement>>,
  ComponentProps<T>,
] {
  const [routerProps, componentProps] = splitRouterLinkProps(props);
  const stableRouterProps = useStableRouterLinkProps(routerProps);
  const RouterLinkSlot = React.useMemo(
    () =>
      React.forwardRef<HTMLAnchorElement, SlotRootProps>(
        (
          { as: _as, disabled, href: _href, onClick, tabIndex, type: _type, ...slotProps },
          slotRef,
        ) => {
          const isDisabled =
            disabled ||
            slotProps['aria-disabled'] === true ||
            slotProps['aria-disabled'] === 'true';
          const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
            if (isDisabled) {
              event.preventDefault();
              event.stopPropagation();
              return;
            }

            onClick?.(event);
          };

          return (
            <RouterLink
              {...slotProps}
              {...stableRouterProps}
              target={stableRouterProps.target ?? slotProps.target}
              rel={stableRouterProps.rel ?? slotProps.rel}
              aria-disabled={isDisabled ? true : slotProps['aria-disabled']}
              onClick={handleClick}
              ref={slotRef}
              tabIndex={tabIndex ?? (isDisabled ? -1 : undefined)}
            />
          );
        },
      ),
    [stableRouterProps],
  );

  return [RouterLinkSlot, componentProps];
}

type RouterNavLinkSlotProps = RouterLinkSlotProps &
  Pick<RouterNavLinkProps, 'caseSensitive' | 'end'>;

export function useRouterNavLinkSlot<T extends RouterNavLinkSlotProps>(
  props: T,
  mode: 'anchor' | 'tab' = 'anchor',
): [
  React.ForwardRefExoticComponent<SlotRootProps & React.RefAttributes<HTMLAnchorElement>>,
  Omit<ComponentProps<T>, 'caseSensitive' | 'end'>,
] {
  const { caseSensitive, end, ...linkProps } = props;
  const [routerProps, componentProps] = splitRouterLinkProps(linkProps as T);
  const stableRouterProps = useStableRouterLinkProps(routerProps);
  const RouterNavLinkSlot = React.useMemo(
    () =>
      React.forwardRef<HTMLAnchorElement, SlotRootProps>(
        (
          {
            as: _as,
            disabled,
            href: _href,
            onClick,
            tabIndex,
            type: _type,
            value: _value,
            ...slotProps
          },
          slotRef,
        ) => {
          const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
            if (mode === 'tab' && disabled) {
              event.preventDefault();
              event.stopPropagation();
              return;
            }

            onClick?.(event);
          };

          return (
            <RouterNavLink
              {...slotProps}
              {...stableRouterProps}
              target={stableRouterProps.target ?? slotProps.target}
              rel={stableRouterProps.rel ?? slotProps.rel}
              aria-disabled={mode === 'tab' && disabled ? true : undefined}
              caseSensitive={caseSensitive}
              end={end}
              onClick={handleClick}
              ref={slotRef}
              tabIndex={mode === 'tab' && disabled ? -1 : tabIndex}
            />
          );
        },
      ),
    [caseSensitive, end, mode, stableRouterProps],
  );

  return [RouterNavLinkSlot, componentProps];
}
