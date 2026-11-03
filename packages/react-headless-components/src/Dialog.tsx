// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  renderDialog,
  useDialog,
  useDialogContextValues,
  type DialogProps,
} from '@fluentui/react-headless-components-preview/dialog';

export {
  useDialogContext,
  useDialogContextValues,
  useDialogSurfaceContext,
} from '@fluentui/react-headless-components-preview/dialog';
export type {
  DialogContextValue,
  DialogContextValues,
  DialogModalType,
  DialogOpenChangeData,
  DialogOpenChangeEvent,
  DialogOpenChangeEventHandler,
  DialogProps,
  DialogState,
  DialogSurfaceContextValue,
} from '@fluentui/react-headless-components-preview/dialog';

export function Dialog(props: DialogProps): React.ReactElement {
  const state = useDialog(props);
  const contextValues = useDialogContextValues(state);
  return renderDialog(state, contextValues);
}

Dialog.displayName = 'Dialog';
