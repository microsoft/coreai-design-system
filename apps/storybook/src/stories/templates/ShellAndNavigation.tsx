// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Templates / Shell and Navigation
 *
 * Full-page app shell: transparent header + collapsible sidebar nav +
 * main content area. Implements the AppShell and SidebarNav patterns
 * documented in .github/skills/theme-migration/patterns/.
 *
 * Copy-paste starting point — not an importable component.
 *
 * Nav items use semantic <ul>/<li>/<NavLink> markup.
 * Wrap the app in <BrowserRouter> (or <RouterProvider>) instead of
 * the <MemoryRouter> used here for Storybook isolation.
 */

import * as React from 'react';
import { MemoryRouter, NavLink } from 'react-router-dom';
import {
  makeStyles,
  mergeClasses,
  tokens,
  Avatar,
  Button,
  Tooltip,
  Text,
} from '@coreai-ds/react-components';
import {
  HomeFilled,
  HomeRegular,
  GridFilled,
  GridRegular,
  SettingsFilled,
  SettingsRegular,
  DocumentFilled,
  DocumentRegular,
  BotFilled,
  BotRegular,
  PanelLeftContractRegular,
  PanelLeftExpandRegular,
  AlertRegular,
  AppsRegular,
  NavigationRegular,
} from '@fluentui/react-icons';

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  // ── Shell root ──────────────────────────────────────────────────────────────
  // Dark canvas. Header is a child; shellBody sits below it.
  shell: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground4, // #0F0F0F
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  // Transparent — shell root color shows through. No border-bottom.
  header: {
    height: '48px',
    minHeight: '48px',
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL, // 16px
    padding: `0 ${tokens.spacingHorizontalXL}`, // 0 20px
    zIndex: 10,
  },
  headerBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flex: 1,
  },
  headerBrandName: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  // Brand icon in the header — Griffel class keeps font-size + color tokenised.
  brandIcon: {
    fontSize: tokens.fontSizeBase500, // 20px
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
  },

  // ── Shell body ──────────────────────────────────────────────────────────────
  // flex row; background bleeds through the 2px gap to create the visual divider.
  shellBody: {
    display: 'flex',
    flexDirection: 'row',
    flex: '1 1 0%',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground4, // must match shell root
    gap: tokens.spacingHorizontalXXS, // 2px — the divider
  },

  // ── Sidebar ──────────────────────────────────────────────────────────────────
  sidebar: {
    width: '218px',
    minWidth: '218px',
    maxWidth: '218px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    backgroundColor: tokens.colorNeutralBackground1, // #1F1F1F
    boxShadow: tokens.shadow2,
    borderTopRightRadius: tokens.borderRadius2XLarge, // 12px — top-right only
    borderTopLeftRadius: '0',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS} ${tokens.spacingVerticalM}`,
    gap: tokens.spacingVerticalS, // 8px between mobile top bar, nav sections, and footer
    // No transition here — applied separately via sidebarTransitionable only
    // on desktop, after the viewport has settled. This prevents any animated
    // width change when switching between viewport breakpoints.
  },
  // Opt-in width transition — only active on desktop when viewport is settled.
  sidebarTransitionable: {
    transitionProperty: 'width, min-width, max-width, padding',
    transitionDuration: `${tokens.durationNormal}, ${tokens.durationNormal}, ${tokens.durationNormal}, ${tokens.durationNormal}`,
    transitionTimingFunction: tokens.curveEasyEase,
  },
  sidebarCollapsed: {
    width: '56px',
    minWidth: '56px',
    maxWidth: '56px',
    // padding unchanged from expanded — spacingHorizontalS (8px) each side
    // leaves exactly 40px of content width for nav items to fill.
  },

  // Sidebar — mobile overlay drawer. Snaps to hidden when mobile mode activates.
  // Transition is only on sidebarMobileDrawerOpen so the mode switch is instant.
  sidebarMobileDrawer: {
    position: 'fixed',
    left: '0',
    top: '0',
    height: '100%',
    zIndex: 200,
    transform: 'translateX(-100%)',
    borderRadius: '0',
  },
  sidebarMobileDrawerOpen: {
    transform: 'translateX(0)',
  },
  // Transition class enabled one frame after entering mobile mode.
  // Kept separate so the initial snap-to-hidden is instant, while
  // subsequent open/close interactions both animate.
  sidebarMobileDrawerTransition: {
    transitionProperty: 'transform',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
  },
  // Scrim shown behind the mobile drawer.
  drawerBackdrop: {
    position: 'fixed',
    inset: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 199,
  },

  // ── Main content area ────────────────────────────────────────────────────────
  main: {
    flex: '1 1 0%',
    overflowY: 'auto',
    scrollbarWidth: 'thin',
    backgroundColor: tokens.colorNeutralBackground1, // #1F1F1F
    boxShadow: tokens.shadow2,
    borderTopLeftRadius: tokens.borderRadius2XLarge, // 12px — top-left only
    borderTopRightRadius: '0',
    padding: tokens.spacingHorizontalXL,
  },

  // ── Section label ─────────────────────────────────────────────────────────────
  // Rendered as <span aria-hidden="true"> so it does not appear in the heading
  // outline. The matching <ul> carries aria-label={section.label} instead.
  sectionLabel: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalSNudge}`, // 4px 6px
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase200,
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap',
  },
  sectionLabelCollapsed: {
    // Padding is intentionally unchanged — identical height keeps all nav items
    // in the same vertical position whether or not the label text is visible.
    // `visibility: hidden` (not `color: transparent`) so there's no ghost-text
    // artefact — the space is preserved but nothing is rendered.
    visibility: 'hidden',
  },

  // ── Nav list (ul) ─────────────────────────────────────────────────────────────
  navGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS, // 8px
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  // ── Nav item (the <NavLink>) ──────────────────────────────────────────────────
  // Renders as a flex row: icon span + label span.
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM, // 12px
    paddingTop: tokens.spacingVerticalSNudge, // 6px
    paddingBottom: tokens.spacingVerticalSNudge, // 6px
    paddingLeft: tokens.spacingHorizontalMNudge, // 10px
    paddingRight: tokens.spacingHorizontalMNudge, // 10px
    borderRadius: tokens.borderRadiusSmall, // 4px
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300, // 14px
    fontWeight: tokens.fontWeightRegular,
    lineHeight: tokens.lineHeightBase300, // 20px
    textDecoration: 'none',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
    transitionProperty: 'background, color',
    transitionDuration: `${tokens.durationNormal}, ${tokens.durationNormal}`,
    transitionTimingFunction: tokens.curveEasyEase,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
      color: tokens.colorNeutralForeground1,
    },
    // On hover, tint the icon span (first child) via Griffel nested selector.
    ':hover > span:first-child': {
      opacity: 1,
      color: tokens.colorBrandForeground1,
    },
  },
  navItemCollapsed: {
    // The label collapses to maxWidth:0 but stays a flex item — zero out the
    // gap so no residual space appears between icon and collapsed label.
    gap: '0',
  },
  navItemActive: {
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
    backgroundColor: tokens.colorNeutralBackground3,
  },

  // ── Icon span ────────────────────────────────────────────────────────────────
  navIcon: {
    fontSize: tokens.fontSizeBase500, // 20px
    width: '20px',
    height: '20px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    opacity: 0.7, // dimmed at rest
    transitionProperty: 'opacity, color',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
  },
  navIconActive: {
    opacity: 1,
    color: tokens.colorBrandForeground1,
  },

  // ── Nav item label ────────────────────────────────────────────────────────────────
  // Always rendered. Fades out and shrinks width-to-0 on collapse so the
  // icon never moves — only the empty space animates away.
  navLabel: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    opacity: 1,
    maxWidth: '200px',
    transitionProperty: 'max-width, opacity',
    transitionDuration: `${tokens.durationFast}, ${tokens.durationFast}`,
    transitionTimingFunction: tokens.curveEasyEase,
  },
  navLabelCollapsed: {
    maxWidth: '0px',
    opacity: 0,
  },

  // ── Nav section wrapper ──────────────────────────────────────────────────
  // Groups one section label + its <ul>. The sidebar gap between multiple
  // navSection divs is spacingVerticalS (8px). The gap here (between the
  // aria-hidden label and the list) is spacingVerticalXXS (2px).
  navSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },

  // ── Catalog variant overrides ────────────────────────────────────────────
  // Panels match the outer canvas color for a flat, full-dark catalog layout.
  sidebarCatalog: {
    backgroundColor: tokens.colorNeutralBackground4,
    boxShadow: 'none',
  },
  mainCatalog: {
    backgroundColor: tokens.colorNeutralBackground4,
    boxShadow: 'none',
  },

  // ── Collapse toggle (bottom of sidebar) ──────────────────────────────────────
  // Icon-only Button (appearance="subtle"), aligned to the right edge.
  sidebarFooter: {
    marginTop: 'auto',
    paddingTop: tokens.spacingVerticalS,
    display: 'flex',
    justifyContent: 'flex-end',
  },

  // Mobile drawer top bar — holds the close button at the top-right of the drawer.
  sidebarMobileTopBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    // No paddingBottom — sidebar gap (spacingVerticalS) provides the spacing below.
  },
});

// ─── Nav data ─────────────────────────────────────────────────────────────────

interface NavItemDef {
  path: string;
  label: string;
  icon: React.ReactNode; // outline — shown at rest and on hover
  activeIcon: React.ReactNode; // filled  — shown only when active
}

interface NavSectionDef {
  label: string;
  items: NavItemDef[];
}

const NAV_SECTIONS: NavSectionDef[] = [
  {
    label: 'Main',
    items: [
      { path: '/', label: 'Home', icon: <HomeRegular />, activeIcon: <HomeFilled /> },
      { path: '/catalog', label: 'Catalog', icon: <GridRegular />, activeIcon: <GridFilled /> },
      {
        path: '/docs',
        label: 'Documents',
        icon: <DocumentRegular />,
        activeIcon: <DocumentFilled />,
      },
      { path: '/ai', label: 'AI Chat', icon: <BotRegular />, activeIcon: <BotFilled /> },
    ],
  },
  {
    label: 'Settings',
    items: [
      {
        path: '/settings',
        label: 'Settings',
        icon: <SettingsRegular />,
        activeIcon: <SettingsFilled />,
      },
    ],
  },
];

// ─── Shell component ──────────────────────────────────────────────────────────

export function ShellAndNavigation({ variant = 'standard' }: { variant?: 'standard' | 'catalog' }) {
  const styles = useStyles();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [viewport, setViewport] = React.useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [drawerReady, setDrawerReady] = React.useState(false);
  const [, forceRender] = React.useReducer((n) => n + 1, 0);
  // Set to true synchronously before any viewport state update so the
  // sidebar's transition class is suppressed in the exact same render.
  const viewportChangingRef = React.useRef(false);
  const shellRef = React.useRef<HTMLDivElement>(null);

  // Respond to container width:
  //   < 768px  → mobile: sidebar becomes a fixed overlay drawer
  //   < 1024px → tablet: sidebar auto-collapses to icon-only
  //   ≥ 1024px → desktop: user controls collapse
  React.useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      // Mark viewport as changing synchronously so the transition class is
      // absent in this render, then restore it one frame later.
      viewportChangingRef.current = true;
      if (w < 768) {
        setViewport('mobile');
        setMobileOpen(false);
      } else if (w < 1024) {
        setViewport('tablet');
        setCollapsed(true);
        setMobileOpen(false);
      } else {
        setViewport('desktop');
      }
      requestAnimationFrame(() => {
        viewportChangingRef.current = false;
        forceRender();
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isMobile = viewport === 'mobile';

  // Enable drawer transition one frame after entering mobile mode so the
  // initial snap-to-hidden is instant, while open/close both animate.
  React.useEffect(() => {
    if (isMobile) {
      const id = requestAnimationFrame(() => setDrawerReady(true));
      return () => cancelAnimationFrame(id);
    } else {
      setDrawerReady(false);
    }
  }, [isMobile]);

  // Mobile: full-width inside drawer (effectiveCollapsed drives navLabel visibility).
  // Tablet/desktop: user-controlled via the toggle button (ResizeObserver auto-sets
  // collapsed=true on tablet entry, user can expand from there).
  const effectiveCollapsed = isMobile ? false : collapsed;

  return (
    <MemoryRouter initialEntries={['/']}>
      <div ref={shellRef} className={styles.shell}>
        {/* ── Header ── */}
        <header className={styles.header}>
          <div className={styles.headerBrand}>
            {isMobile && (
              <Tooltip content="Open navigation" relationship="label">
                <Button
                  appearance="transparent"
                  icon={<NavigationRegular />}
                  aria-label="Open navigation"
                  onClick={() => setMobileOpen(true)}
                />
              </Tooltip>
            )}
            <AppsRegular className={styles.brandIcon} />
            <span className={styles.headerBrandName}>CoreAI Portal</span>
          </div>
          <div className={styles.headerActions}>
            <Tooltip content="Notifications" relationship="label">
              <Button appearance="transparent" icon={<AlertRegular />} aria-label="Notifications" />
            </Tooltip>
            <Avatar name="Alex Britez" size={28} />
          </div>
        </header>

        {/* ── Mobile drawer backdrop ── */}
        {isMobile && mobileOpen && (
          <div
            className={styles.drawerBackdrop}
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── Shell body: sidebar + main, with 2px gap ── */}
        <div className={styles.shellBody}>
          {/* ── Sidebar (desktop/tablet: flex item; mobile: fixed overlay) ── */}
          <nav
            aria-label="Primary navigation"
            className={mergeClasses(
              styles.sidebar,
              !isMobile && !viewportChangingRef.current && styles.sidebarTransitionable,
              !isMobile && effectiveCollapsed && styles.sidebarCollapsed,
              isMobile && styles.sidebarMobileDrawer,
              isMobile && drawerReady && styles.sidebarMobileDrawerTransition,
              isMobile && mobileOpen && styles.sidebarMobileDrawerOpen,
              variant === 'catalog' && styles.sidebarCatalog,
            )}
          >
            {/* ── Mobile close button (top-right) ── */}
            {isMobile && (
              <div className={styles.sidebarMobileTopBar}>
                <Tooltip relationship="label" content="Close navigation" positioning="after">
                  <Button
                    appearance="subtle"
                    icon={<PanelLeftContractRegular />}
                    aria-label="Close navigation"
                    onClick={() => setMobileOpen(false)}
                  />
                </Tooltip>
              </div>
            )}

            {NAV_SECTIONS.map((section) => (
              <div key={section.label} className={styles.navSection}>
                <span
                  aria-hidden="true"
                  className={mergeClasses(
                    styles.sectionLabel,
                    effectiveCollapsed && styles.sectionLabelCollapsed,
                  )}
                >
                  {section.label}
                </span>

                <ul aria-label={section.label} className={styles.navGroup}>
                  {section.items.map((item) => {
                    const link = (
                      <NavLink
                        to={item.path}
                        end={item.path === '/'}
                        aria-label={item.label}
                        className={({ isActive }) =>
                          mergeClasses(
                            styles.navItem,
                            effectiveCollapsed && styles.navItemCollapsed,
                            isActive && styles.navItemActive,
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className={mergeClasses(
                                styles.navIcon,
                                isActive && styles.navIconActive,
                              )}
                            >
                              {isActive ? item.activeIcon : item.icon}
                            </span>
                            <span
                              className={mergeClasses(
                                styles.navLabel,
                                effectiveCollapsed && styles.navLabelCollapsed,
                              )}
                              aria-hidden={effectiveCollapsed || undefined}
                            >
                              {item.label}
                            </span>
                          </>
                        )}
                      </NavLink>
                    );

                    return (
                      <li key={item.path}>
                        {effectiveCollapsed ? (
                          <Tooltip relationship="label" content={item.label} positioning="after">
                            {link}
                          </Tooltip>
                        ) : (
                          link
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            {/* ── Collapse toggle (desktop + tablet) ── */}
            {!isMobile && (
              <div className={styles.sidebarFooter}>
                <Tooltip
                  relationship="label"
                  content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  positioning="after"
                >
                  <Button
                    appearance="subtle"
                    icon={collapsed ? <PanelLeftExpandRegular /> : <PanelLeftContractRegular />}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-expanded={!collapsed}
                    onClick={() => setCollapsed((c) => !c)}
                  />
                </Tooltip>
              </div>
            )}
          </nav>

          {/* ── Main content ── */}
          <main className={mergeClasses(styles.main, variant === 'catalog' && styles.mainCatalog)}>
            <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
              Main content area. Use the sidebar to switch views. Toggle Theme / Mode in the
              Storybook toolbar to preview light and dark.
            </Text>
          </main>
        </div>
      </div>
    </MemoryRouter>
  );
}
