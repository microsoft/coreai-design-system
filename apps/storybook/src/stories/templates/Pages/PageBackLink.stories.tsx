// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PageBackLink } from './PageBackLink';
import { Link } from '../react-router/Link';
const meta = {
  title: 'Templates/Pages/Page Back Link',
  component: PageBackLink,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PageBackLink>;
/** Copy-paste template — not an importable component. Copy `templates-pages-page-back-link--source-code` and its Router Link Button dependency. @summary Router-aware icon-only back destination. */
export default meta;
/** Back navigation stays within a router basename, and the destination links back to the detail page. */
export const Default: StoryObj = {
  render: () => (
    <MemoryRouter basename="/app" initialEntries={['/app/items/detail']}>
      <Routes>
        <Route path="items" element={<Link to="detail">Open item</Link>} />
        <Route path="items/detail" element={<PageBackLink to="/items" label="Back to items" />} />
      </Routes>
    </MemoryRouter>
  ),
};
