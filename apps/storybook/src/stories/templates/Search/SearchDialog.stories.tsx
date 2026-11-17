// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Text } from '@coreai-ds/react-components';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { Link } from '../react-router/Link';
import { SearchButton } from './SearchButton';
import { SearchDialog } from './SearchDialog';
const meta = {
  title: 'Templates/Search/Search Dialog',
  component: SearchDialog,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SearchDialog>;
/** Copy-paste template — not an importable component. Copy `templates-search-search-dialog--source-code`. Search Button opens this controlled surface; caller-provided children supply results. @summary Minimal query dialog with result slot, accessible title, and focus return. */
export default meta;
/** Local results navigate through the existing React Router Link template. */
export const Default: StoryObj = {
  render: () => {
    function SearchExample() {
      const [open, setOpen] = React.useState(false);
      const [query, setQuery] = React.useState('');
      const trigger = React.useRef<HTMLButtonElement>(null);
      const location = useLocation();
      const results = [
        { name: 'Overview', to: '/overview' },
        { name: 'Items', to: '/items' },
      ].filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));
      return (
        <>
          <SearchButton ref={trigger} onClick={() => setOpen(true)}>
            Search
          </SearchButton>
          <Text as="p">{location.pathname === '/items' ? 'Items' : 'Overview'}</Text>
          <SearchDialog
            open={open}
            onOpenChange={setOpen}
            query={query}
            onQueryChange={setQuery}
            returnFocusRef={trigger}
          >
            {results.length ? (
              results.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setOpen(false)}>
                  {item.name}
                </Link>
              ))
            ) : (
              <Text role="status">No results found.</Text>
            )}
          </SearchDialog>
        </>
      );
    }
    return (
      <MemoryRouter initialEntries={['/overview']}>
        <SearchExample />
      </MemoryRouter>
    );
  },
};
