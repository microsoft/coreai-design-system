// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

declare module '*.md' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const url: string;
  export default url;
}

declare module '*.css';

declare module '*?raw' {
  const content: string;
  export default content;
}
