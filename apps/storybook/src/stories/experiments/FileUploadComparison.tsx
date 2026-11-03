// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { FileUpload as LegacyFileUpload } from '@coreai-ds/react-components';
import {
  FileUpload as HeadlessFileUpload,
  type FileUploadProps,
} from '@coreai-ds/react-headless-components';
import styles from './FileUploadComparison.module.css';

export interface FileUploadExample {
  name: string;
  props: FileUploadProps;
}

export const fileUploadExamples: FileUploadExample[] = [
  { name: 'Default', props: { ariaLabel: 'Upload documents', children: 'Drop files or browse' } },
  {
    name: 'Disabled',
    props: { ariaLabel: 'Disabled upload', disabled: true, children: 'Upload unavailable' },
  },
  {
    name: 'Text files',
    props: {
      ariaLabel: 'Upload text',
      accept: { 'text/plain': ['.txt'] },
      multiple: false,
      children: 'One text file',
    },
  },
  {
    name: 'Render-function state',
    props: {
      ariaLabel: 'Upload with status',
      children: ({ isDragActive, isDragAccept, isDragReject }) =>
        isDragReject
          ? 'File rejected'
          : isDragAccept
            ? 'File accepted'
            : isDragActive
              ? 'Drop here'
              : 'Browse',
    },
  },
  {
    name: 'Rich presentational content',
    props: {
      ariaLabel: 'Upload images',
      children: (
        <>
          <strong>Upload images</strong>
          <span>PNG or JPEG, up to 5 MB</span>
        </>
      ),
    },
  },
];

export const fileUploadConsumerExample: FileUploadExample = {
  name: 'Consumer CSS Modules',
  props: { ariaLabel: 'Custom upload', children: 'Consumer styles', className: styles.consumer },
};

export function FileUploadComparison({
  examples = fileUploadExamples,
}: {
  examples?: readonly FileUploadExample[];
}): React.ReactElement {
  return (
    <div className={styles.examples}>
      <div className={styles.parking} data-testid="upload-pointer-parking" aria-hidden />
      <div className={styles.row}>
        <strong>Case</strong>
        <strong>Current CoreAI / Griffel</strong>
        <strong>CSS Modules</strong>
      </div>
      {examples.map(({ name, props }) => (
        <div className={styles.row} data-fileupload-case={name} key={name}>
          <span>{name}</span>
          <div data-implementation="legacy">
            <LegacyFileUpload {...props} />
          </div>
          <div data-implementation="headless">
            <HeadlessFileUpload {...props} />
          </div>
        </div>
      ))}
    </div>
  );
}
