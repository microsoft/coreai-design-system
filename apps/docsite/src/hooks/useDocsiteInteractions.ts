// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { useThemeMode, type ThemePreference } from '../theme/ThemeProvider';
import { getShortcutAction } from '../utils/shortcut-action.mjs';

const THEME_CYCLE: Record<ThemePreference, ThemePreference> = {
  dark: 'light',
  light: 'dark',
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable ||
    Boolean(target.closest('[role="textbox"], [role="combobox"]'))
  );
}

/**
 * Ports the document-level interactions from the original vanilla docsite.js:
 * scrollbar fade-on-idle, copy-to-clipboard toast, and keyboard shortcuts.
 */
export function useDocsiteInteractions({
  onToggleNavigation,
  onCollapseNavigation,
  onExpandNavigation,
  onNavigatePage,
  onFocusSearch,
  isApplePlatform,
}: {
  onToggleNavigation: () => void;
  onCollapseNavigation: () => void;
  onExpandNavigation: () => void;
  onNavigatePage: (direction: -1 | 1) => void;
  onFocusSearch: () => void;
  isApplePlatform: boolean;
}): void {
  const { preference, setPreference } = useThemeMode();

  // Keep the latest preference in a ref so the keydown handler (bound once)
  // always reads the current value without re-binding.
  const preferenceRef = React.useRef(preference);
  React.useEffect(() => {
    preferenceRef.current = preference;
  }, [preference]);

  // Scrollbar fade: capture nested scroll regions, then remove the visible
  // scrollbar state after scrolling stops.
  React.useEffect(() => {
    const root = document.documentElement;
    const timers = new Map<HTMLElement, number>();
    const onScroll = (event: Event) => {
      const target = event.target === document ? root : event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      target.classList.add('is-scrolling');
      window.clearTimeout(timers.get(target));
      timers.set(
        target,
        window.setTimeout(() => {
          target.classList.remove('is-scrolling');
          timers.delete(target);
        }, 1000),
      );
    };
    document.addEventListener('scroll', onScroll, {
      capture: true,
      passive: true,
    });
    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true });
      timers.forEach((timer, element) => {
        window.clearTimeout(timer);
        element.classList.remove('is-scrolling');
      });
      timers.clear();
    };
  }, []);

  // Copy-to-clipboard toast, driven by [data-copy] rows.
  React.useEffect(() => {
    const toast = document.querySelector<HTMLElement>('.copy-toast');
    let timer: number | undefined;

    const showToast = (value: string) => {
      if (!toast) {
        return;
      }
      toast.textContent = `Copied ${value}`;
      toast.classList.remove('is-visible');
      void toast.offsetWidth;
      toast.classList.add('is-visible');
      window.clearTimeout(timer);
      timer = window.setTimeout(() => toast.classList.remove('is-visible'), 1500);
    };

    const onClick = (event: MouseEvent) => {
      const row =
        event.target instanceof Element ? event.target.closest<HTMLElement>('[data-copy]') : null;
      if (!row) {
        return;
      }
      if (window.getSelection()?.toString()) {
        return;
      }
      const value = row.dataset.copy ?? '';
      navigator.clipboard
        .writeText(value)
        .then(() => {
          showToast(value);
        })
        .catch(() => {
          showToast('failed');
        });
    };

    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
      window.clearTimeout(timer);
    };
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const action = getShortcutAction(event, {
        editable: isEditableTarget(event.target),
        isApplePlatform,
      });
      if (action) event.preventDefault();
      switch (action) {
        case 'toggle-navigation':
          onToggleNavigation();
          break;
        case 'collapse-navigation':
          onCollapseNavigation();
          break;
        case 'expand-navigation':
          onExpandNavigation();
          break;
        case 'previous-page':
          onNavigatePage(-1);
          break;
        case 'next-page':
          onNavigatePage(1);
          break;
        case 'focus-search':
          onFocusSearch();
          break;
        case 'cycle-theme':
          setPreference(THEME_CYCLE[preferenceRef.current] ?? 'dark');
          break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [
    isApplePlatform,
    onToggleNavigation,
    onCollapseNavigation,
    onExpandNavigation,
    onNavigatePage,
    onFocusSearch,
    setPreference,
  ]);
}
