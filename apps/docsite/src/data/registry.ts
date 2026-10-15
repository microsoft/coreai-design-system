// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import registryJson from '../../site-registry.json';
import { componentContents } from './components';
import { buildSiteRegistry, type RegistryPage, type SiteRegistry } from './registry-builder';

export type { Anchor, RegistryPage, RouteRedirect, SiteRegistry } from './registry-builder';

const baseRegistry = registryJson as SiteRegistry;
export const registry = buildSiteRegistry(baseRegistry, componentContents);
export const pages = registry.pages;
export const redirects = registry.redirects;

export const pageById = new Map(pages.map((page) => [page.id, page]));

export function normalizeRoutePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

export function getPage(id: string): RegistryPage | undefined {
  return pageById.get(id);
}

export interface SidebarGroup {
  label: string;
  items: RegistryPage[];
  layout: 'standalone' | 'combined';
}

const SIDEBAR_ORDER: Array<{
  label: string;
  group: string;
  layout: SidebarGroup['layout'];
}> = [
  { label: 'Overview', group: 'Overview', layout: 'standalone' },
  { label: 'For humans', group: 'For humans', layout: 'standalone' },
  { label: 'For agents', group: 'For agents', layout: 'standalone' },
  { label: 'Foundations', group: 'Foundations', layout: 'standalone' },
  { label: 'Components', group: 'Components', layout: 'standalone' },
  { label: 'Templates', group: 'Templates', layout: 'standalone' },
  { label: 'Samples', group: 'Samples', layout: 'standalone' },
];

export const sidebarGroups: SidebarGroup[] = SIDEBAR_ORDER.map(({ label, group, layout }) => ({
  label,
  layout,
  items: pages.filter((page) => page.showInSidebar && page.group === group),
}));
