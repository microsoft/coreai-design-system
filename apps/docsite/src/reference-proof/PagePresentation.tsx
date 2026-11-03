// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Link, Text } from '@coreai-ds/react-components';
import { DocumentText20Regular } from '@fluentui/react-icons';
import { MarkdownActions } from '../components/MarkdownActions';
import { ExternalIcon, FigmaLogo, FluentLogo, NpmLogo } from '../components/Icons';

export interface PageResource {
  href: string;
  label: string;
}
export interface PagePresentation {
  title: string;
  summaryHtml: string;
  headingId: string;
  markdownUrl: string;
  home: boolean;
  underConstruction: boolean;
  resources: PageResource[];
}

export function isShowcaseResource(resource: PageResource) {
  const hostname = new URL(resource.href, window.location.href).hostname;
  return hostname.endsWith('figma.com') || hostname.includes('fluent');
}

export function readPagePresentation(root: HTMLElement): PagePresentation {
  const header = root.querySelector<HTMLElement>('[data-page-header]');
  if (!header?.dataset.pageTitle || !header.dataset.markdownUrl || !header.dataset.headingId)
    throw new Error('Missing page presentation metadata.');
  const summary = header.querySelector('[data-page-summary] p');
  if (!summary) throw new Error('Missing page summary.');
  return {
    title: header.dataset.pageTitle,
    summaryHtml: summary.innerHTML,
    headingId: header.dataset.headingId,
    markdownUrl: header.dataset.markdownUrl,
    home: header.dataset.home === 'true',
    underConstruction: header.dataset.underConstruction === 'true',
    resources: [...root.querySelectorAll<HTMLAnchorElement>('[data-page-resources] a')].map(
      (link) => ({
        href: link.href,
        label: link.dataset.resourceLabel ?? link.textContent?.trim() ?? '',
      }),
    ),
  };
}

export function PageHeader({ model }: { model: PagePresentation }) {
  if (model.home || model.underConstruction) return null;
  return (
    <>
      <div className="page-header__title-row">
        <Text as="h1" id={model.headingId} size={900} weight="regular" foreground={1}>
          {model.title}
        </Text>
        <MarkdownActions markdownUrl={model.markdownUrl} iconOnly />
      </div>
      <Text as="p" className="page-summary" size={400} foreground={2}>
        <span dangerouslySetInnerHTML={{ __html: model.summaryHtml }} />
      </Text>
    </>
  );
}

export function ResourceIcon({ href }: { href: string }) {
  const hostname = new URL(href, window.location.href).hostname;
  if (hostname.endsWith('figma.com'))
    return <FigmaLogo className="component-resource-card__brand" />;
  if (hostname.includes('fluent')) return <FluentLogo className="component-resource-card__brand" />;
  if (hostname.endsWith('npmjs.com')) return <NpmLogo className="component-resource-card__brand" />;
  return <DocumentText20Regular className="component-resource-card__brand" />;
}

export function ResourceCards({
  model,
  omitShowcaseResources = false,
}: {
  model: PagePresentation;
  omitShowcaseResources?: boolean;
}) {
  const resources = omitShowcaseResources
    ? model.resources.filter((resource) => !isShowcaseResource(resource))
    : model.resources;
  if (!resources.length) return null;
  return (
    <>
      <Text as="h2" preset="heading3" foreground={1}>
        Resources
      </Text>
      <nav className="component-resources" aria-label={`${model.title} resources`}>
        {resources.map((resource) => {
          const external = new URL(resource.href).origin !== window.location.origin;
          return (
            <Link
              key={resource.href}
              href={resource.href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className="component-resource-card"
            >
              <span className="component-resource-card__icon">
                <ResourceIcon href={resource.href} />
                <ExternalIcon className="component-resource-card__open" />
              </span>
              <strong>{resource.label}</strong>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
