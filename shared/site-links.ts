// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const repo = 'https://github.com/microsoft/coreai-design-system';
const storybook = 'https://coreai-ds-storybook.azurewebsites.net/';

export const siteLinks = {
  docsite: 'https://coreai-ds.azurewebsites.net/',
  repo,
  storybook,
  storybookDocs: {
    variationsFromFluent: `${storybook}?path=/docs/docs-variations-from-fluent--docs`,
    theming: `${storybook}?path=/docs/docs-theming--docs`,
    agentSkill: `${storybook}?path=/docs/docs-agent-skill--docs`,
    mcpSetup: `${storybook}?path=/docs/docs-mcp-setup--docs`,
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
