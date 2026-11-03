// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { expect } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import {
  CoreAIFluentProvider,
  coreaiLightTheme,
  type PositioningImperativeRef,
} from '@coreai-ds/react-components';
import { OptionPickerComparison, type PickerExample } from './OptionPickerComparison.js';
import {
  captureOptionPickerStyles,
  compareOptionPickerStyles,
  getComparisonPicker,
  getComparisonPickerPopup,
  refreshOptionPickerPositioning,
  settleOptionPickerStyles,
} from './compareOptionPickerStyles.js';

export async function renderPickerPair(
  example: PickerExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const legacyPositioning = React.createRef<PositioningImperativeRef>();
  const headlessPositioning = React.createRef<PositioningImperativeRef>();
  const screen = await render(
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <OptionPickerComparison
        example={example}
        legacyPositioningRef={legacyPositioning}
        headlessPositioningRef={headlessPositioning}
      />
    </CoreAIFluentProvider>,
  );
  await userEvent.hover(screen.getByText('Current CoreAI / Griffel', { exact: true }));
  const legacy = getComparisonPicker(screen.container, 'legacy');
  const headless = getComparisonPicker(screen.container, 'headless');
  const legacyPopup = getComparisonPickerPopup(screen.container, 'legacy');
  const headlessPopup = getComparisonPickerPopup(screen.container, 'headless');
  await settleOptionPickerStyles(legacy, headless);
  if (example.kind !== 'listbox' && legacyPopup && headlessPopup) {
    await expect.poll(() => headlessPopup.matches(':popover-open')).toBe(true);
    if (!legacyPositioning.current || !headlessPositioning.current) {
      throw new Error('Missing fixture positioning handle');
    }
    await refreshOptionPickerPositioning(
      legacyPopup,
      legacy,
      headlessPopup,
      headless,
      legacyPositioning.current,
      headlessPositioning.current,
    );
  }
  const allDifferences = () =>
    compareOptionPickerStyles(
      captureOptionPickerStyles(legacy, legacyPopup),
      captureOptionPickerStyles(headless, headlessPopup),
    );
  const differences = () =>
    allDifferences().filter((difference) => difference.kind === 'unexpected');
  return {
    screen,
    legacy,
    headless,
    legacyPopup,
    headlessPopup,
    legacyPositioning,
    headlessPositioning,
    differences,
    allDifferences,
  };
}

export function htmlElement(locator: { element(): Element }): HTMLElement {
  const element = locator.element();
  if (!(element instanceof HTMLElement)) throw new Error('Expected an HTML fixture element');
  return element;
}

export function nativeInput(container: ParentNode, selector = 'input'): HTMLInputElement {
  const input = container.querySelector(selector);
  if (!(input instanceof HTMLInputElement)) throw new Error('Expected a native input');
  return input;
}
