// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import {
  FileUploadComparison,
  fileUploadExamples,
  fileUploadConsumerExample,
} from '../../../apps/storybook/src/stories/experiments/FileUploadComparison.js';
import {
  captureFileUploadStyles,
  compareFileUploadStyles,
  getComparisonFileUpload,
} from '../../../apps/storybook/src/stories/experiments/compareFileUploadStyles.js';
import { ComparisonProvider } from '../../../apps/storybook/src/stories/experiments/ComparisonProvider.js';
import { CoreAIFluentProvider } from './CoreAIFluentProvider.js';
import { coreaiDarkTheme, coreaiLightTheme } from './theme.js';
import { FileUpload } from './FileUpload.js';

afterEach(async () => {
  vi.restoreAllMocks();
  await cleanup();
});

function getInput(root: Element): HTMLInputElement {
  const input = root.querySelector('input');
  if (!(input instanceof HTMLInputElement)) throw new Error('Missing native file input');
  return input;
}

function getUploadRoot(): HTMLDivElement {
  const root = document.querySelector('.fui-FileUpload');
  if (!(root instanceof HTMLDivElement)) throw new Error('Missing native drop-zone root');
  expect(root.getAttribute('role')).toBe('button');
  return root;
}

for (const [mode, theme] of [
  ['light', coreaiLightTheme],
  ['dark', coreaiDarkTheme],
] as const) {
  for (const dir of ['ltr', 'rtl'] as const) {
    test.each(fileUploadExamples)(`matches $name in ${mode}, ${dir}`, async (example) => {
      const screen = await render(
        <ComparisonProvider theme={theme} dir={dir}>
          <FileUploadComparison examples={[example]} />
        </ComparisonProvider>,
      );
      await userEvent.hover(screen.getByTestId('upload-pointer-parking'));
      const legacy = getComparisonFileUpload(document, 'legacy');
      const headless = getComparisonFileUpload(document, 'headless');
      expect(
        compareFileUploadStyles(captureFileUploadStyles(legacy), captureFileUploadStyles(headless)),
      ).toEqual([]);
      if (!example.props.disabled) {
        await userEvent.hover(legacy);
        const hovered = captureFileUploadStyles(legacy);
        await userEvent.hover(headless);
        expect(compareFileUploadStyles(hovered, captureFileUploadStyles(headless))).toEqual([]);
      }
    });
  }
}

test('preserves accepted files, general and accepted callbacks, and native input options', async () => {
  const onDrop = vi.fn();
  const onDropAccepted = vi.fn();
  await render(
    <CoreAIFluentProvider>
      <FileUpload
        ariaLabel="Upload text"
        accept={{ 'text/plain': ['.txt'] }}
        multiple={false}
        onDrop={onDrop}
        onDropAccepted={onDropAccepted}
      >
        Upload
      </FileUpload>
    </CoreAIFluentProvider>,
  );
  const root = getUploadRoot();
  expect(root.getAttribute('aria-label')).toBe('Upload text');
  const input = getInput(root);
  expect(input.type).toBe('file');
  expect(input.accept).toBe('text/plain,.txt');
  expect(input.multiple).toBe(false);
  const file = new File(['Hello'], 'notes.txt', { type: 'text/plain' });
  await userEvent.upload(input, file);
  await expect.poll(() => onDropAccepted.mock.calls.length).toBe(1);
  expect(onDropAccepted).toHaveBeenCalledWith(
    [expect.objectContaining({ name: 'notes.txt' })],
    expect.anything(),
  );
  expect(onDrop).toHaveBeenCalledWith(
    [expect.objectContaining({ name: 'notes.txt' })],
    [],
    expect.anything(),
  );
});

for (const [name, options, file, code] of [
  [
    'large',
    { maxSize: 4 },
    new File(['too large'], 'large.txt', { type: 'text/plain' }),
    'file-too-large',
  ],
  [
    'small',
    { minSize: 10 },
    new File(['tiny'], 'small.txt', { type: 'text/plain' }),
    'file-too-small',
  ],
  [
    'custom validation',
    { validator: () => ({ code: 'blocked-name', message: 'File name blocked' }) },
    new File(['data'], 'blocked.txt'),
    'blocked-name',
  ],
] as const) {
  test(`preserves ${name} rejection details`, async () => {
    const onDropRejected = vi.fn();
    await render(
      <CoreAIFluentProvider>
        <FileUpload {...options} ariaLabel="Validated upload" onDropRejected={onDropRejected}>
          Upload
        </FileUpload>
      </CoreAIFluentProvider>,
    );
    await userEvent.upload(getInput(getUploadRoot()), file);
    await expect.poll(() => onDropRejected.mock.calls.length).toBe(1);
    expect(onDropRejected).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          file: expect.objectContaining({ name: file.name }),
          errors: expect.arrayContaining([expect.objectContaining({ code })]),
        }),
      ],
      expect.anything(),
    );
  });
}

test('keeps keyboard activation, current native refs and accessible descriptions', async () => {
  const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
  const ref = React.createRef<HTMLDivElement>();
  const screen = await render(
    <CoreAIFluentProvider>
      <button type="button">Before upload</button>
      <FileUpload
        ref={ref}
        ariaLabel="Upload documents"
        ariaDescribedBy="upload-hint"
        className="consumer-marker"
      >
        <span id="upload-hint">PDF files up to 5 MB</span>
      </FileUpload>
    </CoreAIFluentProvider>,
  );
  const root = getUploadRoot();
  expect(ref.current).toBe(root);
  expect(root.getAttribute('aria-label')).toBe('Upload documents');
  expect(root.classList.contains('consumer-marker')).toBe(true);
  expect(root.getAttribute('aria-describedby')).toBe('upload-hint');
  expect(getInput(root).getAttribute('aria-describedby')).toBe('upload-hint');
  expect(getInput(root).classList.contains('fui-FileUpload__input')).toBe(true);
  screen.getByRole('button', { name: 'Before upload' }).element().focus();
  await userEvent.tab();
  await expect.element(root).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(inputClick).toHaveBeenCalledOnce();
  await userEvent.keyboard(' ');
  expect(inputClick).toHaveBeenCalledTimes(2);
});

test('keeps disabled uploads out of the Tab order and blocks drops and picker activation', async () => {
  const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
  const onDrop = vi.fn();
  await render(
    <CoreAIFluentProvider>
      <FileUpload ariaLabel="Disabled upload" disabled onDrop={onDrop}>
        Unavailable
      </FileUpload>
    </CoreAIFluentProvider>,
  );
  const root = getUploadRoot();
  expect(root.getAttribute('aria-label')).toBe('Disabled upload');
  expect(root.getAttribute('aria-disabled')).toBe('true');
  expect(root.tabIndex).toBe(-1);
  root.click();
  const transfer = new DataTransfer();
  transfer.items.add(new File(['file'], 'notes.txt'));
  root.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer }));
  expect(inputClick).not.toHaveBeenCalled();
  expect(onDrop).not.toHaveBeenCalled();
});

test('publishes live drag render state and accepts real dropped files without the old provider', async () => {
  const onDropAccepted = vi.fn();
  await render(
    <CoreAIFluentProvider>
      <FileUpload
        ariaLabel="Drag upload"
        accept={{ 'text/plain': ['.txt'] }}
        onDropAccepted={onDropAccepted}
      >
        {({ isDragActive, isDragAccept, isDragReject }) =>
          `${isDragActive}/${isDragAccept}/${isDragReject}`
        }
      </FileUpload>
    </CoreAIFluentProvider>,
  );
  const root = getUploadRoot();
  expect(root.getAttribute('aria-label')).toBe('Drag upload');
  const transfer = new DataTransfer();
  transfer.items.add(new File(['Hello'], 'drag.txt', { type: 'text/plain' }));
  root.dispatchEvent(new DragEvent('dragenter', { bubbles: true, dataTransfer: transfer }));
  await expect.element(root).toHaveTextContent('true/true/false');
  expect(root.hasAttribute('data-drag-active')).toBe(true);
  root.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer }));
  await expect.poll(() => onDropAccepted.mock.calls.length).toBe(1);
  await expect.element(root).toHaveTextContent('false/false/false');
  expect(onDropAccepted).toHaveBeenCalledWith(
    [expect.objectContaining({ name: 'drag.txt' })],
    expect.anything(),
  );
});

test('ordinary consumer CSS outranks the component layer', async () => {
  await render(
    <CoreAIFluentProvider>
      <FileUploadComparison examples={[fileUploadConsumerExample]} />
    </CoreAIFluentProvider>,
  );
  const computed = getComputedStyle(getComparisonFileUpload(document, 'headless'));
  expect(computed.minHeight).toBe('144px');
  expect(computed.borderRadius).toBe('3px');
  expect(computed.backgroundColor).toBe('rgb(235, 240, 245)');
  expect(computed.color).toBe('rgb(20, 30, 40)');
});
