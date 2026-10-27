// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Card,
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

export const standaloneViews: Record<string, React.ComponentType<PageWidgetProps>> = {
  resources: ResourcesView,
  faqs: FaqsView,
};
