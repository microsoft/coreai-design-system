// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const repo = 'https://github.com/microsoft/coreai-design-system';
const docsite = 'https://microsoft.github.io/coreai-design-system/';
const storybook = 'http://localhost:6006/';

export const siteLinks = {
  docsite,
  repo,
  storybook,
  storybookDocs: {
    variationsFromFluent: `${docsite}guides/VariationsFromFluent/`,
    theming: `${docsite}foundations/Theming/`,
    agentSkill: `${docsite}guides/PackageSkill/`,
    mcpSetup: `${docsite}guides/UseWithAgents/`,
  },
  mcp: `${storybook}mcp`,
  packageReadme: `${repo}/blob/main/packages/react-components/README.md`,
  changelog: `${repo}/blob/main/packages/react-components/CHANGELOG.md`,
  npmPackage: 'https://www.npmjs.com/package/@coreai-ds/react-components',
  figma: 'https://www.figma.com/design/eXfSQrRg3poHRgmr0ivN5V/CoreAI-DS?node-id=0-1',
  contact: `${repo}/issues`,
  feedback: `${repo}/issues/new`,
  fontDownload: 'https://www.microsoft.com/en-us/download/details.aspx?id=106087',
} as const;
