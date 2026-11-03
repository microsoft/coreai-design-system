// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, expectTypeOf, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import * as primitiveDialog from '@fluentui/react-headless-components-preview/dialog';
import type {
  ExtractSlotProps,
  ForwardRefComponent,
  SlotRenderFunction,
} from '@fluentui/react-utilities';
import { coreaiDarkTheme, coreaiLightTheme } from '@coreai-ds/react-components';
import { ComparisonProvider as CoreAIFluentProvider } from '../../../apps/storybook/src/stories/experiments/ComparisonProvider.js';
import {
  DialogComparison,
  DialogConfirmationFlow,
  DialogControlledFlow,
  DialogFormFlow,
  DialogNestedFlow,
  dialogConsumerExample,
  dialogExamples,
  type DialogExample,
  type DialogImplementation,
} from '../../../apps/storybook/src/stories/experiments/DialogComparison.js';
import { DialogComparisonWithReport } from '../../../apps/storybook/src/stories/experiments/DialogComparisonReport.js';
import {
  captureDialogNativeContract,
  captureDialogStyles,
  compareDialogStyles,
  getComparisonDialog,
  settleDialogStyles,
} from '../../../apps/storybook/src/stories/experiments/compareDialogStyles.js';
import {
  Dialog,
  useDialogContext,
  useDialogContextValues,
  useDialogSurfaceContext,
  type DialogProps,
} from './Dialog.js';
import { DialogTrigger, type DialogTriggerProps } from './DialogTrigger.js';
import {
  DialogSurface,
  dialogSurfaceClassNames,
  type DialogSurfaceProps,
  type DialogSurfaceSlots,
} from './DialogSurface.js';
import {
  DialogHeader,
  dialogHeaderClassNames,
  type DialogHeaderProps,
  type DialogHeaderSlots,
} from './DialogHeader.js';
import {
  DialogTitle,
  dialogTitleClassNames,
  type DialogTitleProps,
  type DialogTitleSlots,
} from './DialogTitle.js';
import {
  DialogBody,
  dialogBodyClassNames,
  type DialogBodyProps,
  type DialogBodySlots,
} from './DialogBody.js';
import {
  DialogActions,
  dialogActionsClassNames,
  type DialogActionsProps,
  type DialogActionsSlots,
} from './DialogActions.js';

afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

const themes = [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const;

function requireDialog(element: Element): HTMLDialogElement {
  if (!(element instanceof HTMLDialogElement)) throw new Error('Expected native dialog');
  return element;
}

function requireHTML(element: Element): HTMLElement {
  if (!(element instanceof HTMLElement)) throw new Error('Expected native HTML element');
  return element;
}

function NativeFixture({
  surfaceProps,
  surfaceRef,
  primitive = false,
  ...props
}: Omit<DialogProps, 'children'> & {
  surfaceProps?: Omit<DialogSurfaceProps, 'children'>;
  surfaceRef?: React.Ref<HTMLDialogElement>;
  primitive?: boolean;
}) {
  const descriptionId = React.useId();
  const Root = primitive ? primitiveDialog.Dialog : Dialog;
  const Trigger = primitive ? primitiveDialog.DialogTrigger : DialogTrigger;
  const Surface = primitive ? primitiveDialog.DialogSurface : DialogSurface;
  const Header = primitive ? primitiveDialog.DialogHeader : DialogHeader;
  const Title = primitive ? primitiveDialog.DialogTitle : DialogTitle;
  const Body = primitive ? primitiveDialog.DialogBody : DialogBody;
  const Actions = primitive ? primitiveDialog.DialogActions : DialogActions;
  return (
    <CoreAIFluentProvider>
      <div>
        <button type="button">Before native dialog</button>
        <Root {...props}>
          <Trigger>
            <button type="button">Native dialog trigger</button>
          </Trigger>
          <Surface
            ref={surfaceRef}
            aria-describedby={descriptionId}
            data-testid="native-dialog"
            {...surfaceProps}
          >
            <Header>
              <Title>Native dialog</Title>
            </Header>
            <Body>
              <p id={descriptionId}>Review the native dialog.</p>
              <button type="button">First native action</button>
              <button type="button">Last native action</button>
            </Body>
            <Actions>
              <Trigger>
                <button type="button">Close native dialog</button>
              </Trigger>
            </Actions>
          </Surface>
        </Root>
        <button type="button">Outside native dialog</button>
      </div>
    </CoreAIFluentProvider>
  );
}

async function renderPair(
  example: DialogExample,
  theme = coreaiLightTheme,
  withComponentDefaults = true,
  dir: 'ltr' | 'rtl' = 'ltr',
) {
  const fixtureId = 'selected-dialog-comparison';
  const fixture = (openImplementation?: DialogImplementation) => (
    <CoreAIFluentProvider theme={theme} withComponentDefaults={withComponentDefaults} dir={dir}>
      <DialogComparison
        fixtureId={fixtureId}
        example={example}
        openImplementation={openImplementation}
      />
    </CoreAIFluentProvider>
  );
  const screen = await render(fixture('legacy'));
  const legacy = getComparisonDialog(fixtureId, 'legacy');
  await userEvent.hover(legacy, { position: { x: 3, y: 3 } });
  await settleDialogStyles(legacy);
  const legacyStyles = captureDialogStyles(legacy);
  const legacyNative = captureDialogNativeContract(legacy);
  await screen.rerender(fixture());
  await expect
    .poll(() =>
      [...document.querySelectorAll<HTMLElement>('[data-dialog-implementation]')].some(
        (element) => element.dataset.dialogImplementation === 'legacy',
      ),
    )
    .toBe(false);
  await screen.rerender(fixture('headless'));
  const headless = getComparisonDialog(fixtureId, 'headless');
  await userEvent.hover(headless, { position: { x: 3, y: 3 } });
  await settleDialogStyles(headless);
  const headlessStyles = captureDialogStyles(headless);
  const differences = compareDialogStyles(
    legacyStyles,
    headlessStyles,
    example.longContent,
    example.modalType === 'non-modal',
  );
  return { screen, headless, legacyStyles, headlessStyles, legacyNative, differences };
}

test('exposes only the installed native family contracts, public context readers and typed refs', () => {
  expectTypeOf<DialogProps>().toEqualTypeOf<primitiveDialog.DialogProps>();
  expectTypeOf<DialogTriggerProps>().toEqualTypeOf<primitiveDialog.DialogTriggerProps>();
  expectTypeOf<DialogSurfaceProps>().toEqualTypeOf<primitiveDialog.DialogSurfaceProps>();
  expectTypeOf<DialogTitleProps>().toEqualTypeOf<primitiveDialog.DialogTitleProps>();
  expectTypeOf<DialogBodyProps>().toEqualTypeOf<primitiveDialog.DialogBodyProps>();
  expectTypeOf<DialogHeaderProps>().toEqualTypeOf<primitiveDialog.DialogHeaderProps>();
  expectTypeOf<DialogActionsProps>().toEqualTypeOf<
    primitiveDialog.DialogActionsProps & { position?: 'start' | 'end'; fluid?: boolean }
  >();
  expectTypeOf<typeof DialogSurface>().toEqualTypeOf<ForwardRefComponent<DialogSurfaceProps>>();
  expectTypeOf<typeof DialogHeader>().toEqualTypeOf<ForwardRefComponent<DialogHeaderProps>>();
  expectTypeOf<typeof DialogTitle>().toEqualTypeOf<ForwardRefComponent<DialogTitleProps>>();
  expectTypeOf<typeof DialogBody>().toEqualTypeOf<ForwardRefComponent<DialogBodyProps>>();
  expectTypeOf<typeof DialogActions>().toEqualTypeOf<ForwardRefComponent<DialogActionsProps>>();
  expectTypeOf<DialogSurfaceProps>().not.toHaveProperty('backdrop');
  expectTypeOf<DialogSurfaceProps>().not.toHaveProperty('mountNode');
  expectTypeOf<DialogTitleProps>().not.toHaveProperty('action');
  expectTypeOf<DialogProps>().not.toHaveProperty('size');
  expectTypeOf<DialogProps>().not.toHaveProperty('fullscreen');
  expect('DialogContent' in primitiveDialog).toBe(false);
  expect('DialogProvider' in primitiveDialog).toBe(false);
  expect('DialogSurfaceProvider' in primitiveDialog).toBe(false);
  expect(useDialogContext).toBe(primitiveDialog.useDialogContext);
  expect(useDialogContextValues).toBe(primitiveDialog.useDialogContextValues);
  expect(useDialogSurfaceContext).toBe(primitiveDialog.useDialogSurfaceContext);
  expect(DialogTrigger).toBe(primitiveDialog.DialogTrigger);
});

for (const [themeName, theme] of themes) {
  for (const example of dialogExamples) {
    test(`${themeName}: sequential ${example.name} keeps the bounded visual contract`, async () => {
      const { headless, differences, headlessStyles, legacyNative } = await renderPair(
        example,
        theme,
      );
      expect(
        differences.filter((difference) => difference.kind === 'unexpected'),
        JSON.stringify({
          differences,
          legacy: legacyNative,
          native: captureDialogNativeContract(headless),
        }),
      ).toEqual([]);
      expect(headless instanceof HTMLDialogElement).toBe(true);
      expect(legacyNative['fonts.status']).toBe('loaded');
      expect(headless.ownerDocument.fonts.status).toBe('loaded');
      expect(headless.getBoundingClientRect().width).toBe(
        Math.min(600, headless.ownerDocument.documentElement.clientWidth),
      );
      expect(getComputedStyle(headless).paddingTop).toBe('16px');
      expect(headless.hasAttribute('data-open')).toBe(true);
      expect(headlessStyles['title.font-size']).toBe('20px');
      expect(headlessStyles['actions.gap']).toBe('8px');
      if (example.modalType === 'non-modal') {
        expect(headless.matches(':popover-open')).toBe(true);
        expect(headless.matches(':modal')).toBe(false);
      } else {
        expect(headless.matches(':modal')).toBe(true);
        expect(getComputedStyle(headless, '::backdrop').backgroundColor).not.toBe(
          'rgba(0, 0, 0, 0)',
        );
      }
      if (example.longContent) {
        const body = headless.querySelector<HTMLElement>('[data-dialog-content]');
        if (!body) throw new Error('Missing scrollable native body');
        expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
        expect(headless.getBoundingClientRect().height).toBe(innerHeight);
        expect(differences.some((difference) => difference.kind === 'native-viewport-sizing')).toBe(
          true,
        );
      }
    });
  }
}

test('comparison classifier remains exact and rejects incorrect scrolling dimensions or offsets', () => {
  const legacy = {
    'surface.padding-top': '16px',
    'surface.padding-bottom': '16px',
    'surface.border-top-width': '1px',
    'surface.rect.height': String(innerHeight - 14),
    'body.rect.height': '400',
    'actions.offset.top': '460',
    'title.offset.left': '17',
    'surface.rect.width': '600',
  };
  const modern = {
    ...legacy,
    'surface.rect.height': String(innerHeight),
    'body.rect.height': '414',
    'actions.offset.top': '474',
  };
  expect(compareDialogStyles(legacy, modern, true).map((difference) => difference.kind)).toEqual([
    'native-viewport-sizing',
    'native-viewport-sizing',
    'native-viewport-sizing',
  ]);
  expect(
    compareDialogStyles(legacy, { ...modern, 'body.rect.height': '414.01' }, true).find(
      (difference) => difference.property === 'body.rect.height',
    )?.kind,
  ).toBe('unexpected');
  expect(
    compareDialogStyles(legacy, { ...modern, 'title.offset.left': '17.01' }, true).find(
      (difference) => difference.property === 'title.offset.left',
    )?.kind,
  ).toBe('unexpected');
  expect(
    compareDialogStyles(legacy, { ...modern, 'surface.rect.width': '600.01' }, true).find(
      (difference) => difference.property === 'surface.rect.width',
    )?.kind,
  ).toBe('unexpected');
  expect(
    compareDialogStyles(legacy, modern).every((difference) => difference.kind === 'unexpected'),
  ).toBe(true);
  const small = matchMedia('screen and (max-width: 480px)').matches;
  const beakLegacy = {
    'divider.content': '""',
    'divider.border-top-width': '1px',
    'divider.border-bottom-color': 'rgb(61, 61, 61)',
    'theme.stroke-3': 'rgb(61, 61, 61)',
    'theme.stroke-subtle': 'rgb(15, 15, 15)',
    'surface.rect.height': '240',
    'actions.offset.top': '151',
  };
  const beakNative = {
    ...beakLegacy,
    'divider.border-top-width': '0px',
    'divider.border-bottom-color': 'rgb(15, 15, 15)',
    'surface.rect.height': small ? '239' : '240',
    'actions.offset.top': small ? '150' : '151',
  };
  expect(
    compareDialogStyles(beakLegacy, beakNative, false, true).every(
      (difference) => difference.kind === 'legacy-beak-border',
    ),
  ).toBe(true);
  expect(
    compareDialogStyles(
      beakLegacy,
      { ...beakNative, 'surface.rect.height': '238.99' },
      false,
      true,
    ).find((difference) => difference.property === 'surface.rect.height')?.kind,
  ).toBe('unexpected');
  expect(
    compareDialogStyles(
      beakLegacy,
      { ...beakNative, 'divider.border-bottom-color': 'rgb(16, 16, 16)' },
      false,
      true,
    ).find((difference) => difference.property === 'divider.border-bottom-color')?.kind,
  ).toBe('unexpected');
  expect(
    compareDialogStyles(beakLegacy, beakNative).every(
      (difference) => difference.kind === 'unexpected',
    ),
  ).toBe(true);
  const oldWidth = Math.min(600, innerWidth - 15);
  const newWidth = Math.min(600, innerWidth);
  const gutterLegacy = {
    'viewport.available-width': String(innerWidth - 15),
    'surface.rect.width': String(oldWidth),
    'body.rect.width': String(oldWidth - 2),
    'title.rect.width': String(oldWidth - 34),
    'actions.rect.width': String(oldWidth - 34),
    'actions.justify-self': 'stretch',
  };
  const gutterNative = {
    ...gutterLegacy,
    'viewport.available-width': String(innerWidth),
    'surface.rect.width': String(newWidth),
    'body.rect.width': String(newWidth - 2),
    'title.rect.width': String(newWidth - 34),
    'actions.rect.width': String(newWidth - 34),
  };
  expect(
    compareDialogStyles(gutterLegacy, gutterNative).every(
      (difference) => difference.kind === 'native-scrollbar-viewport',
    ),
  ).toBe(true);
  expect(
    compareDialogStyles(gutterLegacy, {
      ...gutterNative,
      'body.rect.width': String(newWidth - 2 + 0.01),
    }).find((difference) => difference.property === 'body.rect.width')?.kind,
  ).toBe('unexpected');
  expect(
    compareDialogStyles(
      { ...gutterLegacy, 'actions.justify-self': 'start' },
      {
        ...gutterNative,
        'actions.justify-self': 'start',
        'actions.rect.width': String(oldWidth - 34 + 1),
      },
    ).find((difference) => difference.property === 'actions.rect.width')?.kind,
  ).toBe('unexpected');
});

for (const dir of ['ltr', 'rtl'] as const) {
  test(`defaults opt-out keeps stock visual spacing and typography in ${dir}`, async () => {
    const example = dialogExamples.find((candidate) => candidate.headerClose);
    if (!example) throw new Error('Missing header-close fixture');
    const { headless, differences, headlessStyles } = await renderPair(
      example,
      coreaiLightTheme,
      false,
      dir,
    );
    expect(differences, JSON.stringify(differences)).toEqual([]);
    expect(headless.hasAttribute('data-coreai-defaults')).toBe(false);
    expect(headlessStyles['surface.padding-top']).toBe('24px');
    expect(headlessStyles['body.padding-top']).toBe('2px');
    expect(headlessStyles['divider.content']).toBe('none');
    expect(getComputedStyle(headless).direction).toBe(dir);
  });
}

test('ordinary consumer CSS and inline styles override both native visual layers', async () => {
  const { headless } = await renderPair(dialogConsumerExample);
  const body = headless.querySelector<HTMLElement>('[data-dialog-content]');
  const title = headless.querySelector<HTMLElement>('[data-dialog-title]');
  const actions = headless.querySelector<HTMLElement>('[data-dialog-actions]');
  if (!body || !title || !actions) throw new Error('Missing consumer slots');
  expect(getComputedStyle(headless).paddingTop).toBe('18px');
  expect(getComputedStyle(headless).borderTopWidth).toBe('3px');
  expect(getComputedStyle(headless).borderRadius).toBe('3px');
  expect(getComputedStyle(body).paddingTop).toBe('9px');
  expect(getComputedStyle(body).color).toBe('rgb(80, 40, 120)');
  expect(getComputedStyle(title).fontSize).toBe('22px');
  expect(getComputedStyle(actions).gap).toBe('11px');
  headless.style.padding = '7px';
  expect(getComputedStyle(headless).paddingTop).toBe('7px');
});

test('the 1440x1000 sequential report has stable reserved geometry and closes each real modal', async () => {
  const viewport = { width: innerWidth, height: innerHeight };
  await page.viewport(1440, 1000);
  try {
    const screen = await render(
      <CoreAIFluentProvider>
        <DialogComparisonWithReport />
      </CoreAIFluentProvider>,
    );
    const report = screen.getByRole('status', { name: 'Dialog style report' });
    await expect.element(report).toHaveAttribute('data-dialog-report-state', 'ready');
    await expect.element(report).toHaveAttribute('data-dialog-report-phase', 'idle');
    await expect.element(report).toHaveAttribute('data-dialog-unexpected-count', '0');
    const height = report.element().getBoundingClientRect().height;
    expect(height).toBe(448);
    expect(document.querySelector('dialog:modal, dialog:popover-open')).toBeNull();
    for (const name of ['Start actions', 'Scrollable content', 'Explicit header close']) {
      await userEvent.selectOptions(screen.getByLabelText('Dialog visual fixture'), name);
      await expect.element(report).toHaveAttribute('data-dialog-report-example', name);
      await expect.element(report).toHaveAttribute('data-dialog-report-state', 'ready');
      await expect.element(report).toHaveAttribute('data-dialog-report-phase', 'idle');
      await expect.element(report).toHaveAttribute('data-dialog-unexpected-count', '0');
      expect(report.element().getBoundingClientRect().height).toBe(height);
      expect(document.querySelector('dialog:modal, dialog:popover-open')).toBeNull();
    }
    await userEvent.click(screen.getByRole('button', { name: 'Inspect native dialog' }));
    const dialog = screen.getByRole('dialog', { name: 'Project access' });
    expect(requireDialog(dialog.element()).matches(':modal')).toBe(true);
    expect(dialog.element().getBoundingClientRect().width).toBe(600);
    await userEvent.click(screen.getByRole('button', { name: 'Close header' }));
    await expect.poll(() => dialog.query() === null).toBe(true);
    await expect.element(report).toHaveAttribute('data-dialog-report-phase', 'idle');
  } finally {
    await cleanup();
    await page.viewport(viewport.width, viewport.height);
  }
});

test('the default closed surface unmounts without a fake wrapper or backdrop DOM', async () => {
  const screen = await render(<NativeFixture />);
  expect(screen.getByTestId('native-dialog').query()).toBeNull();
  expect(screen.container.querySelector('.fui-Dialog, .fui-DialogTrigger')).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Native dialog trigger' }));
  const surface = screen.getByRole('dialog', { name: 'Native dialog' });
  const root = requireDialog(surface.element());
  expect(root.querySelector('.fui-DialogSurface__backdrop')).toBeNull();
  expect(
    root.parentElement?.contains(
      screen.getByRole('button', { name: 'Native dialog trigger' }).element(),
    ),
  ).toBe(true);
  expect(getComputedStyle(root).animationName).toBe('none');
  await userEvent.click(screen.getByRole('button', { name: 'Close native dialog' }));
  await expect.poll(() => surface.query() === null).toBe(true);
});

for (const modalType of ['modal', 'non-modal', 'alert'] as const) {
  test(`keep-mounted ${modalType} preserves native closed hiding through the first and later opens`, async () => {
    const screen = await render(<NativeFixture modalType={modalType} unmountOnClose={false} />);
    const surface = requireDialog(screen.getByTestId('native-dialog').element());
    expect(surface.open).toBe(false);
    expect(surface.matches(':popover-open')).toBe(false);
    expect(getComputedStyle(surface).display).toBe('none');
    expect(surface.getBoundingClientRect().width).toBe(0);
    const trigger = screen.getByRole('button', { name: 'Native dialog trigger' });
    await userEvent.click(trigger);
    expect(getComputedStyle(surface).display).toBe('grid');
    expect(surface.getBoundingClientRect().width).toBe(
      Math.min(600, surface.ownerDocument.documentElement.clientWidth),
    );
    expect(surface.matches(':modal')).toBe(modalType !== 'non-modal');
    expect(surface.matches(':popover-open')).toBe(modalType === 'non-modal');
    await userEvent.click(screen.getByRole('button', { name: 'Close native dialog' }));
    await expect.poll(() => getComputedStyle(surface).display).toBe('none');
    expect(surface.hasAttribute('data-open')).toBe(false);
    expect(surface.getBoundingClientRect().height).toBe(0);
    await expect.element(trigger).toHaveFocus();
    await userEvent.click(trigger);
    expect(getComputedStyle(surface).display).toBe('grid');
  });
}

for (const modalType of ['modal', 'alert'] as const) {
  test(`${modalType} uses showModal, native inertness, a trapped Tab sequence, and immediate restoration`, async () => {
    for (const primitive of [false, true]) {
      const changes = vi.fn<NonNullable<DialogProps['onOpenChange']>>();
      const screen = await render(
        <NativeFixture modalType={modalType} onOpenChange={changes} primitive={primitive} />,
      );
      const trigger = screen.getByRole('button', { name: 'Native dialog trigger' });
      const outside = requireHTML(
        screen.getByRole('button', { name: 'Outside native dialog' }).element(),
      );
      await userEvent.hover(screen.getByRole('button', { name: 'Before native dialog' }));
      await userEvent.click(trigger);
      const surface = screen.getByTestId('native-dialog');
      const root = requireDialog(surface.element());
      expect(root.open).toBe(true);
      expect(root.matches(':modal')).toBe(true);
      expect(root.getAttribute('aria-modal')).toBe('true');
      expect(root.getAttribute('role')).toBe(modalType === 'alert' ? 'alertdialog' : null);
      await expect
        .element(screen.getByRole('button', { name: 'First native action' }))
        .toHaveFocus();
      outside.focus();
      expect(document.activeElement === outside).toBe(false);
      await userEvent.keyboard('{Tab}');
      await expect
        .element(screen.getByRole('button', { name: 'Last native action' }))
        .toHaveFocus();
      await userEvent.keyboard('{Tab}');
      await expect
        .element(screen.getByRole('button', { name: 'Close native dialog' }))
        .toHaveFocus();
      await userEvent.keyboard('{Tab}');
      // Chromium can move focus to browser/iframe host UI, not an inert app control.
      // The pinned public primitive has the identical native boundary.
      expect(document.activeElement === document.body).toBe(true);
      expect(document.hasFocus()).toBe(false);
      outside.focus();
      expect(document.activeElement === outside).toBe(false);
      await userEvent.click(screen.getByRole('button', { name: 'First native action' }));
      await userEvent.keyboard('{Escape}');
      await expect.poll(() => surface.query() === null).toBe(true);
      await expect.element(trigger).toHaveFocus();
      expect(changes.mock.calls.map(([, data]) => [data.type, data.open])).toEqual([
        ['triggerClick', true],
        ['escapeKeyDown', false],
      ]);
      expect(changes.mock.calls.every(([event, data]) => event === data.event)).toBe(true);
      const closing = changes.mock.calls[1][1];
      if (closing.type !== 'escapeKeyDown') throw new Error('Expected native keyboard Escape');
      expect(closing.event.nativeEvent.isTrusted).toBe(true);
      await cleanup();
    }
  });
}

test('a trusted modal backdrop click closes, but a surface-padding click does not', async () => {
  const changes = vi.fn<NonNullable<DialogProps['onOpenChange']>>();
  const screen = await render(<NativeFixture onOpenChange={changes} />);
  const trigger = screen.getByRole('button', { name: 'Native dialog trigger' });
  await userEvent.click(trigger);
  const surface = screen.getByRole('dialog', { name: 'Native dialog' });
  await userEvent.click(surface, { position: { x: 3, y: 3 } });
  expect(requireDialog(surface.element()).open).toBe(true);
  expect(changes.mock.calls.length).toBe(1);
  // The native backdrop targets the dialog, including pointer coordinates just
  // above its rectangle. Keep x inside a narrow viewport where the dialog fills
  // its width. This is a trusted pointer action, not dispatchEvent.
  expect(surface.element().getBoundingClientRect().top).toBeGreaterThan(4);
  await userEvent.click(surface, { position: { x: 4, y: -4 } });
  await expect.poll(() => surface.query() === null).toBe(true);
  await expect.element(trigger).toHaveFocus();
  expect(changes.mock.calls.map(([, data]) => [data.type, data.open])).toEqual([
    ['triggerClick', true],
    ['backdropClick', false],
  ]);
  const closing = changes.mock.calls[1][1];
  if (closing.type !== 'backdropClick') throw new Error('Expected a real backdrop click');
  expect(closing.event.nativeEvent.isTrusted).toBe(true);
});

test('alert backdrop clicks remain open while the current Escape path remains dismissible', async () => {
  const changes = vi.fn<NonNullable<DialogProps['onOpenChange']>>();
  const screen = await render(<NativeFixture modalType="alert" onOpenChange={changes} />);
  await userEvent.click(screen.getByRole('button', { name: 'Native dialog trigger' }));
  const surface = screen.getByRole('alertdialog', { name: 'Native dialog' });
  await userEvent.click(surface, { position: { x: 4, y: -4 } });
  expect(requireDialog(surface.element()).open).toBe(true);
  expect(changes).toHaveBeenCalledTimes(1);
  requireHTML(screen.getByRole('button', { name: 'First native action' }).element()).focus();
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => surface.query() === null).toBe(true);
  expect(changes.mock.calls[1][1].type).toBe('escapeKeyDown');
});

test('non-modal manual popovers permit outside interaction and Tab escape without light dismissal', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <DialogControlledFlow modalType="non-modal" />
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Open project dialog' });
  await userEvent.click(trigger);
  const dialog = requireDialog(screen.getByTestId('project-dialog').element());
  expect(dialog.open).toBe(false);
  expect(dialog.matches(':popover-open')).toBe(true);
  expect(dialog.matches(':modal')).toBe(false);
  expect(dialog.getAttribute('popover')).toBe('manual');
  expect(dialog.getAttribute('aria-modal')).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Outside project action' }));
  await expect
    .element(screen.getByRole('status', { name: 'Outside project count' }))
    .toHaveTextContent('1');
  expect(dialog.matches(':popover-open')).toBe(true);
  requireHTML(screen.getByRole('button', { name: 'Close project dialog' }).element()).focus();
  await userEvent.keyboard('{Tab}');
  expect(dialog.contains(document.activeElement)).toBe(false);
  dialog.focus();
  await userEvent.keyboard('{Tab}');
  await expect.element(screen.getByRole('textbox', { name: 'Project note' })).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => dialog.matches(':popover-open')).toBe(false);
  await expect.element(trigger).toHaveFocus();
});

test('defaultOpen is uncontrolled and emits the same current close callback payload', async () => {
  const changes = vi.fn<NonNullable<DialogProps['onOpenChange']>>();
  const screen = await render(<NativeFixture defaultOpen onOpenChange={changes} />);
  const dialog = requireDialog(screen.getByTestId('native-dialog').element());
  expect(dialog.matches(':modal')).toBe(true);
  expect(changes).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Close native dialog' }));
  await expect.poll(() => screen.getByTestId('native-dialog').query() === null).toBe(true);
  expect(changes.mock.calls.map(([, data]) => [data.type, data.open])).toEqual([
    ['triggerClick', false],
  ]);
});

test('controlled open requests do not mutate the controlled value', async () => {
  const changes = vi.fn<NonNullable<DialogProps['onOpenChange']>>();
  const screen = await render(<NativeFixture open={false} onOpenChange={changes} />);
  await userEvent.click(screen.getByRole('button', { name: 'Native dialog trigger' }));
  expect(screen.getByTestId('native-dialog').query()).toBeNull();
  expect(changes.mock.calls.map(([, data]) => [data.type, data.open])).toEqual([
    ['triggerClick', true],
  ]);
  await screen.rerender(<NativeFixture open onOpenChange={changes} />);
  const dialog = requireDialog(screen.getByTestId('native-dialog').element());
  await userEvent.keyboard('{Escape}');
  expect(dialog.matches(':modal')).toBe(true);
  expect(changes.mock.calls[1][1].type).toBe('escapeKeyDown');
});

test('preventDefault vetoes uncontrolled Escape, backdrop and trigger close requests', async () => {
  const changes = vi.fn<NonNullable<DialogProps['onOpenChange']>>((event, data) => {
    if (!data.open) event.preventDefault();
  });
  const screen = await render(<NativeFixture onOpenChange={changes} />);
  await userEvent.click(screen.getByRole('button', { name: 'Native dialog trigger' }));
  const dialog = requireDialog(screen.getByTestId('native-dialog').element());
  await userEvent.keyboard('{Escape}');
  expect(dialog.matches(':modal')).toBe(true);
  await userEvent.click(dialog, { position: { x: 4, y: -4 } });
  expect(dialog.matches(':modal')).toBe(true);
  await userEvent.click(screen.getByRole('button', { name: 'Close native dialog' }));
  expect(dialog.matches(':modal')).toBe(true);
  expect(changes.mock.calls.map(([, data]) => [data.type, data.open])).toEqual([
    ['triggerClick', true],
    ['escapeKeyDown', false],
    ['backdropClick', false],
    ['triggerClick', false],
  ]);
});

test('consumer surface key and click handlers can prevent native dismissal requests', async () => {
  const changes = vi.fn<NonNullable<DialogProps['onOpenChange']>>();
  const keys = vi.fn<NonNullable<DialogSurfaceProps['onKeyDown']>>((event) => {
    if (event.key === 'Escape') event.preventDefault();
  });
  const clicks = vi.fn<NonNullable<DialogSurfaceProps['onClick']>>((event) => {
    event.preventDefault();
  });
  const screen = await render(
    <NativeFixture onOpenChange={changes} surfaceProps={{ onKeyDown: keys, onClick: clicks }} />,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Native dialog trigger' }));
  const root = requireDialog(screen.getByTestId('native-dialog').element());
  await userEvent.keyboard('{Escape}');
  await userEvent.click(root, { position: { x: 4, y: -4 } });
  expect(root.matches(':modal')).toBe(true);
  expect(keys.mock.calls.some(([event]) => event.key === 'Escape')).toBe(true);
  expect(clicks).toHaveBeenCalledTimes(1);
  expect(changes).toHaveBeenCalledTimes(1);
});

test('native requestClose dispatches cancel and the current hook prevents native auto-close', async () => {
  for (const primitive of [false, true]) {
    const changes = vi.fn<NonNullable<DialogProps['onOpenChange']>>();
    const cancels = vi.fn<NonNullable<DialogSurfaceProps['onCancel']>>();
    const screen = await render(
      <NativeFixture
        defaultOpen
        primitive={primitive}
        onOpenChange={changes}
        surfaceProps={{ onCancel: cancels }}
      />,
    );
    const root = requireDialog(screen.getByTestId('native-dialog').element());
    if (!('requestClose' in root) || typeof root.requestClose !== 'function') {
      throw new Error('Chromium must expose the current native dialog.requestClose API');
    }
    root.requestClose();
    expect(root.matches(':modal')).toBe(true);
    expect(root.open).toBe(true);
    expect(changes).not.toHaveBeenCalled();
    expect(cancels).toHaveBeenCalledTimes(1);
    const nativeCancel = cancels.mock.calls[0][0].nativeEvent;
    expect(nativeCancel.type).toBe('cancel');
    expect(nativeCancel.cancelable).toBe(true);
    expect(nativeCancel.defaultPrevented).toBe(true);
    await cleanup();
  }
});

test('consumer trigger handlers, explicit actions, refs and native submit types are retained', async () => {
  const triggerRef = React.createRef<HTMLButtonElement>();
  const prevented = vi.fn<React.MouseEventHandler<HTMLButtonElement>>((event) =>
    event.preventDefault(),
  );
  const changes = vi.fn<NonNullable<DialogProps['onOpenChange']>>();
  function Fixture({ prevent = false }: { prevent?: boolean }) {
    return (
      <CoreAIFluentProvider>
        <Dialog onOpenChange={changes}>
          <DialogTrigger>
            <button
              ref={triggerRef}
              type="button"
              onClick={prevent ? prevented : undefined}
              className="caller-trigger"
              data-trigger="kept"
            >
              Open explicit actions
            </button>
          </DialogTrigger>
          <DialogSurface aria-label="Explicit actions">
            <DialogHeader>
              <DialogTitle>Explicit actions</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <DialogTrigger action="open">
                <button type="button">Keep explicitly open</button>
              </DialogTrigger>
              <DialogTrigger action="close">
                <button type="button">Explicit close</button>
              </DialogTrigger>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </CoreAIFluentProvider>
    );
  }
  const screen = await render(<Fixture prevent />);
  const trigger = screen.getByRole('button', { name: 'Open explicit actions' });
  await userEvent.click(trigger);
  expect(changes).not.toHaveBeenCalled();
  expect(prevented).toHaveBeenCalledTimes(1);
  expect(triggerRef.current === trigger.element()).toBe(true);
  await expect.element(trigger).toHaveClass('caller-trigger');
  await expect.element(trigger).toHaveAttribute('data-trigger', 'kept');
  await expect.element(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  await screen.rerender(<Fixture />);
  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole('button', { name: 'Keep explicitly open' }));
  expect(
    requireDialog(screen.getByRole('dialog', { name: 'Explicit actions' }).element()).open,
  ).toBe(true);
  await userEvent.click(screen.getByRole('button', { name: 'Explicit close' }));
  await expect
    .poll(() => screen.getByRole('dialog', { name: 'Explicit actions' }).query() === null)
    .toBe(true);
  expect(changes.mock.calls.map(([, data]) => [data.type, data.open])).toEqual([
    ['triggerClick', true],
    ['triggerClick', true],
    ['triggerClick', false],
  ]);
});

test('controlled flow preserves form state while kept mounted and reports actual callback types', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <DialogControlledFlow />
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Open project dialog' });
  await userEvent.click(trigger);
  const note = screen.getByRole('textbox', { name: 'Project note' });
  await userEvent.clear(note);
  await userEvent.type(note, 'Preserved draft');
  await userEvent.click(screen.getByRole('button', { name: 'Close project dialog' }));
  await userEvent.click(trigger);
  await expect.element(note).toHaveValue('Preserved draft');
  await userEvent.keyboard('{Escape}');
  await expect
    .element(screen.getByRole('status', { name: 'Dialog event log' }))
    .toHaveTextContent(
      'triggerClick:true|triggerClick:false|triggerClick:true|escapeKeyDown:false',
    );
});

test('confirmation blocks the disabled action and closes only after a real reviewed choice', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <DialogConfirmationFlow />
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Review sharing' });
  await userEvent.click(trigger);
  await expect.element(screen.getByRole('button', { name: 'Confirm sharing' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Cancel sharing' }));
  await expect
    .element(screen.getByRole('status', { name: 'Sharing result' }))
    .toHaveTextContent('Not shared');
  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole('checkbox', { name: 'I reviewed access' }));
  await userEvent.click(screen.getByRole('button', { name: 'Confirm sharing' }));
  await expect
    .poll(() => screen.getByRole('dialog', { name: 'Share Atlas?' }).query() === null)
    .toBe(true);
  await expect
    .element(screen.getByRole('status', { name: 'Sharing result' }))
    .toHaveTextContent('Atlas shared');
  await expect.element(trigger).toHaveFocus();
});

test('controlled native form uses real SubmitEvent, FormData and the external submitter', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <DialogFormFlow />
    </CoreAIFluentProvider>,
  );
  const trigger = screen.getByRole('button', { name: 'Edit project' });
  await userEvent.click(trigger);
  const input = screen.getByRole('textbox', { name: 'Project name' });
  await userEvent.clear(input);
  await userEvent.type(input, 'Atlas v2');
  await userEvent.click(screen.getByRole('button', { name: 'Save project' }));
  await expect
    .poll(() => screen.getByRole('dialog', { name: 'Edit Atlas' }).query() === null)
    .toBe(true);
  await expect
    .element(screen.getByRole('status', { name: 'Project submission' }))
    .toHaveTextContent('{"project":"Atlas v2","intent":"save"}');
  await expect
    .element(screen.getByRole('status', { name: 'Project submitter' }))
    .toHaveTextContent('submit:intent:save');
  await expect.element(trigger).toHaveFocus();
});

test('required native controls prevent submission until valid without closing the surface', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <DialogFormFlow />
    </CoreAIFluentProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Edit project' }));
  const input = screen.getByRole('textbox', { name: 'Project name' });
  await userEvent.clear(input);
  await userEvent.click(screen.getByRole('button', { name: 'Save project' }));
  expect(requireDialog(screen.getByRole('dialog', { name: 'Edit Atlas' }).element()).open).toBe(
    true,
  );
  await expect
    .element(screen.getByRole('status', { name: 'Project submission' }))
    .toHaveTextContent('');
  const nativeInput = input.element();
  expect(nativeInput instanceof HTMLInputElement && nativeInput.validity.valueMissing).toBe(true);
});

test('native method=dialog keeps the current public close/state boundary rather than a wrapper shim', async () => {
  const changes = vi.fn<NonNullable<DialogProps['onOpenChange']>>();
  const closes = vi.fn<NonNullable<DialogSurfaceProps['onClose']>>();
  function StateProbe() {
    const context = useDialogContext();
    return <output aria-label="Method dialog context">{String(context.open)}</output>;
  }
  const screen = await render(
    <CoreAIFluentProvider>
      <Dialog defaultOpen unmountOnClose={false} onOpenChange={changes}>
        <DialogSurface aria-label="Native form close" onClose={closes}>
          <DialogHeader>
            <DialogTitle>Native form close</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <StateProbe />
            <form method="dialog">
              <button type="submit" value="saved">
                Native form done
              </button>
            </form>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </CoreAIFluentProvider>,
  );
  const root = requireDialog(screen.getByRole('dialog', { name: 'Native form close' }).element());
  await userEvent.click(screen.getByRole('button', { name: 'Native form done' }));
  await expect.poll(() => root.open).toBe(false);
  expect(root.returnValue).toBe('saved');
  expect(getComputedStyle(root).display).toBe('none');
  expect(root.querySelector('output')?.textContent).toBe('true');
  expect(changes).not.toHaveBeenCalled();
  await expect.poll(() => closes.mock.calls.length).toBe(1);
});

test('nested native dialogs restore into the still-modal parent and only the topmost Escape closes', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <DialogNestedFlow />
    </CoreAIFluentProvider>,
  );
  const outerTrigger = screen.getByRole('button', { name: 'Open outer dialog' });
  await userEvent.click(outerTrigger);
  const outer = requireDialog(
    screen.getByRole('dialog', { name: 'Outer project dialog' }).element(),
  );
  const innerTrigger = screen.getByRole('button', { name: 'Open inner dialog' });
  await userEvent.click(innerTrigger);
  const innerLocator = screen.getByRole('dialog', { name: 'Inner project dialog' });
  const inner = requireDialog(innerLocator.element());
  expect(outer.matches(':modal')).toBe(true);
  expect(inner.matches(':modal')).toBe(true);
  expect(outer.contains(inner)).toBe(true);
  expect(inner.hasAttribute('data-dialog-nested')).toBe(true);
  expect(getComputedStyle(inner, '::backdrop').backgroundColor).toBe('rgba(0, 0, 0, 0)');
  await expect
    .element(screen.getByRole('status', { name: 'Inner dialog context' }))
    .toHaveTextContent('true:modal:true:true');
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => innerLocator.query() === null).toBe(true);
  expect(outer.matches(':modal')).toBe(true);
  await expect.element(innerTrigger).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => outer.isConnected).toBe(false);
  await expect.element(outerTrigger).toHaveFocus();
});

test('a native Popover inside Dialog stays above it and Escape dismisses the popover first', async () => {
  const screen = await render(
    <CoreAIFluentProvider>
      <DialogNestedFlow />
    </CoreAIFluentProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Open outer dialog' }));
  const outer = requireDialog(
    screen.getByRole('dialog', { name: 'Outer project dialog' }).element(),
  );
  const helpTrigger = screen.getByRole('button', { name: 'Open project help' });
  await userEvent.click(helpTrigger);
  await expect.element(helpTrigger).toHaveAttribute('aria-expanded', 'true');
  const help = screen.getByRole('note', { name: 'Project help' });
  expect(help.element().matches(':popover-open')).toBe(true);
  expect(outer.contains(help.element())).toBe(true);
  await userEvent.click(screen.getByRole('button', { name: 'Close project help' }));
  await expect.poll(() => help.query() === null).toBe(true);
  expect(outer.matches(':modal')).toBe(true);
  await userEvent.click(helpTrigger);
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => help.query() === null).toBe(true);
  await expect.element(helpTrigger).toHaveAttribute('aria-expanded', 'false');
  expect(outer.matches(':modal')).toBe(true);
  await expect.element(helpTrigger).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  await expect.poll(() => outer.isConnected).toBe(false);
  await expect.element(screen.getByRole('button', { name: 'Open outer dialog' })).toHaveFocus();
});

test('current title association wins a caller id, while explicit names and descriptions remain consumer-owned', async () => {
  const titleRef = React.createRef<HTMLHeadingElement>();
  const surfaceRef = React.createRef<HTMLDialogElement>();
  const screen = await render(
    <CoreAIFluentProvider>
      <Dialog defaultOpen>
        <DialogSurface ref={surfaceRef} aria-describedby="explicit-dialog-description">
          <DialogHeader>
            <DialogTitle ref={titleRef} id="ignored-title-id">
              Accessible project
            </DialogTitle>
          </DialogHeader>
          <DialogBody id="explicit-dialog-description">
            A short project description.
            <DialogTrigger>
              <button type="button">Close accessible project</button>
            </DialogTrigger>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </CoreAIFluentProvider>,
  );
  const dialog = screen.getByRole('dialog', { name: 'Accessible project' });
  const title = screen.getByRole('heading', { name: 'Accessible project', level: 2 });
  expect(surfaceRef.current === dialog.element()).toBe(true);
  expect(titleRef.current === title.element()).toBe(true);
  expect(title.element().id).not.toBe('ignored-title-id');
  expect(dialog.element().getAttribute('aria-labelledby')).toBe(title.element().id);
  await expect
    .element(dialog)
    .toHaveAccessibleDescription('A short project description. Close accessible project');
  expect(dialog.element().querySelector('.fui-DialogContent')).toBeNull();
  await screen.rerender(
    <CoreAIFluentProvider>
      <Dialog defaultOpen>
        <DialogSurface aria-label="Explicit project name" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Not the accessible name</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <button type="button">Project action</button>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </CoreAIFluentProvider>,
  );
  const named = screen.getByRole('dialog', { name: 'Explicit project name' });
  await expect.element(named).not.toHaveAttribute('aria-labelledby');
  await expect.element(named).not.toHaveAttribute('aria-describedby');
});

type SurfaceRootProps = ExtractSlotProps<DialogSurfaceSlots['root']>;
type HeaderRootProps = ExtractSlotProps<DialogHeaderSlots['root']>;
type TitleRootProps = ExtractSlotProps<DialogTitleSlots['root']>;
type BodyRootProps = ExtractSlotProps<DialogBodySlots['root']>;
type ActionsRootProps = ExtractSlotProps<DialogActionsSlots['root']>;

test('typed native root renderers retain slot metadata, refs, caller classes, data and children', async () => {
  const refs = {
    surface: React.createRef<HTMLDialogElement>(),
    header: React.createRef<HTMLElement>(),
    title: React.createRef<HTMLHeadingElement>(),
    body: React.createRef<HTMLDivElement>(),
    actions: React.createRef<HTMLDivElement>(),
  };
  const captures: string[] = [];
  const renderSurface: SlotRenderFunction<SurfaceRootProps> = (Component, props) => {
    captures.push(props.className ?? '');
    return (
      <Component {...props} data-rendered-surface="">
        {props.children}
      </Component>
    );
  };
  const renderHeader: SlotRenderFunction<HeaderRootProps> = (Component, props) => (
    <Component {...props} data-rendered-header="">
      {props.children}
    </Component>
  );
  const renderTitle: SlotRenderFunction<TitleRootProps> = (Component, props) => (
    <Component {...props} data-rendered-title="">
      Rendered project title
    </Component>
  );
  const renderBody: SlotRenderFunction<BodyRootProps> = (Component, props) => (
    <Component {...props} data-rendered-body="">
      Rendered project content
    </Component>
  );
  const renderActions: SlotRenderFunction<ActionsRootProps> = (Component, props) => (
    <Component {...props} data-rendered-actions="">
      <DialogTrigger>
        <button type="button">Close rendered project</button>
      </DialogTrigger>
    </Component>
  );
  const surfaceProps: SurfaceRootProps & { 'data-consumer-surface': string } = {
    as: 'dialog',
    ref: refs.surface,
    className: 'caller-surface',
    'data-consumer-surface': 'kept',
    style: { padding: '7px', borderRadius: '5px' },
  };
  const renderHeaderWithTitle: SlotRenderFunction<HeaderRootProps> = (Component, props) =>
    renderHeader(Component, {
      ...props,
      children: (
        <DialogTitle ref={refs.title} className="caller-title">
          {renderTitle}
        </DialogTitle>
      ),
    });
  const renderSurfaceWithContent: SlotRenderFunction<SurfaceRootProps> = (Component, props) =>
    renderSurface(Component, {
      ...props,
      children: (
        <>
          <DialogHeader ref={refs.header} className="caller-header">
            {renderHeaderWithTitle}
          </DialogHeader>
          <DialogBody ref={refs.body} className="caller-body">
            {renderBody}
          </DialogBody>
          <DialogActions ref={refs.actions} className="caller-actions" position="start" fluid>
            {renderActions}
          </DialogActions>
        </>
      ),
    });
  const screen = await render(
    <CoreAIFluentProvider>
      <Dialog defaultOpen>
        <DialogSurface {...surfaceProps}>{renderSurfaceWithContent}</DialogSurface>
      </Dialog>
    </CoreAIFluentProvider>,
  );
  const surface = screen.getByRole('dialog', { name: 'Rendered project title' });
  const root = requireDialog(surface.element());
  expect(refs.surface.current === root).toBe(true);
  expect(refs.header.current === root.querySelector('[data-rendered-header]')).toBe(true);
  expect(refs.title.current === root.querySelector('[data-rendered-title]')).toBe(true);
  expect(refs.body.current === root.querySelector('[data-rendered-body]')).toBe(true);
  expect(refs.actions.current === root.querySelector('[data-rendered-actions]')).toBe(true);
  await expect.element(surface).toHaveClass('caller-surface', dialogSurfaceClassNames.root);
  await expect.element(surface).toHaveAttribute('data-consumer-surface', 'kept');
  await expect.element(surface).toHaveAttribute('data-rendered-surface', '');
  expect(getComputedStyle(root).paddingTop).toBe('7px');
  expect(getComputedStyle(root).borderRadius).toBe('5px');
  expect(refs.header.current?.classList.contains(dialogHeaderClassNames.root)).toBe(true);
  expect(refs.title.current?.classList.contains(dialogTitleClassNames.root)).toBe(true);
  expect(refs.body.current?.classList.contains(dialogBodyClassNames.root)).toBe(true);
  expect(refs.actions.current?.classList.contains(dialogActionsClassNames.root)).toBe(true);
  expect(refs.actions.current?.getAttribute('data-position')).toBe('start');
  expect(refs.actions.current?.hasAttribute('data-fluid')).toBe(true);
  expect(refs.actions.current?.hasAttribute('position')).toBe(false);
  expect(refs.actions.current?.hasAttribute('fluid')).toBe(false);
  expect(captures.some((className) => className.includes('caller-surface'))).toBe(true);
  await userEvent.click(screen.getByRole('button', { name: 'Close rendered project' }));
  await expect.poll(() => surface.query() === null).toBe(true);
  expect(refs.surface.current).toBeNull();
});

test('native surface inherits live theme variables without a Portal provider clone', async () => {
  const screen = await render(
    <CoreAIFluentProvider theme={coreaiLightTheme}>
      <Dialog defaultOpen>
        <DialogSurface aria-label="Themed native dialog">
          <DialogHeader>
            <DialogTitle>Themed project</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <button type="button">Themed action</button>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </CoreAIFluentProvider>,
  );
  const dialog = requireDialog(
    screen.getByRole('dialog', { name: 'Themed native dialog' }).element(),
  );
  const color = getComputedStyle(dialog).backgroundColor;
  expect(screen.container.contains(dialog)).toBe(true);
  const provider = dialog.closest('.fui-FluentProvider');
  expect(provider !== null).toBe(true);
  await screen.rerender(
    <CoreAIFluentProvider theme={coreaiDarkTheme}>
      <Dialog defaultOpen>
        <DialogSurface aria-label="Themed native dialog">
          <DialogHeader>
            <DialogTitle>Themed project</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <button type="button">Themed action</button>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </CoreAIFluentProvider>,
  );
  expect(dialog.isConnected).toBe(true);
  expect(getComputedStyle(dialog).backgroundColor).not.toBe(color);
  expect(dialog.closest('.fui-FluentProvider') === provider).toBe(true);
});

test('small and short viewports keep native sizing, responsive actions and accessible scrolling', async () => {
  const viewport = { width: innerWidth, height: innerHeight };
  try {
    for (const width of [375, 500, 599, 600, 601, 1024]) {
      await page.viewport(width, 640);
      for (const example of [dialogExamples[0], dialogExamples[1]]) {
        const { headless, differences } = await renderPair(example);
        expect(
          differences.filter((difference) => difference.kind === 'unexpected'),
          JSON.stringify(differences),
        ).toEqual([]);
        expect(document.documentElement.clientWidth).toBe(width);
        const expectedWidth = Math.min(600, width);
        const rect = headless.getBoundingClientRect();
        expect(rect.width).toBe(expectedWidth);
        expect(getComputedStyle(headless).width).toBe(`${expectedWidth}px`);
        expect(rect.left).toBe((width - expectedWidth) / 2);
        expect(rect.right).toBe((width + expectedWidth) / 2);
        const actions = headless.querySelector<HTMLElement>('[data-dialog-actions]');
        if (!actions) throw new Error('Missing responsive actions');
        expect(getComputedStyle(actions).flexDirection).toBe(width <= 480 ? 'column' : 'row');
        expect(getComputedStyle(actions).gridRowStart).toBe(width <= 480 ? '4' : '3');
        await cleanup();
      }
    }
    await page.viewport(720, 320);
    const { headless: short } = await renderPair(
      { name: 'Short scrolling surface', longContent: true },
      coreaiLightTheme,
      false,
    );
    expect(short.getBoundingClientRect().height).toBeLessThanOrEqual(320);
    expect(getComputedStyle(short).overflowY).toBe('auto');
    expect(short.scrollHeight).toBeGreaterThan(short.clientHeight);
    const body = short.querySelector<HTMLElement>('[data-dialog-content]');
    if (!body) throw new Error('Missing short-screen body');
    expect(getComputedStyle(body).overflowY).toBe('visible');
    const close = short.querySelector<HTMLElement>('[data-dialog-actions] button');
    if (!close) throw new Error('Missing action reachable by native scroll');
    close.focus();
    expect(document.activeElement === close).toBe(true);
  } finally {
    await cleanup();
    await page.viewport(viewport.width, viewport.height);
  }
});
