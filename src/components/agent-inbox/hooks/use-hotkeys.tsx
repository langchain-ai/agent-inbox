import { useEffect } from "react";
import { useThreadsContext } from "../contexts/ThreadContext";
import { useQueryParams } from "./use-query-params";
import { VIEW_STATE_THREAD_QUERY_PARAM } from "../constants";

export function useHotkeys() {
    const { threadData } = useThreadsContext();
    const { searchParams, updateQueryParams } = useQueryParams();
    const selectedThreadId = searchParams.get(VIEW_STATE_THREAD_QUERY_PARAM);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input/textarea
            const activeElement = document.activeElement;
            if (
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement ||
                (activeElement as HTMLElement)?.isContentEditable
            ) {
                // Exception: allow some global escape or special keys? 
                // For now, adhere to common practice: if focus is on input, hotkeys are disabled.
                return;
            }

            const key = e.key.toLowerCase();

            // Close thread (Go back to inbox)
            if (key === "e") {
                if (selectedThreadId) {
                    e.preventDefault();
                    updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM);
                }
                return;
            }

            // Focus input
            if (key === "r") {
                if (selectedThreadId) {
                    e.preventDefault();
                    // Look for the textarea in the thread view
                    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
                    textarea?.focus();
                }
                return;
            }

            // Undo changes (Trigger reset button)
            if (key === "u") {
                if (selectedThreadId) {
                    e.preventDefault();
                    // Find the reset button via data-testid or text
                    const resetButton = document.querySelector('[data-testid="reset-button"]') as HTMLButtonElement;
                    if (resetButton) {
                        resetButton.click();
                    } else {
                        // Fallback to text search if data-testid isn't available for some reason
                        const buttons = Array.from(document.querySelectorAll("button"));
                        const fallbackReset = buttons.find((btn) =>
                            btn.textContent?.toLowerCase().includes("reset")
                        );
                        fallbackReset?.click();
                    }
                }
                return;
            }

            // Navigation between threads
            if (key === "arrowup" || key === "arrowdown") {
                if (!selectedThreadId || threadData.length === 0) return;

                e.preventDefault();
                const currentIndex = threadData.findIndex(
                    (t) => t.thread.thread_id === selectedThreadId
                );

                if (currentIndex === -1) return;

                let nextIndex = currentIndex;
                if (key === "arrowup") {
                    nextIndex = Math.max(0, currentIndex - 1);
                } else if (key === "arrowdown") {
                    nextIndex = Math.min(threadData.length - 1, currentIndex + 1);
                }

                if (nextIndex !== currentIndex) {
                    const nextThreadId = threadData[nextIndex].thread.thread_id;
                    updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM, nextThreadId);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedThreadId, threadData, updateQueryParams]);
}
