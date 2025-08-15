import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  ClockIcon,
  AlertCircle,
  Loader,
} from "lucide-react";
import { ThreadData, GenericThreadData } from "../types";
import useInterruptedActions from "../hooks/use-interrupted-actions";
import { constructOpenInStudioURL } from "../utils";
import { ThreadIdCopyable } from "./thread-id";
import { InboxItemInput } from "./inbox-item-input";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import {
  STUDIO_NOT_WORKING_TROUBLESHOOTING_URL,
  VIEW_STATE_THREAD_QUERY_PARAM,
} from "../constants";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQueryParams } from "../hooks/use-query-params";
import { useThreadsContext } from "../contexts/ThreadContext";
import { useState } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InterruptDetailsView } from "./interrupt-details-view";

import { logger } from "../utils/logger";

interface ThreadActionsViewProps<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData: ThreadData<ThreadValues>;
  isInterrupted: boolean;
  threadTitle: string;
  showState: boolean;
  showDescription: boolean;
  handleShowSidePanel?: (showState: boolean, showDescription: boolean) => void;
  setThreadData: React.Dispatch<
    React.SetStateAction<ThreadData<ThreadValues> | undefined>
  >;
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

// Helper type guard functions
function isIdleThread<T extends Record<string, any>>(
  threadData: ThreadData<T>
): threadData is GenericThreadData<T> & { status: "idle" } {
  return threadData.status === "idle";
}

function isBusyThread<T extends Record<string, any>>(
  threadData: ThreadData<T>
): threadData is GenericThreadData<T> & { status: "busy" } {
  return threadData.status === "busy";
}

function isErrorThread<T extends Record<string, any>>(
  threadData: ThreadData<T>
): threadData is GenericThreadData<T> & { status: "error" } {
  return threadData.status === "error";
}

export function ThreadActionsView<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({
  threadData,
  isInterrupted: _propIsInterrupted,
  threadTitle,
  showDescription,
  showState,
  handleShowSidePanel,
  setThreadData,
}: ThreadActionsViewProps<ThreadValues>) {
  const { agentInboxes, fetchSingleThread } = useThreadsContext<ThreadValues>();
  const { toast } = useToast();
  const { updateQueryParams } = useQueryParams();
  const [refreshing, setRefreshing] = useState(false);

  // Get the selected inbox object
  const selectedInbox = agentInboxes.find((i) => i.selected);
  const deploymentUrl = selectedInbox?.deploymentUrl;

  // Only use interrupted actions for interrupted threads
  const isInterrupted =
    threadData.status === "interrupted" &&
    threadData.interrupts !== undefined &&
    threadData.interrupts.length > 0;

  // Initialize the hook outside of conditional to satisfy React rules of hooks
  const actions = useInterruptedActions<ThreadValues>({
    threadData: isInterrupted
      ? {
          thread: threadData.thread,
          status: "interrupted",
          interrupts: threadData.interrupts || [],
        }
      : null,
    setThreadData,
  });

  const handleOpenInStudio = () => {
    if (!selectedInbox) {
      toast({
        title: "Error",
        description: "No agent inbox selected.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    const studioUrl = constructOpenInStudioURL(
      selectedInbox, // Pass the full inbox object
      threadData.thread.thread_id
    );

    if (studioUrl === "#") {
      // Handle case where URL construction failed (e.g., missing data)
      toast({
        title: "Error",
        description: (
          <>
            <p>
              Could not construct Studio URL. Check if inbox has necessary
              details (Project ID, Tenant ID).
            </p>
            <p>
              If the issue persists, see the{" "}
              <a
                href={STUDIO_NOT_WORKING_TROUBLESHOOTING_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                troubleshooting section
              </a>
            </p>
          </>
        ),
        variant: "destructive",
        duration: 10000,
      });
    } else {
      window.open(studioUrl, "_blank");
    }
  };

  const handleRefreshThread = async () => {
    // Use selectedInbox here as well
    if (!selectedInbox) {
      toast({
        title: "Error",
        description: "No agent inbox selected.",
        variant: "destructive",
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
      await fetchSingleThread(threadData.thread.thread_id);

      toast({
        title: "Thread refreshed",
        description: "Thread information has been updated.",
        duration: 3000,
      });
    } catch (error) {
      logger.error("Error refreshing thread:", error);
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

  // Use the passed handleShowSidePanel prop or update query params directly
  const updateSidePanel = (state: boolean, description: boolean) => {
    if (handleShowSidePanel) {
      handleShowSidePanel(state, description);
    } else {
      updateQueryParams("thread_state", String(state));
      updateQueryParams("thread_description", String(description));
    }
  };

  // Safely access config for determining allowed actions
  const firstInterrupt = threadData.interrupts?.[0];
  const config = firstInterrupt?.config;
  const ignoreAllowed = config?.allow_ignore ?? false;
  const acceptAllowed = config?.allow_accept ?? false;

  // Status Icon Logic
  const getStatusIcon = () => {
    if (isIdleThread(threadData)) {
      return <ClockIcon className="w-4 h-4 text-gray-500" />;
    } else if (isBusyThread(threadData)) {
      return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
    } else if (isErrorThread(threadData)) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  // Handle Invalid  Interrupt Threads
  /////////////////////////////////////
  if (threadData.invalidSchema) {
    return (
      <div className="flex flex-col min-h-full w-full">
        <div className="p-12 gap-9 flex flex-col w-full">
          {/* Header (minimal) */}
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
                <p className="text-2xl tracking-tighter text-pretty">
                  {threadTitle}
                </p>
              </div>
              <ThreadIdCopyable threadId={threadData.thread.thread_id} />
            </div>
            {/* Right-side controls with ButtonGroup */}
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
                handleShowState={() => updateSidePanel(true, false)}
                handleShowDescription={() => updateSidePanel(false, true)}
                showingState={showState}
                showingDescription={showDescription}
              />
            </div>
          </div>

          {/* Interrupt details on the left for invalid interrupts */}
          <InterruptDetailsView threadData={threadData} />

          {/* Invalid schema message */}
          <div className="p-4 border border-yellow-200 bg-yellow-50 text-yellow-700 rounded-md w-full">
            This thread is interrupted, but the required action data is missing
            or invalid. Standard interrupt actions cannot be performed.
          </div>

          {/* You might still allow ignoring the thread */}
          <div className="flex flex-row gap-2 items-center justify-start w-full">
            <Button
              variant="outline"
              className="text-gray-800 border-gray-500 font-normal bg-white"
              onClick={actions?.handleIgnore} // Assuming ignore doesn't need config
              disabled={actions?.loading}
            >
              Ignore Thread
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle generic Non-Interrupted Threads
  ////////////////////////////////////////
  if (
    threadData.status !== "interrupted" ||
    !threadData.interrupts ||
    threadData.interrupts.length === 0
  ) {
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
              {isInterrupted && !threadData.invalidSchema && (
                <AlertCircle className="w-4 h-4 text-yellow-600" />
              )}{" "}
              {/* Icon for valid interrupt */}
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
              handleShowState={() => updateSidePanel(true, false)}
              handleShowDescription={() => updateSidePanel(false, true)}
              showingState={showState}
              showingDescription={showDescription}
            />
          </div>
        </div>

        {/* Non-interrupted thread actions */}
        <div className="flex flex-col gap-6">
          {/* Status-specific UI */}
          {(isIdleThread(threadData) || isBusyThread(threadData)) && (
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

          {isErrorThread(threadData) && (
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
      </div>
    );
  }

  // Handle Valid Interrupted Threads
  //////////////////////////////////////////////////////////
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
            <AlertCircle className="w-4 h-4 text-yellow-600" />
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
          {/* Added ButtonGroup for interrupted threads */}
          <ButtonGroup
            handleShowState={() => updateSidePanel(true, false)}
            handleShowDescription={() => updateSidePanel(false, true)}
            showingState={showState}
            showingDescription={showDescription}
          />
        </div>
      </div>

      {/* Interrupted thread actions */}
      <div className="flex flex-row gap-2 items-center justify-start w-full">
        {ignoreAllowed && (
          <>
            <Button
              variant="outline"
              className="text-gray-800 border-gray-500 font-normal bg-white"
              onClick={actions?.handleResolve}
              disabled={actions?.loading}
            >
              Mark as Resolved
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={actions?.handleIgnore}
                  disabled={actions?.loading}
                >
                  Ignore
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Ignore this interrupt and end the thread.
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>

      {/* Actions */}
      <InboxItemInput
        acceptAllowed={acceptAllowed}
        hasEdited={actions?.hasEdited ?? false}
        hasAddedResponse={actions?.hasAddedResponse ?? false}
        interruptValue={firstInterrupt!}
        humanResponse={actions?.humanResponse as any}
        initialValues={actions?.initialHumanInterruptEditValue.current || {}}
        setHumanResponse={actions?.setHumanResponse ?? (() => {})}
        streaming={actions?.streaming ?? false}
        streamFinished={actions?.streamFinished ?? false}
        currentNode={actions?.currentNode ?? ""}
        supportsMultipleMethods={actions?.supportsMultipleMethods ?? false}
        setSelectedSubmitType={actions?.setSelectedSubmitType ?? (() => {})}
        setHasAddedResponse={actions?.setHasAddedResponse ?? (() => {})}
        setHasEdited={actions?.setHasEdited ?? (() => {})}
        handleSubmit={actions?.handleSubmit ?? (async () => {})}
      />
    </div>
  );
}
