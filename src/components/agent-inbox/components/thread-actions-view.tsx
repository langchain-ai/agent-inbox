import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, AlertTriangle, ClockIcon } from "lucide-react";
import { ThreadData } from "../types";
import { constructOpenInStudioURL } from "../utils";
import { ThreadIdCopyable } from "./thread-id";
import { InboxItemInput } from "./inbox-item-input";
import useInterruptedActions from "../hooks/use-interrupted-actions";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { VIEW_STATE_THREAD_QUERY_PARAM } from "../constants";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQueryParams } from "../hooks/use-query-params";
import { useThreadsContext } from "../contexts/ThreadContext";
import { useState } from "react";

interface ThreadActionsViewProps<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData: ThreadData<ThreadValues>;
  setThreadData: React.Dispatch<
    React.SetStateAction<ThreadData<ThreadValues> | undefined>
  >;
  handleShowSidePanel: (showState: boolean, showDescription: boolean) => void;
  showState: boolean;
  showDescription: boolean;
}

function ButtonGroup({
  handleShowState,
  handleShowDescription,
  showingState,
  showingDescription,
}: {
  handleShowState: () => void;
  handleShowDescription: () => void;
  showingState: boolean;
  showingDescription: boolean;
  isInterrupted: boolean;
}) {
  return (
    <div className="flex flex-row gap-0 items-center justify-center">
      <Button
        variant="outline"
        className={cn(
          "rounded-l-md rounded-r-none border-r-[0px]",
          showingState ? "text-black" : "bg-white"
        )}
        size="sm"
        onClick={handleShowState}
      >
        State
      </Button>
      <Button
        variant="outline"
        className={cn(
          "rounded-l-none rounded-r-md border-l-[0px]",
          showingDescription ? "text-black" : "bg-white"
        )}
        size="sm"
        onClick={handleShowDescription}
      >
        Description
      </Button>
    </div>
  );
}

// Export the ButtonGroup component for reuse
export { ButtonGroup };

export function ThreadActionsView<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({
  threadData,
  setThreadData,
  handleShowSidePanel,
  showDescription,
  showState,
}: ThreadActionsViewProps<ThreadValues>) {
  const { agentInboxes, fetchSingleThread } = useThreadsContext<ThreadValues>();
  const { toast } = useToast();
  const { updateQueryParams } = useQueryParams();
  const [refreshing, setRefreshing] = useState(false);

  // Only use interrupted actions for interrupted threads
  const isInterrupted =
    threadData.status === "interrupted" &&
    threadData.interrupts !== undefined &&
    threadData.interrupts.length > 0;

  // Initialize the hook outside of conditional to satisfy React rules of hooks
  // Pass null values when not needed
  const interruptedActions = useInterruptedActions<ThreadValues>({
    threadData: isInterrupted
      ? {
          thread: threadData.thread,
          status: "interrupted",
          interrupts: threadData.interrupts || [],
        }
      : null,
    setThreadData: isInterrupted ? setThreadData : null,
  });

  const deploymentUrl = agentInboxes.find((i) => i.selected)?.deploymentUrl;

  const handleOpenInStudio = () => {
    if (!deploymentUrl) {
      toast({
        title: "Error",
        description: "Please set the LangGraph deployment URL in settings.",
        duration: 5000,
      });
      return;
    }

    const studioUrl = constructOpenInStudioURL(
      deploymentUrl,
      threadData.thread.thread_id
    );
    window.open(studioUrl, "_blank");
  };

  const handleRefreshThread = async () => {
    if (!deploymentUrl) {
      toast({
        title: "Error",
        description: "Please set the LangGraph deployment URL in settings.",
        duration: 5000,
      });
      return;
    }

    setRefreshing(true);
    try {
      toast({
        title: "Refreshing thread",
        description: "Checking for updates to the thread status...",
        duration: 3000,
      });

      // Fetch the latest thread data using the ThreadsContext
      const updatedThreadData = await fetchSingleThread(
        threadData.thread.thread_id
      );

      if (!updatedThreadData) {
        throw new Error("Failed to fetch updated thread data");
      }

      // Update the local state with the fresh thread data
      setThreadData((prevThreadData) => {
        if (!prevThreadData || !updatedThreadData) return prevThreadData;

        // Create the new thread data with the correct type
        if (updatedThreadData.status === "interrupted") {
          return {
            thread: updatedThreadData.thread,
            status: "interrupted" as const,
            interrupts: updatedThreadData.interrupts,
          };
        } else {
          return {
            thread: updatedThreadData.thread,
            status: updatedThreadData.status,
          };
        }
      });

      toast({
        title: "Thread refreshed",
        description: "Thread information has been updated.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error refreshing thread:", error);
      toast({
        title: "Error",
        description: "Failed to refresh thread information.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setRefreshing(false);
    }
  };

  const threadTitle =
    isInterrupted && threadData.interrupts
      ? threadData.interrupts[0]?.action_request?.action || "Thread"
      : `Thread (${threadData.status})`;

  const actionsDisabled = isInterrupted
    ? interruptedActions?.loading || interruptedActions?.streaming
    : false;

  const ignoreAllowed =
    isInterrupted && threadData.interrupts
      ? threadData.interrupts[0].config.allow_ignore
      : false;

  const getStatusIcon = () => {
    switch (threadData.status) {
      case "idle":
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
      case "busy":
        return <RefreshCw className="w-5 h-5 text-blue-500" />;
      case "error":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-full w-full p-12 gap-9">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between w-full gap-3">
        <div className="flex items-center justify-start gap-3">
          <TooltipIconButton
            tooltip="Back to inbox"
            variant="ghost"
            onClick={() => {
              updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM);
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </TooltipIconButton>
          <div className="flex items-center gap-2">
            {!isInterrupted && getStatusIcon()}
            <p className="text-2xl tracking-tighter text-pretty">
              {threadTitle}
            </p>
          </div>
          <ThreadIdCopyable threadId={threadData.thread.thread_id} />
        </div>
        <div className="flex flex-row gap-2 items-center justify-start">
          {deploymentUrl && (
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1 bg-white"
              onClick={handleOpenInStudio}
            >
              Studio
            </Button>
          )}
          <ButtonGroup
            handleShowState={() => handleShowSidePanel(true, false)}
            handleShowDescription={() => handleShowSidePanel(false, true)}
            showingState={showState}
            showingDescription={showDescription}
            isInterrupted={isInterrupted}
          />
        </div>
      </div>

      {/* Non-interrupted thread actions */}
      {!isInterrupted && (
        <div className="flex flex-col gap-6">
          {/* Status-specific UI */}
          {(threadData.status === "idle" || threadData.status === "busy") && (
            <div className="flex flex-row gap-2 items-center justify-start w-full">
              <Button
                variant="outline"
                className="text-gray-800 border-gray-500 font-normal bg-white flex items-center gap-2"
                onClick={handleRefreshThread}
                disabled={refreshing}
              >
                <RefreshCw
                  className={cn("w-4 h-4", refreshing && "animate-spin")}
                />
                {refreshing ? "Refreshing..." : "Refresh Thread Status"}
              </Button>
            </div>
          )}

          {threadData.status === "error" && (
            <div className="p-4 border border-red-200 bg-red-50 rounded-md">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800">Error State</h3>
                  <p className="text-sm text-red-700 mt-1">
                    This thread is in an error state. You may need to check the
                    logs or retry the operation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Thread information summary */}
          <div className="flex flex-col gap-3 p-4 border border-gray-200 rounded-md bg-gray-50">
            <h3 className="font-medium">Thread Details</h3>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className="ml-2 capitalize">{threadData.status}</span>
              </div>

              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <span className="ml-2">
                  {new Date(threadData.thread.created_at).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="font-medium text-gray-700">Last updated:</span>
                <span className="ml-2">
                  {new Date(threadData.thread.updated_at).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="font-medium text-gray-700">ID:</span>
                <span className="ml-2 font-mono text-xs">
                  {threadData.thread.thread_id}
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            View the thread state in the &quot;State&quot; tab for detailed
            information about this thread.
          </p>
        </div>
      )}

      {isInterrupted && threadData.interrupts && (
        <>
          <div className="flex flex-row gap-2 items-center justify-start w-full">
            <Button
              variant="outline"
              className="text-gray-800 border-gray-500 font-normal bg-white"
              onClick={interruptedActions?.handleResolve}
              disabled={actionsDisabled}
            >
              Mark as Resolved
            </Button>
            {ignoreAllowed && (
              <Button
                variant="outline"
                className="text-gray-800 border-gray-500 font-normal bg-white"
                onClick={interruptedActions?.handleIgnore}
                disabled={actionsDisabled}
              >
                Ignore
              </Button>
            )}
          </div>

          {/* Actions */}
          <InboxItemInput
            acceptAllowed={interruptedActions?.acceptAllowed ?? false}
            hasEdited={interruptedActions?.hasEdited ?? false}
            hasAddedResponse={interruptedActions?.hasAddedResponse ?? false}
            interruptValue={threadData.interrupts[0]}
            humanResponse={
              (interruptedActions?.humanResponse as any) || {
                type: "accept",
                args: null,
              }
            }
            initialValues={
              interruptedActions?.initialHumanInterruptEditValue.current || {}
            }
            setHumanResponse={
              interruptedActions?.setHumanResponse ?? (() => {})
            }
            streaming={interruptedActions?.streaming ?? false}
            streamFinished={interruptedActions?.streamFinished ?? false}
            currentNode={interruptedActions?.currentNode ?? ""}
            supportsMultipleMethods={
              interruptedActions?.supportsMultipleMethods ?? false
            }
            setSelectedSubmitType={
              interruptedActions?.setSelectedSubmitType ?? (() => {})
            }
            setHasAddedResponse={
              interruptedActions?.setHasAddedResponse ?? (() => {})
            }
            setHasEdited={interruptedActions?.setHasEdited ?? (() => {})}
            handleSubmit={interruptedActions?.handleSubmit ?? (async () => {})}
          />
        </>
      )}
    </div>
  );
}
