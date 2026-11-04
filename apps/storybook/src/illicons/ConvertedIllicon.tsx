// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  iconToDotGrid,
  Illicon,
  Text,
  type DotGridRenderOptions,
} from '@coreai-ds/react-components';
import type { FluentIcon } from '@fluentui/react-icons';

export function ConvertedIllicon({
  icon,
  multiplier,
  convert = iconToDotGrid,
  ...props
}: DotGridRenderOptions & {
  icon: FluentIcon;
  multiplier?: number;
  'aria-label'?: string;
  convert?: typeof iconToDotGrid;
}) {
  const [sample, setSample] = React.useState<{
    icon: FluentIcon;
    multiplier?: number;
    convert: typeof iconToDotGrid;
    value: Awaited<ReturnType<typeof iconToDotGrid>> | Error;
  }>();
  React.useEffect(() => {
    let active = true;
    void convert(icon, { multiplier }).then(
      (value) => {
        if (active) setSample({ icon, multiplier, convert, value });
      },
      (error: unknown) => {
        if (active) {
          setSample({
            icon,
            multiplier,
            convert,
            value: error instanceof Error ? error : new Error(String(error)),
          });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [icon, multiplier, convert]);

  if (
    !sample ||
    sample.icon !== icon ||
    sample.multiplier !== multiplier ||
    sample.convert !== convert
  ) {
    return <Text role="status">Converting illustration...</Text>;
  }
  if (sample.value instanceof Error) {
    return <Text role="alert">{sample.value.message}</Text>;
  }
  return <Illicon {...props} data={sample.value} />;
}
