// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

using './main.bicep'

param location = 'westus3'
param planName = 'plan-coreai-ds'
// B1 (Basic) gives Always On so the Storybook MCP endpoint stays warm.
param sku = 'B1'
param docsiteAppName = 'coreai-ds'
param storybookAppName = 'coreai-ds-storybook'
// Provided at deploy time by the active CI/CD deployment pipeline.
param docsiteEntraClientId = ''
