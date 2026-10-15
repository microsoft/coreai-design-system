// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as React from 'react';
import { LinkButton, Text } from '@coreai-ds/react-components';
import { getPage, type Anchor } from '../data/registry';

export function PageLayout({
  id,
  actions,
  hideTitle,
  title,
  summary,
  children,
}: {
  id: string;
  actions?: React.ReactNode;
  hideTitle?: boolean;
  title?: string;
  summary?: string;
  children?: React.ReactNode;
}) {
  const page = getPage(id);
  const resolvedTitle = title ?? page?.title;
  const resolvedSummary = summary ?? page?.summary;
  const supportsToc = id === 'faqs';
  const mainRef = React.useRef<HTMLElement>(null);
  const selectedSectionRef = React.useRef<string | null>(null);
  const scrollingToSectionRef = React.useRef(false);
  const [toc, setToc] = React.useState<{
    pageId: string;
    anchors: Anchor[];
    activeId: string;
  }>({ pageId: '', anchors: [], activeId: '' });

  React.useEffect(() => {
    const main = mainRef.current;
    const scrollRegion = main?.closest<HTMLDivElement>('.app-page');
    if (!main || !scrollRegion || !page || !supportsToc) {
      return;
    }

    const sections = page.anchors.flatMap((anchor) => {
      const element = document.getElementById(anchor.id);
      return element && main.contains(element) ? [{ anchor, element }] : [];
    });
    const anchors = sections.map(({ anchor }) => anchor);
    let frame = 0;
    const updateActiveSection = () => {
      frame = 0;
      const top = scrollRegion.getBoundingClientRect().top + 33;
      let activeId = anchors[0]?.id ?? '';
      for (const { anchor, element } of sections) {
        if (element.getBoundingClientRect().top <= top) {
          activeId = anchor.id;
        }
      }
      if (
        scrollRegion.scrollHeight > scrollRegion.clientHeight + 1 &&
        scrollRegion.scrollTop + scrollRegion.clientHeight >= scrollRegion.scrollHeight - 2
      ) {
        activeId = anchors[anchors.length - 1]?.id ?? '';
      }
      const selected = sections.find(({ anchor }) => anchor.id === selectedSectionRef.current);
      if (selected) {
        // Several sections can share the same clamped scroll position near the page end.
        const destination = Math.max(
          0,
          Math.min(
            scrollRegion.scrollHeight - scrollRegion.clientHeight,
            scrollRegion.scrollTop +
              selected.element.getBoundingClientRect().top -
              scrollRegion.getBoundingClientRect().top -
              32,
          ),
        );
        if (scrollingToSectionRef.current || Math.abs(scrollRegion.scrollTop - destination) <= 2) {
          activeId = selected.anchor.id;
        } else {
          selectedSectionRef.current = null;
        }
      }
      setToc((previous) =>
        previous.pageId === id && previous.activeId === activeId
          ? previous
          : { pageId: id, anchors, activeId },
      );
    };
    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(updateActiveSection);
    };
    const followHash = () => {
      selectedSectionRef.current =
        sections.find(({ anchor }) => window.location.hash === `#${encodeURIComponent(anchor.id)}`)
          ?.anchor.id ?? null;
      scrollingToSectionRef.current = selectedSectionRef.current !== null;
      scheduleUpdate();
    };
    const finishScroll = () => {
      scrollingToSectionRef.current = false;
      scheduleUpdate();
    };
    const interruptScroll = () => {
      scrollingToSectionRef.current = false;
      selectedSectionRef.current = null;
      scheduleUpdate();
    };
    const handleScrollKey = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) {
        interruptScroll();
      }
    };
    updateActiveSection();
    scrollRegion.addEventListener('scroll', scheduleUpdate, { passive: true });
    scrollRegion.addEventListener('scrollend', finishScroll);
    scrollRegion.addEventListener('wheel', interruptScroll, { passive: true });
    scrollRegion.addEventListener('touchstart', interruptScroll, { passive: true });
    scrollRegion.addEventListener('pointerdown', interruptScroll);
    scrollRegion.addEventListener('keydown', handleScrollKey);
    window.addEventListener('hashchange', followHash);
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(main);
    resizeObserver.observe(scrollRegion);
    return () => {
      cancelAnimationFrame(frame);
      scrollRegion.removeEventListener('scroll', scheduleUpdate);
      scrollRegion.removeEventListener('scrollend', finishScroll);
      scrollRegion.removeEventListener('wheel', interruptScroll);
      scrollRegion.removeEventListener('touchstart', interruptScroll);
      scrollRegion.removeEventListener('pointerdown', interruptScroll);
      scrollRegion.removeEventListener('keydown', handleScrollKey);
      window.removeEventListener('hashchange', followHash);
      selectedSectionRef.current = null;
      scrollingToSectionRef.current = false;
      resizeObserver.disconnect();
    };
  }, [id, page, supportsToc]);

  React.useLayoutEffect(() => {
    if (!supportsToc || toc.pageId !== id) {
      return;
    }
    const anchor = page?.anchors.find(
      (anchor) => window.location.hash === `#${encodeURIComponent(anchor.id)}`,
    );
    if (anchor) {
      selectedSectionRef.current = anchor.id;
      document.getElementById(anchor.id)?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }, [id, page, supportsToc, toc.pageId]);

  React.useEffect(() => {
    document.title = resolvedTitle ? `${resolvedTitle} | CoreAI` : 'CoreAI';
    document.body.dataset.pageId = id;
    return () => {
      delete document.body.dataset.pageId;
    };
  }, [resolvedTitle, id]);

  if (!page) {
    return null;
  }

  const showTitle = !hideTitle;
  const hasHeader = showTitle || Boolean(resolvedSummary) || Boolean(actions);
  const hasContent = React.Children.count(children) > 0;

  const content = (
    <main id="main-content" className="site-main" tabIndex={-1} ref={mainRef}>
      {hasHeader ? (
        <div className="page-header">
          {showTitle || actions ? (
            <div className="page-header__title-row">
              {showTitle ? (
                <Text as="h1" size={900} weight="regular">
                  {resolvedTitle}
                </Text>
              ) : null}
              {actions}
            </div>
          ) : null}
          {resolvedSummary && id !== 'faqs' ? (
            <Text as="p" className="page-summary" size={400} foreground={3}>
              {resolvedSummary}
            </Text>
          ) : null}
        </div>
      ) : null}

      {hasContent ? <div className="page-content">{children}</div> : null}
    </main>
  );

  if (!supportsToc) {
    return content;
  }

  const hasToc = toc.pageId === id && toc.anchors.length > 1;
  return (
    <div className={hasToc ? 'page-layout page-layout--with-toc' : 'page-layout'}>
      {content}
      {hasToc ? (
        <nav className="page-toc" aria-label="On this page">
          <Text as="p" size={200} weight="semibold" foreground={3}>
            On this page
          </Text>
          <ul className="page-toc__list">
            {toc.anchors.map((anchor) => (
              <li key={anchor.id}>
                <LinkButton
                  href={`#${anchor.id}`}
                  appearance="subtle"
                  shape="rounded"
                  size="medium"
                  className="page-toc__link"
                  aria-current={toc.activeId === anchor.id ? 'location' : undefined}
                  onClick={(event) => {
                    if (
                      event.button !== 0 ||
                      event.metaKey ||
                      event.ctrlKey ||
                      event.shiftKey ||
                      event.altKey
                    ) {
                      return;
                    }
                    selectedSectionRef.current = anchor.id;
                    scrollingToSectionRef.current = true;
                    setToc((previous) => ({ ...previous, activeId: anchor.id }));
                  }}
                >
                  {anchor.label}
                </LinkButton>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
