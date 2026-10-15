// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Divider } from '@coreai-ds/react-components';

export const DefaultDev = () => {
  const styles = /* css */ `
    .divider-default-dev-example {
      min-height: 96px;
      background-color: var(--colorNeutralBackground1);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <Divider className="divider-default-dev-example" />
    </>
  );
};

export const Appearance = () => {
  const styles = /* css */ `
    .divider-appearance-example {
      display: flex;
      flex-direction: column;
      row-gap: 5px;
    }

    .divider-appearance-example__item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-items: center;
      min-height: 96px;
      background-color: var(--colorNeutralBackground1);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="divider-appearance-example">
        <div className="divider-appearance-example__item">
          <Divider />
        </div>
        <div className="divider-appearance-example__item">
          <Divider appearance="subtle" />
        </div>
        <div className="divider-appearance-example__item">
          <Divider appearance="brand" />
        </div>
        <div className="divider-appearance-example__item">
          <Divider appearance="strong" />
        </div>
      </div>
    </>
  );
};

export const Inset = () => {
  const styles = /* css */ `
    .divider-inset-example {
      display: flex;
      flex-direction: column;
      row-gap: 5px;
    }

    .divider-inset-example__item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-items: center;
      min-height: 96px;
      background-color: var(--colorNeutralBackground1);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="divider-inset-example">
        <div className="divider-inset-example__item">
          <Divider inset />
        </div>
        <div className="divider-inset-example__item">
          <Divider inset vertical style={{ height: '100%' }} />
        </div>
      </div>
    </>
  );
};

export const Vertical = () => {
  const styles = /* css */ `
    .divider-vertical-example {
      min-height: 96px;
      background-color: var(--colorNeutralBackground1);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <Divider className="divider-vertical-example" vertical style={{ height: '100%' }} />
    </>
  );
};

export default {
  title: 'Components/Divider',
  component: Divider,
};
