// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import * as primitive from '@fluentui/react-headless-components-preview/toolbar';
import type { ButtonSlots } from '@fluentui/react-headless-components-preview/button';
import type { DividerSlots } from '@fluentui/react-headless-components-preview/divider';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import {
  CoreAIFluentProvider,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import { FocusgroupConsumer } from '../../../apps/storybook/src/stories/experiments/FocusgroupConsumer.js';
import {
  ToolbarComparison,
  toolbarConsumerExample,
  toolbarExamples,
  type ToolbarExample,
} from '../../../apps/storybook/src/stories/experiments/ToolbarComparison.js';
import { ToolbarComparisonWithReport } from '../../../apps/storybook/src/stories/experiments/ToolbarComparisonReport.js';
import {
  ToolbarDynamicFlow,
  ToolbarEditingFlow,
  ToolbarFormFlow,
  ToolbarMenuFlow,
} from '../../../apps/storybook/src/stories/experiments/ToolbarFlows.js';
import {
  captureToolbarNativeContract,
  captureToolbarStyles,
  compareToolbarStyles,
  getComparisonToolbar,
  requireToolbarHTML,
  settleToolbarStyles,
} from '../../../apps/storybook/src/stories/experiments/compareToolbarStyles.js';
import {
  Toolbar,
  toolbarClassNames,
  useToolbarContext,
  useToolbarContextValues,
  type ToolbarProps,
  type ToolbarSlots,
} from './Toolbar.js';
import {
  ToolbarButton,
  toolbarButtonClassNames,
  type ToolbarButtonProps,
} from './ToolbarButton.js';
import {
  ToolbarDivider,
  toolbarDividerClassNames,
  type ToolbarDividerProps,
} from './ToolbarDivider.js';
import { ToolbarGroup, toolbarGroupClassNames, type ToolbarGroupProps } from './ToolbarGroup.js';
import {
  ToolbarRadioButton,
  toolbarRadioButtonClassNames,
  type ToolbarRadioButtonProps,
} from './ToolbarRadioButton.js';
import {
  ToolbarRadioGroup,
  toolbarRadioGroupClassNames,
  type ToolbarRadioGroupProps,
} from './ToolbarRadioGroup.js';
import {
  ToolbarToggleButton,
  toolbarToggleButtonClassNames,
  type ToolbarToggleButtonProps,
} from './ToolbarToggleButton.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

function html(locator: { element(): Element }): HTMLElement {
  return requireToolbarHTML(locator.element());
}

function part(root: ParentNode, name: string): HTMLElement {
  const element = root.querySelector(`[data-toolbar-part="${name}"]`);
  if (!(element instanceof HTMLElement)) throw new Error(`Missing Toolbar ${name}`);
  return element;
}

async function renderPair(
  example: ToolbarExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <FocusgroupConsumer>
        <ToolbarComparison example={example} />
      </FocusgroupConsumer>
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('Current CoreAI / Griffel', { exact: true }));
  const legacy = getComparisonToolbar(screen.container, 'legacy');
  const headless = getComparisonToolbar(screen.container, 'headless');
  await settleToolbarStyles(legacy, headless);
  return {
    screen,
    legacy,
    headless,
    differences: () =>
      compareToolbarStyles(
        captureToolbarStyles(legacy),
        captureToolbarStyles(headless),
        example.consumer,
      ),
  };
}

async function renderFlow(children: React.ReactNode, dir: 'ltr' | 'rtl' = 'ltr') {
  return render(
    <CoreAIFluentProvider theme={coreaiLightTheme} dir={dir}>
      {children}
    </CoreAIFluentProvider>,
  );
}

for (const [themeName, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  for (const example of toolbarExamples) {
    test(`${themeName}: ${example.name} preserves selected family styles and exact geometry`, async () => {
      const pair = await renderPair(example, theme);
      expect(pair.differences()).toEqual([]);
    });
  }
}

for (const name of ['Icon and text', 'Vertical button layout', 'Transparent checked']) {
  test(`RTL: ${name} retains logical spacing and exact family geometry`, async () => {
    const example = toolbarExamples.find((candidate) => candidate.name === name);
    if (!example) throw new Error(`Missing Toolbar example ${name}`);
    const pair = await renderPair(example, coreaiLightTheme, true, 'rtl');
    expect(pair.differences()).toEqual([]);
  });
}

test('CoreAI defaults opt-out does not invent Toolbar or delegated Button overrides', async () => {
  const example = { name: 'No Toolbar defaults', content: 'both', checked: true } as const;
  const pair = await renderPair(example, coreaiLightTheme, false);
  expect(pair.differences()).toEqual([]);
  expect(getComputedStyle(part(pair.headless, 'button')).minWidth).toBe('96px');
  expect(part(pair.headless, 'button').getAttribute('data-shape')).toBe('rounded');
});

test('Toolbar size restores public visual context, while plain ToolbarButton stays medium', async () => {
  function ContextSize() {
    const size = useToolbarContext((context) => context.size);
    return <output aria-label="Toolbar size">{size}</output>;
  }
  const screen = await renderFlow(
    <Toolbar size="small" aria-label="Small commands">
      <ToolbarButton>Plain action</ToolbarButton>
      <ToolbarToggleButton name="format" value="bold">
        Toggle action
      </ToolbarToggleButton>
      <ToolbarRadioButton name="align" value="left" size="large">
        Radio action
      </ToolbarRadioButton>
      <ContextSize />
    </Toolbar>,
  );
  await expect.element(screen.getByLabelText('Toolbar size')).toHaveTextContent('small');
  expect(html(screen.getByRole('button', { name: 'Plain action' })).dataset.size).toBe('medium');
  expect(html(screen.getByRole('button', { name: 'Toggle action' })).dataset.size).toBe('small');
  expect(html(screen.getByRole('radio', { name: 'Radio action' })).dataset.size).toBe('large');
});

for (const name of ['Default', 'Primary checked', 'Transparent checked', 'Checked disabled']) {
  test(`${name}: hover preserves delegated Button/Toggle state priority`, async () => {
    const example = toolbarExamples.find((candidate) => candidate.name === name);
    if (!example) throw new Error(`Missing Toolbar example ${name}`);
    const pair = await renderPair(example);
    for (const partName of ['button', 'toggle', 'radio']) {
      const capture = async (root: HTMLElement) => {
        const element = part(root, partName);
        await userEvent.hover(element);
        expect(element.matches(':hover')).toBe(true);
        await settleToolbarStyles(root);
        return captureToolbarStyles(root);
      };
      expect(
        compareToolbarStyles(await capture(pair.legacy), await capture(pair.headless)),
      ).toEqual([]);
    }
  });
}

test('keyboard focus uses native focus-visible with the delegated visual foundation', async () => {
  const pair = await renderPair({
    name: 'Focused selection',
    checked: true,
    appearance: 'primary',
  });
  await userEvent.keyboard('{Tab}');
  const capture = async (root: HTMLElement) => {
    const button = part(root, 'toggle');
    button.focus();
    expect(button.matches(':hover')).toBe(false);
    expect(button.matches(':focus-visible')).toBe(true);
    await settleToolbarStyles(root);
    return captureToolbarStyles(root);
  };
  expect(compareToolbarStyles(await capture(pair.legacy), await capture(pair.headless))).toEqual(
    [],
  );
});

test('ordinary consumer classes override layered Toolbar, Button and icon visuals', async () => {
  const pair = await renderPair(toolbarConsumerExample);
  expect(pair.differences().filter((difference) => difference.kind === 'unexpected')).toEqual([]);
  const button = part(pair.headless, 'button');
  expect(getComputedStyle(pair.headless).paddingTop).toBe('10px');
  expect(getComputedStyle(button).minWidth).toBe('120px');
  expect(getComputedStyle(button).borderRadius).toBe('3px');
  expect(getComputedStyle(part(button, 'icon')).fontSize).toBe('16px');
});

for (const controlled of [true, false]) {
  test(`${controlled ? 'controlled' : 'default'} checked values preserve exact payloads, native navigation and editing`, async () => {
    const change = vi.fn<NonNullable<ToolbarProps['onCheckedValueChange']>>();
    const screen = await renderFlow(
      <ToolbarEditingFlow controlled={controlled} onCheckedValueChange={change} />,
    );
    await userEvent.hover(screen.getByTestId('toolbar-pointer-rest'));
    const save = html(screen.getByRole('button', { name: 'Save draft' }));
    save.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(change.mock.calls[0][1]).toEqual({ name: 'format', checkedItems: [] });
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(screen.getByRole('button', { name: 'Italic' })).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(change.mock.calls[1][1]).toEqual({ name: 'format', checkedItems: ['italic'] });
    await userEvent.keyboard('{End}');
    await expect.element(screen.getByRole('radio', { name: 'Align center' })).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(change.mock.calls[2][1]).toEqual({ name: 'align', checkedItems: ['center'] });
    await userEvent.keyboard('{Home}');
    await expect.element(screen.getByRole('button', { name: 'Save draft' })).toHaveFocus();
    await userEvent.tab();
    await expect.element(screen.getByRole('button', { name: 'After toolbar' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect.element(screen.getByRole('button', { name: 'Save draft' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Lock unavailable' }), {
      force: true,
    });
    expect(change).toHaveBeenCalledTimes(3);
    await userEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    await expect
      .element(screen.getByLabelText('Toolbar editing events'))
      .toHaveAttribute('data-toolbar-last-action', 'save');
    const editor = screen.getByRole('textbox', { name: 'Document content' });
    await editor.fill('Toolbar notes');
    await expect.element(editor).toHaveValue('Toolbar notes');
    await expect
      .element(screen.getByLabelText('Toolbar editing events'))
      .toHaveAttribute('data-toolbar-text', 'Toolbar notes');
    expect(getComputedStyle(html(editor)).textAlign).toBe('center');
    expect(getComputedStyle(html(editor)).fontStyle).toBe('italic');
    await expect
      .element(screen.getByLabelText('Public Toolbar context'))
      .toHaveAttribute('data-context-checked', '{"format":["italic"],"align":["center"]}');
  });
}

for (const [label, dir, vertical, forward, backward] of [
  ['horizontal RTL', 'rtl', false, '{ArrowLeft}', '{ArrowRight}'],
  ['vertical LTR', 'ltr', true, '{ArrowDown}', '{ArrowUp}'],
  ['vertical RTL', 'rtl', true, '{ArrowDown}', '{ArrowUp}'],
] as const) {
  test(`${label}: native focusgroup wraps, skips disabled controls, supports Home/End and exits on Tab`, async () => {
    const screen = await renderFlow(<ToolbarEditingFlow vertical={vertical} />, dir);
    await userEvent.hover(screen.getByTestId('toolbar-pointer-rest'));
    const save = html(screen.getByRole('button', { name: 'Save draft' }));
    save.focus();
    await userEvent.keyboard(forward);
    await expect.element(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
    await userEvent.keyboard(backward);
    await expect.element(screen.getByRole('button', { name: 'Save draft' })).toHaveFocus();
    await userEvent.keyboard(backward);
    await expect.element(screen.getByRole('radio', { name: 'Align center' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect.element(screen.getByRole('button', { name: 'Save draft' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect.element(screen.getByRole('radio', { name: 'Align center' })).toHaveFocus();
    await userEvent.tab();
    await expect.element(screen.getByRole('button', { name: 'After toolbar' })).toHaveFocus();
    const toolbar = html(screen.getByRole('toolbar', { name: 'Document formatting' }));
    expect(toolbar.getAttribute('focusgroup')).toBe(
      `toolbar ${vertical ? 'block' : 'inline'} wrap`,
    );
    const native = captureToolbarNativeContract(toolbar);
    expect(native['focusgroup-mode']).toBe(
      'focusGroup' in HTMLElement.prototype ? 'native' : 'consumer-polyfill',
    );
  });
}

test('cold dynamically mounted, reopened and appended groups receive real focusgroup navigation', async () => {
  const screen = await renderFlow(<ToolbarDynamicFlow />);
  for (let mount = 0; mount < 2; mount += 1) {
    await userEvent.click(screen.getByRole('button', { name: 'Mount additional toolbar' }));
    await userEvent.hover(screen.getByTestId('toolbar-dynamic-pointer-rest'));
    html(screen.getByRole('button', { name: 'Additional first' })).focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(screen.getByRole('button', { name: 'Additional second' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect.element(screen.getByRole('button', { name: 'Additional last' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect.element(screen.getByRole('button', { name: 'Additional first' })).toHaveFocus();
    await userEvent.tab();
    await expect
      .element(screen.getByRole('button', { name: 'After dynamic toolbars' }))
      .toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect.element(screen.getByRole('button', { name: 'Additional first' })).toHaveFocus();
    await userEvent.click(screen.getByRole('button', { name: 'Unmount additional toolbar' }));
    await expect
      .element(screen.getByRole('toolbar', { name: 'Additional commands' }))
      .not.toBeInTheDocument();
  }
  await userEvent.click(screen.getByRole('button', { name: 'Add action group' }));
  await userEvent.hover(screen.getByTestId('toolbar-dynamic-pointer-rest'));
  html(screen.getByRole('button', { name: 'Second command' })).focus();
  await userEvent.keyboard('{ArrowRight}');
  await expect
    .element(screen.getByRole('button', { name: 'Added command', exact: true }))
    .toHaveFocus();
  await userEvent.keyboard('{End}');
  await expect.element(screen.getByRole('button', { name: 'Final added command' })).toHaveFocus();
  await userEvent.tab();
  await expect
    .element(screen.getByRole('button', { name: 'After dynamic toolbars' }))
    .toHaveFocus();
});

test('native submitters, default button type, reset and caller navigation veto are preserved', async () => {
  const screen = await renderFlow(<ToolbarFormFlow />);
  const title = screen.getByRole('textbox', { name: 'Document title' });
  await title.fill('Project plan');
  await userEvent.click(screen.getByRole('button', { name: 'Preview document' }));
  const result = screen.getByLabelText('Toolbar form result');
  await expect.element(result).toHaveAttribute('data-toolbar-form-payload', '');
  await expect.element(result).toHaveAttribute('data-toolbar-previews', '1');
  expect(html(screen.getByRole('button', { name: 'Preview document' })).getAttribute('type')).toBe(
    'button',
  );
  await userEvent.click(screen.getByRole('button', { name: 'Form bold' }));
  await userEvent.click(screen.getByRole('button', { name: 'Save document' }));
  await expect
    .element(result)
    .toHaveAttribute('data-toolbar-form-payload', '[["title","Project plan"],["action","save"]]');
  await userEvent.click(screen.getByRole('link', { name: 'Veto navigation' }));
  await expect.element(result).toHaveAttribute('data-toolbar-navigation-vetoed', 'true');
  await userEvent.click(screen.getByRole('button', { name: 'Reset document' }));
  await expect.element(title).toHaveValue('Draft');
  await expect
    .element(screen.getByRole('button', { name: 'Form bold' }))
    .toHaveAttribute('aria-pressed', 'true');
});

test('controlled context can reject changes and caller click cancellation retains upstream ordering', async () => {
  const checked = { format: [] };
  const order: string[] = [];
  const change = vi.fn<NonNullable<ToolbarProps['onCheckedValueChange']>>(() => {
    order.push('change');
  });
  const screen = await renderFlow(
    <Toolbar checkedValues={checked} onCheckedValueChange={change}>
      <ToolbarToggleButton
        name="format"
        value="bold"
        onClick={(event) => {
          event.preventDefault();
          order.push('click');
        }}
      >
        Rejected toggle
      </ToolbarToggleButton>
    </Toolbar>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Rejected toggle' }));
  expect(order).toEqual(['change', 'click']);
  expect(change.mock.calls[0][1]).toEqual({ name: 'format', checkedItems: ['bold'] });
  await expect
    .element(screen.getByRole('button', { name: 'Rejected toggle' }))
    .toHaveAttribute('aria-pressed', 'false');
});

test('disabled-focusable radio retains the raw facade boundary; controlled context safely rejects its notification', async () => {
  const currentChange = vi.fn<NonNullable<ToolbarProps['onCheckedValueChange']>>();
  const primitiveChange = vi.fn<NonNullable<primitive.ToolbarProps['onCheckedValueChange']>>();
  const screen = await renderFlow(
    <>
      <Toolbar checkedValues={{ align: ['left'] }} onCheckedValueChange={currentChange}>
        <ToolbarRadioButton name="align" value="right" disabledFocusable>
          Current disabled radio
        </ToolbarRadioButton>
      </Toolbar>
      <primitive.Toolbar checkedValues={{ align: ['left'] }} onCheckedValueChange={primitiveChange}>
        <primitive.ToolbarRadioButton name="align" value="right" disabledFocusable>
          Primitive disabled radio
        </primitive.ToolbarRadioButton>
      </primitive.Toolbar>
    </>,
  );
  await userEvent.click(screen.getByRole('radio', { name: 'Primitive disabled radio' }), {
    force: true,
  });
  await userEvent.click(screen.getByRole('radio', { name: 'Current disabled radio' }), {
    force: true,
  });
  expect(currentChange.mock.calls.length).toBe(primitiveChange.mock.calls.length);
  expect(currentChange.mock.calls.map((call) => call[1])).toEqual(
    primitiveChange.mock.calls.map((call) => call[1]),
  );
  await expect
    .element(screen.getByRole('radio', { name: 'Current disabled radio' }))
    .toHaveAttribute('aria-disabled', 'true');
  await expect
    .element(screen.getByRole('radio', { name: 'Current disabled radio' }))
    .toHaveAttribute('aria-checked', 'false');
});

test('current refs, classes, owned glyphs, native element metadata and valid slot renderers survive', async () => {
  const toolbarRef = React.createRef<HTMLDivElement>();
  const buttonRef = React.createRef<HTMLAnchorElement>();
  const iconRef = React.createRef<HTMLSpanElement>();
  const dividerRef = React.createRef<HTMLDivElement>();
  const groupRef = React.createRef<HTMLDivElement>();
  const radioGroupRef = React.createRef<HTMLDivElement>();
  const radioRef = React.createRef<HTMLButtonElement>();
  const toggleRef = React.createRef<HTMLButtonElement>();
  type AnchorRootProps = Extract<ExtractSlotProps<ButtonSlots['root']>, { as: 'a' }>;
  type NativeButtonRootProps = Extract<ExtractSlotProps<ButtonSlots['root']>, { as?: 'button' }>;
  const renderRoot: SlotRenderFunction<ExtractSlotProps<ToolbarSlots['root']>> = (
    Component,
    props,
  ) => <Component {...props} data-toolbar-root-rendered="" />;
  const renderButton: SlotRenderFunction<AnchorRootProps> = (Component, props) => (
    <Component {...props} as="a" data-toolbar-button-rendered="">
      {props.children}
      Custom anchor
    </Component>
  );
  const renderIcon: SlotRenderFunction<ExtractSlotProps<ButtonSlots['icon']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-toolbar-icon-rendered="">
      <svg
        aria-hidden="true"
        data-custom-toolbar-glyph=""
        width="17"
        height="19"
        viewBox="0 0 17 19"
      >
        <path d="M1 1h15v17H1z" />
      </svg>
    </Component>
  );
  const renderDividerWrapper: SlotRenderFunction<ExtractSlotProps<DividerSlots['wrapper']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-toolbar-wrapper-rendered="">
      <strong>{props.children}</strong>
    </Component>
  );
  const renderToggle: SlotRenderFunction<NativeButtonRootProps> = (Component, props) => (
    <Component {...props} as="button" data-toolbar-toggle-rendered="">
      Toggle
    </Component>
  );
  const renderRadio: SlotRenderFunction<NativeButtonRootProps> = (Component, props) => (
    <Component {...props} as="button" data-toolbar-radio-rendered="">
      Radio
    </Component>
  );
  const renderGroup: SlotRenderFunction<ExtractSlotProps<ToolbarSlots['root']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-toolbar-group-rendered="">
      <ToolbarToggleButton
        as="button"
        ref={toggleRef}
        name="format"
        value="bold"
        className="caller-toggle"
      >
        {renderToggle}
      </ToolbarToggleButton>
    </Component>
  );
  const renderRadioGroup: SlotRenderFunction<ExtractSlotProps<ToolbarSlots['root']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-toolbar-radio-group-rendered="">
      <ToolbarRadioButton
        as="button"
        ref={radioRef}
        name="align"
        value="left"
        className="caller-radio"
      >
        {renderRadio}
      </ToolbarRadioButton>
    </Component>
  );
  const screen = await renderFlow(
    <>
      <div data-testid="toolbar-custom-pointer-rest">Pointer rest</div>
      <Toolbar
        ref={toolbarRef}
        aria-label="Slot toolbar"
        className="caller-toolbar"
        size="large"
        defaultCheckedValues={{ align: ['left'], format: ['bold'] }}
      >
        <ToolbarButton
          as="a"
          href="#toolbar-anchor"
          ref={buttonRef}
          className="caller-button"
          icon={{ ref: iconRef, className: 'caller-icon', children: renderIcon }}
        >
          {renderButton}
        </ToolbarButton>
        <ToolbarDivider
          ref={dividerRef}
          className="caller-divider"
          wrapper={{ className: 'caller-wrapper', children: renderDividerWrapper }}
        >
          Divider content
        </ToolbarDivider>
        <ToolbarGroup ref={groupRef} className="caller-group">
          {renderGroup}
        </ToolbarGroup>
        <ToolbarRadioGroup
          ref={radioGroupRef}
          className="caller-radio-group"
          aria-label="Custom alignment"
        >
          {renderRadioGroup}
        </ToolbarRadioGroup>
      </Toolbar>
      <Toolbar aria-label="Rendered toolbar">{renderRoot}</Toolbar>
    </>,
  );
  await userEvent.hover(screen.getByTestId('toolbar-custom-pointer-rest'));
  expect(toolbarRef.current).toBe(html(screen.getByRole('toolbar', { name: 'Slot toolbar' })));
  expect(buttonRef.current).toBe(html(screen.getByRole('link', { name: 'Custom anchor' })));
  expect(buttonRef.current?.tagName).toBe('A');
  expect(buttonRef.current?.getAttribute('href')).toBe('#toolbar-anchor');
  expect(buttonRef.current?.hasAttribute('data-toolbar-button-rendered')).toBe(true);
  expect(iconRef.current?.hasAttribute('data-toolbar-icon-rendered')).toBe(true);
  expect(iconRef.current?.querySelectorAll('[data-custom-toolbar-glyph]').length).toBe(1);
  expect(iconRef.current?.querySelectorAll('svg').length).toBe(1);
  for (const [element, callerClass, marker] of [
    [toolbarRef.current, 'caller-toolbar', toolbarClassNames.root],
    [buttonRef.current, 'caller-button', toolbarButtonClassNames.root],
    [iconRef.current, 'caller-icon', toolbarButtonClassNames.icon],
    [dividerRef.current, 'caller-divider', toolbarDividerClassNames.root],
    [groupRef.current, 'caller-group', toolbarGroupClassNames.root],
    [radioGroupRef.current, 'caller-radio-group', toolbarRadioGroupClassNames.root],
    [radioRef.current, 'caller-radio', toolbarRadioButtonClassNames.root],
    [toggleRef.current, 'caller-toggle', toolbarToggleButtonClassNames.root],
  ] as const) {
    expect(element).not.toBeNull();
    expect(element?.classList.contains(callerClass)).toBe(true);
    expect(element?.classList.contains(marker)).toBe(true);
  }
  expect(dividerRef.current?.tagName).toBe('DIV');
  expect(dividerRef.current?.getAttribute('aria-orientation')).toBe('vertical');
  expect(dividerRef.current?.querySelector('[data-toolbar-wrapper-rendered]')?.textContent).toBe(
    'Divider content',
  );
  expect(groupRef.current?.getAttribute('role')).toBe('presentation');
  expect(groupRef.current?.hasAttribute('data-toolbar-group-rendered')).toBe(true);
  expect(radioGroupRef.current?.getAttribute('role')).toBe('radiogroup');
  expect(radioGroupRef.current?.hasAttribute('data-toolbar-radio-group-rendered')).toBe(true);
  expect(radioRef.current?.getAttribute('aria-checked')).toBe('true');
  expect(radioRef.current?.hasAttribute('data-toolbar-radio-rendered')).toBe(true);
  expect(radioRef.current?.hasAttribute('aria-pressed')).toBe(false);
  expect(toggleRef.current?.getAttribute('aria-pressed')).toBe('true');
  expect(toggleRef.current?.hasAttribute('data-toolbar-toggle-rendered')).toBe(true);
  expect(
    html(screen.getByRole('toolbar', { name: 'Rendered toolbar' })).hasAttribute(
      'data-toolbar-root-rendered',
    ),
  ).toBe(true);
});

test('omitted and explicitly undefined visual defaults preserve raw horizontal ARIA and resolved slots', async () => {
  const screen = await renderFlow(
    <Toolbar size={undefined} vertical={undefined} aria-label="Undefined defaults">
      <ToolbarButton appearance={undefined} vertical={undefined}>
        Plain
      </ToolbarButton>
      <ToolbarToggleButton name="format" value="bold" appearance={undefined} size={undefined}>
        Toggle
      </ToolbarToggleButton>
      <ToolbarRadioButton name="align" value="left" appearance={undefined} size={undefined}>
        Radio
      </ToolbarRadioButton>
    </Toolbar>,
  );
  const root = html(screen.getByRole('toolbar', { name: 'Undefined defaults' }));
  expect(root.dataset.size).toBe('medium');
  expect(root.getAttribute('aria-orientation')).toBeNull();
  expect(root.hasAttribute('data-vertical')).toBe(false);
  for (const name of ['Plain', 'Toggle']) {
    const button = html(screen.getByRole('button', { name }));
    expect(button.dataset.appearance).toBe('subtle');
    expect(button.dataset.shape).toBe('rounded');
    expect(button.dataset.size).toBe('medium');
  }
  expect(html(screen.getByRole('button', { name: 'Toggle' })).getAttribute('aria-pressed')).toBe(
    'false',
  );
  expect(html(screen.getByRole('radio', { name: 'Radio' })).getAttribute('aria-checked')).toBe(
    'false',
  );
  expect(html(screen.getByRole('radio', { name: 'Radio' })).hasAttribute('aria-pressed')).toBe(
    false,
  );
});

test('Divider omission inverts Toolbar orientation while explicit undefined retains the public hook default', async () => {
  const defaultRef = React.createRef<HTMLDivElement>();
  const undefinedRef = React.createRef<HTMLDivElement>();
  const verticalRef = React.createRef<HTMLDivElement>();
  const primitiveDefault = React.createRef<HTMLDivElement>();
  const primitiveUndefined = React.createRef<HTMLDivElement>();
  await renderFlow(
    <>
      <Toolbar>
        <ToolbarDivider ref={defaultRef} />
        <ToolbarDivider ref={undefinedRef} vertical={undefined} />
      </Toolbar>
      <Toolbar vertical>
        <ToolbarDivider ref={verticalRef} />
      </Toolbar>
      <primitive.Toolbar>
        <primitive.ToolbarDivider ref={primitiveDefault} />
        <primitive.ToolbarDivider ref={primitiveUndefined} vertical={undefined} />
      </primitive.Toolbar>
    </>,
  );
  expect(defaultRef.current?.getAttribute('aria-orientation')).toBe(
    primitiveDefault.current?.getAttribute('aria-orientation'),
  );
  expect(undefinedRef.current?.getAttribute('aria-orientation')).toBe(
    primitiveUndefined.current?.getAttribute('aria-orientation'),
  );
  expect(defaultRef.current?.dataset.orientation).toBe('vertical');
  expect(undefinedRef.current?.dataset.orientation).toBe('horizontal');
  expect(verticalRef.current?.dataset.orientation).toBe('horizontal');
});

test('documented ToolbarButton trigger composes the completed native Menu on cold open and reopen', async () => {
  const screen = await renderFlow(<ToolbarMenuFlow />);
  await userEvent.hover(screen.getByTestId('toolbar-menu-pointer-rest'));
  const trigger = screen.getByRole('button', { name: 'More document commands' });
  const surface = html(screen.getByTestId('toolbar-menu-surface'));
  expect(surface.matches(':popover-open')).toBe(false);
  expect(getComputedStyle(surface).display).toBe('none');
  await userEvent.click(trigger);
  await expect.poll(() => surface.matches(':popover-open')).toBe(true);
  await expect.element(screen.getByRole('menuitem', { name: 'Rename document' })).toHaveFocus();
  await userEvent.keyboard('{End}');
  await expect.element(screen.getByRole('menuitem', { name: 'Duplicate document' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  await expect
    .element(screen.getByLabelText('Toolbar menu result'))
    .toHaveAttribute('data-toolbar-menu-action', 'duplicate');
  await expect.poll(() => surface.matches(':popover-open')).toBe(false);
  await expect.element(trigger).toHaveFocus();
  await userEvent.click(trigger);
  await expect.poll(() => surface.matches(':popover-open')).toBe(true);
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => surface.matches(':popover-open')).toBe(false);
  await expect.element(trigger).toHaveFocus();
  expect(surface.getBoundingClientRect().width).toBe(0);
});

test('the actual comparison report reaches ready with matching final geometry and all supported members', async () => {
  const screen = await renderFlow(<ToolbarComparisonWithReport />);
  await userEvent.hover(screen.getByTestId('toolbar-report-pointer-rest'));
  const report = screen.getByRole('status', { name: 'Toolbar style report' });
  await expect.element(report).toHaveAttribute('data-toolbar-report-state', 'ready');
  await settleToolbarStyles();
  screen
    .getByLabelText('Toolbar visual fixture')
    .element()
    .dispatchEvent(new Event('change', { bubbles: true }));
  await settleToolbarStyles();
  await expect.element(report).toHaveAttribute('data-toolbar-report-state', 'ready');
  await expect.element(report).toHaveAttribute('data-toolbar-unexpected-count', '0');
  const root = getComparisonToolbar(screen.container, 'headless');
  const rect = root.getBoundingClientRect();
  expect(Number(html(report).dataset.toolbarWidth)).toBe(rect.width);
  expect(Number(html(report).dataset.toolbarHeight)).toBe(rect.height);
  expect(rect.width).toBeGreaterThan(0);
  expect(rect.height).toBeGreaterThan(0);
  expect(root.querySelectorAll('[data-toolbar-part="radio"]').length).toBe(2);
  expect(root.querySelectorAll('[data-toolbar-part="toggle"]').length).toBe(1);
  expect(root.querySelectorAll('[data-toolbar-part="group"]').length).toBe(1);
  expect(root.querySelectorAll('[data-toolbar-part="radioGroup"]').length).toBe(1);
});

test('all supported component/ref and public context helper types remain current', () => {
  expectTypeOf(Toolbar).toExtend<ForwardRefComponent<ToolbarProps>>();
  expectTypeOf(ToolbarButton).toExtend<ForwardRefComponent<ToolbarButtonProps>>();
  expectTypeOf(ToolbarDivider).toExtend<ForwardRefComponent<ToolbarDividerProps>>();
  expectTypeOf(ToolbarGroup).toExtend<ForwardRefComponent<ToolbarGroupProps>>();
  expectTypeOf(ToolbarRadioGroup).toExtend<ForwardRefComponent<ToolbarRadioGroupProps>>();
  expectTypeOf(ToolbarRadioButton).toExtend<ForwardRefComponent<ToolbarRadioButtonProps>>();
  expectTypeOf(ToolbarToggleButton).toExtend<ForwardRefComponent<ToolbarToggleButtonProps>>();
  expect(useToolbarContext).toBe(primitive.useToolbarContext);
  expect(useToolbarContextValues).toBe(primitive.useToolbarContextValues);
});
