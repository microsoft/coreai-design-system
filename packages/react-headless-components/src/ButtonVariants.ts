// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type * as React from 'react';
import { useButtonContext } from '@fluentui/react-headless-components-preview/button';
import { useCoreAIDefaults } from './ComponentDefaultsContext.js';
import { buttonClassNames, type ButtonProps } from './Button.js';
import overrides from './Button.overrides.module.css';

export type ButtonVariantVisualProps = Pick<ButtonProps, 'appearance' | 'shape' | 'size'>;

export function useButtonVariantVisuals(
  { appearance = 'secondary', shape, size }: ButtonVariantVisualProps,
  hasShapeProp: boolean,
  inheritSize = true,
) {
  const defaultsEnabled = useCoreAIDefaults();
  const context = useButtonContext();
  return {
    appearance,
    shape: shape ?? (defaultsEnabled && !hasShapeProp ? 'circular' : 'rounded'),
    size: size ?? (inheritSize ? context.size : undefined) ?? 'medium',
    defaultsEnabled,
  } as const;
}

export function applyButtonVariantStyles(
  state: {
    root: { className?: string; children?: React.ReactNode };
    icon?: { className?: string };
  },
  visuals: ReturnType<typeof useButtonVariantVisuals>,
  markers: { root: string; icon: string },
  classes: { root: string; icon: string },
) {
  Object.assign(state.root, {
    'data-appearance': visuals.appearance,
    'data-size': visuals.size,
    'data-shape': visuals.shape,
    'data-has-icon': state.icon ? '' : undefined,
    'data-has-content': state.root.children ? '' : undefined,
  });
  state.root.className = [
    buttonClassNames.root,
    markers.root,
    classes.root,
    visuals.defaultsEnabled && overrides.Button,
    state.root.className,
  ]
    .filter(Boolean)
    .join(' ');
  if (state.icon) {
    state.icon.className = [buttonClassNames.icon, markers.icon, classes.icon, state.icon.className]
      .filter(Boolean)
      .join(' ');
  }
}
