// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { toString } from 'mdast-util-to-string';
import GithubSlugger from 'github-slugger';
import { renderGuidance } from '../../../shared/guidance.mjs';
import { rewriteDocumentationLinks } from './standalone-markdown.mjs';

const parser = unified().use(remarkParse).use(remarkGfm);
export function escapeHtml(value) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character],
  );
}

export function codeFence(source, language = 'tsx') {
  const longest = Math.max(2, ...[...source.matchAll(/`+/g)].map(([ticks]) => ticks.length));
  const fence = '`'.repeat(longest + 1);
  return `${fence}${language}\n${source.trimEnd()}\n${fence}`;
}

export function pageGuidanceParts(markdown, resources = []) {
  const tree = parser.parse(markdown);
  const [heading, summary] = tree.children;
  if (heading?.type !== 'heading' || heading.depth !== 1 || summary?.type !== 'paragraph')
    throw new Error('Page guidance must start with a title and summary.');
  const lastResources = resources.length
    ? tree.children.findLastIndex(
        (node) => node.type === 'heading' && node.depth === 2 && toString(node) === 'Resources',
      )
    : -1;
  return {
    introduction: markdown.slice(0, summary.position.end.offset).trim(),
    resourcesMarkdown:
      lastResources >= 0
        ? markdown.slice(tree.children[lastResources].position.start.offset).trim()
        : '',
    headingId: `guidance-${new GithubSlugger().slug(toString(heading))}`,
    summaryHtml: renderGuidance(
      markdown.slice(summary.position.start.offset, summary.position.end.offset),
    ).html,
    body: markdown
      .slice(
        summary.position.end.offset,
        lastResources >= 0 ? tree.children[lastResources].position.start.offset : undefined,
      )
      .trim(),
  };
}

export function presentationResources(page, metadata) {
  return (page.resources ?? []).map((resource) => {
    const absolute = new URL(resource.url, 'https://documentation.invalid/');
    if (!['http:', 'https:'].includes(absolute.protocol))
      throw new Error(`Unsupported page resource: ${resource.url}`);
    const markdown = rewriteDocumentationLinks(`[Resource](<${resource.url}>)`, {
      route: page.route,
      pages: metadata.pages,
      basePath: metadata.basePath,
      html: true,
    });
    const link = parser.parse(markdown).children[0]?.children?.find((node) => node.type === 'link');
    if (!link) throw new Error(`Invalid page resource: ${resource.url}`);
    return { label: resource.label, href: link.url };
  });
}

function resourceLinks(resources, className) {
  return resources
    .map(
      (resource) =>
        `<a class="${className}" data-resource-label="${escapeHtml(resource.label)}" href="${escapeHtml(resource.href)}">${escapeHtml(resource.label)}</a>`,
    )
    .join('');
}

export function pageTemplateHeader(page, metadata, parts) {
  const markdownPath = page.route ? `${page.route}.md` : 'index.md';
  const underConstruction = page.renderer === 'work-in-progress';
  return `<header class="page-header${page.renderer === 'home' ? ' home-page-actions' : ''}"${page.renderer === 'home' || underConstruction ? ' hidden' : ''} data-page-header data-page-title="${escapeHtml(page.title)}" data-heading-id="${parts.headingId}" data-markdown-url="${metadata.basePath}${markdownPath}" data-home="${page.renderer === 'home'}" data-under-construction="${underConstruction}" data-hide-summary="${Boolean(page.hideSummary)}">
<div class="page-header__title-row">${page.renderer === 'home' ? '' : `<h1 id="${parts.headingId}">${escapeHtml(page.title)}</h1>`}<a href="${metadata.basePath}${markdownPath}">View .md</a></div>
<div data-page-summary class="${page.renderer === 'home' || page.hideSummary ? 'sr-only' : 'page-summary'}">${parts.summaryHtml}</div></header>`;
}

export function pageTemplateResources(page, metadata) {
  const resources = presentationResources(page, metadata);
  if (!resources.length || page.renderer === 'home') return '';
  return `<section class="component-resources-section" data-page-resources><h2>Resources</h2><nav class="component-resources" aria-label="${escapeHtml(page.title)} resources">${resourceLinks(resources, 'component-resource-card')}</nav></section>`;
}

export function homeHeroFallback(page, metadata, parts) {
  return `<div data-page-widget="home" class="home-widget"><div class="home-landing"><div class="home-foreground"><header class="home-heading"><div class="page-header__title-row"><h1 id="${parts.headingId}">${escapeHtml(page.title)}</h1></div>${parts.summaryHtml}</header><div class="home-agent-content"><section class="home-agent-entry" aria-label="Agent resources"><button type="button" class="reference-home-action reference-home-action--primary" data-copy="${escapeHtml(metadata.agentPrompt)}" data-copy-label="starter prompt"><svg aria-hidden="true" fill="currentColor" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M7 7H5.5C4.67 7 4 7.67 4 8.5v6c0 .83.67 1.5 1.5 1.5h4c.65 0 1.2-.42 1.41-1h1.04a2.5 2.5 0 0 1-2.45 2h-4A2.5 2.5 0 0 1 3 14.5v-6A2.5 2.5 0 0 1 5.5 6H7zm7.5-4A2.5 2.5 0 0 1 17 5.5v6a2.5 2.5 0 0 1-2.5 2.5h-4A2.5 2.5 0 0 1 8 11.5v-6A2.5 2.5 0 0 1 10.5 3zm-4 1C9.67 4 9 4.67 9 5.5v6c0 .83.67 1.5 1.5 1.5h4c.83 0 1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5z" fill="currentColor"></path></svg>Copy starter prompt</button><a role="link" class="reference-home-action reference-home-action--secondary" href="${metadata.basePath}overview/introduction/#guidance-working-with-agents">Learn more</a></section><details class="home-agent-preview" hidden><summary>Preview the prompt</summary><pre data-agent-prompt>${escapeHtml(metadata.agentPrompt)}</pre></details></div></div><div class="home-visual"></div></div></div>`;
}

export function workInProgressFallback(page, standalone = false) {
  const heading = standalone ? 'h1' : 'h2';
  const headingId = `${escapeHtml(page.id)}-under-construction`;
  return `<div data-page-widget="work-in-progress"><section class="work-in-progress${standalone ? ' work-in-progress--page' : ''}" aria-labelledby="${headingId}"><div class="work-in-progress__logo"></div><${heading} id="${headingId}">Page under construction</${heading}><p>We're still working on this page.</p><a class="work-in-progress__link" href="https://github.com/microsoft/coreai-design-system/issues/new" target="_blank" rel="noopener noreferrer">Share a suggestion<span class="sr-only"> (opens in a new tab)</span></a></section></div>`;
}
