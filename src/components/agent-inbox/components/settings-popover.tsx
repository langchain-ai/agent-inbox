"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings } from "lucide-react";
import React from "react";
import { PillButton } from "@/components/ui/pill-button";
import { AddAgentInboxDialog } from "./add-agent-inbox-dialog";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "../hooks/use-local-storage";
import { INBOX_PARAM, LANGCHAIN_API_KEY_LOCAL_STORAGE_KEY } from "../constants";
import { useThreadsContext } from "../contexts/ThreadContext";
import { useQueryParams } from "../hooks/use-query-params";
import { ThreadStatusWithAll } from "../types";
import { PasswordInput } from "@/components/ui/password-input";

export function SettingsPopover() {
  const langchainApiKeyNotSet = React.useRef(true);
  const [open, setOpen] = React.useState(false);
  const [langchainApiKey, setLangchainApiKey] = React.useState("");
  const { getItem, setItem } = useLocalStorage();
  const { getSearchParam } = useQueryParams();
  const { fetchThreads } = useThreadsContext();

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
      console.error("Error getting/setting LangChain API key", e);
    }
  }, [langchainApiKey]);

  return (
    <>
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
                    LangChain API Key <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    This value is stored in your browser&apos;s local storage
                    and is only used to authenticate requests sent to your
                    LangGraph server.
                  </p>
                </div>
                <PasswordInput
                  id="langchain-api-key"
                  placeholder="lsv2_pt_..."
                  className="min-w-full"
                  required
                  value={langchainApiKey}
                  onChange={(e) => {
                    setLangchainApiKey(e.target.value);
                    setItem(
                      LANGCHAIN_API_KEY_LOCAL_STORAGE_KEY,
                      e.target.value
                    );
                  }}
                />
              </div>
              <AddAgentInboxDialog
                closeSettingsPopover={() => setOpen(false)}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
