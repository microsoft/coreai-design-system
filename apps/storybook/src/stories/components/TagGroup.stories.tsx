// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { InteractionTag, InteractionTagPrimary, Tag, TagGroup } from '@coreai-ds/react-components';
import type { StoryObj } from '@storybook/react-vite';

/**
 * Compares a group of static tags with a group of interactive tags.
 */
export const Default: StoryObj = {
  render: () => {
    const styles = /* css */ `
      .tag-group-default-example {
        display: flex;
        flex-direction: column;
        row-gap: 10px;
      }
    `;

    return (
      <>
        <style>{styles}</style>
        <div className="tag-group-default-example">
          Example with Tag:
          <TagGroup aria-label="Simple tag group with Tag" role="list">
            <Tag role="listitem">Tag 1</Tag>
            <Tag role="listitem">Tag 2</Tag>
            <Tag role="listitem">Tag 3</Tag>
          </TagGroup>
          Example with InteractionTag:
          <TagGroup aria-label="Simple tag group with InteractionTag">
            <InteractionTag>
              <InteractionTagPrimary>Tag 1</InteractionTagPrimary>
            </InteractionTag>
            <InteractionTag>
              <InteractionTagPrimary>Tag 2</InteractionTagPrimary>
            </InteractionTag>
            <InteractionTag>
              <InteractionTagPrimary>Tag 3</InteractionTagPrimary>
            </InteractionTag>
          </TagGroup>
        </div>
      </>
    );
  },
};

/**
 * A TagGroup is a container for multiple controls that are Tag or InteractionTag.
 *
 * @summary Container for multiple Tag or InteractionTag controls.
 */
export default {
  title: 'Components/Tag/TagGroup',
  component: TagGroup,
};
