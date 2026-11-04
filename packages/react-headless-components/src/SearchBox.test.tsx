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
import {
  Field,
  SearchBox as LegacySearchBox,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import { ComparisonProvider as CoreAIFluentProvider } from '../../../apps/storybook/src/stories/experiments/ComparisonProvider.js';
import {
  SearchBoxComparison,
  searchBoxAppearances,
  searchBoxConsumerExample,
  searchBoxExamples,
  type SearchBoxExample,
} from '../../../apps/storybook/src/stories/experiments/SearchBoxComparison.js';
import {
  captureSearchBoxStyles,
  compareSearchBoxStyles,
  getComparisonSearchBox,
  getSearchBoxSlots,
  settleSearchBoxStyles,
} from '../../../apps/storybook/src/stories/experiments/compareSearchBoxStyles.js';
import {
  SearchBox,
  searchBoxClassNames,
  type SearchBoxChangeEvent,
  type SearchBoxOnChangeData,
  type SearchBoxProps,
  type SearchBoxSlots,
} from './SearchBox.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

async function renderPair(
  example: SearchBoxExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <SearchBoxComparison examples={[example]} />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('Case', { exact: true }));
  const legacy = getComparisonSearchBox(screen.container, 'legacy');
  const headless = getComparisonSearchBox(screen.container, 'headless');
  await Promise.all([settleSearchBoxStyles(legacy), settleSearchBoxStyles(headless)]);
  return { screen, legacy, headless };
}

function nativeQuery(container: ParentNode, name: string): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!input) throw new Error(`Missing native search input named ${name}`);
  return input;
}

function queryRoot(input: HTMLInputElement): HTMLElement {
  const root = input.closest<HTMLElement>('.fui-SearchBox');
  if (!root) throw new Error('Missing SearchBox root');
  return root;
}

for (const [mode, theme] of themes) {
  test.each(searchBoxExamples)(`matches $name at rest in ${mode} mode`, async (example) => {
    const { legacy, headless } = await renderPair(example, theme);
    expect(
      compareSearchBoxStyles(captureSearchBoxStyles(legacy), captureSearchBoxStyles(headless)),
    ).toEqual([]);
    const oldInput = getSearchBoxSlots(legacy).input;
    const newInput = getSearchBoxSlots(headless).input;
    expect(newInput.id).not.toBe(oldInput.id);
    expect(newInput.value).toBe(oldInput.value);
    expect(newInput.type).toBe(oldInput.type);
    expect(newInput.disabled).toBe(oldInput.disabled);
    expect(newInput.readOnly).toBe(oldInput.readOnly);
  });

  test.each(searchBoxAppearances)(`matches %s on hover in ${mode} mode`, async (appearance) => {
    const { legacy, headless } = await renderPair(
      { name: appearance, props: { appearance, defaultValue: 'Atlas' } },
      theme,
    );
    await userEvent.hover(getSearchBoxSlots(legacy).input);
    expect(legacy.matches(':hover')).toBe(true);
    await settleSearchBoxStyles(legacy);
    const expected = captureSearchBoxStyles(legacy);
    await userEvent.hover(getSearchBoxSlots(headless).input);
    expect(headless.matches(':hover')).toBe(true);
    await settleSearchBoxStyles(headless);
    expect(compareSearchBoxStyles(expected, captureSearchBoxStyles(headless))).toEqual([]);
  });

  test.each(searchBoxAppearances)(
    `matches %s with keyboard focus and focused hover in ${mode} mode`,
    async (appearance) => {
      const { screen, legacy, headless } = await renderPair(
        {
          name: appearance,
          props: { appearance, defaultValue: 'Atlas', contentAfter: 'Filter' },
        },
        theme,
      );
      const neutral = screen.getByText('Case', { exact: true });
      await userEvent.tab();
      await expect.element(getSearchBoxSlots(legacy).input).toHaveFocus();
      await userEvent.hover(neutral);
      expect(legacy.matches(':hover')).toBe(false);
      expect(getSearchBoxSlots(legacy).input.matches(':focus-visible')).toBe(true);
      await settleSearchBoxStyles(legacy);
      const focused = captureSearchBoxStyles(legacy);
      await userEvent.hover(getSearchBoxSlots(legacy).input);
      expect(legacy.matches(':hover')).toBe(true);
      await settleSearchBoxStyles(legacy);
      const focusedHover = captureSearchBoxStyles(legacy);

      await userEvent.tab();
      await expect.element(getSearchBoxSlots(headless).input).toHaveFocus();
      await userEvent.hover(neutral);
      expect(headless.matches(':hover')).toBe(false);
      expect(getSearchBoxSlots(headless).input.matches(':focus-visible')).toBe(true);
      await settleSearchBoxStyles(headless);
      expect(compareSearchBoxStyles(focused, captureSearchBoxStyles(headless))).toEqual([]);
      expect(headless).toHaveAttribute('data-focused', '');
      expect(captureSearchBoxStyles(headless)['root.after.transform']).toBe(
        'matrix(1, 0, 0, 1, 0, 0)',
      );
      await userEvent.hover(getSearchBoxSlots(headless).input);
      expect(headless.matches(':hover')).toBe(true);
      await settleSearchBoxStyles(headless);
      expect(compareSearchBoxStyles(focusedHover, captureSearchBoxStyles(headless))).toEqual([]);
    },
  );

  test.each(['small', 'medium', 'large'] as const)(
    `matches focused %s spacing, default glyphs, and blur collapse in ${mode} mode`,
    async (size) => {
      const { screen, legacy, headless } = await renderPair(
        { name: size, props: { size, defaultValue: 'Atlas' } },
        theme,
      );
      const resting = captureSearchBoxStyles(headless);
      expect(resting['contentAfter.rect.width']).toBe('0.00');
      await userEvent.tab();
      await expect.element(getSearchBoxSlots(legacy).input).toHaveFocus();
      await settleSearchBoxStyles(legacy);
      const focused = captureSearchBoxStyles(legacy);
      await userEvent.tab();
      await expect.element(getSearchBoxSlots(headless).input).toHaveFocus();
      await settleSearchBoxStyles(headless);
      expect(compareSearchBoxStyles(focused, captureSearchBoxStyles(headless))).toEqual([]);
      expect(Number(captureSearchBoxStyles(headless)['contentAfter.rect.width'])).toBeGreaterThan(
        0,
      );
      await userEvent.click(screen.getByText('Case', { exact: true }));
      await settleSearchBoxStyles(headless);
      expect(headless).not.toHaveAttribute('data-focused');
      expect(compareSearchBoxStyles(resting, captureSearchBoxStyles(headless))).toEqual([]);
    },
  );

  test.each(searchBoxAppearances)(
    `keeps disabled invalid %s styles on hover in ${mode} mode`,
    async (appearance) => {
      const { legacy, headless } = await renderPair(
        {
          name: appearance,
          props: { appearance, disabled: true, 'aria-invalid': true, defaultValue: 'Atlas' },
        },
        theme,
      );
      await userEvent.hover(getSearchBoxSlots(legacy).input);
      expect(legacy.matches(':hover')).toBe(true);
      const expected = captureSearchBoxStyles(legacy);
      await userEvent.hover(getSearchBoxSlots(headless).input);
      expect(headless.matches(':hover')).toBe(true);
      expect(compareSearchBoxStyles(expected, captureSearchBoxStyles(headless))).toEqual([]);
      expect(getComputedStyle(getSearchBoxSlots(headless).input).cursor).toBe('not-allowed');
    },
  );

  test('matches invalid borders before and during keyboard focus in ' + mode, async () => {
    const { legacy, headless } = await renderPair(
      {
        name: 'Invalid focus',
        props: { appearance: 'outline', 'aria-invalid': true, defaultValue: 'Atlas' },
      },
      theme,
    );
    const invalid = captureSearchBoxStyles(legacy);
    await userEvent.tab();
    await expect.element(getSearchBoxSlots(legacy).input).toHaveFocus();
    await settleSearchBoxStyles(legacy);
    const focused = captureSearchBoxStyles(legacy);
    expect(focused['root.border-bottom-color']).not.toBe(invalid['root.border-bottom-color']);
    await userEvent.tab();
    await expect.element(getSearchBoxSlots(headless).input).toHaveFocus();
    await settleSearchBoxStyles(headless);
    expect(compareSearchBoxStyles(focused, captureSearchBoxStyles(headless))).toEqual([]);
  });
}

test('exposes only current visual props, callback types, and the public forward-ref contract', () => {
  expectTypeOf<SearchBoxProps['appearance']>().toEqualTypeOf<
    'outline' | 'underline' | 'filled-darker' | 'filled-lighter' | undefined
  >();
  expectTypeOf<SearchBoxProps['size']>().toEqualTypeOf<'small' | 'medium' | 'large' | undefined>();
  expectTypeOf<SearchBoxOnChangeData>().toEqualTypeOf<{ value: string }>();
  expectTypeOf<SearchBoxChangeEvent>().toEqualTypeOf<
    React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLSpanElement>
  >();
  expectTypeOf<typeof SearchBox>().toEqualTypeOf<ForwardRefComponent<SearchBoxProps>>();
  expectTypeOf<'shape' extends keyof SearchBoxProps ? true : false>().toEqualTypeOf<false>();
  expectTypeOf<'label' extends keyof SearchBoxProps ? true : false>().toEqualTypeOf<false>();
  expectTypeOf<NonNullable<SearchBoxProps['input']>['children']>().toEqualTypeOf<undefined>();
});

test('uses outline without a CoreAI defaults provider', async () => {
  const screen = await render(<SearchBox name="outside" aria-label="Outside search" />);
  expect(queryRoot(nativeQuery(screen.container, 'outside'))).toHaveAttribute(
    'data-appearance',
    'outline',
  );
});

test.each([
  { name: 'omitted', props: {}, enabled: true, appearance: 'filled-darker' },
  { name: 'undefined', props: { appearance: undefined }, enabled: true, appearance: 'outline' },
  { name: 'opt-out omitted', props: {}, enabled: false, appearance: 'outline' },
  {
    name: 'opt-out undefined',
    props: { appearance: undefined },
    enabled: false,
    appearance: 'outline',
  },
  {
    name: 'opt-out explicit',
    props: { appearance: 'filled-darker' },
    enabled: false,
    appearance: 'filled-darker',
  },
] satisfies (SearchBoxExample & { enabled: boolean; appearance: string })[])(
  'preserves $name appearance/defaults semantics',
  async ({ name, props, enabled, appearance }) => {
    const { legacy, headless } = await renderPair({ name, props }, coreaiLightTheme, enabled);
    expect(headless).toHaveAttribute('data-appearance', appearance);
    expect(
      compareSearchBoxStyles(captureSearchBoxStyles(legacy), captureSearchBoxStyles(headless)),
    ).toEqual([]);
  },
);

test('bounds rectangle tolerance to half a CSS pixel and retains exact CSS values', () => {
  expect(
    compareSearchBoxStyles(
      { 'root.rect.width': '200.00', 'dismiss.icon.rect.height': '20.00' },
      { 'root.rect.width': '200.50', 'dismiss.icon.rect.height': '20.49' },
    ),
  ).toEqual([]);
  expect(
    compareSearchBoxStyles(
      { 'root.rect.width': '200.00', 'input.padding-left': '6px', 'root.min-height': '32px' },
      { 'root.rect.width': '200.51', 'input.padding-left': '6.1px', 'root.min-height': '32.1px' },
    ).map(({ property }) => property),
  ).toEqual(['root.rect.width', 'input.padding-left', 'root.min-height']);
  expect(
    compareSearchBoxStyles(
      { 'arbitrary.rect.width': '20.00' },
      { 'arbitrary.rect.width': '20.10' },
    ),
  ).toHaveLength(1);
});

test.each(['small', 'medium', 'large'] as const)(
  'matches %s logical RTL spacing at rest and during keyboard focus',
  async (size) => {
    const { legacy, headless } = await renderPair(
      { name: size, props: { size, defaultValue: 'Atlas', contentAfter: 'Filter' } },
      coreaiLightTheme,
      true,
      'rtl',
    );
    expect(
      compareSearchBoxStyles(captureSearchBoxStyles(legacy), captureSearchBoxStyles(headless)),
    ).toEqual([]);
    expect(getComputedStyle(headless).direction).toBe('rtl');
    await userEvent.tab();
    await expect.element(getSearchBoxSlots(legacy).input).toHaveFocus();
    await settleSearchBoxStyles(legacy);
    const focused = captureSearchBoxStyles(legacy);
    await userEvent.tab();
    await expect.element(getSearchBoxSlots(headless).input).toHaveFocus();
    await settleSearchBoxStyles(headless);
    expect(compareSearchBoxStyles(focused, captureSearchBoxStyles(headless))).toEqual([]);
  },
);

test('lets ordinary consumer CSS override the inherited foundation and focused SearchBox deltas', async () => {
  const { headless } = await renderPair(searchBoxConsumerExample);
  const { input, contentBefore, contentAfter, dismiss } = getSearchBoxSlots(headless);
  expect(getComputedStyle(headless).minHeight).toBe('46px');
  expect(getComputedStyle(headless).maxWidth).toBe('420px');
  expect(getComputedStyle(headless).borderRadius).toBe('3px');
  expect(getComputedStyle(headless).backgroundColor).toBe('rgb(232, 240, 255)');
  expect(getComputedStyle(input).paddingInlineStart).toBe('18px');
  expect(getComputedStyle(input).paddingInlineEnd).toBe('18px');
  expect(getComputedStyle(input).color).toBe('rgb(32, 48, 96)');
  if (!contentBefore || !contentAfter || !dismiss) throw new Error('Missing consumer slots');
  expect(getComputedStyle(contentBefore).color).toBe('rgb(72, 32, 128)');
  expect(getComputedStyle(contentAfter).paddingInlineStart).toBe('18px');
  expect(getComputedStyle(contentAfter).columnGap).toBe('9px');
  expect(getComputedStyle(dismiss).color).toBe('rgb(128, 48, 32)');
  expect(getComputedStyle(dismiss).cursor).toBe('crosshair');
  await userEvent.click(input);
  await settleSearchBoxStyles(headless);
  expect(getComputedStyle(input).paddingInlineEnd).toBe('18px');
  expect(getComputedStyle(contentAfter).paddingInlineStart).toBe('18px');
});

test('preserves owned slot markers, classes, refs, ARIA, children, and native prop partitioning', async () => {
  const ref = React.createRef<HTMLInputElement>();
  const rootRef = React.createRef<HTMLSpanElement>();
  const beforeRef = React.createRef<HTMLSpanElement>();
  const afterRef = React.createRef<HTMLSpanElement>();
  const dismissRef = React.createRef<HTMLSpanElement>();
  const child = <span className="searchbox-original-child">Filter</span>;
  const rootProps: ExtractSlotProps<SearchBoxSlots['root']> & {
    'data-consumer-root': string;
  } = { ref: rootRef, 'data-consumer-root': 'kept' };
  const screen = await render(
    <CoreAIFluentProvider>
      <SearchBox
        ref={ref}
        name="contract"
        id="searchbox-contract"
        aria-label="Find a project"
        aria-controls="searchbox-results"
        aria-autocomplete="list"
        aria-expanded={false}
        autoComplete="off"
        className="searchbox-consumer-root"
        style={{ width: '280px' }}
        size="large"
        appearance="underline"
        root={rootProps}
        input={{ className: 'searchbox-consumer-input', size: 31 }}
        contentBefore={{ ref: beforeRef, className: 'searchbox-consumer-before' }}
        contentAfter={{ ref: afterRef, className: 'searchbox-consumer-after', children: child }}
        dismiss={{
          ref: dismissRef,
          className: 'searchbox-consumer-dismiss',
          'aria-label': 'Clear project search',
        }}
      />
      <div id="searchbox-results" />
    </CoreAIFluentProvider>,
  );
  const input = nativeQuery(screen.container, 'contract');
  const root = queryRoot(input);
  const slots = getSearchBoxSlots(root);
  expect(ref.current).toBe(input);
  expect(rootRef.current).toBe(root);
  expect(beforeRef.current).toBe(slots.contentBefore);
  expect(afterRef.current).toBe(slots.contentAfter);
  expect(dismissRef.current).toBe(slots.dismiss);
  expect(root).toHaveClass(searchBoxClassNames.root, 'searchbox-consumer-root');
  expect(input).toHaveClass(searchBoxClassNames.input, 'searchbox-consumer-input');
  expect(slots.contentBefore).toHaveClass(
    searchBoxClassNames.contentBefore,
    'searchbox-consumer-before',
  );
  expect(slots.contentAfter).toHaveClass(
    searchBoxClassNames.contentAfter,
    'searchbox-consumer-after',
  );
  expect(slots.dismiss).toHaveClass(searchBoxClassNames.dismiss, 'searchbox-consumer-dismiss');
  expect(root).toHaveAttribute('data-consumer-root', 'kept');
  expect(root).toHaveAttribute('data-size', 'large');
  expect(root).toHaveAttribute('data-appearance', 'underline');
  expect(root).toHaveAttribute('data-has-content-before', '');
  expect(root).toHaveAttribute('data-has-content-after', '');
  expect(root).toHaveAttribute('data-has-dismiss', '');
  expect(input.type).toBe('search');
  expect(input.size).toBe(31);
  expect(input).toHaveAccessibleName('Find a project');
  expect(input).toHaveAttribute('aria-controls', 'searchbox-results');
  expect(input).toHaveAttribute('aria-autocomplete', 'list');
  expect(input).toHaveAttribute('aria-expanded', 'false');
  expect(input).toHaveAttribute('autocomplete', 'off');
  expect(input).not.toHaveAttribute('appearance');
  expect(input).not.toHaveAttribute('data-size');
  expect(slots.dismiss).toHaveAttribute('tabindex', '-1');
  expect(slots.contentBefore?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  expect(slots.dismiss?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  expect(root.querySelector('.searchbox-original-child')?.className).toBe(child.props.className);
  expect(child.props.className).toBe('searchbox-original-child');
  expect(root.querySelector('[data-tabster], [data-fui-focus-visible]')).toBeNull();
  expect(root).not.toHaveAttribute('data-tabster');
});

const ConsumerSpan: ForwardRefComponent<React.ComponentPropsWithRef<'span'>> = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithRef<'span'>
>(function ConsumerSpan(props, ref) {
  return <span {...props} ref={ref} />;
});

test('keeps native slot metadata while caller render functions retain resolved glyphs, dismiss, and refs', async () => {
  const rootRef = React.createRef<HTMLSpanElement>();
  const beforeRef = React.createRef<HTMLSpanElement>();
  const afterRef = React.createRef<HTMLSpanElement>();
  const dismissRef = React.createRef<HTMLSpanElement>();
  const renderRoot: SlotRenderFunction<ExtractSlotProps<SearchBoxSlots['root']>> = (
    _Component,
    props,
  ) => <ConsumerSpan {...props} data-rendered-root="" />;
  const renderBefore: SlotRenderFunction<ExtractSlotProps<SearchBoxSlots['contentBefore']>> = (
    Component,
    props,
  ) => <Component {...props} data-rendered-before="" />;
  const renderAfter: SlotRenderFunction<ExtractSlotProps<SearchBoxSlots['contentAfter']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-rendered-after="">
      <span className="searchbox-rendered-filter">Filter</span>
      {props.children}
    </Component>
  );
  const renderDismiss: SlotRenderFunction<ExtractSlotProps<SearchBoxSlots['dismiss']>> = (
    Component,
    props,
  ) => <Component {...props} data-rendered-dismiss="" />;
  const onChange = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <SearchBox
        name="render-functions"
        aria-label="Rendered query"
        defaultValue="Atlas"
        onChange={onChange}
        root={{ ref: rootRef, children: renderRoot }}
        contentBefore={{ ref: beforeRef, children: renderBefore }}
        contentAfter={{ ref: afterRef, children: renderAfter }}
        dismiss={{ ref: dismissRef, 'aria-label': 'Clear rendered query', children: renderDismiss }}
      />
    </CoreAIFluentProvider>,
  );
  const input = nativeQuery(screen.container, 'render-functions');
  const root = queryRoot(input);
  const slots = getSearchBoxSlots(root);
  expect(rootRef.current).toBe(root);
  expect(beforeRef.current).toBe(slots.contentBefore);
  expect(afterRef.current).toBe(slots.contentAfter);
  expect(dismissRef.current).toBe(slots.dismiss);
  expect(root).toHaveAttribute('data-rendered-root', '');
  expect(slots.contentBefore).toHaveAttribute('data-rendered-before', '');
  expect(slots.contentAfter).toHaveAttribute('data-rendered-after', '');
  expect(slots.dismiss).toHaveAttribute('data-rendered-dismiss', '');
  expect(slots.contentBefore?.querySelector('svg')).not.toBeNull();
  expect(slots.dismiss?.querySelector('svg')).not.toBeNull();
  expect(root.querySelector('.searchbox-rendered-filter')).toHaveTextContent('Filter');
  await userEvent.click(input);
  if (!slots.dismiss) throw new Error('Missing rendered dismiss control');
  await userEvent.click(slots.dismiss);
  await expect.element(input).toHaveValue('');
  await expect.element(input).toHaveFocus();
  expect(onChange).toHaveBeenCalledExactlyOnceWith(expect.anything(), { value: '' });
});

test('retains explicit native input slot ref precedence without replacing the input element', async () => {
  const forwardedRef = React.createRef<HTMLInputElement>();
  const slotRef = React.createRef<HTMLInputElement>();
  const screen = await render(
    <CoreAIFluentProvider>
      <SearchBox
        ref={forwardedRef}
        name="slot-ref"
        aria-label="Slot ref query"
        input={{ ref: slotRef }}
      />
    </CoreAIFluentProvider>,
  );
  const input = nativeQuery(screen.container, 'slot-ref');
  expect(slotRef.current).toBe(input);
  expect(forwardedRef.current).toBeNull();
  await userEvent.fill(input, 'Atlas');
  expect(nativeQuery(screen.container, 'slot-ref')).toBe(input);
  expect(slotRef.current).toBe(input);
});

test('resolves disabled, read-only, invalid, and slot-presence attributes from native slots', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <SearchBox
        name="enabled-slot"
        aria-label="Enabled native slot"
        disabled
        readOnly
        aria-invalid
        input={{ disabled: false, readOnly: false, 'aria-invalid': 'grammar' }}
        contentBefore={null}
        dismiss={null}
      />
      <SearchBox
        name="disabled-slot"
        aria-label="Disabled native slot"
        input={{ disabled: true, readOnly: true, 'aria-invalid': true }}
        contentAfter={null}
      />
    </CoreAIFluentProvider>,
  );
  const enabled = nativeQuery(screen.container, 'enabled-slot');
  const enabledRoot = queryRoot(enabled);
  expect(enabled.disabled).toBe(false);
  expect(enabled.readOnly).toBe(false);
  expect(enabledRoot).not.toHaveAttribute('data-disabled');
  expect(enabledRoot).not.toHaveAttribute('data-read-only');
  expect(enabledRoot).toHaveAttribute('data-invalid', 'grammar');
  expect(enabledRoot).not.toHaveAttribute('data-has-content-before');
  expect(enabledRoot).not.toHaveAttribute('data-has-dismiss');
  const disabled = nativeQuery(screen.container, 'disabled-slot');
  const disabledRoot = queryRoot(disabled);
  expect(disabledRoot).toHaveAttribute('data-disabled', '');
  expect(disabledRoot).toHaveAttribute('data-read-only', '');
  expect(disabledRoot).toHaveAttribute('data-invalid', '');
  expect(disabledRoot).not.toHaveAttribute('data-has-content-after');
  expect(disabledRoot).not.toHaveAttribute('data-has-dismiss');
  expect(getSearchBoxSlots(disabledRoot).dismiss).toBeNull();
});

test('retains Field labeling, validation, required state, and SearchBox-specific size resolution', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <Field
        label="Project query"
        size="large"
        required
        validationState="error"
        validationMessage="Enter a project"
        hint="Search the catalog"
      >
        <SearchBox name="field" />
      </Field>
      <Field label="Small query" size="large">
        <SearchBox name="small-field" size="small" />
      </Field>
    </CoreAIFluentProvider>,
  );
  const input = nativeQuery(screen.container, 'field');
  expect(screen.getByRole('searchbox', { name: 'Project query', exact: false }).element()).toBe(
    input,
  );
  expect(input.required).toBe(true);
  expect(input.validity.valueMissing).toBe(true);
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAccessibleDescription('Enter a project Search the catalog');
  expect(queryRoot(input)).toHaveAttribute('data-invalid', '');
  expect(queryRoot(input)).toHaveAttribute('data-size', 'medium');
  expect(getComputedStyle(queryRoot(input)).minHeight).toBe('32px');
  const small = nativeQuery(screen.container, 'small-field');
  expect(queryRoot(small)).toHaveAttribute('data-size', 'small');
  expect(getComputedStyle(queryRoot(small)).minHeight).toBe('24px');
});

test('keeps uncontrolled query changes and dismiss callbacks single, ordered, and on the same input', async () => {
  const ref = React.createRef<HTMLInputElement>();
  const onChange = vi.fn();
  const onInput = vi.fn();
  const onSlotChange = vi.fn();
  const onDismiss = vi.fn();
  const order: string[] = [];
  const observed: {
    type: string;
    target: EventTarget;
    currentTarget: EventTarget;
    value: string;
  }[] = [];
  const screen = await render(
    <CoreAIFluentProvider>
      <SearchBox
        ref={ref}
        name="uncontrolled"
        aria-label="Project query"
        defaultValue="Atlas"
        input={{ onChange: onSlotChange }}
        onInput={onInput}
        dismiss={{
          'aria-label': 'Clear query',
          onClick: (event) => {
            order.push('dismiss');
            onDismiss(event);
          },
        }}
        onChange={(event, data) => {
          order.push('change');
          observed.push({
            type: event.type,
            target: event.target,
            currentTarget: event.currentTarget,
            value: data.value,
          });
          onChange(event, data);
        }}
      />
    </CoreAIFluentProvider>,
  );
  const input = nativeQuery(screen.container, 'uncontrolled');
  const root = queryRoot(input);
  expect(input.value).toBe('Atlas');
  await userEvent.fill(input, 'Orion');
  expect(input.value).toBe('Orion');
  expect(observed).toEqual([
    { type: 'change', target: input, currentTarget: input, value: 'Orion' },
  ]);
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onInput).toHaveBeenCalledTimes(1);
  // The installed public hook owns native onChange rather than delegating to the input slot.
  expect(onSlotChange).not.toHaveBeenCalled();
  const dismiss = getSearchBoxSlots(root).dismiss;
  if (!dismiss) throw new Error('Missing dismiss control');
  await userEvent.click(dismiss);
  expect(input.value).toBe('');
  expect(observed[1].type).toBe('click');
  expect(observed[1].currentTarget).toBe(dismiss);
  expect(observed[1].value).toBe('');
  const dismissTarget = observed[1].target;
  expect(dismissTarget instanceof Node && dismiss.contains(dismissTarget)).toBe(true);
  expect(onChange).toHaveBeenCalledTimes(2);
  expect(onDismiss).toHaveBeenCalledTimes(1);
  expect(order).toEqual(['change', 'dismiss', 'change']);
  await expect.element(input).toHaveFocus();
  expect(root).toHaveAttribute('data-focused', '');
  expect(ref.current).toBe(input);
  expect(nativeQuery(screen.container, 'uncontrolled')).toBe(input);
});

test('keeps controlled transformations, external updates, dismiss data, and Enter form submission distinct', async () => {
  const onChange = vi.fn();
  const onSubmit = vi.fn();
  function ControlledSearch() {
    const [value, setValue] = React.useState('');
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(new FormData(event.currentTarget).get('query'));
        }}
      >
        <SearchBox
          name="query"
          aria-label="Controlled query"
          value={value}
          dismiss={{ 'aria-label': 'Clear controlled query' }}
          onChange={(event, data) => {
            onChange(event.type, data);
            setValue(data.value.toUpperCase());
          }}
        />
        <button type="submit">Search</button>
        <button type="button" onClick={() => setValue('SAVED')}>
          Restore saved query
        </button>
      </form>
    );
  }
  const screen = await render(
    <CoreAIFluentProvider>
      <ControlledSearch />
    </CoreAIFluentProvider>,
  );
  const input = nativeQuery(screen.container, 'query');
  await userEvent.fill(input, 'atlas');
  expect(input.value).toBe('ATLAS');
  expect(onChange).toHaveBeenCalledExactlyOnceWith('change', { value: 'atlas' });
  await userEvent.keyboard('{Enter}');
  expect(onSubmit).toHaveBeenCalledExactlyOnceWith('ATLAS');
  await userEvent.click(screen.getByRole('button', { name: 'Restore saved query' }));
  expect(input.value).toBe('SAVED');
  expect(onChange).toHaveBeenCalledTimes(1);
  await userEvent.click(input);
  await userEvent.click(screen.getByRole('button', { name: 'Clear controlled query' }));
  expect(input.value).toBe('');
  expect(onChange).toHaveBeenCalledTimes(2);
  expect(onChange).toHaveBeenLastCalledWith('click', { value: '' });
  await expect.element(input).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(onSubmit).toHaveBeenCalledTimes(2);
  expect(onSubmit).toHaveBeenLastCalledWith('');
});

test('allows a controlled owner to decline both native edits and dismiss requests', async () => {
  const onChange = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <SearchBox
        name="fixed"
        aria-label="Fixed query"
        value="Pinned"
        dismiss={{ 'aria-label': 'Clear fixed query' }}
        onChange={onChange}
      />
    </CoreAIFluentProvider>,
  );
  const input = nativeQuery(screen.container, 'fixed');
  await userEvent.fill(input, 'Edited');
  expect(input.value).toBe('Pinned');
  expect(onChange).toHaveBeenCalledExactlyOnceWith(expect.anything(), { value: 'Edited' });
  await userEvent.click(screen.getByRole('button', { name: 'Clear fixed query' }));
  expect(input.value).toBe('Pinned');
  expect(onChange).toHaveBeenCalledTimes(2);
  expect(onChange).toHaveBeenLastCalledWith(expect.anything(), { value: '' });
});

test('preserves native read-only editing and disabled form exclusion without composing a copy action', async () => {
  const onChange = vi.fn();
  const onSubmit = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit([...new FormData(event.currentTarget).entries()]);
        }}
      >
        <SearchBox
          name="readOnly"
          aria-label="Read only query"
          readOnly
          defaultValue="Atlas"
          onChange={onChange}
        />
        <SearchBox name="disabled" aria-label="Disabled query" disabled defaultValue="Hidden" />
        <button type="submit">Submit values</button>
      </form>
    </CoreAIFluentProvider>,
  );
  const input = nativeQuery(screen.container, 'readOnly');
  const disabled = nativeQuery(screen.container, 'disabled');
  await userEvent.click(input);
  await userEvent.keyboard('x');
  expect(input.value).toBe('Atlas');
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.container.querySelector('[aria-label^="Copy "]')).toBeNull();
  expect(queryRoot(input)).toHaveAttribute('data-read-only', '');
  await userEvent.click(disabled, { force: true });
  await expect.element(disabled).not.toHaveFocus();
  await userEvent.click(screen.getByRole('button', { name: 'Submit values' }));
  expect(onSubmit).toHaveBeenCalledExactlyOnceWith([['readOnly', 'Atlas']]);
});

test('matches the installed internally-controlled native form reset boundary and callback counts', async () => {
  const onLegacyChange = vi.fn();
  const onChange = vi.fn();
  const onReset = vi.fn();
  const onSubmit = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <form
        onReset={onReset}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit([...new FormData(event.currentTarget).entries()]);
        }}
      >
        <LegacySearchBox
          name="legacy"
          aria-label="Legacy query"
          defaultValue="Atlas"
          onChange={onLegacyChange}
        />
        <SearchBox
          name="headless"
          aria-label="Headless query"
          defaultValue="Atlas"
          onChange={onChange}
        />
        <div>
          <button type="reset">Reset</button>
          <button type="submit">Submit</button>
        </div>
      </form>
    </CoreAIFluentProvider>,
  );
  const legacy = nativeQuery(screen.container, 'legacy');
  const headless = nativeQuery(screen.container, 'headless');
  await userEvent.fill(legacy, 'Orion');
  await userEvent.fill(headless, 'Orion');
  expect(onLegacyChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(headless.defaultValue).toBe(legacy.defaultValue);
  expect(headless.defaultValue).toBe('Orion');
  await userEvent.click(screen.getByRole('button', { name: 'Reset', exact: true }));
  expect(onReset).toHaveBeenCalledTimes(1);
  expect(headless.value).toBe('Orion');
  expect(legacy.value).toBe('Orion');
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onLegacyChange).toHaveBeenCalledTimes(1);
  await userEvent.click(screen.getByRole('button', { name: 'Submit', exact: true }));
  expect(onSubmit).toHaveBeenCalledExactlyOnceWith([
    ['legacy', 'Orion'],
    ['headless', 'Orion'],
  ]);
});

test('matches Chromium native Escape value and callback behavior without adding a key handler', async () => {
  const observations: { type: string; target: EventTarget; value: string }[] = [];
  const { legacy, headless } = await renderPair({
    name: 'Native Escape',
    props: {
      defaultValue: 'Atlas',
      onChange: (event, data) => {
        observations.push({ type: event.type, target: event.target, value: data.value });
      },
    },
  });
  const oldInput = getSearchBoxSlots(legacy).input;
  const newInput = getSearchBoxSlots(headless).input;
  await userEvent.click(oldInput);
  await userEvent.keyboard('{Escape}');
  const legacyEvents = observations.splice(0);
  expect(legacyEvents.every(({ target }) => target === oldInput)).toBe(true);
  await userEvent.click(newInput);
  await userEvent.keyboard('{Escape}');
  expect(newInput.value).toBe(oldInput.value);
  expect(observations.map(({ type, value }) => ({ type, value }))).toEqual(
    legacyEvents.map(({ type, value }) => ({ type, value })),
  );
  expect(observations.every(({ target }) => target === newInput)).toBe(true);
  await expect.element(newInput).toHaveFocus();
});
