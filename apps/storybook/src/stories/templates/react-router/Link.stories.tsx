// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import { Link } from './Link';

/**
 * A CoreAI Link that navigates with React Router.
 */
export const Default: StoryObj = {
  render: () => (
    <MemoryRouter>
      <Link to="/settings">Settings</Link>
    </MemoryRouter>
  ),
};

/**
 * Copy-paste template — not an importable component. Copy the full source from
 * the `templates-react-router-link--source-code` docs entry.
 *
 * Adapts the CoreAI Link root to React Router's Link component.
 *
 * @summary CoreAI Link adapter for React Router navigation.
 */
const meta: Meta = {
  title: 'Templates/React Router/Link',
  parameters: { layout: 'fullscreen' },
};

export default meta;
