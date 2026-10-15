// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { MessageBar as FluentMessageBar } from '@fluentui/react-components';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { MessageBar } from './MessageBar.js';

afterEach(cleanup);

const getMessageBarStyles = (messageBar: Element) => {
  const rootStyles = getComputedStyle(messageBar);
  const icon = messageBar.querySelector('.fui-MessageBar__icon');

  expect(icon).not.toBeNull();

  return {
    backgroundColor: rootStyles.backgroundColor,
    borderColor: rootStyles.borderColor,
    iconColor: getComputedStyle(icon!).color,
  };
};

test('maps brand to informational behavior with brand styling and the stock info icon', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <MessageBar data-testid="brand" intent="brand">
        Brand message
      </MessageBar>
      <MessageBar data-testid="info" intent="info">
        Info message
      </MessageBar>
    </>,
  );
  const brand = screen.getByTestId('brand').element();
  const info = screen.getByTestId('info').element();
  const brandIcon = brand.querySelector('.fui-MessageBar__icon svg');
  const infoIcon = info.querySelector('.fui-MessageBar__icon svg');

  expect(brand.getAttribute('aria-live')).toBe(info.getAttribute('aria-live'));
  expect(brandIcon).not.toBeNull();
  expect(brandIcon?.innerHTML).toBe(infoIcon?.innerHTML);
  expect(getMessageBarStyles(brand)).not.toEqual(getMessageBarStyles(info));
});

test.each(['warning', 'error', 'success'] as const)(
  'preserves Fluent %s intent behavior',
  async (intent) => {
    const screen = await renderCoreAIComponent(
      <>
        <MessageBar data-testid="coreai" intent={intent}>
          CoreAI message
        </MessageBar>
        <FluentMessageBar data-testid="fluent" intent={intent}>
          Fluent message
        </FluentMessageBar>
      </>,
    );
    const coreAIMessageBar = screen.getByTestId('coreai').element();
    const fluentMessageBar = screen.getByTestId('fluent').element();

    expect(getMessageBarStyles(coreAIMessageBar)).toEqual(getMessageBarStyles(fluentMessageBar));
  },
);

test('preserves explicit icon and consumer class and style overrides for brand', async () => {
  const screen = await renderCoreAIComponent(
    <MessageBar
      data-testid="brand"
      intent="brand"
      className="consumer-message-bar"
      icon={<span aria-label="Custom brand icon">AI</span>}
      style={{ backgroundColor: 'rgb(255, 0, 0)', borderColor: 'rgb(0, 128, 0)' }}
    >
      Customized brand message
    </MessageBar>,
  );
  const messageBar = screen.getByTestId('brand').element();
  const styles = getComputedStyle(messageBar);

  await expect.element(screen.getByLabelText('Custom brand icon')).toBeVisible();
  expect(messageBar.classList).toContain('consumer-message-bar');
  expect(styles.backgroundColor).toBe('rgb(255, 0, 0)');
  expect(styles.borderColor).toBe('rgb(0, 128, 0)');
});

test('forwards its ref to the underlying MessageBar element', async () => {
  const ref = React.createRef<HTMLDivElement>();

  await renderCoreAIComponent(<MessageBar ref={ref}>Message</MessageBar>);

  expect(ref.current).toBeInstanceOf(HTMLDivElement);
  expect(ref.current?.textContent).toContain('Message');
});

test('keeps brand intent when component defaults are disabled', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <MessageBar data-testid="brand" intent="brand">
        Brand message
      </MessageBar>
      <MessageBar data-testid="info" intent="info">
        Info message
      </MessageBar>
    </>,
    { providerProps: { withComponentDefaults: false } },
  );

  expect(getMessageBarStyles(screen.getByTestId('brand').element())).not.toEqual(
    getMessageBarStyles(screen.getByTestId('info').element()),
  );
});
