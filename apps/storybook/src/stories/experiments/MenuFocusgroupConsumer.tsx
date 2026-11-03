// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { polyfill } from '@microsoft/focusgroup-polyfill';

/**
 * Experimental story/test consumer, not a component-library dependency.
 * The documented polyfill(root) API initializes existing groups; our subtree observer
 * initializes newly mounted groups. The installed polyfill owns navigation and tab stops.
 */
export function MenuFocusgroupConsumer({ children }: { children: React.ReactNode }) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [ready, setReady] = React.useState(false);
  React.useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const initialize = () => polyfill(root);
    const observer = new MutationObserver(initialize);
    observer.observe(root, { childList: true, subtree: true });
    initialize();
    setReady(true);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={rootRef} data-menu-polyfill-consumer>
      {ready && children}
    </div>
  );
}
