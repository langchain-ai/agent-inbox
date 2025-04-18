import React from "react";
import { useCallback, useEffect, useRef } from "react";
import { useQueryParams } from "@/components/agent-inbox/hooks/use-query-params";
import { VIEW_STATE_THREAD_QUERY_PARAM } from "@/components/agent-inbox/constants";

export type KeyboardShortcut = {
  key: string;
  description: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  handler: (e: KeyboardEvent) => void;
};

type KeyboardShortcutsOptions = {
  shortcuts: KeyboardShortcut[];
  isEnabled?: boolean;
};

/**
 * A hook for managing keyboard shortcuts in the application
 *
 * @param options - Configuration options for keyboard shortcuts
 * @returns - Object containing active state and keyboard shortcuts list
 */
export function useKeyboardShortcuts({
  shortcuts,
  isEnabled = true,
}: KeyboardShortcutsOptions) {
  // Track active state to be able to enable/disable shortcuts
  const [active, setActive] = React.useState<boolean>(isEnabled);

  // Track whether text input or textarea is focused
  const isInputActive = useRef(false);

  // Handler for keydown events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if shortcuts are disabled or if we're typing in an input field
      if (!active || isInputActive.current) return;

      // Skip if the event comes from an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement &&
          (event.target.isContentEditable ||
            event.target.tagName === "INPUT" ||
            event.target.tagName === "TEXTAREA"))
      ) {
        isInputActive.current = true;
        return;
      }

      // Find the matching shortcut
      const shortcut = shortcuts.find(
        (s) =>
          s.key.toLowerCase() === event.key.toLowerCase() &&
          !!s.ctrlKey === event.ctrlKey &&
          !!s.altKey === event.altKey &&
          !!s.shiftKey === event.shiftKey &&
          !!s.metaKey === event.metaKey
      );

      if (shortcut) {
        event.preventDefault();
        shortcut.handler(event);
      }
    },
    [active, shortcuts]
  );

  // Handle focus/blur events to track when inputs are active
  const handleFocus = useCallback((event: FocusEvent) => {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target instanceof HTMLElement &&
        (event.target.isContentEditable ||
          event.target.tagName === "INPUT" ||
          event.target.tagName === "TEXTAREA"))
    ) {
      isInputActive.current = true;
    }
  }, []);

  const handleBlur = useCallback(() => {
    isInputActive.current = false;
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      setActive(false);
      return;
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocus);
    document.addEventListener("focusout", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("focusout", handleBlur);
    };
  }, [handleKeyDown, handleFocus, handleBlur, isEnabled]);

  return {
    active,
    setActive,
    shortcuts,
  };
}

/**
 * Hook specifically for navigation shortcuts in the Agent Inbox
 *
 * @returns Configured keyboard shortcuts for Agent Inbox navigation
 */
export function useAgentInboxShortcuts() {
  const { updateQueryParams } = useQueryParams();

  // Create a reference for any element that should be focused
  const responseInputRef = useRef<HTMLTextAreaElement>(null);

  // Create a reference for text inputs to be able to undo changes
  const textInputValuesRef = useRef<Map<HTMLElement, string>>(new Map());

  // Method to close the current thread and return to inbox
  const closeThread = useCallback(() => {
    updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM);
  }, [updateQueryParams]);

  // Method to focus on the response input field
  const focusResponseInput = useCallback(() => {
    if (responseInputRef.current) {
      responseInputRef.current.focus();
    } else {
      // If the ref isn't available, find the first textarea in the inbox item input
      const responseTextarea = document.querySelector(
        ".InboxItemInput textarea"
      );
      if (responseTextarea instanceof HTMLTextAreaElement) {
        responseTextarea.focus();
      }
    }
  }, []);

  // Method to navigate between threads using arrow keys
  const navigateThreads = useCallback((direction: "up" | "down") => {
    const threadItems = Array.from(
      document.querySelectorAll(
        '[class*="InterruptedInboxItem"], [class*="GenericInboxItem"]'
      )
    );

    if (!threadItems.length) return;

    // Find currently selected thread or get the first one
    const currentThreadId = new URLSearchParams(window.location.search).get(
      VIEW_STATE_THREAD_QUERY_PARAM
    );
    let currentIndex = -1;

    if (currentThreadId) {
      // If we're in thread view, we'll navigate from the inbox when returning
      return;
    }

    // Find the thread that has a visual indicator of being selected
    threadItems.forEach((item, index) => {
      if (
        item.classList.contains("selected") ||
        item.classList.contains("active")
      ) {
        currentIndex = index;
      }
    });

    // Calculate new index with wrap-around
    let newIndex;
    if (direction === "up") {
      newIndex = currentIndex <= 0 ? threadItems.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex >= threadItems.length - 1 ? 0 : currentIndex + 1;
    }

    // Simulate a click on the thread to navigate to it
    (threadItems[newIndex] as HTMLElement).click();
  }, []);

  // Method to undo changes in all inputs
  const undoChanges = useCallback(() => {
    // Find all textareas and reset them to their original value
    const textareas = document.querySelectorAll("textarea");
    textareas.forEach((textarea) => {
      const originalValue = textInputValuesRef.current.get(textarea);
      if (originalValue !== undefined) {
        textarea.value = originalValue;
        // Dispatch input event to trigger React's onChange handlers
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    // Find all reset buttons and click them
    const resetButtons = document.querySelectorAll('button[class*="reset"]');
    resetButtons.forEach((button) => {
      (button as HTMLButtonElement).click();
    });
  }, []);

  // Return the keyboard shortcut handlers and refs without creating unused variables
  return {
    responseInputRef,
    textInputValuesRef,
    closeThread,
    focusResponseInput,
    navigateThreads,
    undoChanges,
  };
}
