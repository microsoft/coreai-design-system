// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import {
  Badge,
  Button,
  Dropdown,
  Field,
  Menu,
  MenuButton,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Option,
  Text,
} from '@coreai-ds/react-components';
import { ArrowExit20Regular, ChevronUpDownRegular } from '@fluentui/react-icons';
import { MemoryRouter } from 'react-router-dom';
import { TopNav } from './TopNav';
import { ProfileButton } from './ProfileButton';
import { MobileLeftNav } from './MobileLeftNav';
import { LayoutContainer } from '../Pages/LayoutContainer';
import { SearchButton } from '../Search/SearchButton';
import { SearchDialog } from '../Search/SearchDialog';
const meta = {
  title: 'Templates/App Shell/Top Nav',
  component: TopNav,
  parameters: { layout: 'fullscreen', fullBleed: true },
} satisfies Meta<typeof TopNav>;
/** Copy-paste template — not an importable component. Copy `templates-app-shell-top-nav--source-code` and dependencies. App Shell connects this to Left Nav and Mobile Left Nav. @summary Brand, route-backed top tabs, and optional search/profile/action slots. */
export default meta;
/** Shared navigation configuration appears as tabs on desktop and in the mobile drawer. */
export const Default: StoryObj = {
  render: () => {
    const [workspace, setWorkspace] = React.useState('Main workspace');
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState('');
    const trigger = React.useRef<HTMLButtonElement>(null);
    const items = [
      { to: '/overview', label: 'Overview' },
      { to: '/items', label: 'Items' },
    ];
    const styles = /* css */ `.top-nav-example { background: var(--colorNeutralBackground4); } .top-nav-example__switcher { min-width: 0; padding: 0; background: transparent; } .top-nav-example__switcher:hover { background: transparent; } .top-nav-example__search { width: 200px; justify-content: flex-start; text-align: left; } .top-nav-example__profile-field { display: flex; flex-direction: column; } .top-nav-example__sign-out { display: flex; justify-content: flex-start; gap: var(--spacingHorizontalXS); padding: var(--spacingVerticalSNudge) var(--spacingHorizontalXS); }`;
    const search = <SearchButton ref={trigger} onClick={() => setOpen(true)} />;
    return (
      <>
        <style>{styles}</style>
        <MemoryRouter initialEntries={['/overview']}>
          <LayoutContainer className="top-nav-example">
            <TopNav
              brand="Example App"
              brandBadge={
                <Badge appearance="outline" shape="rounded" color="informative" size="small">
                  Preview
                </Badge>
              }
              contextSwitcher={
                <Menu
                  checkedValues={{ workspace: [workspace] }}
                  onCheckedValueChange={(_, data) =>
                    setWorkspace(data.checkedItems[0] ?? workspace)
                  }
                >
                  <MenuTrigger disableButtonEnhancement>
                    <MenuButton
                      appearance="subtle"
                      className="top-nav-example__switcher"
                      menuIcon={<ChevronUpDownRegular />}
                    >
                      {workspace}
                    </MenuButton>
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      {['Main workspace', 'Shared workspace'].map((name) => (
                        <MenuItemRadio key={name} name="workspace" value={name}>
                          {name}
                        </MenuItemRadio>
                      ))}
                    </MenuList>
                  </MenuPopover>
                </Menu>
              }
              homeTo="/overview"
              topItems={items}
              search={search}
              wideSearch={
                <SearchButton
                  ref={trigger}
                  appearance="secondary"
                  className="top-nav-example__search"
                  onClick={() => setOpen(true)}
                >
                  <Text preset="body" foreground={3}>
                    Search
                  </Text>
                </SearchButton>
              }
              profile={
                <ProfileButton
                  name="Alex Morgan"
                  secondaryText="alex@example.com"
                  footer={
                    <Button
                      appearance="transparent"
                      className="top-nav-example__sign-out"
                      icon={<ArrowExit20Regular />}
                    >
                      Sign out
                    </Button>
                  }
                >
                  <Field label="Theme" className="top-nav-example__profile-field">
                    <Dropdown placeholder="Select theme">
                      <Option>Light</Option>
                      <Option>Dark</Option>
                    </Dropdown>
                  </Field>
                </ProfileButton>
              }
              mobileNavigation={<MobileLeftNav items={items} topItems={items} actions={search} />}
            />
            <SearchDialog
              open={open}
              onOpenChange={setOpen}
              query={query}
              onQueryChange={setQuery}
              returnFocusRef={trigger}
            />
          </LayoutContainer>
        </MemoryRouter>
      </>
    );
  },
};
