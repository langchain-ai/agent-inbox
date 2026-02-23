import { ANALYTICS_EVENTS_LOCAL_STORAGE_KEY } from "../constants";
import type {
  AnalyticsBackend,
  AnalyticsEvent,
  AnalyticsEventCounts,
  AnalyticsEventType,
} from "./types";

const ALL_EVENT_TYPES: AnalyticsEventType[] = [
  "accept",
  "edit",
  "response",
  "ignore",
  "resolve",
];

const emptyCounts = (): AnalyticsEventCounts =>
  Object.fromEntries(ALL_EVENT_TYPES.map((t) => [t, 0])) as AnalyticsEventCounts;

export const localStorageBackend: AnalyticsBackend = {
  saveEvent(event: AnalyticsEvent): void {
    if (typeof window === "undefined") return;
    const events = this.getEvents();
    events.push(event);
    localStorage.setItem(
      ANALYTICS_EVENTS_LOCAL_STORAGE_KEY,
      JSON.stringify(events),
    );
  },

  getEvents(): AnalyticsEvent[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(ANALYTICS_EVENTS_LOCAL_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
    } catch {
      return [];
    }
  },

  getEventCounts(): AnalyticsEventCounts {
    const counts = emptyCounts();
    for (const event of this.getEvents()) {
      if (event.type in counts) {
        counts[event.type]++;
      }
    }
    return counts;
  },

  clearEvents(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ANALYTICS_EVENTS_LOCAL_STORAGE_KEY);
  },
};
