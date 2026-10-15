// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Consolidated infrastructure for the CoreAI Design System hosted apps.
//
// Provisions ONE Linux App Service Plan shared by two web apps:
//   - coreai-ds            → the static docsite            (https://coreai-ds.azurewebsites.net)
//   - coreai-ds-storybook  → the static Storybook + the
//                            self-hosted Storybook MCP at  /mcp
//
// Both apps run the Node 22 runtime and are gated behind Microsoft Entra
// Easy Auth (single tenant, secretless implicit id_token flow). The Storybook
// app additionally excludes `/mcp` and the OAuth discovery/facade routes from
// Easy Auth so MCP clients reach the Node host's own OAuth flow (which serves
// only read-only component/docs knowledge).
//
// This template supersedes apps/docsite/infra/main.bicep — it is the single
// source of truth for all CoreAI DS Azure hosting and is meant to grow to
// future apps.

@description('Azure region for the App Service plan and web apps')
param location string = 'westus3'

@description('Name of the shared Linux App Service plan')
param planName string = 'plan-coreai-ds'

@description('SKU of the App Service plan. B1 (Basic) enables Always On so the MCP endpoint stays warm.')
param sku string = 'B1'

@description('Name of the docsite App Service')
param docsiteAppName string = 'coreai-ds'

@description('Name of the Storybook + MCP App Service')
param storybookAppName string = 'coreai-ds-storybook'

@description('Entra ID (Microsoft tenant) app registration client ID used for the docsite Easy Auth. Required.')
param docsiteEntraClientId string

var entraIssuerUrl = '${environment().authentication.loginEndpoint}${tenant().tenantId}/v2.0'

// ---------------------------------------------------------------------------
// Shared plan
// ---------------------------------------------------------------------------
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: planName
  location: location
  kind: 'linux'
  sku: {
    name: sku
  }
  properties: {
    reserved: true
  }
}

// ---------------------------------------------------------------------------
// Docsite (static site served by apps/docsite/server.js)
// ---------------------------------------------------------------------------
resource docsiteApp 'Microsoft.Web/sites@2023-12-01' = {
  name: docsiteAppName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|22-lts'
      alwaysOn: sku != 'F1'
      appSettings: [
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'false'
        }
        {
          name: 'WEBSITE_AUTH_AAD_ALLOWED_TENANTS'
          value: tenant().tenantId
        }
      ]
    }
  }
}

resource docsiteAuth 'Microsoft.Web/sites/config@2023-12-01' = {
  parent: docsiteApp
  name: 'authsettingsV2'
  properties: {
    platform: {
      enabled: true
    }
    globalValidation: {
      requireAuthentication: true
      unauthenticatedClientAction: 'RedirectToLoginPage'
      redirectToProvider: 'azureactivedirectory'
      excludedPaths: [
        '/healthz'
      ]
    }
    identityProviders: {
      azureActiveDirectory: {
        enabled: true
        registration: {
          clientId: docsiteEntraClientId
          openIdIssuer: entraIssuerUrl
        }
        login: {
          loginParameters: [
            'response_type=id_token'
          ]
        }
        validation: {
          allowedAudiences: [
            'api://${docsiteEntraClientId}'
            docsiteEntraClientId
          ]
          defaultAuthorizationPolicy: {
            allowedApplications: [
              docsiteEntraClientId
            ]
          }
        }
      }
    }
    login: {
      tokenStore: {
        enabled: false
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Storybook + MCP (static build served by apps/storybook/host/server.mjs,
// which also mounts the self-hosted @storybook/mcp endpoint at /mcp)
// ---------------------------------------------------------------------------
resource storybookApp 'Microsoft.Web/sites@2023-12-01' = {
  name: storybookAppName
  location: location
  kind: 'app,linux'
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|22-lts'
      alwaysOn: sku != 'F1'
      appCommandLine: 'node server.mjs'
      appSettings: [
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'false'
        }
      ]
    }
  }
}

resource storybookAuth 'Microsoft.Web/sites/config@2023-12-01' = {
  parent: storybookApp
  name: 'authsettingsV2'
  properties: {
    platform: {
      enabled: false
    }
    globalValidation: {
      requireAuthentication: false
      unauthenticatedClientAction: 'AllowAnonymous'
    }
  }
}

output docsiteUrl string = 'https://${docsiteApp.properties.defaultHostName}'
output storybookUrl string = 'https://${storybookApp.properties.defaultHostName}'
output mcpUrl string = 'https://${storybookApp.properties.defaultHostName}/mcp'
output storybookAuthEnabled bool = false
output mcpAuthEnabled bool = false
