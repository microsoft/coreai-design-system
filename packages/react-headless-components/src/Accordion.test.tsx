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
  Accordion as RawAccordion,
  AccordionHeader as RawAccordionHeader,
  AccordionItem as RawAccordionItem,
  AccordionPanel as RawAccordionPanel,
} from '@fluentui/react-headless-components-preview/accordion';
import {
  CoreAIFluentProvider,
  coreaiDarkTheme,
  coreaiLightTheme,
} from '@coreai-ds/react-components';
import {
  AccordionComparison,
  AccordionFixtureIcon,
  accordionConsumerExample,
  accordionExampleItems,
  accordionExamples,
  type AccordionExample,
} from '../../../apps/storybook/src/stories/experiments/AccordionComparison.js';
import {
  captureAccordionHeaderStyles,
  captureAccordionStyles,
  compareAccordionStyles,
  expectedAccordionMountDifferences,
  getAccordionHeaderSlots,
  getComparisonAccordion,
  settleAccordionStyles,
} from '../../../apps/storybook/src/stories/experiments/compareAccordionStyles.js';
import {
  Accordion,
  accordionClassNames,
  type AccordionProps,
  type AccordionSlots,
  type AccordionToggleData,
} from './Accordion.js';
import {
  AccordionHeader,
  accordionHeaderClassNames,
  type AccordionHeaderProps,
  type AccordionHeaderSlots,
} from './AccordionHeader.js';
import {
  AccordionItem,
  accordionItemClassNames,
  type AccordionItemProps,
  type AccordionItemSlots,
} from './AccordionItem.js';
import {
  AccordionPanel,
  accordionPanelClassNames,
  type AccordionPanelProps,
  type AccordionPanelSlots,
} from './AccordionPanel.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

const families = [
  {
    name: 'ported',
    Root: Accordion,
    Item: AccordionItem,
    Header: AccordionHeader,
    Panel: AccordionPanel,
  },
  {
    name: 'raw public',
    Root: RawAccordion,
    Item: RawAccordionItem,
    Header: RawAccordionHeader,
    Panel: RawAccordionPanel,
  },
] as const;

function nativeButton(element: Element): HTMLButtonElement {
  if (!(element instanceof HTMLButtonElement)) throw new Error('Missing native header button');
  return element;
}

async function renderPair(
  example: AccordionExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const screen = await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <AccordionComparison examples={[example]} />
    </CoreAIFluentProvider>,
  );
  const parking = screen.getByText('Case', { exact: true });
  await userEvent.hover(parking);
  const legacy = getComparisonAccordion(screen.container, 'legacy');
  const headless = getComparisonAccordion(screen.container, 'headless');
  await Promise.all([settleAccordionStyles(legacy), settleAccordionStyles(headless)]);
  return { screen, parking, legacy, headless };
}

test('exposes current public refs, slots, visual props, and toggle data without deprecated APIs', () => {
  expectTypeOf<typeof Accordion>().toEqualTypeOf<ForwardRefComponent<AccordionProps>>();
  expectTypeOf<typeof AccordionItem>().toEqualTypeOf<ForwardRefComponent<AccordionItemProps>>();
  expectTypeOf<typeof AccordionHeader>().toEqualTypeOf<ForwardRefComponent<AccordionHeaderProps>>();
  expectTypeOf<typeof AccordionPanel>().toEqualTypeOf<ForwardRefComponent<AccordionPanelProps>>();
  expectTypeOf<AccordionToggleData>().toEqualTypeOf<{ value: unknown; openItems: unknown[] }>();
  expectTypeOf<AccordionHeaderProps['size']>().toEqualTypeOf<
    'small' | 'medium' | 'large' | 'extra-large' | undefined
  >();
  expectTypeOf<AccordionHeaderProps['inline']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<'navigation' extends keyof AccordionProps ? true : false>().toEqualTypeOf<false>();
  expectTypeOf<
    'collapseMotion' extends keyof AccordionPanelProps ? true : false
  >().toEqualTypeOf<false>();
  expectTypeOf<keyof AccordionPanelSlots>().toEqualTypeOf<'root'>();
});

test('compares dimensions, offsets, CSS strings, and missing values exactly', () => {
  expect(
    compareAccordionStyles(
      {
        'accordion.width': '360.00',
        'item0.button.height': '44.00',
        'item0.icon.offset-left': '20.00',
        'item0.button.font-size': '14px',
        'item0.panel.mounted': 'false',
      },
      {
        'accordion.width': '360.01',
        'item0.button.height': '44.50',
        'item0.icon.offset-left': '20.01',
        'item0.button.font-size': '14.01px',
      },
    ),
  ).toEqual([
    { property: 'accordion.width', legacy: '360.00', headless: '360.01' },
    { property: 'item0.button.height', legacy: '44.00', headless: '44.50' },
    { property: 'item0.icon.offset-left', legacy: '20.00', headless: '20.01' },
    { property: 'item0.button.font-size', legacy: '14px', headless: '14.01px' },
    { property: 'item0.panel.mounted', legacy: 'false', headless: null },
  ]);
});

for (const [mode, theme] of themes) {
  test.each(accordionExamples)(
    `matches $name styles and reports native panel mounting in ${mode}`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme);
      expect(
        compareAccordionStyles(captureAccordionStyles(legacy), captureAccordionStyles(headless)),
      ).toEqual(expectedAccordionMountDifferences(headless));
      expect(headless.items.length).toBe(legacy.items.length);
      for (const [index, item] of headless.items.entries()) {
        const old = legacy.items[index];
        expect(item.header.button.getAttribute('aria-expanded')).toBe(
          old.header.button.getAttribute('aria-expanded'),
        );
        expect(item.header.button.getAttribute('aria-disabled')).toBe(
          old.header.button.getAttribute('aria-disabled'),
        );
        expect(item.root.hasAttribute('data-open')).toBe(
          item.header.button.getAttribute('aria-expanded') === 'true',
        );
        expect(item.header.root).not.toHaveAttribute('size');
        expect(item.header.root).not.toHaveAttribute('inline');
        expect(item.header.root).not.toHaveAttribute('expandiconposition');
        expect(item.panel).toBeInstanceOf(HTMLDivElement);
        if (!item.root.hasAttribute('data-open')) {
          expect(item.panel).toHaveAttribute('tabindex', '-1');
          expect(getComputedStyle(item.panel!).display).toBe('none');
        }
      }
    },
  );

  test.each(accordionExamples)(
    `restores Fluent defaults for $name with CoreAI defaults disabled in ${mode}`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme, false);
      expect(
        compareAccordionStyles(captureAccordionStyles(legacy), captureAccordionStyles(headless)),
      ).toEqual(expectedAccordionMountDifferences(headless));
      for (const item of headless.items) {
        expect(getComputedStyle(item.header.button).display).toBe(
          item.header.root.hasAttribute('data-inline') ? 'inline-flex' : 'flex',
        );
        if (item.header.button.getAttribute('aria-expanded') === 'true') {
          expect(getComputedStyle(item.panel!).marginInlineStart).toBe('12px');
        }
      }
    },
  );

  test.each(accordionExamples.filter((example) => /^(?:start|end),/.test(example.name)))(
    `matches logical spacing and default-chevron orientation for $name in RTL ${mode}`,
    async (example) => {
      const { legacy, headless } = await renderPair(example, theme, true, 'rtl');
      expect(
        compareAccordionStyles(captureAccordionStyles(legacy), captureAccordionStyles(headless)),
      ).toEqual(expectedAccordionMountDifferences(headless));
      expect(getComputedStyle(headless.root).direction).toBe('rtl');
    },
  );

  test.each([false, true])(
    `matches CoreAI enabled/disabled hover and keyboard-focus treatment, disabled=%s in ${mode}`,
    async (disabled) => {
      const { legacy, headless, parking } = await renderPair(
        {
          name: 'Interaction',
          props: { collapsible: true },
          items: [{ ...accordionExampleItems[0], itemProps: { disabled } }],
        },
        theme,
      );
      const oldHeader = legacy.items[0].header;
      const newHeader = headless.items[0].header;
      const resting = captureAccordionHeaderStyles(newHeader);
      await userEvent.hover(oldHeader.button);
      expect(oldHeader.button.matches(':hover')).toBe(true);
      await settleAccordionStyles(legacy);
      const hovered = captureAccordionHeaderStyles(oldHeader);
      await userEvent.hover(newHeader.button);
      expect(newHeader.button.matches(':hover')).toBe(true);
      await settleAccordionStyles(headless);
      expect(compareAccordionStyles(hovered, captureAccordionHeaderStyles(newHeader))).toEqual([]);
      if (disabled) {
        expect(hovered['expandIcon.background-color']).toBe(resting['expandIcon.background-color']);
        expect(hovered['button.color']).toBe(resting['button.color']);
        return;
      }
      expect(hovered['expandIcon.background-color']).not.toBe(
        resting['expandIcon.background-color'],
      );

      await userEvent.hover(parking);
      await userEvent.keyboard('{Escape}');
      await userEvent.tab();
      await expect.element(oldHeader.button).toHaveFocus();
      expect(oldHeader.button.matches(':hover')).toBe(false);
      expect(oldHeader.button.matches(':focus-visible')).toBe(true);
      await expect.poll(() => getComputedStyle(oldHeader.button, '::after').content).toBe('""');
      await settleAccordionStyles(legacy);
      const focused = captureAccordionHeaderStyles(oldHeader);
      await userEvent.tab();
      await expect.element(newHeader.button).toHaveFocus();
      expect(newHeader.button.matches(':hover')).toBe(false);
      expect(newHeader.button.matches(':focus-visible')).toBe(true);
      await settleAccordionStyles(headless);
      expect(compareAccordionStyles(focused, captureAccordionHeaderStyles(newHeader))).toEqual([]);

      await userEvent.tab({ shift: true });
      await userEvent.hover(oldHeader.button);
      expect(oldHeader.button.matches(':hover')).toBe(true);
      await settleAccordionStyles(legacy);
      const focusedHover = captureAccordionHeaderStyles(oldHeader);
      await userEvent.hover(parking);
      await userEvent.tab();
      await userEvent.hover(newHeader.button);
      expect(newHeader.button.matches(':focus-visible')).toBe(true);
      expect(newHeader.button.matches(':hover')).toBe(true);
      await settleAccordionStyles(headless);
      expect(compareAccordionStyles(focusedHover, captureAccordionHeaderStyles(newHeader))).toEqual(
        [],
      );
    },
  );

  test(`matches real pressed expand-icon treatment without changing controlled open state in ${mode}`, async () => {
    const frames: Record<string, Record<string, string>> = {};
    const active: Record<string, boolean> = {};
    const onMouseDown: React.MouseEventHandler<HTMLButtonElement> = (event) => {
      const root = event.currentTarget.closest('.fui-AccordionHeader');
      const implementation = root
        ?.closest('[data-accordion-implementation]')
        ?.getAttribute('data-accordion-implementation');
      if (!(root instanceof HTMLElement) || !implementation)
        throw new Error('Missing pressed header');
      active[implementation] = event.currentTarget.matches(':active');
      frames[implementation] = captureAccordionHeaderStyles(getAccordionHeaderSlots(root));
    };
    const { legacy, headless } = await renderPair(
      {
        name: 'Pressed header',
        props: { openItems: [], collapsible: true },
        items: [{ ...accordionExampleItems[0], headerProps: { button: { onMouseDown } } }],
      },
      theme,
    );
    const resting = captureAccordionHeaderStyles(headless.items[0].header);
    await userEvent.click(legacy.items[0].header.button);
    await userEvent.click(headless.items[0].header.button);
    expect(active).toEqual({ legacy: true, headless: true });
    expect(compareAccordionStyles(frames.legacy, frames.headless)).toEqual([]);
    expect(frames.headless['expandIcon.background-color']).not.toBe(
      resting['expandIcon.background-color'],
    );
    expect(headless.items[0].header.button).toHaveAttribute('aria-expanded', 'false');
  });
}

test('retains CoreAI grid layouts, zero spacing, and a centered non-stretching expand icon', async () => {
  const { legacy, headless } = await renderPair(
    accordionExamples.find((example) => example.name === 'Tall header content')!,
  );
  for (const { items } of [legacy, headless]) {
    const { header, panel } = items[0];
    const buttonStyle = getComputedStyle(header.button);
    expect(buttonStyle.display).toBe('grid');
    expect(buttonStyle.padding).toBe('0px');
    expect(getComputedStyle(panel!).margin).toBe('0px');
    const iconRect = header.expandIcon!.getBoundingClientRect();
    const buttonRect = header.button.getBoundingClientRect();
    expect(iconRect.height).toBeLessThan(buttonRect.height);
    expect(iconRect.top + iconRect.height / 2).toBe(buttonRect.top + buttonRect.height / 2);
  }
});

for (const family of families) {
  const { name, Root, Item, Header, Panel } = family;

  test(`${name} preserves single/non-collapsible defaults, disabled-focusable state, and toggle payloads`, async () => {
    const onToggle = vi.fn();
    const screen = await render(
      <CoreAIFluentProvider>
        <Root onToggle={onToggle} data-family-root="">
          <Item value="overview">
            <Header>Overview</Header>
            <Panel>Overview content</Panel>
          </Item>
          <Item value="details">
            <Header>Details</Header>
            <Panel>Details content</Panel>
          </Item>
          <Item value="unavailable" disabled>
            <Header>Unavailable</Header>
            <Panel>Unavailable content</Panel>
          </Item>
        </Root>
      </CoreAIFluentProvider>,
    );
    const overview = nativeButton(
      screen.getByRole('button', { name: 'Overview', exact: true }).element(),
    );
    const details = screen.getByRole('button', { name: 'Details', exact: true });
    const unavailable = screen.getByRole('button', { name: 'Unavailable' });
    expect(overview).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(overview);
    expect(overview).toHaveAttribute('aria-expanded', 'true');
    expect(overview).toHaveAttribute('aria-disabled', 'true');
    expect(overview.disabled).toBe(false);
    expect(onToggle).toHaveBeenCalledExactlyOnceWith(expect.anything(), {
      value: 'overview',
      openItems: ['overview'],
    });
    // Probe native activation despite aria-disabled; the open header remains focusable.
    await userEvent.click(overview, { force: true });
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(overview).toHaveAttribute('aria-expanded', 'true');
    await expect.element(overview).toHaveFocus();
    await userEvent.click(unavailable, { force: true });
    expect(onToggle).toHaveBeenCalledTimes(1);
    await expect.element(unavailable).toBeDisabled();
    await userEvent.click(details);
    expect(overview).toHaveAttribute('aria-expanded', 'false');
    await expect.element(details).toHaveAttribute('aria-expanded', 'true');
    expect(onToggle).toHaveBeenLastCalledWith(expect.anything(), {
      value: 'details',
      openItems: ['details'],
    });
    const root = screen.container.querySelector('[data-family-root]');
    expect(root).not.toHaveAttribute('data-collapsible');
    expect(root).not.toHaveAttribute('data-multiple');
    expect(root).not.toHaveAttribute('focusgroup');
    expect(root).not.toHaveAttribute('data-tabster');
  });

  test.each([false, true])(
    `${name} preserves native Enter/Space activation, Tab navigation, and multiple/collapsible=%s`,
    async (collapsible) => {
      const onToggle = vi.fn();
      const screen = await render(
        <CoreAIFluentProvider>
          <span data-testid="pointer-parking">Keyboard navigation</span>
          <button type="button">Before sections</button>
          <Root
            multiple
            collapsible={collapsible}
            defaultOpenItems={['overview']}
            onToggle={onToggle}
          >
            <Item value="overview">
              <Header>Overview</Header>
              <Panel>Overview content</Panel>
            </Item>
            <Item value="unavailable" disabled>
              <Header>Unavailable</Header>
              <Panel>Unavailable content</Panel>
            </Item>
            <Item value="details">
              <Header>Details</Header>
              <Panel>Details content</Panel>
            </Item>
          </Root>
          <button type="button">After sections</button>
        </CoreAIFluentProvider>,
      );
      const overview = nativeButton(
        screen.getByRole('button', { name: 'Overview', exact: true }).element(),
      );
      const details = nativeButton(
        screen.getByRole('button', { name: 'Details', exact: true }).element(),
      );
      await userEvent.click(screen.getByRole('button', { name: 'Before sections' }));
      await userEvent.hover(screen.getByTestId('pointer-parking'));
      await userEvent.tab();
      await expect.element(overview).toHaveFocus();
      expect(overview.matches(':hover')).toBe(false);
      await userEvent.keyboard('{ArrowDown}{Home}{End}');
      await expect.element(overview).toHaveFocus();
      await userEvent.tab();
      await expect.element(details).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      expect(onToggle).toHaveBeenLastCalledWith(expect.anything(), {
        value: 'details',
        openItems: ['details', 'overview'],
      });
      expect(overview).toHaveAttribute('aria-expanded', 'true');
      expect(details).toHaveAttribute('aria-expanded', 'true');
      await userEvent.keyboard(' ');
      expect(onToggle).toHaveBeenLastCalledWith(expect.anything(), {
        value: 'details',
        openItems: ['overview'],
      });
      expect(details).toHaveAttribute('aria-expanded', 'false');
      await userEvent.tab({ shift: true });
      await expect.element(overview).toHaveFocus();
      const previousCalls = onToggle.mock.calls.length;
      await userEvent.keyboard(' ');
      expect(onToggle).toHaveBeenCalledTimes(previousCalls + (collapsible ? 1 : 0));
      expect(overview).toHaveAttribute('aria-expanded', String(!collapsible));
      if (collapsible) {
        expect(onToggle).toHaveBeenLastCalledWith(expect.anything(), {
          value: 'overview',
          openItems: [],
        });
      }
      await userEvent.tab();
      await expect.element(details).toHaveFocus();
      await userEvent.tab();
      await expect.element(screen.getByRole('button', { name: 'After sections' })).toHaveFocus();
    },
  );

  test.each([
    { multiple: false, initial: ['overview'] },
    { multiple: true, initial: ['overview', 'details'] },
  ])(
    `${name} normalizes default arrays with multiple=$multiple without a second state model`,
    async ({ multiple, initial }) => {
      const screen = await render(
        <CoreAIFluentProvider>
          <Root multiple={multiple} defaultOpenItems={['overview', 'details']}>
            <Item value="overview">
              <Header>Overview</Header>
              <Panel>Overview content</Panel>
            </Item>
            <Item value="details">
              <Header>Details</Header>
              <Panel>Details content</Panel>
            </Item>
          </Root>
        </CoreAIFluentProvider>,
      );
      expect(
        screen.getByRole('button', { name: 'Overview', exact: true }).element(),
      ).toHaveAttribute('aria-expanded', String(initial.includes('overview')));
      expect(
        screen.getByRole('button', { name: 'Details', exact: true }).element(),
      ).toHaveAttribute('aria-expanded', String(initial.includes('details')));
    },
  );

  test(`${name} keeps controlled openItems authoritative and accepts external updates`, async () => {
    const onToggle = vi.fn();
    function Controlled() {
      const [openItems, setOpenItems] = React.useState<unknown[]>(['overview']);
      return (
        <>
          <button type="button" onClick={() => setOpenItems(['details'])}>
            Choose details externally
          </button>
          <Root collapsible multiple openItems={openItems} onToggle={onToggle}>
            <Item value="overview">
              <Header>Overview</Header>
              <Panel>Overview content</Panel>
            </Item>
            <Item value="details">
              <Header>Details</Header>
              <Panel>Details content</Panel>
            </Item>
          </Root>
        </>
      );
    }
    const screen = await render(
      <CoreAIFluentProvider>
        <Controlled />
      </CoreAIFluentProvider>,
    );
    const overview = screen.getByRole('button', { name: 'Overview', exact: true });
    const details = screen.getByRole('button', { name: 'Details', exact: true });
    await userEvent.click(details);
    expect(onToggle).toHaveBeenCalledExactlyOnceWith(expect.anything(), {
      value: 'details',
      openItems: ['details', 'overview'],
    });
    await expect.element(overview).toHaveAttribute('aria-expanded', 'true');
    await expect.element(details).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(screen.getByRole('button', { name: 'Choose details externally' }));
    await expect.element(overview).toHaveAttribute('aria-expanded', 'false');
    await expect.element(details).toHaveAttribute('aria-expanded', 'true');
  });

  test(`${name} preserves caller button events, preventDefault veto, and native bubbling order`, async () => {
    const events: string[] = [];
    const onToggle = vi.fn(() => events.push('toggle'));
    const screen = await render(
      <CoreAIFluentProvider>
        <Root collapsible onToggle={onToggle} onClick={() => events.push('accordion')}>
          <Item value="overview" onClick={() => events.push('item')}>
            <Header
              onClick={() => events.push('header')}
              button={{ onClick: () => events.push('button') }}
            >
              Overview
            </Header>
            <Panel>Overview content</Panel>
          </Item>
          <Item value="veto">
            <Header
              button={{
                onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
                  events.push('veto');
                  event.preventDefault();
                },
              }}
            >
              Veto
            </Header>
            <Panel>Veto content</Panel>
          </Item>
        </Root>
      </CoreAIFluentProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Overview', exact: true }));
    expect(events).toEqual(['button', 'toggle', 'header', 'item', 'accordion']);
    events.length = 0;
    await userEvent.click(screen.getByRole('button', { name: 'Veto', exact: true }));
    expect(events).toEqual(['veto', 'accordion']);
    expect(onToggle).toHaveBeenCalledTimes(1);
    await expect
      .element(screen.getByRole('button', { name: 'Veto', exact: true }))
      .toHaveAttribute('aria-expanded', 'false');
  });

  test(`${name} preserves caller-managed heading/panel associations without inventing default ARIA`, async () => {
    const screen = await render(
      <CoreAIFluentProvider>
        <Root multiple collapsible defaultOpenItems={['associated', 'plain']}>
          <Item value="associated">
            <Header
              as="h3"
              button={{ id: 'associated-header', 'aria-controls': 'associated-panel' }}
            >
              Associated section
            </Header>
            <Panel id="associated-panel" role="region" aria-labelledby="associated-header">
              Associated content
            </Panel>
          </Item>
          <Item value="plain">
            <Header>Plain section</Header>
            <Panel data-testid="plain-panel">Plain content</Panel>
          </Item>
        </Root>
      </CoreAIFluentProvider>,
    );
    await expect
      .element(screen.getByRole('heading', { name: 'Associated section', level: 3 }))
      .toBeVisible();
    const associated = screen.getByRole('button', { name: 'Associated section' }).element();
    const region = screen.getByRole('region', { name: 'Associated section' }).element();
    expect(associated).toHaveAttribute('type', 'button');
    expect(associated).toHaveAttribute('aria-controls', region.id);
    expect(region).toHaveAttribute('aria-labelledby', associated.id);
    const plainButton = screen.getByRole('button', { name: 'Plain section' }).element();
    const plainPanel = screen.getByTestId('plain-panel').element();
    expect(plainButton.parentElement?.tagName).toBe('DIV');
    expect(plainButton).not.toHaveAttribute('aria-controls');
    expect(plainPanel).not.toHaveAttribute('role');
    expect(plainPanel).not.toHaveAttribute('aria-labelledby');
  });

  test(`${name} retains mounted closed-panel tabindex and the installed React 18 inert omission`, async () => {
    const panelRef = React.createRef<HTMLDivElement>();
    const screen = await render(
      <CoreAIFluentProvider>
        <Root collapsible>
          <Item value="overview">
            <Header>Overview</Header>
            <Panel ref={panelRef}>
              <a href="#closed-panel-link">Panel link</a>
            </Panel>
          </Item>
        </Root>
      </CoreAIFluentProvider>,
    );
    const panel = panelRef.current;
    expect(panel).toBeInstanceOf(HTMLDivElement);
    expect(panel).toHaveAttribute('tabindex', '-1');
    // The pinned public hook requests inert=true, but React DOM 18.3.1 omits that boolean attribute.
    // The port hides closed panels with CSS rather than adding an inert compatibility shim.
    expect(panel).not.toHaveAttribute('inert');
    await userEvent.click(screen.getByRole('button', { name: 'Overview', exact: true }));
    expect(panelRef.current).toBe(panel);
    expect(panel).toHaveAttribute('data-open', '');
    expect(panel).not.toHaveAttribute('tabindex');
    expect(panel).not.toHaveAttribute('inert');
  });

  test(`${name} preserves explicit button-slot disabled precedence without rewriting item state`, async () => {
    const onToggle = vi.fn();
    const screen = await render(
      <CoreAIFluentProvider>
        <Root collapsible onToggle={onToggle}>
          <Item value="enabled-slot" disabled>
            <Header data-testid="disabled-item-header" button={{ disabled: false }}>
              Enabled by slot
            </Header>
            <Panel>Enabled slot content</Panel>
          </Item>
          <Item value="disabled-slot">
            <Header button={{ disabled: true }}>Disabled by slot</Header>
            <Panel>Disabled slot content</Panel>
          </Item>
        </Root>
      </CoreAIFluentProvider>,
    );
    const enabled = screen.getByRole('button', { name: 'Enabled by slot' });
    const disabled = screen.getByRole('button', { name: 'Disabled by slot' });
    expect(screen.getByTestId('disabled-item-header').element()).toHaveAttribute(
      'data-disabled',
      '',
    );
    await expect.element(enabled).toBeEnabled();
    await expect.element(disabled).toBeDisabled();
    await userEvent.click(enabled);
    await expect.element(enabled).toHaveAttribute('aria-expanded', 'true');
    expect(onToggle).toHaveBeenCalledExactlyOnceWith(expect.anything(), {
      value: 'enabled-slot',
      openItems: ['enabled-slot'],
    });
    await userEvent.click(disabled, { force: true });
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test.each([false, true])(
    `${name} retains numeric array values for controlled=%s state`,
    async (controlled) => {
      const onToggle = vi.fn();
      const screen = await render(
        <CoreAIFluentProvider>
          <Root
            {...(controlled ? { openItems: [0] } : { defaultOpenItems: [0] })}
            collapsible
            onToggle={onToggle}
          >
            <Item value={0}>
              <Header>Zero</Header>
              <Panel>Zero content</Panel>
            </Item>
            <Item value={1}>
              <Header>One</Header>
              <Panel>One content</Panel>
            </Item>
          </Root>
        </CoreAIFluentProvider>,
      );
      const zero = screen.getByRole('button', { name: 'Zero', exact: true });
      const one = screen.getByRole('button', { name: 'One', exact: true });
      await expect.element(zero).toHaveAttribute('aria-expanded', 'true');
      await expect.element(one).toHaveAttribute('aria-expanded', 'false');
      await userEvent.click(one);
      expect(onToggle).toHaveBeenCalledExactlyOnceWith(expect.anything(), {
        value: 1,
        openItems: [1],
      });
      await expect.element(zero).toHaveAttribute('aria-expanded', String(controlled));
      await expect.element(one).toHaveAttribute('aria-expanded', String(!controlled));
    },
  );

  test(`${name} isolates nested Accordion contexts and toggle callbacks`, async () => {
    const outerToggle = vi.fn();
    const innerToggle = vi.fn();
    const screen = await render(
      <CoreAIFluentProvider>
        <Root collapsible defaultOpenItems={['outer']} onToggle={outerToggle}>
          <Item value="outer">
            <Header>Outer section</Header>
            <Panel>
              <Root collapsible defaultOpenItems={['inner']} onToggle={innerToggle}>
                <Item value="inner">
                  <Header>Inner section</Header>
                  <Panel>Inner content</Panel>
                </Item>
              </Root>
            </Panel>
          </Item>
        </Root>
      </CoreAIFluentProvider>,
    );
    const outer = screen.getByRole('button', { name: 'Outer section' });
    const inner = screen.getByRole('button', { name: 'Inner section' });
    await userEvent.click(inner);
    await expect.element(inner).toHaveAttribute('aria-expanded', 'false');
    await expect.element(outer).toHaveAttribute('aria-expanded', 'true');
    expect(innerToggle).toHaveBeenCalledExactlyOnceWith(expect.anything(), {
      value: 'inner',
      openItems: [],
    });
    expect(outerToggle).not.toHaveBeenCalled();
    await userEvent.click(outer);
    await expect.element(outer).toHaveAttribute('aria-expanded', 'false');
    expect(outerToggle).toHaveBeenCalledExactlyOnceWith(expect.anything(), {
      value: 'outer',
      openItems: [],
    });
    await userEvent.click(outer);
    await expect.element(inner).toHaveAttribute('aria-expanded', 'false');
    expect(innerToggle).toHaveBeenCalledTimes(1);
  });
}

test('uses native header direction for its default chevron inside an LTR provider', async () => {
  const headerRef = React.createRef<HTMLDivElement>();
  const screen = await render(
    <CoreAIFluentProvider dir="ltr">
      <Accordion collapsible>
        <AccordionItem value="overview">
          <AccordionHeader ref={headerRef} dir="rtl">
            Overview
          </AccordionHeader>
          <AccordionPanel>Overview content</AccordionPanel>
        </AccordionItem>
      </Accordion>
    </CoreAIFluentProvider>,
  );
  if (!headerRef.current) throw new Error('Missing native RTL heading');
  const header = getAccordionHeaderSlots(headerRef.current);
  await settleAccordionStyles(header);
  expect(getComputedStyle(header.root).direction).toBe('rtl');
  expect(getComputedStyle(header.glyph!).transform).toBe('matrix(-1, 0, 0, -1, 0, 0)');
  await userEvent.click(screen.getByRole('button', { name: 'Overview', exact: true }));
  await settleAccordionStyles(header);
  expect(getComputedStyle(header.glyph!).transform).toBe('matrix(0, 1, -1, 0, 0, 0)');
});

test('hides closed panels from native focus/accessibility while preserving their DOM and local values', async () => {
  const panelRef = React.createRef<HTMLDivElement>();
  const screen = await render(
    <CoreAIFluentProvider>
      <span data-testid="pointer-parking">Focus parking</span>
      <button type="button">Before sections</button>
      <Accordion collapsible>
        <AccordionItem value="overview">
          <AccordionHeader>Overview</AccordionHeader>
          <AccordionPanel ref={panelRef} role="region" aria-label="Overview content">
            <input aria-label="Workspace note" defaultValue="Draft" />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
      <button type="button">After sections</button>
    </CoreAIFluentProvider>,
  );
  const panel = panelRef.current;
  const input = panel?.querySelector('input');
  if (!panel || !(input instanceof HTMLInputElement)) throw new Error('Missing persistent panel');
  expect(getComputedStyle(panel).display).toBe('none');
  await expect
    .element(screen.getByRole('region', { name: 'Overview content' }))
    .not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Before sections' }));
  await userEvent.hover(screen.getByTestId('pointer-parking'));
  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'Overview', exact: true })).toHaveFocus();
  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'After sections' })).toHaveFocus();

  await userEvent.click(screen.getByRole('button', { name: 'Overview', exact: true }));
  await expect.element(screen.getByRole('region', { name: 'Overview content' })).toBeVisible();
  await userEvent.clear(input);
  await userEvent.type(input, 'Edited draft');
  await userEvent.click(screen.getByRole('button', { name: 'Overview', exact: true }));
  expect(panelRef.current).toBe(panel);
  expect(panel.querySelector('input')).toBe(input);
  expect(input.value).toBe('Edited draft');
  expect(getComputedStyle(panel).display).toBe('none');
  await userEvent.click(screen.getByRole('button', { name: 'Overview', exact: true }));
  await expect
    .element(screen.getByRole('textbox', { name: 'Workspace note' }))
    .toHaveValue('Edited draft');
  expect(panelRef.current).toBe(panel);
});

test('makes the legacy unmount versus current persistent-panel difference explicit', async () => {
  const { screen } = await renderPair({
    name: 'Panel lifetime',
    props: { collapsible: true },
    items: [
      {
        ...accordionExampleItems[0],
        content: <input aria-label="Workspace note" defaultValue="Draft" />,
      },
    ],
  });
  for (const implementation of ['legacy', 'headless'] as const) {
    let accordion = getComparisonAccordion(screen.container, implementation);
    expect(Boolean(accordion.items[0].panel)).toBe(implementation === 'headless');
    await userEvent.click(accordion.items[0].header.button);
    accordion = getComparisonAccordion(screen.container, implementation);
    await settleAccordionStyles(accordion);
    const input = accordion.items[0].panel?.querySelector('input');
    if (!(input instanceof HTMLInputElement)) throw new Error('Missing lifetime input');
    await userEvent.clear(input);
    await userEvent.type(input, 'Edited draft');
    await userEvent.click(accordion.items[0].header.button);
    await settleAccordionStyles(accordion);
    // Collapse unmounts in its finish-event callback, after Animation.finished resolves.
    await expect.poll(() => input.isConnected).toBe(implementation === 'headless');
    await userEvent.click(accordion.items[0].header.button);
    accordion = getComparisonAccordion(screen.container, implementation);
    await settleAccordionStyles(accordion);
    const reopened = accordion.items[0].panel?.querySelector('input');
    expect(reopened?.value).toBe(implementation === 'headless' ? 'Edited draft' : 'Draft');
    expect(reopened === input).toBe(implementation === 'headless');
  }
});

test.each(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const)(
  'preserves native %s heading semantics, refs, and caller-supplied associations',
  async (as) => {
    const headerRef = React.createRef<HTMLDivElement>();
    const buttonRef = React.createRef<HTMLButtonElement>();
    const panelRef = React.createRef<HTMLDivElement>();
    const screen = await render(
      <CoreAIFluentProvider>
        <Accordion defaultOpenItems={['overview']} collapsible>
          <AccordionItem value="overview">
            <AccordionHeader
              as={as}
              ref={headerRef}
              button={{
                id: 'heading-button',
                ref: buttonRef,
                'aria-controls': 'heading-panel',
              }}
            >
              Overview
            </AccordionHeader>
            <AccordionPanel
              ref={panelRef}
              id="heading-panel"
              role="region"
              aria-labelledby="heading-button"
            >
              Overview content
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </CoreAIFluentProvider>,
    );
    expect(headerRef.current?.tagName).toBe(as.toUpperCase());
    await expect
      .element(screen.getByRole('heading', { name: 'Overview', level: Number(as.slice(1)) }))
      .toBeVisible();
    expect(buttonRef.current).toHaveAttribute('aria-controls', panelRef.current?.id);
    expect(panelRef.current).toHaveAccessibleName('Overview');
  },
);

test('preserves all family refs, classes, slot content, native props, and resolved visual attributes', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const itemRef = React.createRef<HTMLDivElement>();
  const headerRef = React.createRef<HTMLDivElement>();
  const buttonRef = React.createRef<HTMLButtonElement>();
  const expandRef = React.createRef<HTMLSpanElement>();
  const iconRef = React.createRef<HTMLDivElement>();
  const panelRef = React.createRef<HTMLDivElement>();
  const click = vi.fn();
  const screen = await render(
    <CoreAIFluentProvider>
      <Accordion
        ref={rootRef}
        className="consumer-accordion"
        multiple
        collapsible
        defaultOpenItems={['overview']}
        data-consumer="root"
      >
        <AccordionItem
          ref={itemRef}
          className="consumer-item"
          value="overview"
          data-consumer="item"
        >
          <AccordionHeader
            ref={headerRef}
            className="consumer-header"
            size="large"
            inline
            expandIconPosition="end"
            title="Workspace heading"
            data-consumer="header"
            button={{
              ref: buttonRef,
              className: 'consumer-button',
              onClick: click,
              title: 'Toggle overview',
            }}
            expandIcon={{
              ref: expandRef,
              className: 'consumer-expand',
              children: <span data-consumer-expand="">+</span>,
            }}
            icon={{ ref: iconRef, className: 'consumer-icon', children: <AccordionFixtureIcon /> }}
          >
            <span className="consumer-content">Overview</span>
          </AccordionHeader>
          <AccordionPanel
            ref={panelRef}
            className="consumer-panel"
            title="Workspace content"
            data-consumer="panel"
          >
            <span className="consumer-panel-content">Panel content</span>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </CoreAIFluentProvider>,
  );
  expect(rootRef.current).toHaveClass(accordionClassNames.root, 'consumer-accordion');
  expect(rootRef.current).toHaveAttribute('data-multiple', '');
  expect(rootRef.current).toHaveAttribute('data-collapsible', '');
  expect(itemRef.current).toHaveClass(accordionItemClassNames.root, 'consumer-item');
  expect(itemRef.current).toHaveAttribute('data-open', '');
  expect(headerRef.current).toHaveClass(accordionHeaderClassNames.root, 'consumer-header');
  expect(headerRef.current).toHaveAttribute('data-size', 'large');
  expect(headerRef.current).toHaveAttribute('data-inline', '');
  expect(headerRef.current).toHaveAttribute('data-has-icon', '');
  expect(headerRef.current).toHaveAttribute('data-has-expand-icon', '');
  expect(headerRef.current).toHaveAttribute('data-expand-icon-position', 'end');
  expect(buttonRef.current).toHaveClass(accordionHeaderClassNames.button, 'consumer-button');
  expect(expandRef.current).toHaveClass(accordionHeaderClassNames.expandIcon, 'consumer-expand');
  expect(iconRef.current).toHaveClass(accordionHeaderClassNames.icon, 'consumer-icon');
  expect(panelRef.current).toHaveClass(accordionPanelClassNames.root, 'consumer-panel');
  expect(panelRef.current).toHaveAttribute('title', 'Workspace content');
  for (const [ref, value] of [
    [rootRef, 'root'],
    [itemRef, 'item'],
    [headerRef, 'header'],
    [panelRef, 'panel'],
  ] as const) {
    expect(ref.current).toHaveAttribute('data-consumer', value);
  }
  expect(screen.container.querySelector('.consumer-content')?.className).toBe('consumer-content');
  expect(screen.container.querySelector('.consumer-panel-content')?.className).toBe(
    'consumer-panel-content',
  );
  expect(expandRef.current?.querySelector('svg')).toBeNull();
  expect(getComputedStyle(expandRef.current!.firstElementChild!).transform).toBe('none');
  for (const attribute of ['size', 'inline', 'expandiconposition']) {
    expect(headerRef.current).not.toHaveAttribute(attribute);
  }
  await userEvent.click(screen.getByRole('button', { name: 'Overview', exact: true }));
  expect(click).toHaveBeenCalledOnce();
  expect(itemRef.current).not.toHaveAttribute('data-open');
  expect(headerRef.current).not.toHaveAttribute('data-open');
  expect(panelRef.current).not.toHaveAttribute('data-open');
});

test('preserves current public slot render functions and native slot/ref metadata', async () => {
  const headerRef = React.createRef<HTMLDivElement>();
  const buttonRef = React.createRef<HTMLButtonElement>();
  const iconRef = React.createRef<HTMLDivElement>();
  const expandRef = React.createRef<HTMLSpanElement>();
  const panelRef = React.createRef<HTMLDivElement>();
  const headerRoot: SlotRenderFunction<ExtractSlotProps<AccordionHeaderSlots['root']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-rendered-header="">
      {props.children}
    </Component>
  );
  const button: SlotRenderFunction<
    Extract<ExtractSlotProps<AccordionHeaderSlots['button']>, { as?: 'button' }>
  > = (Component, props) => (
    <Component {...props} data-rendered-button="">
      {props.children}Rendered section
    </Component>
  );
  const icon: SlotRenderFunction<ExtractSlotProps<AccordionHeaderSlots['icon']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-rendered-icon="">
      <span data-consumer-icon="">i</span>
    </Component>
  );
  const expand: SlotRenderFunction<ExtractSlotProps<AccordionHeaderSlots['expandIcon']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-rendered-expand="">
      {props.children}
    </Component>
  );
  const panel: SlotRenderFunction<ExtractSlotProps<AccordionPanelSlots['root']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-rendered-panel="">
      Rendered panel content
    </Component>
  );
  const screen = await render(
    <CoreAIFluentProvider>
      <Accordion collapsible defaultOpenItems={['rendered']}>
        <AccordionItem value="rendered">
          <AccordionHeader
            ref={headerRef}
            button={{
              as: 'button',
              ref: buttonRef,
              children: button,
              'aria-label': 'Rendered section',
            }}
            icon={{ ref: iconRef, children: icon }}
            expandIcon={{ ref: expandRef, children: expand }}
          >
            {headerRoot}
          </AccordionHeader>
          <AccordionPanel ref={panelRef}>{panel}</AccordionPanel>
        </AccordionItem>
      </Accordion>
    </CoreAIFluentProvider>,
  );
  expect(headerRef.current).toHaveAttribute('data-rendered-header', '');
  expect(buttonRef.current).toHaveAttribute('data-rendered-button', '');
  expect(iconRef.current).toHaveAttribute('data-rendered-icon', '');
  expect(expandRef.current).toHaveAttribute('data-rendered-expand', '');
  expect(panelRef.current).toHaveAttribute('data-rendered-panel', '');
  expect(buttonRef.current).toHaveClass(accordionHeaderClassNames.button);
  expect(buttonRef.current).toBeInstanceOf(HTMLButtonElement);
  expect(iconRef.current).toBeInstanceOf(HTMLDivElement);
  expect(expandRef.current).toBeInstanceOf(HTMLSpanElement);
  expect(panelRef.current).toBeInstanceOf(HTMLDivElement);
  expect(expandRef.current?.querySelector('svg')).not.toBeNull();
  expect(iconRef.current?.querySelector('[data-consumer-icon]')).not.toHaveClass(
    accordionHeaderClassNames.icon,
  );
  await expect.element(screen.getByText('Rendered panel content')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Rendered section', exact: true }));
  expect(panelRef.current).not.toHaveAttribute('data-open');
  expect(getComputedStyle(panelRef.current!).display).toBe('none');
});

test('preserves public Accordion and AccordionItem root render functions and their resolved state', async () => {
  const rootRef = React.createRef<HTMLDivElement>();
  const itemRef = React.createRef<HTMLDivElement>();
  const root: SlotRenderFunction<ExtractSlotProps<AccordionSlots['root']>> = (Component, props) => (
    <Component {...props} data-rendered-accordion="">
      {props.children}
    </Component>
  );
  const item: SlotRenderFunction<ExtractSlotProps<AccordionItemSlots['root']>> = (
    Component,
    props,
  ) => (
    <Component {...props} data-rendered-item="">
      {props.children}
    </Component>
  );
  await render(
    <CoreAIFluentProvider>
      <Accordion ref={rootRef} className="rendered-root" multiple collapsible>
        {root}
      </Accordion>
      <Accordion defaultOpenItems={['item']}>
        <AccordionItem ref={itemRef} value="item" className="rendered-item">
          {item}
        </AccordionItem>
      </Accordion>
    </CoreAIFluentProvider>,
  );
  expect(rootRef.current).toHaveAttribute('data-rendered-accordion', '');
  expect(rootRef.current).toHaveClass(accordionClassNames.root, 'rendered-root');
  expect(rootRef.current).toHaveAttribute('data-multiple', '');
  expect(itemRef.current).toHaveAttribute('data-rendered-item', '');
  expect(itemRef.current).toHaveClass(accordionItemClassNames.root, 'rendered-item');
  expect(itemRef.current).toHaveAttribute('data-open', '');
});

test.each(families)(
  '$name preserves native anchor-slot link semantics, ref, focus, and a caller activation veto',
  async ({ Root, Item, Header, Panel }) => {
    const anchorRef = React.createRef<HTMLAnchorElement>();
    const onToggle = vi.fn();
    const onClick = vi.fn((event: React.MouseEvent<HTMLAnchorElement>) => event.preventDefault());
    const screen = await render(
      <CoreAIFluentProvider>
        <Root collapsible onToggle={onToggle}>
          <Item value="anchor">
            <Header button={{ as: 'a', ref: anchorRef, href: '#section', onClick }}>
              Anchor trigger
            </Header>
            <Panel>Anchor panel</Panel>
          </Item>
        </Root>
      </CoreAIFluentProvider>,
    );
    const trigger = screen.getByRole('link', { name: 'Anchor trigger' });
    expect(anchorRef.current).toBeInstanceOf(HTMLAnchorElement);
    expect(anchorRef.current).toHaveAttribute('href', '#section');
    await userEvent.click(trigger);
    await expect.element(trigger).toHaveFocus();
    expect(onClick).toHaveBeenCalledOnce();
    expect(onToggle).not.toHaveBeenCalled();
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
  },
);

test('lets unlayered consumer classes override component and CoreAI slot styles', async () => {
  const { legacy, headless } = await renderPair(accordionConsumerExample);
  const styles = captureAccordionHeaderStyles(headless.items[0].header);
  expect(styles['button.display']).toBe('flex');
  expect(styles['button.padding-left']).toBe('10px');
  expect(styles['button.min-height']).toBe('52px');
  expect(styles['button.color']).toBe('rgb(20, 90, 160)');
  expect(styles['button.font-size']).toBe('18px');
  expect(styles['expandIcon.padding-left']).toBe('3px');
  expect(styles['expandIcon.font-size']).toBe('16px');
  expect(styles['expandIcon.border-radius']).toBe('2px');
  expect(styles['icon.padding-right']).toBe('10px');
  expect(captureAccordionStyles(headless)['item0.panel.margin-left']).toBe('8px');
  expect(
    compareAccordionStyles(captureAccordionStyles(legacy), captureAccordionStyles(headless)).length,
  ).toBeGreaterThan(0);
});
