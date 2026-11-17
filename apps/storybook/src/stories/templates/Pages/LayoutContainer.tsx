// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { makeStyles, mergeClasses, tokens } from '@coreai-ds/react-components';

const useLayoutContainerStyles = makeStyles({
  root: { containerType: 'inline-size', containerName: 'app' },
});

interface LayoutContextValue {
  width: number | undefined;
}

const LayoutContext = React.createContext<LayoutContextValue | undefined>(undefined);

/** Measures available app space, including embedded previews. Nest it to establish a new responsive boundary. */
export function LayoutContainer({
  children,
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const styles = useLayoutContainerStyles();
  const ref = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState<number>();
  const contextValue = React.useMemo(() => ({ width }), [width]);
  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(element.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      {...props}
      ref={ref}
      className={mergeClasses(styles.root, className)}
      style={
        {
          '--template-page-padding':
            (width ?? 0) <= 768 ? tokens.spacingHorizontalL : tokens.spacingHorizontalXXL,
          ...style,
        } as React.CSSProperties
      }
    >
      <LayoutContext.Provider value={contextValue}>{children}</LayoutContext.Provider>
    </div>
  );
}

export function useHasLayoutContainer() {
  return React.useContext(LayoutContext) !== undefined;
}

/** Uses the nearest LayoutContainer, or the viewport for standalone compositions. */
export function useLayoutWidth() {
  const layout = React.useContext(LayoutContext);
  const [viewportWidth, setViewportWidth] = React.useState(() =>
    typeof window === 'undefined' ? 0 : window.innerWidth,
  );
  React.useEffect(() => {
    if (layout !== undefined) return;
    const resize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, [layout]);
  return layout?.width ?? (layout === undefined ? viewportWidth : 0);
}
