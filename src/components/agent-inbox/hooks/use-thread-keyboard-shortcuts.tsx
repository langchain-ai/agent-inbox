import React from "react";
import { useQueryParams } from "./use-query-params";
import { useThreadsContext } from "../contexts/ThreadContext";
import { INBOX_PARAM, VIEW_STATE_THREAD_QUERY_PARAM } from "../constants";
import { ThreadStatusWithAll } from "../types";
import { isTypingTarget } from "../utils/keyboard";
import {
  filterThreadsForInbox,
  getAdjacentThreadId,
} from "../utils/thread-list";

export const HUMAN_RESPONSE_HOTKEY_TARGET = "human-response";

interface UseThreadKeyboardShortcutsOptions {
  threadId: string;
  /** When true, `r` focuses the human response input and `u` resets inputs. */
  isInterrupted: boolean;
  onResetAllInputs?: () => void;
}

/**
 * Thread-detail hotkeys (issue #65):
 * - `e` — close thread / back to inbox list
 * - ArrowUp / ArrowDown — previous / next thread in the current inbox page
 * - `r` — focus human response / edit input
 * - `u` — undo / reset all human response inputs
 */
export function useThreadKeyboardShortcuts({
  threadId,
  isInterrupted,
  onResetAllInputs,
}: UseThreadKeyboardShortcutsOptions) {
  const { updateQueryParams, getSearchParam } = useQueryParams();
  const { threadData } = useThreadsContext();

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const inbox = (getSearchParam(INBOX_PARAM) ||
        "interrupted") as ThreadStatusWithAll;
      const filtered = filterThreadsForInbox(threadData, inbox);

      switch (event.key) {
        case "e":
        case "E": {
          if (isTypingTarget(event.target)) return;
          event.preventDefault();
          updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM);
          break;
        }
        case "ArrowUp":
        case "ArrowDown": {
          if (isTypingTarget(event.target)) return;
          event.preventDefault();
          const nextId = getAdjacentThreadId(
            filtered,
            threadId,
            event.key === "ArrowUp" ? "prev" : "next"
          );
          if (nextId) {
            updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM, nextId);
          }
          break;
        }
        case "r":
        case "R": {
          if (!isInterrupted) return;
          // Allow focusing even when already in an input (Superhuman-style).
          event.preventDefault();
          const el = document.querySelector<HTMLTextAreaElement>(
            `textarea[data-hotkey-target="${HUMAN_RESPONSE_HOTKEY_TARGET}"]`
          );
          el?.focus();
          break;
        }
        case "u":
        case "U": {
          if (!isInterrupted || !onResetAllInputs) return;
          event.preventDefault();
          onResetAllInputs();
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    threadId,
    threadData,
    isInterrupted,
    onResetAllInputs,
    getSearchParam,
    updateQueryParams,
  ]);
}
