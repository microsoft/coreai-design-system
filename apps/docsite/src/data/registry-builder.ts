// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { componentToRegistryPage, type ComponentContent } from './component-content';

export interface Anchor {
  id: string;
  label: string;
}

export interface RegistryPage {
  id: string;
  slug: string;
  group: string;
  navLabel: string;
  headerLabel: string;
  title: string;
  summary: string;
  eyebrow: string;
  showInSidebar: boolean;
  showInHeader: boolean;
  anchors: Anchor[];
  searchText?: string;
}

export interface RouteRedirect {
  from: string;
  to: string;
}

export interface SiteRegistry {
  updated: string;
  redirects: RouteRedirect[];
  pages: RegistryPage[];
}

export function buildSiteRegistry(
  baseRegistry: SiteRegistry,
  components: ComponentContent[],
): SiteRegistry {
  const canonicalComponents = components.filter((component) => !component.navigation.canonicalId);
  const componentRedirects = components.flatMap((component) => {
    const canonicalId = component.navigation.canonicalId;
    return canonicalId ? [{ from: `/${component.id}/`, to: `/${canonicalId}/` }] : [];
  });

  return {
    ...baseRegistry,
    redirects: [...baseRegistry.redirects, ...componentRedirects],
    pages: [
      ...baseRegistry.pages.filter((page) => page.group !== 'Components'),
      ...canonicalComponents.map(componentToRegistryPage),
    ],
  };
}
