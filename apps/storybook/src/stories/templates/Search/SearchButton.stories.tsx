// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { SearchButton } from './SearchButton';
import { SearchDialog } from './SearchDialog';
const meta = {
  title: 'Templates/Search/Search Button',
  component: SearchButton,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SearchButton>;
/** Copy-paste template — not an importable component. Copy `templates-search-search-button--source-code`; pair with Search Dialog. @summary Minimal accessible global-search trigger for Top Nav. */
export default meta;
/** Caller-controlled dialog with explicit focus return to its trigger. */
export const Default: StoryObj = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const trigger = React.useRef<HTMLButtonElement>(null);
    return (
      <>
        <SearchButton ref={trigger} onClick={() => setOpen(true)} />
        <SearchDialog
          open={open}
          onOpenChange={setOpen}
          query={query}
          onQueryChange={setQuery}
          returnFocusRef={trigger}
        />
      </>
    );
  },
};
