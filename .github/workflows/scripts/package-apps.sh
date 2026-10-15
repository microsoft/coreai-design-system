#!/usr/bin/env bash
# Copyright (c) Microsoft Corporation.
# Licensed under the MIT license.

set -euo pipefail

# Keep the same ZIP roots and npm start entry points as the Azure-hosted apps.
stage=".deployment"
mkdir -p "$stage/docsite/dist" "$stage/storybook/storybook-static"
cp -R apps/docsite/dist/. "$stage/docsite/dist/"
cp apps/docsite/package.json apps/docsite/server.js "$stage/docsite/"
cp -R apps/storybook/storybook-static/. "$stage/storybook/storybook-static/"
cp apps/storybook/host/server.mjs \
  apps/storybook/host/package.json "$stage/storybook/"
(
  cd "$stage/storybook"
  npm install --omit=dev --no-audit --no-fund
  zip -qr ../deploy-storybook.zip .
)
(cd "$stage/docsite" && zip -qr ../deploy-docsite.zip .)
