// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import * as primitive from '@fluentui/react-headless-components-preview/tag';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../react-components/src/test-utils.js';
import {
  TagComparison,
  tagConsumerExample,
  tagDismissRenderer,
  tagExamples,
  tagTextRenderer,
  type TagExample,
} from '../../../apps/storybook/src/stories/experiments/TagComparison.js';
import { TagFormFlow } from '../../../apps/storybook/src/stories/experiments/TagFlows.js';
import {
  captureTagStyles,
  compareTagStyles,
  getComparisonTag,
  requireTagHTML,
  settleTagStyles,
} from '../../../apps/storybook/src/stories/experiments/compareTagStyles.js';
import { Tag, tagClassNames, useTagContextValues, type TagProps } from './Tag.js';
import { TagGroup } from './TagGroup.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

async function renderPair(
  example: TagExample,
  theme = coreaiLightTheme,
  defaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await renderCoreAIComponent(
    <>
      <div data-testid="tag-pointer-rest">Pointer rest</div>
      <TagComparison example={example} />
    </>,
    { providerProps: { theme, withComponentDefaults: defaults, dir } },
  );
  await userEvent.hover(screen.getByTestId('tag-pointer-rest'));
  const legacy = getComparisonTag(screen.container, 'legacy');
  const headless = getComparisonTag(screen.container, 'headless');
  await settleTagStyles(legacy, headless);
  return { screen, legacy, headless };
}

test('reports every captured CSS string, offset, dimension and missing value exactly', () => {
  expect(
    compareTagStyles(
      {
        'root.rect.width': '100',
        'icon.0.offset.left': '1',
        'root.color': 'rgb(0, 0, 0)',
        'primaryText.0.count': '1',
      },
      { 'root.rect.width': '100.01', 'icon.0.offset.left': '1.01', 'root.color': 'rgb(0, 0, 1)' },
    ),
  ).toEqual([
    { property: 'root.rect.width', legacy: '100', headless: '100.01', kind: 'unexpected' },
    { property: 'icon.0.offset.left', legacy: '1', headless: '1.01', kind: 'unexpected' },
    {
      property: 'root.color',
      legacy: 'rgb(0, 0, 0)',
      headless: 'rgb(0, 0, 1)',
      kind: 'unexpected',
    },
    { property: 'primaryText.0.count', legacy: '1', headless: null, kind: 'unexpected' },
  ]);
});

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  test.each(tagExamples)(
    `matches $name selected Tag styles and geometry in ${mode}`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(compareTagStyles(captureTagStyles(legacy), captureTagStyles(headless))).toEqual([]);
      expect(headless).toHaveClass(tagClassNames.root);
      expect(headless).toHaveAttribute('data-size', example.props?.size ?? 'medium');
      expect(headless).toHaveAttribute('data-shape', example.props?.shape ?? 'rounded');
      expect(headless).toHaveAttribute('data-appearance', example.props?.appearance ?? 'filled');
      expect(headless.getAttribute('size')).toBeNull();
      expect(headless.getAttribute('shape')).toBeNull();
      expect(headless.getAttribute('appearance')).toBeNull();
    },
  );

  test.each([true, false])(
    `preserves omitted/undefined visual defaults and real CoreAI padding in ${mode}, defaults=%s`,
    async (enabled) => {
      const { legacy, headless } = await renderPair(
        {
          name: 'Undefined defaults',
          props: { appearance: undefined, shape: undefined, size: undefined },
        },
        theme,
        enabled,
      );
      expect(compareTagStyles(captureTagStyles(legacy), captureTagStyles(headless))).toEqual([]);
      const text = requireTagHTML(headless.querySelector('[data-tag-part="primaryText"]'));
      expect(getComputedStyle(text).paddingBottom).toBe(enabled ? '0px' : '2px');
      expect(headless.tagName).toBe('SPAN');
    },
  );

  test(`keeps logical media, icon and dismiss spacing in RTL in ${mode}`, async () => {
    const example: TagExample = {
      name: 'RTL media',
      media: true,
      props: { size: 'small', shape: 'circular', dismissible: true },
    };
    const { legacy, headless } = await renderPair(example, theme, true, 'rtl');
    expect(compareTagStyles(captureTagStyles(legacy), captureTagStyles(headless))).toEqual([]);
    const media = requireTagHTML(headless.querySelector('[data-tag-part="media"]'));
    expect(getComputedStyle(media).paddingRight).toBe('1px');
    expect(getComputedStyle(media).paddingLeft).toBe('6px');
  });

  test(`lets ordinary consumer CSS override root, text and icon styles in ${mode}`, async () => {
    const { legacy, headless } = await renderPair(tagConsumerExample, theme);
    expect(getComputedStyle(headless).minWidth).toBe('180px');
    expect(getComputedStyle(headless).borderRadius).toBe('3px');
    const text = requireTagHTML(headless.querySelector('[data-tag-part="primaryText"]'));
    const icon = requireTagHTML(headless.querySelector('[data-tag-part="icon"]'));
    expect(getComputedStyle(text).paddingBottom).toBe('4px');
    expect(getComputedStyle(text).fontSize).toBe('16px');
    expect(getComputedStyle(icon).fontSize).toBe('18px');
    expect(
      compareTagStyles(captureTagStyles(legacy), captureTagStyles(headless), true).filter(
        (difference) => difference.kind === 'unexpected',
      ),
    ).toEqual([]);
  });
}

test('preserves public ref types, stable slot markers, caller render functions and owned glyph boundaries', async () => {
  expectTypeOf(Tag).toMatchTypeOf<ForwardRefComponent<TagProps>>();
  expectTypeOf<NonNullable<TagProps['as']>>().toEqualTypeOf<'button' | 'span'>();
  expect(useTagContextValues).toBe(primitive.useTagContextValues);
  const rootRef = React.createRef<HTMLButtonElement>();
  const spanRef = React.createRef<HTMLSpanElement>();
  const textRef = React.createRef<HTMLSpanElement>();
  const iconRef = React.createRef<HTMLSpanElement>();
  const dismissRef = React.createRef<HTMLSpanElement>();
  const dismiss = vi.fn();
  const screen = await renderCoreAIComponent(
    <TagGroup aria-label="Caller slots" onDismiss={dismiss}>
      <Tag
        as="button"
        ref={rootRef}
        value="atlas"
        name="label"
        dismissible
        size="small"
        className="caller-tag"
        data-consumer="preserved"
        primaryText={{ ref: textRef, className: 'caller-text', children: tagTextRenderer }}
        icon={{
          ref: iconRef,
          className: 'caller-icon',
          children: (
            <svg
              className="caller-glyph"
              data-testid="tag-caller-glyph"
              width="12"
              height="12"
              aria-hidden
            >
              <path d="M0 0h12v12H0z" />
            </svg>
          ),
        }}
        dismissIcon={{
          ref: dismissRef,
          className: 'caller-dismiss',
          'aria-label': 'remove',
          children: tagDismissRenderer,
        }}
      >
        Project Atlas
      </Tag>
      <Tag as="span" ref={spanRef}>
        Static label
      </Tag>
    </TagGroup>,
  );
  const button = screen.getByRole('button', { name: 'Project Atlas remove', exact: true });
  expect(rootRef.current).toBe(button.element());
  expect(rootRef.current).toHaveAttribute('type', 'button');
  expect(rootRef.current).toHaveAttribute('name', 'label');
  expect(rootRef.current).toHaveAttribute('value', 'atlas');
  expect(rootRef.current).toHaveAttribute('data-consumer', 'preserved');
  expect(rootRef.current).toHaveClass(tagClassNames.root, 'caller-tag');
  expect(textRef.current).toHaveClass(tagClassNames.primaryText, 'caller-text');
  expect(textRef.current).toHaveAttribute('data-tag-rendered-text');
  expect(textRef.current?.textContent).toBe('Project Atlas');
  expect(iconRef.current).toHaveClass(tagClassNames.icon, 'caller-icon');
  expect(dismissRef.current).toHaveClass(tagClassNames.dismissIcon, 'caller-dismiss');
  expect(dismissRef.current).toHaveAttribute('data-tag-rendered-dismiss');
  expect(dismissRef.current?.querySelectorAll('svg').length).toBe(1);
  expect(screen.getByTestId('tag-caller-glyph').element().getAttribute('class')).toBe(
    'caller-glyph',
  );
  expect(spanRef.current?.tagName).toBe('SPAN');
  await userEvent.click(button);
  expect(dismiss).toHaveBeenCalledTimes(1);
  expect(dismiss.mock.calls[0][1]).toEqual({ value: 'atlas' });
  expect(dismiss.mock.calls[0][0].type).toBe('click');
});

for (const appearance of ['filled', 'outline', 'brand'] as const) {
  for (const disabled of [false, true]) {
    test(`retains dismiss-icon hover and disabled/selected priority: ${appearance}, disabled=${disabled}`, async () => {
      const { legacy, headless } = await renderPair({
        name: 'Dismiss hover',
        props: { appearance, disabled, selected: true, dismissible: true },
      });
      const oldDismiss = requireTagHTML(legacy.querySelector('[data-tag-part="dismissIcon"]'));
      const newDismiss = requireTagHTML(headless.querySelector('[data-tag-part="dismissIcon"]'));
      await userEvent.hover(oldDismiss);
      await settleTagStyles(legacy);
      expect(oldDismiss.matches(':hover')).toBe(true);
      const oldStyles = captureTagStyles(legacy);
      await userEvent.hover(newDismiss);
      await settleTagStyles(headless);
      expect(newDismiss.matches(':hover')).toBe(true);
      expect(compareTagStyles(oldStyles, captureTagStyles(headless))).toEqual([]);
    });
  }
}

test.each(['rounded', 'circular'] as const)(
  'uses the native keyboard-focus outline for a %s dismissible Tag',
  async (shape) => {
    const { screen, legacy, headless } = await renderPair({
      name: 'Native focus',
      props: { dismissible: true, shape },
    });
    await userEvent.hover(screen.getByTestId('tag-pointer-rest'));
    await userEvent.tab();
    legacy.focus();
    await settleTagStyles(legacy);
    const oldComputed = getComputedStyle(legacy);
    const outline = [oldComputed.outlineStyle, oldComputed.outlineWidth, oldComputed.outlineColor];
    headless.focus();
    await settleTagStyles(headless);
    expect(headless.matches(':focus-visible')).toBe(true);
    const computed = getComputedStyle(headless);
    expect([computed.outlineStyle, computed.outlineWidth, computed.outlineColor]).toEqual(outline);
  },
);

test('retains user preventDefault for both click and Delete/Backspace without normalizing dismissal payloads', async () => {
  const dismiss = vi.fn();
  const click = vi.fn((event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault());
  const key = vi.fn((event: React.KeyboardEvent<HTMLButtonElement>) => event.preventDefault());
  const screen = await renderCoreAIComponent(
    <TagGroup aria-label="Veto" onDismiss={dismiss}>
      <Tag
        as="button"
        value="keep"
        dismissible
        onClick={click}
        onKeyDown={key}
        aria-label="Keep label"
      >
        Keep
      </Tag>
    </TagGroup>,
  );
  const button = screen.getByRole('button', { name: 'Keep label', exact: true });
  await userEvent.click(button);
  await userEvent.keyboard('{Delete}{Backspace}');
  expect(click).toHaveBeenCalledTimes(1);
  expect(key).toHaveBeenCalledTimes(2);
  expect(dismiss).not.toHaveBeenCalled();
  expect(requireTagHTML(button.element())).toBe(document.activeElement);
});

test('keeps dismissIcon null and caller content independent from current dismissible-button behavior', async () => {
  const dismiss = vi.fn();
  const screen = await renderCoreAIComponent(
    <TagGroup onDismiss={dismiss}>
      <Tag as="button" value="without-glyph" dismissible dismissIcon={null}>
        No glyph
      </Tag>
      <Tag
        as="button"
        value="custom"
        dismissible
        dismissIcon={{ children: <span data-testid="custom-dismiss-content">Close</span> }}
      >
        Custom content
      </Tag>
      <Tag as="button" value="disabled" dismissible disabled>
        Disabled
      </Tag>
    </TagGroup>,
  );
  const without = screen.getByRole('button', { name: 'No glyph', exact: true });
  expect(without.element().querySelector('svg')).toBeNull();
  expect(without.element()).not.toHaveAttribute('data-has-dismiss');
  await userEvent.click(without);
  expect(dismiss.mock.calls[0][1]).toEqual({ value: 'without-glyph' });
  expect(screen.getByTestId('custom-dismiss-content').element().textContent).toBe('Close');
  expect(
    screen
      .getByRole('button', { name: 'Custom content Close', exact: true })
      .element()
      .querySelector('svg'),
  ).toBeNull();
  const disabled = screen.getByRole('button', { name: 'Disabled', exact: true });
  await expect.element(disabled).toBeDisabled();
  const disabledButton = disabled.element();
  if (!(disabledButton instanceof HTMLButtonElement))
    throw new Error('Expected a native Tag button');
  disabledButton.click();
  expect(dismiss).toHaveBeenCalledTimes(1);
});

test('preserves native Tag/primary/secondary submission, submitter name/value and form reset in the shared flow', async () => {
  const screen = await renderCoreAIComponent(<TagFormFlow />);
  await userEvent.hover(screen.getByTestId('tag-flow-pointer-rest'));
  const input = screen.getByRole('textbox', { name: 'Project', exact: true });
  await userEvent.clear(input);
  await userEvent.type(input, 'Orion');
  const record = screen.getByLabelText('Tag form events', { exact: true });
  await userEvent.click(screen.getByRole('button', { name: 'Remove draft tag', exact: true }));
  await userEvent.click(screen.getByRole('button', { name: 'Remove publish action', exact: true }));
  await expect.element(record).toHaveAttribute('data-tag-form-dismissals', '2');
  await expect.element(record).toHaveAttribute('data-tag-form-submissions', '0');
  await userEvent.click(screen.getByRole('button', { name: 'Publish project', exact: true }));
  await expect.element(record).toHaveAttribute('data-tag-form-submissions', '1');
  await expect.element(record).toHaveAttribute('data-tag-form-submitter', 'action');
  await expect
    .element(record)
    .toHaveAttribute('data-tag-form-entries', '[["project","Orion"],["action","publish"]]');
  await userEvent.click(screen.getByRole('button', { name: 'Submit review tag', exact: true }));
  await expect.element(record).toHaveAttribute('data-tag-form-submissions', '2');
  await expect.element(record).toHaveAttribute('data-tag-form-dismissals', '3');
  await expect.element(record).toHaveAttribute('data-tag-form-submitter', 'label');
  await expect
    .element(record)
    .toHaveAttribute('data-tag-form-entries', '[["project","Orion"],["label","review"]]');
  await userEvent.click(screen.getByRole('button', { name: 'Reset project form', exact: true }));
  await expect.element(input).toHaveValue('Atlas');
  await expect.element(record).toHaveAttribute('data-tag-form-resets', '1');
});
