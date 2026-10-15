// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { execFileSync } from 'node:child_process';
import console from 'node:console';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export function validateHostingAuth(docsite, storybook, settings) {
  for (const [name, config] of [['docsite', docsite]]) {
    const auth = config?.properties ?? config;
    if (
      auth?.platform?.enabled !== true ||
      auth?.globalValidation?.requireAuthentication !== true ||
      auth?.identityProviders?.azureActiveDirectory?.enabled !== true ||
      !auth?.identityProviders?.azureActiveDirectory?.registration?.clientId
    ) {
      throw new Error(`${name} must already have Microsoft Entra Easy Auth enabled.`);
    }
  }
  const auth = storybook?.properties ?? storybook;
  if (
    auth?.platform?.enabled !== false ||
    auth?.globalValidation?.requireAuthentication !== false
  ) {
    throw new Error('Storybook must have Easy Auth disabled and permit anonymous access.');
  }
  if (settings.some(({ name }) => /^MCP_(?:ENTRA_|OAUTH_|AUTH_ENABLED$)/.test(name))) {
    throw new Error('Remove retired Storybook MCP authentication app settings before deployment.');
  }
}

function readAzure(args) {
  try {
    return JSON.parse(
      execFileSync('az', [...args, '--output', 'json', '--only-show-errors'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    );
  } catch {
    // Do not surface Azure responses: app settings can contain credentials.
    throw new Error('Cannot read existing Azure hosting configuration; refusing to deploy.');
  }
}

export function main(read = readAzure, env = process.env) {
  const required = [
    'AZURE_SUBSCRIPTION_ID',
    'AZURE_RESOURCE_GROUP',
    'DOCSITE_APP_NAME',
    'STORYBOOK_APP_NAME',
  ];
  for (const name of required) {
    if (!env[name]) throw new Error(`Missing deployment variable: ${name}`);
  }
  const authUrl = (name) =>
    `https://management.azure.com/subscriptions/${encodeURIComponent(env.AZURE_SUBSCRIPTION_ID)}` +
    `/resourceGroups/${encodeURIComponent(env.AZURE_RESOURCE_GROUP)}` +
    `/providers/Microsoft.Web/sites/${encodeURIComponent(name)}` +
    '/config/authsettingsV2?api-version=2024-04-01';
  validateHostingAuth(
    read(['rest', '--method', 'get', '--url', authUrl(env.DOCSITE_APP_NAME)]),
    read(['rest', '--method', 'get', '--url', authUrl(env.STORYBOOK_APP_NAME)]),
    read([
      'webapp',
      'config',
      'appsettings',
      'list',
      '--resource-group',
      env.AZURE_RESOURCE_GROUP,
      '--name',
      env.STORYBOOK_APP_NAME,
    ]),
  );
  console.log('Existing Azure authentication checks passed. Settings will not be changed.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
