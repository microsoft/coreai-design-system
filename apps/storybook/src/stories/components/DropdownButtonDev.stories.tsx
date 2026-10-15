// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { DropdownButton, Option } from '@coreai-ds/react-components';

const sortOptions = ['Newest', 'Oldest', 'Most popular', 'Trending'];
const filterOptions = ['All', 'Active', 'Archived'];

export const Variants = () => {
  const [sort, setSort] = React.useState('Newest');
  const [filter, setFilter] = React.useState('All');

  const styles = /* css */ `
    .dropdown-button-variants-example {
      display: flex;
      flex-direction: column;
      column-gap: var(--spacingHorizontalXXL);
      row-gap: var(--spacingVerticalL);
      align-items: flex-start;
      padding: var(--spacingVerticalL);
    }

    .dropdown-button-variants-example__column {
      display: flex;
      flex-direction: column;
      row-gap: var(--spacingVerticalS);
      align-items: flex-start;
    }

    .dropdown-button-variants-example__heading {
      margin: 0;
      font-size: var(--fontSizeBase200);
      color: var(--colorNeutralForeground3);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="dropdown-button-variants-example">
        <div className="dropdown-button-variants-example__column">
          <p className="dropdown-button-variants-example__heading">default</p>
          <DropdownButton
            label="Sort by"
            value={sort}
            selectedOptions={[sort]}
            onOptionSelect={(_event, data) => setSort(data.optionValue ?? sort)}
          >
            {sortOptions.map((option) => (
              <Option key={option}>{option}</Option>
            ))}
          </DropdownButton>
        </div>

        <div className="dropdown-button-variants-example__column">
          <p className="dropdown-button-variants-example__heading">subtle</p>
          <DropdownButton
            appearance="subtle"
            label="Filter"
            value={filter}
            selectedOptions={[filter]}
            onOptionSelect={(_event, data) => setFilter(data.optionValue ?? filter)}
          >
            {filterOptions.map((option) => (
              <Option key={option}>{option}</Option>
            ))}
          </DropdownButton>
        </div>

        <div className="dropdown-button-variants-example__column">
          <p className="dropdown-button-variants-example__heading">
            label only (no value/placeholder)
          </p>
          <DropdownButton label="Sort by" clearable onOptionSelect={() => undefined}>
            {sortOptions.map((option) => (
              <Option key={option}>{option}</Option>
            ))}
          </DropdownButton>
        </div>

        <div className="dropdown-button-variants-example__column">
          <p className="dropdown-button-variants-example__heading">disabled</p>
          <DropdownButton label="Sort by" disabled onOptionSelect={() => undefined}>
            {sortOptions.map((option) => (
              <Option key={option}>{option}</Option>
            ))}
          </DropdownButton>
        </div>
      </div>
    </>
  );
};

const appearances = ['secondary', 'primary', 'outline', 'subtle', 'transparent'] as const;

export const Appearance = () => {
  const [sort, setSort] = React.useState('Newest');

  const styles = /* css */ `
    .dropdown-button-appearance-example {
      display: flex;
      flex-direction: column;
      column-gap: var(--spacingHorizontalXXL);
      row-gap: var(--spacingVerticalL);
      align-items: flex-start;
      padding: var(--spacingVerticalL);
    }

    .dropdown-button-appearance-example__column {
      display: flex;
      flex-direction: column;
      row-gap: var(--spacingVerticalS);
      align-items: flex-start;
    }

    .dropdown-button-appearance-example__heading {
      margin: 0;
      font-size: var(--fontSizeBase200);
      color: var(--colorNeutralForeground3);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="dropdown-button-appearance-example">
        {appearances.map((appearance) => (
          <div key={appearance} className="dropdown-button-appearance-example__column">
            <p className="dropdown-button-appearance-example__heading">{appearance}</p>
            <DropdownButton
              appearance={appearance}
              label="Sort by"
              value={sort}
              selectedOptions={[sort]}
              onOptionSelect={(_event, data) => setSort(data.optionValue ?? sort)}
            >
              {sortOptions.map((option) => (
                <Option key={option}>{option}</Option>
              ))}
            </DropdownButton>
          </div>
        ))}
      </div>
    </>
  );
};

const shapes = ['rounded', 'circular', 'square'] as const;

export const Shape = () => {
  const [sort, setSort] = React.useState('Newest');

  const styles = /* css */ `
    .dropdown-button-shape-example {
      display: flex;
      flex-direction: column;
      column-gap: var(--spacingHorizontalXXL);
      row-gap: var(--spacingVerticalL);
      align-items: flex-start;
      padding: var(--spacingVerticalL);
    }

    .dropdown-button-shape-example__column {
      display: flex;
      flex-direction: column;
      row-gap: var(--spacingVerticalS);
      align-items: flex-start;
    }

    .dropdown-button-shape-example__heading {
      margin: 0;
      font-size: var(--fontSizeBase200);
      color: var(--colorNeutralForeground3);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="dropdown-button-shape-example">
        {shapes.map((shape) => (
          <div key={shape} className="dropdown-button-shape-example__column">
            <p className="dropdown-button-shape-example__heading">{shape}</p>
            <DropdownButton
              shape={shape}
              label="Sort by"
              value={sort}
              selectedOptions={[sort]}
              onOptionSelect={(_event, data) => setSort(data.optionValue ?? sort)}
            >
              {sortOptions.map((option) => (
                <Option key={option}>{option}</Option>
              ))}
            </DropdownButton>
          </div>
        ))}
      </div>
    </>
  );
};

const sizes = ['small', 'medium', 'large'] as const;

export const Size = () => {
  const [sort, setSort] = React.useState('Newest');

  const styles = /* css */ `
    .dropdown-button-size-example {
      display: flex;
      flex-direction: column;
      column-gap: var(--spacingHorizontalXXL);
      row-gap: var(--spacingVerticalL);
      align-items: flex-start;
      padding: var(--spacingVerticalL);
    }

    .dropdown-button-size-example__column {
      display: flex;
      flex-direction: column;
      row-gap: var(--spacingVerticalS);
      align-items: flex-start;
    }

    .dropdown-button-size-example__heading {
      margin: 0;
      font-size: var(--fontSizeBase200);
      color: var(--colorNeutralForeground3);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="dropdown-button-size-example">
        {sizes.map((size) => (
          <div key={size} className="dropdown-button-size-example__column">
            <p className="dropdown-button-size-example__heading">{size}</p>
            <DropdownButton
              size={size}
              label="Sort by"
              value={sort}
              selectedOptions={[sort]}
              onOptionSelect={(_event, data) => setSort(data.optionValue ?? sort)}
            >
              {sortOptions.map((option) => (
                <Option key={option}>{option}</Option>
              ))}
            </DropdownButton>
          </div>
        ))}
      </div>
    </>
  );
};

export const Disabled = () => {
  const styles = /* css */ `
    .dropdown-button-disabled-example {
      display: flex;
      flex-direction: column;
      column-gap: var(--spacingHorizontalXXL);
      row-gap: var(--spacingVerticalL);
      align-items: flex-start;
      padding: var(--spacingVerticalL);
    }

    .dropdown-button-disabled-example__column {
      display: flex;
      flex-direction: column;
      row-gap: var(--spacingVerticalS);
      align-items: flex-start;
    }

    .dropdown-button-disabled-example__heading {
      margin: 0;
      font-size: var(--fontSizeBase200);
      color: var(--colorNeutralForeground3);
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="dropdown-button-disabled-example">
        {appearances.map((appearance) => (
          <div key={appearance} className="dropdown-button-disabled-example__column">
            <p className="dropdown-button-disabled-example__heading">{appearance}</p>
            <DropdownButton
              appearance={appearance}
              label="Sort by"
              disabled
              value="Newest"
              selectedOptions={['Newest']}
              onOptionSelect={() => undefined}
            >
              {sortOptions.map((option) => (
                <Option key={option}>{option}</Option>
              ))}
            </DropdownButton>
          </div>
        ))}
      </div>
    </>
  );
};

export default {
  title: 'Components/Button/DropdownButton',
  component: DropdownButton,
};
