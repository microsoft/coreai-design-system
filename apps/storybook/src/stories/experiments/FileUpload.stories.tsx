// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { FileUpload } from '@coreai-ds/react-headless-components';
import { withHeadlessProvider } from './ComparisonProvider.js';
import { FileUploadComparison, fileUploadConsumerExample } from './FileUploadComparison.js';
import {
  captureFileUploadStyles,
  compareFileUploadStyles,
  getComparisonFileUpload,
} from './compareFileUploadStyles.js';

function Comparison(): React.ReactElement {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [report, setReport] = React.useState<string | null>(null);
  const compare = () => {
    const root = rootRef.current;
    if (!root) throw new Error('FileUpload comparison has not mounted');
    const differences = [...root.querySelectorAll<HTMLElement>('[data-fileupload-case]')].flatMap(
      (row) =>
        compareFileUploadStyles(
          captureFileUploadStyles(getComparisonFileUpload(row, 'legacy')),
          captureFileUploadStyles(getComparisonFileUpload(row, 'headless')),
        ).map((difference) => ({ example: row.dataset.fileuploadCase, ...difference })),
    );
    setReport(
      differences.length
        ? JSON.stringify(differences, null, 2)
        : 'No differences in the selected properties.',
    );
  };
  return (
    <div ref={rootRef}>
      <p>
        Both implementations use react-dropzone's native file selection and drag/drop behavior. The
        root owns activation; children remain presentational.
      </p>
      <button type="button" onClick={compare}>
        Compare upload styles
      </button>
      <output aria-label="Upload style comparison">{report ?? 'Comparison not run.'}</output>
      <FileUploadComparison />
    </div>
  );
}

const meta = {
  title: 'Experiments/Headless FileUpload',
  component: FileUpload,
  args: { ariaLabel: 'Upload files', children: 'Drop files or browse' },
  decorators: [withHeadlessProvider],
  parameters: { throwPlayFunctionExceptions: true },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComparisonWithReport: Story = {
  render: () => <Comparison />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Compare upload styles' }));
    await waitFor(() =>
      expect(canvas.getByRole('status', { name: 'Upload style comparison' })).toHaveTextContent(
        'No differences in the selected properties.',
      ),
    );
  },
};

export const ConsumerOverrides: Story = {
  render: () => (
    <>
      <p>
        Intentional difference: ordinary consumer CSS takes priority over layered component styles.
      </p>
      <FileUploadComparison examples={[fileUploadConsumerExample]} />
    </>
  ),
};

export const NativeUpload: Story = {
  render: function NativeUpload() {
    const [names, setNames] = React.useState<string[]>([]);
    return (
      <>
        <FileUpload
          ariaLabel="Upload text documents"
          accept={{ 'text/plain': ['.txt'] }}
          onDropAccepted={(files) => setNames(files.map((file) => file.name))}
          onDropRejected={(files) =>
            setNames(files.flatMap(({ errors }) => errors.map(({ message }) => message)))
          }
        >
          {({ isDragActive }) =>
            isDragActive ? 'Drop text documents here' : 'Drop or browse text documents'
          }
        </FileUpload>
        <output aria-label="Upload result">{names.join(', ')}</output>
      </>
    );
  },
};
