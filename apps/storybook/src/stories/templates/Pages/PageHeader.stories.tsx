// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Text } from '@coreai-ds/react-components';
import { MemoryRouter } from 'react-router-dom';
import { PageHeader } from './PageHeader';
import { LinkButton } from '../react-router/LinkButton';
const meta = {
  title: 'Templates/Pages/Page Header',
  component: PageHeader,
  parameters: { layout: 'fullscreen', fullBleed: true },
} satisfies Meta<typeof PageHeader>;
/** Copy-paste template — not an importable component. Copy `templates-pages-page-header--source-code` and dependencies. Use inside Page Layout for responsive header wrapping. @summary Heading, zero-safe count, badge, actions, toolbar, and navigation slots. */
export default meta;
/** A zero count is shown explicitly; badge shape and action destinations belong to the caller. */
export const Default: StoryObj = {
  render: () => (
    <MemoryRouter>
      <PageHeader
        title="Items"
        count={0}
        titleBadge={
          <Badge appearance="tint" shape="rounded" color="informative">
            Draft
          </Badge>
        }
        description={<Text foreground={2}>Main collection</Text>}
        headerActions={
          <LinkButton to="/new" appearance="primary">
            Create item
          </LinkButton>
        }
      />
    </MemoryRouter>
  ),
};
