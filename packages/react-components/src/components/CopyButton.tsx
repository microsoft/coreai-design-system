// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

/**
 * `CopyButton` — a `Button` preset for copy-to-clipboard actions.
 *
 * Wraps the CoreAI `Button` with:
 *   - a copy icon (`bundleIcon(CopyFilled, CopyRegular)`) that swaps to a
 *     checkmark for ~1.5s after a successful copy,
 *   - a `Tooltip` that surfaces `copiedMessage` ("Copied" by default) during that window, and
 *   - a `subtle` default appearance.
 *
 * Pass the text to copy via `contentToCopy`. Use `onCopySuccess` and
 * `onCopyError` for outcome-dependent behavior. An `aria-label` is required so
 * screen readers can differentiate multiple copy buttons on a page. All other
 * `Button` props are forwarded unchanged.
 */
import * as React from 'react';
import {
  mergeClasses,
  Tooltip,
  type ButtonProps,
  type ForwardRefComponent,
} from '@fluentui/react-components';
import {
  bundleIcon,
  ClipboardCheckmarkFilled,
  ClipboardCheckmarkRegular,
  CopyFilled,
  CopyRegular,
} from '@fluentui/react-icons';
import { Button } from './Button.js';

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
  /** Confirmation shown above the button after copying. Defaults to "Copied". */
  copiedMessage?: string;
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
  HTMLButtonElement,
  CopyButtonProps
>((props, ref) => {
  const {
    contentToCopy,
    copiedMessage = 'Copied',
    appearance = 'subtle',
    className,
    onClick,
    onCopySuccess,
    onCopyError,
    ...rest
  } = props;
  const [isRecentlyCopied, setIsRecentlyCopied] = React.useState(false);
  const timeoutRef = React.useRef<number | undefined>(undefined);

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
      (
        onClick as
          ((e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void) | undefined
      )?.(event);
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
    <Tooltip
      content={<span role="status">{copiedMessage}</span>}
      positioning="above"
      relationship="inaccessible"
      visible={isRecentlyCopied}
    >
      <Button
        ref={ref}
        appearance={appearance}
        className={mergeClasses('fui-CopyButton', className)}
        icon={isRecentlyCopied ? <CopiedIcon aria-hidden /> : <CopyIcon aria-hidden />}
        onClick={handleClick}
        {...rest}
      />
    </Tooltip>
  );
}) as ForwardRefComponent<CopyButtonProps>;

CopyButton.displayName = 'CopyButton';
