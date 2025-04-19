import React from "react";
import { useQueryParams } from "./hooks/use-query-params";
import { INBOX_PARAM, VIEW_STATE_THREAD_QUERY_PARAM } from "./constants";
import { ThreadStatusWithAll } from "./types";
import { AgentInboxView } from "./inbox-view";
import { ThreadView } from "./thread-view";
import { useScrollPosition } from "./hooks/use-scroll-position";
import { usePathname, useSearchParams } from "next/navigation";
import { logger } from "./utils/logger";

export function AgentInbox<
  ThreadValues extends Record<string, any> = Record<string, any>,
>() {
  const { searchParams, updateQueryParams, getSearchParam } = useQueryParams();
  const [selectedInbox, setSelectedInbox] =
    React.useState<ThreadStatusWithAll>("interrupted");
  const { saveScrollPosition, restoreScrollPosition } = useScrollPosition();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedThreadIdParam = searchParams.get(VIEW_STATE_THREAD_QUERY_PARAM);
  const isStateViewOpen = !!selectedThreadIdParam;
  const prevIsStateViewOpen = React.useRef(false);

  // Need to track first render to avoid restoring scroll on initial page load
  const isFirstRender = React.useRef(true);

  // Track URL changes to detect when the thread ID changes (not just appears/disappears)
  const lastThreadId = React.useRef<string | null>(null);

  // Track navigation events using pathname and search params from Next.js
  const pathname = usePathname();
  const nextSearchParams = useSearchParams();
  const navigationSignature = `${pathname}?${nextSearchParams}`;
  const prevNavigationSignature = React.useRef("");

  // Effect to handle transitions between list and thread views
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Skip during first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevIsStateViewOpen.current = isStateViewOpen;
      lastThreadId.current = selectedThreadIdParam;
      prevNavigationSignature.current = navigationSignature;
      return;
    }

    // Case 1: Going from list view to thread view
    if (!prevIsStateViewOpen.current && isStateViewOpen) {
      // Try to save scroll position
      if (window.scrollY > 0) {
        saveScrollPosition(); // Save window scroll
      } else if (containerRef.current && containerRef.current.scrollTop > 0) {
        saveScrollPosition(containerRef.current);
      }
    }

    // Update previous state for next render
    prevIsStateViewOpen.current = isStateViewOpen;
    lastThreadId.current = selectedThreadIdParam;
    prevNavigationSignature.current = navigationSignature;
  }, [
    isStateViewOpen,
    selectedThreadIdParam,
    saveScrollPosition,
    navigationSignature,
  ]);

  // Dedicated effect for handling scroll restoration when returning to list view
  React.useLayoutEffect(() => {
    if (
      typeof window === "undefined" ||
      isFirstRender.current ||
      isStateViewOpen
    ) {
      return;
    }

    // Detect navigation (including back button) by checking URL changes
    const isNavigationEvent =
      prevNavigationSignature.current !== navigationSignature;

    // Only run when switching from thread view to list view
    if (
      (prevIsStateViewOpen.current && !isStateViewOpen) ||
      isNavigationEvent
    ) {
      // Use layout effect to run synchronously after DOM mutations but before browser paint
      if (containerRef.current) {
        restoreScrollPosition(containerRef.current);
      } else {
        // Fallback to window scroll
        restoreScrollPosition();
      }
    }
  }, [isStateViewOpen, restoreScrollPosition, navigationSignature]);

  React.useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const currentInbox = getSearchParam(INBOX_PARAM) as
        | ThreadStatusWithAll
        | undefined;
      if (!currentInbox) {
        // Set default inbox if none selected
        updateQueryParams(INBOX_PARAM, selectedInbox);
      } else {
        setSelectedInbox(currentInbox);
      }
    } catch (e) {
      logger.error("Error updating query params & setting inbox", e);
    }
  }, [searchParams]);

  if (isStateViewOpen) {
    return <ThreadView threadId={selectedThreadIdParam} />;
  }

  return (
    <AgentInboxView<ThreadValues>
      saveScrollPosition={saveScrollPosition}
      containerRef={containerRef}
    />
  );
}
