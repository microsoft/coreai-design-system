// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { createPortal } from 'react-dom';
import { CodeBlock, Tab, TabList } from '@coreai-ds/react-components';
import './page-tabs.css';

type PageTab = 'usage' | 'samples';

export interface PageTabTargets {
  host: HTMLElement;
  usage: HTMLElement;
  samples: HTMLElement;
  prefix: string;
  showcase?: {
    host: HTMLElement;
    preview: HTMLElement;
    defaultId: string;
    options: {
      id: string;
      label: string;
    }[];
  };
  codeBlocks: {
    host: HTMLElement;
    code: string;
    language: string;
  }[];
}

function sampleHeading(heading: HTMLElement, preserveIds = false) {
  const level = Math.max(3, Number(heading.tagName.slice(1)));
  const label = document.createElement(`h${level}`);
  for (const { name, value } of [...heading.attributes]) {
    if (preserveIds || name !== 'id') label.setAttribute(name, value);
  }
  label.innerHTML = heading.innerHTML;
  if (!preserveIds)
    label.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
  return label;
}

function codeLanguage(code: HTMLElement, download: HTMLAnchorElement | null) {
  const className = [...code.classList].find((name) => name.startsWith('language-'));
  if (className) return className.slice('language-'.length);
  const extension = download?.pathname.split('.').at(-1)?.toLowerCase();
  if (extension && ['css', 'html', 'js', 'json', 'jsx', 'ts', 'tsx'].includes(extension)) {
    return extension;
  }
  return code.id.startsWith('source-') ? 'tsx' : 'plaintext';
}

function headingBefore(source: HTMLElement, code: HTMLElement) {
  return [...source.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6')]
    .filter((heading) => heading.compareDocumentPosition(code) & Node.DOCUMENT_POSITION_FOLLOWING)
    .at(-1);
}

function sourceLink(pre: HTMLElement, section: HTMLElement) {
  const preceding =
    pre.previousElementSibling?.querySelector<HTMLAnchorElement>('a[href*="source/"]');
  return preceding ?? section.querySelector<HTMLAnchorElement>('a[href*="source/"]');
}

function sourceDownload(source: HTMLAnchorElement | null) {
  if (!source) return null;
  const link = document.createElement('a');
  link.className = 'reference-sample-download';
  link.href = source.getAttribute('href') ?? source.href;
  link.textContent = 'Download source';
  if (source.hasAttribute('download')) link.setAttribute('download', '');
  return link;
}

function removeSourceChrome(pre: HTMLElement, source: HTMLAnchorElement | null) {
  const details = pre.closest('.reference-basic-source');
  if (details) {
    details.remove();
    return;
  }
  const sourceChrome = source?.closest('.source-actions, p');
  if (sourceChrome && sourceChrome !== pre.parentElement) sourceChrome.remove();
  pre.parentElement?.querySelector(':scope > .source-actions')?.remove();
  pre.remove();
}

function extractSamples(
  source: HTMLElement,
  samples: HTMLElement,
  codeBlocks: PageTabTargets['codeBlocks'],
  {
    movePreviews = false,
    preserveHeadingIds = false,
    removeSources = false,
  }: {
    movePreviews?: boolean;
    preserveHeadingIds?: boolean;
    removeSources?: boolean;
  } = {},
) {
  const groups = new Map<Element, HTMLElement>();
  const sourceBlocks = [...source.querySelectorAll<HTMLElement>('pre')].filter(
    (pre) => !pre.closest('[data-example-id]'),
  );
  for (const pre of sourceBlocks) {
    const section =
      pre.closest<HTMLElement>('.example, .reference-template-source, .guidance-section') ?? source;
    const heading =
      section.querySelector<HTMLElement>(
        ':scope > h1,:scope > h2,:scope > h3,:scope > h4,:scope > h5,:scope > h6',
      ) ?? headingBefore(source, pre);
    const context = heading ?? section;
    let group = groups.get(context);
    if (!group) {
      group = document.createElement('section');
      group.className = 'reference-sample-section';
      if (heading) group.append(sampleHeading(heading, preserveHeadingIds));
      const downloadSource = sourceLink(pre, section);
      const preview = movePreviews
        ? section.querySelector<HTMLElement>(':scope > .preview[data-example-id]')
        : null;
      if (preview) group.append(preview);
      const download = sourceDownload(downloadSource);
      if (download) group.append(download);
      samples.append(group);
      groups.set(context, group);
    }
    const code = pre.querySelector<HTMLElement>('code') ?? pre;
    const downloadSource = sourceLink(pre, section);
    const host = document.createElement('div');
    host.className = 'reference-page-code-block-host';
    const sourceId = code.id || pre.id;
    if (sourceId) host.id = sourceId;
    group.append(host);
    codeBlocks.push({
      host,
      code: code.textContent ?? '',
      language: codeLanguage(code, downloadSource),
    });
    if (removeSources) removeSourceChrome(pre, downloadSource);
  }
  return sourceBlocks.length;
}

export function preparePageTabs(root: HTMLElement): PageTabTargets | null {
  const introduction = root.querySelector<HTMLElement>('.reference-page-introduction');
  const header = introduction?.querySelector<HTMLElement>('[data-page-header]');
  if (!introduction || !header || header.hidden) return null;
  const article = introduction.querySelector<HTMLElement>('.standalone-guidance');
  const basic = introduction.querySelector<HTMLElement>('[data-basic-example]');
  const showcaseOptions = [...root.querySelectorAll<HTMLElement>('.example')].flatMap((example) => {
    const preview = example.querySelector<HTMLElement>(':scope > .preview[data-example-id]');
    const heading = example.querySelector<HTMLElement>(
      ':scope > h1,:scope > h2,:scope > h3,:scope > h4,:scope > h5,:scope > h6',
    );
    const id = preview?.dataset.exampleId;
    const label = heading?.textContent?.trim();
    return id && label ? [{ id, label }] : [];
  });
  if (!basic && !article?.querySelector('pre')) return null;
  if (
    article &&
    [...article.querySelectorAll<HTMLElement>('[data-page-widget]')].some(
      (widget) =>
        ![
          'colors',
          'color-accessibility',
          'data-visualization',
          'font-families',
          'typography',
        ].includes(widget.dataset.pageWidget ?? ''),
    )
  )
    return null;

  const host = document.createElement('div');
  host.className = 'reference-page-tabs';
  const usage = document.createElement('div');
  const samples = document.createElement('div');
  const codeBlocks: PageTabTargets['codeBlocks'] = [];
  const prefix = `${header.dataset.headingId}-content`;
  for (const [name, panel] of [
    ['usage', usage],
    ['samples', samples],
  ] as const) {
    panel.className = 'reference-page-panel';
    panel.dataset.pagePanel = name;
    panel.id = `${prefix}-${name}-panel`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `${prefix}-${name}-tab`);
    panel.tabIndex = 0;
    panel.hidden = name === 'samples';
  }

  for (const child of [...introduction.children]) {
    if (child !== header) usage.append(child);
  }
  const source = basic?.querySelector<HTMLDetailsElement>('.reference-basic-source');
  if (source && basic) {
    extractSamples(basic, samples, codeBlocks, { removeSources: true });
    for (const paragraph of basic.querySelectorAll(':scope > p')) {
      if (paragraph.textContent?.startsWith('Source: ')) paragraph.remove();
    }
  }
  const api = usage.querySelector<HTMLElement>('.reference-api');
  if (api) {
    extractSamples(api, samples, codeBlocks);
    api.remove();
  }
  const markdown = usage.querySelector<HTMLElement>('.component-markdown, .standalone-guidance');
  if (markdown) {
    const sampleContent = document.createElement('article');
    sampleContent.className = 'standalone-guidance';
    extractSamples(markdown, sampleContent, codeBlocks, { removeSources: true });
    if (sampleContent.childElementCount) samples.append(sampleContent);
  }
  for (const child of [...root.children]) {
    if (child === introduction || child.matches('.reference-footer, [data-single-preview]'))
      continue;
    extractSamples(child as HTMLElement, samples, codeBlocks, {
      movePreviews: true,
      preserveHeadingIds: true,
    });
    child.remove();
  }
  if (!samples.childElementCount) {
    introduction.append(...usage.children);
    return null;
  }
  let showcase: PageTabTargets['showcase'];
  if (basic && showcaseOptions.length > 1) {
    const heading = basic.querySelector<HTMLElement>(
      ':scope > h1,:scope > h2,:scope > h3,:scope > h4,:scope > h5,:scope > h6',
    );
    const preview = basic.querySelector<HTMLElement>(':scope > .preview[data-example-id]');
    const defaultId = preview?.dataset.exampleId;
    if (heading && preview && defaultId) {
      const showcaseHost = document.createElement('span');
      showcaseHost.className = 'reference-showcase-menu';
      heading.replaceChildren(showcaseHost);
      showcase = {
        host: showcaseHost,
        preview,
        defaultId,
        options: showcaseOptions,
      };
    }
  }
  introduction.append(host, usage, samples);
  return { host, usage, samples, prefix, showcase, codeBlocks };
}

function hashTarget(hash = window.location.hash): HTMLElement | null {
  try {
    return hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  } catch {
    return null;
  }
}

function tabForHash(targets: PageTabTargets): PageTab | undefined {
  const target = hashTarget();
  if (!target) return undefined;
  if (targets.samples.contains(target)) return 'samples';
  if (targets.usage.contains(target)) return 'usage';
  return undefined;
}

function storedPageTab(targets: PageTabTargets): PageTab | undefined {
  try {
    const value = sessionStorage.getItem(`coreai-docsite-page-tab:${targets.prefix}`);
    return value === 'usage' || value === 'samples' ? value : undefined;
  } catch {
    return undefined;
  }
}

export function PageTabs({ targets, title }: { targets: PageTabTargets; title: string }) {
  const [selected, setSelected] = React.useState<PageTab>(
    () => tabForHash(targets) ?? storedPageTab(targets) ?? 'usage',
  );
  React.useLayoutEffect(() => {
    targets.usage.hidden = selected !== 'usage';
    targets.samples.hidden = selected !== 'samples';
  }, [selected, targets]);
  React.useEffect(() => {
    try {
      sessionStorage.setItem(`coreai-docsite-page-tab:${targets.prefix}`, selected);
    } catch {
      // Session storage can be unavailable in restricted browser contexts.
    }
  }, [selected, targets.prefix]);
  React.useEffect(() => {
    const revealHash = () => {
      const tab = tabForHash(targets);
      setSelected(tab ?? storedPageTab(targets) ?? 'usage');
      if (tab) requestAnimationFrame(() => hashTarget()?.scrollIntoView({ block: 'start' }));
    };
    const revealLink = (event: MouseEvent) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
        return;
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (
        !(link instanceof HTMLAnchorElement) ||
        link.download ||
        (link.target && link.target !== '_self')
      )
        return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
      const element = hashTarget(url.hash);
      if (element && targets.samples.contains(element)) setSelected('samples');
      else if (element && targets.usage.contains(element)) setSelected('usage');
    };
    window.addEventListener('hashchange', revealHash);
    window.addEventListener('popstate', revealHash);
    document.addEventListener('click', revealLink);
    return () => {
      window.removeEventListener('hashchange', revealHash);
      window.removeEventListener('popstate', revealHash);
      document.removeEventListener('click', revealLink);
    };
  }, [targets]);
  return (
    <>
      <TabList
        appearance="elevated"
        aria-label={`${title} content`}
        selectedValue={selected}
        onTabSelect={(_, data) => setSelected(data.value as PageTab)}
      >
        {(['usage', 'samples'] as const).map((value) => (
          <Tab
            key={value}
            value={value}
            id={`${targets.prefix}-${value}-tab`}
            aria-controls={`${targets.prefix}-${value}-panel`}
          >
            {value === 'usage' ? 'Usage' : 'Samples'}
          </Tab>
        ))}
      </TabList>
      {targets.codeBlocks.map((block, index) =>
        createPortal(
          <CodeBlock
            className="reference-page-code-block"
            code={block.code}
            language={block.language}
          />,
          block.host,
          `${targets.prefix}-code-${index}`,
        ),
      )}
    </>
  );
}
