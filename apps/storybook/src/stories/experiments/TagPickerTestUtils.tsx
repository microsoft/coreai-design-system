// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { expect } from 'vitest';
import { userEvent } from 'vitest/browser';
import { coreaiLightTheme, type PositioningImperativeRef } from '@coreai-ds/react-components';
import { renderCoreAIComponent } from './HeadlessTestUtils.js';
import { FocusgroupConsumer } from './FocusgroupConsumer.js';
import { TagPickerComparison, type TagPickerExample } from './TagPickerComparison.js';
import {
  captureTagPickerStyles,
  compareTagPickerStyles,
  getComparisonTagPicker,
  getTagPickerPopup,
  refreshTagPickerPositioning,
  settleTagPickerStyles,
} from './compareTagPickerStyles.js';

export async function renderTagPickerPair(
  example: TagPickerExample,
  theme = coreaiLightTheme,
  defaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const legacyPositioning = React.createRef<PositioningImperativeRef>();
  const headlessPositioning = React.createRef<PositioningImperativeRef>();
  const screen = await renderCoreAIComponent(
    <FocusgroupConsumer>
      <div data-testid="tagpicker-pointer-rest">Pointer rest</div>
      <TagPickerComparison
        example={example}
        legacyPositioningRef={legacyPositioning}
        headlessPositioningRef={headlessPositioning}
      />
    </FocusgroupConsumer>,
    { providerProps: { theme, withComponentDefaults: defaults, dir } },
  );
  await userEvent.hover(screen.getByTestId('tagpicker-pointer-rest'));
  const legacy = getComparisonTagPicker(screen.container, 'legacy');
  const headless = getComparisonTagPicker(screen.container, 'headless');
  const legacyPopup = getTagPickerPopup(screen.container, 'legacy');
  const headlessPopup = getTagPickerPopup(screen.container, 'headless');
  await settleTagPickerStyles(legacy, headless);
  if (legacyPopup && headlessPopup) {
    await expect.poll(() => headlessPopup.matches(':popover-open')).toBe(true);
    if (!legacyPositioning.current || !headlessPositioning.current) {
      throw new Error('Missing TagPicker fixture positioning handle');
    }
    await refreshTagPickerPositioning(
      legacyPopup,
      legacy,
      headlessPopup,
      headless,
      legacyPositioning.current,
      headlessPositioning.current,
    );
  }
  const differences = () =>
    compareTagPickerStyles(
      captureTagPickerStyles(legacy, legacyPopup),
      captureTagPickerStyles(headless, headlessPopup),
      example.consumer,
    );
  return {
    screen,
    legacy,
    headless,
    legacyPopup,
    headlessPopup,
    differences,
    unexpected: () => differences().filter((difference) => difference.kind === 'unexpected'),
  };
}

export function tagPickerLocatorHTML(locator: { element(): Element }): HTMLElement {
  const element = locator.element();
  if (!(element instanceof HTMLElement)) throw new Error('Expected an HTML TagPicker locator');
  return element;
}

export function tagPickerLocatorInput(locator: { element(): Element }): HTMLInputElement {
  const element = locator.element();
  if (!(element instanceof HTMLInputElement)) throw new Error('Expected a native TagPicker input');
  return element;
}
