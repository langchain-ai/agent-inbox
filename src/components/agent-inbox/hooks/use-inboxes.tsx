import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import { useQueryParams } from "./use-query-params";
import {
  AGENT_INBOX_PARAM,
  AGENT_INBOXES_LOCAL_STORAGE_KEY,
  NO_INBOXES_FOUND_PARAM,
  OFFSET_PARAM,
  LIMIT_PARAM,
  INBOX_PARAM,
} from "../constants";
import { useLocalStorage } from "./use-local-storage";
import { useState, useCallback, useEffect, useRef } from "react";
import { AgentInbox } from "../types";
import { useRouter } from "next/navigation";
import { logger } from "../utils/logger";
import { runInboxBackfill } from "../utils/backfill";

/**
 * Hook for managing agent inboxes
 *
 * Provides functionality to:
 * - Load agent inboxes from local storage
 * - Add new agent inboxes
 * - Delete agent inboxes
 * - Change the selected agent inbox
 * - Update an existing agent inbox
 *
 * @returns {Object} Object containing agent inboxes and methods to manage them
 */
export function useInboxes() {
  const { getSearchParam, updateQueryParams } = useQueryParams();
  const router = useRouter();
  const { getItem, setItem } = useLocalStorage();
  const { toast } = useToast();
  const [agentInboxes, setAgentInboxes] = useState<AgentInbox[]>([]);
  const initialLoadComplete = useRef(false);

  /**
   * Run backfill and load initial inboxes on mount
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const initializeInboxes = async () => {
      try {
        // Run the backfill process first
        const backfillResult = await runInboxBackfill();
        if (backfillResult.success) {
          // Set the state with potentially updated inboxes from backfill
          setAgentInboxes(backfillResult.updatedInboxes);
          logger.log(
            "Initialized inboxes state after backfill:",
            backfillResult.updatedInboxes
          );
          // Now trigger the selection logic based on current URL param
          // This reuses the logic to select based on param or default
          getAgentInboxes(backfillResult.updatedInboxes);
        } else {
          // If backfill failed, try a normal load
          logger.error("Backfill failed, attempting normal inbox load");
          getAgentInboxes();
        }
      } catch (e) {
        logger.error("Error during initial inbox loading and backfill", e);
        // Attempt normal load as fallback
        getAgentInboxes();
      }
    };
    initializeInboxes();
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Load agent inboxes from local storage and set up proper selection state
   * Accepts optional preloaded inboxes to avoid re-reading localStorage immediately after backfill.
   */
  const getAgentInboxes = useCallback(
    async (preloadedInboxes?: AgentInbox[]) => {
      if (typeof window === "undefined") {
        return;
      }

      let currentInboxes: AgentInbox[] = [];
      if (preloadedInboxes) {
        currentInboxes = preloadedInboxes;
        logger.log("Using preloaded inboxes for selection logic");
      } else {
        const agentInboxesStr = getItem(AGENT_INBOXES_LOCAL_STORAGE_KEY);
        logger.log(
          "Reading inboxes from localStorage for selection logic:",
          agentInboxesStr
        );
        if (agentInboxesStr && agentInboxesStr !== "[]") {
          try {
            currentInboxes = JSON.parse(agentInboxesStr);
          } catch (error) {
            logger.error(
              "Error parsing agent inboxes for selection logic",
              error
            );
            // Handle error state appropriately
            setAgentInboxes([]);
            updateQueryParams(NO_INBOXES_FOUND_PARAM, "true");
            return;
          }
        } else {
          logger.log("No inboxes in localStorage for selection logic");
          setAgentInboxes([]);
          updateQueryParams(NO_INBOXES_FOUND_PARAM, "true");
          return;
        }
      }

      if (!currentInboxes.length) {
        logger.log("No current inboxes to process selection logic");
        setAgentInboxes([]);
        updateQueryParams(NO_INBOXES_FOUND_PARAM, "true");
        return;
      }

      // Inboxes exist — ensure the no_inboxes_found param is removed
      // This acts as a safety net in case the param persists after a reload
      const currentNoInboxesParam = new URLSearchParams(
        window.location.search
      ).get(NO_INBOXES_FOUND_PARAM);
      if (currentNoInboxesParam) {
        updateQueryParams(NO_INBOXES_FOUND_PARAM);
      }

      // Ensure each agent inbox has an ID, and if not, add one
      currentInboxes = currentInboxes.map((inbox) => {
        return {
          ...inbox,
          id: inbox.id || uuidv4(),
        };
      });

      const agentInboxSearchParam = getSearchParam(AGENT_INBOX_PARAM);
      logger.log(
        "Agent inbox search param for selection:",
        agentInboxSearchParam
      );

      // If there is no agent inbox search param, or the search param does not match any inbox
      // update search param and local storage
      if (!agentInboxSearchParam) {
        const selectedInbox = currentInboxes.find((inbox) => inbox.selected);
        if (!selectedInbox) {
          currentInboxes[0].selected = true;
          updateQueryParams(
            [AGENT_INBOX_PARAM, OFFSET_PARAM, LIMIT_PARAM, INBOX_PARAM],
            [currentInboxes[0].id, "0", "10", "interrupted"]
          );
          setAgentInboxes(currentInboxes);
          setItem(
            AGENT_INBOXES_LOCAL_STORAGE_KEY,
            JSON.stringify(currentInboxes)
          );
        } else {
          updateQueryParams(
            [AGENT_INBOX_PARAM, OFFSET_PARAM, LIMIT_PARAM, INBOX_PARAM],
            [selectedInbox.id, "0", "10", "interrupted"]
          );
          setAgentInboxes(currentInboxes);
          setItem(
            AGENT_INBOXES_LOCAL_STORAGE_KEY,
            JSON.stringify(currentInboxes)
          );
        }

        // Mark initial load as complete
        if (!initialLoadComplete.current) {
          initialLoadComplete.current = true;
        }

        return;
      }

      let finalSelectedInboxId: string | null = null;

      // Param exists: Find inbox by param ID
      const selectedByParam = currentInboxes.find(
        (inbox) => inbox.id === agentInboxSearchParam
      );

      if (selectedByParam) {
        finalSelectedInboxId = selectedByParam.id;
        logger.log("Found inbox by search param:", finalSelectedInboxId);
      } else {
        // Param exists but inbox not found: Select first
        finalSelectedInboxId = currentInboxes[0]?.id || null;
        logger.log(
          "Inbox for search param not found, selecting first inbox:",
          finalSelectedInboxId
        );
        if (finalSelectedInboxId) {
          // Update URL to reflect the actual selection
          updateQueryParams(AGENT_INBOX_PARAM, finalSelectedInboxId);
        }
      }

      // Apply the selection to the inboxes array
      const updatedInboxes = currentInboxes.map((inbox) => ({
        ...inbox,
        selected: inbox.id === finalSelectedInboxId,
      }));

      // Update state only if it has changed to avoid loops
      if (JSON.stringify(updatedInboxes) !== JSON.stringify(agentInboxes)) {
        logger.log(
          "Updating agentInboxes state with selection:",
          updatedInboxes
        );
        setAgentInboxes(updatedInboxes);
      }
    },
    [
      getSearchParam,
      getItem,
      agentInboxes, // Include agentInboxes state to compare against
      updateQueryParams,
    ]
  );

  /**
   * Add a new agent inbox
   * @param {AgentInbox} agentInbox - The agent inbox to add
   */
  const addAgentInbox = useCallback(
    (agentInbox: AgentInbox) => {
      const newInbox = {
        ...agentInbox,
        id: agentInbox.id || uuidv4(),
      };

      const agentInboxesStr = getItem(AGENT_INBOXES_LOCAL_STORAGE_KEY);

      // Handle empty inboxes
      if (!agentInboxesStr || agentInboxesStr === "[]") {
        setAgentInboxes([newInbox]);
        setItem(AGENT_INBOXES_LOCAL_STORAGE_KEY, JSON.stringify([newInbox]));
        // Set agent inbox, offset, and limit, and remove no_inboxes_found param
        updateQueryParams(
          [
            AGENT_INBOX_PARAM,
            OFFSET_PARAM,
            LIMIT_PARAM,
            INBOX_PARAM,
            NO_INBOXES_FOUND_PARAM,
          ],
          [newInbox.id, "0", "10", "interrupted", ""]
        );
        return;
      }

      try {
        const parsedAgentInboxes: AgentInbox[] = JSON.parse(agentInboxesStr);

        // Add the new inbox and mark as selected
        const updatedInboxes = parsedAgentInboxes.map((inbox) => ({
          ...inbox,
          selected: false,
        }));

        updatedInboxes.push({
          ...newInbox,
          selected: true,
        });

        setAgentInboxes(updatedInboxes);
        setItem(
          AGENT_INBOXES_LOCAL_STORAGE_KEY,
          JSON.stringify(updatedInboxes)
        );

        // Update URL to show the new inbox
        updateQueryParams(AGENT_INBOX_PARAM, newInbox.id);

        // Use router refresh to update the UI without full page reload
        router.refresh();
      } catch (error) {
        logger.error("Error adding agent inbox", error);
        toast({
          title: "Error",
          description: "Failed to add agent inbox. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    },
    [getItem, setItem, updateQueryParams, router]
  );

  /**
   * Delete an agent inbox by ID
   * @param {string} id - The ID of the agent inbox to delete
   */
  const deleteAgentInbox = useCallback(
    (id: string) => {
      const agentInboxesStr = getItem(AGENT_INBOXES_LOCAL_STORAGE_KEY);

      if (!agentInboxesStr || agentInboxesStr === "[]") {
        return;
      }

      try {
        const parsedAgentInboxes: AgentInbox[] = JSON.parse(agentInboxesStr);
        const wasSelected =
          parsedAgentInboxes.find((inbox) => inbox.id === id)?.selected ||
          false;
        const updatedInboxes = parsedAgentInboxes.filter(
          (inbox) => inbox.id !== id
        );

        // Handle empty result
        if (!updatedInboxes.length) {
          updateQueryParams(NO_INBOXES_FOUND_PARAM, "true");
          setAgentInboxes([]);
          setItem(AGENT_INBOXES_LOCAL_STORAGE_KEY, JSON.stringify([]));

          // Use router.push with just the current path
          router.push("/");
          return;
        }

        // Update state
        setAgentInboxes(updatedInboxes);

        // If we deleted the selected inbox, select the first one
        if (wasSelected && updatedInboxes.length > 0) {
          const firstInbox = updatedInboxes[0];
          const selectedInboxes = updatedInboxes.map((inbox) => ({
            ...inbox,
            selected: inbox.id === firstInbox.id,
          }));

          setAgentInboxes(selectedInboxes);
          setItem(
            AGENT_INBOXES_LOCAL_STORAGE_KEY,
            JSON.stringify(selectedInboxes)
          );
          updateQueryParams(AGENT_INBOX_PARAM, firstInbox.id);
        } else {
          setItem(
            AGENT_INBOXES_LOCAL_STORAGE_KEY,
            JSON.stringify(updatedInboxes)
          );
        }

        // Refresh data without full page reload
        router.refresh();
      } catch (error) {
        logger.error("Error deleting agent inbox", error);
        toast({
          title: "Error",
          description: "Failed to delete agent inbox. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    },
    [getItem, setItem, updateQueryParams, router]
  );

  /**
   * Change the selected agent inbox
   * @param {string} id - The ID of the agent inbox to select
   * @param {boolean} replaceAll - Whether to replace all query parameters
   */
  const changeAgentInbox = useCallback(
    (id: string, replaceAll?: boolean) => {
      // Update React state
      setAgentInboxes((prevInboxes) =>
        prevInboxes.map((inbox) => ({
          ...inbox,
          selected: inbox.id === id,
        }))
      );

      // Update localStorage
      const agentInboxesStr = getItem(AGENT_INBOXES_LOCAL_STORAGE_KEY);
      if (agentInboxesStr && agentInboxesStr !== "[]") {
        try {
          const parsedInboxes: AgentInbox[] = JSON.parse(agentInboxesStr);
          const updatedInboxes = parsedInboxes.map((inbox) => ({
            ...inbox,
            selected: inbox.id === id,
          }));

          setItem(
            AGENT_INBOXES_LOCAL_STORAGE_KEY,
            JSON.stringify(updatedInboxes)
          );
        } catch (error) {
          logger.error("Error updating selected inbox in localStorage", error);
        }
      }

      // Update URL parameters
      if (!replaceAll) {
        // Set agent inbox, offset, limit, and inbox param
        updateQueryParams(
          [AGENT_INBOX_PARAM, OFFSET_PARAM, LIMIT_PARAM, INBOX_PARAM],
          [id, "0", "10", "interrupted"]
        );
      } else {
        const url = new URL(window.location.href);
        const newParams = new URLSearchParams({
          [AGENT_INBOX_PARAM]: id,
          [OFFSET_PARAM]: "0",
          [LIMIT_PARAM]: "10",
          [INBOX_PARAM]: "interrupted",
        });
        const newUrl = url.pathname + "?" + newParams.toString();
        window.location.href = newUrl;
      }
    },
    [getItem, setItem, updateQueryParams, router]
  );

  /**
   * Update an existing agent inbox
   * @param {AgentInbox} updatedInbox - The updated agent inbox
   */
  const updateAgentInbox = useCallback(
    (updatedInbox: AgentInbox) => {
      const agentInboxesStr = getItem(AGENT_INBOXES_LOCAL_STORAGE_KEY);

      if (!agentInboxesStr || agentInboxesStr === "[]") {
        return;
      }

      try {
        const parsedInboxes: AgentInbox[] = JSON.parse(agentInboxesStr);
        const currentInbox = parsedInboxes.find(
          (inbox) => inbox.id === updatedInbox.id
        );

        if (!currentInbox) {
          logger.error("Inbox not found for update:", updatedInbox.id);
          return;
        }

        const wasSelected = currentInbox.selected;

        const updatedInboxes = parsedInboxes.map((inbox) =>
          inbox.id === updatedInbox.id
            ? { ...updatedInbox, selected: wasSelected }
            : inbox
        );

        setAgentInboxes(updatedInboxes);
        setItem(
          AGENT_INBOXES_LOCAL_STORAGE_KEY,
          JSON.stringify(updatedInboxes)
        );

        // Refresh data without full page reload
        router.refresh();
      } catch (error) {
        logger.error("Error updating agent inbox", error);
        toast({
          title: "Error",
          description: "Failed to update agent inbox. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    },
    [getItem, setItem, router]
  );

  return {
    agentInboxes,
    getAgentInboxes,
    addAgentInbox,
    deleteAgentInbox,
    changeAgentInbox,
    updateAgentInbox,
  };
}
