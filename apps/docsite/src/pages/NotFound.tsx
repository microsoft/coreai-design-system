// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { Button, Text } from '@coreai-ds/react-components';

export function NotFound() {
  React.useEffect(() => {
    document.title = 'Page not found | CoreAI';
    document.body.dataset.pageId = 'not-found';
    return () => {
      delete document.body.dataset.pageId;
    };
  }, []);

  return (
    <main id="main-content" className="site-main" tabIndex={-1}>
      <div className="page-header">
        <Text as="h1" size={900} weight="regular">
          Page not found
        </Text>
        <Text as="p" className="page-summary" size={400} foreground={3}>
          This page does not exist or may have moved.
        </Text>
      </div>
      <div className="page-content">
        <Button as="a" href="/" appearance="outline">
          Return to introduction
        </Button>
      </div>
    </main>
  );
}
