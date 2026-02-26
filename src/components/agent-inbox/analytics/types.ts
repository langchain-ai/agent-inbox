export type AnalyticsEventType =
  | "accept"
  | "edit"
  | "response"
  | "ignore"
  | "resolve";

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  threadId: string;
  timestamp: number;
}

export type AnalyticsEventCounts = Record<AnalyticsEventType, number>;

export interface AnalyticsBackend {
  saveEvent(event: AnalyticsEvent): void;
  getEvents(): AnalyticsEvent[];
  getEventCounts(): AnalyticsEventCounts;
  clearEvents(): void;
}
