// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { makeStyles, mergeClasses, tokens } from '@coreai-ds/react-components';
import { ArrowUpRight16Regular } from '@fluentui/react-icons';
import { siteLinks } from '../../../../../shared/site-links';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    width: '100%',
    maxWidth: '920px',
    flexDirection: 'column',
    rowGap: '20px',
    paddingBottom: '48px',
    marginLeft: 'auto',
    marginRight: 'auto',
    '& a': {
      color: tokens.colorBrandForegroundLink,
    },
    '& a:hover': {
      color: tokens.colorBrandForegroundLinkHover,
    },
    '& a:active': {
      color: tokens.colorBrandForegroundLinkPressed,
    },
  },
  header: {
    display: 'flex',
    width: 'fit-content',
    flexDirection: 'column',
    alignItems: 'flex-start',
    '& > h1': {
      alignSelf: 'stretch',
      margin: 0,
      color: tokens.colorNeutralForeground1,
      fontFamily: tokens.fontFamilyBase,
      fontSize: '32px',
      fontWeight: tokens.fontWeightBold,
      letterSpacing: '-0.8px',
      lineHeight: '52px',
    },
    '& > p': {
      alignSelf: 'stretch',
      margin: 0,
      color: tokens.colorNeutralForeground2,
      fontFamily: tokens.fontFamilyBase,
      fontSize: tokens.fontSizeBase300,
      lineHeight: tokens.lineHeightBase400,
    },
  },
  callout: {
    padding: '10px 12px',
    color: tokens.colorNeutralForeground2,
    backgroundColor: tokens.colorBrandBackground2,
    border: `1px solid ${tokens.colorBrandStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
  },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '8px',
    '@media (max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
  card: {
    display: 'flex',
    minWidth: 0,
    flexDirection: 'column',
    rowGap: '6px',
    padding: '24px',
    backgroundColor: 'transparent',
    border: `1px solid ${tokens.colorNeutralStrokeAlpha}`,
    borderRadius: tokens.borderRadiusXLarge,
    '& > h2': {
      margin: 0,
      marginBottom: '8px',
      paddingBottom: '4px',
      color: tokens.colorNeutralForeground1,
      fontFamily: tokens.fontFamilyBase,
      fontSize: tokens.fontSizeBase600,
      fontWeight: tokens.fontWeightSemibold,
      lineHeight: tokens.lineHeightBase600,
      borderBottomStyle: 'none',
    },
  },
  cardWide: {
    gridColumnStart: 1,
    gridColumnEnd: -1,
    '@media (max-width: 720px)': {
      gridColumnStart: 'auto',
      gridColumnEnd: 'auto',
    },
  },
  resourceList: {
    display: 'flex',
    width: 'fit-content',
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: '16px',
  },
  resource: {
    display: 'flex',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: '3px',
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase400,
    textDecorationLine: 'underline',
    textDecorationThickness: '0.5px',
    textUnderlineOffset: '1.54px',
    ':focus-visible': {
      outline: `2px solid ${tokens.colorStrokeFocus2}`,
      outlineOffset: '2px',
    },
  },
  externalIcon: {
    width: '16px',
    height: '16px',
    flexShrink: 0,
  },
  description: {
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase400,
  },
  visuallyHidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
  },
});

interface Resource {
  title: string;
  description: string;
  href: string;
}

const designResources: Resource[] = [
  {
    title: 'Docsite',
    description: 'Design focused pattern guidance, content, color, etc',
    href: siteLinks.docsite,
  },
  {
    title: 'Figma library',
    description: 'Components and templates in Figma',
    href: siteLinks.figma,
  },
];

const developerResources: Resource[] = [
  {
    title: 'Package README',
    description: 'Package setup, API details, and extension guidance',
    href: siteLinks.packageReadme,
  },
  {
    title: 'npm package',
    description: 'Install the React components from npm',
    href: siteLinks.npmPackage,
  },
  {
    title: 'Changelog',
    description: 'Published package history',
    href: siteLinks.changelog,
  },
];

const communityResources: Resource[] = [
  {
    title: 'GitHub issues',
    description: 'Questions, bug reports, and feature requests.',
    href: siteLinks.contact,
  },
];

function ResourceLink({ resource }: { resource: Resource }) {
  const styles = useStyles();

  return (
    <div className={styles.resource}>
      <a className={styles.link} href={resource.href} target="_blank" rel="noopener noreferrer">
        {resource.title}
        <ArrowUpRight16Regular className={styles.externalIcon} aria-hidden />
        <span className={styles.visuallyHidden}> (opens in new tab)</span>
      </a>
      <span className={styles.description}>{resource.description}</span>
    </div>
  );
}

function ResourceCard({
  title,
  resources,
  wide = false,
}: {
  title: string;
  resources: Resource[];
  wide?: boolean;
}) {
  const styles = useStyles();

  return (
    <section className={mergeClasses(styles.card, wide && styles.cardWide)}>
      <h2>{title}</h2>
      <div className={styles.resourceList}>
        {resources.map((resource) => (
          <ResourceLink key={resource.title} resource={resource} />
        ))}
      </div>
    </section>
  );
}

export function IntroductionPage() {
  const styles = useStyles();

  return (
    <main className={styles.root}>
      <header className={styles.header}>
        <h1>CoreAI Design System</h1>
        <p>
          Fluent UI v9 themes, defaults, components, templates, and patterns for CoreAI products.
        </p>
      </header>

      <aside className={styles.callout}>
        Using an AI coding agent? Connect the component-docs server with{' '}
        <a className={styles.link} href="?path=/docs/docs-mcp-setup--docs">
          Docs / MCP Setup
        </a>
        .
      </aside>

      <div className={styles.cards}>
        <ResourceCard title="Design" resources={designResources} />
        <ResourceCard title="Develop" resources={developerResources} />
        <ResourceCard title="Connect" resources={communityResources} wide />
      </div>
    </main>
  );
}
