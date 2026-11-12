// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import type { DropdownProps as HeadlessDropdownProps } from '@fluentui/react-headless-components-preview/dropdown';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import type { ButtonProps } from './Button.js';
import { Dropdown } from './Dropdown.js';
import { DropdownVisualContext } from './DropdownVisualContext.js';
import styles from './DropdownButton.module.css';

export type DropdownButtonProps = Omit<HeadlessDropdownProps, 'button'> &
  Pick<ButtonProps, 'appearance' | 'shape' | 'size'> & {
    /** Inline trigger label. */
    label: string;
  };

export const dropdownButtonClassNames = { root: 'fui-DropdownButton' } as const;

export const DropdownButton: ForwardRefComponent<DropdownButtonProps> = React.forwardRef<
  HTMLButtonElement,
  DropdownButtonProps
>(function DropdownButton(
  { appearance = 'secondary', shape = 'circular', size, className, ...props },
  ref,
) {
  return (
    <DropdownVisualContext.Provider value={{ appearance, shape, size: size ?? 'medium' }}>
      <Dropdown
        {...props}
        ref={ref}
        size={size}
        dynamicWidth
        truncateTextOverflow
        className={[dropdownButtonClassNames.root, styles.DropdownButton, className]
          .filter(Boolean)
          .join(' ')}
      />
    </DropdownVisualContext.Provider>
  );
});

DropdownButton.displayName = 'DropdownButton';
