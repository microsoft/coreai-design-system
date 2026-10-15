// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TabLinkList } from './TabLinkList';

/**
 * Route-relative tabs stay selected as navigation changes, including destinations
 * with a query string. Matching follows the pathname, as React Router's NavLink does.
 */
export const Default: StoryObj = {
  render: () => (
    <MemoryRouter initialEntries={['/projects/coreai/overview']}>
      <Routes>
        <Route
          path="/projects/coreai"
          element={
            <TabLinkList
              aria-label="Project sections"
              links={[
                { label: 'Overview', to: 'overview' },
                { label: 'Activity', to: 'activity?view=recent' },
              ]}
            />
          }
        >
          <Route path=":section" element={null} />
        </Route>
      </Routes>
    </MemoryRouter>
  ),
};

const meta: Meta = {
  title: 'Templates/React Router/Tab Link List',
  parameters: { layout: 'fullscreen' },
};

/**
 * Copy-paste template — not an importable component. Copy the full source from
 * the `templates-react-router-tab-link-list--source-code` docs entry.
 *
 * Connects React Router's current location to a CoreAI TabList's selected tab.
 * Each link accepts TabLink props with `label` in place of `children`. Selection
 * supports absolute paths and simple relative destinations such as `profile`,
 * resolved against the current route's base. Use absolute paths for parent-route
 * navigation: this lightweight matcher does not reproduce route-relative `..`
 * traversal. Matching uses matchPath with `end` and `caseSensitive`; query strings
 * and hashes are ignored, and trailing slashes are treated as equivalent.
 *
 * @summary Route-aware CoreAI TabList for React Router navigation.
 */
export default meta;
