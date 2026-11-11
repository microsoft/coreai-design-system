// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Badge,
  Link,
  Text,
} from '@coreai-ds/react-components';
import { PageLayout } from '../components/PageLayout';
import { ContentHelpCards } from '../components/ContentHelpCards';
import { ContentPrincipleConnector } from '../components/ContentPrincipleConnector';

interface ContentStep {
  title: string;
  description: string;
  details?: string[];
  link?: {
    href: string;
    label: string;
  };
}

interface ContentExample {
  firstLabel: string;
  first: string;
  secondLabel: string;
  second: string;
}

interface Principle {
  title: string;
  description: string;
  examples?: ContentExample[];
  details?: string[];
}

const contentDesignSteps: ContentStep[] = [
  {
    title: 'Write real content',
    description:
      'Use realistic product language instead of placeholder copy. Aim for a first draft that is as close to the final content as possible.',
  },
  {
    title: 'Refine the draft',
    description:
      'Use the Content Design Copilot agent to simplify jargon. Refine the draft so it follows Microsoft voice standards and sounds natural.',
  },
  {
    title: 'Review it in context',
    description:
      'Review the content in a complete flow or mockup. Check UI terminology, errors, and empty states to make sure the words work in context.',
  },
  {
    title: 'Before you publish',
    description:
      'Put the main point first and make the next action clear. Cut extra words, read it aloud, and check that everyone can understand and use it.',
  },
];

const supportSteps = [
  {
    title: 'Use the agent',
    description: 'Start here for lower-risk work that needs a strong first draft.',
    details: [
      'There are no legal, data security, or Responsible AI implications.',
      'You want to simplify basic jargon or create realistic stand-in content.',
      'The work does not involve new UI.',
    ],
    link: {
      href: 'https://m365.cloud.microsoft/chat/?titleId=T_3e60de43-9ea8-499c-1f68-30bd3ff0e720',
      label: 'Open the Content Design Copilot',
    },
  },
  {
    title: 'Make a content design request',
    description:
      'Ask for direct support when the work is sensitive, strategic, or needs expert judgment.',
    details: [
      'The work has legal, data security, or Responsible AI implications.',
      'You do not know where to start.',
      'You need help with a larger content strategy, new or redesigned feature, navigation, AI behavior, or content research.',
      'The work requires terminology alignment across products or platforms.',
    ],
    link: {
      href: 'https://aka.ms/c-designdesk',
      label: 'Open the content design desk',
    },
  },
] satisfies ContentStep[];

const principles: Principle[] = [
  {
    title: 'Write for the reader',
    description:
      'Start with what the reader needs to know, do, or decide. Help them accomplish a goal.',
    examples: [
      {
        firstLabel: 'Bad',
        first: 'Microsoft offers a variety of privacy compliance solutions.',
        secondLabel: 'Better',
        second:
          'Manage privacy requirements with tools designed to help you meet compliance obligations.',
      },
    ],
    details: [
      "Focus on the customer's goal, not your organization's capabilities.",
      "Answer the reader's next question before they need to ask it.",
      'Choose usefulness over sounding impressive.',
    ],
  },
  {
    title: 'Lead with the action',
    description: 'Put the most important information first and make the next step clear.',
    examples: [
      {
        firstLabel: 'Bad',
        first:
          'Before beginning the process of creating a workspace, there are several important considerations that should be reviewed.',
        secondLabel: 'Better',
        second: 'Create your workspace first. Then review these requirements.',
      },
    ],
    details: [
      'Lead with the key takeaway.',
      'Use active voice so readers know who acts and what to do.',
      'Keep one idea in each sentence.',
    ],
  },
  {
    title: 'Write like a person',
    description:
      'Use familiar words, a natural tone, and only the words needed to communicate the idea.',
    examples: [
      {
        firstLabel: 'Bad',
        first: 'Utilize the platform to facilitate collaboration.',
        secondLabel: 'Better',
        second: 'Use the platform to work together.',
      },
    ],
    details: [
      'Use common words instead of jargon.',
      'Read the content aloud. Rewrite anything that sounds unnatural.',
      'Remove weak phrases and unnecessary introductions.',
    ],
  },
  {
    title: 'Make it easy to scan and use',
    description:
      'Organize content so people can find the main point quickly and use it with any input method.',
    examples: [
      {
        firstLabel: 'Bad',
        first: 'Click the blue button on the right.',
        secondLabel: 'Better',
        second: 'Select Save.',
      },
    ],
    details: [
      'Use headings, bullets, short paragraphs, white space, and lists.',
      'Use descriptive headings and meaningful link text.',
      'Do not rely on color, direction, or one input method to explain an action.',
    ],
  },
];

function ExampleComparison({ example }: { example: ContentExample }) {
  return (
    <div className="content-example-grid">
      <div className="content-example content-example--avoid">
        <Badge appearance="filled" color="danger" shape="rounded" size="medium">
          {example.firstLabel} example
        </Badge>
        <div className="content-example__body">
          <Text as="p" size={300} foreground={3}>
            {example.first}
          </Text>
        </div>
      </div>
      <div className="content-example content-example--prefer">
        <Badge appearance="filled" color="success" shape="rounded" size="medium">
          {example.secondLabel} example
        </Badge>
        <div className="content-example__body">
          <Text as="p" size={300}>
            {example.second}
          </Text>
        </div>
      </div>
    </div>
  );
}

function PrincipleList() {
  return (
    <Accordion className="content-principle-list" multiple collapsible>
      {principles.map((principle, index) => (
        <AccordionItem className="content-principle" key={principle.title} value={principle.title}>
          <ContentPrincipleConnector />
          <AccordionHeader expandIconPosition="end" size="large" role="heading" aria-level={3}>
            <span className="content-principle__trigger">
              <span className="content-principle__number">{index + 1}</span>
              <span className="content-principle__heading">
                <Text size={400} weight="semibold">
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
              {principle.examples?.map((example, exampleIndex) => (
                <ExampleComparison key={`${principle.title}-${exampleIndex}`} example={example} />
              ))}
              {principle.details ? (
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
                      <li key={detail}>
                        <Text size={300} foreground={3}>
                          {detail}
                        </Text>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function StepList({ steps }: { steps: ContentStep[] }) {
  return (
    <div className="content-flow">
      {steps.map((step) => (
        <div className="content-step" key={step.title}>
          <div className="content-step__content">
            <Text as="h3" weight="semibold">
              {step.title}
            </Text>
            <Text as="p" size={300} foreground={3}>
              {step.description}
            </Text>
            {step.details ? (
              <ul className="content-guidance-list">
                {step.details.map((detail) => (
                  <li key={detail}>
                    <Text size={300} foreground={3}>
                      {detail}
                    </Text>
                  </li>
                ))}
              </ul>
            ) : null}
            {step.link ? (
              <Link href={step.link.href} external>
                {step.link.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </Link>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="content-section__header">
      <Text as="h2" size={500} weight="semibold">
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

function Principles() {
  return (
    <>
      <section className="page-section content-section">
        <PrincipleList />
      </section>
    </>
  );
}

function Process() {
  return (
    <>
      <section id="process-tips" className="page-section content-section content-section--primary">
        <SectionHeader
          title="Process tips"
          description="Move from a realistic first draft to reviewed content in four steps."
        />
        <StepList steps={contentDesignSteps} />
      </section>

      <section id="get-content-help" className="page-section content-section">
        <SectionHeader
          title="Get help"
          description="Start with the lightest support option that fits the work. Reach out earlier rather than later."
        />
        <ContentHelpCards
          items={supportSteps.map(({ title, description, link }) => ({
            title,
            description,
            href: link.href,
          }))}
        />
      </section>
    </>
  );
}

export function Content() {
  return (
    <PageLayout id="content">
      <div className="content-page">
        <Principles />
        <Process />
      </div>
    </PageLayout>
  );
}
