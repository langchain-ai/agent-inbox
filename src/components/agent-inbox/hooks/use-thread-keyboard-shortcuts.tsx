import { useEffect } from "react";
import { useQueryParams } from "./use-query-params";
import { useThreadsContext } from "../contexts/ThreadContext";
import {
  HUMAN_RESPONSE_HOTKEY_TARGET,
  INBOX_PARAM,
  VIEW_STATE_THREAD_QUERY_PARAM,
} from "../constants";
import { ThreadStatusWithAll } from "../types";
import { isTypingTarget } from "../utils/keyboard";
import {
  filterThreadsForInbox,
  getAdjacentThreadId,
} from "../utils/thread-list";

interface UseThreadKeyboardShortcutsOptions {
  threadId: string;
  /** When true, `r` focuses the human response input and `u` resets inputs. */
  isInterrupted: boolean;
  onResetAllInputs?: () => void;
}

/**
 * Thread-detail hotkeys:
 * - `e` — close thread / back to inbox list
 * - ArrowUp / ArrowDown — previous / next thread in the current inbox page
 * - `r` — focus human response / edit input
 * - `u` — reset all human response inputs
 */
export function useThreadKeyboardShortcuts({
  threadId,
  isInterrupted,
  onResetAllInputs,
}: UseThreadKeyboardShortcutsOptions) {
  const { updateQueryParams } = useQueryParams();
  const { threadData } = useThreadsContext();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      // Do not intercept keys while the user is typing in a field.
      if (isTypingTarget(event.target)) return;

      const inboxParam =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get(INBOX_PARAM)
          : null;
      const inbox = (inboxParam || "interrupted") as ThreadStatusWithAll;
      const filtered = filterThreadsForInbox(threadData, inbox);
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

      switch (key) {
        case "e": {
          event.preventDefault();
          updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM);
          break;
        }
        case "ArrowUp":
        case "ArrowDown": {
          event.preventDefault();
          const nextId = getAdjacentThreadId(
            filtered,
            threadId,
            key === "ArrowUp" ? "prev" : "next"
          );
          if (nextId) {
            updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM, nextId);
          }
          break;
        }
        case "r": {
          if (!isInterrupted) return;
          event.preventDefault();
          const el = document.querySelector<HTMLTextAreaElement>(
            `textarea[data-hotkey-target="${HUMAN_RESPONSE_HOTKEY_TARGET}"]`
          );
          el?.focus();
          break;
        }
        case "u": {
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
    updateQueryParams,
  ]);
}
