// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  TeachingPopoverCarouselFooterButton as PrimitiveCarouselFooterButton,
  renderTeachingPopover,
  renderTeachingPopoverBody,
  renderTeachingPopoverCarousel,
  renderTeachingPopoverCarouselCard,
  renderTeachingPopoverCarouselFooter,
  renderTeachingPopoverCarouselFooterButton,
  renderTeachingPopoverCarouselNav,
  renderTeachingPopoverCarouselNavButton,
  renderTeachingPopoverCarouselPageCount,
  renderTeachingPopoverFooter,
  renderTeachingPopoverHeader,
  renderTeachingPopoverSurface,
  renderTeachingPopoverTitle,
  renderTeachingPopoverTrigger,
  useTeachingPopover,
  useTeachingPopoverBody,
  useTeachingPopoverCarousel,
  useTeachingPopoverCarouselCard,
  useTeachingPopoverCarouselContextValues,
  useTeachingPopoverCarouselFooter,
  useTeachingPopoverCarouselFooterButton,
  useTeachingPopoverCarouselNav,
  useTeachingPopoverCarouselNavButton,
  useTeachingPopoverCarouselPageCount,
  useTeachingPopoverContextValues,
  useTeachingPopoverFooter,
  useTeachingPopoverHeader,
  useTeachingPopoverSurface,
  useTeachingPopoverTitle,
  useTeachingPopoverTrigger,
  type TeachingPopoverBodyProps,
  type TeachingPopoverCarouselCardProps,
  type TeachingPopoverCarouselFooterButtonProps,
  type TeachingPopoverCarouselFooterProps as HeadlessCarouselFooterProps,
  type TeachingPopoverCarouselFooterSlots,
  type TeachingPopoverCarouselNavButtonProps,
  type TeachingPopoverCarouselNavProps,
  type TeachingPopoverCarouselPageCountProps,
  type TeachingPopoverCarouselProps,
  type TeachingPopoverFooterProps,
  type TeachingPopoverHeaderProps,
  type TeachingPopoverProps as HeadlessTeachingPopoverProps,
  type TeachingPopoverSurfaceProps,
  type TeachingPopoverTitleProps,
  type TeachingPopoverTriggerProps,
} from '@fluentui/react-headless-components-preview/teaching-popover';
import { Dismiss12Regular, DismissRegular } from '@fluentui/react-icons/headless/svg/dismiss';
import { Lightbulb16Regular } from '@fluentui/react-icons/headless/svg/lightbulb';
import {
  slot,
  type ExtractSlotProps,
  type ForwardRefComponent,
  type InferredElementRefType,
  type SlotRenderFunction,
} from '@fluentui/react-utilities';
import { buttonClassNames } from './Button.js';
import { popoverSurfaceClassNames } from './PopoverSurface.js';
import { PopoverVisualContext, type PopoverVisualOptions } from './PopoverVisualContext.js';
import styles from './TeachingPopover.module.css';

export {
  useTeachingPopoverCarouselContextValues,
  useTeachingPopoverContextValues,
} from '@fluentui/react-headless-components-preview/teaching-popover';
export type {
  NavButtonRenderFunction,
  TeachingPopoverBaseBridgedContextValue,
  TeachingPopoverBodyProps,
  TeachingPopoverBodySlots,
  TeachingPopoverBodyState,
  TeachingPopoverCarouselCardProps,
  TeachingPopoverCarouselCardSlots,
  TeachingPopoverCarouselCardState,
  TeachingPopoverCarouselContextValues,
  TeachingPopoverCarouselFooterButtonProps,
  TeachingPopoverCarouselFooterButtonSlots,
  TeachingPopoverCarouselFooterButtonState,
  TeachingPopoverCarouselFooterSlots,
  TeachingPopoverCarouselFooterState,
  TeachingPopoverCarouselNavButtonProps,
  TeachingPopoverCarouselNavButtonSlots,
  TeachingPopoverCarouselNavButtonState,
  TeachingPopoverCarouselNavProps,
  TeachingPopoverCarouselNavSlots,
  TeachingPopoverCarouselNavState,
  TeachingPopoverCarouselPageCountProps,
  TeachingPopoverCarouselPageCountRenderFunction,
  TeachingPopoverCarouselPageCountSlots,
  TeachingPopoverCarouselPageCountState,
  TeachingPopoverCarouselProps,
  TeachingPopoverCarouselSlots,
  TeachingPopoverCarouselState,
  TeachingPopoverContextValues,
  TeachingPopoverFooterProps,
  TeachingPopoverFooterState,
  TeachingPopoverHeaderProps,
  TeachingPopoverHeaderSlots,
  TeachingPopoverHeaderState,
  TeachingPopoverState,
  TeachingPopoverSurfaceProps,
  TeachingPopoverSurfaceSlots,
  TeachingPopoverSurfaceState,
  TeachingPopoverTitleProps,
  TeachingPopoverTitleSlots,
  TeachingPopoverTitleState,
  TeachingPopoverTriggerChildProps,
  TeachingPopoverTriggerProps,
  TeachingPopoverTriggerState,
} from '@fluentui/react-headless-components-preview/teaching-popover';

export type TeachingPopoverProps = HeadlessTeachingPopoverProps & PopoverVisualOptions;

export type TeachingPopoverCarouselFooterProps = HeadlessCarouselFooterProps & {
  /** Balances the action buttons or places them after the navigation. @default 'centered' */
  layout?: 'centered' | 'offset';
};

export const teachingPopoverSurfaceClassNames = { root: 'fui-TeachingPopoverSurface' } as const;
export const teachingPopoverHeaderClassNames = {
  root: 'fui-TeachingPopoverHeader',
  icon: 'fui-TeachingPopoverHeader__icon',
  dismissButton: 'fui-TeachingPopoverHeader__dismissButton',
} as const;
export const teachingPopoverTitleClassNames = {
  root: 'fui-TeachingPopoverTitle',
  dismissButton: 'fui-TeachingPopoverTitle__dismissButton',
} as const;
export const teachingPopoverBodyClassNames = {
  root: 'fui-TeachingPopoverBody',
  media: 'fui-TeachingPopoverBody__media',
} as const;
export const teachingPopoverFooterClassNames = { root: 'fui-TeachingPopoverFooter' } as const;
export const teachingPopoverCarouselClassNames = { root: 'fui-TeachingPopoverCarousel' } as const;
export const teachingPopoverCarouselCardClassNames = {
  root: 'fui-TeachingPopoverCarouselCard',
} as const;
export const teachingPopoverCarouselFooterClassNames = {
  root: 'fui-TeachingPopoverCarouselFooter',
  previous: 'fui-TeachingPopoverCarouselFooter__previous',
  next: 'fui-TeachingPopoverCarouselFooter__next',
} as const;
export const teachingPopoverCarouselFooterButtonClassNames = {
  root: 'fui-TeachingPopoverCarouselFooterButton',
} as const;
export const teachingPopoverCarouselNavClassNames = {
  root: 'fui-TeachingPopoverCarouselNav',
} as const;
export const teachingPopoverCarouselNavButtonClassNames = {
  root: 'fui-TeachingPopoverCarouselNavButton',
} as const;
export const teachingPopoverCarouselPageCountClassNames = {
  root: 'fui-TeachingPopoverCarouselPageCount',
} as const;

function styleSlot(
  resolved: { className?: string },
  marker: string,
  scopedClass: string | undefined,
) {
  resolved.className = [marker, scopedClass, resolved.className].filter(Boolean).join(' ');
}

export function TeachingPopover(props: TeachingPopoverProps): React.ReactElement {
  const { appearance, size: sizeProp, ...behaviorProps } = props;
  const size = 'size' in props ? sizeProp : 'medium';
  const state = useTeachingPopover(behaviorProps);
  const contextValues = useTeachingPopoverContextValues(state);
  const visual = React.useMemo(() => ({ appearance, size }), [appearance, size]);
  return (
    <PopoverVisualContext.Provider value={visual}>
      {renderTeachingPopover(state, contextValues)}
    </PopoverVisualContext.Provider>
  );
}

TeachingPopover.displayName = 'TeachingPopover';

export function TeachingPopoverTrigger(props: TeachingPopoverTriggerProps) {
  return renderTeachingPopoverTrigger(useTeachingPopoverTrigger(props));
}

TeachingPopoverTrigger.displayName = 'TeachingPopoverTrigger';

export const TeachingPopoverSurface: ForwardRefComponent<TeachingPopoverSurfaceProps> =
  React.forwardRef<
    InferredElementRefType<TeachingPopoverSurfaceProps>,
    TeachingPopoverSurfaceProps
  >(function TeachingPopoverSurface(props, ref) {
    const { appearance, size } = React.useContext(PopoverVisualContext);
    const state = useTeachingPopoverSurface(props, ref);
    Object.assign(state.root, {
      'data-appearance': appearance,
      'data-size': size,
      'data-teaching-popover-surface': '',
    });
    styleSlot(
      state.root,
      `${popoverSurfaceClassNames.root} ${teachingPopoverSurfaceClassNames.root}`,
      styles.TeachingPopoverSurface,
    );
    return renderTeachingPopoverSurface(state);
  });

TeachingPopoverSurface.displayName = 'TeachingPopoverSurface';

export const TeachingPopoverHeader: ForwardRefComponent<TeachingPopoverHeaderProps> =
  React.forwardRef<HTMLDivElement, TeachingPopoverHeaderProps>(
    function TeachingPopoverHeader(props, ref) {
      const { appearance } = React.useContext(PopoverVisualContext);
      const state = useTeachingPopoverHeader(props, ref);
      Object.assign(state.root, { 'data-appearance': appearance });
      styleSlot(state.root, teachingPopoverHeaderClassNames.root, styles.TeachingPopoverHeader);
      if (state.icon) {
        if (state.icon.children === undefined) {
          state.icon.children = <Lightbulb16Regular className={styles.TeachingPopover__glyph} />;
        }
        Object.assign(state.icon, { 'data-appearance': appearance });
        styleSlot(
          state.icon,
          teachingPopoverHeaderClassNames.icon,
          styles.TeachingPopoverHeader__icon,
        );
      }
      if (state.dismissButton) {
        if (state.dismissButton.children === undefined) {
          state.dismissButton.children = (
            <Dismiss12Regular className={styles.TeachingPopover__glyph} />
          );
        }
        Object.assign(state.dismissButton, { 'data-appearance': appearance });
        styleSlot(
          state.dismissButton,
          teachingPopoverHeaderClassNames.dismissButton,
          styles.TeachingPopoverHeader__dismissButton,
        );
      }
      return renderTeachingPopoverHeader(state);
    },
  );

TeachingPopoverHeader.displayName = 'TeachingPopoverHeader';

export const TeachingPopoverTitle: ForwardRefComponent<TeachingPopoverTitleProps> =
  React.forwardRef<HTMLHeadingElement, TeachingPopoverTitleProps>(
    function TeachingPopoverTitle(props, ref) {
      const { appearance } = React.useContext(PopoverVisualContext);
      const state = useTeachingPopoverTitle(props, ref);
      Object.assign(state.root, { 'data-appearance': appearance });
      styleSlot(state.root, teachingPopoverTitleClassNames.root, styles.TeachingPopoverTitle);
      if (state.dismissButton) {
        if (state.dismissButton.children === undefined) {
          state.dismissButton.children = (
            <DismissRegular className={styles.TeachingPopover__glyph} />
          );
        }
        Object.assign(state.dismissButton, { 'data-appearance': appearance });
        styleSlot(
          state.dismissButton,
          teachingPopoverTitleClassNames.dismissButton,
          styles.TeachingPopoverTitle__dismissButton,
        );
      }
      return renderTeachingPopoverTitle(state);
    },
  );

TeachingPopoverTitle.displayName = 'TeachingPopoverTitle';

export const TeachingPopoverBody: ForwardRefComponent<TeachingPopoverBodyProps> = React.forwardRef<
  HTMLDivElement,
  TeachingPopoverBodyProps
>(function TeachingPopoverBody(props, ref) {
  const state = useTeachingPopoverBody(props, ref);
  styleSlot(state.root, teachingPopoverBodyClassNames.root, styles.TeachingPopoverBody);
  if (state.media) {
    Object.assign(state.media, { 'data-media-length': state.mediaLength });
    styleSlot(state.media, teachingPopoverBodyClassNames.media, styles.TeachingPopoverBody__media);
  }
  return renderTeachingPopoverBody(state);
});

TeachingPopoverBody.displayName = 'TeachingPopoverBody';

export const TeachingPopoverFooter: ForwardRefComponent<TeachingPopoverFooterProps> =
  React.forwardRef<HTMLDivElement, TeachingPopoverFooterProps>(
    function TeachingPopoverFooter(props, ref) {
      const state = useTeachingPopoverFooter(props, ref);
      Object.assign(state.root, { 'data-footer-layout': state.footerLayout });
      styleSlot(state.root, teachingPopoverFooterClassNames.root, styles.TeachingPopoverFooter);
      return renderTeachingPopoverFooter(state);
    },
  );

TeachingPopoverFooter.displayName = 'TeachingPopoverFooter';

export const TeachingPopoverCarousel: ForwardRefComponent<TeachingPopoverCarouselProps> =
  React.forwardRef<HTMLDivElement, TeachingPopoverCarouselProps>(
    function TeachingPopoverCarousel(props, ref) {
      const state = useTeachingPopoverCarousel(props, ref);
      const contextValues = useTeachingPopoverCarouselContextValues(state);
      styleSlot(state.root, teachingPopoverCarouselClassNames.root, undefined);
      return renderTeachingPopoverCarousel(state, contextValues);
    },
  );

TeachingPopoverCarousel.displayName = 'TeachingPopoverCarousel';

export const TeachingPopoverCarouselCard: ForwardRefComponent<TeachingPopoverCarouselCardProps> =
  React.forwardRef<HTMLDivElement, TeachingPopoverCarouselCardProps>(
    function TeachingPopoverCarouselCard(props, ref) {
      const state = useTeachingPopoverCarouselCard(props, ref);
      styleSlot(state.root, teachingPopoverCarouselCardClassNames.root, undefined);
      return renderTeachingPopoverCarouselCard(state);
    },
  );

TeachingPopoverCarouselCard.displayName = 'TeachingPopoverCarouselCard';

export const TeachingPopoverCarouselFooterButton: ForwardRefComponent<TeachingPopoverCarouselFooterButtonProps> =
  React.forwardRef<HTMLButtonElement | HTMLAnchorElement, TeachingPopoverCarouselFooterButtonProps>(
    function TeachingPopoverCarouselFooterButton(props, ref) {
      const { appearance: popoverAppearance } = React.useContext(PopoverVisualContext);
      const {
        appearance: appearanceProp,
        size = 'medium',
        shape = 'rounded',
        ...behaviorProps
      } = props;
      const appearance =
        'appearance' in props
          ? (appearanceProp ?? 'secondary')
          : props.navType === 'next'
            ? popoverAppearance === 'brand'
              ? 'secondary'
              : 'primary'
            : popoverAppearance === 'brand'
              ? 'outline'
              : 'secondary';
      const state = useTeachingPopoverCarouselFooterButton(behaviorProps, ref);
      const brandRecipe =
        popoverAppearance === 'brand' &&
        (appearance === 'secondary' || appearance === 'outline') &&
        !props.disabled &&
        !props.disabledFocusable;
      Object.assign(state.root, {
        'data-appearance': appearance,
        'data-size': size,
        'data-shape': shape,
        'data-popover-appearance': popoverAppearance,
        'data-nav-type': state.navType,
        'data-brand-nav': brandRecipe ? state.navType : undefined,
        'data-brand-background': brandRecipe && appearance === 'secondary' ? '' : undefined,
        'data-disabled': props.disabled ? '' : undefined,
        'data-disabled-focusable': props.disabledFocusable ? '' : undefined,
        'data-has-content': state.root.children ? '' : undefined,
      });
      styleSlot(
        state.root,
        `${buttonClassNames.root} ${teachingPopoverCarouselFooterButtonClassNames.root}`,
        styles.TeachingPopoverCarouselFooterButton,
      );
      return renderTeachingPopoverCarouselFooterButton(state);
    },
  );

TeachingPopoverCarouselFooterButton.displayName = 'TeachingPopoverCarouselFooterButton';

type FooterButtonSlotProps = ExtractSlotProps<TeachingPopoverCarouselFooterSlots['next']>;
type FooterAnchorProps = Extract<TeachingPopoverCarouselFooterButtonProps, { as: 'a' }>;
type FooterNativeButtonProps = Extract<TeachingPopoverCarouselFooterButtonProps, { as?: 'button' }>;

const TeachingPopoverFooterAnchor: ForwardRefComponent<Omit<FooterAnchorProps, 'as'>> =
  React.forwardRef<HTMLAnchorElement, Omit<FooterAnchorProps, 'as'>>(
    function TeachingPopoverFooterAnchor(props, ref) {
      return <TeachingPopoverCarouselFooterButton {...props} as="a" ref={ref} />;
    },
  );

function resolveFooterButton(
  value: TeachingPopoverCarouselFooterSlots['previous'],
  resolved: FooterButtonSlotProps,
) {
  const original = slot.resolveShorthand<FooterButtonSlotProps | null | undefined>(value);
  if (resolved.as === 'a') {
    const render: SlotRenderFunction<FooterAnchorProps> = (_Component, props) =>
      original?.as === 'a' && typeof original.children === 'function' ? (
        original.children(TeachingPopoverFooterAnchor, {
          ...props,
          children: resolved.children,
        })
      ) : (
        <TeachingPopoverCarouselFooterButton {...props} as="a" />
      );
    return slot.always<TeachingPopoverCarouselFooterButtonProps>(
      {
        as: 'a',
        navType: resolved.navType,
        altText: resolved.altText,
        children: render,
      },
      { defaultProps: resolved, elementType: PrimitiveCarouselFooterButton },
    );
  }
  const render: SlotRenderFunction<FooterNativeButtonProps> = (_Component, props) =>
    original?.as !== 'a' && typeof original?.children === 'function' ? (
      original.children(TeachingPopoverCarouselFooterButton, {
        ...props,
        children: resolved.children,
      })
    ) : (
      <TeachingPopoverCarouselFooterButton {...props} as="button" />
    );
  return slot.always<TeachingPopoverCarouselFooterButtonProps>(
    {
      as: 'button',
      navType: resolved.navType,
      altText: resolved.altText,
      children: render,
    },
    { defaultProps: resolved, elementType: PrimitiveCarouselFooterButton },
  );
}

export const TeachingPopoverCarouselFooter: ForwardRefComponent<TeachingPopoverCarouselFooterProps> =
  React.forwardRef<HTMLDivElement, TeachingPopoverCarouselFooterProps>(
    function TeachingPopoverCarouselFooter({ layout = 'centered', ...props }, ref) {
      const state = useTeachingPopoverCarouselFooter(props, ref);
      Object.assign(state.root, {
        'data-layout': layout,
        'data-has-previous': state.previous ? '' : undefined,
      });
      styleSlot(
        state.root,
        teachingPopoverCarouselFooterClassNames.root,
        styles.TeachingPopoverCarouselFooter,
      );
      if (state.previous) {
        styleSlot(
          state.previous,
          teachingPopoverCarouselFooterClassNames.previous,
          styles.TeachingPopoverCarouselFooter__previous,
        );
        state.previous = resolveFooterButton(props.previous, state.previous);
      }
      styleSlot(
        state.next,
        teachingPopoverCarouselFooterClassNames.next,
        styles.TeachingPopoverCarouselFooter__next,
      );
      state.next = resolveFooterButton(props.next, state.next);
      return renderTeachingPopoverCarouselFooter(state);
    },
  );

TeachingPopoverCarouselFooter.displayName = 'TeachingPopoverCarouselFooter';

export const TeachingPopoverCarouselNav: ForwardRefComponent<TeachingPopoverCarouselNavProps> =
  React.forwardRef<HTMLDivElement, TeachingPopoverCarouselNavProps>(
    function TeachingPopoverCarouselNav(props, ref) {
      const state = useTeachingPopoverCarouselNav(props, ref);
      styleSlot(
        state.root,
        teachingPopoverCarouselNavClassNames.root,
        styles.TeachingPopoverCarouselNav,
      );
      return renderTeachingPopoverCarouselNav(state);
    },
  );

TeachingPopoverCarouselNav.displayName = 'TeachingPopoverCarouselNav';

export const TeachingPopoverCarouselNavButton: ForwardRefComponent<TeachingPopoverCarouselNavButtonProps> =
  React.forwardRef<HTMLButtonElement | HTMLAnchorElement, TeachingPopoverCarouselNavButtonProps>(
    function TeachingPopoverCarouselNavButton(props, ref) {
      const { appearance } = React.useContext(PopoverVisualContext);
      const state = useTeachingPopoverCarouselNavButton(props, ref);
      Object.assign(state.root, { 'data-appearance': appearance });
      styleSlot(
        state.root,
        teachingPopoverCarouselNavButtonClassNames.root,
        styles.TeachingPopoverCarouselNavButton,
      );
      return renderTeachingPopoverCarouselNavButton(state);
    },
  );

TeachingPopoverCarouselNavButton.displayName = 'TeachingPopoverCarouselNavButton';

export const TeachingPopoverCarouselPageCount: ForwardRefComponent<TeachingPopoverCarouselPageCountProps> =
  React.forwardRef<HTMLDivElement, TeachingPopoverCarouselPageCountProps>(
    function TeachingPopoverCarouselPageCount(props, ref) {
      const state = useTeachingPopoverCarouselPageCount(props, ref);
      styleSlot(
        state.root,
        teachingPopoverCarouselPageCountClassNames.root,
        styles.TeachingPopoverCarouselPageCount,
      );
      return renderTeachingPopoverCarouselPageCount(state);
    },
  );

TeachingPopoverCarouselPageCount.displayName = 'TeachingPopoverCarouselPageCount';
