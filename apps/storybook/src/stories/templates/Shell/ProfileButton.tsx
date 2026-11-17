// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type { ReactNode } from 'react';
import {
  Avatar,
  Button,
  Divider,
  Persona,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Text,
  makeStyles,
  tokens,
} from '@coreai-ds/react-components';
import { PersonFilled } from '@fluentui/react-icons';
const useProfileButtonStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '274px',
    maxWidth: '100%',
    overflowWrap: 'anywhere',
  },
  heading: { margin: 0 },
  persona: { overflow: 'hidden' },
});
export interface ProfileButtonProps {
  name: string;
  secondaryText?: string;
  imageUrl?: string;
  children?: ReactNode;
  footer?: ReactNode;
}
/** Account popover with caller-supplied settings and actions. No authentication, theme storage, or service assumptions. */
export function ProfileButton({
  name,
  secondaryText,
  imageUrl,
  children,
  footer,
}: ProfileButtonProps) {
  const styles = useProfileButtonStyles();
  return (
    <Popover
      positioning={{
        position: 'below',
        align: 'end',
        strategy: 'fixed',
        offset: { mainAxis: 8, crossAxis: 0 },
      }}
      trapFocus
    >
      <PopoverTrigger disableButtonEnhancement>
        <Button
          appearance="subtle"
          aria-label={`Profile for ${name}`}
          title={`Profile for ${name}`}
          icon={
            // Use imageUrl for a photo, or omit initials={null} to show initials, depending on the use case.
            <Avatar
              name={name}
              image={imageUrl ? { src: imageUrl } : undefined}
              initials={null}
              icon={<PersonFilled />}
              color="neutral-alt"
              size={24}
              aria-hidden
            />
          }
        />
      </PopoverTrigger>
      <PopoverSurface aria-label="Profile">
        <div className={styles.content}>
          <Text as="h2" preset="heading4" className={styles.heading}>
            Profile
          </Text>
          <Persona
            className={styles.persona}
            name={name}
            primaryText={
              <Text preset="heading4" foreground={1}>
                {name}
              </Text>
            }
            secondaryText={
              <Text preset="body" foreground={2}>
                {secondaryText}
              </Text>
            }
            avatar={{ size: 48, image: imageUrl ? { src: imageUrl } : undefined }}
          />
          {children != null && (
            <Text as="h2" preset="heading4" foreground={1} className={styles.heading}>
              Settings
            </Text>
          )}
          {children}
          {footer != null && (
            <>
              <Divider />
              {footer}
            </>
          )}
        </div>
      </PopoverSurface>
    </Popover>
  );
}
