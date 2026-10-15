// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { TabList } from '@coreai-ds/react-components';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { TabLink } from './TabLink';

/**
 * A CoreAI Tab that navigates with React Router.
 */
export const Default: StoryObj = {
  render: () => (
    <MemoryRouter>
      <TabList selectedValue="/overview">
        <TabLink to="/overview">Overview</TabLink>
      </TabList>
    </MemoryRouter>
  ),
};

/**
 * Copy-paste template — not an importable component. Copy the full source from
 * the `templates-react-router-tab-link--source-code` docs entry.
 *
 * Adapts the CoreAI Tab root to React Router's NavLink component while preserving
 * Tab presentation props and applicable NavLink navigation props.
 *
 * @summary CoreAI Tab adapter for React Router navigation.
 */
const meta: Meta = {
  title: 'Templates/React Router/Tab Link',
  parameters: { layout: 'fullscreen' },
};

export default meta;
