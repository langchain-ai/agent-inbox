import { Thread } from "@langchain/langgraph-sdk";
import { StateView } from "./components/state-view";
import { ThreadActionsView } from "./components/thread-actions-view";
import { useThreadsContext } from "./contexts/ThreadContext";
import { HumanInterrupt, ThreadData } from "./types";
import React from "react";
import { cn } from "@/lib/utils";
import { useQueryParams } from "./hooks/use-query-params";
import { VIEW_STATE_THREAD_QUERY_PARAM } from "./constants";
import { isAgentInboxInterruptSchema } from "./utils/schema-validation";
import { RawJsonInterruptView } from "./components/raw-json-interrupt-view";
import { useToast } from "@/hooks/use-toast";

export function ThreadView<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({ threadId }: { threadId: string }) {
  const { updateQueryParams } = useQueryParams();
  const { threadData: threads, loading } = useThreadsContext<ThreadValues>();
  const [threadData, setThreadData] =
    React.useState<ThreadData<ThreadValues>>();
  const [showDescription, setShowDescription] = React.useState(true);
  const [showState, setShowState] = React.useState(false);
  const [showSidePanel, setShowSidePanel] = React.useState(true);
  const [isAgentInboxSchema, setIsAgentInboxSchema] = React.useState(true);
  const { toast } = useToast();

  // Scroll to top when thread view is mounted
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

  React.useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (!threadId || !threads.length || loading) return;
      const selectedThread = threads.find(
        (t) => t.thread.thread_id === threadId
      );

      if (selectedThread) {
        setThreadData(selectedThread);

        // Check if the interrupt matches the agent inbox schema
        if (selectedThread.interrupts && selectedThread.interrupts.length > 0) {
          try {
            const isValidSchema = isAgentInboxInterruptSchema(
              selectedThread.interrupts
            );
            setIsAgentInboxSchema(isValidSchema);

            // For non-agent inbox interrupts, always show state by default
            if (!isValidSchema) {
              setShowDescription(false);
              setShowState(true);
              setShowSidePanel(true);

              toast({
                title: "Non-standard interrupt format",
                description:
                  "This interrupt doesn't match the agent inbox schema, showing raw payload instead.",
                variant: "default",
                duration: 3000,
              });
            }
          } catch (error) {
            console.error("Error validating interrupt schema:", error);
            setIsAgentInboxSchema(false);
            setShowDescription(false);
            setShowState(true);
            setShowSidePanel(true);
          }
        }
        return;
      } else {
        // Route the user back to the inbox view.
        updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM);
      }
    } catch (e) {
      console.error("Error updating query params & setting thread data", e);
    }
  }, [threads, loading, threadId, toast]);

  const handleShowSidePanel = (
    showState: boolean,
    showDescription: boolean
  ) => {
    if (showState && showDescription) {
      console.error("Cannot show both state and description");
      return;
    }

    // If both are false, we're hiding the panel
    const newShowSidePanel = showState || showDescription;
    setShowSidePanel(newShowSidePanel);

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

  if (
    !threadData ||
    threadData.status !== "interrupted" ||
    !threadData.interrupts ||
    threadData.interrupts.length === 0
  ) {
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
        {isAgentInboxSchema ? (
          <ThreadActionsView<ThreadValues>
            threadData={
              threadData as {
                thread: Thread<ThreadValues>;
                status: "interrupted";
                interrupts: HumanInterrupt[];
              }
            }
            setThreadData={setThreadData}
            handleShowSidePanel={handleShowSidePanel}
            showState={showState}
            showDescription={showDescription}
          />
        ) : (
          <RawJsonInterruptView<ThreadValues>
            threadData={
              threadData as {
                thread: Thread<ThreadValues>;
                status: "interrupted";
                interrupts: any[];
              }
            }
            handleShowSidePanel={handleShowSidePanel}
          />
        )}
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
          isAgentInboxSchema={isAgentInboxSchema}
        />
      </div>
    </div>
  );
}
