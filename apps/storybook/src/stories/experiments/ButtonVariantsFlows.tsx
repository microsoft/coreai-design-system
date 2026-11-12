// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import {
  CompoundButton,
  ToggleButton,
  MenuButton,
  SplitButton,
} from '@coreai-ds/react-headless-components';
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from '@fluentui/react-headless-components-preview/menu';
import styles from './ButtonVariantsComparison.module.css';

export function CompoundButtonFlow() {
  const [submitted, setSubmitted] = React.useState('None');
  return (
    <form
      className={styles.flow}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(String(new FormData(event.currentTarget).get('release')));
      }}
    >
      <label>
        Release
        <input name="release" defaultValue="v2" />
      </label>
      <CompoundButton
        type="submit"
        appearance="primary"
        aria-label="Create release"
        secondaryContent="Deploy the selected release"
      >
        Create release
      </CompoundButton>
      <CompoundButton disabled secondaryContent="Requires approval">
        Delete release
      </CompoundButton>
      <output aria-live="polite">Submitted release: {submitted}</output>
    </form>
  );
}

export function ToggleButtonFlow() {
  const [checked, setChecked] = React.useState(false);
  const [activations, setActivations] = React.useState(0);
  return (
    <div className={styles.flow}>
      <ToggleButton checked={checked} onClick={() => setChecked((value) => !value)} isAccessible>
        Pin release
      </ToggleButton>
      <ToggleButton
        defaultChecked
        onClick={() => setActivations((value) => value + 1)}
        isAccessible
      >
        Follow release
      </ToggleButton>
      <ToggleButton checked disabled isAccessible>
        Locked setting
      </ToggleButton>
      <output aria-live="polite">
        Controlled pin: {checked ? 'on' : 'off'}; follow activations: {activations}
      </output>
    </div>
  );
}

export function MenuButtonFlow() {
  const [action, setAction] = React.useState('None');
  const [open, setOpen] = React.useState(false);
  return (
    <div className={styles.flow}>
      <Menu onOpenChange={(_event, data) => setOpen(data.open)}>
        <MenuTrigger disableButtonEnhancement>
          <MenuButton>Release actions</MenuButton>
        </MenuTrigger>
        <MenuPopover className={styles.menuSurface}>
          <MenuList>
            <MenuItem className={styles.menuItem} onClick={() => setAction('Inspect release')}>
              Inspect release
            </MenuItem>
            <MenuItem className={styles.menuItem} onClick={() => setAction('Archive release')}>
              Archive release
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
      <output aria-live="polite">
        Last action: {action}; requested open: {String(open)}
      </output>
    </div>
  );
}

export function SplitButtonFlow() {
  const [deployments, setDeployments] = React.useState(0);
  const [action, setAction] = React.useState('None');
  return (
    <div className={styles.flow}>
      <Menu positioning="below-end">
        <MenuTrigger disableButtonEnhancement>
          {(triggerProps) => (
            <SplitButton
              appearance="primary"
              primaryActionButton={{
                'aria-label': 'Deploy release',
                onClick: () => setDeployments((value) => value + 1),
              }}
              menuButton={{ ...triggerProps, 'aria-label': 'More deployment options' }}
            >
              Deploy release
            </SplitButton>
          )}
        </MenuTrigger>
        <MenuPopover className={styles.menuSurface}>
          <MenuList>
            <MenuItem className={styles.menuItem} onClick={() => setAction('Schedule deployment')}>
              Schedule deployment
            </MenuItem>
            <MenuItem className={styles.menuItem} onClick={() => setAction('Preview deployment')}>
              Preview deployment
            </MenuItem>
          </MenuList>
        </MenuPopover>
      </Menu>
      <output aria-live="polite">
        Deployments: {deployments}; last action: {action}
      </output>
    </div>
  );
}
