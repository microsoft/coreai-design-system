// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Storybook story file for the Filterable List template.
 * The component and all its code live in FilterableList.tsx.
 * This file owns Storybook meta and story objects. The full source is shown
 * to humans and agents via the auto-generated FilterableList.mdx (see
 * scripts/generate-template-docs.mjs — do not hand-author that file).
 *
 * Stories:
 *   Default — toolbar (search + filter dropdowns) above a sortable, paginated DataGrid
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilterableList } from './FilterableList';

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * A browse page with a sticky toolbar (search + multi-select filter dropdowns)
 * above a sortable, single-select DataGrid.
 *
 * @summary Toolbar (search + filter Dropdowns) above a sortable, paginated DataGrid.
 */
export const Default: StoryObj = {
  name: 'Filterable List',
  render: () => <FilterableList />,
};

// ─── Storybook meta ───────────────────────────────────────────────────────────

/**
 * Copy-paste template — not an importable component. Copy the full source from
 * the `templates-filterable-list--source-code` docs entry.
 *
 * Toolbar (search + filter dropdowns) above a sortable, single-select DataGrid.
 *
 * @summary Toolbar (search + filter Dropdowns) above a sortable, paginated DataGrid.
 */
const meta: Meta = {
  title: 'Templates/Filterable List',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
