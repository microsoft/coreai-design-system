// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Tab, TabList } from '@coreai-ds/react-components';
import './page-tabs.css';

type PageTab = 'usage' | 'samples';

export interface PageTabTargets {
  host: HTMLElement;
  usage: HTMLElement;
  samples: HTMLElement;
  prefix: string;
}

function extractSamples(source: HTMLElement, samples: HTMLElement) {
  const groups = new Map<Element, HTMLElement>();
  for (const section of [...source.querySelectorAll<HTMLElement>('.guidance-section')]) {
    if (!source.contains(section) || !section.querySelector('pre')) continue;
    const heading = section.querySelector('h2,h3,h4,h5,h6');
    const guidance = /best practices|behavior|accessibility|design guidance/i.test(
      heading?.textContent ?? '',
    );
    if (!guidance && !section.querySelector('[data-example-id], [data-page-widget]')) {
      samples.append(section);
    }
  }
  for (const code of [...source.querySelectorAll('pre')]) {
    const section = code.closest('.guidance-section') ?? source;
    const heading =
      section === source
        ? [...source.querySelectorAll('h2,h3,h4,h5,h6')]
            .filter(
              (element) => element.compareDocumentPosition(code) & Node.DOCUMENT_POSITION_FOLLOWING,
            )
            .at(-1)
        : section.querySelector('h2,h3,h4,h5,h6');
    const context = heading ?? section;
    let group = groups.get(context);
    if (!group) {
      group = document.createElement('section');
      group.className = 'reference-sample-section';
      if (heading) {
        const label = heading.cloneNode(true) as HTMLElement;
        label.removeAttribute('id');
        label.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
        group.append(label);
      }
      samples.append(group);
      groups.set(context, group);
    }
    const download = code.previousElementSibling;
    if (download?.matches('p') && download.querySelector('a[href*="source/"]')) {
      group.append(download);
    }
    for (const paragraph of section.querySelectorAll('p')) {
      if (paragraph.textContent?.startsWith('Source: ')) group.append(paragraph);
    }
    group.append(code);
  }
}

export function preparePageTabs(root: HTMLElement): PageTabTargets | null {
  const introduction = root.querySelector<HTMLElement>('.reference-page-introduction');
  const header = introduction?.querySelector<HTMLElement>('[data-page-header]');
  if (!introduction || !header || header.hidden) return null;
  const article = introduction.querySelector<HTMLElement>('.standalone-guidance');
  const basic = introduction.querySelector<HTMLElement>('[data-basic-example]');
  if (!basic && !article?.querySelector('pre')) return null;
  if (
    article &&
    [...article.querySelectorAll<HTMLElement>('[data-page-widget]')].some(
      (widget) =>
        !['colors', 'data-visualization', 'font-families', 'typography'].includes(
          widget.dataset.pageWidget ?? '',
        ),
    )
  )
    return null;

  const host = document.createElement('div');
  host.className = 'reference-page-tabs';
  const usage = document.createElement('div');
  const samples = document.createElement('div');
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
  }

  for (const child of [...introduction.children]) {
    if (child !== header) usage.append(child);
  }
  const source = basic?.querySelector<HTMLDetailsElement>('.reference-basic-source');
  if (source) {
    const example = document.createElement('section');
    example.className = 'example reference-default-source';
    const heading = basic?.querySelector('h2')?.cloneNode(true) as HTMLElement | undefined;
    if (heading) {
      heading.removeAttribute('id');
      example.append(heading);
    }
    for (const paragraph of basic?.querySelectorAll(':scope > p') ?? []) {
      if (paragraph.textContent?.startsWith('Source: ')) example.append(paragraph);
    }
    source.open = true;
    example.append(source);
    samples.append(example);
  }
  const api = usage.querySelector('.reference-api');
  if (api) samples.append(api);
  const markdown = usage.querySelector<HTMLElement>('.component-markdown, .standalone-guidance');
  if (markdown) {
    const sampleContent = document.createElement('article');
    sampleContent.className = 'standalone-guidance';
    extractSamples(markdown, sampleContent);
    if (sampleContent.childElementCount) samples.append(sampleContent);
  }
  for (const child of [...root.children]) {
    if (child === introduction || child.matches('.reference-footer, [data-single-preview]'))
      continue;
    samples.append(child);
  }
  if (!samples.childElementCount) {
    introduction.append(...usage.children);
    return null;
  }
  introduction.append(host, usage, samples);
  return { host, usage, samples, prefix };
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

export function PageTabs({ targets, title }: { targets: PageTabTargets; title: string }) {
  const [selected, setSelected] = React.useState<PageTab>(() => tabForHash(targets) ?? 'usage');
  React.useLayoutEffect(() => {
    targets.usage.hidden = selected !== 'usage';
    targets.samples.hidden = selected !== 'samples';
  }, [selected, targets]);
  React.useEffect(() => {
    const revealHash = () => {
      const tab = tabForHash(targets);
      setSelected(tab ?? 'usage');
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
  );
}
