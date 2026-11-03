// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import * as primitive from '@fluentui/react-headless-components-preview/tag-picker';
import {
  coreaiDarkTheme,
  coreaiLightTheme,
  type PositioningImperativeRef,
} from '@coreai-ds/react-components';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import { ChevronDownRegular } from '@fluentui/react-icons/headless/svg/chevron-down';
import { supportsFocusGroup } from '@microsoft/focusgroup-polyfill';
import { renderCoreAIComponent } from '../../react-components/src/test-utils.js';
import { FocusgroupConsumer } from '../../../apps/storybook/src/stories/experiments/FocusgroupConsumer.js';
import {
  getTagPickerPerson,
  tagPickerAppearances,
  tagPickerConsumerExample,
  tagPickerExamples,
  tagPickerPeople,
  type TagPickerExample,
} from '../../../apps/storybook/src/stories/experiments/TagPickerComparison.js';
import {
  TagPickerCustomValuesFlow,
  TagPickerNativeFormFlow,
  TagPickerSelectionFlow,
} from '../../../apps/storybook/src/stories/experiments/TagPickerFlows.js';
import {
  captureTagPickerNativeContract,
  captureTagPickerStyles,
  compareTagPickerStyles,
  getTagPickerTrigger,
  settleTagPickerStyles,
  tagPickerHTML,
} from '../../../apps/storybook/src/stories/experiments/compareTagPickerStyles.js';
import {
  renderTagPickerPair,
  tagPickerLocatorHTML,
  tagPickerLocatorInput,
} from '../../../apps/storybook/src/stories/experiments/TagPickerTestUtils.js';
import {
  TagPicker,
  useTagPickerContext_unstable,
  useTagPickerContextValues,
  useTagPickerFilter,
  type TagPickerProps,
} from './TagPicker.js';
import {
  TagPickerControl,
  tagPickerControlClassNames,
  type TagPickerControlProps,
  type TagPickerControlSlots,
} from './TagPickerControl.js';
import {
  TagPickerGroup,
  tagPickerGroupClassNames,
  useTagPickerGroupContextValues,
  type TagPickerGroupProps,
} from './TagPickerGroup.js';
import {
  TagPickerInput,
  tagPickerInputClassNames,
  type TagPickerInputProps,
} from './TagPickerInput.js';
import {
  TagPickerButton,
  tagPickerButtonClassNames,
  type TagPickerButtonProps,
} from './TagPickerButton.js';
import {
  TagPickerList,
  tagPickerListClassNames,
  type TagPickerListProps,
} from './TagPickerList.js';
import {
  TagPickerOption,
  tagPickerOptionClassNames,
  type TagPickerOptionProps,
  type TagPickerOptionSlots,
} from './TagPickerOption.js';
import {
  TagPickerOptionGroup,
  tagPickerOptionGroupClassNames,
  type TagPickerOptionGroupProps,
  type TagPickerOptionGroupSlots,
} from './TagPickerOptionGroup.js';
import { Tag } from './Tag.js';
import { TagGroup } from './TagGroup.js';
import { Field } from './Field.js';
import { Option } from './Option.js';
import { OptionGroup } from './OptionGroup.js';
import { Combobox } from './Combobox.js';
import { Listbox } from './Listbox.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(tagPickerExamples)(
    `matches $name across every public visual member in ${mode}`,
    async (example) => {
      const { legacy, headless, headlessPopup, unexpected } = await renderTagPickerPair(
        example,
        theme,
      );
      expect(unexpected()).toEqual([]);
      expect(headless).toHaveClass(tagPickerControlClassNames.root);
      expect(getTagPickerTrigger(headless).tagName).toBe(getTagPickerTrigger(legacy).tagName);
      if (headlessPopup) {
        const contract = captureTagPickerNativeContract(headless, headlessPopup);
        expect(contract.popover).toBe('auto');
        expect(contract.open).toBe('true');
        expect(contract.position).toBe('fixed');
        expect(contract.positionAnchor).toBe(contract.anchor);
        expect(headlessPopup).toHaveClass(tagPickerListClassNames.root, 'fui-Listbox');
        expect(headlessPopup.querySelectorAll('.fui-Option__checkIcon').length).toBe(0);
      }
      const tags = headless.querySelectorAll<HTMLElement>('[data-tagpicker-part="tag"]');
      expect(tags.length).toBe(example.selected?.length ?? 0);
      if (tags.length > 0) {
        const group = headless.querySelector('.fui-TagPickerGroup');
        expect(group).toHaveAttribute('role', 'toolbar');
        expect(group).toHaveAttribute('focusgroup', 'toolbar inline wrap');
      }
    },
  );

  test.each(tagPickerAppearances)(
    `matches %s pointer, keyboard focus and combined interaction styling in ${mode}`,
    async (appearance) => {
      const { screen, legacy, headless } = await renderTagPickerPair(
        { name: 'Interactive chrome', props: { appearance }, selected: ['ada'] },
        theme,
      );
      const previous = getTagPickerTrigger(legacy);
      const current = getTagPickerTrigger(headless);
      await userEvent.hover(previous);
      expect(legacy.matches(':hover')).toBe(true);
      await settleTagPickerStyles(legacy);
      const hovered = captureTagPickerStyles(legacy, null);
      await userEvent.hover(current);
      expect(headless.matches(':hover')).toBe(true);
      await settleTagPickerStyles(headless);
      expect(compareTagPickerStyles(hovered, captureTagPickerStyles(headless, null))).toEqual([]);
      await userEvent.hover(screen.getByTestId('tagpicker-pointer-rest'));
      previous.focus();
      await settleTagPickerStyles(legacy);
      const focused = captureTagPickerStyles(legacy, null);
      current.focus();
      expect(headless.matches(':hover')).toBe(false);
      await settleTagPickerStyles(headless);
      expect(compareTagPickerStyles(focused, captureTagPickerStyles(headless, null))).toEqual([]);
      previous.focus();
      await userEvent.hover(previous);
      await settleTagPickerStyles(legacy);
      const combined = captureTagPickerStyles(legacy, null);
      current.focus();
      await userEvent.hover(current);
      await settleTagPickerStyles(headless);
      expect(compareTagPickerStyles(combined, captureTagPickerStyles(headless, null))).toEqual([]);
    },
  );

  test(`preserves the upstream disabled-invalid hover priority in ${mode}`, async () => {
    const { legacy, headless } = await renderTagPickerPair(
      {
        name: 'Disabled invalid',
        props: { disabled: true, appearance: 'outline' },
        selected: ['ada'],
        field: { validationState: 'error' },
      },
      theme,
    );
    await userEvent.hover(legacy);
    await settleTagPickerStyles(legacy);
    const expected = captureTagPickerStyles(legacy, null);
    await userEvent.hover(headless);
    expect(headless.matches(':hover')).toBe(true);
    await settleTagPickerStyles(headless);
    expect(compareTagPickerStyles(expected, captureTagPickerStyles(headless, null))).toEqual([]);
  });

  test(`preserves ordinary consumer class priority in ${mode}`, async () => {
    const { headless, headlessPopup, unexpected } = await renderTagPickerPair(
      tagPickerConsumerExample,
      theme,
    );
    expect(unexpected()).toEqual([]);
    expect(getComputedStyle(headless).minWidth).toBe('280px');
    expect(getComputedStyle(headless).borderRadius).toBe('3px');
    expect(getComputedStyle(getTagPickerTrigger(headless)).color).toBe('rgb(90, 40, 130)');
    expect(headlessPopup).not.toBeNull();
    expect(
      getComputedStyle(tagPickerHTML(headlessPopup?.querySelector('.fui-TagPickerOption') ?? null))
        .color,
    ).toBe('rgb(90, 40, 130)');
  });
}

test.each([true, false])(
  'distinguishes omitted and explicit undefined appearance with CoreAI defaults=%s',
  async (enabled) => {
    const cases: [NonNullable<TagPickerExample['props']>, string][] = [
      [{}, enabled ? 'filled-darker' : 'outline'],
      [{ appearance: undefined, size: undefined }, 'outline'],
      [{ appearance: 'filled-lighter', size: 'large' }, 'filled-lighter'],
    ];
    for (const [props, expected] of cases) {
      const example: TagPickerExample = { name: 'Default resolution', props, selected: ['ada'] };
      const { headless, unexpected } = await renderTagPickerPair(
        example,
        coreaiLightTheme,
        enabled,
      );
      expect(unexpected()).toEqual([]);
      expect(headless).toHaveAttribute('data-appearance', expected);
      expect(headless).toHaveAttribute('data-size', props.size ?? 'medium');
      const tag = headless.querySelector('.fui-Tag');
      expect(tag).toHaveAttribute(
        'data-appearance',
        expected === 'filled-darker' ? 'outline' : 'filled',
      );
      expect(tag).toHaveAttribute('data-size', props.size === 'large' ? 'small' : 'extra-small');
      await cleanup();
    }
  },
);

test.each([
  'outline, medium',
  'Wrapped selected tags',
  'Secondary action',
  'Open grouped options',
  'Open media and secondary content, large',
  'Button trigger, extra-large',
])('keeps logical RTL styles and exact geometry for %s', async (name) => {
  const example = tagPickerExamples.find((candidate) => candidate.name === name);
  if (!example) throw new Error(`Unknown TagPicker fixture ${name}`);
  const { unexpected } = await renderTagPickerPair(example, coreaiLightTheme, true, 'rtl');
  expect(unexpected()).toEqual([]);
});

test('exposes only the current public context/filter helpers and typed slot/ref contracts', () => {
  expect(useTagPickerFilter).toBe(primitive.useTagPickerFilter);
  expect(useTagPickerContext_unstable).toBe(primitive.useTagPickerContext_unstable);
  expect(useTagPickerContextValues).toBe(primitive.useTagPickerContextValues);
  expect(useTagPickerGroupContextValues).toBe(primitive.useTagPickerGroupContextValues);
  expectTypeOf(TagPickerControl).toMatchTypeOf<ForwardRefComponent<TagPickerControlProps>>();
  expectTypeOf(TagPickerGroup).toMatchTypeOf<ForwardRefComponent<TagPickerGroupProps>>();
  expectTypeOf(TagPickerInput).toMatchTypeOf<ForwardRefComponent<TagPickerInputProps>>();
  expectTypeOf(TagPickerButton).toMatchTypeOf<ForwardRefComponent<TagPickerButtonProps>>();
  expectTypeOf(TagPickerList).toMatchTypeOf<ForwardRefComponent<TagPickerListProps>>();
  expectTypeOf(TagPickerOption).toMatchTypeOf<ForwardRefComponent<TagPickerOptionProps>>();
  expectTypeOf(TagPickerOptionGroup).toMatchTypeOf<
    ForwardRefComponent<TagPickerOptionGroupProps>
  >();
  expectTypeOf<TagPickerProps>().not.toHaveProperty('inline');
  expectTypeOf<TagPickerProps>().not.toHaveProperty('value');
  expectTypeOf<TagPickerProps>().not.toHaveProperty('defaultValue');
  expectTypeOf<TagPickerProps>().not.toHaveProperty('multiselect');
  expectTypeOf<TagPickerProps>().not.toHaveProperty('ref');
  expectTypeOf<TagPickerProps>().not.toHaveProperty('label');
  expectTypeOf<TagPickerInputProps>().not.toHaveProperty('children');
  expectTypeOf<TagPickerInputProps>().not.toHaveProperty('defaultValue');
  expectTypeOf<TagPickerOptionProps>().not.toHaveProperty('checkIcon');
  expect('TagPickerProvider' in primitive).toBe(false);
});

test('preserves selected group visual inheritance, explicit child choices and the Field size boundary', async () => {
  const screen = await renderCoreAIComponent(
    <FocusgroupConsumer>
      <Field size="small" label="Assigned reviewers">
        <TagPicker size="extra-large" appearance="filled-darker" selectedOptions={['ada', 'grace']}>
          <TagPickerControl data-testid="control">
            <TagPickerGroup aria-label="Assigned tags">
              <Tag as="button" value="ada" data-testid="inherited">
                Ada
              </Tag>
              <Tag as="button" value="grace" data-testid="explicit" size="small" appearance="brand">
                Grace
              </Tag>
            </TagPickerGroup>
            <TagPickerInput />
          </TagPickerControl>
          <TagPickerList>
            <TagPickerOption value="linus">Linus</TagPickerOption>
          </TagPickerList>
        </TagPicker>
      </Field>
    </FocusgroupConsumer>,
  );
  await expect.element(screen.getByTestId('control')).toHaveAttribute('data-size', 'extra-large');
  await expect.element(screen.getByTestId('inherited')).toHaveAttribute('data-size', 'medium');
  await expect
    .element(screen.getByTestId('inherited'))
    .toHaveAttribute('data-appearance', 'outline');
  await expect.element(screen.getByTestId('explicit')).toHaveAttribute('data-size', 'small');
  await expect.element(screen.getByTestId('explicit')).toHaveAttribute('data-appearance', 'brand');
  await expect
    .element(screen.getByRole('combobox', { name: 'Assigned reviewers' }))
    .toHaveAttribute('data-size', 'extra-large');
});

test('preserves native refs, consumer classes/data, primitive slot metadata and public slot render functions', async () => {
  const controlRef = React.createRef<HTMLDivElement>();
  const groupRef = React.createRef<HTMLDivElement>();
  const inputRef = React.createRef<HTMLInputElement>();
  const listRef = React.createRef<HTMLDivElement>();
  const optionRef = React.createRef<HTMLDivElement>();
  const optionGroupRef = React.createRef<HTMLDivElement>();
  const labelRef = React.createRef<HTMLSpanElement>();
  const mediaRef = React.createRef<HTMLDivElement>();
  const secondaryRef = React.createRef<HTMLSpanElement>();
  const expandRef = React.createRef<HTMLSpanElement>();
  const expand: SlotRenderFunction<ExtractSlotProps<TagPickerControlSlots['expandIcon']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-rendered-expand>
      <ChevronDownRegular aria-hidden data-custom-expand />
    </Component>
  );
  const label: SlotRenderFunction<ExtractSlotProps<TagPickerOptionGroupSlots['label']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-rendered-label>
      Team
    </Component>
  );
  const secondary: SlotRenderFunction<
    ExtractSlotProps<TagPickerOptionSlots['secondaryContent']>
  > = (Component, props) => (
    <Component {...props} data-rendered-secondary>
      Reviewer
    </Component>
  );
  const media: SlotRenderFunction<ExtractSlotProps<TagPickerOptionSlots['media']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-rendered-media>
      <span aria-hidden>AL</span>
    </Component>
  );
  const action: SlotRenderFunction<ExtractSlotProps<TagPickerControlSlots['secondaryAction']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-rendered-action>
      <button type="button">Action</button>
    </Component>
  );
  const screen = await renderCoreAIComponent(
    <FocusgroupConsumer>
      <div data-testid="tagpicker-slot-pointer-rest">Pointer rest</div>
      <TagPicker defaultOpen selectedOptions={['ada']} size="large">
        <TagPickerControl
          ref={controlRef}
          className="caller-control"
          data-consumer="control"
          expandIcon={{ ref: expandRef, className: 'caller-expand', children: expand }}
          secondaryAction={{ children: action }}
        >
          <TagPickerGroup ref={groupRef} aria-label="Ref tags" className="caller-group">
            <Tag as="button" value="ada">
              Ada
            </Tag>
          </TagPickerGroup>
          <TagPickerInput
            ref={inputRef}
            aria-label="Ref query"
            className="caller-input"
            data-consumer="input"
          />
        </TagPickerControl>
        <TagPickerList
          ref={listRef}
          aria-label="Ref suggestions"
          className="caller-list"
          data-consumer="list"
        >
          <TagPickerOptionGroup
            ref={optionGroupRef}
            className="caller-option-group"
            label={{ ref: labelRef, className: 'caller-label', children: label }}
          >
            <TagPickerOption
              value="ada"
              text="Ada"
              ref={optionRef}
              className="caller-option"
              data-consumer="option"
              media={{ ref: mediaRef, className: 'caller-media', children: media }}
              secondaryContent={{
                ref: secondaryRef,
                className: 'caller-secondary',
                children: secondary,
              }}
            >
              Ada
            </TagPickerOption>
          </TagPickerOptionGroup>
        </TagPickerList>
      </TagPicker>
    </FocusgroupConsumer>,
  );
  await expect.element(screen.getByRole('listbox', { name: 'Ref suggestions' })).toBeVisible();
  await userEvent.hover(screen.getByTestId('tagpicker-slot-pointer-rest'));
  expect(inputRef.current).toBe(screen.getByRole('combobox', { name: 'Ref query' }).element());
  expect(groupRef.current).toBe(screen.getByRole('toolbar', { name: 'Ref tags' }).element());
  expect(listRef.current).toBe(screen.getByRole('listbox', { name: 'Ref suggestions' }).element());
  expect(optionGroupRef.current).toBe(screen.getByRole('group', { name: 'Team' }).element());
  expect(controlRef.current).toHaveClass(tagPickerControlClassNames.root, 'caller-control');
  expect(groupRef.current).toHaveClass(
    tagPickerGroupClassNames.root,
    'fui-TagGroup',
    'caller-group',
  );
  expect(inputRef.current).toHaveClass(tagPickerInputClassNames.root, 'caller-input');
  expect(listRef.current).toHaveClass(tagPickerListClassNames.root, 'fui-Listbox', 'caller-list');
  expect(optionRef.current).toHaveClass(
    tagPickerOptionClassNames.root,
    'fui-Option',
    'caller-option',
  );
  expect(optionRef.current?.tagName).toBe('DIV');
  expect(optionRef.current).toHaveAttribute('data-consumer', 'option');
  expect(optionRef.current).toHaveAttribute('data-selected');
  expect(optionGroupRef.current).toHaveClass(
    tagPickerOptionGroupClassNames.root,
    'fui-OptionGroup',
  );
  expect(labelRef.current).toHaveClass(
    tagPickerOptionGroupClassNames.label,
    'fui-OptionGroup__label',
    'caller-label',
  );
  expect(labelRef.current?.tagName).toBe('SPAN');
  expect(labelRef.current).toHaveAttribute('data-rendered-label');
  expect(mediaRef.current).toHaveClass(tagPickerOptionClassNames.media, 'caller-media');
  expect(mediaRef.current?.tagName).toBe('DIV');
  expect(mediaRef.current).toHaveAttribute('data-rendered-media');
  expect(secondaryRef.current).toHaveClass(
    tagPickerOptionClassNames.secondaryContent,
    'caller-secondary',
  );
  expect(secondaryRef.current?.tagName).toBe('SPAN');
  expect(secondaryRef.current).toHaveAttribute('data-rendered-secondary');
  expect(expandRef.current).toHaveClass(tagPickerControlClassNames.expandIcon, 'caller-expand');
  expect(expandRef.current).toHaveAttribute('data-rendered-expand');
  expect(expandRef.current?.querySelectorAll('[data-custom-expand]').length).toBe(1);
  expect(controlRef.current?.querySelector('[data-rendered-action]')).not.toBeNull();
  expect(inputRef.current?.children.length).toBe(0);
});

test('null, empty and custom expand glyphs preserve their distinct slot contracts', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <div data-testid="tagpicker-glyph-pointer-rest">Pointer rest</div>
      {(['default', 'null', 'empty', 'custom', 'no-popover'] as const).map((kind) => (
        <TagPicker key={kind} noPopover={kind === 'no-popover'} selectedOptions={[]}>
          <TagPickerControl
            data-testid={kind}
            expandIcon={
              kind === 'null'
                ? null
                : kind === 'empty'
                  ? { children: '' }
                  : kind === 'custom'
                    ? { children: <ChevronDownRegular data-caller-glyph /> }
                    : undefined
            }
          >
            <TagPickerInput aria-label={kind} />
          </TagPickerControl>
          {kind !== 'no-popover' && (
            <TagPickerList>
              <TagPickerOption value="other">Other</TagPickerOption>
            </TagPickerList>
          )}
        </TagPicker>
      ))}
    </>,
  );
  await userEvent.hover(screen.getByTestId('tagpicker-glyph-pointer-rest'));
  expect(tagPickerLocatorHTML(screen.getByTestId('default')).querySelectorAll('svg').length).toBe(
    1,
  );
  expect(
    tagPickerLocatorHTML(screen.getByTestId('null')).querySelector(
      '.fui-TagPickerControl__expandIcon',
    ),
  ).toBeNull();
  const empty = tagPickerLocatorHTML(screen.getByTestId('empty')).querySelector(
    '.fui-TagPickerControl__expandIcon',
  );
  expect(empty).not.toBeNull();
  expect(empty?.childNodes.length).toBe(0);
  expect(
    tagPickerLocatorHTML(screen.getByTestId('custom')).querySelectorAll('[data-caller-glyph]')
      .length,
  ).toBe(1);
  expect(
    tagPickerLocatorHTML(screen.getByTestId('no-popover')).querySelector(
      '.fui-TagPickerControl__aside',
    ),
  ).toBeNull();
});

test('composed family overrides survive all completed foundations being loaded together', async () => {
  const screen = await renderCoreAIComponent(
    <FocusgroupConsumer>
      <TagPicker size="extra-large" selectedOptions={['ada']} defaultOpen>
        <TagPickerControl>
          <TagPickerGroup aria-label="Composed selected">
            <Tag as="button" value="ada">
              Ada
            </Tag>
          </TagPickerGroup>
          <TagPickerInput aria-label="Composed picker" />
        </TagPickerControl>
        <TagPickerList aria-label="Composed suggestions">
          <TagPickerOption
            value="grace"
            aria-label="Composed Grace"
            secondaryContent="Engineer"
            media={<span>GH</span>}
          >
            Grace
          </TagPickerOption>
        </TagPickerList>
      </TagPicker>
      <TagGroup aria-label="Foundation tags">
        <Tag>Tag</Tag>
      </TagGroup>
      <Combobox aria-label="Foundation combobox">
        <Option value="base">Base</Option>
      </Combobox>
      <Listbox aria-label="Closed foundation list">
        <OptionGroup label="Base">
          <Option value="other">Other</Option>
        </OptionGroup>
      </Listbox>
    </FocusgroupConsumer>,
  );
  const group = screen.getByRole('toolbar', { name: 'Composed selected' });
  expect(getComputedStyle(tagPickerLocatorHTML(group)).columnGap).toBe('8px');
  const option = screen.getByRole('option', { name: 'Composed Grace' });
  const root = tagPickerLocatorHTML(option);
  expect(getComputedStyle(root).display).toBe('grid');
  expect(root.querySelector('.fui-Option__checkIcon')).toBeNull();
});

test('does not tolerate geometry, offsets or CSS differences under the native maximum classification', () => {
  const legacy = {
    'popup.max-height': '400px',
    'popup.rect.width': '304',
    'popup.rect.height': '180',
    'popup.offset.block': '0',
    'control.color': 'rgb(0, 0, 0)',
  };
  const current = { ...legacy, 'popup.max-height': `${(window.innerHeight * 4) / 5}px` };
  expect(compareTagPickerStyles(legacy, current).map(({ kind }) => kind)).toEqual([
    'native-maximum',
  ]);
  const width = compareTagPickerStyles(legacy, { ...current, 'popup.rect.width': '304.01' });
  expect(width.map(({ kind }) => kind)).toEqual(['unexpected', 'unexpected']);
  const offset = compareTagPickerStyles(legacy, { ...current, 'popup.offset.block': '0.01' });
  expect(offset.find(({ property }) => property === 'popup.offset.block')?.kind).toBe('unexpected');
  const color = compareTagPickerStyles(legacy, { ...current, 'control.color': 'rgb(1, 0, 0)' });
  expect(color.find(({ property }) => property === 'control.color')?.kind).toBe('unexpected');
});

test.each([false, true])(
  'filters real typed queries and preserves exact multiple-selection payloads with groups=%s',
  async (grouped) => {
    const queries: { value: string; type: string; target: EventTarget | null }[] = [];
    const onOptionSelect = vi.fn<NonNullable<TagPickerProps['onOptionSelect']>>();
    const onOpenChange = vi.fn<NonNullable<TagPickerProps['onOpenChange']>>();
    const screen = await renderCoreAIComponent(
      <TagPickerSelectionFlow
        grouped={grouped}
        onChange={(event) =>
          queries.push({ value: event.target.value, type: event.type, target: event.target })
        }
        onOptionSelect={onOptionSelect}
        onOpenChange={onOpenChange}
      />,
    );
    const input = screen.getByRole('combobox', { name: 'Find reviewers' });
    const nativeInput = tagPickerLocatorInput(input);
    await userEvent.click(input);
    if (grouped) {
      await expect.element(screen.getByRole('group', { name: 'Research' })).toBeVisible();
      await expect.element(screen.getByRole('group', { name: 'Engineering' })).toBeVisible();
    }
    await userEvent.type(input, 'Gra');
    expect(queries.map(({ value, type }) => ({ value, type }))).toEqual([
      { value: 'G', type: 'change' },
      { value: 'Gr', type: 'change' },
      { value: 'Gra', type: 'change' },
    ]);
    expect(queries.every(({ target }) => target === nativeInput)).toBe(true);
    await expect
      .element(screen.getByRole('option', { name: 'Ada Lovelace' }))
      .not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: 'Grace Hopper' }));
    expect(onOptionSelect).toHaveBeenCalledTimes(1);
    const [event, data] = onOptionSelect.mock.calls[0];
    expect(data.event).toBe(event);
    expect(data.type).toBe('click');
    expect(data.value).toBe('grace');
    expect(data.selectedOptions).toEqual(['grace']);
    expect(Object.keys(data).sort()).toEqual(['event', 'selectedOptions', 'type', 'value']);
    const record = screen.getByLabelText('Reviewer selection');
    await expect.element(record).toHaveAttribute('data-tagpicker-selected', '["grace"]');
    await expect.element(record).toHaveAttribute('data-tagpicker-event-previous', '[]');
    await expect.element(input).toHaveValue('');
    await expect.element(input).toHaveAttribute('aria-expanded', 'false');
    await userEvent.type(input, 'Ada');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onOptionSelect).toHaveBeenCalledTimes(2);
    const [keyboardEvent, keyboardData] = onOptionSelect.mock.calls[1];
    expect(keyboardData.event).toBe(keyboardEvent);
    expect(keyboardData.type).toBe('keydown');
    expect(keyboardData.value).toBe('ada');
    expect(keyboardData.selectedOptions).toEqual(['grace', 'ada']);
    await expect.element(record).toHaveAttribute('data-tagpicker-selected', '["grace","ada"]');
    await expect.element(record).toHaveAttribute('data-tagpicker-event-previous', '["grace"]');
    for (const [openEvent, openData] of onOpenChange.mock.calls) {
      expect(openData.event).toBe(openEvent);
      expect(openData.type).toBe(openEvent.type);
      expect(Object.keys(openData).sort()).toEqual(['event', 'open', 'type']);
    }
  },
);

test('keeps disabled and empty results unselectable without manufacturing freeform selections', async () => {
  const onOptionSelect = vi.fn<NonNullable<TagPickerProps['onOptionSelect']>>();
  const screen = await renderCoreAIComponent(
    <TagPickerSelectionFlow onOptionSelect={onOptionSelect} />,
  );
  const input = screen.getByRole('combobox', { name: 'Find reviewers' });
  await userEvent.click(input);
  await userEvent.type(input, 'zzzz');
  const empty = screen.getByRole('option', { name: 'No matching reviewers' });
  await expect.element(empty).toHaveAttribute('aria-disabled', 'true');
  await userEvent.keyboard('{ArrowDown}{Enter}');
  expect(onOptionSelect).not.toHaveBeenCalled();
  await expect.element(input).toHaveValue('zzzz');
  await userEvent.clear(input);
  await userEvent.type(input, 'Margaret');
  const disabled = screen.getByRole('option', { name: 'Margaret Hamilton' });
  await expect.element(disabled).toHaveAttribute('data-disabled');
  await expect.element(disabled).toHaveAttribute('aria-disabled', 'true');
  // Bypass runner actionability to exercise the aria-disabled div's actual click guard.
  await userEvent.click(disabled, { force: true });
  expect(onOptionSelect).not.toHaveBeenCalled();
  await userEvent.keyboard('{ArrowDown}{Enter}');
  expect(onOptionSelect).not.toHaveBeenCalled();
  await expect
    .element(screen.getByLabelText('Reviewer selection'))
    .toHaveAttribute('data-tagpicker-selected', '[]');
});

test('leaves controlled selection rejection and disabled state with the consumer', async () => {
  const onOptionSelect = vi.fn<NonNullable<TagPickerProps['onOptionSelect']>>();
  const screen = await renderCoreAIComponent(
    <TagPickerSelectionFlow onOptionSelect={onOptionSelect} />,
  );
  const input = screen.getByRole('combobox', { name: 'Find reviewers' });
  const record = screen.getByLabelText('Reviewer selection');
  await userEvent.click(screen.getByRole('button', { name: 'Reject selection changes' }));
  await userEvent.type(input, 'Ada');
  await userEvent.click(screen.getByRole('option', { name: 'Ada Lovelace' }));
  expect(onOptionSelect.mock.calls[0][1].selectedOptions).toEqual(['ada']);
  await expect.element(record).toHaveAttribute('data-tagpicker-selected', '[]');
  await expect.element(input).toHaveValue('Ada');
  await userEvent.click(screen.getByRole('button', { name: 'Accept selection changes' }));
  await userEvent.click(input);
  await userEvent.click(screen.getByRole('option', { name: 'Ada Lovelace' }));
  await expect.element(record).toHaveAttribute('data-tagpicker-selected', '["ada"]');
  await expect.element(input).toHaveValue('');
  await userEvent.click(screen.getByRole('button', { name: 'Disable reviewers' }));
  await expect.element(input).toBeDisabled();
  const tag = screen.getByRole('button', { name: 'Remove Ada Lovelace' });
  await expect.element(tag).toBeDisabled();
  const element = tagPickerLocatorHTML(tag);
  element.click();
  expect(onOptionSelect).toHaveBeenCalledTimes(2);
  await expect.element(screen.getByRole('button', { name: 'Clear reviewers' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Enable reviewers' }));
  await expect.element(input).toBeEnabled();
  await userEvent.click(screen.getByRole('button', { name: 'Clear reviewers' }));
  await expect.element(record).toHaveAttribute('data-tagpicker-selected', '[]');
  expect(onOptionSelect).toHaveBeenCalledTimes(2);
});

test('single selection remains consumer policy while the original multi-selection payload is unchanged', async () => {
  const onOptionSelect = vi.fn<NonNullable<TagPickerProps['onOptionSelect']>>();
  const screen = await renderCoreAIComponent(
    <TagPickerSelectionFlow single onOptionSelect={onOptionSelect} />,
  );
  const input = screen.getByRole('combobox', { name: 'Find reviewers' });
  const record = screen.getByLabelText('Reviewer selection');
  await userEvent.type(input, 'Ada');
  await userEvent.click(screen.getByRole('option', { name: 'Ada Lovelace' }));
  await userEvent.type(input, 'Grace');
  await userEvent.click(screen.getByRole('option', { name: 'Grace Hopper' }));
  expect(onOptionSelect.mock.calls[1][1].selectedOptions).toEqual(['ada', 'grace']);
  await expect.element(record).toHaveAttribute('data-tagpicker-selected', '["grace"]');
  await expect
    .element(screen.getByRole('button', { name: 'Remove Ada Lovelace' }))
    .not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Remove Grace Hopper' }));
  expect(onOptionSelect.mock.calls[2][1].selectedOptions).toEqual([]);
  await expect.element(record).toHaveAttribute('data-tagpicker-selected', '[]');
  await expect.element(input).toHaveFocus();
});

test('default array selection and an uncontrolled native query retain current context and callback array identity', async () => {
  let current: string[] = [];
  const before: string[][] = [];
  const onOptionSelect = vi.fn<NonNullable<TagPickerProps['onOptionSelect']>>((_event, _data) => {
    before.push([...current]);
  });
  function CurrentSelection() {
    current = useTagPickerContext_unstable((context) => context.selectedOptions);
    return <output aria-label="Current selection">{JSON.stringify(current)}</output>;
  }
  const screen = await renderCoreAIComponent(
    <TagPicker defaultSelectedOptions={['ada']} onOptionSelect={onOptionSelect}>
      <TagPickerControl>
        <TagPickerInput aria-label="Uncontrolled reviewers" />
        <CurrentSelection />
      </TagPickerControl>
      <TagPickerList aria-label="Uncontrolled suggestions">
        {tagPickerPeople.map((person) => (
          <TagPickerOption key={person.value} value={person.value}>
            {person.label}
          </TagPickerOption>
        ))}
      </TagPickerList>
    </TagPicker>,
  );
  const input = screen.getByRole('combobox', { name: 'Uncontrolled reviewers' });
  await expect.element(input).toHaveValue('');
  await expect.element(screen.getByLabelText('Current selection')).toHaveTextContent('["ada"]');
  await userEvent.type(input, 'Gra');
  await expect.element(input).toHaveValue('Gra');
  await userEvent.keyboard('{Enter}');
  expect(before).toEqual([['ada']]);
  const [event, data] = onOptionSelect.mock.calls[0];
  expect(data.event).toBe(event);
  expect(data.value).toBe('grace');
  expect(data.selectedOptions).toEqual(['ada', 'grace']);
  expect(data.selectedOptions).toBe(current);
  await expect.element(input).toHaveValue('');
  await expect.element(input).toHaveAttribute('aria-expanded', 'false');
});

test('uses the public filter default and custom predicate without normalizing its result elements', async () => {
  const noOptions = (
    <TagPickerOption key="caller-empty" value="empty" disabled>
      No people found
    </TagPickerOption>
  );
  function FilterFixture({ query, custom = false }: { query: string; custom?: boolean }) {
    const children = useTagPickerFilter({
      query,
      options: ['ada', 'grace', 'linus'],
      noOptionsElement: noOptions,
      renderOption: (value) => (
        <TagPickerOption key={value} value={value}>
          {getTagPickerPerson(value).label}
        </TagPickerOption>
      ),
      ...(custom && { filter: (_value: string, index: number) => index % 2 === 0 }),
    });
    return (
      <TagPicker defaultOpen selectedOptions={[]}>
        <TagPickerControl>
          <TagPickerInput aria-label="Filter hook" />
          <output aria-label="Filter keys">{children.map((child) => child.key).join(',')}</output>
        </TagPickerControl>
        <TagPickerList>{children}</TagPickerList>
      </TagPicker>
    );
  }
  const screen = await renderCoreAIComponent(<FilterFixture query="  GRA  " />);
  await expect.element(screen.getByRole('option', { name: 'Grace Hopper' })).toBeVisible();
  await expect
    .element(screen.getByRole('option', { name: 'Ada Lovelace' }))
    .not.toBeInTheDocument();
  await expect.element(screen.getByLabelText('Filter keys')).toHaveTextContent('grace');
  await screen.rerender(<FilterFixture query="unknown" />);
  await expect
    .element(screen.getByRole('option', { name: 'No people found' }))
    .toHaveAttribute('aria-disabled', 'true');
  await expect.element(screen.getByLabelText('Filter keys')).toHaveTextContent('caller-empty');
  await screen.rerender(<FilterFixture query="unknown" custom />);
  await expect.element(screen.getByRole('option', { name: 'Ada Lovelace' })).toBeVisible();
  await expect.element(screen.getByRole('option', { name: 'Linus Torvalds' })).toBeVisible();
  await expect
    .element(screen.getByRole('option', { name: 'Grace Hopper' }))
    .not.toBeInTheDocument();
});

test('a current TagPickerOption keeps selected/disabled data and the facade ARIA boundary, with explicit aria-selected supported', async () => {
  const onOptionSelect = vi.fn<NonNullable<TagPickerProps['onOptionSelect']>>();
  const screen = await renderCoreAIComponent(
    <TagPicker selectedOptions={['ada']} defaultOpen onOptionSelect={onOptionSelect}>
      <TagPickerControl>
        <TagPickerInput aria-label="Selection semantics" />
      </TagPickerControl>
      <TagPickerList>
        <TagPickerOption value="ada">Ada</TagPickerOption>
        <TagPickerOption value="grace" aria-selected={false}>
          Grace
        </TagPickerOption>
        <TagPickerOption value="linus" disabled>
          Linus
        </TagPickerOption>
      </TagPickerList>
    </TagPicker>,
  );
  const selected = screen.getByRole('option', { name: 'Ada', exact: true });
  await expect.element(selected).toHaveAttribute('data-selected');
  // The installed public renderer replaces the checkbox role/ARIA without adding aria-selected.
  await expect.element(selected).not.toHaveAttribute('aria-checked');
  await expect.element(selected).not.toHaveAttribute('aria-selected');
  await expect
    .element(screen.getByRole('option', { name: 'Grace', exact: true }))
    .toHaveAttribute('aria-selected', 'false');
  const disabled = screen.getByRole('option', { name: 'Linus', exact: true });
  await expect.element(disabled).toHaveAttribute('aria-disabled', 'true');
  await expect.element(disabled).toHaveAttribute('data-disabled');
  expect(tagPickerLocatorHTML(selected).querySelector('svg')).toBeNull();
  await userEvent.click(selected);
  expect(onOptionSelect.mock.calls[0][1].selectedOptions).toEqual(['ada']);
  expect(onOptionSelect.mock.calls[0][1].value).toBe('ada');
  const input = screen.getByRole('combobox', { name: 'Selection semantics' });
  await userEvent.click(input);
  await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
  const active = tagPickerLocatorInput(input).getAttribute('aria-activedescendant');
  expect(active).not.toBeNull();
  const activeElement = document.getElementById(active ?? '');
  expect(activeElement).toHaveAttribute('data-activedescendant-focusvisible');
  expect(getComputedStyle(tagPickerHTML(activeElement), '::after').borderTopWidth).toBe('2px');
});

test('raw current primitives confirm the option ARIA and button disability boundaries and supported explicit consumer props', async () => {
  const selected = ['ada', 'grace'];
  const select = vi.fn<NonNullable<TagPickerProps['onOptionSelect']>>();
  const screen = await renderCoreAIComponent(
    <FocusgroupConsumer>
      <primitive.TagPicker open selectedOptions={selected} onOptionSelect={select}>
        <primitive.TagPickerControl>
          <primitive.TagPickerGroup aria-label="Raw selected tags">
            <Tag as="button" value="ada">
              Raw Ada tag
            </Tag>
            <Tag as="button" value="grace">
              Raw Grace tag
            </Tag>
          </primitive.TagPickerGroup>
          <primitive.TagPickerInput aria-label="Raw selection query" />
        </primitive.TagPickerControl>
        <primitive.TagPickerList aria-label="Raw selection suggestions">
          <primitive.TagPickerOption value="ada">Raw Ada</primitive.TagPickerOption>
          <primitive.TagPickerOption value="grace" aria-selected={true}>
            Explicit Grace
          </primitive.TagPickerOption>
        </primitive.TagPickerList>
      </primitive.TagPicker>
      <primitive.TagPicker disabled noPopover selectedOptions={[]}>
        <primitive.TagPickerControl>
          <primitive.TagPickerButton aria-label="Raw parent disabled button" />
        </primitive.TagPickerControl>
      </primitive.TagPicker>
      <primitive.TagPicker disabled noPopover selectedOptions={[]}>
        <primitive.TagPickerControl>
          <primitive.TagPickerButton disabled aria-label="Raw explicit disabled button" />
        </primitive.TagPickerControl>
      </primitive.TagPicker>
    </FocusgroupConsumer>,
  );
  const raw = screen.getByRole('option', { name: 'Raw Ada', exact: true });
  await expect.element(raw).toHaveAttribute('data-selected');
  await expect.element(raw).not.toHaveAttribute('aria-selected');
  await expect.element(raw).not.toHaveAttribute('aria-checked');
  await expect
    .element(screen.getByRole('option', { name: 'Explicit Grace', exact: true }))
    .toHaveAttribute('aria-selected', 'true');
  await expect
    .element(screen.getByRole('combobox', { name: 'Raw parent disabled button' }))
    .toBeEnabled();
  await expect
    .element(screen.getByRole('combobox', { name: 'Raw explicit disabled button' }))
    .toBeDisabled();
  const expectedMode = import.meta.env.VITE_TAG_PICKER_FOCUSGROUP_MODE;
  if (expectedMode) {
    expect(supportsFocusGroup() ? 'native' : 'consumer-polyfill').toBe(expectedMode);
  }
  const group = tagPickerLocatorHTML(screen.getByRole('toolbar', { name: 'Raw selected tags' }));
  if (!supportsFocusGroup()) {
    await expect
      .poll(() => [...group.querySelectorAll('button')].some((button) => button.tabIndex === -1))
      .toBe(true);
  }
  const input = screen.getByRole('combobox', { name: 'Raw selection query' });
  tagPickerLocatorInput(input).focus();
  await userEvent.keyboard('{ArrowLeft}');
  await expect
    .element(screen.getByRole('button', { name: 'Raw Grace tag', exact: true }))
    .toHaveFocus();
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(input).toHaveFocus();
  await userEvent.tab({ shift: true });
  // The polyfill wraps before React's last-tag handler returns to the input; native defaults run after it.
  await expect
    .element(
      screen.getByRole('button', {
        name: supportsFocusGroup() ? 'Raw Grace tag' : 'Raw Ada tag',
        exact: true,
      }),
    )
    .toHaveFocus();
  await userEvent.click(raw);
  expect(select).toHaveBeenCalledTimes(1);
  expect(select.mock.calls[0][1].selectedOptions).toBe(selected);
  expect(select.mock.calls[0][1].event).toBe(select.mock.calls[0][0]);
});

test('controlled open requests preserve event identity and cannot expose a rejected native popup', async () => {
  const onOpenChange = vi.fn<NonNullable<TagPickerProps['onOpenChange']>>();
  function ControlledOpen({ accept }: { accept: boolean }) {
    const [open, setOpen] = React.useState(false);
    return (
      <div>
        <TagPicker
          open={open}
          selectedOptions={[]}
          onOpenChange={(event, data) => {
            onOpenChange(event, data);
            if (accept) setOpen(data.open);
          }}
        >
          <TagPickerControl>
            <TagPickerInput aria-label="Controlled open reviewers" />
          </TagPickerControl>
          <TagPickerList aria-label="Controlled open suggestions">
            <TagPickerOption value="ada">Ada</TagPickerOption>
          </TagPickerList>
        </TagPicker>
        <button type="button">Outside controlled picker</button>
      </div>
    );
  }
  const screen = await renderCoreAIComponent(<ControlledOpen accept={false} />);
  const input = screen.getByRole('combobox', { name: 'Controlled open reviewers' });
  await userEvent.click(input);
  expect(onOpenChange).toHaveBeenCalledTimes(1);
  const [event, data] = onOpenChange.mock.calls[0];
  expect(data.event).toBe(event);
  expect(data.open).toBe(true);
  expect(data.type).toBe(event.type);
  await expect.element(input).toHaveAttribute('aria-expanded', 'false');
  const closed = screen.container.querySelector('.fui-TagPickerList');
  expect(closed).not.toBeNull();
  expect(closed?.getAttribute('popover')).toBe('auto');
  expect(closed?.matches(':popover-open')).toBe(false);
  expect(getComputedStyle(tagPickerHTML(closed)).display).toBe('none');
  expect(tagPickerHTML(closed).getBoundingClientRect().width).toBe(0);
  await screen.rerender(<ControlledOpen accept />);
  await userEvent.click(input);
  await expect.element(input).toHaveAttribute('aria-expanded', 'true');
  const popup = screen.getByRole('listbox', { name: 'Controlled open suggestions' });
  await expect.element(popup).toBeVisible();
  const nativePopup = tagPickerLocatorHTML(popup);
  expect(nativePopup.matches(':popover-open')).toBe(true);
  await userEvent.keyboard('{Escape}');
  await expect.element(input).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(() => nativePopup.matches(':popover-open')).toBe(false);
  expect(nativePopup).not.toBeVisible();
  expect(getComputedStyle(nativePopup).display).toBe('none');
  const [, closeData] = onOpenChange.mock.calls[onOpenChange.mock.calls.length - 1];
  expect(closeData.open).toBe(false);
  await userEvent.click(input);
  await expect.element(popup).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Outside controlled picker' }));
  await expect.element(input).toHaveAttribute('aria-expanded', 'false');
  await expect
    .poll(() => nativePopup.isConnected && nativePopup.matches(':popover-open'))
    .toBe(false);
  expect(nativePopup).not.toBeVisible();
});

test('keeps current native positioning defaults instead of restoring the legacy below/width/offset presentation', async () => {
  const controlRef = React.createRef<HTMLDivElement>();
  const popupRef = React.createRef<HTMLDivElement>();
  const screen = await renderCoreAIComponent(
    <div style={{ marginTop: 160, width: 304 }}>
      <TagPicker defaultOpen selectedOptions={[]}>
        <TagPickerControl ref={controlRef}>
          <TagPickerInput aria-label="Native default placement" />
        </TagPickerControl>
        <TagPickerList ref={popupRef} aria-label="Native default suggestions">
          <TagPickerOption value="ada">Ada</TagPickerOption>
        </TagPickerList>
      </TagPicker>
    </div>,
  );
  await expect
    .element(screen.getByRole('listbox', { name: 'Native default suggestions' }))
    .toBeVisible();
  const control = tagPickerHTML(controlRef.current);
  const popup = tagPickerHTML(popupRef.current);
  await settleTagPickerStyles(control, popup);
  expect(popup.style.position).toBe('fixed');
  expect(popup.style.getPropertyValue('position-area')).toBe('block-start');
  expect(popup.style.getPropertyValue('position-try-fallbacks')).toBe(
    'flip-block, flip-inline, flip-block flip-inline',
  );
  expect(popup.style.getPropertyValue('position-anchor')).toBe(
    control.style.getPropertyValue('anchor-name'),
  );
  expect(popup.style.width).toBe('');
  const target = control.getBoundingClientRect();
  const surface = popup.getBoundingClientRect();
  expect(surface.width).toBe(160);
  expect(target.top - surface.bottom).toBe(0);
  expect(surface.left + surface.width / 2).toBe(target.left + target.width / 2);
});

test('native CSS anchors follow ancestor relocation without a library positioner or portal', async () => {
  const stageRef = React.createRef<HTMLDivElement>();
  const controlRef = React.createRef<HTMLDivElement>();
  const popupRef = React.createRef<HTMLDivElement>();
  const positioning = React.createRef<PositioningImperativeRef>();
  const screen = await renderCoreAIComponent(
    <div ref={stageRef} style={{ marginTop: 80, width: 304 }}>
      <TagPicker
        defaultOpen
        selectedOptions={[]}
        positioning={{
          position: 'below',
          align: 'start',
          offset: 3,
          matchTargetSize: 'width',
          pinned: true,
          positioningRef: positioning,
        }}
      >
        <TagPickerControl ref={controlRef}>
          <TagPickerInput aria-label="Relocated reviewers" />
        </TagPickerControl>
        <TagPickerList ref={popupRef} aria-label="Relocated suggestions">
          <TagPickerOption value="ada">Ada</TagPickerOption>
          <TagPickerOption value="grace">Grace</TagPickerOption>
        </TagPickerList>
      </TagPicker>
    </div>,
  );
  await expect
    .element(screen.getByRole('listbox', { name: 'Relocated suggestions' }))
    .toBeVisible();
  const control = tagPickerHTML(controlRef.current);
  const popup = tagPickerHTML(popupRef.current);
  const stage = tagPickerHTML(stageRef.current);
  expect(stage.contains(popup)).toBe(true);
  expect(popup.matches(':popover-open')).toBe(true);
  await settleTagPickerStyles(control, popup);
  const before = control.getBoundingClientRect();
  stage.style.marginInlineStart = '37px';
  stage.style.marginTop = '99px';
  await expect.poll(() => control.getBoundingClientRect().left - before.left).toBe(37);
  await expect.poll(() => control.getBoundingClientRect().top - before.top).toBe(19);
  await expect
    .poll(() => popup.getBoundingClientRect().left - control.getBoundingClientRect().left)
    .toBe(0);
  await expect
    .poll(() => popup.getBoundingClientRect().top - control.getBoundingClientRect().bottom)
    .toBe(3);
  expect(popup.getBoundingClientRect().width).toBe(control.getBoundingClientRect().width);
  expect(positioning.current?.updatePosition).toBeTypeOf('function');
  expect(positioning.current?.setTarget).toBeTypeOf('function');
});

test('native top-layer collision handling stays bounded without excluding clipping or popup geometry', async () => {
  const controlRef = React.createRef<HTMLDivElement>();
  const popupRef = React.createRef<HTMLDivElement>();
  const screen = await renderCoreAIComponent(
    <div
      style={{
        position: 'fixed',
        insetInlineStart: 8,
        bottom: 8,
        width: 304,
        height: 32,
        overflow: 'hidden',
      }}
    >
      <TagPicker
        defaultOpen
        selectedOptions={[]}
        positioning={{ position: 'below', align: 'start', offset: 4, matchTargetSize: 'width' }}
      >
        <TagPickerControl ref={controlRef}>
          <TagPickerInput aria-label="Collision reviewers" />
        </TagPickerControl>
        <TagPickerList ref={popupRef} aria-label="Collision suggestions">
          {tagPickerPeople.map((person) => (
            <TagPickerOption key={person.value} value={person.value}>
              {person.label}
            </TagPickerOption>
          ))}
        </TagPickerList>
      </TagPicker>
    </div>,
  );
  await expect
    .element(screen.getByRole('listbox', { name: 'Collision suggestions' }))
    .toBeVisible();
  const control = tagPickerHTML(controlRef.current);
  const popup = tagPickerHTML(popupRef.current);
  await settleTagPickerStyles(control, popup);
  await expect
    .poll(() => control.getBoundingClientRect().top - popup.getBoundingClientRect().bottom)
    .toBe(4);
  const target = control.getBoundingClientRect();
  const surface = popup.getBoundingClientRect();
  expect(popup.matches(':popover-open')).toBe(true);
  expect(surface.width).toBe(target.width);
  expect(surface.height).toBeGreaterThan(32);
  expect(surface.left).toBeGreaterThanOrEqual(0);
  expect(surface.right).toBeLessThanOrEqual(window.innerWidth);
  expect(surface.top).toBeGreaterThanOrEqual(0);
  expect(surface.bottom).toBeLessThanOrEqual(window.innerHeight);
});

test.each([false, true])(
  'uses trusted native/polyfilled tag keys and consumer dismissal restoration, cold=%s',
  async (cold) => {
    const onOptionSelect = vi.fn<NonNullable<TagPickerProps['onOptionSelect']>>();
    const screen = await renderCoreAIComponent(
      <TagPickerSelectionFlow
        initialSelected={cold ? [] : ['ada', 'grace', 'linus']}
        onOptionSelect={onOptionSelect}
      />,
    );
    await userEvent.hover(screen.getByTestId('tagpicker-flow-pointer-rest'));
    expect(supportsFocusGroup()).toBe('focusGroup' in HTMLElement.prototype);
    expect(screen.container.querySelector('[data-tagpicker-flow]')).toHaveAttribute(
      'data-tagpicker-focusgroup-mode',
      supportsFocusGroup() ? 'native' : 'consumer-polyfill',
    );
    const input = screen.getByRole('combobox', { name: 'Find reviewers' });
    if (cold) {
      expect(screen.container.querySelector('[focusgroup]')).toBeNull();
      await userEvent.click(screen.getByRole('button', { name: 'Restore sample reviewers' }));
    }
    const group = screen.getByRole('toolbar', { name: 'Selected reviewers' });
    await expect.element(group).toHaveAttribute('focusgroup', 'toolbar inline wrap');
    const ada = screen.getByRole('button', { name: 'Remove Ada Lovelace' });
    const grace = screen.getByRole('button', { name: 'Remove Grace Hopper' });
    const linus = screen.getByRole('button', { name: 'Remove Linus Torvalds' });
    tagPickerLocatorInput(input).focus();
    await userEvent.keyboard('{Backspace}');
    await expect.element(linus).toHaveFocus();
    expect(onOptionSelect).not.toHaveBeenCalled();
    await userEvent.keyboard('{ArrowLeft}');
    await expect.element(grace).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect.element(ada).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect.element(linus).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(input).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect.element(linus).toHaveFocus();
    await userEvent.keyboard('{Delete}');
    await expect.element(grace).toHaveFocus();
    await expect.element(linus).not.toBeInTheDocument();
    expect(onOptionSelect.mock.calls[0][1].selectedOptions).toEqual(['ada', 'grace']);
    expect(onOptionSelect.mock.calls[0][1].value).toBe('linus');
    expect(onOptionSelect.mock.calls[0][1].event).toBe(onOptionSelect.mock.calls[0][0]);
    await userEvent.keyboard('{Backspace}');
    await expect.element(ada).toHaveFocus();
    expect(onOptionSelect.mock.calls[1][1].selectedOptions).toEqual(['ada']);
    await userEvent.keyboard('{Delete}');
    await expect.element(input).toHaveFocus();
    await expect.element(group).not.toBeInTheDocument();
    expect(onOptionSelect.mock.calls[2][1].selectedOptions).toEqual([]);
    await userEvent.click(screen.getByRole('button', { name: 'Restore sample reviewers' }));
    await expect.element(group).toHaveAttribute('focusgroup', 'toolbar inline wrap');
    await expect.element(input).toHaveFocus();
    await userEvent.tab();
    await expect.element(screen.getByRole('button', { name: 'Clear reviewers' })).toHaveFocus();
    await userEvent.tab();
    await expect.element(screen.getByRole('button', { name: 'After reviewers' })).toHaveFocus();
  },
);

test('retains the current dismiss notification boundary without adding a group-level selection veto', async () => {
  const dismiss = vi.fn<NonNullable<TagPickerGroupProps['onDismiss']>>((event) =>
    event.preventDefault(),
  );
  const select = vi.fn<NonNullable<TagPickerProps['onOptionSelect']>>();
  const screen = await renderCoreAIComponent(
    <FocusgroupConsumer>
      <TagPicker selectedOptions={['ada', 'grace']} onOptionSelect={select} noPopover>
        <TagPickerControl>
          <TagPickerGroup aria-label="Dismiss boundary" onDismiss={dismiss}>
            <Tag as="button" value="ada">
              Ada
            </Tag>
            <Tag as="button" value="grace">
              Grace
            </Tag>
          </TagPickerGroup>
          <TagPickerInput aria-label="Dismiss query" />
        </TagPickerControl>
      </TagPicker>
    </FocusgroupConsumer>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Ada', exact: true }));
  expect(dismiss).toHaveBeenCalledTimes(1);
  expect(dismiss.mock.calls[0][1]).toEqual({ value: 'ada' });
  expect(select).toHaveBeenCalledTimes(1);
  expect(select.mock.calls[0][1].value).toBe('ada');
  expect(select.mock.calls[0][1].selectedOptions).toEqual(['grace']);
  expect(select.mock.calls[0][1].event).toBe(dismiss.mock.calls[0][0]);
  // The consumer holds selectedOptions fixed; neither callback removes a child automatically.
  await expect
    .element(screen.getByRole('button', { name: 'Ada', exact: true }))
    .toBeInTheDocument();
  await expect
    .element(screen.getByRole('button', { name: 'Grace', exact: true }))
    .toBeInTheDocument();
});

test('the button trigger keeps its native ref/type and current parent-disabled boundary', async () => {
  const ref = React.createRef<HTMLButtonElement>();
  const screen = await renderCoreAIComponent(
    <>
      <TagPicker disabled noPopover selectedOptions={[]}>
        <TagPickerControl>
          <TagPickerButton
            ref={ref}
            aria-label="Current button boundary"
            className="caller-button"
          />
        </TagPickerControl>
      </TagPicker>
      <TagPicker disabled noPopover selectedOptions={[]}>
        <TagPickerControl>
          <TagPickerButton disabled aria-label="Explicitly disabled button" />
        </TagPickerControl>
      </TagPicker>
    </>,
  );
  const button = screen.getByRole('combobox', { name: 'Current button boundary' });
  expect(ref.current).toBe(button.element());
  expect(ref.current).toHaveClass(tagPickerButtonClassNames.root, 'caller-button');
  expect(ref.current?.tagName).toBe('BUTTON');
  expect(ref.current?.type).toBe('button');
  // The installed public button base only consumes its own disabled prop.
  await expect.element(button).not.toBeDisabled();
  await expect
    .element(screen.getByRole('combobox', { name: 'Explicitly disabled button' }))
    .toBeDisabled();
  await userEvent.click(button);
  await expect.element(button).toHaveAttribute('aria-expanded', 'false');
});

test('the button selection surface clips and restores without removing its accessible trigger', async () => {
  const screen = await renderCoreAIComponent(<TagPickerSelectionFlow button />);
  const button = screen.getByRole('combobox', { name: 'Choose reviewers' });
  const element = tagPickerLocatorHTML(button);
  await userEvent.click(button);
  await userEvent.click(screen.getByRole('option', { name: 'Ada Lovelace' }));
  expect(getComputedStyle(element).clip).toBe('rect(0px, 0px, 0px, 0px)');
  await expect.element(button).toHaveAccessibleName('Choose reviewers');
  await userEvent.click(screen.getByRole('button', { name: 'Remove Ada Lovelace' }));
  expect(getComputedStyle(element).clip).toBe('auto');
  await expect.element(button).toHaveFocus();
  expect(element.getBoundingClientRect().width).toBeGreaterThan(24);
});

test('native readOnly and explicit input disabled overrides keep the public input contract', async () => {
  const change = vi.fn<NonNullable<TagPickerInputProps['onChange']>>();
  const screen = await renderCoreAIComponent(
    <>
      <TagPicker noPopover selectedOptions={[]}>
        <TagPickerControl>
          <TagPickerInput
            readOnly
            value="Review queue"
            aria-label="Read only reviewers"
            onChange={change}
          />
        </TagPickerControl>
      </TagPicker>
      <TagPicker disabled noPopover selectedOptions={[]}>
        <TagPickerControl>
          <TagPickerInput disabled={false} aria-label="Explicitly enabled query" />
        </TagPickerControl>
      </TagPicker>
      <TagPicker disabled noPopover selectedOptions={[]}>
        <TagPickerControl>
          <TagPickerInput aria-label="Inherited disabled query" />
        </TagPickerControl>
      </TagPicker>
    </>,
  );
  const input = screen.getByRole('combobox', { name: 'Read only reviewers' });
  await userEvent.type(input, 'Changed');
  await expect.element(input).toHaveValue('Review queue');
  expect(change).not.toHaveBeenCalled();
  await expect
    .element(screen.getByRole('combobox', { name: 'Explicitly enabled query' }))
    .toBeEnabled();
  await expect
    .element(screen.getByRole('combobox', { name: 'Inherited disabled query' }))
    .toBeDisabled();
});

test('strips visual props before hooks and does not invent a clear action for the current input', async () => {
  const screen = await renderCoreAIComponent(
    <FocusgroupConsumer>
      <TagPicker appearance="filled-darker" size="large" selectedOptions={['ada']} noPopover>
        <TagPickerControl data-testid="stripped-control">
          <TagPickerGroup aria-label="Clearable tags">
            <Tag as="button" value="ada">
              Ada
            </Tag>
          </TagPickerGroup>
          <TagPickerInput appearance="underline" clearable aria-label="Clearable query" />
        </TagPickerControl>
      </TagPicker>
    </FocusgroupConsumer>,
  );
  const input = screen.getByRole('combobox', { name: 'Clearable query' });
  await expect.element(input).not.toHaveAttribute('appearance');
  await expect.element(input).not.toHaveAttribute('clearable');
  await expect.element(input).not.toHaveAttribute('size');
  await expect.element(input).toHaveAttribute('data-size', 'large');
  await expect
    .element(screen.getByTestId('stripped-control'))
    .toHaveAttribute('data-appearance', 'filled-darker');
  expect(
    screen.container.querySelector('.fui-Combobox__clearIcon, .fui-TagPickerInput__clearIcon'),
  ).toBeNull();
  await expect.element(screen.getByRole('button', { name: 'Ada', exact: true })).toBeVisible();
});

test('the current input-owned stretch variable wraps overflowing queries and clears when the query fits', async () => {
  const screen = await renderCoreAIComponent(
    <FocusgroupConsumer>
      <div style={{ width: 304 }}>
        <TagPicker noPopover selectedOptions={['ada']}>
          <TagPickerControl>
            <TagPickerGroup aria-label="Stretch tags">
              <Tag as="button" value="ada">
                Ada Lovelace
              </Tag>
            </TagPickerGroup>
            <TagPickerInput aria-label="Stretch query" />
          </TagPickerControl>
        </TagPicker>
      </div>
    </FocusgroupConsumer>,
  );
  const input = screen.getByRole('combobox', { name: 'Stretch query' });
  const native = tagPickerLocatorInput(input);
  const group = tagPickerLocatorHTML(screen.getByRole('toolbar', { name: 'Stretch tags' }));
  await userEvent.type(input, 'A reviewer query deliberately wider than the remaining input space');
  await expect
    .poll(() => native.style.getPropertyValue('--fluent-TagPickerInput__width'))
    .toBe('100%');
  expect(native.getBoundingClientRect().top).toBeGreaterThanOrEqual(
    group.getBoundingClientRect().bottom,
  );
  await userEvent.clear(input);
  await expect.poll(() => native.style.getPropertyValue('--fluent-TagPickerInput__width')).toBe('');
  expect(native.getBoundingClientRect().top).toBeLessThan(group.getBoundingClientRect().bottom);
});

test('Field labels, descriptions, required, native FormData and reset retain their current query/selection boundaries', async () => {
  const screen = await renderCoreAIComponent(<TagPickerNativeFormFlow />);
  const input = screen.getByRole('combobox', { name: 'Approval note' });
  const native = tagPickerLocatorInput(input);
  const result = screen.getByLabelText('Reviewer form result');
  await expect.element(input).toBeRequired();
  await expect.element(input).toHaveAttribute('aria-invalid', 'true');
  const descriptions = (native.getAttribute('aria-describedby')?.split(/\s+/) ?? []).map(
    (id) => document.getElementById(id)?.textContent,
  );
  expect(descriptions).toEqual(
    expect.arrayContaining([
      'Enter an approval note',
      'This name belongs to the query input, not to the selected tags',
    ]),
  );
  const label = screen.container.querySelector('label');
  expect(label).toHaveAttribute('for', native.id);
  await userEvent.clear(input);
  expect(native.validity.valueMissing).toBe(true);
  await userEvent.click(screen.getByRole('button', { name: 'Submit reviewer form' }));
  await expect.element(result).toHaveAttribute('data-tagpicker-form-submits', '0');
  await userEvent.type(input, 'Approved');
  await userEvent.click(screen.getByRole('button', { name: 'Submit reviewer form' }));
  await expect.element(result).toHaveAttribute('data-tagpicker-form-submits', '1');
  await expect
    .element(result)
    .toHaveAttribute(
      'data-tagpicker-form-entries',
      '[["approvalNote","Approved"],["reviewer","ada"]]',
    );
  await userEvent.click(screen.getByRole('button', { name: 'Native reviewer reset' }));
  await expect.element(result).toHaveAttribute('data-tagpicker-form-resets', '1');
  await expect.element(input).toHaveValue('Approved');
  await expect.element(screen.getByRole('button', { name: 'Remove Ada Lovelace' })).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Reset reviewer state' }));
  await expect.element(input).toHaveValue('');
  await userEvent.click(screen.getByRole('button', { name: 'Submit reviewer form' }));
  await expect.element(result).toHaveAttribute('data-tagpicker-form-submits', '1');
  await userEvent.click(screen.getByRole('button', { name: 'Remove Ada Lovelace' }));
  const form = screen.getByRole('form', { name: 'Reviewer approval form' }).element();
  if (!(form instanceof HTMLFormElement)) throw new Error('Expected native reviewer form');
  expect([...new FormData(form).entries()]).toEqual([['approvalNote', '']]);
});

test('selection never invents native form entries, and a native reset does not reset hook-selected defaults', async () => {
  let selected: string[] = [];
  function SelectionProbe() {
    selected = useTagPickerContext_unstable((context) => context.selectedOptions);
    return <output aria-label="Form selection">{JSON.stringify(selected)}</output>;
  }
  const screen = await renderCoreAIComponent(
    <form aria-label="Uncontrolled picker form">
      <TagPicker defaultSelectedOptions={['ada']}>
        <TagPickerControl>
          <TagPickerInput name="query" aria-label="Native form query" />
          <SelectionProbe />
        </TagPickerControl>
        <TagPickerList>
          <TagPickerOption value="grace">Grace</TagPickerOption>
        </TagPickerList>
      </TagPicker>
      <button type="reset">Reset native query</button>
    </form>,
  );
  const input = screen.getByRole('combobox', { name: 'Native form query' });
  await userEvent.click(input);
  await userEvent.click(screen.getByRole('option', { name: 'Grace', exact: true }));
  expect(selected).toEqual(['ada', 'grace']);
  const form = screen.getByRole('form', { name: 'Uncontrolled picker form' }).element();
  if (!(form instanceof HTMLFormElement)) throw new Error('Expected uncontrolled native form');
  expect([...new FormData(form).entries()]).toEqual([['query', '']]);
  await userEvent.click(screen.getByRole('button', { name: 'Reset native query' }));
  expect(selected).toEqual(['ada', 'grace']);
  await expect
    .element(screen.getByLabelText('Form selection'))
    .toHaveTextContent('["ada","grace"]');
});

test('no-popover custom creation, de-duplication and removal stay in the shared consumer', async () => {
  const screen = await renderCoreAIComponent(<TagPickerCustomValuesFlow />);
  const input = screen.getByRole('combobox', { name: 'Add review label' });
  const result = screen.getByLabelText('Custom review labels result');
  await userEvent.type(input, 'Ready{Enter}');
  await expect.element(result).toHaveTextContent('["Ready"]');
  await expect.element(input).toHaveValue('');
  await userEvent.type(input, 'Ready{Enter}');
  await expect.element(result).toHaveTextContent('["Ready"]');
  expect(screen.container.querySelector('.fui-TagPickerList')).toBeNull();
  expect(screen.container.querySelector('.fui-TagPickerControl__expandIcon')).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Remove Ready' }));
  await expect.element(result).toHaveTextContent('[]');
  await expect.element(input).toHaveFocus();
});
