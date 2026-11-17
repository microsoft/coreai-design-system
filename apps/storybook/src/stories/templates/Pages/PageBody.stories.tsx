// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from '@coreai-ds/react-components';
import { PageBody } from './PageBody';
const meta = {
  title: 'Templates/Pages/Page Body',
  component: PageBody,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PageBody>;
/** Copy-paste template — not an importable component. Copy `templates-pages-page-body--source-code`. Compose inside Page Layout; use padding="none" when child content owns its insets. @summary Explicit body padding and optional scrolling. */
export default meta;
/** Padded content without an extra page frame or heading. */
export const Default: StoryObj = {
  render: () => (
    <PageBody>
      <Text>All items are up to date.</Text>
    </PageBody>
  ),
};
