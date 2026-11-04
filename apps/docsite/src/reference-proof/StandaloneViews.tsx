// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Badge,
  Button,
  Card,
  CodeBlock,
  CopyButton,
  Link,
  Markdown,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  Tab,
  TabList,
  Text,
} from '@coreai-ds/react-components';
import { ArrowDownload20Regular } from '@fluentui/react-icons';
import { ChevronRight, ExternalIcon } from '../components/Icons';
import { WorkInProgress } from '../components/work-in-progress';
import type { PageWidgetProps } from './FoundationViews';
import { IntroFeatureCards } from './intro-feature-cards';
import { ContentHelpCards } from '../components/content-help-cards';
import { ContentPrincipleConnector } from '../components/content-principle-connector';

interface ResourceItem {
  title: string;
  description: string;
  href: string;
}

interface ResourceGroup {
  id: string;
  title: string;
  headingLevel: 'h2' | 'h3';
  items: ResourceItem[];
}

interface FaqItem {
  id: string;
  question: string;
  answerHtml: string;
}

interface FaqGroup {
  id: string;
  title: string;
  items: FaqItem[];
}

interface PackageSection {
  html: string;
  code?: string;
  language?: string;
}

interface ChangelogSection {
  title: string;
  items: string[];
}

interface ChangelogRelease {
  id: string;
  version: string;
  date?: string;
  title: string;
  summary: string;
  sections: ChangelogSection[];
}

interface ContentStep {
  title: string;
  description: string;
  descriptionHtml: string;
  details: string[];
  link?: { href: string; label: string };
}

interface ContentPrinciple {
  id: string;
  title: string;
  description: string;
  bad: string;
  better: string;
  details: string[];
}

function documentFrom(sourceHtml: string) {
  return new DOMParser().parseFromString(sourceHtml, 'text/html');
}

function followingUntil(element: Element, stop: (candidate: Element) => boolean) {
  const elements: Element[] = [];
  let candidate = element.nextElementSibling;
  while (candidate && !stop(candidate)) {
    elements.push(candidate);
    candidate = candidate.nextElementSibling;
  }
  return elements;
}

function resourceItems(elements: Element[]) {
  return elements
    .flatMap((element) => [...element.querySelectorAll<HTMLLIElement>('li')])
    .map((item) => {
      const link = item.querySelector<HTMLAnchorElement>('a[href]');
      if (!link) throw new Error('Missing resource link.');
      const title = link.textContent?.trim() ?? '';
      const description = (item.textContent ?? '')
        .slice((item.textContent ?? '').indexOf(title) + title.length)
        .replace(/^:\s*/, '')
        .trim();
      return {
        title,
        description,
        href: link.href,
      };
    });
}

function resourceGroups(sourceHtml: string): ResourceGroup[] {
  const document = documentFrom(sourceHtml);
  const headings = [...document.querySelectorAll('h2, h3')];
  if (!headings.length) {
    return [
      {
        id: 'guidance-resource-links',
        title: '',
        headingLevel: 'h3',
        items: resourceItems([...document.body.children]),
      },
    ];
  }
  const headingLevel = headings.some((heading) => heading.tagName === 'H2') ? 'H2' : 'H3';
  return headings
    .filter((heading) => heading.tagName === headingLevel)
    .map((heading) => ({
      id: heading.id,
      title: heading.textContent?.trim() ?? '',
      headingLevel: headingLevel.toLowerCase() as ResourceGroup['headingLevel'],
      items: resourceItems(
        followingUntil(heading, (candidate) => candidate.tagName === headingLevel),
      ),
    }));
}

function faqGroups(sourceHtml: string): FaqGroup[] {
  const document = documentFrom(sourceHtml);
  return [...document.querySelectorAll('h2')].map((heading) => {
    const section = followingUntil(heading, (candidate) => candidate.tagName === 'H2');
    const items: FaqItem[] = [];
    for (let index = 0; index < section.length; index++) {
      const question = section[index];
      if (question.tagName !== 'H3') continue;
      const answer: Element[] = [];
      for (let answerIndex = index + 1; answerIndex < section.length; answerIndex++) {
        if (section[answerIndex].tagName === 'H3') break;
        answer.push(section[answerIndex]);
      }
      items.push({
        id: question.id,
        question: question.textContent?.trim() ?? '',
        answerHtml: answer.map((element) => element.outerHTML).join(''),
      });
    }
    return {
      id: heading.id,
      title: heading.textContent?.trim() ?? '',
      items,
    };
  });
}

function sectionElements(document: Document, id: string, stopTags: string[]) {
  const heading = document.getElementById(id);
  if (!heading) throw new Error(`Missing package section: ${id}`);
  return followingUntil(heading, (candidate) => stopTags.includes(candidate.tagName));
}

function packageSection(elements: Element[]): PackageSection {
  const code = elements.find((element) => element.tagName === 'PRE')?.querySelector('code');
  return {
    html: elements
      .filter((element) => element.tagName !== 'PRE')
      .map((element) => element.outerHTML)
      .join(''),
    code: code?.textContent ?? undefined,
    language: [...(code?.classList ?? [])]
      .find((className) => className.startsWith('language-'))
      ?.replace('language-', ''),
  };
}

function ResourcesView({ sourceHtml }: PageWidgetProps) {
  const groups = React.useMemo(() => resourceGroups(sourceHtml), [sourceHtml]);
  return (
    <div className="reference-resources-view">
      {groups.map((group) => (
        <section className="page-section" id={group.id} key={group.id}>
          {group.title ? (
            <Text as={group.headingLevel} preset="heading3" foreground={1}>
              {group.title}
            </Text>
          ) : null}
          <div className="resources-grid">
            {group.items.map((resource) => {
              const titleId = `${group.id}-${resource.title.toLowerCase().replace(/\W+/g, '-')}`;
              return (
                <Link
                  className="resource-card-link"
                  key={resource.href}
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-labelledby={`${titleId}-title`}
                  aria-describedby={`${titleId}-description`}
                >
                  <Card className="resource-card" focusMode="off">
                    <Text
                      as="h3"
                      className="resource-card__title"
                      id={`${titleId}-title`}
                      size={300}
                      weight="semibold"
                      foreground={1}
                    >
                      {resource.title}{' '}
                      <span aria-hidden="true">
                        <ExternalIcon />
                      </span>
                      <span className="sr-only"> (opens in a new tab)</span>
                    </Text>
                    <Text as="p" id={`${titleId}-description`} size={200} foreground={3}>
                      {resource.description}
                    </Text>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function FaqsView({ sourceHtml }: PageWidgetProps) {
  const groups = React.useMemo(() => faqGroups(sourceHtml), [sourceHtml]);
  return (
    <div className="reference-faqs-view">
      {groups.map((group) => (
        <section className="page-section" id={group.id} key={group.id}>
          <Text as="h2" preset="heading3" foreground={1}>
            {group.title}
          </Text>
          <Accordion className="faq-list" multiple collapsible>
            {group.items.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionHeader expandIconPosition="end" size="large">
                  <Text size={400} weight="regular" foreground={1}>
                    {item.question}
                  </Text>
                </AccordionHeader>
                <AccordionPanel>
                  <div
                    className="faq-answer"
                    dangerouslySetInnerHTML={{ __html: item.answerHtml }}
                  />
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}
    </div>
  );
}

function PackageStep({
  number,
  title,
  section,
}: {
  number: number;
  title: string;
  section: PackageSection;
}) {
  return (
    <div className="package-step">
      <span className="package-step__number">{number}</span>
      <div className="package-step__content">
        <Text as="h3" weight="semibold" foreground={1}>
          {title}
        </Text>
        <div
          className="package-step__guidance standalone-guidance"
          dangerouslySetInnerHTML={{ __html: section.html }}
        />
        {section.code ? <CodeBlock code={section.code} language={section.language} /> : null}
      </div>
    </div>
  );
}

function PackageView({ sourceHtml }: PageWidgetProps) {
  const model = React.useMemo(() => {
    const document = documentFrom(sourceHtml);
    const readme = document.querySelector<HTMLAnchorElement>(
      'a[href*="packages/react-components/README.md"]',
    );
    if (!readme) throw new Error('Missing package README link.');
    const fullReferenceHeading = document.getElementById('guidance-full-package-reference');
    if (!fullReferenceHeading) throw new Error('Missing full package reference.');
    return {
      readmeHref: readme.href,
      install: packageSection(
        sectionElements(document, 'guidance-install', ['H2']).filter(
          (_element, index) => index < 3,
        ),
      ),
      fonts: packageSection(sectionElements(document, 'guidance-fonts', ['H2'])),
      usage: packageSection(
        sectionElements(document, 'guidance-usage', ['H2', 'H3']).filter(
          (_element, index) => index < 2,
        ),
      ),
      fullReferenceHtml: followingUntil(fullReferenceHeading, () => false)
        .map((element) => element.outerHTML)
        .join(''),
    };
  }, [sourceHtml]);
  const setupPrompt = `Read the @coreai-ds/react-components package README, then set up this project to use the package:

${model.readmeHref}

Follow the README's instructions for npm installation, optional Aptos setup and licensing, and CoreAIFluentProvider configuration. Make the required project changes directly and verify the result.`;
  return (
    <div className="package-guide">
      <section className="page-section package-section package-section--setup">
        <MessageBar intent="brand" layout="multiline" icon={null}>
          <MessageBarBody>
            <MessageBarTitle>Let your agent handle setup.</MessageBarTitle>
            Pass the{' '}
            <Link href={model.readmeHref} target="_blank" rel="noopener" external>
              package README
            </Link>{' '}
            to your agent for current installation and configuration guidance.
          </MessageBarBody>
          <MessageBarActions
            containerAction={
              <CopyButton aria-label="Copy package setup prompt" contentToCopy={setupPrompt} />
            }
          />
        </MessageBar>
        <div className="package-install">
          <PackageStep number={1} title="Install from npm" section={model.install} />
          <PackageStep number={2} title="Set up Aptos (recommended)" section={model.fonts} />
          <PackageStep number={3} title="Add it to your app" section={model.usage} />
        </div>
      </section>
      <details className="package-reference">
        <summary>
          <Text weight="semibold" foreground={1}>
            Full package reference
          </Text>
        </summary>
        <div
          className="standalone-guidance package-reference__content"
          dangerouslySetInnerHTML={{ __html: model.fullReferenceHtml }}
        />
      </details>
    </div>
  );
}

function releaseSections(elements: Element[], headingTag: 'H3' | 'H4') {
  const sections: ChangelogSection[] = [];
  for (let index = 0; index < elements.length; index++) {
    const heading = elements[index];
    if (heading.tagName !== headingTag) continue;
    const items: string[] = [];
    for (let itemIndex = index + 1; itemIndex < elements.length; itemIndex++) {
      if (elements[itemIndex].tagName === headingTag) break;
      items.push(...[...elements[itemIndex].querySelectorAll('li')].map((item) => item.innerHTML));
    }
    sections.push({
      title: heading.textContent?.trim() ?? '',
      items,
    });
  }
  return sections;
}

function changelogReleases(document: Document) {
  const earlierHeading = document.getElementById('guidance-earlier-site-release-summaries');
  if (!earlierHeading) throw new Error('Missing earlier release summaries.');
  const curated = new Map<string, { title: string; summary: string }>();
  const earlierElements = followingUntil(earlierHeading, () => false);
  for (let index = 0; index < earlierElements.length; index++) {
    const heading = earlierElements[index];
    if (heading.tagName !== 'H3') continue;
    const match = heading.textContent
      ?.trim()
      .match(/^(\d+\.\d+\.\d+)\s+—\s+(.+?)\s+\(\d{4}-\d{2}-\d{2}\)$/);
    if (!match) continue;
    const summary = earlierElements
      .slice(index + 1)
      .find((element) => ['H3', 'H4'].includes(element.tagName) || element.tagName === 'P');
    curated.set(match[1], {
      title: match[2],
      summary: summary?.tagName === 'P' ? (summary.textContent?.trim() ?? '') : '',
    });
  }
  const releases: ChangelogRelease[] = [];
  for (const heading of document.querySelectorAll('h2')) {
    const match = heading.textContent
      ?.trim()
      .match(/^(Unreleased|\d+\.\d+\.\d+)(?:\s+-\s+(\d{4}-\d{2}-\d{2}))?$/);
    if (!match) continue;
    const elements = followingUntil(heading, (candidate) => candidate.tagName === 'H2');
    const sections = releaseSections(elements, 'H3');
    const details = curated.get(match[1]);
    releases.push({
      id: heading.id,
      version: match[1],
      date: match[2] || undefined,
      title:
        details?.title ??
        (match[1] === 'Unreleased' ? 'Changes planned for the next release' : 'Package update'),
      summary:
        details?.summary ||
        `${sections.map((section) => section.title).join(', ')} updates in this release.`,
      sections,
    });
  }
  return releases;
}

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

interface ChangelogPoint {
  x: number;
  y: number;
}

interface ChangelogRail {
  kind: 'month' | 'release' | 'change';
  change?: string;
  join?: { x: number; color: string; path: string };
  path: string;
  points: ChangelogPoint[];
}

function measureChangelogRails(list: HTMLDivElement): ChangelogRail[] {
  const bounds = list.getBoundingClientRect();
  const point = (element: Element, offset: number): ChangelogPoint => {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left - bounds.left - offset,
      y: rect.top - bounds.top + parseFloat(getComputedStyle(element).lineHeight) / 2,
    };
  };
  const branch = (parent: ChangelogPoint, child: ChangelogPoint) =>
    `M ${parent.x} ${child.y - 12} Q ${parent.x} ${child.y} ${parent.x + 12} ${child.y} H ${child.x}`;
  const rails: ChangelogRail[] = [];
  const months: ChangelogPoint[] = [];
  let end = 0;
  for (const month of list.querySelectorAll<HTMLDetailsElement>('.changelog-month')) {
    const heading = month.querySelector('.changelog-month__header h2');
    if (!heading) continue;
    const monthPoint = point(heading, 28.5);
    months.push(monthPoint);
    end = monthPoint.y;
    if (!month.open) continue;
    for (const release of month.querySelectorAll('.changelog-entry')) {
      const version = release.querySelector('.changelog-entry__version a');
      if (!version) continue;
      const releasePoint = point(version, 20);
      end = releasePoint.y - 12;
      const sections: ChangelogPoint[] = [];
      for (const section of release.querySelectorAll<HTMLElement>('.changelog-entry__section')) {
        const title = section.querySelector('h4');
        if (!title) continue;
        const sectionPoint = point(title, 20);
        sections.push(sectionPoint);
        const items = [...section.querySelectorAll(':scope > ul > li')].map((item) =>
          point(item, 20),
        );
        rails.push({
          kind: 'change',
          change: section.dataset.change,
          join: {
            x: releasePoint.x,
            color: 'var(--colorBrandStroke1)',
            path: branch(releasePoint, sectionPoint),
          },
          path: items.length
            ? `M ${sectionPoint.x} ${sectionPoint.y} V ${items[items.length - 1].y}`
            : '',
          points: [sectionPoint, ...items],
        });
      }
      rails.push({
        kind: 'release',
        join: {
          x: monthPoint.x,
          color: 'var(--colorNeutralForeground3)',
          path: branch(monthPoint, releasePoint),
        },
        path: sections.length
          ? `M ${releasePoint.x} ${releasePoint.y} V ${sections[sections.length - 1].y - 12}`
          : '',
        points: [releasePoint],
      });
    }
  }
  if (months.length) {
    rails.push({
      kind: 'month',
      path: `M ${months[0].x} ${months[0].y} V ${end}`,
      points: months,
    });
  }
  return rails;
}

const changelogLinkDescriptions: Partial<Record<string, string>> = {
  'Full history': 'Complete package release history.',
  'Keep a Changelog': 'Release note format.',
  'Semantic Versioning': 'Package versioning rules.',
};

function ChangelogView({ sourceHtml }: PageWidgetProps) {
  const model = React.useMemo(() => {
    const document = documentFrom(sourceHtml);
    const introductionHeading = document.getElementById('guidance-package-release-history');
    if (!introductionHeading) throw new Error('Missing package release history.');
    const releases = changelogReleases(document);
    const groups = new Map<string, ChangelogRelease[]>();
    for (const release of releases) {
      const month = release.date?.slice(0, 7) ?? 'unreleased';
      groups.set(month, [...(groups.get(month) ?? []), release]);
    }
    const introduction = followingUntil(
      introductionHeading,
      (candidate) => candidate.tagName === 'H2',
    );
    return {
      links: introduction
        .flatMap((element) => [...element.querySelectorAll('a[href]')])
        .map((link) => ({
          href: link.getAttribute('href') ?? '',
          label: link.getAttribute('href')?.endsWith('/CHANGELOG.md')
            ? 'Full history'
            : (link.textContent?.trim() ?? ''),
        })),
      groups: [...groups],
    };
  }, [sourceHtml]);
  const listRef = React.useRef<HTMLDivElement>(null);
  const graphId = React.useId();
  const [rails, setRails] = React.useState<ChangelogRail[]>([]);
  React.useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const update = () => setRails(measureChangelogRails(list));
    const observer = new ResizeObserver(update);
    observer.observe(list);
    list.addEventListener('toggle', update, true);
    update();
    return () => {
      observer.disconnect();
      list.removeEventListener('toggle', update, true);
    };
  }, [model]);
  return (
    <div className="reference-changelog-view">
      <div className="resources-grid changelog-actions">
        {model.links.map((link, index) => {
          const resourceId = `${graphId}-resource-${index}`;
          const description = changelogLinkDescriptions[link.label];
          return (
            <Link
              className="resource-card-link"
              href={link.href}
              key={link.href}
              aria-labelledby={`${resourceId}-title`}
              aria-describedby={description ? `${resourceId}-description` : undefined}
            >
              <Card className="resource-card" focusMode="off">
                <Text
                  as="h3"
                  className="resource-card__title"
                  id={`${resourceId}-title`}
                  size={300}
                  weight="semibold"
                  foreground={1}
                >
                  {link.label}
                  <ExternalIcon />
                </Text>
                {description ? (
                  <Text as="p" id={`${resourceId}-description`} size={200} foreground={3}>
                    {description}
                  </Text>
                ) : null}
              </Card>
            </Link>
          );
        })}
      </div>
      <div className="changelog-list" ref={listRef}>
        <svg className="changelog-graph" aria-hidden="true">
          {rails.map((rail, index) => (
            <g className={`changelog-graph__${rail.kind}`} data-change={rail.change} key={index}>
              {rail.join ? (
                <>
                  <defs>
                    <linearGradient
                      id={`${graphId}-join-${index}`}
                      gradientUnits="userSpaceOnUse"
                      x1={rail.join.x}
                      y1={rail.points[0].y - 12}
                      x2={rail.points[0].x}
                      y2={rail.points[0].y}
                    >
                      <stop offset="0" style={{ color: rail.join.color }} />
                      <stop offset="1" />
                    </linearGradient>
                  </defs>
                  <path
                    className="changelog-graph__join"
                    d={rail.join.path}
                    stroke={`url(#${graphId}-join-${index})`}
                  />
                </>
              ) : null}
              <path className="changelog-graph__rail" d={rail.path} stroke="currentColor" />
              {rail.points.map((point, pointIndex) => (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={rail.kind === 'change' && pointIndex > 0 ? 2.5 : 3.5}
                  key={pointIndex}
                />
              ))}
            </g>
          ))}
        </svg>
        {model.groups.map(([month, releases]) => (
          <details className="changelog-month" key={month} open>
            <summary className="changelog-month__header">
              <Text as="h2" size={500} weight="semibold" foreground={1}>
                {month === 'unreleased'
                  ? 'Unreleased'
                  : monthFormatter.format(new Date(`${month}-01T00:00:00Z`))}
              </Text>
              <ChevronRight className="changelog-month__chevron" aria-hidden="true" />
            </summary>
            <div className="changelog-month__entries">
              {releases.map((release) => (
                <article className="changelog-entry" id={release.id} key={release.version}>
                  <div className="changelog-entry__version">
                    <a href={`#${release.id}`}>
                      {release.version === 'Unreleased'
                        ? 'Unreleased'
                        : `Version ${release.version}`}
                    </a>
                    {release.date ? (
                      <Badge appearance="tint" color="subtle" shape="rounded">
                        <time dateTime={release.date}>
                          {dateFormatter.format(new Date(`${release.date}T00:00:00Z`))}
                        </time>
                      </Badge>
                    ) : null}
                  </div>
                  <div className="changelog-entry__content">
                    <div className="changelog-entry__summary">
                      <Text as="h3" weight="semibold" foreground={1}>
                        {release.title}
                      </Text>
                      <Text as="p" foreground={3}>
                        {release.summary}
                      </Text>
                    </div>
                    <div className="changelog-entry__sections">
                      {release.sections.map((section) => (
                        <section
                          className="changelog-entry__section"
                          data-change={section.title}
                          key={section.title}
                        >
                          <Text as="h4" weight="semibold" foreground={1}>
                            <Badge
                              className="changelog-change-badge"
                              appearance="tint"
                              color="brand"
                              shape="rounded"
                            >
                              {section.title}
                            </Badge>
                          </Text>
                          <ul>
                            {section.items.map((item, index) => (
                              <li
                                key={`${section.title}-${index}`}
                                dangerouslySetInnerHTML={{ __html: item }}
                              />
                            ))}
                          </ul>
                        </section>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function stripFrontmatter(source: string) {
  return source.replace(/^---\n[\s\S]*?\n---\n/, '').trimStart();
}

function PackageSkillView({ sourceHtml }: PageWidgetProps) {
  const [view, setView] = React.useState<'markdown' | 'text'>('markdown');
  const model = React.useMemo(() => {
    const document = documentFrom(sourceHtml);
    const sourceHeading = document.getElementById('guidance-skill-source');
    if (!sourceHeading) throw new Error('Missing skill source.');
    const source = followingUntil(sourceHeading, () => false)
      .find((element) => element.tagName === 'PRE')
      ?.querySelector('code')?.textContent;
    const download = document.querySelector<HTMLAnchorElement>(
      'a[href$="/source/package/SKILL.md"]',
    );
    if (!source || !download) throw new Error('Missing downloadable skill source.');
    return {
      guidanceHtml: [...document.querySelectorAll('h2')]
        .filter((heading) => heading !== sourceHeading)
        .flatMap((heading) => [
          heading.outerHTML,
          ...followingUntil(heading, (candidate) => candidate.tagName === 'H2').map(
            (element) => element.outerHTML,
          ),
        ])
        .join(''),
      source,
      downloadHref: download.href,
    };
  }, [sourceHtml]);
  return (
    <div className="coreai-skill-view">
      <div
        className="coreai-skill-guidance standalone-guidance"
        dangerouslySetInnerHTML={{ __html: model.guidanceHtml }}
      />
      <div className="coreai-skill-toolbar">
        <TabList
          appearance="elevated"
          selectedValue={view}
          onTabSelect={(_event, data) => setView(data.value as 'markdown' | 'text')}
        >
          <Tab value="markdown">Markdown</Tab>
          <Tab value="text">Rendered</Tab>
        </TabList>
        <Button
          as="a"
          href={model.downloadHref}
          download="SKILL.md"
          appearance="outline"
          icon={<ArrowDownload20Regular />}
        >
          Download
        </Button>
      </div>
      {view === 'markdown' ? (
        <CodeBlock
          className="coreai-skill-code"
          code={model.source}
          language="markdown"
          header={
            <Text preset="heading6" foreground={3}>
              .github/skills/coreai-ds-fluentui-react/SKILL.md
            </Text>
          }
          headerAppearance="subtle"
        />
      ) : (
        <Markdown content={stripFrontmatter(model.source)} />
      )}
    </div>
  );
}

function headingGroups(elements: Element[], tagName: 'H3' | 'H4') {
  return elements
    .map((element, index) => {
      if (element.tagName !== tagName) return null;
      const body: Element[] = [];
      for (let bodyIndex = index + 1; bodyIndex < elements.length; bodyIndex++) {
        if (elements[bodyIndex].tagName === tagName) break;
        body.push(elements[bodyIndex]);
      }
      return { heading: element, body };
    })
    .filter((group): group is { heading: Element; body: Element[] } => group !== null);
}

function contentSteps(document: Document, sectionId: string): ContentStep[] {
  return headingGroups(sectionElements(document, sectionId, ['H2']), 'H3').map(
    ({ heading, body }) => {
      const link = body
        .flatMap((element) => [...element.querySelectorAll<HTMLAnchorElement>('a[href]')])
        .at(-1);
      const description = body.find((element) => element.tagName === 'P');
      return {
        title: heading.textContent?.trim() ?? '',
        description: description?.textContent?.trim() ?? '',
        descriptionHtml: description?.innerHTML ?? '',
        details: body
          .flatMap((element) => [...element.querySelectorAll('li')])
          .map((item) => item.innerHTML),
        link: link ? { href: link.href, label: link.textContent?.trim() ?? '' } : undefined,
      };
    },
  );
}

function ContentStepList({ steps }: { steps: ContentStep[] }) {
  return (
    <div className="content-flow">
      {steps.map((step) => (
        <div className="content-step" key={step.title}>
          <div className="content-step__content">
            <Text as="h3" weight="semibold" foreground={1}>
              {step.title}
            </Text>
            <div dangerouslySetInnerHTML={{ __html: step.descriptionHtml }} />
            {step.details.length ? (
              <ul className="content-guidance-list">
                {step.details.map((detail, detailIndex) => (
                  <li
                    key={`${step.title}-${detailIndex}`}
                    dangerouslySetInnerHTML={{ __html: detail }}
                  />
                ))}
              </ul>
            ) : null}
            {step.link ? (
              <Link href={step.link.href} external>
                {step.link.label}
              </Link>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContentSectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="content-section__header">
      <Text as="h2" size={500} weight="semibold" foreground={1}>
        {title}
      </Text>
      {description ? (
        <Text as="p" className="section-intro" size={300} foreground={3}>
          {description}
        </Text>
      ) : null}
    </div>
  );
}

function ContentView({ sourceHtml }: PageWidgetProps) {
  const model = React.useMemo(() => {
    const document = documentFrom(sourceHtml);
    const principles = headingGroups(
      sectionElements(document, 'guidance-write-clear-useful-content', ['H2']),
      'H3',
    ).map(({ heading, body }): ContentPrinciple => {
      const comparisons = body.filter(
        (element) => element.tagName === 'P' && element.querySelector('strong'),
      );
      const comparisonText = (element: Element | undefined) => {
        const clone = element?.cloneNode(true) as Element | undefined;
        clone?.querySelector('strong')?.remove();
        return clone?.textContent?.replace(/^:\s*/, '').trim() ?? '';
      };
      return {
        id: heading.id,
        title: heading.textContent?.trim() ?? '',
        description:
          body
            .find((element) => element.tagName === 'P' && !element.querySelector('strong'))
            ?.textContent?.trim() ?? '',
        bad: comparisonText(comparisons[0]),
        better: comparisonText(comparisons[1]),
        details: body
          .flatMap((element) => [...element.querySelectorAll('li')])
          .map((item) => item.textContent?.trim() ?? ''),
      };
    });
    const processElements = sectionElements(document, 'guidance-process-tips', ['H2']);
    const helpElements = sectionElements(document, 'guidance-get-help', ['H2']);
    return {
      principles,
      processDescription:
        processElements.find((element) => element.tagName === 'P')?.textContent?.trim() ?? '',
      process: contentSteps(document, 'guidance-process-tips'),
      helpDescription:
        helpElements.find((element) => element.tagName === 'P')?.textContent?.trim() ?? '',
      help: contentSteps(document, 'guidance-get-help').map((step) => {
        if (!step.link) throw new Error('Missing content help link.');
        return { title: step.title, description: step.description, href: step.link.href };
      }),
    };
  }, [sourceHtml]);
  return (
    <div className="content-page">
      <section className="page-section content-section">
        <Accordion className="content-principle-list" multiple collapsible>
          {model.principles.map((principle, index) => (
            <AccordionItem className="content-principle" key={principle.id} value={principle.id}>
              <ContentPrincipleConnector />
              <AccordionHeader expandIconPosition="end" size="large">
                <span className="content-principle__trigger">
                  <span className="content-principle__number">{index + 1}</span>
                  <span className="content-principle__heading">
                    <Text size={400} weight="semibold" foreground={1}>
                      {principle.title}
                    </Text>
                    <Text size={300} foreground={3}>
                      {principle.description}
                    </Text>
                  </span>
                </span>
              </AccordionHeader>
              <AccordionPanel>
                <div className="content-principle__content">
                  <div className="content-example-grid">
                    <div className="content-example content-example--avoid">
                      <Badge appearance="filled" color="danger" shape="rounded" size="medium">
                        Bad
                      </Badge>
                      <div className="content-example__body">
                        <Text as="p" size={300} foreground={3}>
                          {principle.bad}
                        </Text>
                      </div>
                    </div>
                    <div className="content-example content-example--prefer">
                      <Badge appearance="filled" color="success" shape="rounded" size="medium">
                        Better
                      </Badge>
                      <div className="content-example__body">
                        <Text as="p" size={300} foreground={3}>
                          {principle.better}
                        </Text>
                      </div>
                    </div>
                  </div>
                  <div className="content-principle__guidance">
                    <Badge
                      id={`content-principle-${index}-tips`}
                      appearance="outline"
                      color="informative"
                      shape="rounded"
                      size="medium"
                    >
                      Writing tips
                    </Badge>
                    <ul
                      className="content-guidance-list"
                      aria-labelledby={`content-principle-${index}-tips`}
                    >
                      {principle.details.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
      <section className="page-section content-section content-section--primary">
        <ContentSectionHeader title="Process tips" description={model.processDescription} />
        <ContentStepList steps={model.process} />
      </section>
      <section className="page-section content-section">
        <ContentSectionHeader title="Get help" description={model.helpDescription} />
        <ContentHelpCards items={model.help} />
      </section>
    </div>
  );
}

function AgentWorkflowView({ sourceHtml }: PageWidgetProps) {
  const model = React.useMemo(() => {
    const document = documentFrom(sourceHtml);
    const startElements = sectionElements(document, 'guidance-start-here', ['H2']);
    const steps = [
      ...(startElements.find((element) => element.tagName === 'OL')?.children ?? []),
    ].map((item) => {
      const clone = item.cloneNode(true) as Element;
      const heading = clone.querySelector('strong');
      const title = heading?.textContent?.replace(/\.$/, '').trim() ?? '';
      heading?.remove();
      return { title, html: clone.innerHTML.trim() };
    });
    const mappingElements = sectionElements(document, 'guidance-direct-url-mapping', ['H2']);
    const mapping = mappingElements
      .flatMap((element) => [...element.querySelectorAll('li')])
      .map((item) => item.textContent?.trim() ?? '')
      .join('\n');
    const remaining = [...document.querySelectorAll('h2')]
      .filter(
        (heading) => !['guidance-start-here', 'guidance-direct-url-mapping'].includes(heading.id),
      )
      .map((heading) => ({
        id: heading.id,
        title: heading.textContent?.trim() ?? '',
        html: followingUntil(heading, (candidate) => candidate.tagName === 'H2')
          .map((element) => element.outerHTML)
          .join(''),
      }));
    return {
      baseHtml: startElements.find((element) => element.tagName === 'P')?.innerHTML ?? '',
      steps,
      mapping,
      mappingHtml: mappingElements
        .filter((element) => element.tagName !== 'UL')
        .map((element) => element.outerHTML)
        .join(''),
      remaining,
    };
  }, [sourceHtml]);
  return (
    <div className="agent-workflow-view">
      <MessageBar intent="brand" layout="multiline" icon={null}>
        <MessageBarBody>
          <MessageBarTitle>Use CoreAI Markdown over ordinary HTTPS.</MessageBarTitle>
          <span dangerouslySetInnerHTML={{ __html: model.baseHtml }} />
        </MessageBarBody>
      </MessageBar>
      <div className="package-install">
        {model.steps.map((step, index) => (
          <div className="package-step" key={step.title}>
            <span className="package-step__number">{index + 1}</span>
            <div className="package-step__content">
              <Text as="h3" weight="semibold" foreground={1}>
                {step.title}
              </Text>
              <div dangerouslySetInnerHTML={{ __html: step.html }} />
            </div>
          </div>
        ))}
      </div>
      <section className="agent-workflow-mapping">
        <Text as="h2" preset="heading3" foreground={1}>
          Direct URL mapping
        </Text>
        <CodeBlock code={model.mapping} language="text" />
        <div
          className="standalone-guidance"
          dangerouslySetInnerHTML={{ __html: model.mappingHtml }}
        />
      </section>
      <div className="agent-workflow-sections">
        {model.remaining.map((section) => (
          <section className="agent-workflow-section" id={section.id} key={section.id}>
            <Text as="h2" preset="heading3" foreground={1}>
              {section.title}
            </Text>
            <div
              className="standalone-guidance"
              dangerouslySetInnerHTML={{ __html: section.html }}
            />
          </section>
        ))}
      </div>
    </div>
  );
}

function WorkInProgressView({ model }: PageWidgetProps) {
  return <WorkInProgress standalone={model.underConstruction} />;
}

export const standaloneViews: Record<string, React.ComponentType<PageWidgetProps>> = {
  'work-in-progress': WorkInProgressView,
  resources: ResourcesView,
  includes: IntroFeatureCards,
  faqs: FaqsView,
  package: PackageView,
  changelog: ChangelogView,
  'package-skill': PackageSkillView,
  content: ContentView,
  'agent-workflow': AgentWorkflowView,
};
