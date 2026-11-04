// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { ComparisonProvider as CoreAIFluentProvider } from '../../../apps/storybook/src/stories/experiments/ComparisonProvider.js';
import {
  PickerOptions,
  StandaloneListboxFlow,
  listboxExamples,
} from '../../../apps/storybook/src/stories/experiments/OptionPickerComparison.js';
import {
  captureOptionPickerStyles,
  compareOptionPickerStyles,
  expectedOptionPickerMaxHeight,
  settleOptionPickerStyles,
} from '../../../apps/storybook/src/stories/experiments/compareOptionPickerStyles.js';
import { Listbox, listboxClassNames, type ListboxProps } from './Listbox.js';
import { Option, optionClassNames, type OptionProps, type OptionSlots } from './Option.js';
import {
  OptionGroup,
  optionGroupClassNames,
  type OptionGroupProps,
  type OptionGroupSlots,
} from './OptionGroup.js';
import {
  htmlElement,
  renderPickerPair,
} from '../../../apps/storybook/src/stories/experiments/OptionPickerTestUtils.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(listboxExamples)(`matches listbox/options/groups $name in ${mode}`, async (example) => {
    const { differences } = await renderPickerPair(example, theme);
    expect(differences()).toEqual([]);
  });

  test('matches enabled and disabled multiselect option hover in ' + mode, async () => {
    const { legacy, headless } = await renderPickerPair(
      {
        name: 'Hover options',
        kind: 'listbox',
        props: { multiselect: true, selectedOptions: ['alpha'] },
        grouped: true,
      },
      theme,
    );
    const previous = legacy.querySelectorAll<HTMLElement>('.fui-Option');
    const current = headless.querySelectorAll<HTMLElement>('.fui-Option');
    for (const index of [0, 1]) {
      await userEvent.hover(previous[index]);
      expect(previous[index].matches(':hover')).toBe(true);
      await settleOptionPickerStyles(legacy);
      const expected = captureOptionPickerStyles(legacy, legacy);
      await userEvent.hover(current[index]);
      expect(current[index].matches(':hover')).toBe(true);
      await settleOptionPickerStyles(headless);
      expect(
        compareOptionPickerStyles(expected, captureOptionPickerStyles(headless, headless)),
      ).toEqual([]);
    }
  });
}

test('default native Listbox never becomes visible merely because author styles load', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <Listbox aria-label="Native popup">
        <PickerOptions />
      </Listbox>
    </CoreAIFluentProvider>,
  );
  const popup = screen.container.querySelector('.fui-Listbox');
  if (!(popup instanceof HTMLElement)) throw new Error('Missing native Listbox');
  expect(popup.getAttribute('popover')).toBe('auto');
  expect(popup.matches(':popover-open')).toBe(false);
  expect(getComputedStyle(popup).display).toBe('none');
  expect(popup.getBoundingClientRect().width).toBe(0);
  popup.showPopover();
  expect(popup.matches(':popover-open')).toBe(true);
  expect(getComputedStyle(popup).display).toBe('flex');
  expect(getComputedStyle(popup).borderTopWidth).toBe('0px');
  popup.hidePopover();
  expect(popup.matches(':popover-open')).toBe(false);
  expect(getComputedStyle(popup).display).toBe('none');
});

test('native ref opening preserves public keyboard selection and disabled options', async () => {
  const onOptionSelect = vi.fn<NonNullable<ListboxProps['onOptionSelect']>>();
  const screen = await render(
    <CoreAIFluentProvider>
      <StandaloneListboxFlow onOptionSelect={onOptionSelect} />
    </CoreAIFluentProvider>,
  );
  const opener = screen.getByRole('button', { name: 'Open project list' });
  await userEvent.click(opener);
  await userEvent.hover(opener);
  const listbox = screen.getByRole('listbox', { name: 'Project catalog' });
  const root = htmlElement(listbox);
  expect(root.getAttribute('popover')).toBe('auto');
  expect(root.matches(':popover-open')).toBe(true);
  expect(getComputedStyle(root).display).toBe('flex');
  await expect.element(listbox).toHaveFocus();
  await userEvent.keyboard('{Home}{ArrowDown}');
  const disabledId = root.getAttribute('aria-activedescendant');
  const disabledOption = document.getElementById(disabledId ?? '');
  expect(disabledOption).toHaveAttribute('aria-disabled', 'true');
  await userEvent.keyboard('{Enter}');
  expect(onOptionSelect).not.toHaveBeenCalled();
  await userEvent.keyboard('{ArrowDown}{Enter}');
  expect(onOptionSelect).toHaveBeenLastCalledWith(expect.anything(), {
    optionValue: 'gamma',
    optionText: 'Gamma',
    selectedOptions: ['gamma'],
  });
  await expect
    .element(screen.getByRole('option', { name: 'Gamma', exact: true }))
    .toHaveAttribute('aria-selected', 'true');
  const activeOption = htmlElement(screen.getByRole('option', { name: 'Gamma', exact: true }));
  expect(activeOption).toHaveAttribute('data-activedescendant-focusvisible');
  expect(getComputedStyle(activeOption, '::after').borderTopWidth).toBe('2px');
  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'After project list' })).toHaveFocus();
});

test('multiselect checkmarks follow current context selection and exact toggle payloads', async () => {
  const onOptionSelect = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <StandaloneListboxFlow multiselect onOptionSelect={onOptionSelect} />
    </CoreAIFluentProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Open project list' }));
  const first = screen.getByRole('menuitemcheckbox', { name: 'Alpha', exact: true });
  const next = screen.getByRole('menuitemcheckbox', { name: 'Gamma', exact: true });
  await userEvent.click(first);
  await userEvent.click(next);
  expect(onOptionSelect).toHaveBeenLastCalledWith(expect.anything(), {
    optionValue: 'gamma',
    optionText: 'Gamma',
    selectedOptions: ['alpha', 'gamma'],
  });
  await expect.element(first).toHaveAttribute('aria-checked', 'true');
  const check = htmlElement(first).querySelector('.fui-Option__checkIcon');
  if (!check) throw new Error('Missing multiselect indicator');
  expect(check).toHaveAttribute('data-multiselect', '');
  expect(check).toHaveAttribute('data-selected', '');
  expect(check.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 12 12');
  await userEvent.click(first);
  expect(onOptionSelect).toHaveBeenLastCalledWith(expect.anything(), {
    optionValue: 'alpha',
    optionText: 'Alpha',
    selectedOptions: ['gamma'],
  });
  expect(check.querySelector('svg')).toBeNull();
  expect(getComputedStyle(check).visibility).toBe('visible');
});

test('controlled selectedOptions remain authoritative and disabled options block caller activation', async () => {
  const onOptionSelect = vi.fn();
  const onDisabledClick = vi.fn();
  const listRef = React.createRef<HTMLDivElement>();
  const screen = await render(
    <CoreAIFluentProvider>
      <Listbox
        ref={listRef}
        aria-label="Controlled list"
        selectedOptions={['alpha']}
        onOptionSelect={onOptionSelect}
      >
        <Option value="alpha">Alpha</Option>
        <Option value="beta" disabled onClick={onDisabledClick}>
          Beta
        </Option>
        <Option value="gamma">Gamma</Option>
      </Listbox>
    </CoreAIFluentProvider>,
  );
  listRef.current?.showPopover();
  await userEvent.click(screen.getByRole('option', { name: 'Gamma', exact: true }));
  expect(onOptionSelect).toHaveBeenLastCalledWith(expect.anything(), {
    optionValue: 'gamma',
    optionText: 'Gamma',
    selectedOptions: ['gamma'],
  });
  await expect
    .element(screen.getByRole('option', { name: 'Alpha', exact: true }))
    .toHaveAttribute('aria-selected', 'true');
  await expect
    .element(screen.getByRole('option', { name: 'Gamma', exact: true }))
    .toHaveAttribute('aria-selected', 'false');
  await userEvent.click(screen.getByRole('option', { name: 'Beta', exact: true }), { force: true });
  expect(onDisabledClick).not.toHaveBeenCalled();
  expect(onOptionSelect).toHaveBeenCalledTimes(1);
});

test('preserves native root props, refs, and valid check/label render functions', async () => {
  const listRef = React.createRef<HTMLDivElement>();
  const optionRef = React.createRef<HTMLDivElement>();
  const groupRef = React.createRef<HTMLDivElement>();
  const checkRef = React.createRef<HTMLSpanElement>();
  const labelRef = React.createRef<HTMLSpanElement>();
  type CheckProps = ExtractSlotProps<OptionSlots['checkIcon']>;
  type LabelProps = ExtractSlotProps<OptionGroupSlots['label']>;
  const checkRender: SlotRenderFunction<CheckProps> = (Component, props) => (
    <Component {...props} data-custom-check="">
      ✓
    </Component>
  );
  const labelRender: SlotRenderFunction<LabelProps> = (Component, props) => (
    <Component {...props} data-custom-label="">
      Workspace group
    </Component>
  );
  const screen = await render(
    <CoreAIFluentProvider>
      <Listbox
        ref={listRef}
        aria-label="Custom list"
        defaultSelectedOptions={['workspace']}
        className="consumer-list"
      >
        <OptionGroup
          ref={groupRef}
          className="consumer-group"
          data-custom-group=""
          label={{ ref: labelRef, className: 'consumer-label', children: labelRender }}
        >
          <Option
            ref={optionRef}
            text="Workspace"
            value="workspace"
            className="consumer-option"
            checkIcon={{ ref: checkRef, className: 'consumer-check', children: checkRender }}
          >
            <strong>Workspace</strong>
            <span>With rich content</span>
          </Option>
          <Option value="empty-check" checkIcon={{ children: false }}>
            No glyph
          </Option>
        </OptionGroup>
      </Listbox>
    </CoreAIFluentProvider>,
  );
  listRef.current?.showPopover();
  expect(listRef.current).toBe(screen.getByRole('listbox', { name: 'Custom list' }).element());
  expect(listRef.current).toHaveClass(listboxClassNames.root, 'consumer-list');
  expect(optionRef.current).toHaveClass(optionClassNames.root, 'consumer-option');
  expect(groupRef.current).toHaveClass(optionGroupClassNames.root, 'consumer-group');
  expect(groupRef.current).toHaveAttribute('data-custom-group', '');
  expect(groupRef.current).toBe(screen.getByRole('group', { name: 'Workspace group' }).element());
  expect(checkRef.current).toHaveClass(optionClassNames.checkIcon, 'consumer-check');
  expect(checkRef.current).toHaveAttribute('data-custom-check', '');
  expect(checkRef.current?.textContent).toBe('✓');
  expect(labelRef.current).toHaveClass(optionGroupClassNames.label, 'consumer-label');
  expect(labelRef.current).toHaveAttribute('data-custom-label', '');
  expect(groupRef.current?.getAttribute('aria-labelledby')).toBe(labelRef.current?.id);
  expect(
    htmlElement(screen.getByRole('option', { name: 'No glyph' })).querySelector('svg'),
  ).toBeNull();
});

test('groups without a visible label preserve their explicit accessible name', async () => {
  const listRef = React.createRef<HTMLDivElement>();
  const screen = await render(
    <CoreAIFluentProvider>
      <Listbox ref={listRef} aria-label="Groups">
        <OptionGroup aria-label="Unlabelled visual group">
          <Option>Alpha</Option>
        </OptionGroup>
      </Listbox>
    </CoreAIFluentProvider>,
  );
  listRef.current?.showPopover();
  const group = screen.getByRole('group', { name: 'Unlabelled visual group' });
  await expect.element(group).toBeVisible();
  expect(htmlElement(group).querySelector('.fui-OptionGroup__label')).toBeNull();
});

test('public compound components expose current ForwardRefComponent contracts', () => {
  expectTypeOf(Listbox).toMatchTypeOf<ForwardRefComponent<ListboxProps>>();
  expectTypeOf(Option).toMatchTypeOf<ForwardRefComponent<OptionProps>>();
  expectTypeOf(OptionGroup).toMatchTypeOf<ForwardRefComponent<OptionGroupProps>>();
});

test('native sizing classification never accepts altered CSS limits or popup clipping', () => {
  const legacy = {
    'popup.max-height': `${(window.innerHeight * 4) / 5 + 100}px`,
    'popup.rect.width': '280',
    'popup.rect.height': '221',
  };
  const native = { ...legacy, 'popup.max-height': `${(window.innerHeight * 4) / 5}px` };
  expect(compareOptionPickerStyles(legacy, native)).toEqual([
    {
      property: 'popup.max-height',
      legacy: `${(window.innerHeight * 4) / 5 + 100}px`,
      headless: `${(window.innerHeight * 4) / 5}px`,
      kind: 'native-sizing',
    },
  ]);
  expect(
    compareOptionPickerStyles(legacy, { ...native, 'popup.max-height': '799.5px' }).every(
      (difference) => difference.kind === 'unexpected',
    ),
  ).toBe(true);
  expect(
    compareOptionPickerStyles(legacy, { ...native, 'popup.rect.height': '221.5' }).every(
      (difference) => difference.kind === 'unexpected',
    ),
  ).toBe(true);
});

test('80vh expectations retain exact CSS serialization at the browser runner height', () => {
  expect(expectedOptionPickerMaxHeight(896)).toBe('716.8px');
});
