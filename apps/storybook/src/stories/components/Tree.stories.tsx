// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  FlatTree,
  FlatTreeItem,
  Tree,
  TreeItem,
  TreeItemLayout,
  TreeItemPersonaLayout,
  type JSXElement,
} from '@coreai-ds/react-components';
import { figmaDesign } from '../../utils/figma';

import * as React from 'react';

export const Default = (): JSXElement => {
  return (
    <Tree aria-label="Default">
      <TreeItem itemType="branch">
        <TreeItemLayout>level 1, item 1</TreeItemLayout>
        <Tree>
          <TreeItem itemType="leaf">
            <TreeItemLayout>level 2, item 1</TreeItemLayout>
          </TreeItem>
          <TreeItem itemType="leaf">
            <TreeItemLayout>level 2, item 2</TreeItemLayout>
          </TreeItem>
          <TreeItem itemType="leaf">
            <TreeItemLayout>level 2, item 3</TreeItemLayout>
          </TreeItem>
        </Tree>
      </TreeItem>
      <TreeItem itemType="branch">
        <TreeItemLayout>level 1, item 2</TreeItemLayout>
        <Tree>
          <TreeItem itemType="branch">
            <TreeItemLayout>level 2, item 1</TreeItemLayout>
            <Tree>
              <TreeItem itemType="leaf">
                <TreeItemLayout>level 3, item 1</TreeItemLayout>
              </TreeItem>
            </Tree>
          </TreeItem>
        </Tree>
      </TreeItem>
      <TreeItem itemType="leaf">
        <TreeItemLayout>level 1, item 3</TreeItemLayout>
      </TreeItem>
    </Tree>
  );
};

/**
 * A hierarchical list structure component for displaying data in a collapsible and expandable way.
 *
 * Use this component when you need to present your users with a clear visual structure of content or data, allowing them to efficiently interact and navigate through the information. If the information is less hierarchical or node-based, consider using a list or table instead.
 *
 * @summary Hierarchical, collapsible list for displaying nested data. Subcomponents: Tree, TreeItem, TreeItemLayout, TreeItemPersonaLayout, FlatTree, FlatTreeItem.
 */
export default {
  title: 'Components/Tree',
  component: Tree,
  subcomponents: { Tree, TreeItem, TreeItemLayout, TreeItemPersonaLayout, FlatTree, FlatTreeItem },
  parameters: {
    ...figmaDesign('Tree item'),
  },
};
