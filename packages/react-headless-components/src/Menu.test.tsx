// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import * as primitive from '@fluentui/react-headless-components-preview/menu';
import { Checkmark16Filled } from '@fluentui/react-icons/headless/svg/checkmark';
import { CircleFilled } from '@fluentui/react-icons/headless/svg/circle';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import type { PositioningImperativeRef } from '@fluentui/react-headless-components-preview/positioning';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { ComparisonProvider as CoreAIFluentProvider } from '../../../apps/storybook/src/stories/experiments/ComparisonProvider.js';
import {
  MenuComparison,
  menuConsumerExample,
  menuExamples,
  type MenuExample,
} from '../../../apps/storybook/src/stories/experiments/MenuComparison.js';
import { MenuComparisonWithReport } from '../../../apps/storybook/src/stories/experiments/MenuComparisonReport.js';
import { FocusgroupConsumer as MenuFocusgroupConsumer } from '../../../apps/storybook/src/stories/experiments/FocusgroupConsumer.js';
import {
  MenuContextFlow,
  MenuFormFlow,
  MenuSelectionFlow,
  MenuSplitFlow,
  MenuSubmenuFlow,
} from '../../../apps/storybook/src/stories/experiments/MenuFlows.js';
import {
  captureMenuStyles,
  compareMenuStyles,
  getComparisonMenu,
  getComparisonMenuTrigger,
  refreshMenuComparisonPositioning,
  requireMenuHTML,
  settleMenuStyles,
} from '../../../apps/storybook/src/stories/experiments/compareMenuStyles.js';
import { Menu, useMenuContext, useMenuContextValues, type MenuProps } from './Menu.js';
import { MenuTrigger, type MenuTriggerProps } from './MenuTrigger.js';
import {
  MenuPopover,
  menuPopoverClassNames,
  type MenuPopoverProps,
  type MenuPopoverSlots,
} from './MenuPopover.js';
import {
  MenuList,
  menuListClassNames,
  useMenuListContextValues,
  type MenuListProps,
} from './MenuList.js';
import {
  MenuItem,
  menuItemClassNames,
  type MenuItemProps,
  type MenuItemSlots,
} from './MenuItem.js';
import {
  MenuItemCheckbox,
  menuItemCheckboxClassNames,
  type MenuItemCheckboxProps,
} from './MenuItemCheckbox.js';
import {
  MenuItemRadio,
  menuItemRadioClassNames,
  type MenuItemRadioProps,
} from './MenuItemRadio.js';
import { MenuItemLink, menuItemLinkClassNames, type MenuItemLinkProps } from './MenuItemLink.js';
import {
  MenuItemSwitch,
  menuItemSwitchClassNames,
  type MenuItemSwitchProps,
  type MenuItemSwitchSlots,
} from './MenuItemSwitch.js';
import { MenuDivider, menuDividerClassNames, type MenuDividerProps } from './MenuDivider.js';
import {
  MenuGroup,
  menuGroupClassNames,
  useMenuGroupContextValues,
  type MenuGroupProps,
} from './MenuGroup.js';
import {
  MenuGroupHeader,
  menuGroupHeaderClassNames,
  type MenuGroupHeaderProps,
} from './MenuGroupHeader.js';
import {
  MenuSplitGroup,
  menuSplitGroupClassNames,
  useMenuSplitGroupContextValues,
  type MenuSplitGroupProps,
} from './MenuSplitGroup.js';
import { MenuButton } from './MenuButton.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

function html(locator: { element(): Element }): HTMLElement {
  return requireMenuHTML(locator.element());
}

function surface(container: ParentNode, testId: string): HTMLElement {
  const element = container.querySelector(`[data-testid="${testId}"]`);
  if (!(element instanceof HTMLElement)) throw new Error(`Missing Menu fixture ${testId}`);
  return element;
}

async function expectClosed(element: HTMLElement) {
  await expect.poll(() => element.matches(':popover-open')).toBe(false);
  expect(getComputedStyle(element).display).toBe('none');
  expect(element.getBoundingClientRect().width).toBe(0);
  expect(element.getBoundingClientRect().height).toBe(0);
}

async function renderPair(
  example: MenuExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const legacyPositioning = React.createRef<PositioningImperativeRef>();
  const headlessPositioning = React.createRef<PositioningImperativeRef>();
  const screen = await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <MenuFocusgroupConsumer>
        <MenuComparison
          example={example}
          legacyPositioningRef={legacyPositioning}
          headlessPositioningRef={headlessPositioning}
        />
      </MenuFocusgroupConsumer>
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('Current CoreAI / Griffel', { exact: true }));
  const legacy = getComparisonMenu(screen.container, 'legacy');
  const headless = getComparisonMenu(screen.container, 'headless');
  await expect.poll(() => headless.matches(':popover-open')).toBe(true);
  await settleMenuStyles(legacy, headless);
  if (!legacyPositioning.current || !headlessPositioning.current) {
    throw new Error('Missing Menu fixture positioning handles');
  }
  await refreshMenuComparisonPositioning(
    legacy,
    getComparisonMenuTrigger(screen.container, 'legacy'),
    headless,
    getComparisonMenuTrigger(screen.container, 'headless'),
    legacyPositioning.current,
    headlessPositioning.current,
  );
  return {
    screen,
    legacy,
    headless,
    differences: () => compareMenuStyles(captureMenuStyles(legacy), captureMenuStyles(headless)),
  };
}

for (const [themeName, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  for (const example of menuExamples) {
    test(`${themeName}: ${example.name} preserves selected Menu-family styles and exact geometry`, async () => {
      const pair = await renderPair(example, theme);
      expect(pair.differences()).toEqual([]);
    });
  }
}

for (const name of ['Default', 'Switch indicator', 'Split actions']) {
  test(`RTL ${name} retains logical spacing, glyphs, and exact inherited item geometry`, async () => {
    const example = menuExamples.find((candidate) => candidate.name === name);
    if (!example) throw new Error('Missing RTL Menu fixture');
    const pair = await renderPair(example, coreaiLightTheme, true, 'rtl');
    expect(pair.differences()).toEqual([]);
  });
}

test('defaults opt-out removes only the CoreAI surface border and retains the Fluent Menu contract', async () => {
  const pair = await renderPair(menuExamples[0], coreaiLightTheme, false);
  expect(pair.differences()).toEqual([]);
  expect(pair.headless.hasAttribute('data-coreai-defaults')).toBe(false);
  expect(getComputedStyle(pair.headless).borderTopWidth).toBe('1px');
  expect(getComputedStyle(pair.headless).borderTopColor).toBe('rgba(0, 0, 0, 0)');
});

test('ordinary consumer CSS overrides the Menu surface, item, icon, and header foundation', async () => {
  const pair = await renderPair(menuConsumerExample);
  expect(getComputedStyle(pair.headless).borderTopWidth).toBe('3px');
  expect(getComputedStyle(pair.headless).borderRadius).toBe('3px');
  expect(getComputedStyle(pair.headless).paddingTop).toBe('8px');
  const item = pair.headless.querySelector('[data-menu-part="item"]');
  const icon = pair.headless.querySelector('[data-menu-part="icon"]');
  const header = pair.headless.querySelector('[data-menu-part="header"]');
  if (!item || !icon || !header) throw new Error('Missing consumer Menu slots');
  expect(getComputedStyle(item).minHeight).toBe('40px');
  expect(getComputedStyle(item).borderRadius).toBe('2px');
  expect(getComputedStyle(icon).width).toBe('16px');
  expect(getComputedStyle(icon).height).toBe('16px');
  expect(getComputedStyle(icon).fontSize).toBe('16px');
  expect(getComputedStyle(header).fontWeight).toBe(
    getComputedStyle(header).getPropertyValue('--fontWeightRegular').trim(),
  );
});

for (const name of ['Default', 'Disabled items']) {
  test(`${name}: pointer hover retains item, icon, subtext, and shortcut interaction priority`, async () => {
    const example = menuExamples.find((candidate) => candidate.name === name);
    if (!example) throw new Error('Missing hover Menu fixture');
    const pair = await renderPair(example);
    const oldItem = pair.legacy.querySelector('[data-menu-part="item"]');
    const newItem = pair.headless.querySelector('[data-menu-part="item"]');
    if (!oldItem || !newItem) throw new Error('Missing hover MenuItem');
    await userEvent.hover(oldItem);
    await settleMenuStyles(oldItem);
    expect(oldItem.matches(':hover')).toBe(true);
    const oldSnapshot = captureMenuStyles(pair.legacy);
    await userEvent.hover(newItem);
    await settleMenuStyles(newItem);
    expect(oldItem.matches(':hover')).toBe(false);
    expect(newItem.matches(':hover')).toBe(true);
    expect(compareMenuStyles(oldSnapshot, captureMenuStyles(pair.headless))).toEqual([]);
  });
}

test('Menu reports expose actual selected fixture readiness, counts, native state and stable reserved geometry', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <MenuComparisonWithReport />
    </CoreAIFluentProvider>,
  );
  const report = screen.getByRole('status', { name: 'Menu style report' });
  await expect.element(report).toHaveAttribute('data-menu-report-state', 'ready');
  await settleMenuStyles();
  screen
    .getByLabelText('Menu visual fixture')
    .element()
    .dispatchEvent(new Event('change', { bubbles: true }));
  await settleMenuStyles();
  await expect.element(report).toHaveAttribute('data-menu-report-state', 'ready');
  await expect.element(report).toHaveAttribute('data-menu-unexpected-count', '0');
  expect(html(report).getBoundingClientRect().height).toBe(320);
  await userEvent.hover(screen.getByTestId('menu-report-pointer-rest'));
  await userEvent.selectOptions(screen.getByLabelText('Menu visual fixture'), 'Groups and divider');
  await expect.element(report).toHaveAttribute('data-menu-report-example', 'Groups and divider');
  await expect.element(report).toHaveAttribute('data-menu-report-state', 'ready');
  await expect.element(report).toHaveAttribute('data-menu-unexpected-count', '0');
  const native = getComparisonMenu(screen.container, 'headless');
  expect(native.matches(':popover-open')).toBe(true);
  expect(native.getBoundingClientRect().width).toBe(
    Number(html(report).getAttribute('data-menu-surface-width')),
  );
  expect(native.getBoundingClientRect().height).toBe(
    Number(html(report).getAttribute('data-menu-surface-height')),
  );
  expect(html(report).getBoundingClientRect().height).toBe(320);
});

test('all 13 public member props and current ref/context contracts match the installed facade', () => {
  expectTypeOf<MenuProps>().toEqualTypeOf<primitive.MenuProps>();
  expectTypeOf<MenuTriggerProps>().toEqualTypeOf<primitive.MenuTriggerProps>();
  expectTypeOf<MenuPopoverProps>().toEqualTypeOf<primitive.MenuPopoverProps>();
  expectTypeOf<MenuListProps>().toEqualTypeOf<primitive.MenuListProps>();
  expectTypeOf<MenuItemProps>().toEqualTypeOf<primitive.MenuItemProps>();
  expectTypeOf<MenuItemCheckboxProps>().toEqualTypeOf<primitive.MenuItemCheckboxProps>();
  expectTypeOf<MenuItemRadioProps>().toEqualTypeOf<primitive.MenuItemRadioProps>();
  expectTypeOf<MenuItemLinkProps>().toEqualTypeOf<primitive.MenuItemLinkProps>();
  expectTypeOf<MenuItemSwitchProps>().toEqualTypeOf<primitive.MenuItemSwitchProps>();
  expectTypeOf<MenuDividerProps>().toEqualTypeOf<primitive.MenuDividerProps>();
  expectTypeOf<MenuGroupProps>().toEqualTypeOf<primitive.MenuGroupProps>();
  expectTypeOf<MenuGroupHeaderProps>().toEqualTypeOf<primitive.MenuGroupHeaderProps>();
  expectTypeOf<MenuSplitGroupProps>().toEqualTypeOf<primitive.MenuSplitGroupProps>();
  expectTypeOf<typeof MenuPopover>().toEqualTypeOf<ForwardRefComponent<MenuPopoverProps>>();
  expectTypeOf<typeof MenuList>().toEqualTypeOf<ForwardRefComponent<MenuListProps>>();
  expectTypeOf<typeof MenuItem>().toEqualTypeOf<ForwardRefComponent<MenuItemProps>>();
  expectTypeOf<typeof MenuItemCheckbox>().toEqualTypeOf<
    ForwardRefComponent<MenuItemCheckboxProps>
  >();
  expectTypeOf<typeof MenuItemRadio>().toEqualTypeOf<ForwardRefComponent<MenuItemRadioProps>>();
  expectTypeOf<typeof MenuItemLink>().toEqualTypeOf<ForwardRefComponent<MenuItemLinkProps>>();
  expectTypeOf<typeof MenuItemSwitch>().toEqualTypeOf<ForwardRefComponent<MenuItemSwitchProps>>();
  expectTypeOf<typeof MenuDivider>().toEqualTypeOf<ForwardRefComponent<MenuDividerProps>>();
  expectTypeOf<typeof MenuGroup>().toEqualTypeOf<ForwardRefComponent<MenuGroupProps>>();
  expectTypeOf<typeof MenuGroupHeader>().toEqualTypeOf<ForwardRefComponent<MenuGroupHeaderProps>>();
  expectTypeOf<typeof MenuSplitGroup>().toEqualTypeOf<ForwardRefComponent<MenuSplitGroupProps>>();
  expect(useMenuContext).toBe(primitive.useMenuContext);
  expect(useMenuContextValues).toBe(primitive.useMenuContextValues);
  expect(useMenuListContextValues).toBe(primitive.useMenuListContextValues);
  expect(useMenuGroupContextValues).toBe(primitive.useMenuGroupContextValues);
  expect(useMenuSplitGroupContextValues).toBe(primitive.useMenuSplitGroupContextValues);
});

test('cold first-open and reopening focus the first item on show, use CSS anchors, closed-state hiding and Escape restoration', async () => {
  const changes = vi.fn<NonNullable<MenuProps['onOpenChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <MenuSelectionFlow onOpenChange={changes} />
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Project actions' });
  const popup = surface(screen.container, 'menu-selection-surface');
  await expectClosed(popup);
  expect(screen.getByRole('menu').query()).toBeNull();
  await userEvent.hover(screen.getByTestId('menu-pointer-rest'));
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await userEvent.click(trigger);
    await expect.poll(() => popup.matches(':popover-open')).toBe(true);
    const first = screen.getByRole('menuitem', { name: 'New file', exact: true });
    await expect.element(first).toHaveFocus();
    await expect.poll(() => html(first).tabIndex).toBe(0);
    // 0.4.1 focuses the first enabled item when the popover is shown instead of setting autofocus.
    expect(html(first).hasAttribute('autofocus')).toBe(false);
    expect(html(first).hasAttribute('focusgroupstart')).toBe(true);
    await expect.element(screen.getByRole('menu')).toHaveAttribute('focusgroup', 'menu block wrap');
    await expect
      .element(screen.getByRole('menu'))
      .toHaveAttribute('aria-labelledby', html(trigger).id);
    expect(popup.style.getPropertyValue('position-anchor')).toBe(
      html(trigger).style.getPropertyValue('anchor-name'),
    );
    expect(popup.getBoundingClientRect().width).toBeGreaterThanOrEqual(138);
    expect(popup.getBoundingClientRect().height).toBeGreaterThan(0);
    await userEvent.keyboard('{Escape}');
    await expectClosed(popup);
    await expect.element(trigger).toHaveFocus();
    expect(html(trigger).getAttribute('aria-expanded')).toBe('false');
  }
  expect(changes.mock.calls.map(([event, data]) => [event.type, data.type, data.open])).toEqual([
    ['click', 'menuTriggerClick', true],
    ['keydown', 'menuPopoverKeyDown', false],
    ['click', 'menuTriggerClick', true],
    ['keydown', 'menuPopoverKeyDown', false],
  ]);
});

test('trusted Arrow/Home/End/wrap/typeahead navigation includes aria-disabled items and Tab exits the native menu', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <MenuSelectionFlow />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByTestId('menu-pointer-rest'));
  const trigger = screen.getByRole('button', { name: 'Project actions' });
  html(trigger).focus();
  await userEvent.keyboard('{ArrowDown}');
  const first = screen.getByRole('menuitem', { name: 'New file', exact: true });
  await expect.element(first).toHaveFocus();
  await expect.poll(() => html(first).tabIndex).toBe(0);
  await userEvent.keyboard('{ArrowDown}');
  const disabled = screen.getByRole('menuitem', { name: 'Export unavailable' });
  await expect.element(disabled).toHaveFocus();
  await expect.element(disabled).toHaveAttribute('aria-disabled', 'true');
  expect(html(disabled).hasAttribute('disabled')).toBe(false);
  await userEvent.keyboard('{Enter}');
  await expect
    .element(screen.getByLabelText('Menu selection events'))
    .toHaveAttribute('data-menu-last-action', 'none');
  await userEvent.keyboard('{End}');
  await expect
    .element(screen.getByRole('menuitemcheckbox', { name: 'Preview explorer' }))
    .toHaveFocus();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(first).toHaveFocus();
  await userEvent.keyboard('s');
  await expect
    .element(screen.getByRole('menuitemcheckbox', { name: 'Show details' }))
    .toHaveFocus();
  await userEvent.keyboard('{Home}');
  await expect.element(first).toHaveFocus();
  expect(html(first).matches(':focus-visible')).toBe(true);
  const focusOutline = getComputedStyle(html(first), '::after');
  expect(focusOutline.borderTopWidth).toBe('2px');
  expect(focusOutline.top).toBe('-2px');
  await userEvent.tab();
  await expectClosed(surface(screen.container, 'menu-selection-surface'));
  await expect.element(screen.getByRole('button', { name: 'After menu' })).toHaveFocus();
  html(trigger).focus();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(first).toHaveFocus();
  await userEvent.tab({ shift: true });
  await expectClosed(surface(screen.container, 'menu-selection-surface'));
  await expect.element(screen.getByRole('button', { name: 'Before menu' })).toHaveFocus();
});

for (const controlled of [true, false]) {
  test(`${controlled ? 'controlled' : 'uncontrolled'} checks, radios and switches retain exact callback payloads, persistence and public context`, async () => {
    const changes = vi.fn<NonNullable<MenuProps['onCheckedValueChange']>>();
    const screen = await render(
      <CoreAIFluentProvider>
        <MenuSelectionFlow controlled={controlled} onCheckedValueChange={changes} />
      </CoreAIFluentProvider>,
    );
    const trigger = screen.getByRole('button', { name: 'Project actions' });
    await userEvent.click(trigger);
    await expect
      .element(screen.getByRole('menuitemcheckbox', { name: 'Grid view' }))
      .toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Show details' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Date' }));
    await expect
      .element(screen.getByRole('menuitemradio', { name: 'Name', exact: true }))
      .toHaveAttribute('aria-checked', 'false');
    await expect
      .element(screen.getByRole('menuitemradio', { name: 'Date' }))
      .toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Preview explorer' }));
    expect(changes.mock.calls.map(([event, data]) => [event.type, data])).toEqual([
      ['click', { name: 'view', checkedItems: ['grid', 'details'] }],
      ['click', { name: 'sort', checkedItems: ['date'] }],
      ['click', { name: 'settings', checkedItems: ['preview'] }],
    ]);
    await expect
      .element(screen.getByLabelText('Public Menu context'))
      .toHaveAttribute(
        'data-context-checked',
        '{"view":["grid","details"],"sort":["date"],"settings":["preview"]}',
      );
    expect(surface(screen.container, 'menu-selection-surface').matches(':popover-open')).toBe(true);
    await userEvent.keyboard('{Escape}');
    await expectClosed(surface(screen.container, 'menu-selection-surface'));
    await userEvent.click(trigger);
    await expect
      .element(screen.getByRole('menuitemcheckbox', { name: 'Show details' }))
      .toHaveAttribute('aria-checked', 'true');
    await expect
      .element(screen.getByRole('menuitemcheckbox', { name: 'Preview explorer' }))
      .toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('menuitem', { name: 'New file', exact: true }));
    await expectClosed(surface(screen.container, 'menu-selection-surface'));
    await expect
      .element(screen.getByLabelText('Menu selection events'))
      .toHaveAttribute('data-menu-last-action', 'new');
  });
}

test('defaultOpen focuses the first item on show without consumer-controlled open state', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <MenuSelectionFlow controlled={false} defaultOpen />
    </CoreAIFluentProvider>,
  );
  const popup = surface(screen.container, 'menu-selection-surface');
  await expect.poll(() => popup.matches(':popover-open')).toBe(true);
  await expect
    .element(screen.getByRole('menuitem', { name: 'New file', exact: true }))
    .toHaveFocus();
  await userEvent.keyboard('{Escape}');
  await expectClosed(popup);
});

test('initial focus on show skips an aria-disabled first item while polyfilled Home still allows disabled focus', async () => {
  const clicked = vi.fn<NonNullable<MenuItemProps['onClick']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <MenuFocusgroupConsumer>
        <Menu defaultOpen>
          <MenuTrigger disableButtonEnhancement>
            <MenuButton type="button">Disabled initial item</MenuButton>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem disabled onClick={clicked}>
                Unavailable first
              </MenuItem>
              <MenuItem>Available second</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </MenuFocusgroupConsumer>
    </CoreAIFluentProvider>,
  );
  await expect.element(screen.getByRole('menuitem', { name: 'Available second' })).toHaveFocus();
  await userEvent.keyboard('{Home}');
  const disabled = screen.getByRole('menuitem', { name: 'Unavailable first' });
  await expect.element(disabled).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(clicked).not.toHaveBeenCalled();
});

test('outside click closes through the native toggle and preserves focus on the outside target', async () => {
  const changes = vi.fn<NonNullable<MenuProps['onOpenChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <MenuSelectionFlow onOpenChange={changes} />
    </CoreAIFluentProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Project actions' }));
  const outside = screen.getByRole('button', { name: 'Before menu' });
  await userEvent.click(outside);
  await expectClosed(surface(screen.container, 'menu-selection-surface'));
  await expect.element(outside).toHaveFocus();
  expect(changes.mock.calls.map(([event, data]) => [event.type, data.type, data.open])).toEqual([
    ['click', 'menuTriggerClick', true],
    ['toggle', 'clickOutside', false],
  ]);
});

test('consumer-controlled open and checked values remain authoritative when requested changes are not accepted', async () => {
  const opens = vi.fn<NonNullable<MenuProps['onOpenChange']>>();
  const checks = vi.fn<NonNullable<MenuProps['onCheckedValueChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <MenuFocusgroupConsumer>
        <Menu open={false} onOpenChange={opens}>
          <MenuTrigger disableButtonEnhancement>
            <MenuButton type="button">Vetoed menu</MenuButton>
          </MenuTrigger>
          <MenuPopover data-testid="menu-vetoed">
            <MenuList>
              <MenuItem>Never opened</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
        <Menu defaultOpen checkedValues={{ view: [] }} onCheckedValueChange={checks}>
          <MenuTrigger disableButtonEnhancement>
            <MenuButton type="button">Controlled checks</MenuButton>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItemCheckbox name="view" value="grid">
                Held unchecked
              </MenuItemCheckbox>
            </MenuList>
          </MenuPopover>
        </Menu>
      </MenuFocusgroupConsumer>
    </CoreAIFluentProvider>,
  );
  await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Held unchecked' }));
  await expect
    .element(screen.getByRole('menuitemcheckbox', { name: 'Held unchecked' }))
    .toHaveAttribute('aria-checked', 'false');
  expect(checks.mock.calls.map(([, data]) => data)).toEqual([
    { name: 'view', checkedItems: ['grid'] },
  ]);
  await userEvent.click(screen.getByRole('button', { name: 'Vetoed menu' }));
  await expectClosed(surface(screen.container, 'menu-vetoed'));
  expect(opens.mock.calls.map(([, data]) => [data.type, data.open])).toEqual([
    ['menuTriggerClick', true],
  ]);
});

test('standalone MenuList owns uncontrolled checks and public native focusgroup navigation without a fabricated Menu provider', async () => {
  const checks = vi.fn<NonNullable<MenuListProps['onCheckedValueChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <MenuFocusgroupConsumer>
        <MenuList
          aria-label="Standalone menu"
          defaultCheckedValues={{ view: ['grid'] }}
          onCheckedValueChange={checks}
        >
          <MenuItemCheckbox name="view" value="grid">
            Grid
          </MenuItemCheckbox>
          <MenuItemCheckbox name="view" value="details">
            Details
          </MenuItemCheckbox>
        </MenuList>
      </MenuFocusgroupConsumer>
    </CoreAIFluentProvider>,
  );
  await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Details', exact: true }));
  expect(checks.mock.calls.map(([, data]) => data)).toEqual([
    { name: 'view', checkedItems: ['grid', 'details'] },
  ]);
  await expect
    .element(screen.getByRole('menuitemcheckbox', { name: 'Grid', exact: true }))
    .toHaveAttribute('aria-checked', 'true');
  await userEvent.keyboard('{Home}');
  await expect
    .element(screen.getByRole('menuitemcheckbox', { name: 'Grid', exact: true }))
    .toHaveFocus();
  await userEvent.keyboard('{End}');
  await expect
    .element(screen.getByRole('menuitemcheckbox', { name: 'Details', exact: true }))
    .toHaveFocus();
});

test('explicit MenuList selection props and callbacks keep their current precedence over parent Menu context', async () => {
  const parentChecks = vi.fn<NonNullable<MenuProps['onCheckedValueChange']>>();
  const listChecks = vi.fn<NonNullable<MenuListProps['onCheckedValueChange']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <MenuFocusgroupConsumer>
        <Menu defaultOpen checkedValues={{ view: ['grid'] }} onCheckedValueChange={parentChecks}>
          <MenuTrigger disableButtonEnhancement>
            <MenuButton type="button">Selection precedence</MenuButton>
          </MenuTrigger>
          <MenuPopover>
            <MenuList checkedValues={{ view: ['details'] }} onCheckedValueChange={listChecks}>
              <MenuItemCheckbox name="view" value="grid">
                Grid
              </MenuItemCheckbox>
              <MenuItemCheckbox name="view" value="details">
                Details
              </MenuItemCheckbox>
            </MenuList>
          </MenuPopover>
        </Menu>
      </MenuFocusgroupConsumer>
    </CoreAIFluentProvider>,
  );
  await expect
    .element(screen.getByRole('menuitemcheckbox', { name: 'Grid', exact: true }))
    .toHaveAttribute('aria-checked', 'false');
  await expect
    .element(screen.getByRole('menuitemcheckbox', { name: 'Details', exact: true }))
    .toHaveAttribute('aria-checked', 'true');
  await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Grid', exact: true }));
  expect(parentChecks).not.toHaveBeenCalled();
  expect(listChecks.mock.calls.map(([, data]) => data)).toEqual([
    { name: 'view', checkedItems: ['details', 'grid'] },
  ]);
});

for (const dir of ['ltr', 'rtl'] as const) {
  test(`${dir}: trusted submenu arrows and Escape preserve nested native top layers, initial focus and close-all actions`, async () => {
    const previousDir = document.documentElement.dir;
    document.documentElement.dir = dir;
    try {
      const screen = await render(
        <CoreAIFluentProvider dir={dir}>
          <MenuSubmenuFlow />
        </CoreAIFluentProvider>,
      );
      await userEvent.hover(screen.getByTestId('menu-pointer-rest'));
      const trigger = screen.getByRole('button', { name: 'Project navigation' });
      const root = surface(screen.container, 'menu-root-surface');
      const child = surface(screen.container, 'menu-submenu-surface');
      await expectClosed(root);
      await expectClosed(child);
      await userEvent.click(trigger);
      await expect
        .element(screen.getByRole('menuitem', { name: 'New file', exact: true }))
        .toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      const submenuTrigger = screen.getByRole('menuitem', { name: 'Share project' });
      await expect.element(submenuTrigger).toHaveFocus();
      const openKey = dir === 'ltr' ? '{ArrowRight}' : '{ArrowLeft}';
      const closeKey = dir === 'ltr' ? '{ArrowLeft}' : '{ArrowRight}';
      await userEvent.keyboard(openKey);
      await expect.element(screen.getByRole('menuitem', { name: 'Copy link' })).toHaveFocus();
      expect(root.matches(':popover-open')).toBe(true);
      expect(child.matches(':popover-open')).toBe(true);
      await expect.element(submenuTrigger).toHaveAttribute('aria-haspopup', 'menu');
      await expect.element(submenuTrigger).toHaveAttribute('aria-expanded', 'true');
      const regular = html(submenuTrigger).querySelector('[data-menu-icon-kind="regular"]');
      const filled = html(submenuTrigger).querySelector('[data-menu-icon-kind="filled"]');
      if (!regular || !filled) throw new Error('Missing current submenu glyph pair');
      expect(getComputedStyle(regular).display).toBe('none');
      expect(getComputedStyle(filled).display).toBe('block');
      await userEvent.keyboard(closeKey);
      await expectClosed(child);
      expect(root.matches(':popover-open')).toBe(true);
      await expect.element(submenuTrigger).toHaveFocus();
      await userEvent.keyboard(openKey);
      await expect.element(screen.getByRole('menuitem', { name: 'Copy link' })).toHaveFocus();
      await userEvent.keyboard('{Escape}');
      await expectClosed(child);
      expect(root.matches(':popover-open')).toBe(true);
      await expect.element(submenuTrigger).toHaveFocus();
      await userEvent.keyboard(openKey);
      await userEvent.click(screen.getByRole('menuitem', { name: 'Invite people' }));
      await expectClosed(child);
      await expectClosed(root);
      await expect.element(trigger).toHaveFocus();
      await expect
        .element(screen.getByLabelText('Menu navigation events'))
        .toHaveAttribute('data-menu-last-action', 'invite');
    } finally {
      document.documentElement.dir = previousDir;
    }
  });
}

test('Tab from a reopened nested focusgroup closes both native surfaces and exits after the root trigger', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <MenuSubmenuFlow />
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Project navigation' });
  const root = surface(screen.container, 'menu-root-surface');
  const child = surface(screen.container, 'menu-submenu-surface');
  await userEvent.hover(screen.getByTestId('menu-pointer-rest'));
  for (let attempt = 0; attempt < 2; attempt += 1) {
    html(trigger).focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect
      .element(screen.getByRole('menuitem', { name: 'New file', exact: true }))
      .toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{ArrowRight}');
    await expect.element(screen.getByRole('menuitem', { name: 'Copy link' })).toHaveFocus();
    await userEvent.tab();
    await expectClosed(child);
    await expectClosed(root);
    await expect.element(screen.getByRole('button', { name: 'After navigation' })).toHaveFocus();
  }
});

test('pointer submenu activation preserves the root and bubbling item selection closes the complete native stack', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <MenuSubmenuFlow />
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Project navigation' });
  await userEvent.click(trigger);
  const submenuTrigger = screen.getByRole('menuitem', { name: 'Share project' });
  await userEvent.hover(submenuTrigger);
  await expectClosed(surface(screen.container, 'menu-submenu-surface'));
  await userEvent.click(submenuTrigger);
  await expect.element(screen.getByRole('menuitem', { name: 'Copy link' })).toHaveFocus();
  expect(surface(screen.container, 'menu-root-surface').matches(':popover-open')).toBe(true);
  await userEvent.click(screen.getByRole('menuitem', { name: 'Copy link' }));
  await expectClosed(surface(screen.container, 'menu-submenu-surface'));
  await expectClosed(surface(screen.container, 'menu-root-surface'));
  await expect.element(trigger).toHaveFocus();
  await expect
    .element(screen.getByLabelText('Menu navigation events'))
    .toHaveAttribute('data-menu-last-action', 'copy-link');
});

test('split groups keep the real public context, suppress trigger alignment columns and separate primary/submenu actions', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <MenuSplitFlow />
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Open options' });
  const events = screen.getByLabelText('Menu split events');
  await userEvent.click(trigger);
  const primary = screen.getByRole('menuitem', { name: 'Open project', exact: true });
  const choose = screen.getByRole('menuitem', { name: 'Choose platform' });
  expect(html(primary).querySelector(`.${menuItemClassNames.icon}`)).not.toBeNull();
  expect(html(primary).querySelector(`.${menuItemClassNames.checkmark}`)).not.toBeNull();
  expect(html(choose).querySelector(`.${menuItemClassNames.icon}`)).toBeNull();
  expect(html(choose).querySelector(`.${menuItemClassNames.checkmark}`)).toBeNull();
  expect(getComputedStyle(html(choose)).alignSelf).toBe('center');
  expect(getComputedStyle(html(choose), '::before').height).toBe('20px');
  expect(getComputedStyle(html(choose)).paddingInlineStart).toBe('0px');
  await userEvent.click(primary);
  await expect.element(events).toHaveAttribute('data-menu-last-action', 'default-app');
  await expectClosed(surface(screen.container, 'menu-split-root-surface'));
  await userEvent.click(trigger);
  await userEvent.click(choose);
  await expect.element(events).toHaveAttribute('data-menu-last-action', 'default-app');
  await expect.element(screen.getByRole('menuitem', { name: 'In browser' })).toHaveFocus();
  await userEvent.click(screen.getByRole('menuitem', { name: 'In desktop app' }));
  await expect.element(events).toHaveAttribute('data-menu-last-action', 'desktop');
  await expectClosed(surface(screen.container, 'menu-split-submenu-surface'));
  await expectClosed(surface(screen.container, 'menu-split-root-surface'));
});

test('MenuButton inside a form stays non-submitting while a consumer action submits native FormData with the actual submitter', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <MenuFormFlow />
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Project form actions' });
  const events = screen.getByLabelText('Menu form events');
  await userEvent.fill(screen.getByLabelText('Project name'), 'Orion release');
  await userEvent.click(trigger);
  await expect.element(events).toHaveAttribute('data-menu-submissions', '0');
  await userEvent.click(screen.getByRole('menuitem', { name: 'Save project' }));
  await expect.element(events).toHaveAttribute('data-menu-submissions', '1');
  await expect.element(events).toHaveAttribute('data-menu-submitter', 'save');
  await expect.element(events).toHaveTextContent('[["project","Orion release"],["intent","save"]]');
  await expectClosed(surface(screen.container, 'menu-form-surface'));
  await expect.element(trigger).toHaveFocus();
});

test('native MenuItemLink navigation and disabled activation preserve anchor semantics and current menu dismissal', async () => {
  const originalURL = window.location.href;
  try {
    const screen = await render(
      <CoreAIFluentProvider>
        <MenuFormFlow />
      </CoreAIFluentProvider>,
    );
    const trigger = screen.getByRole('button', { name: 'Project form actions' });
    await userEvent.click(trigger);
    const disabled = screen.getByRole('menuitem', { name: 'Restricted documentation' });
    expect(html(disabled).tagName).toBe('A');
    await expect.element(disabled).toHaveAttribute('aria-disabled', 'true');
    html(disabled).focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.click(disabled, { force: true });
    expect(window.location.href).toBe(originalURL);
    expect(surface(screen.container, 'menu-form-surface').matches(':popover-open')).toBe(true);
    const link = screen.getByRole('menuitem', { name: 'Project documentation', exact: true });
    expect(html(link).tagName).toBe('A');
    const destination = html(link).getAttribute('href');
    expect(destination).not.toBeNull();
    await userEvent.click(link);
    await expect.poll(() => window.location.hash).toBe(destination);
    await expectClosed(surface(screen.container, 'menu-form-surface'));
  } finally {
    window.history.replaceState(null, '', originalURL);
  }
});

test('the controlled context-menu alternative opens on the first trusted right-click and uses native dismissal', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <MenuContextFlow />
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Project context actions' });
  await userEvent.click(trigger, { button: 'right' });
  const popup = surface(screen.container, 'menu-context-surface');
  await expect.poll(() => popup.matches(':popover-open')).toBe(true);
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.element(screen.getByRole('menuitem', { name: 'Copy project link' })).toHaveFocus();
  expect(popup.style.getPropertyValue('position-anchor')).toBe(
    html(trigger).style.getPropertyValue('anchor-name'),
  );
  await userEvent.keyboard('{Escape}');
  await expectClosed(popup);
  await expect.element(trigger).toHaveFocus();
  await userEvent.click(trigger, { button: 'right' });
  await userEvent.click(screen.getByRole('menuitem', { name: 'Copy project link' }));
  await expect
    .element(screen.getByLabelText('Menu context events'))
    .toHaveAttribute('data-menu-last-action', 'copy-link');
  await expectClosed(popup);
});

type SurfaceRootProps = ExtractSlotProps<MenuPopoverSlots['root']>;
type ContentProps = ExtractSlotProps<MenuItemSlots['content']>;
type IconProps = ExtractSlotProps<MenuItemSlots['icon']>;
type CheckmarkProps = ExtractSlotProps<MenuItemSlots['checkmark']>;
type SwitchIndicatorProps = ExtractSlotProps<MenuItemSwitchSlots['switchIndicator']>;

test('current primitive slot render functions preserve native metadata, refs, classes, handlers, data and supplied glyphs', async () => {
  const triggerRef = React.createRef<HTMLButtonElement>();
  const surfaceRef = React.createRef<HTMLDivElement>();
  const listRef = React.createRef<HTMLDivElement>();
  const itemRef = React.createRef<HTMLDivElement>();
  const groupRef = React.createRef<HTMLDivElement>();
  const headerRef = React.createRef<HTMLDivElement>();
  const dividerRef = React.createRef<HTMLDivElement>();
  const linkRef = React.createRef<HTMLAnchorElement>();
  const contentRef = React.createRef<HTMLSpanElement>();
  const iconRef = React.createRef<HTMLSpanElement>();
  const checkRef = React.createRef<HTMLSpanElement>();
  const switchRef = React.createRef<HTMLSpanElement>();
  const onItemClick = vi.fn<NonNullable<MenuItemProps['onClick']>>();
  const onSurfaceKeyDown = vi.fn<NonNullable<MenuPopoverProps['onKeyDown']>>();
  const renderContent: SlotRenderFunction<ContentProps> = (Component, props) => (
    <Component {...props} data-custom-content="">
      {props.children}
    </Component>
  );
  const renderIcon: SlotRenderFunction<IconProps> = (Component, props) => (
    <Component {...props} data-custom-icon="">
      <Checkmark16Filled data-custom-glyph="icon" />
    </Component>
  );
  const renderCheck: SlotRenderFunction<CheckmarkProps> = (Component, props) => (
    <Component {...props} data-custom-check="">
      <Checkmark16Filled data-custom-glyph="check" />
    </Component>
  );
  const renderSwitch: SlotRenderFunction<SwitchIndicatorProps> = (Component, props) => (
    <Component {...props} data-custom-switch="">
      <CircleFilled data-custom-glyph="switch" />
    </Component>
  );
  const renderSurface: SlotRenderFunction<SurfaceRootProps> = (Component, props) => (
    <Component {...props} data-custom-surface="">
      <MenuList ref={listRef} className="consumer-list">
        <MenuGroup ref={groupRef} className="consumer-group">
          <MenuGroupHeader ref={headerRef} className="consumer-header">
            Custom group
          </MenuGroupHeader>
          <MenuItem
            ref={itemRef}
            className="consumer-item"
            data-custom-item=""
            persistOnClick
            onClick={onItemClick}
            content={{ ref: contentRef, className: 'consumer-content', children: renderContent }}
            icon={{ ref: iconRef, className: 'consumer-icon', children: renderIcon }}
          >
            Custom item
          </MenuItem>
          <MenuItemCheckbox
            name="view"
            value="custom"
            checkmark={{ ref: checkRef, className: 'consumer-check', children: renderCheck }}
          >
            Custom checkbox
          </MenuItemCheckbox>
          <MenuItemRadio name="sort" value="name" persistOnClick>
            Custom radio
          </MenuItemRadio>
          <MenuItemSwitch
            name="settings"
            value="preview"
            switchIndicator={{
              ref: switchRef,
              className: 'consumer-switch',
              children: renderSwitch,
            }}
          >
            Custom switch
          </MenuItemSwitch>
          <MenuItemLink ref={linkRef} href="#custom-menu-destination">
            Custom link
          </MenuItemLink>
        </MenuGroup>
        <MenuDivider ref={dividerRef} className="consumer-divider" data-custom-divider="" />
      </MenuList>
    </Component>
  );
  const screen = await render(
    <CoreAIFluentProvider>
      <MenuFocusgroupConsumer>
        <Menu defaultOpen defaultCheckedValues={{ view: ['custom'], sort: ['name'] }}>
          <MenuTrigger disableButtonEnhancement>
            <MenuButton ref={triggerRef} type="button" className="consumer-trigger">
              Custom menu
            </MenuButton>
          </MenuTrigger>
          <MenuPopover ref={surfaceRef} className="consumer-surface" onKeyDown={onSurfaceKeyDown}>
            {renderSurface}
          </MenuPopover>
        </Menu>
      </MenuFocusgroupConsumer>
    </CoreAIFluentProvider>,
  );
  const item = screen.getByRole('menuitem', { name: 'Custom item', exact: true });
  await expect.element(item).toBeVisible();
  expect(triggerRef.current).toBe(html(screen.getByRole('button', { name: 'Custom menu' })));
  expect(itemRef.current).toBe(html(item));
  expect(itemRef.current?.hasAttribute('data-custom-item')).toBe(true);
  expect(linkRef.current).toBe(html(screen.getByRole('menuitem', { name: 'Custom link' })));
  expect(groupRef.current).toBe(html(screen.getByRole('group', { name: 'Custom group' })));
  expect(groupRef.current?.getAttribute('aria-labelledby')).toBe(headerRef.current?.id);
  expect(surfaceRef.current?.getAttribute('popover')).toBe('auto');
  expect(surfaceRef.current?.hasAttribute('data-custom-surface')).toBe(true);
  for (const [element, marker, consumerClass] of [
    [surfaceRef.current, menuPopoverClassNames.root, 'consumer-surface'],
    [listRef.current, menuListClassNames.root, 'consumer-list'],
    [itemRef.current, menuItemClassNames.root, 'consumer-item'],
    [groupRef.current, menuGroupClassNames.root, 'consumer-group'],
    [headerRef.current, menuGroupHeaderClassNames.root, 'consumer-header'],
    [dividerRef.current, menuDividerClassNames.root, 'consumer-divider'],
    [contentRef.current, menuItemClassNames.content, 'consumer-content'],
    [iconRef.current, menuItemClassNames.icon, 'consumer-icon'],
    [checkRef.current, menuItemCheckboxClassNames.checkmark, 'consumer-check'],
    [switchRef.current, menuItemSwitchClassNames.switchIndicator, 'consumer-switch'],
  ] as const) {
    expect(element).not.toBeNull();
    expect(element?.classList.contains(marker)).toBe(true);
    expect(element?.classList.contains(consumerClass)).toBe(true);
  }
  expect(contentRef.current?.hasAttribute('data-custom-content')).toBe(true);
  expect(iconRef.current?.querySelectorAll('svg').length).toBe(1);
  expect(checkRef.current?.querySelectorAll('svg').length).toBe(1);
  expect(switchRef.current?.querySelectorAll('svg').length).toBe(1);
  expect(switchRef.current?.querySelector('[data-custom-glyph="switch"]')).not.toBeNull();
  expect(
    switchRef.current?.querySelector('.fui-MenuItemSwitch__switchIndicator__circleFilled'),
  ).toBeNull();
  expect(linkRef.current?.classList.contains(menuItemLinkClassNames.root)).toBe(true);
  expect(
    html(screen.getByRole('menuitemradio', { name: 'Custom radio' })).classList.contains(
      menuItemRadioClassNames.root,
    ),
  ).toBe(true);
  expect(dividerRef.current?.getAttribute('role')).toBe('presentation');
  expect(dividerRef.current?.getAttribute('aria-hidden')).toBe('true');
  await userEvent.click(item);
  expect(onItemClick.mock.calls.map(([event]) => event.type)).toEqual(['click']);
  await userEvent.keyboard('{Escape}');
  expect(onSurfaceKeyDown.mock.calls.at(-1)?.[0].key).toBe('Escape');
  if (!surfaceRef.current) throw new Error('Missing preserved Menu surface ref');
  await expectClosed(surfaceRef.current);
});

test('split group refs and stable markers remain on the actual native group, not a wrapper or invented item part', async () => {
  const ref = React.createRef<HTMLDivElement>();
  const screen = await render(
    <CoreAIFluentProvider>
      <MenuFocusgroupConsumer>
        <Menu defaultOpen>
          <MenuTrigger disableButtonEnhancement>
            <MenuButton type="button">Ref split menu</MenuButton>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <Menu>
                <MenuSplitGroup ref={ref} aria-label="Split ref group" className="consumer-split">
                  <MenuItem>Primary</MenuItem>
                  <MenuTrigger disableButtonEnhancement>
                    <MenuItem aria-label="Secondary" />
                  </MenuTrigger>
                </MenuSplitGroup>
                <MenuPopover>
                  <MenuList>
                    <MenuItem>Nested action</MenuItem>
                  </MenuList>
                </MenuPopover>
              </Menu>
            </MenuList>
          </MenuPopover>
        </Menu>
      </MenuFocusgroupConsumer>
    </CoreAIFluentProvider>,
  );
  expect(ref.current).toBe(html(screen.getByRole('group', { name: 'Split ref group' })));
  expect(ref.current?.classList.contains(menuSplitGroupClassNames.root)).toBe(true);
  expect(ref.current?.classList.contains('consumer-split')).toBe(true);
  expect(ref.current?.tagName).toBe('DIV');
  expect(ref.current?.children.length).toBe(2);
});

test('null glyph slots retain current selectable alignment resolution without inventing icon, switch or submenu slots', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <MenuFocusgroupConsumer>
        <Menu defaultOpen hasIcons hasCheckmarks>
          <MenuTrigger disableButtonEnhancement>
            <MenuButton type="button">Null glyph slots</MenuButton>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItemCheckbox name="view" value="grid" icon={null} checkmark={null}>
                Null checkbox slot
              </MenuItemCheckbox>
              <MenuItemRadio name="sort" value="name" icon={null} checkmark={null}>
                Null radio slot
              </MenuItemRadio>
              <MenuItemSwitch name="settings" value="preview" icon={null} switchIndicator={null}>
                Null switch slot
              </MenuItemSwitch>
              <Menu hoverDelay={0} openOnHover={false}>
                <MenuTrigger disableButtonEnhancement>
                  <MenuItem icon={null} checkmark={null} submenuIndicator={null}>
                    Null submenu slot
                  </MenuItem>
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    <MenuItem>Nested action</MenuItem>
                  </MenuList>
                </MenuPopover>
              </Menu>
              <primitive.MenuItemCheckbox
                name="view"
                value="primitive"
                icon={null}
                checkmark={null}
              >
                Primitive null checkbox
              </primitive.MenuItemCheckbox>
              <primitive.MenuItemRadio name="sort" value="primitive" icon={null} checkmark={null}>
                Primitive null radio
              </primitive.MenuItemRadio>
            </MenuList>
          </MenuPopover>
        </Menu>
      </MenuFocusgroupConsumer>
    </CoreAIFluentProvider>,
  );
  for (const [role, name, reservedCheckmark] of [
    ['menuitemcheckbox', 'Null checkbox slot', true],
    ['menuitemradio', 'Null radio slot', true],
    ['menuitemcheckbox', 'Null switch slot', false],
    ['menuitem', 'Null submenu slot', false],
  ] as const) {
    const item = html(screen.getByRole(role, { name, exact: true }));
    expect(item.querySelector(`.${menuItemClassNames.icon}`)).toBeNull();
    const checkmark = item.querySelector(`.${menuItemClassNames.checkmark}`);
    expect(checkmark !== null).toBe(reservedCheckmark);
    expect(item.querySelector(`.${menuItemClassNames.submenuIndicator}`)).toBeNull();
    expect(item.querySelector(`.${menuItemSwitchClassNames.switchIndicator}`)).toBeNull();
  }
  // The installed public selectable hooks reserve this column under hasCheckmarks
  // even after resolving an explicit null checkmark. The wrapper keeps that contract.
  for (const [role, convertedName, primitiveName] of [
    ['menuitemcheckbox', 'Null checkbox slot', 'Primitive null checkbox'],
    ['menuitemradio', 'Null radio slot', 'Primitive null radio'],
  ] as const) {
    const converted = html(screen.getByRole(role, { name: convertedName, exact: true }));
    const original = html(screen.getByRole(role, { name: primitiveName, exact: true }));
    expect(original.children.length).toBe(2);
    expect(original.firstElementChild?.tagName).toBe('SPAN');
    expect(original.firstElementChild?.children.length).toBe(0);
    expect(converted.children.length).toBe(original.children.length);
    expect(converted.firstElementChild?.children.length).toBe(1);
  }
});
