// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Button, Link, Text } from '@coreai-ds/react-components';

interface EmbedFrameProps {
  src: string;
  title: string;
  loadingLabel: string;
  className?: string;
  allow?: string;
  allowFullScreen?: boolean;
  signInUrl?: string;
}

export function EmbedFrame({
  src,
  title,
  loadingLabel,
  className = '',
  allow,
  allowFullScreen,
  signInUrl,
}: EmbedFrameProps) {
  const [ready, setReady] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);
  const revealTimer = React.useRef<number>();

  React.useEffect(() => {
    setReady(false);
    return () => {
      if (revealTimer.current) {
        window.clearTimeout(revealTimer.current);
      }
    };
  }, [src, reloadKey]);

  const reveal = () => {
    if (revealTimer.current) {
      window.clearTimeout(revealTimer.current);
    }
    revealTimer.current = window.setTimeout(() => setReady(true), 500);
  };

  return (
    <>
      <div className="component-demo__surface component-demo__surface--embed">
        <div className={`component-embed__loading${ready ? ' is-hidden' : ''}`} aria-hidden={ready}>
          <span className="component-embed__loading-mark" aria-hidden="true" />
          <span>{loadingLabel}</span>
        </div>
        <iframe
          key={`${src}-${reloadKey}`}
          className={`component-embed${className ? ` ${className}` : ''}${ready ? ' is-ready' : ''}`}
          src={src}
          title={title}
          loading="lazy"
          allow={allow}
          allowFullScreen={allowFullScreen}
          onLoad={reveal}
        />
      </div>
      {signInUrl ? (
        <div className="component-embed__help">
          <Text size={200} foreground={2}>
            Preview not loading?{' '}
            <Link href={signInUrl} external>
              Sign in to Storybook
              <span className="sr-only"> (opens in a new tab)</span>
            </Link>
            , then reload the preview.
          </Text>
          <Button appearance="subtle" size="small" onClick={() => setReloadKey((key) => key + 1)}>
            Reload preview
          </Button>
        </div>
      ) : null}
    </>
  );
}
