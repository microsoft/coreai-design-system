// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Text } from '@coreai-ds/react-components';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function Shell() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const didNavigate = React.useRef(false);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const pageRef = React.useRef<HTMLDivElement>(null);
  const [navigationOpen, setNavigationOpen] = React.useState(false);

  const openNavigation = React.useCallback(() => {
    setNavigationOpen(true);
  }, []);

  const closeNavigation = React.useCallback(() => {
    setNavigationOpen(false);
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  }, []);

  React.useEffect(() => {
    if (pageRef.current) {
      pageRef.current.inert = navigationOpen;
    }
  }, [navigationOpen]);

  React.useEffect(() => {
    if (!navigationOpen) {
      return;
    }
    const closeOnDesktop = () => {
      const navigation = document.getElementById('app-navigation');
      if (navigation && getComputedStyle(navigation).position !== 'fixed') {
        closeNavigation();
      }
    };
    window.addEventListener('resize', closeOnDesktop);
    return () => window.removeEventListener('resize', closeOnDesktop);
  }, [closeNavigation, navigationOpen]);

  // Reset the page scroll region after client-side navigation.
  React.useEffect(() => {
    if (!didNavigate.current) {
      didNavigate.current = true;
      return;
    }
    closeNavigation();
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    pageRef.current?.scrollTo({
      top: 0,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [closeNavigation, location.pathname]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="app-body">
        <Sidebar isOpen={navigationOpen} onOpen={openNavigation} onClose={closeNavigation} />
        <div className={isHome ? 'app-content app-content--home' : 'app-content'}>
          <Header
            menuButtonRef={menuButtonRef}
            navigationOpen={navigationOpen}
            onNavigationOpen={openNavigation}
          />
          <div
            className={isHome ? 'app-page app-page--home' : 'app-page'}
            ref={pageRef}
            aria-hidden={navigationOpen || undefined}
          >
            <React.Suspense
              fallback={
                <main id="main-content" className="site-main" tabIndex={-1}>
                  <div className="page-header">
                    <Text as="p" className="page-summary" size={400} foreground={3}>
                      Loading page...
                    </Text>
                  </div>
                </main>
              }
            >
              <Outlet />
            </React.Suspense>
          </div>
        </div>
      </div>
      <div className="copy-toast" aria-live="polite" />
    </div>
  );
}
