// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * Styled drag-and-drop / browse surface powered by react-dropzone.
 *
 * The root owns pointer and keyboard activation. Keep children presentational;
 * use `useDropzone` directly when the drop zone needs nested interactive
 * controls or custom activation behavior.
 */
import * as React from 'react';
import { makeStyles, mergeClasses, tokens, useMergedRefs } from '@fluentui/react-components';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';

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

const useStyles = makeStyles({
  dropZone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalXS,
    boxSizing: 'border-box',
    minHeight: '120px',
    padding: tokens.spacingVerticalL,
    borderRadius: tokens.borderRadiusXLarge,
    border: `${tokens.strokeWidthThin} dashed ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground3,
    outlineStyle: 'none',

    ':focus-visible': {
      border: `${tokens.strokeWidthThin} solid ${tokens.colorStrokeFocus2}`,
    },
  },
  dragActive: {
    border: `${tokens.strokeWidthThin} solid ${tokens.colorBrandStroke1}`,
    backgroundColor: tokens.colorBrandBackground2,
  },
  interactive: {
    cursor: 'pointer',

    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
    ':active': {
      backgroundColor: tokens.colorNeutralBackground3Pressed,
    },
  },
  disabled: {
    cursor: 'not-allowed',
    border: `${tokens.strokeWidthThin} dashed ${tokens.colorNeutralStrokeDisabled}`,
    backgroundColor: tokens.colorNeutralBackgroundDisabled,
    color: tokens.colorNeutralForegroundDisabled,
  },
});

export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({ children, className, ariaLabel, ariaDescribedBy, disabled, ...dropzoneOptions }, ref) => {
    const styles = useStyles();
    const { getRootProps, getInputProps, rootRef, isDragActive, isDragAccept, isDragReject, open } =
      useDropzone({
        ...dropzoneOptions,
        disabled,
      });

    const state: FileUploadState = {
      isDragActive,
      isDragAccept,
      isDragReject,
      open,
    };
    const content = typeof children === 'function' ? children(state) : children;
    const rootProps = getRootProps({
      'aria-disabled': disabled || undefined,
      'aria-describedby': ariaDescribedBy,
      'aria-label': ariaLabel,
      className: mergeClasses(
        'fui-FileUpload',
        styles.dropZone,
        !disabled && styles.interactive,
        isDragActive && styles.dragActive,
        disabled && styles.disabled,
        className,
      ),
      role: 'button',
    });
    const mergedRef = useMergedRefs(rootRef as React.Ref<HTMLDivElement>, ref);

    return (
      <div {...rootProps} ref={mergedRef}>
        <input
          {...getInputProps({
            'aria-label': ariaLabel,
            className: 'fui-FileUpload__input',
          })}
          aria-describedby={ariaDescribedBy}
        />
        {content}
      </div>
    );
  },
);

FileUpload.displayName = 'FileUpload';
