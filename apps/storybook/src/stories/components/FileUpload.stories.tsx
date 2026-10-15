// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { StoryObj } from '@storybook/react-vite';
import {
  ArrowClockwise20Regular,
  Delete20Regular,
  DocumentArrowUp24Regular,
} from '@fluentui/react-icons';
import {
  Badge,
  Button,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  FileUpload,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  TableCellLayout,
  Text,
} from '@coreai-ds/react-components';

// ---------- Shared Default layout ----------

/** Basic drop-and-browse picker with validation and observable selection. */
export const Default: StoryObj = {
  render: () => {
    const maxFileSize = 5 * 1024 * 1024;
    const acceptedFileTypes = {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    };
    const instructionsId = React.useId();
    const errorId = React.useId();
    const [names, setNames] = React.useState<string[]>([]);
    const [error, setError] = React.useState<string>();
    const styles = /* css */ `
      .file-upload-default-example {
        display: flex;
        flex-direction: column;
        max-width: 720px;
        padding: var(--spacingHorizontalL);
        row-gap: var(--spacingVerticalL);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="file-upload-default-example">
          {error ? (
            <MessageBar id={errorId} intent="error">
              <MessageBarBody>
                <MessageBarTitle>Unable to add file</MessageBarTitle>
                {error}
              </MessageBarBody>
            </MessageBar>
          ) : null}
          <FileUpload
            accept={acceptedFileTypes}
            ariaDescribedBy={error ? `${instructionsId} ${errorId}` : instructionsId}
            ariaLabel="Choose files"
            maxSize={maxFileSize}
            minSize={1}
            onDropAccepted={(added) => {
              setError(undefined);
              setNames(added.map((file) => file.name));
            }}
            onDropRejected={(rejections) =>
              setError(
                rejections
                  .map(
                    ({ file, errors }) =>
                      `${file.name}: ${errors.map(({ message }) => message).join(', ')}`,
                  )
                  .join('; '),
              )
            }
          >
            {({ isDragActive, isDragAccept, isDragReject }) => (
              <>
                <Text preset="body">
                  {isDragReject
                    ? 'This file is not supported'
                    : isDragAccept
                      ? 'Drop to add the file'
                      : isDragActive
                        ? 'Checking file…'
                        : 'Drag files here or click to browse'}
                </Text>
                <Text id={instructionsId} foreground={3} preset="bodyS">
                  PDF, TXT, PNG, or JPEG · Max 5 MB
                </Text>
              </>
            )}
          </FileUpload>
          {names.length > 0 ? <Text preset="bodyS">Selected: {names.join(', ')}</Text> : null}
        </div>
      </>
    );
  },
};

/** Disabled drop zone with no pointer or keyboard activation. */
export const Disabled: StoryObj = {
  render: () => {
    const instructionsId = React.useId();
    const styles = /* css */ `
      .file-upload-disabled-example {
        display: flex;
        flex-direction: column;
        max-width: 720px;
        padding: var(--spacingHorizontalL);
        row-gap: var(--spacingVerticalL);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <FileUpload
          className="file-upload-disabled-example"
          ariaDescribedBy={instructionsId}
          ariaLabel="File upload unavailable"
          disabled
        >
          <Text foreground="disabled" preset="body">
            File upload is unavailable
          </Text>
          <Text id={instructionsId} foreground="disabled" preset="bodyS">
            Contact your administrator for access.
          </Text>
        </FileUpload>
      </>
    );
  },
};

// ---------- With File Grid ----------

/**
 * Composes `FileUpload` with an application-owned `DataGrid`. This story owns
 * its file model, status transitions, retry, and delete behavior.
 */
export const WithFileGrid: StoryObj = {
  render: () => {
    type UploadStatus = 'pending' | 'uploading' | 'uploaded' | 'failed';
    interface UploadItem {
      id: string;
      name: string;
      size: number;
      status: UploadStatus;
    }

    const maxFileSize = 5 * 1024 * 1024;
    const acceptedFileTypes = {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    };
    const initialFiles: UploadItem[] = [
      {
        id: 'product-guide.pdf',
        name: 'product-guide.pdf',
        size: 1_842_176,
        status: 'uploaded',
      },
    ];

    const createUploadItem = (file: File): UploadItem => ({
      id: `${file.name}-${file.lastModified}-${file.size}`,
      name: file.name,
      size: file.size,
      status: 'pending',
    });
    const formatFileSize = (bytes: number): string => {
      const megabytes = bytes / (1024 * 1024);
      return `${megabytes.toLocaleString(undefined, { maximumFractionDigits: 2 })} MB`;
    };

    const instructionsId = React.useId();
    const errorId = React.useId();
    const [files, setFiles] = React.useState<UploadItem[]>(initialFiles);
    const [error, setError] = React.useState<string>();

    const handleRetry = (file: UploadItem) => {
      setFiles((prev) =>
        prev.map((item) => (item.id === file.id ? { ...item, status: 'uploading' } : item)),
      );
      window.setTimeout(() => {
        setFiles((prev) =>
          prev.map((item) => (item.id === file.id ? { ...item, status: 'uploaded' } : item)),
        );
      }, 800);
    };

    const handleDelete = (file: UploadItem) => {
      setFiles((prev) => prev.filter((item) => item.id !== file.id));
    };

    const renderUploadStatus = (status: UploadStatus): React.ReactNode => {
      if (status === 'uploading') {
        return <Spinner as="span" label="Uploading" labelPosition="after" size="tiny" />;
      }
      if (status === 'uploaded') {
        return (
          <Badge appearance="tint" color="success">
            Uploaded
          </Badge>
        );
      }
      if (status === 'failed') {
        return (
          <Badge appearance="tint" color="danger">
            Failed
          </Badge>
        );
      }
      return 'Pending';
    };

    const columns = [
      {
        columnId: 'name',
        compare: (a: UploadItem, b: UploadItem) => a.name.localeCompare(b.name),
        renderHeaderCell: () => 'Name',
        renderCell: (item: UploadItem) => <TableCellLayout truncate>{item.name}</TableCellLayout>,
      },
      {
        columnId: 'size',
        compare: (a: UploadItem, b: UploadItem) => a.size - b.size,
        renderHeaderCell: () => 'Size',
        renderCell: (item: UploadItem) => (
          <TableCellLayout>{formatFileSize(item.size)}</TableCellLayout>
        ),
      },
      {
        columnId: 'status',
        compare: (a: UploadItem, b: UploadItem) => a.status.localeCompare(b.status),
        renderHeaderCell: () => 'Status',
        renderCell: (item: UploadItem) => (
          <TableCellLayout>{renderUploadStatus(item.status)}</TableCellLayout>
        ),
      },
      {
        columnId: 'actions',
        compare: () => 0,
        renderHeaderCell: () => 'Actions',
        renderCell: (item: UploadItem) => (
          <TableCellLayout className="file-upload-grid-example__actions">
            {item.status === 'failed' ? (
              <Button
                appearance="subtle"
                aria-label={`Retry ${item.name}`}
                icon={<ArrowClockwise20Regular aria-hidden />}
                onClick={() => handleRetry(item)}
              />
            ) : null}
            <Button
              appearance="subtle"
              aria-label={`Delete ${item.name}`}
              disabled={item.status === 'uploading'}
              icon={<Delete20Regular aria-hidden />}
              onClick={() => handleDelete(item)}
            />
          </TableCellLayout>
        ),
      },
    ];

    const handleFilesAdded = (added: readonly File[]) => {
      setError(undefined);
      setFiles((prev) => {
        const next = [...prev];
        for (const file of added) {
          const item = createUploadItem(file);
          if (!next.some((existing) => existing.id === item.id)) {
            next.push(item);
          }
        }
        return next;
      });

      // Simulate upload progress for newly added files.
      for (const file of added) {
        const id = createUploadItem(file).id;
        window.setTimeout(() => {
          setFiles((prev) =>
            prev.map((item) => (item.id === id ? { ...item, status: 'uploading' } : item)),
          );
        }, 200);
        window.setTimeout(() => {
          setFiles((prev) =>
            prev.map((item) =>
              item.id === id
                ? {
                    ...item,
                    status: file.name.toLowerCase().includes('fail') ? 'failed' : 'uploaded',
                  }
                : item,
            ),
          );
        }, 1200);
      }
    };

    const styles = /* css */ `
    .file-upload-grid-example {
      display: flex;
      flex-direction: column;
      max-width: 720px;
      padding: var(--spacingHorizontalL);
      row-gap: var(--spacingVerticalL);
    }

    .file-upload-grid-example__actions {
      align-items: center;
      column-gap: var(--spacingHorizontalXXS);
      display: flex;
    }
  `;

    return (
      <>
        <style>{styles}</style>
        <div className="file-upload-grid-example">
          {error ? (
            <MessageBar id={errorId} intent="error">
              <MessageBarBody>
                <MessageBarTitle>Unable to add file</MessageBarTitle>
                {error}
              </MessageBarBody>
            </MessageBar>
          ) : null}

          <FileUpload
            accept={acceptedFileTypes}
            ariaDescribedBy={error ? `${instructionsId} ${errorId}` : instructionsId}
            ariaLabel="Choose files"
            maxSize={maxFileSize}
            minSize={1}
            multiple
            onDropAccepted={handleFilesAdded}
            onDropRejected={(rejections) =>
              setError(
                rejections
                  .map(
                    ({ file, errors }) =>
                      `${file.name}: ${errors.map(({ message }) => message).join(', ')}`,
                  )
                  .join('; '),
              )
            }
          >
            <Text preset="body">Drag files here or click to browse</Text>
            <Text id={instructionsId} foreground={3} preset="bodyS">
              PDF, TXT, PNG, or JPEG · Max 5 MB
            </Text>
          </FileUpload>

          {files.length === 0 ? (
            <Text foreground={3} preset="bodyS">
              No files yet. Drop or browse to add some.
            </Text>
          ) : (
            <DataGrid
              aria-label="Selected files"
              columns={columns}
              getRowId={(item) => item.id}
              items={files}
              sortable
            >
              <DataGridHeader>
                <DataGridRow>
                  {({ renderHeaderCell }) => (
                    <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                  )}
                </DataGridRow>
              </DataGridHeader>
              <DataGridBody<UploadItem>>
                {({ item, rowId }) => (
                  <DataGridRow<UploadItem> key={rowId}>
                    {({ renderCell, columnId }) => (
                      <DataGridCell focusMode={columnId === 'actions' ? 'group' : undefined}>
                        {renderCell(item)}
                      </DataGridCell>
                    )}
                  </DataGridRow>
                )}
              </DataGridBody>
            </DataGrid>
          )}
        </div>
      </>
    );
  },
};

// ---------- Custom Dropzone Content ----------

/**
 * Demonstrates consumer-defined drop-zone content with a custom icon, layout,
 * instructions, validation feedback, and selected-file state.
 */
export const CustomDropZoneContent: StoryObj = {
  name: 'Custom Content',
  render: () => {
    const maxFileSize = 5 * 1024 * 1024;
    const instructionsId = React.useId();
    const errorId = React.useId();
    const [selectedFile, setSelectedFile] = React.useState<File>();
    const [error, setError] = React.useState<string>();
    const styles = /* css */ `
      .file-upload-custom-content-example {
        display: flex;
        flex-direction: column;
        max-width: 720px;
        padding: var(--spacingHorizontalL);
        row-gap: var(--spacingVerticalL);
      }

      .file-upload-custom-content-example__drop-zone {
        align-items: center;
        background-color: var(--colorBrandBackground2);
        border: var(--strokeWidthThin) solid var(--colorBrandStroke1);
        min-height: 180px;
        padding: var(--spacingVerticalXXL);
      }

      .file-upload-custom-content-example__drop-zone:hover {
        background-color: var(--colorBrandBackground2Hover);
      }

      .file-upload-custom-content-example__drop-zone:active {
        background-color: var(--colorBrandBackground2Pressed);
      }

      .file-upload-custom-content-example__upload-icon {
        margin-bottom: var(--spacingVerticalXXS);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="file-upload-custom-content-example">
          {error ? (
            <MessageBar id={errorId} intent="error">
              <MessageBarBody>
                <MessageBarTitle>Unable to add file</MessageBarTitle>
                {error}
              </MessageBarBody>
            </MessageBar>
          ) : null}

          <FileUpload
            ariaLabel={selectedFile ? 'Replace knowledge file' : 'Select a knowledge file'}
            ariaDescribedBy={error ? `${instructionsId} ${errorId}` : instructionsId}
            accept={{
              'application/pdf': ['.pdf'],
              'text/plain': ['.txt'],
              'text/markdown': ['.md'],
            }}
            className="file-upload-custom-content-example__drop-zone"
            maxSize={maxFileSize}
            multiple={false}
            onDropAccepted={(added) => {
              setError(undefined);
              setSelectedFile(added[0]);
            }}
            onDropRejected={(rejections) =>
              setError(
                rejections
                  .map(
                    ({ file, errors }) =>
                      `${file.name}: ${errors.map(({ message }) => message).join(', ')}`,
                  )
                  .join('; '),
              )
            }
          >
            <DocumentArrowUp24Regular
              aria-hidden
              className="file-upload-custom-content-example__upload-icon"
            />
            <Text preset="heading5">
              {selectedFile ? selectedFile.name : 'Select a knowledge file'}
            </Text>
            <Text foreground={3} preset="bodyS">
              {selectedFile
                ? 'Drop another file or click to replace this selection'
                : 'Drop a product guide or click to browse'}
            </Text>
            <Text foreground={3} preset="bodyS">
              PDF, TXT, or Markdown · Max 5 MB
            </Text>
          </FileUpload>
        </div>
      </>
    );
  },
};

/**
 * Thin styled wrapper around stable `react-dropzone` options. Consumers own
 * validation messages, upload behavior, and selected-file presentation.
 * Keep children presentational because the drop-zone root owns activation;
 * use `useDropzone` directly for nested controls or custom activation.
 *
 * @summary Styled drop zone exposing stable react-dropzone options and render state.
 */
export default {
  title: 'Components/FileUpload',
  component: FileUpload,
};
