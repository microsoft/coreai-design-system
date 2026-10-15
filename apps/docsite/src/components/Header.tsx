// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';

interface HeaderProps {
  menuButtonRef: React.RefObject<HTMLButtonElement>;
  navigationOpen: boolean;
  onNavigationOpen: () => void;
}

export function Header({ menuButtonRef, navigationOpen, onNavigationOpen }: HeaderProps) {
  return (
    <header className="app-topnav">
      {!navigationOpen ? (
        <button
          ref={menuButtonRef}
          type="button"
          className="app-topnav__menu"
          aria-label="Open navigation"
          aria-controls="app-navigation"
          aria-expanded="false"
          aria-keyshortcuts="Alt+s"
          onClick={onNavigationOpen}
        >
          <span />
          <span />
          <span />
        </button>
      ) : null}
    </header>
  );
}
