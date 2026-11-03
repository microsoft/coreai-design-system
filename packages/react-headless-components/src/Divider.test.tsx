// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import type { ExtractSlotProps, SlotRenderFunction } from '@fluentui/react-utilities';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { renderCoreAIComponent } from '../../../apps/storybook/src/stories/experiments/HeadlessTestUtils.js';
import {
  DividerComparison,
  dividerAlignments,
  dividerConsumerExamples,
  dividerExamples,
  type DividerExample,
} from '../../../apps/storybook/src/stories/experiments/DividerComparison.js';
import {
  captureDividerStyles,
  compareDividerStyles,
  getComparisonDivider,
  settleDividerStyles,
} from '../../../apps/storybook/src/stories/experiments/compareDividerStyles.js';
import comparisonStyles from '../../../apps/storybook/src/stories/experiments/DividerComparison.module.css';
import {
  Divider,
  DividerLabeled,
  dividerClassNames,
  dividerLabeledClassNames,
  type DividerLabeledSlots,
} from './Divider.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

async function renderPair(
  example: DividerExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await renderCoreAIComponent(<DividerComparison examples={[example]} />, {
    providerProps: { theme, withComponentDefaults, dir },
  });
  const legacy = getComparisonDivider(screen.container, 'legacy');
  const headless = getComparisonDivider(screen.container, 'headless');
  await Promise.all([settleDividerStyles(legacy), settleDividerStyles(headless)]);
  return { screen, legacy, headless };
}

for (const [mode, theme] of themes) {
  test.each(dividerExamples)(
    `matches $name root, content, and pseudo-element geometry in ${mode} mode`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(
        compareDividerStyles(captureDividerStyles(legacy), captureDividerStyles(headless)),
      ).toEqual([]);
      expect(headless.root).toHaveAttribute(
        'aria-orientation',
        example.props.vertical ? 'vertical' : 'horizontal',
      );
      expect(headless.root).toHaveAttribute(
        'data-orientation',
        example.props.vertical ? 'vertical' : 'horizontal',
      );
      expect(headless.root).toHaveAttribute(
        'data-appearance',
        example.props.appearance ?? 'default',
      );
      expect(headless.root).toHaveClass(dividerClassNames.root);
      if (example.family === 'divider') {
        expect(headless.root.tagName).toBe(example.props.as === 'div' ? 'DIV' : 'HR');
        expect(headless.root.childElementCount).toBe(0);
        expect(headless.wrapper).toBeNull();
      } else {
        const hasContent =
          example.props.children !== undefined && typeof example.props.children !== 'function';
        expect(headless.root.tagName).toBe('DIV');
        expect(headless.root).toHaveAttribute('role', 'separator');
        expect(Boolean(headless.wrapper)).toBe(hasContent);
        expect(headless.root.hasAttribute('data-has-content')).toBe(hasContent);
        if (headless.wrapper) {
          expect(headless.wrapper).toHaveClass(dividerLabeledClassNames.wrapper);
          if (example.props.children) {
            expect(headless.root).toHaveAttribute('aria-labelledby', headless.wrapper.id);
          }
        }
      }
    },
  );

  test.each(dividerConsumerExamples)(
    `gives unlayered consumer CSS priority for $name in ${mode} mode`,
    async (example) => {
      const { headless } = await renderPair(example, theme);
      const values = captureDividerStyles(headless);
      if (example.family === 'divider') {
        expect(values['root.margin-block-start']).toBe('18px');
        expect(values['root.margin-block-end']).toBe('18px');
        const border = example.props.vertical ? 'border-inline-end' : 'border-top';
        expect(values[`root.${border}-width`]).toBe('3px');
        expect(values[`root.${border}-color`]).toBe('rgb(30, 100, 130)');
      } else {
        expect(values['root.font-size']).toBe('18px');
        expect(values['root.line-height']).toBe('24px');
        expect(values['root.color']).toBe('rgb(30, 100, 130)');
        expect(values['root::before.border-top-width']).toBe('3px');
        expect(values['root::after.border-top-width']).toBe('3px');
        expect(values['root::before.border-top-color']).toBe('rgb(30, 100, 130)');
        expect(values['wrapper.font-weight']).toBe('600');
        if (!(headless.wrapper instanceof HTMLDivElement)) {
          throw new Error('Missing consumer-styled DividerLabeled content wrapper');
        }
        expect(getComputedStyle(headless.wrapper).paddingInlineStart).toBe('6px');
      }
    },
  );
}

test.each([true, false])(
  'retains both default visual contracts with withComponentDefaults=%s',
  async (withComponentDefaults) => {
    for (const example of dividerExamples.filter(
      (item) => item.name.includes('default') || item.name.includes('explicitly undefined'),
    )) {
      const { legacy, headless } = await renderPair(
        example,
        coreaiLightTheme,
        withComponentDefaults,
      );
      expect(
        compareDividerStyles(captureDividerStyles(legacy), captureDividerStyles(headless)),
      ).toEqual([]);
      expect(headless.root).toHaveAttribute('data-appearance', 'default');
      expect(headless.root).not.toHaveAttribute('data-inset');
      if (example.family === 'labeled') {
        expect(headless.root).toHaveAttribute('data-align-content', 'center');
      }
    }
  },
);

test.each([false, true])('preserves CoreAI inset margins with vertical=%s', async (vertical) => {
  const { legacy, headless } = await renderPair({
    name: 'CoreAI inset',
    family: 'divider',
    props: { vertical, inset: true },
  });
  const style = getComputedStyle(headless.root);
  const reference = getComputedStyle(legacy.root);
  expect(style.marginInlineStart).toBe(reference.marginInlineStart);
  expect(style.marginBlockStart).toBe(reference.marginBlockStart);
  expect(vertical ? style.marginBlockStart : style.marginInlineStart).toBe('12px');
  expect(vertical ? style.marginInlineStart : style.marginBlockStart).toBe('4px');
  expect(style.paddingInlineStart).toBe('0px');
});

for (const vertical of [false, true]) {
  test.each(dividerAlignments)(
    `matches labeled %s alignment and line spacing in RTL with vertical=${vertical}`,
    async (alignContent) => {
      const { legacy, headless } = await renderPair(
        {
          name: 'RTL content alignment',
          family: 'labeled',
          props: { vertical, alignContent, inset: true, children: 'Workspace' },
        },
        coreaiLightTheme,
        true,
        'rtl',
      );
      expect(
        compareDividerStyles(captureDividerStyles(legacy), captureDividerStyles(headless)),
      ).toEqual([]);
      const before = getComputedStyle(headless.root, '::before');
      const after = getComputedStyle(headless.root, '::after');
      expect(vertical ? before.marginBlockEnd : before.marginInlineEnd).toBe('12px');
      expect(vertical ? after.marginBlockStart : after.marginInlineStart).toBe('12px');
      if (vertical) {
        expect(before.borderLeftWidth).toBe('1px');
        expect(before.borderRightWidth).toBe('0px');
      } else {
        expect(getComputedStyle(headless.root).textAlign).toBe(alignContent);
      }
    },
  );
}

test('places the contentless vertical stroke on the logical end in RTL', async () => {
  const { legacy, headless } = await renderPair(
    {
      name: 'RTL vertical native separator',
      family: 'divider',
      props: { vertical: true, appearance: 'brand', inset: true },
    },
    coreaiDarkTheme,
    true,
    'rtl',
  );
  expect(
    compareDividerStyles(captureDividerStyles(legacy), captureDividerStyles(headless)),
  ).toEqual([]);
  const style = getComputedStyle(headless.root);
  expect(style.borderLeftWidth).toBe('1px');
  expect(style.borderRightWidth).toBe('0px');
});

test.each([
  { label: 'undefined', children: undefined, wrapper: false, named: false, minHeight: '20px' },
  { label: 'null', children: null, wrapper: true, named: false, minHeight: '84px' },
  { label: 'false', children: false, wrapper: true, named: false, minHeight: '84px' },
  { label: 'empty string', children: '', wrapper: true, named: false, minHeight: '84px' },
  { label: 'zero', children: 0, wrapper: true, named: false, minHeight: '84px' },
  { label: 'text', children: 'Workspace', wrapper: true, named: true, minHeight: '84px' },
])(
  'preserves the current primitive content contract for $label children',
  async ({ children, wrapper, named, minHeight }) => {
    const screen = await renderCoreAIComponent(
      <DividerLabeled vertical aria-label="Section separator">
        {children}
      </DividerLabeled>,
    );
    const root = screen.getByRole('separator').element();
    const content = root.querySelector(`:scope > .${dividerLabeledClassNames.wrapper}`);
    expect(Boolean(content)).toBe(wrapper);
    expect(root.hasAttribute('aria-labelledby')).toBe(named);
    expect(getComputedStyle(root).minHeight).toBe(minHeight);
    expect(content?.textContent ?? '').toBe(children === 0 ? '0' : children || '');
    if (named) {
      await expect.element(screen.getByRole('separator', { name: 'Workspace' })).toBeVisible();
    }
    if (!wrapper) {
      expect(getComputedStyle(root, '::before').marginBlockEnd).toBe('0px');
      expect(getComputedStyle(root, '::after').marginBlockStart).toBe('0px');
    }
  },
);

test.each([undefined, 'div'] as const)(
  'renders the actual native separator for as=%s without slot compatibility warnings',
  async (as) => {
    const warnings = vi.spyOn(console, 'warn');
    const errors = vi.spyOn(console, 'error');
    const rootRef = React.createRef<HTMLHRElement>();
    const screen = await renderCoreAIComponent(
      <Divider ref={rootRef} as={as} aria-label="Native separator" />,
    );
    const separator = screen.getByRole('separator', { name: 'Native separator' });
    expect(separator.element().tagName).toBe(as === 'div' ? 'DIV' : 'HR');
    expect(rootRef.current).toBe(separator.element());
    await screen.rerender(<Divider ref={rootRef} as={as} vertical aria-label="Native separator" />);
    await expect.element(separator).toHaveAttribute('aria-orientation', 'vertical');
    expect(separator.element().tagName).toBe(as === 'div' ? 'DIV' : 'HR');
    await screen.rerender(
      <Divider ref={rootRef} as={as === 'div' ? undefined : 'div'} aria-label="Native separator" />,
    );
    expect(separator.element().tagName).toBe(as === 'div' ? 'HR' : 'DIV');
    expect(rootRef.current).toBe(separator.element());
    expect(warnings).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
  },
);

test.each([undefined, 'div'] as const)(
  'preserves the actual separator DOM, native events, classes, and refs for as=%s',
  async (as) => {
    const objectRef = React.createRef<HTMLHRElement>();
    const callbackRef = vi.fn<(element: HTMLHRElement | null) => void>();
    const onClick = vi.fn((event: React.MouseEvent<HTMLHRElement>) => event.currentTarget.tagName);
    const onKeyDown = vi.fn(
      (event: React.KeyboardEvent<HTMLHRElement>) => event.currentTarget.tagName,
    );
    const screen = await renderCoreAIComponent(
      <Divider
        as={as}
        ref={objectRef}
        className="consumer-native-divider"
        aria-label="Section separator"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={onKeyDown}
      />,
    );
    const locator = screen.getByRole('separator', { name: 'Section separator' });
    const root = locator.element();
    expect(root.tagName).toBe(as === 'div' ? 'DIV' : 'HR');
    expect(objectRef.current).toBe(root);
    expect(root).toHaveClass(dividerClassNames.root, 'consumer-native-divider');
    await userEvent.click(root);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveReturnedWith(root.tagName);
    await userEvent.keyboard('{Enter}');
    expect(onKeyDown).toHaveReturnedWith(root.tagName);
    expect(onClick).toHaveBeenCalledTimes(1);

    await screen.rerender(
      <Divider as={as} ref={callbackRef} vertical aria-label="Section separator" />,
    );
    expect(objectRef.current).toBeNull();
    expect(callbackRef).toHaveBeenLastCalledWith(locator.element());
    await expect.element(locator).toHaveAttribute('aria-orientation', 'vertical');
    expect(getComputedStyle(locator.element()).borderInlineEndWidth).toBe('1px');
    expect(locator.element().childElementCount).toBe(0);
  },
);

test('preserves resolved labeled root and wrapper refs, custom rendering, classes, and naming', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const wrapperRef = React.createRef<HTMLDivElement>();
  const onClick = vi.fn((event: React.MouseEvent<HTMLDivElement>) => event.currentTarget.tagName);
  const renderWrapper: SlotRenderFunction<ExtractSlotProps<DividerLabeledSlots['wrapper']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-custom-wrapper="">
      <strong data-custom-content="">{props.children}</strong>
    </Component>
  );
  const screen = await renderCoreAIComponent(
    <DividerLabeled
      ref={rootRef}
      className="consumer-labeled-root"
      aria-labelledby="workspace-divider-content"
      onClick={onClick}
      wrapper={{
        id: 'workspace-divider-content',
        ref: wrapperRef,
        className: 'consumer-labeled-wrapper',
        children: renderWrapper,
      }}
    >
      Workspace settings
    </DividerLabeled>,
  );
  const root = screen.getByRole('separator', { name: 'Workspace settings' }).element();
  const wrapper = root.querySelector('[data-custom-wrapper]');
  expect(rootRef.current).toBe(root);
  expect(wrapperRef.current).toBe(wrapper);
  expect(root).toHaveClass(dividerLabeledClassNames.root, 'consumer-labeled-root');
  expect(wrapper).toHaveClass(dividerLabeledClassNames.wrapper, 'consumer-labeled-wrapper');
  expect(wrapper?.querySelector('[data-custom-content]')).toHaveTextContent('Workspace settings');
  await userEvent.click(root);
  expect(onClick).toHaveBeenCalledTimes(1);
  expect(onClick).toHaveReturnedWith('DIV');
});

test('keeps caller root render functions on the actual labeled separator', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const onClick = vi.fn();
  const renderRoot: SlotRenderFunction<ExtractSlotProps<DividerLabeledSlots['root']>> = (
    Component,
    props,
  ) => <Component {...props} data-custom-root="" />;
  const screen = await renderCoreAIComponent(
    <DividerLabeled
      ref={rootRef}
      vertical
      aria-label="Rendered section separator"
      aria-labelledby={undefined}
      className="consumer-rendered-root"
      onClick={onClick}
    >
      {renderRoot}
    </DividerLabeled>,
  );
  const root = screen.getByRole('separator', { name: 'Rendered section separator' }).element();
  expect(rootRef.current).toBe(root);
  expect(root).toHaveClass(dividerLabeledClassNames.root, 'consumer-rendered-root');
  expect(root).toHaveAttribute('data-custom-root', '');
  expect(root).toHaveAttribute('aria-orientation', 'vertical');
  expect(root.querySelector(`.${dividerLabeledClassNames.wrapper}`)).toBeNull();
  await userEvent.click(root);
  expect(onClick).toHaveBeenCalledTimes(1);
});

test('updates real separator orientation, content association, and empty-line geometry', async () => {
  const screen = await renderCoreAIComponent(
    <DividerLabeled aria-label="Workspace separator">Workspace</DividerLabeled>,
  );
  const root = screen.getByRole('separator', { name: 'Workspace' }).element();
  const wrapper = root.querySelector(`.${dividerLabeledClassNames.wrapper}`);
  expect(root).toHaveAttribute('aria-labelledby', wrapper?.id);

  await screen.rerender(
    <DividerLabeled vertical aria-label="Workspace separator">
      Workspace
    </DividerLabeled>,
  );
  expect(screen.getByRole('separator', { name: 'Workspace' }).element()).toBe(root);
  expect(root).toHaveAttribute('aria-orientation', 'vertical');
  expect(getComputedStyle(root).minHeight).toBe('84px');

  await screen.rerender(<DividerLabeled vertical aria-label="Workspace separator" />);
  expect(screen.getByRole('separator', { name: 'Workspace separator' }).element()).toBe(root);
  expect(root).not.toHaveAttribute('aria-labelledby');
  expect(root.querySelector(`.${dividerLabeledClassNames.wrapper}`)).toBeNull();
  expect(getComputedStyle(root).minHeight).toBe('20px');
  expect(getComputedStyle(root, '::before').marginBlockEnd).toBe('0px');
  expect(getComputedStyle(root, '::after').marginBlockStart).toBe('0px');
});

test('keeps inline style priority above layered and unlayered consumer styles', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <Divider
        data-testid="native"
        className={comparisonStyles.consumerDivider}
        style={{ borderTopWidth: '5px', borderTopColor: 'rgb(150, 40, 60)', marginBlock: '22px' }}
      />
      <DividerLabeled
        data-testid="labeled"
        className={comparisonStyles.consumerLabeled}
        style={{ fontSize: '22px', color: 'rgb(150, 40, 60)' }}
        wrapper={{
          className: comparisonStyles.consumerWrapper,
          style: { paddingInline: '10px', fontWeight: 400 },
        }}
      >
        Workspace
      </DividerLabeled>
    </>,
  );
  const nativeStyle = getComputedStyle(screen.getByTestId('native').element());
  expect(nativeStyle.borderTopWidth).toBe('5px');
  expect(nativeStyle.borderTopColor).toBe('rgb(150, 40, 60)');
  expect(nativeStyle.marginBlockStart).toBe('22px');
  const labeled = screen.getByTestId('labeled').element();
  const wrapper = labeled.querySelector(`.${dividerLabeledClassNames.wrapper}`);
  expect(getComputedStyle(labeled).fontSize).toBe('22px');
  expect(getComputedStyle(labeled).color).toBe('rgb(150, 40, 60)');
  if (!(wrapper instanceof HTMLDivElement)) {
    throw new Error('Missing inline-styled DividerLabeled content wrapper');
  }
  expect(getComputedStyle(wrapper).paddingInlineStart).toBe('10px');
  expect(getComputedStyle(wrapper).fontWeight).toBe('400');
});
