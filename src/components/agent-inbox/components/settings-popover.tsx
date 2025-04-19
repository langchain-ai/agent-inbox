"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings, RefreshCw } from "lucide-react";
import React from "react";
import { PillButton } from "@/components/ui/pill-button";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "../hooks/use-local-storage";
import { INBOX_PARAM, LANGCHAIN_API_KEY_LOCAL_STORAGE_KEY } from "../constants";
import { useThreadsContext } from "../contexts/ThreadContext";
import { useQueryParams } from "../hooks/use-query-params";
import { ThreadStatusWithAll } from "../types";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { forceInboxBackfill } from "../utils/backfill";
import { useToast } from "@/hooks/use-toast";

export function SettingsPopover() {
  const langchainApiKeyNotSet = React.useRef(true);
  const [open, setOpen] = React.useState(false);
  const [langchainApiKey, setLangchainApiKey] = React.useState("");
  const { getItem, setItem } = useLocalStorage();
  const { getSearchParam } = useQueryParams();
  const { fetchThreads } = useThreadsContext();
  const [isRunningBackfill, setIsRunningBackfill] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    try {
      if (typeof window === "undefined") {
        return;
      }
      if (langchainApiKey) return;

      const langchainApiKeyLS = getItem(LANGCHAIN_API_KEY_LOCAL_STORAGE_KEY);
      if (langchainApiKeyLS) {
        // If the key already exists in local storage, then it's already been set.
        langchainApiKeyNotSet.current = false;
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

  const handleRunBackfill = async () => {
    setIsRunningBackfill(true);
    try {
      const result = await forceInboxBackfill(langchainApiKey || undefined);

      if (result.success) {
        toast({
          title: "Success",
          description:
            "Your inbox IDs have been updated. Please refresh the page to see your inboxes.",
          duration: 5000,
        });
        // Force a page reload to apply the updated IDs
        window.location.reload();
      } else {
        toast({
          title: "Error",
          description:
            "Failed to update inbox IDs. Please try again or contact support.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error running backfill:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsRunningBackfill(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(c) => {
        if (!c && langchainApiKey && langchainApiKeyNotSet.current) {
          // Try to fetch threads if the key was set for the first time.
          langchainApiKeyNotSet.current = false;
          const inboxParam = getSearchParam(INBOX_PARAM) as
            | ThreadStatusWithAll
            | undefined;
          if (inboxParam) {
            // Void and not await to avoid blocking the UI.
            void fetchThreads(inboxParam);
          }
        }
        setOpen(c);
      }}
    >
      <PopoverTrigger asChild>
        <PillButton
          variant="outline"
          className="flex gap-2 items-center justify-center text-gray-800 w-fit"
          size="lg"
        >
          <Settings />
          <span>Settings</span>
        </PillButton>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Settings</h4>
            <p className="text-sm text-muted-foreground">
              Configuration settings for Agent Inbox
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 w-full">
            <div className="flex flex-col items-start gap-2 w-full">
              <div className="flex flex-col gap-1 w-full items-start">
                <Label htmlFor="langchain-api-key">
                  LangSmith API Key <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  This value is stored in your browser&apos;s local storage and
                  is only used to authenticate requests sent to your LangGraph
                  server.
                </p>
              </div>
              <PasswordInput
                id="langchain-api-key"
                placeholder="lsv2_pt_..."
                className="min-w-full"
                required
                value={langchainApiKey}
                onChange={handleChangeLangChainApiKey}
              />
            </div>
            <div className="flex flex-col items-start gap-2 w-full border-t pt-4">
              <div className="flex flex-col gap-1 w-full items-start">
                <Label>Update Inbox IDs</Label>
                <p className="text-xs text-muted-foreground">
                  Update your inbox IDs to the new format that supports sharing
                  links across machines.
                </p>
              </div>
              <Button
                onClick={handleRunBackfill}
                disabled={isRunningBackfill}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={
                    isRunningBackfill ? "animate-spin h-4 w-4" : "h-4 w-4"
                  }
                />
                {isRunningBackfill ? "Updating..." : "Update Inbox IDs"}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
