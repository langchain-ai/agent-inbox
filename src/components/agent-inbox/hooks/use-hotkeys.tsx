import React from "react";
import { VIEW_STATE_THREAD_QUERY_PARAM } from "../constants";

interface UseHotkeysConfig {
  threadIds: string[];
  currentThreadId: string | null;
  isThreadView: boolean;
  updateQueryParams: (key: string | string[], value?: string | string[]) => void;
  onThreadClick?: () => void;
}

function isTyping(): boolean {
  const tag = document.activeElement?.tagName?.toLowerCase();
  const editable = document.activeElement?.getAttribute("contenteditable");
  return tag === "input" || tag === "textarea" || editable === "true";
}

export function useHotkeys({
  threadIds,
  currentThreadId,
  isThreadView,
  updateQueryParams,
  onThreadClick,
}: UseHotkeysConfig) {
  const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);

  // Reset focused index when switching views
  React.useEffect(() => {
    if (isThreadView) {
      setFocusedIndex(-1);
    }
  }, [isThreadView]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: KeyboardEvent) => {
      // --- List view hotkeys ---
      if (!isThreadView) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = Math.min(prev + 1, threadIds.length - 1);
            // Scroll the focused item into view
            setTimeout(() => {
              const el = document.querySelector(
                `[data-inbox-item-index="${next}"]`
              );
              el?.scrollIntoView({ block: "nearest" });
            }, 0);
            return next;
          });
          return;
        }

        if (e.key === "ArrowUp") {
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = Math.max(prev - 1, 0);
            setTimeout(() => {
              const el = document.querySelector(
                `[data-inbox-item-index="${next}"]`
              );
              el?.scrollIntoView({ block: "nearest" });
            }, 0);
            return next;
          });
          return;
        }

        if (e.key === "Enter") {
          setFocusedIndex((current) => {
            if (current >= 0 && current < threadIds.length) {
              if (onThreadClick) {
                onThreadClick();
              }
              updateQueryParams(
                VIEW_STATE_THREAD_QUERY_PARAM,
                threadIds[current]
              );
            }
            return current;
          });
          return;
        }
      }

      // --- Thread view hotkeys ---
      if (isThreadView) {
        // Arrow up/down: navigate to prev/next thread
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          if (isTyping()) return;
          e.preventDefault();
          const currentIndex = currentThreadId
            ? threadIds.indexOf(currentThreadId)
            : -1;
          if (currentIndex === -1) return;

          const nextIndex =
            e.key === "ArrowDown" ? currentIndex + 1 : currentIndex - 1;
          if (nextIndex >= 0 && nextIndex < threadIds.length) {
            updateQueryParams(
              VIEW_STATE_THREAD_QUERY_PARAM,
              threadIds[nextIndex]
            );
          }
          return;
        }

        // Single-key shortcuts: guard against text input
        if (isTyping()) return;

        if (e.key === "e") {
          e.preventDefault();
          // Go back to inbox list by clearing the thread id param
          updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM);
          return;
        }

        if (e.key === "r") {
          e.preventDefault();
          const target =
            document.querySelector<HTMLElement>(
              '[data-hotkey-target="response-input"]'
            ) ||
            document.querySelector<HTMLElement>(
              '[data-hotkey-target="edit-input"]'
            );
          target?.focus();
          return;
        }

        if (e.key === "u") {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("hotkey:reset"));
          return;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isThreadView, threadIds, currentThreadId, updateQueryParams, onThreadClick]);

  return { focusedIndex };
}
