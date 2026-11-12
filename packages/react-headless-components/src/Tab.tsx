// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderTab,
  useTab,
  useTabListContext,
  type TabProps,
  type TabSlots,
} from '@fluentui/react-headless-components-preview/tab-list';
import {
  slot,
  type ExtractSlotProps,
  type ForwardRefComponent,
  type SlotRenderFunction,
} from '@fluentui/react-utilities';
import { TabVisualContext } from './TabVisualContext.js';
import styles from './Tab.module.css';
import overrides from './TabList.overrides.module.css';

export type {
  TabProps,
  TabSlots,
  TabState,
} from '@fluentui/react-headless-components-preview/tab-list';

export const tabClassNames = {
  root: 'fui-Tab',
  icon: 'fui-Tab__icon',
  content: 'fui-Tab__content',
} as const;

export const tabReservedSpaceClassNames = {
  content: 'fui-Tab__content--reserved-space',
} as const;

type TabRootProps = ExtractSlotProps<TabSlots['root']>;

export const Tab: ForwardRefComponent<TabProps> = React.forwardRef<HTMLButtonElement, TabProps>(
  function Tab(props, ref) {
    const state = useTab(props, ref);
    const appearance = useTabListContext((context) => context.appearance) ?? 'transparent';
    const size = useTabListContext((context) => context.size) ?? 'medium';
    const reserveSelectedTabSpace =
      useTabListContext((context) => context.reserveSelectedTabSpace) ?? true;
    const elevated = React.useContext(TabVisualContext);
    const contentClassName = state.content.className;

    Object.assign(state.root, {
      'data-appearance': appearance,
      'data-size': size,
      'data-orientation': state.vertical ? 'vertical' : 'horizontal',
      'data-has-icon': state.icon ? '' : undefined,
      'data-coreai-elevated': elevated ? '' : undefined,
    });
    state.root.className = [
      tabClassNames.root,
      styles.Tab,
      overrides.TabList__tab,
      state.root.className,
    ]
      .filter(Boolean)
      .join(' ');
    state.content.className = [tabClassNames.content, styles.Tab__content, contentClassName]
      .filter(Boolean)
      .join(' ');
    if (state.icon) {
      state.icon.className = [tabClassNames.icon, styles.Tab__icon, state.icon.className]
        .filter(Boolean)
        .join(' ');
    }

    let reserved: React.ReactNode;
    // Fluent's optional visual space is also present when a content slot is explicitly supplied.
    if (
      (props.content !== undefined && props.content !== null) ||
      (!state.selected && !state.iconOnly && reserveSelectedTabSpace)
    ) {
      const content = slot.resolveShorthand(props.content);
      const { ref: _ref, as: _as, children: contentChildren, ...contentProps } = content ?? {};
      const reservedProps = {
        ...contentProps,
        'aria-hidden': true as const,
        className: [
          tabReservedSpaceClassNames.content,
          styles.Tab__contentReservedSpace,
          contentClassName,
        ]
          .filter(Boolean)
          .join(' '),
        children: state.content.children,
      };
      reserved =
        typeof contentChildren === 'function' ? (
          contentChildren('span', reservedProps)
        ) : (
          <span {...reservedProps} />
        );
    }

    const renderRoot: SlotRenderFunction<TabRootProps> = (Component, resolvedProps) => {
      const withReservedSpace = {
        ...resolvedProps,
        children: (
          <>
            {resolvedProps.children}
            {reserved}
          </>
        ),
      };
      return typeof props.children === 'function' ? (
        props.children(Component, withReservedSpace)
      ) : (
        <Component {...withReservedSpace} />
      );
    };
    // Keep this public renderer installed so selection never changes the native root's identity.
    state.root = slot.always<TabRootProps>(
      { children: renderRoot },
      { defaultProps: state.root, elementType: 'button' },
    );

    return renderTab(state);
  },
);

Tab.displayName = 'Tab';
