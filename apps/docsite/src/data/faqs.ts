// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { siteLinks } from './content';

export interface FaqLink {
  label: string;
  href: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string[];
  sources: FaqLink[];
  links?: FaqLink[];
}

export interface FaqGroup {
  id: string;
  title: string;
  items: FaqItem[];
}

const sources = {
  variations: {
    label: 'Variations from Fluent',
    href: siteLinks.storybookDocs.variationsFromFluent,
  },
  theming: {
    label: 'Theming',
    href: siteLinks.storybookDocs.theming,
  },
  skill: {
    label: 'Agent skill',
    href: siteLinks.storybookDocs.agentSkill,
  },
  mcp: {
    label: 'MCP setup',
    href: siteLinks.storybookDocs.mcpSetup,
  },
  package: {
    label: 'Package README',
    href: siteLinks.packageReadme,
  },
  history: {
    label: 'CoreAI repository README',
    href: `${siteLinks.repo}/blob/main/README.md`,
  },
  tiers: {
    label: 'Background: components, templates, and samples',
    href: 'https://mini-foundry.azurewebsites.net/jabradford/mini-foundry-history-slides/slides/core-ai/2',
  },
  designIntent: {
    label: 'History: design intent, slide 13 notes',
    href: 'https://www.figma.com/slides/Lyb3shKi3jWCYjxajCRqmt/History?node-id=12-7595',
  },
  contribution: {
    label: 'Contributing guide',
    href: `${siteLinks.repo}/blob/main/CONTRIBUTING.md`,
  },
  storybook: {
    label: 'Storybook',
    href: siteLinks.storybook,
  },
};

export const faqGroups: FaqGroup[] = [
  {
    id: 'about-coreai',
    title: 'About CoreAI',
    items: [
      {
        id: 'coreai-and-fluent',
        question: 'How is CoreAI different from Fluent?',
        answer: [
          'CoreAI builds on Fluent UI v9. It adds a shared visual language, themes, and component defaults, such as circular buttons and filled cards. Components without CoreAI changes pass through from Fluent.',
          'Use the Variations from Fluent guide to check differences before copying a Fluent example.',
        ],
        sources: [sources.variations, sources.designIntent],
        links: [sources.variations],
      },
      {
        id: 'why-a-shared-package',
        question: 'Why does CoreAI have a shared design system?',
        answer: [
          'CoreAI gives teams one Fluent UI v9 design system for shared components, themes, guidance, and tools. This helps apps stay consistent without each team maintaining its own version of the same patterns.',
        ],
        sources: [sources.history],
      },
      {
        id: 'components-templates-samples',
        question: 'What is the difference between components, templates, and samples?',
        answer: [
          'Components are reusable controls maintained in the npm package.',
          'Templates are larger starting points that you copy into your project and maintain yourself. They are not package imports.',
          'Samples show how components work together in a form, layout, or workflow.',
        ],
        sources: [sources.skill, sources.tiers],
      },
    ],
  },
  {
    id: 'getting-started',
    title: 'Getting started',
    items: [
      {
        id: 'package-access',
        question: 'How do I install the npm package?',
        answer: [
          'Install @coreai-ds/react-components from npm, then follow the package README for provider, font, and usage guidance.',
        ],
        sources: [sources.package],
        links: [{ label: 'View the npm package', href: siteLinks.npmPackage }, sources.package],
      },
      {
        id: 'coreai-appearance',
        question: 'Why does my app still look like stock Fluent?',
        answer: [
          'Import components from @coreai-ds/react-components instead of @fluentui/react-components, then wrap the app in CoreAIFluentProvider. Icons can still come from @fluentui/react-icons.',
          'Check that withComponentDefaults has not been set to false. The optional fonts.css import only registers Aptos fonts already installed on the device. The theming guide covers the provider, fonts, and defaults.',
        ],
        sources: [sources.theming, sources.skill],
        links: [sources.theming],
      },
    ],
  },
  {
    id: 'using-components',
    title: 'Using components',
    items: [
      {
        id: 'figma-and-code-availability',
        question: 'Does a Figma preview mean the component is available in code?',
        answer: [
          'No. Some pages show a Figma preview because a code component is not available. Check the component documentation and page resources before assuming it is part of the package.',
        ],
        sources: [sources.skill],
      },
      {
        id: 'light-dark-and-brand',
        question: 'Can I change the theme or customize a component?',
        answer: [
          'Yes. CoreAI supports light and dark themes, Azure themes, and custom brand colors through its theme factories.',
          'For individual components, start with documented props and design tokens. Preserve the existing behavior and accessibility. The theming guide covers theme setup.',
        ],
        sources: [sources.theming, sources.skill],
        links: [sources.theming],
      },
    ],
  },
  {
    id: 'working-with-agents',
    title: 'Working with agents',
    items: [
      {
        id: 'package-skill-and-mcp',
        question: 'What does my coding agent need to use CoreAI?',
        answer: [
          'CoreAI agent setup requires the package, its installed agent skill, and the CoreAI documentation MCP server.',
          'The CoreAI MCP combines selected Fluent stories with CoreAI stories and overrides. Report missing documentation rather than guessing APIs. Follow the agent skill and MCP setup guides.',
        ],
        sources: [sources.package, sources.skill, sources.mcp],
        links: [sources.skill, sources.mcp],
      },
      {
        id: 'copy-guidance-for-agent',
        question: 'How can I give my agent the guidance on a component page?',
        answer: [
          'On the component page, select Copy for LLM, then Copy page as Markdown. Paste it into your agent conversation to point it at specific guidance. This supplements the installed skill and connected documentation servers.',
        ],
        sources: [sources.skill],
      },
      {
        id: 'mcp-sign-in',
        question: 'What if the documentation server will not connect?',
        answer: [
          'Check the endpoint URL and your network connection against the MCP setup guide.',
          'If the server is unavailable, have your agent use the installed package README, changelog, and skill, and state that it cannot access live docs. Report persistent connection problems through GitHub issues.',
        ],
        sources: [sources.mcp, sources.skill],
        links: [sources.mcp],
      },
    ],
  },
  {
    id: 'help-and-feedback',
    title: 'Help and feedback',
    items: [
      {
        id: 'missing-component-or-prop',
        question: 'How do I give feedback or contribute?',
        answer: [
          'Use GitHub Issues to report a bug, request a component or pattern, or ask a usage question. Search existing issues first, then include what you need and a small example.',
          'Contributions can include guidance and design ideas as well as code. Do not report security vulnerabilities through a public issue; follow the private instructions in SECURITY.md.',
        ],
        sources: [sources.contribution, sources.skill],
        links: [
          { label: 'Open a GitHub issue', href: siteLinks.feedback },
          { label: 'Browse GitHub issues', href: siteLinks.contact },
        ],
      },
    ],
  },
];
