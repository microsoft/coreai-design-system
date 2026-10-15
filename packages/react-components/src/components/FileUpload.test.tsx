// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-react';
import { renderCoreAIComponent } from '../test-utils.js';
import { FileUpload } from './FileUpload.js';

afterEach(async () => {
  vi.restoreAllMocks();
  await cleanup();
});

test('passes accepted files to onDropAccepted', async () => {
  const onDropAccepted = vi.fn();
  const screen = await renderCoreAIComponent(
    <FileUpload
      accept={{ 'text/plain': ['.txt'] }}
      ariaLabel="Upload a text file"
      onDropAccepted={onDropAccepted}
    >
      Drop a text file
    </FileUpload>,
  );
  const input = screen.getByText('Drop a text file').element().querySelector('input');
  const file = new File(['Hello from CoreAI'], 'notes.txt', { type: 'text/plain' });

  expect(input).not.toBeNull();
  await userEvent.upload(input!, file);

  expect(onDropAccepted).toHaveBeenCalledOnce();
  expect(onDropAccepted).toHaveBeenCalledWith(
    [
      expect.objectContaining({
        name: 'notes.txt',
        size: file.size,
        type: 'text/plain',
      }),
    ],
    expect.anything(),
  );
});

test('passes rejected files to onDropRejected', async () => {
  const onDropRejected = vi.fn();
  const screen = await renderCoreAIComponent(
    <FileUpload ariaLabel="Upload a small file" maxSize={4} onDropRejected={onDropRejected}>
      Drop a small file
    </FileUpload>,
  );
  const input = screen.getByText('Drop a small file').element().querySelector('input');
  const file = new File(['too large'], 'large.txt', { type: 'text/plain' });

  expect(input).not.toBeNull();
  await userEvent.upload(input!, file);

  expect(onDropRejected).toHaveBeenCalledOnce();
  expect(onDropRejected).toHaveBeenCalledWith(
    [
      expect.objectContaining({
        file: expect.objectContaining({
          name: 'large.txt',
          size: file.size,
          type: 'text/plain',
        }),
        errors: expect.arrayContaining([expect.objectContaining({ code: 'file-too-large' })]),
      }),
    ],
    expect.anything(),
  );
});

test('receives focus and opens the file picker with the keyboard', async () => {
  const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
  const screen = await renderCoreAIComponent(
    <>
      <button type="button">Before upload</button>
      <FileUpload ariaLabel="Upload documents">Drop documents</FileUpload>
    </>,
  );
  const uploadButton = screen.getByText('Drop documents');

  screen.getByRole('button', { name: 'Before upload' }).element().focus();
  await userEvent.tab();

  await expect.element(uploadButton).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(inputClick).toHaveBeenCalledOnce();
});

test('forwards its ref to the drop-zone root', async () => {
  const ref = React.createRef<HTMLDivElement>();
  const screen = await renderCoreAIComponent(
    <FileUpload ariaLabel="Upload documents" ref={ref}>
      Drop documents
    </FileUpload>,
  );

  expect(ref.current).toBe(screen.getByText('Drop documents').element());
  expect(ref.current).toHaveClass('fui-FileUpload');
});

test('associates instructions with the drop zone and file input', async () => {
  const screen = await renderCoreAIComponent(
    <FileUpload ariaDescribedBy="upload-instructions" ariaLabel="Upload a PDF file">
      <span id="upload-instructions">PDF files up to 5 MB</span>
    </FileUpload>,
  );
  const root = screen.getByText('PDF files up to 5 MB').element().closest('.fui-FileUpload');
  const input = root?.querySelector('input');

  expect(root).toHaveAttribute('aria-describedby', 'upload-instructions');
  expect(input).toHaveAttribute('aria-describedby', 'upload-instructions');
});
