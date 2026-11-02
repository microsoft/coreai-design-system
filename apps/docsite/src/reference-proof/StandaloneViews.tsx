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

function resourceGroups(sourceHtml: string): ResourceGroup[] {
  const document = documentFrom(sourceHtml);
  const headings = [...document.querySelectorAll('h2, h3')];
  const headingLevel = headings.some((heading) => heading.tagName === 'H2') ? 'H2' : 'H3';
  return headings
    .filter((heading) => heading.tagName === headingLevel)
    .map((heading) => ({
      id: heading.id,
      title: heading.textContent?.trim() ?? '',
      headingLevel: headingLevel.toLowerCase() as ResourceGroup['headingLevel'],
      items: followingUntil(heading, (candidate) => candidate.tagName === headingLevel)
        .flatMap((element) => [...element.querySelectorAll<HTMLLIElement>('li')])
        .map((item) => {
          const link = item.querySelector<HTMLAnchorElement>('a[href]');
          if (!link) throw new Error(`Missing resource link in ${heading.textContent}.`);
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
        }),
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
          <Text as={group.headingLevel} preset="heading3" foreground={1}>
            {group.title}
          </Text>
          <div className="resources-grid">
            {group.items.map((resource) => {
              const titleId = `${group.id}-${resource.title.toLowerCase().replace(/\W+/g, '-')}`;
              return (
                <Card
                  as="a"
                  key={resource.href}
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  focusMode="off"
                  className="resource-card resource-card-link"
                  aria-labelledby={`${titleId}-title`}
                  aria-describedby={`${titleId}-description`}
                >
                  <div className="resource-card__title">
                    <Text
                      as="h3"
                      id={`${titleId}-title`}
                      size={500}
                      weight="regular"
                      foreground={1}
                    >
                      {resource.title}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </Text>
                    <span aria-hidden="true">
                      <ExternalIcon />
                    </span>
                  </div>
                  <Text as="p" id={`${titleId}-description`} size={300} foreground={2}>
                    {resource.description}
                  </Text>
                </Card>
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
    return {
      introductionHtml: followingUntil(
        introductionHeading,
        (candidate) => candidate.tagName === 'H2',
      )
        .map((element) => element.outerHTML)
        .join(''),
      groups: [...groups],
    };
  }, [sourceHtml]);
  return (
    <div className="reference-changelog-view">
      <div
        className="changelog-intro standalone-guidance"
        dangerouslySetInnerHTML={{ __html: model.introductionHtml }}
      />
      <div className="changelog-list">
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
                      <time dateTime={release.date}>
                        {dateFormatter.format(new Date(`${release.date}T00:00:00Z`))}
                      </time>
                    ) : null}
                  </div>
                  <div className="changelog-entry__content">
                    <div className="changelog-entry__summary">
                      <Text as="h3" weight="semibold" foreground={1}>
                        {release.title}
                      </Text>
                      <Text as="p" foreground={2}>
                        {release.summary}
                      </Text>
                    </div>
                    <div className="changelog-entry__sections">
                      {release.sections.map((section) => (
                        <section className="changelog-entry__section" key={section.title}>
                          <Text as="h4" weight="semibold" foreground={1}>
                            {section.title}
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
      return {
        title: heading.textContent?.trim() ?? '',
        descriptionHtml: body.find((element) => element.tagName === 'P')?.innerHTML ?? '',
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
      {steps.map((step, index) => (
        <div className="content-step" key={step.title}>
          <span className="content-step__number">{index + 1}</span>
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
        <Text as="p" className="section-intro" size={300} foreground={2}>
          {description}
        </Text>
      ) : null}
    </div>
  );
}

function ContentView({ sourceHtml }: PageWidgetProps) {
  const [view, setView] = React.useState<'principles' | 'process'>('principles');
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
    const checklistElements = sectionElements(document, 'guidance-before-you-publish', ['H2']);
    const processElements = sectionElements(document, 'guidance-do-content-design', ['H2']);
    const helpElements = sectionElements(document, 'guidance-get-help', ['H2']);
    return {
      principles,
      checklistDescription:
        checklistElements.find((element) => element.tagName === 'P')?.textContent?.trim() ?? '',
      checklist: checklistElements
        .flatMap((element) => [...element.querySelectorAll('li')])
        .map((item) => item.textContent?.trim() ?? ''),
      processDescription:
        processElements.find((element) => element.tagName === 'P')?.textContent?.trim() ?? '',
      process: contentSteps(document, 'guidance-do-content-design'),
      helpDescription:
        helpElements.find((element) => element.tagName === 'P')?.textContent?.trim() ?? '',
      help: contentSteps(document, 'guidance-get-help'),
    };
  }, [sourceHtml]);
  return (
    <div className="content-page">
      <TabList
        aria-label="Content guidance"
        className="content-tabs"
        appearance="elevated"
        selectedValue={view}
        onTabSelect={(_event, data) => setView(data.value as 'principles' | 'process')}
      >
        <Tab value="principles">Principles</Tab>
        <Tab value="process">Process</Tab>
      </TabList>
      {view === 'principles' ? (
        <div className="content-principles">
          <section className="page-section content-section">
            <ContentSectionHeader title="Write clear, useful content" />
            <Accordion className="content-principle-list" multiple collapsible>
              {model.principles.map((principle, index) => (
                <AccordionItem
                  className="content-principle"
                  key={principle.id}
                  value={principle.id}
                >
                  <AccordionHeader expandIconPosition="end" size="large">
                    <span className="content-principle__trigger">
                      <span className="content-principle__number">{index + 1}</span>
                      <span className="content-principle__heading">
                        <Text size={400} weight="semibold" foreground={1}>
                          {principle.title}
                        </Text>
                        <Text size={300} foreground={2}>
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
                            <Text as="p" size={300} foreground={2}>
                              {principle.bad}
                            </Text>
                          </div>
                        </div>
                        <div className="content-example content-example--prefer">
                          <Badge appearance="filled" color="success" shape="rounded" size="medium">
                            Better
                          </Badge>
                          <div className="content-example__body">
                            <Text as="p" size={300} foreground={2}>
                              {principle.better}
                            </Text>
                          </div>
                        </div>
                      </div>
                      <ul className="content-guidance-list">
                        {principle.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
          <section className="page-section content-section">
            <ContentSectionHeader
              title="Before you publish"
              description={model.checklistDescription}
            />
            <ul className="content-publish-checklist">
              {model.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      ) : (
        <div className="content-guide">
          <section className="page-section content-section content-section--primary">
            <ContentSectionHeader
              title="Do content design"
              description={model.processDescription}
            />
            <ContentStepList steps={model.process} />
          </section>
          <section className="page-section content-section">
            <ContentSectionHeader title="Get help" description={model.helpDescription} />
            <ContentStepList steps={model.help} />
          </section>
        </div>
      )}
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
  faqs: FaqsView,
  package: PackageView,
  changelog: ChangelogView,
  'package-skill': PackageSkillView,
  content: ContentView,
  'agent-workflow': AgentWorkflowView,
};
