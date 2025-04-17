import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Thread } from "@langchain/langgraph-sdk";
import { TooltipIconButton } from "@/components/ui/assistant-ui/tooltip-icon-button";
import { VIEW_STATE_THREAD_QUERY_PARAM } from "../constants";
import { useQueryParams } from "../hooks/use-query-params";
import { Button } from "@/components/ui/button";
import { ThreadIdCopyable } from "./thread-id";
import { useThreadsContext } from "../contexts/ThreadContext";
import { constructOpenInStudioURL } from "../utils";
import { useToast } from "@/hooks/use-toast";
import { StateViewObject } from "./state-view";

interface RawJsonInterruptViewProps<
  ThreadValues extends Record<string, any> = Record<string, any>,
> {
  threadData: {
    thread: Thread<ThreadValues>;
    status: "interrupted";
    interrupts: any[];
  };
  handleShowSidePanel: (showState: boolean, showDescription: boolean) => void;
}

export function RawJsonInterruptView<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({
  threadData,
  handleShowSidePanel,
}: RawJsonInterruptViewProps<ThreadValues>) {
  const { updateQueryParams } = useQueryParams();
  const { agentInboxes } = useThreadsContext<ThreadValues>();
  const { toast } = useToast();
  const interruptPayload = threadData.interrupts[0];
  const [expanded, setExpanded] = useState(true);

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
          <p className="text-2xl tracking-tighter text-pretty">
            Non-Agent Inbox Interrupt
          </p>
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
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-1 bg-white"
            onClick={() => handleShowSidePanel(true, false)}
          >
            State
          </Button>
        </div>
      </div>

      {/* Resolve Button */}
      <div className="flex flex-row gap-2 items-center justify-start w-full">
        <Button
          variant="outline"
          className="text-gray-800 border-gray-500 font-normal bg-white"
          onClick={() => updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM)}
        >
          Mark as Resolved
        </Button>
      </div>

      {/* Use existing StateViewObject for JSON rendering */}
      <div className="border rounded-lg p-6 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Raw Interrupt Payload</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Collapse All" : "Expand All"}
          </Button>
        </div>
        <div className="flex flex-col items-start justify-start gap-1">
          {Object.entries(interruptPayload).map(([key, value], idx) => (
            <StateViewObject
              expanded={expanded}
              key={`interrupt-${key}-${idx}`}
              keyName={key}
              value={value}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
