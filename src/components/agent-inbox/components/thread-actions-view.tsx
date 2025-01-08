import { Button } from "@/components/ui/button";
import { Thread } from "@langchain/langgraph-sdk";
import { ArrowLeft } from "lucide-react";
import { HumanInterrupt, ThreadData } from "../types";
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

interface ThreadActionsViewProps<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData: {
    thread: Thread<ThreadValues>;
    status: "interrupted";
    interrupts: HumanInterrupt[];
  };
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

export function ThreadActionsView<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({
  threadData,
  setThreadData,
  handleShowSidePanel,
  showDescription,
  showState,
}: ThreadActionsViewProps<ThreadValues>) {
  const {
    acceptAllowed,
    hasEdited,
    hasAddedResponse,
    streaming,
    supportsMultipleMethods,
    streamFinished,
    currentNode,
    loading,
    handleSubmit,
    handleIgnore,
    handleResolve,
    setSelectedSubmitType,
    setHasAddedResponse,
    setHasEdited,
    humanResponse,
    setHumanResponse,
    initialHumanInterruptEditValue,
  } = useInterruptedActions<ThreadValues>({
    threadData,
    setThreadData,
  });
  const { agentInboxes } = useThreadsContext<ThreadValues>();
  const { toast } = useToast();
  const { updateQueryParams } = useQueryParams();

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

  const threadTitle =
    threadData.interrupts[0].action_request.action || "Unknown";
  const actionsDisabled = loading || streaming;

  return (
    <div className="flex flex-col min-h-full w-full p-12 gap-9">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between w-full gap-3">
        <div className="flex items-center justify-start gap-3">
          <TooltipIconButton
            variant="ghost"
            onClick={() => updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM)}
            tooltip="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </TooltipIconButton>
          <p className="text-2xl tracking-tighter text-pretty">{threadTitle}</p>
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
          />
        </div>
      </div>

      <div className="flex flex-row gap-2 items-center justify-start w-full">
        <Button
          variant="outline"
          className="text-gray-800 border-gray-500 font-normal bg-white"
          onClick={handleResolve}
          disabled={actionsDisabled}
        >
          Mark as Resolved
        </Button>
        <Button
          variant="outline"
          className="text-gray-800 border-gray-500 font-normal bg-white"
          onClick={handleIgnore}
          disabled={actionsDisabled}
        >
          Ignore
        </Button>
      </div>

      {/* Actions */}
      <InboxItemInput
        acceptAllowed={acceptAllowed}
        hasEdited={hasEdited}
        hasAddedResponse={hasAddedResponse}
        interruptValue={threadData.interrupts[0]}
        humanResponse={humanResponse}
        initialValues={initialHumanInterruptEditValue.current}
        setHumanResponse={setHumanResponse}
        streaming={streaming}
        streamFinished={streamFinished}
        currentNode={currentNode}
        supportsMultipleMethods={supportsMultipleMethods}
        setSelectedSubmitType={setSelectedSubmitType}
        setHasAddedResponse={setHasAddedResponse}
        setHasEdited={setHasEdited}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}
