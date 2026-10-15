// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { figmaDesign } from '../../utils/figma';
import {
  MessageBarActions,
  MessageBarTitle,
  MessageBarBody,
  Button,
  Link,
  MessageBar,
  type MessageBarIntent,
} from '@coreai-ds/react-components';
import type { StoryObj } from '@storybook/react-vite';

import { DismissRegular } from '@fluentui/react-icons';
// `MessageBar` is the CoreAI-wrapped message bar — it extends Fluent's
// `intent` prop with an additional `"brand"` value styled with the brand
// token ramp. `MessageBarIntent` here is the widened union that includes it.

// ---------- Default (canonical Fluent story) ----------

/**
 * Shows an informational message with actions and a dismiss control.
 */
export const Default: StoryObj = {
  render: () => {
    return (
      <MessageBar>
        <MessageBarBody>
          <MessageBarTitle>Descriptive title</MessageBarTitle>
          Message providing information to the user with actionable insights. <Link>Link</Link>
        </MessageBarBody>
        <MessageBarActions
          containerAction={
            <Button aria-label="dismiss" appearance="transparent" icon={<DismissRegular />} />
          }
        >
          <Button>Action</Button>
          <Button>Action</Button>
        </MessageBarActions>
      </MessageBar>
    );
  },
};

/**
 * In addition to Fluent's four preset intents (`info`, `warning`, `error`,
 * `success`), CoreAI adds a `brand` intent styled with the brand token ramp
 * (`colorBrandBackground2` surface, `colorBrandStroke2` border,
 * `colorBrandForeground1` icon). It maps internally to Fluent's `info`
 * intent, so it keeps the same icon and polite `aria-live` announcement.
 */
export const Intent: StoryObj = {
  render: () => {
    // CoreAI adds `"brand"` on top of Fluent's four preset intents.
    const intents: MessageBarIntent[] = ['info', 'warning', 'error', 'success', 'brand'];

    const styles = /* css */ `
      .message-bar-intent-example {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="message-bar-intent-example">
          {intents.map((intent) => (
            <MessageBar key={intent} intent={intent}>
              <MessageBarBody>
                <MessageBarTitle>Intent {intent}</MessageBarTitle>
                Message providing information to the user with actionable insights.{' '}
                <Link>Link</Link>
              </MessageBarBody>
            </MessageBar>
          ))}
        </div>
      </>
    );
  },
};

/**
 * Communicates important information about the state of the entire application or surface.
 * For example, the status of a page, panel, dialog or card. The information shouldn't require someone
 * to take immediate action, but should persist until the user performs one of the required actions.
 *
 * > ⚠️ For `aria-live` announcements to work correctly you should configure you application with a
 * > [AriaLiveAnnouncer](https://react.fluentui.dev/?path=/docs/utilities-aria-live-arialiveannouncer--docs)
 * > towards the top of the React tree.
 *
 * @summary Communicates important status about a surface or the whole application.
 */
export default {
  title: 'Components/MessageBar',
  component: MessageBar,
  parameters: { ...figmaDesign('Message bar') },
};
