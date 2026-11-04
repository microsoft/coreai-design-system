// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Styled drag-and-drop / browse surface powered by react-dropzone.
 *
 * The root owns pointer and keyboard activation. Keep children presentational;
 * use useDropzone directly when the drop zone needs nested interactive
 * controls or custom activation behavior.
 */
import * as React from 'react';
import { useMergedRefs, type RefAttributes } from '@fluentui/react-utilities';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import styles from './FileUpload.module.css';

export interface FileUploadState {
  isDragActive: boolean;
  isDragAccept: boolean;
  isDragReject: boolean;
  open: () => void;
}

export type FileUploadProps = Pick<
  DropzoneOptions,
  | 'accept'
  | 'disabled'
  | 'maxFiles'
  | 'maxSize'
  | 'minSize'
  | 'multiple'
  | 'validator'
  | 'onDrop'
  | 'onDropAccepted'
  | 'onDropRejected'
> & {
  /**
   * Presentational content shown inside the drop zone, optionally based on its
   * current drag state. Do not include interactive controls such as buttons or
   * links because the root is already interactive.
   */
  children: React.ReactNode | ((state: FileUploadState) => React.ReactNode);
  className?: string;
  /** Localized accessible name for the drop zone and its file input. */
  ariaLabel: string;
  /** IDs of elements that describe the drop zone and its file input. */
  ariaDescribedBy?: string;
};

export const fileUploadClassNames = {
  root: 'fui-FileUpload',
  input: 'fui-FileUpload__input',
} as const;

export const FileUpload: React.NamedExoticComponent<
  FileUploadProps & RefAttributes<HTMLDivElement>
> = React.forwardRef<HTMLDivElement, FileUploadProps>(function FileUpload(
  { children, className, ariaLabel, ariaDescribedBy, disabled, ...dropzoneOptions },
  ref,
) {
  const { getRootProps, getInputProps, rootRef, isDragActive, isDragAccept, isDragReject, open } =
    useDropzone({ ...dropzoneOptions, disabled });
  const mergedRef = useMergedRefs<HTMLElement>(rootRef, ref);
  const state: FileUploadState = { isDragActive, isDragAccept, isDragReject, open };
  const content = typeof children === 'function' ? children(state) : children;
  const rootProps = getRootProps({
    'aria-disabled': disabled || undefined,
    'aria-describedby': ariaDescribedBy,
    'aria-label': ariaLabel,
    className: [fileUploadClassNames.root, styles.FileUpload, className].filter(Boolean).join(' '),
    role: 'button',
    'data-disabled': disabled ? '' : undefined,
    'data-drag-active': isDragActive ? '' : undefined,
    'data-drag-accept': isDragAccept ? '' : undefined,
    'data-drag-reject': isDragReject ? '' : undefined,
  });
  return (
    <div {...rootProps} ref={mergedRef}>
      <input
        {...getInputProps({
          'aria-label': ariaLabel,
          className: fileUploadClassNames.input,
        })}
        aria-describedby={ariaDescribedBy}
      />
      {content}
    </div>
  );
});

FileUpload.displayName = 'FileUpload';
