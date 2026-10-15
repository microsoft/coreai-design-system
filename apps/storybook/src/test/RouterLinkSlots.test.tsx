// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { CardLink } from '../stories/templates/react-router/CardLink';
import { LinkButton } from '../stories/templates/react-router/LinkButton';
import { TabLinkList } from '../stories/templates/react-router/TabLinkList';
import { useRouterLinkSlot } from '../stories/templates/react-router/RouterLinkSlots';
import { renderCoreAIComponent } from '../../../../packages/react-components/src/test-utils';

afterEach(cleanup);

test('selects route-relative tabs and follows navigation', async () => {
  const screen = await renderCoreAIComponent(
    <MemoryRouter initialEntries={['/settings/profile']}>
      <Routes>
        <Route
          path="/settings"
          element={
            <TabLinkList
              links={[
                { label: 'Profile', to: 'profile' },
                { label: 'Security', to: 'security' },
              ]}
            />
          }
        >
          <Route path=":section" element={null} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  const profile = screen.getByRole('tab', { name: 'Profile' });
  const security = screen.getByRole('tab', { name: 'Security' });
  expect(profile).toHaveAttribute('href', '/settings/profile');
  expect(profile).toHaveAttribute('aria-current', 'page');
  expect(profile).toHaveAttribute('aria-selected', 'true');
  await userEvent.click(security);
  expect(security).toHaveAttribute('aria-current', 'page');
  expect(security).toHaveAttribute('aria-selected', 'true');
  expect(profile).toHaveAttribute('aria-selected', 'false');
});

test.each([
  '/settings?view=profile#details',
  { pathname: '/settings', search: '?view=profile', hash: '#details' },
  '?view=profile',
  '#details',
])('selects query and hash destinations %j', async (to) => {
  const screen = await renderCoreAIComponent(
    <MemoryRouter initialEntries={['/settings?view=profile#details']}>
      <TabLinkList links={[{ label: 'Settings', to }]} />
    </MemoryRouter>,
  );
  const tab = screen.getByRole('tab', { name: 'Settings' });
  expect(tab).toHaveAttribute('aria-current', 'page');
  expect(tab).toHaveAttribute('aria-selected', 'true');
});

test.each([
  {
    pathname: '/settings/profile',
    to: '/settings',
    end: false,
    caseSensitive: false,
    active: true,
  },
  {
    pathname: '/settings/profile',
    to: '/settings',
    end: true,
    caseSensitive: false,
    active: false,
  },
  { pathname: '/settings', to: '/SETTINGS', end: true, caseSensitive: false, active: true },
  { pathname: '/settings', to: '/SETTINGS', end: true, caseSensitive: true, active: false },
  { pathname: '/settings', to: '/', end: false, caseSensitive: false, active: false },
  {
    pathname: '/settings/profile',
    to: '/settings/',
    end: false,
    caseSensitive: false,
    active: true,
  },
])('matches NavLink options %j', async ({ pathname, active, ...linkProps }) => {
  const screen = await renderCoreAIComponent(
    <MemoryRouter initialEntries={[pathname]}>
      <TabLinkList links={[{ label: 'Settings', ...linkProps }]} />
    </MemoryRouter>,
  );
  const tab = screen.getByRole('tab', { name: 'Settings' });
  expect(tab).toHaveAttribute('aria-selected', String(active));
  expect(tab.element().getAttribute('aria-current')).toBe(active ? 'page' : null);
});

test('updates selection when matching links are reordered or removed', async () => {
  const screen = await renderCoreAIComponent(
    <MemoryRouter initialEntries={['/settings']}>
      <TabLinkList
        links={[
          { label: 'Settings', to: '/settings' },
          { label: 'Other', to: '/other' },
        ]}
      />
    </MemoryRouter>,
  );
  await screen.rerender(
    <MemoryRouter initialEntries={['/settings']}>
      <TabLinkList
        links={[
          { label: 'Other', to: '/other' },
          { label: 'Settings', to: '/settings' },
        ]}
      />
    </MemoryRouter>,
  );
  expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: 'Other' })).toHaveAttribute('aria-selected', 'false');
  await screen.rerender(
    <MemoryRouter initialEntries={['/settings']}>
      <TabLinkList links={[{ label: 'Other', to: '/other' }]} />
    </MemoryRouter>,
  );
  expect(screen.getByRole('tab', { name: 'Other' })).toHaveAttribute('aria-selected', 'false');
});

test('disabled elevated router tabs retain their colors on hover', async () => {
  const screen = await renderCoreAIComponent(
    <MemoryRouter>
      <button>Outside tabs</button>
      <TabLinkList
        appearance="elevated"
        links={[
          { label: 'Disabled', to: '/disabled', disabled: true },
          { label: 'Enabled', to: '/enabled' },
        ]}
      />
    </MemoryRouter>,
  );
  const disabled = screen.getByRole('tab', { name: 'Disabled' });
  const enabled = screen.getByRole('tab', { name: 'Enabled' });
  await userEvent.hover(screen.getByRole('button', { name: 'Outside tabs' }));
  const background = getComputedStyle(disabled.element()).backgroundColor;
  const foreground = getComputedStyle(disabled.element()).color;
  const enabledBackground = getComputedStyle(enabled.element()).backgroundColor;

  expect(disabled).toHaveAttribute('aria-disabled', 'true');
  expect(disabled).not.toHaveAttribute('disabled');
  await userEvent.hover(disabled);
  expect(getComputedStyle(disabled.element()).backgroundColor).toBe(background);
  expect(getComputedStyle(disabled.element()).color).toBe(foreground);

  await userEvent.hover(enabled);
  expect(getComputedStyle(enabled.element()).backgroundColor).not.toBe(enabledBackground);
});

function LocationReadout() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

test('exposes CardLink as a link and preserves explicit roles', async () => {
  const ref = React.createRef<HTMLAnchorElement>();
  const screen = await renderCoreAIComponent(
    <MemoryRouter>
      <CardLink ref={ref} to="/settings">
        Settings
      </CardLink>
    </MemoryRouter>,
  );
  const link = screen.getByRole('link', { name: 'Settings' }).element();

  expect(link.tagName).toBe('A');
  expect(link).toHaveAttribute('href', '/settings');
  expect(ref.current).toBe(link);

  await screen.rerender(
    <MemoryRouter>
      <CardLink role="menuitem" to="/settings">
        Settings
      </CardLink>
    </MemoryRouter>,
  );

  expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveAttribute('href', '/settings');
});

test.each([
  { disabled: true },
  { 'aria-disabled': true as const },
  { 'aria-disabled': 'true' as const },
])('prevents disabled CardLink activation for %j', async (disabledProps) => {
  const onClick = vi.fn();
  const screen = await renderCoreAIComponent(
    <MemoryRouter>
      <CardLink
        {...disabledProps}
        focusMode="off"
        to="/settings"
        onClick={onClick}
        data-testid="card"
      >
        Settings
      </CardLink>
      <LocationReadout />
    </MemoryRouter>,
  );
  const card = screen.getByTestId('card').element() as HTMLAnchorElement;
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });

  card.dispatchEvent(event);

  expect(event.defaultPrevented).toBe(true);
  expect(onClick).not.toHaveBeenCalled();
  expect(card).toHaveAttribute('aria-disabled', 'true');
  expect(card).toHaveAttribute('tabindex', '-1');
  card.focus();
  await userEvent.keyboard('{Enter}');
  expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
  expect(onClick).not.toHaveBeenCalled();
});

test('skips a disabled CardLink during keyboard navigation', async () => {
  const screen = await renderCoreAIComponent(
    <MemoryRouter>
      <button>Before</button>
      <CardLink disabled to="/settings">
        Settings
      </CardLink>
      <button>After</button>
    </MemoryRouter>,
  );

  screen.getByRole('button', { name: 'Before' }).element().focus();
  await userEvent.tab();

  expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
});

test('preserves explicit tabIndex without enabling a disabled CardLink', async () => {
  const screen = await renderCoreAIComponent(
    <MemoryRouter>
      <button>Before</button>
      <CardLink disabled tabIndex={0} to="/settings" data-testid="card">
        Settings
      </CardLink>
      <LocationReadout />
    </MemoryRouter>,
  );

  screen.getByRole('button', { name: 'Before' }).element().focus();
  await userEvent.tab();
  expect(screen.getByTestId('card')).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
});

test('preserves enabled CardLink navigation and click handlers', async () => {
  const onClick = vi.fn();
  const screen = await renderCoreAIComponent(
    <MemoryRouter>
      <CardLink aria-disabled="false" to="/settings" onClick={onClick} data-testid="card">
        Settings
      </CardLink>
      <LocationReadout />
    </MemoryRouter>,
  );

  await userEvent.click(screen.getByTestId('card'));

  expect(onClick).toHaveBeenCalledOnce();
  expect(screen.getByTestId('location')).toHaveTextContent('/settings');
});

test('keeps disabledFocusable LinkButtons focusable without navigating', async () => {
  const onClick = vi.fn();
  const screen = await renderCoreAIComponent(
    <MemoryRouter>
      <button>Before</button>
      <LinkButton disabledFocusable to="/settings" onClick={onClick} data-testid="link">
        Settings
      </LinkButton>
      <LocationReadout />
    </MemoryRouter>,
  );

  screen.getByRole('button', { name: 'Before' }).element().focus();
  await userEvent.tab();
  expect(screen.getByTestId('link')).toHaveFocus();
  expect(screen.getByTestId('link')).toHaveAttribute('aria-disabled', 'true');
  await userEvent.keyboard('{Enter}');
  expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/);
  expect(onClick).not.toHaveBeenCalled();
});

test('handles a native disabled prop on the resolved slot root', async () => {
  const onClick = vi.fn();
  function DisabledRoot() {
    const [Root] = useRouterLinkSlot({ to: '/settings' });
    return (
      <Root disabled onClick={onClick} data-testid="link">
        Settings
      </Root>
    );
  }
  const screen = await renderCoreAIComponent(
    <MemoryRouter>
      <DisabledRoot />
    </MemoryRouter>,
  );
  const link = screen.getByTestId('link').element();
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });

  link.dispatchEvent(event);

  expect(event.defaultPrevented).toBe(true);
  expect(onClick).not.toHaveBeenCalled();
  expect(link).toHaveAttribute('aria-disabled', 'true');
  expect(link).toHaveAttribute('tabindex', '-1');
  expect(link).not.toHaveAttribute('disabled');
});
