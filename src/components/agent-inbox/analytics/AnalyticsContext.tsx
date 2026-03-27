"use client";

import React from "react";
import type {
  AnalyticsBackend,
  AnalyticsEvent,
  AnalyticsEventCounts,
  AnalyticsEventType,
} from "./types";
import { localStorageBackend } from "./local-storage-backend";

interface AnalyticsContextValue {
  trackEvent: (type: AnalyticsEventType, threadId: string) => void;
  getEvents: () => AnalyticsEvent[];
  getEventCounts: () => AnalyticsEventCounts;
  clearEvents: () => void;
}

const AnalyticsContext = React.createContext<AnalyticsContextValue | undefined>(
  undefined,
);

export function AnalyticsProvider({
  children,
  backend = localStorageBackend,
}: {
  children: React.ReactNode;
  backend?: AnalyticsBackend;
}) {
  const trackEvent = React.useCallback(
    (type: AnalyticsEventType, threadId: string) => {
      backend.saveEvent({ type, threadId, timestamp: Date.now() });
    },
    [backend],
  );

  const getEvents = React.useCallback(() => backend.getEvents(), [backend]);

  const getEventCounts = React.useCallback(
    () => backend.getEventCounts(),
    [backend],
  );

  const clearEvents = React.useCallback(() => backend.clearEvents(), [backend]);

  const contextValue: AnalyticsContextValue = React.useMemo(
    () => ({ trackEvent, getEvents, getEventCounts, clearEvents }),
    [trackEvent, getEvents, getEventCounts, clearEvents],
  );

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = React.useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
}
