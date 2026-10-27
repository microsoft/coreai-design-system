// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Card,
  CodeBlock,
  CopyButton,
  Link,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  Text,
} from '@coreai-ds/react-components';
import { ExternalIcon } from '../components/Icons';
import { ResourceIcon } from './PagePresentation';
import type { PageWidgetProps } from './FoundationViews';

interface ResourceItem {
  title: string;
  description: string;
  href: string;
  destination: string;
}

interface ResourceGroup {
  id: string;
  title: string;
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

function resourceDestination(href: string) {
  const { hostname } = new URL(href, window.location.href);
  if (hostname.endsWith('figma.com')) return 'Figma';
  if (hostname.includes('storybook')) return 'Storybook';
  if (hostname.endsWith('npmjs.com')) return 'npm';
  if (hostname.endsWith('github.com')) return 'GitHub';
  if (hostname.endsWith('microsoft.com')) return 'Microsoft Download Center';
  return hostname.replace(/^www\./, '');
}

function resourceGroups(sourceHtml: string): ResourceGroup[] {
  const document = documentFrom(sourceHtml);
  return [...document.querySelectorAll('h2')].map((heading) => ({
    id: heading.id,
    title: heading.textContent?.trim() ?? '',
    items: followingUntil(heading, (candidate) => candidate.tagName === 'H2')
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
          destination: resourceDestination(link.href),
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
          <Text as="h2" preset="heading3">
            {group.title}
          </Text>
          <div className="resources-grid">
            {group.items.map((resource) => {
              const titleId = `${group.id}-${resource.title.toLowerCase().replace(/\W+/g, '-')}`;
              return (
                <a
                  key={resource.href}
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-card-link"
                  aria-labelledby={`${titleId}-title`}
                  aria-describedby={`${titleId}-description ${titleId}-destination`}
                >
                  <Card appearance="filled-alternative" focusMode="off" className="resource-card">
                    <span className="resource-card__icon" aria-hidden="true">
                      <ResourceIcon href={resource.href} />
                    </span>
                    <Text as="h3" id={`${titleId}-title`} size={500} weight="regular">
                      {resource.title}
                    </Text>
                    <Text as="p" id={`${titleId}-description`} size={300} foreground={2}>
                      {resource.description}
                    </Text>
                    <span className="resource-card__destination">
                      <Text id={`${titleId}-destination`} size={200}>
                        {resource.destination}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </Text>
                      <ExternalIcon />
                    </span>
                  </Card>
                </a>
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
          <Text as="h2" preset="heading3">
            {group.title}
          </Text>
          <Accordion className="faq-list" multiple collapsible>
            {group.items.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionHeader expandIconPosition="end" size="large">
                  <Text size={400} weight="regular">
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
        <Text as="h3" weight="semibold">
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
          <Text weight="semibold">Full package reference</Text>
        </summary>
        <div
          className="standalone-guidance package-reference__content"
          dangerouslySetInnerHTML={{ __html: model.fullReferenceHtml }}
        />
      </details>
    </div>
  );
}

export const standaloneViews: Record<string, React.ComponentType<PageWidgetProps>> = {
  resources: ResourcesView,
  faqs: FaqsView,
  package: PackageView,
};
