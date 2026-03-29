import {
  ThreadData,
  ThreadStatusWithAll,
  InterruptedThreadData,
} from "../types";
import { useQueryParams } from "../hooks/use-query-params";
import { InterruptedInboxItem } from "./interrupted-inbox-item";
import { GenericInboxItem } from "./generic-inbox-item";
import { INBOX_PARAM } from "../constants";

interface InboxItemProps<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData: ThreadData<ThreadValues>;
  isLast: boolean;
  isFocused?: boolean;
  onThreadClick?: (id: string) => void;
}

export function InboxItem<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({ threadData, isLast, isFocused, onThreadClick }: InboxItemProps<ThreadValues>) {
  const { searchParams } = useQueryParams();

  const inbox = (searchParams.get(INBOX_PARAM) ||
    "interrupted") as ThreadStatusWithAll;

  if (inbox === "all") {
    if (threadData.status === "interrupted") {
      const interruptedData = threadData as InterruptedThreadData<ThreadValues>;
      if (interruptedData.interrupts?.length) {
        return (
          <InterruptedInboxItem
            threadData={interruptedData}
            isLast={isLast}
            isFocused={isFocused}
            onThreadClick={onThreadClick || (() => {})}
          />
        );
      } else {
        return (
          <GenericInboxItem
            threadData={{
              thread: interruptedData.thread,
              status: "interrupted",
              interrupts: undefined,
            }}
            isLast={isLast}
            isFocused={isFocused}
          />
        );
      }
    } else {
      // Convert human_response_needed to idle for GenericInboxItem
      const adaptedStatus =
        threadData.status === "human_response_needed"
          ? "idle"
          : threadData.status;

      return (
        <GenericInboxItem
          threadData={{
            thread: threadData.thread,
            status: adaptedStatus,
          }}
          isLast={isLast}
          isFocused={isFocused}
        />
      );
    }
  }

  if (inbox === "interrupted" && threadData.status === "interrupted") {
    const interruptedData = threadData as InterruptedThreadData<ThreadValues>;
    if (interruptedData.interrupts?.length) {
      return (
        <InterruptedInboxItem
          threadData={interruptedData}
          isLast={isLast}
          isFocused={isFocused}
          onThreadClick={onThreadClick || (() => {})}
        />
      );
    } else {
      return (
        <GenericInboxItem
          threadData={{
            thread: interruptedData.thread,
            status: "interrupted",
            interrupts: undefined,
          }}
          isLast={isLast}
          isFocused={isFocused}
        />
      );
    }
  }

  if (inbox !== "interrupted" && threadData.status !== "interrupted") {
    // Convert human_response_needed to idle for GenericInboxItem
    const adaptedStatus =
      threadData.status === "human_response_needed"
        ? "idle"
        : threadData.status;

    return (
      <GenericInboxItem
        threadData={{
          thread: threadData.thread,
          status: adaptedStatus,
        }}
        isLast={isLast}
        isFocused={isFocused}
      />
    );
  }

  return null;
}
