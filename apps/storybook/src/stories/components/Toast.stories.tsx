// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Button,
  Link,
  Toast,
  ToastBody,
  ToastFooter,
  ToastTitle,
  Toaster,
  useId,
  useToastController,
  type JSXElement,
} from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (): JSXElement => {
  const toasterId = useId('toaster');
  const { dispatchToast } = useToastController(toasterId);
  const notify = () =>
    dispatchToast(
      <Toast>
        <ToastTitle action={<Link>Undo</Link>}>Email sent</ToastTitle>
        <ToastBody subtitle="Subtitle">This is a toast body</ToastBody>
        <ToastFooter>
          <Link>Action</Link>
          <Link>Action</Link>
        </ToastFooter>
      </Toast>,
      { intent: 'success' },
    );

  return (
    <>
      <Toaster toasterId={toasterId} />
      <Button onClick={notify}>Make toast</Button>
    </>
  );
};

/**
 * A Toasts displays temporary content to the user. Toasts are rendered as a separate surface that can be dismissed by
 * user action or a application timeout. Toasts are typically used in the following situations:
 *
 * - Update the user on the status of a task
 * - Display the progress of a task
 * - Notify the user to take an action
 * - Notify the user of an application update
 * - Warn the user of an error
 *
 * The Fluent UI Toast component uses an **imperative** API. Once a Toaster has been rendered, you can use the
 * `useToastController` hook to get access to imperative methods to dispatch a Toast. The Toast component itself
 * is simply a layout component.
 *
 * > ⚠️ In order for notifications that use toast to be fully accessible, developers should make the notifications
 * > available on a permanent surface too. One of the ways to do this in an application is to implement a notification
 * > centre.
 *
 * For live region debugging help, check our [Debugging Notifications](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-debugging-notifications--docs) docs page.
 *
 * ## Best practices
 *
 * ### Do
 *
 * - Configure defaults on the Toaster
 * - Use the toast for non-critical messages
 * - Let the user view the toast content in the application after the toast dismissed
 * - Create a keyboard shortcut to move focus to actionable toasts
 * - Use `politeness` setting to differentiate urgent and non-urgent messages
 *
 * ### Don't
 *
 * - Render too many toasts at once
 * - Use different positions for toasts
 * - Use more than one Toaster in an application
 * - Make every toast have `assertive` politeness
 *
 * @summary Temporary notification surface that can be dismissed or auto-expire. Subcomponents: ToastTitle, ToastBody, ToastFooter, Toaster.
 */
export default {
  title: 'Components/Toast',
  component: Toast,
  subcomponents: { ToastTitle, ToastBody, ToastFooter, Toaster },
  parameters: {
    ...figmaDesign('Toast'),
  },
};
