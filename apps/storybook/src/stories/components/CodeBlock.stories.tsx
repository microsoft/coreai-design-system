// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  Option,
  Button,
  CodeBlock,
  Dropdown,
  Text,
  Skeleton,
  SkeletonItem,
} from '@coreai-ds/react-components';
import type { StoryObj } from '@storybook/react-vite';

/**
 * `CodeBlock` syntax-highlights a string of source code based on the
 * `language` prop (e.g. `tsx`, `css`). Omitting `language` renders the code
 * as plain, un-highlighted text.
 */
export const Default: StoryObj = {
  render: () => {
    const tsSample = `import { Button } from "@coreai-ds/react-components";

export function Save(): JSX.Element {
  // Click to persist the current document.
  return <Button appearance="primary">Save</Button>;
}`;
    const cssSample = `.card {
  border-radius: 8px;
  padding: 16px;
  background: var(--colorNeutralBackground1);
}`;
    const styles = /* css */ `
      .code-block-default-example {
        display: flex;
        flex-direction: column;
        row-gap: var(--spacingVerticalL);
        max-width: 640px;
      }

      .code-block-default-example__heading {
        margin: 0;
        font-size: var(--fontSizeBase200);
        color: var(--colorNeutralForeground3);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="code-block-default-example">
          <div>
            <p className="code-block-default-example__heading">TypeScript</p>
            <CodeBlock language="tsx" code={tsSample} />
          </div>

          <div>
            <p className="code-block-default-example__heading">CSS</p>
            <CodeBlock language="css" code={cssSample} />
          </div>

          <div>
            <p className="code-block-default-example__heading">Un-highlighted (no language)</p>
            <CodeBlock code={`SELECT * FROM users WHERE active = 1;`} />
          </div>
        </div>
      </>
    );
  },
};

/**
 * `CodeBlock` accepts an `appearance` prop mirroring `Card`'s appearances:
 * `filled-alternative` (default), `filled`, `outline`, and `subtle`.
 */
export const Appearance: StoryObj = {
  render: () => {
    const appearanceSample = `import { Button } from "@coreai-ds/react-components";

export function Save(): JSX.Element {
  return <Button appearance="primary">Save</Button>;
}`;
    const styles = /* css */ `
      .code-block-appearance-example {
        display: flex;
        flex-direction: column;
        row-gap: var(--spacingVerticalXL);
      }

      .code-block-appearance-example__heading {
        margin: 0;
        font-size: var(--fontSizeBase200);
        color: var(--colorNeutralForeground3);
      }

      .code-block-appearance-example__filled-surface {
        background-color: var(--colorNeutralBackground3);
        margin-inline: calc(-3 * var(--spacingHorizontalL));
        padding-inline: calc(3 * var(--spacingHorizontalL));
        padding-block: var(--spacingVerticalXL);
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="code-block-appearance-example">
          <div>
            <p className="code-block-appearance-example__heading">filled-alternative (default)</p>
            <CodeBlock language="tsx" code={appearanceSample} />
          </div>

          <div className="code-block-appearance-example__filled-surface">
            <p className="code-block-appearance-example__heading">
              filled (on colorNeutralBackground3)
            </p>
            <CodeBlock language="tsx" appearance="filled" code={appearanceSample} />
          </div>

          <div>
            <p className="code-block-appearance-example__heading">outline</p>
            <CodeBlock language="tsx" appearance="outline" code={appearanceSample} />
          </div>

          <div>
            <p className="code-block-appearance-example__heading">subtle (no border, no padding)</p>
            <CodeBlock language="tsx" appearance="subtle" code={appearanceSample} />
          </div>
        </div>
      </>
    );
  },
};

/**
 * Header content can contain any React node. These examples show a divided
 * header with controls and a subtle header with a language tag.
 */
export const Header: StoryObj = {
  render: () => {
    const codeSamples = {
      json: `{
  "name": "coreai-docs",
  "theme": "coreai",
  "features": ["search", "feedback"]
}`,
      yaml: `name: coreai-docs
theme: coreai
features:
  - search
  - feedback`,
      markdown: `# coreai-docs
- Theme: \`coreai\`
- Features:
  - search
  - feedback`,
    };
    type CodeSampleLanguage = keyof typeof codeSamples;
    const languageLabels: Record<CodeSampleLanguage, string> = {
      json: 'JSON',
      yaml: 'YAML',
      markdown: 'Markdown',
    };
    const tsSample = `import { Button } from "@coreai-ds/react-components";

export function Save(): JSX.Element {
  // Click to persist the current document.
  return <Button appearance="primary">Save</Button>;
}`;
    const [language, setLanguage] = React.useState<CodeSampleLanguage>('json');
    const styles = /* css */ `
      .code-block-header-example {
        display: flex;
        flex-direction: column;
        row-gap: var(--spacingVerticalL);
        max-width: 640px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="code-block-header-example">
          <CodeBlock
            code={codeSamples[language]}
            language={language}
            header={
              <>
                <Dropdown
                  label="Format"
                  dynamicWidth
                  appearance="filled-lighter"
                  size="small"
                  value={languageLabels[language]}
                  selectedOptions={[language]}
                  onOptionSelect={(_event, data) => {
                    if (data.optionValue && data.optionValue in codeSamples) {
                      setLanguage(data.optionValue as CodeSampleLanguage);
                    }
                  }}
                >
                  <Option value="json">JSON</Option>
                  <Option value="yaml">YAML</Option>
                  <Option value="markdown">Markdown</Option>
                </Dropdown>
                <Button appearance="subtle" size="small" shape="rounded">
                  API Keys
                </Button>
              </>
            }
          />

          <CodeBlock
            code={tsSample}
            language="tsx"
            headerAppearance="subtle"
            header={
              <Text preset="bodyXS" foreground={3}>
                TypeScript - SaveButton.tsx
              </Text>
            }
          />
        </div>
      </>
    );
  },
};

/**
 * Constrain a long code sample to a fixed height, then remove the height to
 * reveal the complete source when the user selects Show All.
 */
export const FixedHeight: StoryObj = {
  render: () => {
    const [showAll, setShowAll] = React.useState(false);
    const longSample = `import * as React from 'react';
import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  Input,
  Text,
} from '@coreai-ds/react-components';

type ProfileFormProps = {
  initialName: string;
  initialRole: string;
  onSave: (profile: { name: string; role: string }) => void;
};

export function ProfileForm({
  initialName,
  initialRole,
  onSave,
}: ProfileFormProps): JSX.Element {
  const [name, setName] = React.useState(initialName);
  const [role, setRole] = React.useState(initialRole);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({ name, role });
  };

  return (
    <Card as="form" onSubmit={handleSubmit}>
      <CardHeader
        header={<Text preset="heading5">Profile</Text>}
        description={
          <Text foreground={3}>
            Update the details shown to your team.
          </Text>
        }
      />

      <Input
        label="Name"
        value={name}
        onChange={(_event, data) => setName(data.value)}
      />
      <Input
        label="Role"
        value={role}
        onChange={(_event, data) => setRole(data.value)}
      />

      <CardFooter>
        <Button appearance="primary" type="submit">
          Save changes
        </Button>
      </CardFooter>
    </Card>
  );
}`;
    const styles = /* css */ `
      .code-block-fixed-height-example {
        width: 100%;
        height: 320px;
        max-width: 720px;
      }

      .code-block-fixed-height-example--expanded {
        height: auto;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <CodeBlock
          className={`code-block-fixed-height-example${
            showAll ? ' code-block-fixed-height-example--expanded' : ''
          }`}
          code={longSample}
          language="tsx"
          header={'user-profiles/ProfileForm.tsx'}
          footer={
            <Button
              appearance="subtle"
              size="small"
              aria-expanded={showAll}
              onClick={() => setShowAll((current) => !current)}
            >
              {showAll ? 'Show Less' : 'Show All'}
            </Button>
          }
        />
      </>
    );
  },
};

/**
 * Use `fallbackContent` for a loading or empty state. It renders only while
 * `code` is empty or omitted, and the copy action remains hidden.
 */
export const Loading: StoryObj = {
  render: () => {
    const styles = /* css */ `
      .code-block-loading-example__skeleton {
        display: flex;
        flex-direction: column;
        gap: var(--spacingVerticalS);
      }

      .code-block-loading-example__line--one {
        width: 42%;
      }

      .code-block-loading-example__line--two {
        width: 68%;
      }

      .code-block-loading-example__line--three {
        width: 56%;
      }

      .code-block-loading-example__line--four {
        width: 76%;
      }

      .code-block-loading-example__line--five {
        width: 48%;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <CodeBlock
          header="Loading Code..."
          headerAppearance="subtle"
          fallbackContent={
            <Skeleton className="code-block-loading-example__skeleton" aria-label="Loading code">
              <SkeletonItem className="code-block-loading-example__line--one" size={16} />
              <SkeletonItem className="code-block-loading-example__line--two" size={16} />
              <SkeletonItem className="code-block-loading-example__line--three" size={16} />
              <SkeletonItem className="code-block-loading-example__line--four" size={16} />
              <SkeletonItem className="code-block-loading-example__line--five" size={16} />
            </Skeleton>
          }
        />
      </>
    );
  },
};

/**
 * Renders a string of source code with theme-aware syntax highlighting — the
 * light/dark highlight.js palettes follow the active Fluent theme mode.
 *
 * @summary Displays source code with theme-aware syntax highlighting.
 */
export default {
  title: 'Components/CodeBlock',
  component: CodeBlock,
};
