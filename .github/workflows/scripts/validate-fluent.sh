#!/usr/bin/env bash
# Copyright (c) Microsoft Corporation.
# Licensed under the MIT license.

set -euo pipefail
npm --workspace packages/react-components run type-check
npm --workspace packages/react-components run build
npm --workspace packages/react-components test
npm --workspace packages/react-components run test:tree-shaking
