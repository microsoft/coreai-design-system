// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItemLink,
  MenuList,
  MenuPopover,
  MenuTrigger,
} from '@coreai-ds/react-components';
import { Copy20Regular, DocumentText20Regular } from '@fluentui/react-icons';

export function MarkdownActions({
  markdownUrl,
  iconOnly = false,
}: {
  markdownUrl: string;
  iconOnly?: boolean;
}) {
  const [status, setStatus] = React.useState<'idle' | 'copied' | 'error'>('idle');
  const timer = React.useRef<number>();
  const request = React.useRef<AbortController>();
  const label =
    status === 'copied' ? 'Copied' : status === 'error' ? 'Copy failed' : 'Copy for LLM';
  React.useEffect(() => {
    setStatus('idle');
    return () => {
      request.current?.abort();
      window.clearTimeout(timer.current);
    };
  }, [markdownUrl]);
  async function copyMarkdown() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    window.clearTimeout(timer.current);
    setStatus('idle');
    try {
      const response = await fetch(markdownUrl, { signal: controller.signal });
      if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
        throw new Error(`Markdown request failed: ${response.status} ${markdownUrl}`);
      }
      const markdown = await response.text();
      if (controller.signal.aborted) return;
      await navigator.clipboard.writeText(markdown);
      if (controller.signal.aborted) return;
      setStatus('copied');
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error('Failed to copy page Markdown.', error);
      setStatus('error');
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus('idle'), 2500);
  }
  return (
    <>
      <Menu positioning={{ autoSize: true }}>
        <MenuTrigger disableButtonEnhancement>
          <MenuButton
            appearance="subtle"
            icon={<Copy20Regular />}
            menuIcon={iconOnly ? null : undefined}
            aria-label={iconOnly ? label : undefined}
            title={iconOnly ? label : undefined}
            className="component-copy-menu__trigger"
          >
            {iconOnly ? null : label}
          </MenuButton>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            <MenuItem icon={<Copy20Regular />} onClick={() => void copyMarkdown()}>
              Copy page as Markdown
            </MenuItem>
            <MenuItemLink
              href={markdownUrl}
              target="_blank"
              rel="noopener noreferrer"
              icon={<DocumentText20Regular />}
            >
              View as Markdown
            </MenuItemLink>
          </MenuList>
        </MenuPopover>
      </Menu>
      <span className="sr-only" role="status">
        {status === 'copied'
          ? 'Page Markdown copied.'
          : status === 'error'
            ? 'Page Markdown could not be copied. Use View as Markdown to read it directly.'
            : ''}
      </span>
    </>
  );
}
