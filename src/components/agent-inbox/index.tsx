import React from "react";
import { useQueryParams } from "./hooks/use-query-params";
import { INBOX_PARAM, VIEW_STATE_THREAD_QUERY_PARAM } from "./constants";
import { ThreadStatusWithAll } from "./types";
import { AgentInboxView } from "./inbox-view";
import { ThreadView } from "./thread-view";

export function AgentInbox<
  ThreadValues extends Record<string, any> = Record<string, any>,
>() {
  const { searchParams, updateQueryParams, getSearchParam } = useQueryParams();
  const [selectedInbox, setSelectedInbox] =
    React.useState<ThreadStatusWithAll>("interrupted");

  const selectedThreadIdParam = searchParams.get(VIEW_STATE_THREAD_QUERY_PARAM);
  const isStateViewOpen = !!selectedThreadIdParam;

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
      console.error("Error updating query params & setting inbox", e);
    }
  }, [searchParams]);

  if (isStateViewOpen) {
    return <ThreadView threadId={selectedThreadIdParam} />;
  }

  return <AgentInboxView<ThreadValues> />;
}
