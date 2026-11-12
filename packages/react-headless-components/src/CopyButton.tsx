// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * `CopyButton` — a `Button` preset for copy-to-clipboard actions.
 *
 * Wraps the CoreAI `Button` with:
 *   - a copy icon (`bundleIcon(CopyFilled, CopyRegular)`) that swaps to a
 *     checkmark for ~1.5s after a successful copy,
 *   - a `Tooltip` that surfaces "Copied" feedback during that window, and
 *   - a `subtle` default appearance.
 *
 * Pass the text to copy via `contentToCopy`. Use `onCopySuccess` and
 * `onCopyError` for outcome-dependent behavior. An `aria-label` is required so
 * screen readers can differentiate multiple copy buttons on a page. All other
 * `Button` props are forwarded unchanged.
 */
import * as React from 'react';
import type { ForwardRefComponent } from '@fluentui/react-utilities';
import { bundleIcon } from '@fluentui/react-icons/headless/utils';
import {
  ClipboardCheckmarkFilled,
  ClipboardCheckmarkRegular,
} from '@fluentui/react-icons/headless/svg/clipboard-checkmark';
import { CopyFilled, CopyRegular } from '@fluentui/react-icons/headless/svg/copy';
import './Icon.css';
import { Button, type ButtonProps } from './Button.js';
import { Tooltip } from './Tooltip.js';

export const copyButtonClassNames = {
  root: 'fui-CopyButton',
} as const;

const CopyIcon = bundleIcon(CopyFilled, CopyRegular);
const CopiedIcon = bundleIcon(ClipboardCheckmarkFilled, ClipboardCheckmarkRegular);

async function writeClipboardText(text: string): Promise<boolean> {
  try {
    await window.navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to write to clipboard:', error);
    return false;
  }
}

export type CopyButtonProps = ButtonProps & {
  /** Text written to the clipboard when the button is clicked. */
  contentToCopy: string | undefined;
  /** Required so screen readers can differentiate multiple copy buttons on a page. */
  'aria-label': string;
  /** Called after the clipboard write completes successfully. */
  onCopySuccess?: () => void;
  /** Called when the clipboard write fails. */
  onCopyError?: () => void;
};

/**
 * A Button preset for copy-to-clipboard actions.
 */
export const CopyButton: ForwardRefComponent<CopyButtonProps> = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  CopyButtonProps
>(function CopyButton(props, ref) {
  const {
    contentToCopy,
    appearance = 'subtle',
    className,
    onClick: onClickProp,
    onCopySuccess,
    onCopyError,
    ...rest
  } = props;
  const onClick: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement> | undefined =
    onClickProp;
  const [isRecentlyCopied, setIsRecentlyCopied] = React.useState(false);
  const timeoutRef = React.useRef<number | undefined>(undefined);

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      onClick?.(event);
      if (contentToCopy) {
        void writeClipboardText(contentToCopy).then((copied) => {
          if (copied) {
            setIsRecentlyCopied(true);
            onCopySuccess?.();
          } else {
            onCopyError?.();
          }
        });
      }
    },
    [contentToCopy, onClick, onCopyError, onCopySuccess],
  );

  React.useEffect(() => {
    if (!isRecentlyCopied) {
      return undefined;
    }

    timeoutRef.current = window.setTimeout(() => {
      setIsRecentlyCopied(false);
    }, 1500);

    return () => {
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [isRecentlyCopied]);

  // Reset the copied state whenever the content to copy changes.
  React.useEffect(() => {
    setIsRecentlyCopied(false);
  }, [contentToCopy]);

  return (
    <Tooltip content="Copied" relationship="inaccessible" visible={isRecentlyCopied}>
      <Button
        ref={ref}
        appearance={appearance}
        className={[copyButtonClassNames.root, className].filter(Boolean).join(' ')}
        icon={isRecentlyCopied ? <CopiedIcon aria-hidden /> : <CopyIcon aria-hidden />}
        onClick={handleClick}
        {...rest}
      />
    </Tooltip>
  );
});

CopyButton.displayName = 'CopyButton';
