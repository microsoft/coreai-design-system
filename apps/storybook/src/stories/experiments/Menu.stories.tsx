// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { withHeadlessProvider } from './ComparisonProvider.js';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor } from 'storybook/test';
import { ComparisonProvider as CoreAIFluentProvider } from './ComparisonProvider.js';
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuItemCheckbox,
  MenuItemRadio,
  MenuItemLink,
  MenuItemSwitch,
  MenuDivider,
  MenuGroup,
  MenuGroupHeader,
  MenuSplitGroup,
} from '@coreai-ds/react-headless-components';
import { menuConsumerExample, menuExamples } from './MenuComparison.js';
import { MenuComparisonWithReport } from './MenuComparisonReport.js';
import {
  MenuContextFlow,
  MenuFormFlow,
  MenuSelectionFlow,
  MenuSplitFlow,
  MenuSubmenuFlow,
} from './MenuFlows.js';
import {
  assertMenuClosed,
  assertMenuFocus,
  assertMenuReport,
  focusMenuStoryItem,
  nativeMenuSurface,
} from './MenuStoryPlay.js';

const meta = {
  decorators: [withHeadlessProvider],
  title: 'Experiments/Headless Menu',
  component: Menu,
  subcomponents: {
    MenuTrigger,
    MenuPopover,
    MenuList,
    MenuItem,
    MenuItemCheckbox,
    MenuItemRadio,
    MenuItemLink,
    MenuItemSwitch,
    MenuDivider,
    MenuGroup,
    MenuGroupHeader,
    MenuSplitGroup,
  },
  args: {
    children: (
      <MenuPopover>
        <MenuList>
          <MenuItem>Project action</MenuItem>
        </MenuList>
      </MenuPopover>
    ),
  },
  parameters: {
    layout: 'padded',
    throwPlayFunctionExceptions: true,
    docs: {
      description: {
        component:
          'All 13 current Menu-family members use the installed public headless-preview 0.3.2 /menu hooks/renderers/context helpers and react-menu 9.25.8 raw visual sources. Menu and MenuTrigger are behavior-only. There are no size/inset visual props or CoreAI Menu prop defaults. The real defaults-gated CoreAI Overlay surface border is separate from the Fluent baseline; the legacy first-div beak selector is not copied because current MenuPopover has no arrow. Checkbox/radio/switch/link and split groups retain current native and public context behavior, callback payloads, refs, slot metadata and render functions. Item variants share one MenuItem/checkmark foundation; MenuItemSwitch has an independent span track in its actual source, not a styled Switch child. Native popover="auto", top-layer stacking, autofocus, Escape, light dismiss, restoration and CSS anchors replace Portal/Tabster/JS positioning/motion. Closed native submenus stay mounted and UA-hidden. No author display rule unhides closed popovers. Consumers must initialize @microsoft/focusgroup-polyfill before rendering Menu for Arrow/Home/End navigation; this experimental story/test-only scoped consumer uses the installed 1.6.0 public polyfill(root) API and initializes newly mounted groups in its subtree. The library neither imports a polyfill nor adds keyboard-navigation state or a legacy focus manager. The polyfill documents visibility-only nested-group/Tab limitations; the current MenuPopover re-stamps its focusgroup attribute on open. Trusted Chromium first-open/reopen, submenu/Tab, disabled-focusable and native form/link tests are the acceptance boundary, beyond synthetic Storybook events. Disabled menu items remain keyboard focusable with aria-disabled; disabledFocusable is deprecated and is not used. MenuItemSwitch is a menuitemcheckbox, not a native input or standalone switch. Use explicit type="button" on MenuButton inside forms. The native form example calls requestSubmit with a real submitter from a consumer action; it does not pretend a div menu item is a submit button. The controlled context-menu alternative avoids the pinned Windows openOnContext pointerup timing defect; no dependency patch or component shim is added. Native overlay/anchor fallbacks on older browsers remain consumer-owned. Arbitrary legacy customStyleHooks are not called; ordinary unlayered CSS overrides the new layered foundation. Comparison reports use exact bounded CSS and geometry and refresh both public positioning handles after layout; no screenshots or broad CSS dumps are used.',
      },
    },
  },
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparison: Story = {
  render: () => <MenuComparisonWithReport />,
  play: async ({ canvas, canvasElement }) => {
    await assertMenuReport(canvasElement, menuExamples[0].name);
    await userEvent.hover(canvas.getByTestId('menu-report-pointer-rest'));
    for (const example of menuExamples.slice(1)) {
      await userEvent.selectOptions(canvas.getByLabelText('Menu visual fixture'), example.name);
      await assertMenuReport(canvasElement, example.name);
    }
  },
};

export const RTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <MenuComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const DefaultsOptOut: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} withComponentDefaults={false}>
      <MenuComparisonWithReport />
    </CoreAIFluentProvider>
  ),
  play: Comparison.play,
};

export const ConsumerOverrides: Story = {
  render: () => <MenuComparisonWithReport examples={[menuConsumerExample]} consumer />,
  play: async ({ canvasElement }) => {
    await assertMenuReport(canvasElement, menuConsumerExample.name);
    const surface = canvasElement.querySelector('[data-menu-implementation="headless"]');
    if (!(surface instanceof HTMLElement)) throw new Error('Missing consumer MenuPopover');
    await expect(getComputedStyle(surface).borderTopWidth).toBe('3px');
    await expect(getComputedStyle(surface).paddingTop).toBe('8px');
    await expect(getComputedStyle(surface).borderRadius).toBe('3px');
    const item = surface.querySelector('[data-menu-part="item"]');
    if (!(item instanceof HTMLElement)) throw new Error('Missing consumer MenuItem');
    await expect(getComputedStyle(item).minHeight).toBe('40px');
    await expect(getComputedStyle(item).borderRadius).toBe('2px');
  },
};

export const SelectionAndKeyboard: Story = {
  render: () => <MenuSelectionFlow />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('menu-pointer-rest'));
    const trigger = canvas.getByRole('button', { name: 'Project actions' });
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    const first = canvas.getByRole('menuitem', { name: 'New file' });
    await assertMenuFocus(first);
    await waitFor(async () => {
      await expect(first.tabIndex).toBe(0);
    });
    const disabled = canvas.getByRole('menuitem', { name: 'Export unavailable' });
    await focusMenuStoryItem(disabled, '{ArrowDown}');
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await userEvent.keyboard('{Enter}');
    const events = canvas.getByLabelText('Menu selection events');
    await expect(events).toHaveAttribute('data-menu-last-action', 'none');
    await focusMenuStoryItem(
      canvas.getByRole('menuitemcheckbox', { name: 'Preview explorer' }),
      '{End}',
    );
    await focusMenuStoryItem(first, '{Home}');
    await userEvent.click(canvas.getByRole('menuitemcheckbox', { name: 'Show details' }));
    await expect(events).toHaveAttribute('data-menu-change-name', 'view');
    await expect(events).toHaveAttribute('data-menu-change-items', '["grid","details"]');
    await userEvent.click(canvas.getByRole('menuitemradio', { name: 'Date' }));
    await expect(canvas.getByRole('menuitemradio', { name: 'Name' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await expect(events).toHaveAttribute('data-menu-change-items', '["date"]');
    await userEvent.click(canvas.getByRole('menuitemcheckbox', { name: 'Preview explorer' }));
    await expect(events).toHaveAttribute('data-menu-change-name', 'settings');
    await expect(events).toHaveAttribute('data-menu-change-items', '["preview"]');
    await expect(events).toHaveAttribute('data-menu-change-count', '3');
    await userEvent.keyboard('{Escape}');
    await assertMenuClosed(nativeMenuSurface(canvasElement, 'menu-selection-surface'));
    await assertMenuFocus(trigger);
    await userEvent.click(trigger);
    await expect(canvas.getByRole('menuitemcheckbox', { name: 'Show details' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await userEvent.click(canvas.getByRole('menuitem', { name: 'New file' }));
    await expect(events).toHaveAttribute('data-menu-last-action', 'new');
    await assertMenuClosed(nativeMenuSurface(canvasElement, 'menu-selection-surface'));
    await userEvent.hover(canvas.getByTestId('menu-pointer-rest'));
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await assertMenuFocus(canvas.getByRole('menuitem', { name: 'New file' }));
    await userEvent.tab();
    await assertMenuClosed(nativeMenuSurface(canvasElement, 'menu-selection-surface'));
    await assertMenuFocus(canvas.getByRole('button', { name: 'After menu' }));
  },
};

export const UncontrolledSelection: Story = {
  render: () => <MenuSelectionFlow controlled={false} />,
  play: SelectionAndKeyboard.play,
};

export const NativeSubmenus: Story = {
  render: () => <MenuSubmenuFlow />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('menu-pointer-rest'));
    const trigger = canvas.getByRole('button', { name: 'Project navigation' });
    await userEvent.click(trigger);
    await assertMenuFocus(canvas.getByRole('menuitem', { name: 'New file' }));
    await focusMenuStoryItem(
      canvas.getByRole('menuitem', { name: 'Share project' }),
      '{ArrowDown}',
    );
    await userEvent.keyboard('{ArrowRight}');
    await assertMenuFocus(await canvas.findByRole('menuitem', { name: 'Copy link' }));
    const child = nativeMenuSurface(canvasElement, 'menu-submenu-surface');
    const root = nativeMenuSurface(canvasElement, 'menu-root-surface');
    await expect(child.matches(':popover-open')).toBe(true);
    await expect(root.matches(':popover-open')).toBe(true);
    await userEvent.keyboard('{ArrowLeft}');
    await assertMenuClosed(child);
    await assertMenuFocus(canvas.getByRole('menuitem', { name: 'Share project' }));
    await userEvent.keyboard('{ArrowRight}');
    await assertMenuFocus(await canvas.findByRole('menuitem', { name: 'Copy link' }));
    await userEvent.keyboard('{Escape}');
    await assertMenuClosed(child);
    await expect(root.matches(':popover-open')).toBe(true);
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.click(await canvas.findByRole('menuitem', { name: 'Invite people' }));
    await expect(canvas.getByLabelText('Menu navigation events')).toHaveAttribute(
      'data-menu-last-action',
      'invite',
    );
    await assertMenuClosed(child);
    await assertMenuClosed(root);
    await assertMenuFocus(trigger);
  },
};

export const NativeSubmenusRTL: Story = {
  render: () => (
    <CoreAIFluentProvider theme={{}} dir="rtl">
      <MenuSubmenuFlow />
    </CoreAIFluentProvider>
  ),
  play: async ({ canvas, canvasElement }) => {
    await userEvent.hover(canvas.getByTestId('menu-pointer-rest'));
    await userEvent.click(canvas.getByRole('button', { name: 'Project navigation' }));
    await focusMenuStoryItem(
      canvas.getByRole('menuitem', { name: 'Share project' }),
      '{ArrowDown}',
    );
    await userEvent.keyboard('{ArrowLeft}');
    await assertMenuFocus(await canvas.findByRole('menuitem', { name: 'Copy link' }));
    await userEvent.keyboard('{ArrowRight}');
    await assertMenuClosed(nativeMenuSurface(canvasElement, 'menu-submenu-surface'));
    await assertMenuFocus(canvas.getByRole('menuitem', { name: 'Share project' }));
    await userEvent.keyboard('{Escape}');
    await assertMenuClosed(nativeMenuSurface(canvasElement, 'menu-root-surface'));
  },
};

export const SplitActions: Story = {
  render: () => <MenuSplitFlow />,
  play: async ({ canvas, canvasElement }) => {
    const trigger = canvas.getByRole('button', { name: 'Open options' });
    const events = canvas.getByLabelText('Menu split events');
    await userEvent.click(trigger);
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Open project' }));
    await expect(events).toHaveAttribute('data-menu-last-action', 'default-app');
    await assertMenuClosed(nativeMenuSurface(canvasElement, 'menu-split-root-surface'));
    await userEvent.click(trigger);
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Choose platform' }));
    await expect(events).toHaveAttribute('data-menu-last-action', 'default-app');
    await userEvent.click(canvas.getByRole('menuitem', { name: 'In browser' }));
    await expect(events).toHaveAttribute('data-menu-last-action', 'browser');
    await assertMenuClosed(nativeMenuSurface(canvasElement, 'menu-split-submenu-surface'));
    await assertMenuClosed(nativeMenuSurface(canvasElement, 'menu-split-root-surface'));
  },
};

export const NativeFormAndLink: Story = {
  render: () => <MenuFormFlow />,
  play: async ({ canvas, canvasElement }) => {
    const trigger = canvas.getByRole('button', { name: 'Project form actions' });
    const events = canvas.getByLabelText('Menu form events');
    await userEvent.click(trigger);
    await expect(events).toHaveAttribute('data-menu-submissions', '0');
    const original = window.location.href;
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Restricted documentation' }));
    await expect(window.location.href).toBe(original);
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Save project' }));
    await expect(events).toHaveAttribute('data-menu-submissions', '1');
    await expect(events).toHaveAttribute('data-menu-submitter', 'save');
    await expect(events.textContent).toBe('[["project","Orion"],["intent","save"]]');
    await assertMenuClosed(nativeMenuSurface(canvasElement, 'menu-form-surface'));
    await userEvent.click(trigger);
    const link = canvas.getByRole('menuitem', { name: 'Project documentation' });
    await expect(link.tagName).toBe('A');
    await userEvent.click(link);
    await expect(window.location.hash).toBe(link.getAttribute('href'));
    window.history.replaceState(null, '', original);
    await assertMenuClosed(nativeMenuSurface(canvasElement, 'menu-form-surface'));
  },
};

export const ControlledContextMenu: Story = {
  render: () => <MenuContextFlow />,
  play: async ({ canvas, canvasElement }) => {
    await userEvent.pointer({
      keys: '[MouseRight]',
      target: canvas.getByRole('button', { name: 'Project context actions' }),
    });
    const surface = nativeMenuSurface(canvasElement, 'menu-context-surface');
    await expect(surface.matches(':popover-open')).toBe(true);
    await userEvent.click(canvas.getByRole('menuitem', { name: 'Copy project link' }));
    await expect(canvas.getByLabelText('Menu context events')).toHaveAttribute(
      'data-menu-last-action',
      'copy-link',
    );
    await assertMenuClosed(surface);
  },
};
