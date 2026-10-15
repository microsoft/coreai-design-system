// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * `withComponentDefaults(StockComponent, defaults)`
 *
 * Returns a forwardRef wrapper that applies the given default props ONLY
 * when the active `<CoreAIFluentProvider>` has `withComponentDefaults` enabled
 * (the default). For Web / Teams / Teams v2.1 — or any consumer that
 * explicitly sets `withComponentDefaults={false}` — the wrapper is a pure
 * passthrough and stock Fluent semantics are preserved.
 *
 * Defaults are merged with caller props so per-instance values always win:
 *
 *     <Button>                            → uses our default (when enabled)
 *     <Button shape="square">             → "square" wins, always
 *     <Button> with defaults off          → stock Fluent default
 *
 * The runtime branch is the one and only place this decision is made;
 * individual wrapped components are one-liners:
 *
 *     export const Button = withComponentDefaults(FluentButton, { shape: 'circular' });
 */
import * as React from 'react';
import { useComponentDefaults } from './ComponentDefaultsContext.js';

/**
 * Replaces selected inherited props so their JSDoc can describe CoreAI's
 * effective defaults. Storybook's static component metadata cannot see values
 * applied at runtime by `withComponentDefaults`, so without this override its
 * MCP tools report Fluent's original defaults instead.
 *
 * The conditional type distributes over polymorphic prop unions (such as
 * Button's button/anchor variants) so overriding the documentation does not
 * collapse their distinct native prop types.
 */
export type WithDefaultPropDocs<Props, Overrides> = Props extends unknown
  ? Omit<Props, keyof Overrides> & Overrides
  : never;

export function withComponentDefaults<P extends object>(
  StockComponent: React.ComponentType<P>,
  defaults: Partial<P>,
): React.ComponentType<P> {
  const Wrapped = React.forwardRef<unknown, P>((props, ref) => {
    const enabled = useComponentDefaults();
    const merged = enabled ? ({ ...defaults, ...props } as P) : props;
    return React.createElement(StockComponent, { ...merged, ref } as P);
  });
  const name =
    (StockComponent as { displayName?: string; name?: string }).displayName ??
    (StockComponent as { name?: string }).name ??
    'Component';
  Wrapped.displayName = name;
  // Cast back to the original component type so consumers see the full
  // prop surface (including ForwardRefComponent's polymorphic `as` etc.).
  return Wrapped as unknown as React.ComponentType<P>;
}
