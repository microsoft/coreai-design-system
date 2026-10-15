// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  makeStyles,
} from '@fluentui/react-components';
import { afterEach, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';

afterEach(cleanup);

const useStyles = makeStyles({
  customButton: {
    display: 'flex',
    color: 'rgb(255, 0, 0)',
  },
});

const CustomAccordionHeader = () => {
  const styles = useStyles();

  return (
    <AccordionHeader button={{ className: styles.customButton }}>Custom header</AccordionHeader>
  );
};

const getExpandIcon = (button: HTMLElement | SVGElement) => {
  const expandIcon = button.querySelector<HTMLElement>('.fui-AccordionHeader__expandIcon');

  expect(expandIcon).not.toBeNull();

  return expandIcon!;
};

test.each([
  {
    name: 'Default',
    withIcon: false,
    expandIconPosition: 'start' as const,
    flexibleTrackIndex: 1,
  },
  {
    name: 'With icon',
    withIcon: true,
    expandIconPosition: 'start' as const,
    flexibleTrackIndex: 2,
  },
  { name: 'End', withIcon: false, expandIconPosition: 'end' as const, flexibleTrackIndex: 0 },
  {
    name: 'With icon at end',
    withIcon: true,
    expandIconPosition: 'end' as const,
    flexibleTrackIndex: 1,
  },
])(
  'positions the expand icon correctly for $name headers',
  async ({ name, withIcon, expandIconPosition, flexibleTrackIndex }) => {
    const screen = await renderCoreAIComponent(
      <Accordion>
        <AccordionItem value="item">
          <AccordionHeader
            icon={
              withIcon ? (
                <span data-testid="header-icon" aria-hidden="true">
                  Icon
                </span>
              ) : undefined
            }
            expandIconPosition={expandIconPosition}
          >
            <span data-testid="header-content">{name}</span>
          </AccordionHeader>
          <AccordionPanel>Panel</AccordionPanel>
        </AccordionItem>
      </Accordion>,
    );

    const button = screen.getByRole('button', { name }).element();
    const expandIconRect = getExpandIcon(button).getBoundingClientRect();
    const contentRect = screen.getByTestId('header-content').element().getBoundingClientRect();
    const trackWidths = getComputedStyle(button).gridTemplateColumns.split(' ').map(parseFloat);

    expect(getComputedStyle(button).display).toBe('grid');
    expect(trackWidths.indexOf(Math.max(...trackWidths))).toBe(flexibleTrackIndex);
    if (expandIconPosition === 'start') {
      expect(expandIconRect.left).toBeLessThan(contentRect.left);
    } else {
      expect(expandIconRect.left).toBeGreaterThan(contentRect.left);
    }

    if (withIcon) {
      const headerIconRect = screen.getByTestId('header-icon').element().getBoundingClientRect();

      expect(headerIconRect.left).toBeLessThan(contentRect.left);
      expect(headerIconRect.right).toBeLessThanOrEqual(contentRect.left);
    }
  },
);

test('removes the default spacing around the header and panel', async () => {
  const screen = await renderCoreAIComponent(
    <Accordion defaultOpenItems={['item']}>
      <AccordionItem value="item">
        <AccordionHeader>Aligned header</AccordionHeader>
        <AccordionPanel>Aligned panel</AccordionPanel>
      </AccordionItem>
    </Accordion>,
  );

  const buttonStyle = getComputedStyle(
    screen.getByRole('button', { name: 'Aligned header' }).element(),
  );
  const panelStyle = getComputedStyle(screen.getByText('Aligned panel').element());

  expect(buttonStyle.padding).toBe('0px');
  expect(panelStyle.margin).toBe('0px');
});

test('keeps the expand icon vertically centered without stretching to tall header content', async () => {
  const screen = await renderCoreAIComponent(
    <Accordion>
      <AccordionItem value="item">
        <AccordionHeader>
          <span data-testid="tall-header-content" style={{ display: 'block', height: '80px' }}>
            Tall header content
          </span>
        </AccordionHeader>
        <AccordionPanel>Panel</AccordionPanel>
      </AccordionItem>
    </Accordion>,
  );

  const button = screen.getByRole('button', { name: 'Tall header content' }).element();
  const buttonRect = button.getBoundingClientRect();
  const expandIconRect = getExpandIcon(button).getBoundingClientRect();
  const buttonCenter = buttonRect.top + buttonRect.height / 2;
  const expandIconCenter = expandIconRect.top + expandIconRect.height / 2;

  expect(expandIconRect.height).toBeLessThan(buttonRect.height);
  expect(Math.abs(expandIconCenter - buttonCenter)).toBeLessThanOrEqual(1);
});

test('does not apply interactive hover treatment to a disabled header', async () => {
  const screen = await renderCoreAIComponent(
    <Accordion>
      <AccordionItem value="enabled">
        <AccordionHeader>Enabled header</AccordionHeader>
        <AccordionPanel>Enabled panel</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="disabled" disabled>
        <AccordionHeader>Disabled header</AccordionHeader>
        <AccordionPanel>Disabled panel</AccordionPanel>
      </AccordionItem>
    </Accordion>,
  );

  const enabledButton = screen.getByRole('button', { name: 'Enabled header' }).element();
  const disabledButton = screen.getByRole('button', { name: 'Disabled header' }).element();
  const disabledIcon = getExpandIcon(disabledButton);
  const disabledBackgroundBeforeHover = getComputedStyle(disabledIcon).backgroundColor;

  await userEvent.hover(enabledButton);
  const enabledHoverBackground = getComputedStyle(getExpandIcon(enabledButton)).backgroundColor;

  await userEvent.hover(disabledButton);

  expect(enabledHoverBackground).not.toBe('rgba(0, 0, 0, 0)');
  expect(getComputedStyle(disabledIcon).backgroundColor).toBe(disabledBackgroundBeforeHover);
  await userEvent.unhover(disabledButton);
});

test('applies the pressed treatment while an enabled header is active', async () => {
  let pressedBackground: string | undefined;
  const screen = await renderCoreAIComponent(
    <Accordion>
      <AccordionItem value="item">
        <AccordionHeader
          button={{
            onMouseDown: (event: React.MouseEvent<HTMLButtonElement>) => {
              pressedBackground = getComputedStyle(
                getExpandIcon(event.currentTarget),
              ).backgroundColor;
            },
          }}
        >
          Active header
        </AccordionHeader>
        <AccordionPanel>Panel</AccordionPanel>
      </AccordionItem>
    </Accordion>,
  );
  const button = screen.getByRole('button', { name: 'Active header' }).element();
  const expandIcon = getExpandIcon(button);

  await userEvent.hover(button);
  const hoverBackground = getComputedStyle(expandIcon).backgroundColor;

  await userEvent.click(button);
  expect(pressedBackground).toBeDefined();
  expect(pressedBackground).not.toBe(hoverBackground);
  await userEvent.unhover(button);
});

test('allows button slot styles to override CoreAI header styles', async () => {
  const screen = await renderCoreAIComponent(
    <Accordion>
      <AccordionItem value="item">
        <CustomAccordionHeader />
        <AccordionPanel>Panel</AccordionPanel>
      </AccordionItem>
    </Accordion>,
  );

  const style = getComputedStyle(screen.getByRole('button', { name: 'Custom header' }).element());

  expect(style.display).toBe('flex');
  expect(style.color).toBe('rgb(255, 0, 0)');
});

test('keeps stock Fluent header layout when component defaults are disabled', async () => {
  const screen = await renderCoreAIComponent(
    <Accordion>
      <AccordionItem value="item">
        <AccordionHeader>Stock header</AccordionHeader>
        <AccordionPanel>Panel</AccordionPanel>
      </AccordionItem>
    </Accordion>,
    { providerProps: { withComponentDefaults: false } },
  );

  expect(
    getComputedStyle(screen.getByRole('button', { name: 'Stock header' }).element()).display,
  ).not.toBe('grid');
});
