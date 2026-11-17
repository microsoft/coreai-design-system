// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Dropdown, Field, Option } from '@coreai-ds/react-components';
import { ArrowExit20Regular } from '@fluentui/react-icons';
import { ProfileButton } from './ProfileButton';
const meta = {
  title: 'Templates/App Shell/Profile Button',
  component: ProfileButton,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ProfileButton>;
/** Copy-paste template — not an importable component. Copy `templates-app-shell-profile-button--source-code`. Used in Top Nav's profile slot; authentication and settings persistence belong to the caller. @summary Accessible avatar trigger and account popover with caller-owned settings. */
export default meta;
/** Profile settings and actions are UI-only placeholders without theme or authentication behavior. */
export const Default: StoryObj = {
  render: () => {
    const styles = /* css */ `.profile-example__field { display: flex; flex-direction: column; } .profile-example__sign-out { display: flex; justify-content: flex-start; gap: var(--spacingHorizontalXS); padding: var(--spacingVerticalSNudge) var(--spacingHorizontalXS); }`;
    return (
      <>
        <style>{styles}</style>
        <ProfileButton
          name="Alex Morgan"
          secondaryText="alex@example.com"
          footer={
            <Button
              appearance="transparent"
              className="profile-example__sign-out"
              icon={<ArrowExit20Regular />}
            >
              Sign out
            </Button>
          }
        >
          <Field label="Theme" className="profile-example__field">
            <Dropdown placeholder="Select theme">
              <Option>Light</Option>
              <Option>Dark</Option>
            </Dropdown>
          </Field>
        </ProfileButton>
      </>
    );
  },
};
