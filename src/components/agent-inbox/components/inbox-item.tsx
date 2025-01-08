import { HumanInterrupt, ThreadData, ThreadStatusWithAll } from "../types";
import React from "react";
import { useQueryParams } from "../hooks/use-query-params";
import { InterruptedInboxItem } from "./interrupted-inbox-item";
import { GenericInboxItem } from "./generic-inbox-item";
import { INBOX_PARAM } from "../constants";

interface InboxItemProps<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData: ThreadData<ThreadValues>;
  isLast: boolean;
}

export function InboxItem<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({ threadData, isLast }: InboxItemProps<ThreadValues>) {
  const { searchParams } = useQueryParams();

  const inbox = (searchParams.get(INBOX_PARAM) ||
    "interrupted") as ThreadStatusWithAll;

  if (inbox === "all") {
    if (threadData.status === "interrupted") {
      if (threadData.interrupts?.length) {
        return (
          <InterruptedInboxItem
            threadData={
              threadData as ThreadData<ThreadValues> & {
                interrupts: HumanInterrupt[];
              }
            }
            isLast={isLast}
          />
        );
      } else {
        return (
          <GenericInboxItem
            threadData={
              threadData as ThreadData<ThreadValues> & { interrupts: undefined }
            }
            isLast={isLast}
          />
        );
      }
    } else {
      return <GenericInboxItem threadData={threadData} isLast={isLast} />;
    }
  }

  if (inbox === "interrupted" && threadData.status === "interrupted") {
    if (threadData.interrupts?.length) {
      return (
        <InterruptedInboxItem
          threadData={
            threadData as ThreadData<ThreadValues> & {
              interrupts: HumanInterrupt[];
            }
          }
          isLast={isLast}
        />
      );
    } else {
      return (
        <GenericInboxItem
          threadData={
            threadData as ThreadData<ThreadValues> & { interrupts: undefined }
          }
          isLast={isLast}
        />
      );
    }
  }

  if (inbox !== "interrupted" && threadData.status !== "interrupted") {
    return <GenericInboxItem threadData={threadData} isLast={isLast} />;
  }

  return null;
}
