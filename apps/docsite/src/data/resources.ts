// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Chat24Regular,
  DocumentText24Regular,
  History24Regular,
  TextFont24Regular,
} from '@fluentui/react-icons';
import { FigmaLogo, NpmLogo, StorybookLogo } from '../components/Icons';
import { siteLinks } from './content';

export const resourceGroups = [
  {
    id: 'assets',
    title: 'Assets',
    resources: [
      {
        id: 'figma',
        title: 'Figma library',
        description: 'CoreAI components and templates for your designs.',
        destination: 'Figma',
        href: siteLinks.figma,
        icon: FigmaLogo,
      },
      {
        id: 'storybook',
        title: 'Storybook',
        description: 'Explore components, their states, and working examples.',
        destination: 'Storybook',
        href: siteLinks.storybook,
        icon: StorybookLogo,
      },
      {
        id: 'fonts',
        title: 'Aptos fonts',
        description: 'Download the Aptos Sans and Aptos Mono typefaces.',
        destination: 'Microsoft Download Center',
        href: siteLinks.fontDownload,
        icon: TextFont24Regular,
      },
    ],
  },
  {
    id: 'code',
    title: 'Code',
    resources: [
      {
        id: 'package-readme',
        title: 'Package README',
        description: 'Set up the package and find API and extension guidance.',
        destination: 'GitHub',
        href: siteLinks.packageReadme,
        icon: DocumentText24Regular,
      },
      {
        id: 'npm-package',
        title: 'npm package',
        description: 'Install the React components from npm.',
        destination: 'npm',
        href: siteLinks.npmPackage,
        icon: NpmLogo,
      },
      {
        id: 'changelog',
        title: 'Changelog',
        description: 'See the package version history.',
        destination: 'GitHub',
        href: siteLinks.changelog,
        icon: History24Regular,
      },
    ],
  },
  {
    id: 'connect',
    title: 'Connect',
    resources: [
      {
        id: 'repository',
        title: 'GitHub repository',
        description: 'Browse the source, pull requests, and GitHub Actions.',
        destination: 'GitHub',
        href: siteLinks.repo,
        icon: DocumentText24Regular,
      },
      {
        id: 'issues',
        title: 'Issues and support',
        description: 'Ask usage questions and review bugs or feature requests.',
        destination: 'GitHub',
        href: siteLinks.contact,
        icon: Chat24Regular,
      },
      {
        id: 'feedback',
        title: 'Open an issue',
        description: 'Report a bug or request a feature.',
        destination: 'GitHub',
        href: siteLinks.feedback,
        icon: Chat24Regular,
      },
    ],
  },
];
