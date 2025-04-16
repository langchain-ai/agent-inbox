import { StateView } from "./components/state-view";
import { ThreadActionsView } from "./components/thread-actions-view";
import { useThreadsContext } from "./contexts/ThreadContext";
import { ThreadData } from "./types";
import React from "react";
import { cn } from "@/lib/utils";
import { useQueryParams } from "./hooks/use-query-params";
import { VIEW_STATE_THREAD_QUERY_PARAM } from "./constants";

export function ThreadView<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({ threadId }: { threadId: string }) {
  const { updateQueryParams } = useQueryParams();
  const { threadData: threads, loading } = useThreadsContext<ThreadValues>();
  const [threadData, setThreadData] =
    React.useState<ThreadData<ThreadValues>>();
  const [showDescription, setShowDescription] = React.useState(false);
  const [showState, setShowState] = React.useState(false);
  const showSidePanel = showDescription || showState;

  React.useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (!threadId || !threads.length || loading) return;
      const selectedThread = threads.find(
        (t) => t.thread.thread_id === threadId
      );
      if (selectedThread) {
        setThreadData(selectedThread);
        // Keep description hidden by default
        setShowDescription(false);
        return;
      } else {
        // Route the user back to the inbox view.
        updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM);
      }
    } catch (e) {
      console.error("Error updating query params & setting thread data", e);
    }
  }, [threads, loading, threadId]);

  const handleShowSidePanel = (
    showState: boolean,
    showDescription: boolean
  ) => {
    if (showState && showDescription) {
      console.error("Cannot show both state and description");
      return;
    }
    if (showState) {
      setShowDescription(false);
      setShowState(true);
    } else if (showDescription) {
      setShowState(false);
      setShowDescription(true);
    } else {
      setShowState(false);
      setShowDescription(false);
    }
  };

  if (!threadData) {
    return null;
  }

  return (
    <div className="flex flex-col lg:flex-row w-full h-full">
      <div
        className={cn(
          "flex overflow-y-auto",
          showSidePanel ? "lg:min-w-1/2 lg:max-w-2xl w-full" : "w-full"
        )}
      >
        <ThreadActionsView<ThreadValues>
          threadData={threadData}
          setThreadData={setThreadData}
          handleShowSidePanel={handleShowSidePanel}
          showState={showState}
          showDescription={showDescription}
        />
      </div>
      <div
        className={cn(
          showSidePanel ? "flex" : "hidden",
          "overflow-y-auto lg:max-w-1/2 w-full"
        )}
      >
        <StateView
          handleShowSidePanel={handleShowSidePanel}
          threadData={threadData}
          view={showState ? "state" : "description"}
        />
      </div>
    </div>
  );
}
