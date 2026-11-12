// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Tooltip as HeadlessTooltip,
  renderTooltip,
  useTooltip,
  type TooltipProps as HeadlessTooltipProps,
} from '@fluentui/react-headless-components-preview/tooltip';
import { useCoreAIDefaults } from './ComponentDefaultsContext.js';
import { applyTooltipContentStyles, type TooltipAppearance } from './TooltipStyles.js';

export { tooltipClassNames } from './TooltipStyles.js';
export type { TooltipAppearance } from './TooltipStyles.js';
export type {
  OnVisibleChangeData,
  TooltipSlots,
  TooltipState,
  TooltipTriggerProps,
} from '@fluentui/react-headless-components-preview/tooltip';

export type TooltipProps = HeadlessTooltipProps & {
  appearance?: TooltipAppearance;
};

export const Tooltip: {
  (props: TooltipProps): React.ReactElement;
  displayName: string;
} = Object.assign(function Tooltip(props: TooltipProps): React.ReactElement {
  const { appearance = 'normal', ...behaviorProps } = props;
  const defaultsEnabled = useCoreAIDefaults();
  const state = useTooltip(behaviorProps);
  applyTooltipContentStyles(state.content, appearance, defaultsEnabled);
  return renderTooltip(state);
}, HeadlessTooltip);
