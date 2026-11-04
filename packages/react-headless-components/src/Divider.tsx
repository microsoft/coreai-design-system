// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderDivider,
  useDivider,
  type DividerProps as HeadlessDividerProps,
  type DividerSlots as HeadlessDividerSlots,
} from '@fluentui/react-headless-components-preview/divider';
import {
  slot,
  useMergedRefs,
  type ExtractSlotProps,
  type ForwardRefComponent,
  type SlotRenderFunction,
} from '@fluentui/react-utilities';
import styles from './Divider.module.css';
import overrides from './Divider.overrides.module.css';

export type { DividerSlots as DividerLabeledSlots } from '@fluentui/react-headless-components-preview/divider';

export const dividerClassNames = {
  root: 'fui-Divider',
} as const;

// Production DividerLabeled is Fluent's Divider alias, with the original slot markers.
export const dividerLabeledClassNames = {
  root: 'fui-Divider',
  wrapper: 'fui-Divider__wrapper',
} as const;

export type DividerAppearance = 'brand' | 'default' | 'strong' | 'subtle';

export type DividerProps = Omit<React.ComponentPropsWithoutRef<'hr'>, 'children'> & {
  /** Render as a separator div instead of the default native hr. */
  as?: 'div';
  /** Stroke appearance. @default 'default' */
  appearance?: DividerAppearance;
  /** Inset the line using orientation-dependent margins. @default false */
  inset?: boolean;
  /** Render a vertical separator. @default false */
  vertical?: boolean;
};

type DividerRootProps = ExtractSlotProps<HeadlessDividerSlots['root']>;

/** CoreAI's contentless separator. Inline content belongs in DividerLabeled. */
export const Divider: ForwardRefComponent<DividerProps> = React.forwardRef<
  HTMLElement,
  DividerProps
>(function Divider({ as: asProp, appearance = 'default', inset = false, ...props }, ref) {
  const state = useDivider(props, ref);
  const nativeRef = useMergedRefs<HTMLElement>(state.root.ref);
  const renderRoot: SlotRenderFunction<DividerRootProps> = (Component, resolvedProps) => {
    if (asProp === 'div') return <Component {...resolvedProps} ref={nativeRef} />;
    const { children: _children, ref: _ref, ...nativeProps } = resolvedProps;
    return <hr {...nativeProps} ref={nativeRef} />;
  };

  // Keep the primitive's native slot type; render the hr through the public slot contract.
  state.root = slot.always<DividerRootProps>(
    { children: renderRoot },
    { defaultProps: state.root, elementType: 'div' },
  );
  Object.assign(state.root, {
    'data-appearance': appearance,
    'data-inset': inset ? '' : undefined,
  });
  state.root.className = [dividerClassNames.root, overrides.Divider, state.root.className]
    .filter(Boolean)
    .join(' ');

  return renderDivider(state);
});

Divider.displayName = 'Divider';

export type DividerLabeledProps = HeadlessDividerProps & {
  /** Content alignment along the line. @default 'center' */
  alignContent?: 'start' | 'center' | 'end';
  /** Stroke and content appearance. @default 'default' */
  appearance?: DividerAppearance;
  /** Inset the line using horizontal padding or vertical margins. @default false */
  inset?: boolean;
};

/** Fluent-compatible, content-bearing separator retained by CoreAI as DividerLabeled. */
export const DividerLabeled: ForwardRefComponent<DividerLabeledProps> = React.forwardRef<
  HTMLElement,
  DividerLabeledProps
>(function DividerLabeled(
  { alignContent = 'center', appearance = 'default', inset = false, ...props },
  ref,
) {
  const state = useDivider(props, ref);

  Object.assign(state.root, {
    'data-align-content': alignContent,
    'data-appearance': appearance,
    'data-inset': inset ? '' : undefined,
    'data-has-content': state.root.children !== undefined ? '' : undefined,
  });
  state.root.className = [dividerLabeledClassNames.root, styles.Divider, state.root.className]
    .filter(Boolean)
    .join(' ');
  state.wrapper.className = [
    dividerLabeledClassNames.wrapper,
    styles.Divider__wrapper,
    state.wrapper.className,
  ]
    .filter(Boolean)
    .join(' ');

  return renderDivider(state);
});

DividerLabeled.displayName = 'DividerLabeled';
