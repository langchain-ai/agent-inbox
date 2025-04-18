"use client";

import NextLink from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { FileText, UploadCloud, House } from "lucide-react";
import { agentInboxSvg } from "../agent-inbox/components/agent-inbox-logo";
import { SettingsPopover } from "../agent-inbox/components/settings-popover";
import { PillButton } from "../ui/pill-button";
import React from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { TooltipIconButton } from "../ui/assistant-ui/tooltip-icon-button";
import { useThreadsContext } from "../agent-inbox/contexts/ThreadContext";
import { prettifyText, isDeployedUrl } from "../agent-inbox/utils";
import { cn } from "@/lib/utils";
import {
  AGENT_INBOX_GITHUB_README_URL,
  LANGCHAIN_API_KEY_LOCAL_STORAGE_KEY,
} from "../agent-inbox/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { AddAgentInboxDialog } from "../agent-inbox/components/add-agent-inbox-dialog";
import { useLocalStorage } from "../agent-inbox/hooks/use-local-storage";
import { DropdownDialogMenu } from "../agent-inbox/components/dropdown-and-dialog";

export function AppSidebar() {
  const { agentInboxes, changeAgentInbox, deleteAgentInbox } =
    useThreadsContext();
  const [langchainApiKey, setLangchainApiKey] = React.useState("");
  const { getItem, setItem } = useLocalStorage();

  React.useEffect(() => {
    try {
      if (typeof window === "undefined" || langchainApiKey) {
        return;
      }

      const langchainApiKeyLS = getItem(LANGCHAIN_API_KEY_LOCAL_STORAGE_KEY);
      if (langchainApiKeyLS) {
        setLangchainApiKey(langchainApiKeyLS);
      }
    } catch (e) {
      console.error("Error getting/setting LangSmith API key", e);
    }
  }, [langchainApiKey]);

  const handleChangeLangChainApiKey = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLangchainApiKey(e.target.value);
    setItem(LANGCHAIN_API_KEY_LOCAL_STORAGE_KEY, e.target.value);
  };

  return (
    <Sidebar className="border-r-[0px] bg-[#F9FAFB]">
      <SidebarContent className="flex flex-col h-screen pb-9 pt-6">
        <div className="flex items-center justify-between px-11">
          <NextLink href="/" className="flex-shrink-0 w-full">
            {agentInboxSvg}
          </NextLink>
          <AppSidebarTrigger isOutside={false} className="mt-1" />
        </div>
        <SidebarGroup className="flex-1 overflow-y-auto pt-6">
          <SidebarGroupContent className="h-full">
            <SidebarMenu className="flex flex-col gap-2 justify-between h-full">
              <div className="flex flex-col gap-2 pl-7">
                {agentInboxes.map((item, idx) => {
                  const label = item.name || prettifyText(item.graphId);
                  const isDeployed = isDeployedUrl(item.deploymentUrl);
                  return (
                    <SidebarMenuItem
                      key={`graph-id-${item.graphId}-${idx}`}
                      className={cn(
                        "flex items-center w-full",
                        item.selected ? "bg-gray-100 rounded-md" : ""
                      )}
                    >
                      <TooltipProvider>
                        <Tooltip delayDuration={200}>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              onClick={() => changeAgentInbox(item.id, true)}
                            >
                              {isDeployed ? (
                                <UploadCloud className="w-5 h-5 text-blue-500" />
                              ) : (
                                <House className="w-5 h-5 text-green-500" />
                              )}
                              <span
                                className={cn(
                                  "truncate min-w-0 font-medium",
                                  item.selected ? "text-black" : "text-gray-600"
                                )}
                              >
                                {label}
                              </span>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent>
                            {label} - {isDeployed ? "Deployed" : "Local"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <DropdownDialogMenu
                        item={item}
                        deleteAgentInbox={deleteAgentInbox}
                      />
                    </SidebarMenuItem>
                  );
                })}
                <AddAgentInboxDialog
                  hideTrigger={false}
                  langchainApiKey={langchainApiKey}
                  handleChangeLangChainApiKey={handleChangeLangChainApiKey}
                />
              </div>

              <div className="flex flex-col gap-3 pl-7">
                <SettingsPopover />
                <NextLink
                  href={AGENT_INBOX_GITHUB_README_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <PillButton
                    variant="outline"
                    className="flex gap-2 items-center justify-center text-gray-800"
                    size="lg"
                  >
                    <FileText />
                    <span>Documentation</span>
                  </PillButton>
                </NextLink>
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

const sidebarTriggerSVG = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 2V14M5.2 2H10.8C11.9201 2 12.4802 2 12.908 2.21799C13.2843 2.40973 13.5903 2.71569 13.782 3.09202C14 3.51984 14 4.0799 14 5.2V10.8C14 11.9201 14 12.4802 13.782 12.908C13.5903 13.2843 13.2843 13.5903 12.908 13.782C12.4802 14 11.9201 14 10.8 14H5.2C4.07989 14 3.51984 14 3.09202 13.782C2.71569 13.5903 2.40973 13.2843 2.21799 12.908C2 12.4802 2 11.9201 2 10.8V5.2C2 4.07989 2 3.51984 2.21799 3.09202C2.40973 2.71569 2.71569 2.40973 3.09202 2.21799C3.51984 2 4.0799 2 5.2 2Z"
      stroke="#3F3F46"
      strokeWidth="1.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function AppSidebarTrigger({
  isOutside,
  className,
}: {
  isOutside: boolean;
  className?: string;
}) {
  const { toggleSidebar, open } = useSidebar();

  if (isOutside && open) {
    // If this component is being rendered outside the sidebar view, then do not render if open.
    // This way we can render the trigger inside the main view when open.
    return null;
  }

  return (
    <TooltipIconButton
      tooltip="Toggle Sidebar"
      onClick={toggleSidebar}
      className={className}
    >
      {sidebarTriggerSVG}
    </TooltipIconButton>
  );
}
