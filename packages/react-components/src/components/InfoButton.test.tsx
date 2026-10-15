// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { InfoButton } from './InfoButton.js';

afterEach(cleanup);

test('opens primitive info with an accessible name', async () => {
  const screen = await renderCoreAIComponent(
    <InfoButton aria-label="About model responses" info="Responses may contain mistakes." />,
  );

  await screen.getByRole('button', { name: 'About model responses' }).click();

  await expect
    .element(screen.getByRole('note', { name: 'Responses may contain mistakes.' }))
    .toBeVisible();
});

test('uses aria-labelledby as the button accessible name', async () => {
  const screen = await renderCoreAIComponent(
    <>
      <span id="info-button-label">About citations</span>
      <InfoButton aria-labelledby="info-button-label" info={3} />
    </>,
  );

  const button = screen.getByRole('button', { name: 'About citations' });
  await expect.element(button).toHaveAttribute('aria-labelledby', 'info-button-label');

  await button.click();
  await expect.element(screen.getByRole('note', { name: '3' })).toBeVisible();
});

test('preserves consumer accessibility props for rich info content', async () => {
  const screen = await renderCoreAIComponent(
    <InfoButton
      aria-label="About groundedness"
      info={{
        'aria-label': 'Groundedness details',
        children: <strong>Grounded answers cite their sources.</strong>,
      }}
    />,
  );

  await screen.getByRole('button', { name: 'About groundedness' }).click();

  await expect.element(screen.getByRole('note', { name: 'Groundedness details' })).toBeVisible();
  await expect.element(screen.getByText('Grounded answers cite their sources.')).toBeVisible();
});

test('forwards its ref to the underlying button', async () => {
  const ref = React.createRef<HTMLButtonElement>();

  await renderCoreAIComponent(
    <InfoButton ref={ref} aria-label="About responses" info="More information" />,
  );

  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  expect(ref.current?.getAttribute('aria-label')).toBe('About responses');
});

test('preserves the CoreAI and consumer class names', async () => {
  const screen = await renderCoreAIComponent(
    <InfoButton
      aria-label="About responses"
      info="More information"
      className="consumer-info-button"
    />,
  );
  const button = screen.getByRole('button', { name: 'About responses' }).element();

  expect(button).toHaveClass('fui-InfoButton');
  expect(button).toHaveClass('consumer-info-button');
});

test('preserves wrapper behavior when component defaults are disabled', async () => {
  const screen = await renderCoreAIComponent(
    <InfoButton aria-label="About evaluation" info="Evaluation details" />,
    { providerProps: { withComponentDefaults: false } },
  );

  await screen.getByRole('button', { name: 'About evaluation' }).click();

  await expect.element(screen.getByRole('note', { name: 'Evaluation details' })).toBeVisible();
});
