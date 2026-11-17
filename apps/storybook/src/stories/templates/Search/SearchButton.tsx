// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Button, Tooltip, type ButtonProps } from '@coreai-ds/react-components';
import { SearchRegular } from '@fluentui/react-icons';
/** Search trigger only. Pair with SearchDialog and caller-owned open/query state. */
export const SearchButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => (
    <Tooltip content="Search" relationship="label">
      <Button
        ref={ref}
        appearance="subtle"
        icon={<SearchRegular />}
        aria-label="Search"
        aria-haspopup="dialog"
        {...props}
      >
        {children}
      </Button>
    </Tooltip>
  ),
);
SearchButton.displayName = 'SearchButton';
