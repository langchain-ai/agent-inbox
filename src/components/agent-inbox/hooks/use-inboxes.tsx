import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import { useQueryParams } from "./use-query-params";
import {
  AGENT_INBOX_PARAM,
  AGENT_INBOXES_LOCAL_STORAGE_KEY,
  NO_INBOXES_FOUND_PARAM,
} from "../constants";
import { useLocalStorage } from "./use-local-storage";
import { useState, useCallback, useEffect, useRef } from "react";
import { AgentInbox } from "../types";
import { useRouter } from "next/navigation";
import { logger } from "../utils/logger";

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
  const { getSearchParam, searchParams, updateQueryParams } = useQueryParams();
  const router = useRouter();
  const { getItem, setItem } = useLocalStorage();
  const { toast } = useToast();
  const [agentInboxes, setAgentInboxes] = useState<AgentInbox[]>([]);
  const initialLoadComplete = useRef(false);

  const agentInboxParam = searchParams.get(AGENT_INBOX_PARAM);

  /**
   * Load agent inboxes from local storage when component mounts
   * or when the agent inbox parameter changes
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      getAgentInboxes();
    } catch (e) {
      logger.error("Error occurred while fetching agent inboxes", e);
    }
  }, [agentInboxParam]);

  /**
   * Load agent inboxes from local storage and set up proper selection state
   */
  const getAgentInboxes = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    const agentInboxSearchParam = getSearchParam(AGENT_INBOX_PARAM);
    const agentInboxesStr = getItem(AGENT_INBOXES_LOCAL_STORAGE_KEY);

    logger.log("Loaded inboxes from localStorage:", agentInboxesStr);

    // Handle empty or invalid data
    if (!agentInboxesStr || agentInboxesStr === "[]") {
      logger.log("No inboxes found in localStorage");
      updateQueryParams(NO_INBOXES_FOUND_PARAM, "true");
      setAgentInboxes([]);
      return;
    }

    // Parse inbox data
    let parsedAgentInboxes: AgentInbox[] = [];
    try {
      parsedAgentInboxes = JSON.parse(agentInboxesStr);
      logger.log("Parsed inboxes:", parsedAgentInboxes);
    } catch (error) {
      logger.error("Error parsing agent inboxes", error);
      toast({
        title: "Error",
        description:
          "Failed to load agent inboxes. Please try adding an inbox.",
        variant: "destructive",
        duration: 3000,
      });
      setAgentInboxes([]);
      return;
    }

    // Handle empty array case
    if (!parsedAgentInboxes.length) {
      const noInboxesFoundParam = searchParams.get(NO_INBOXES_FOUND_PARAM);
      if (noInboxesFoundParam !== "true") {
        updateQueryParams(NO_INBOXES_FOUND_PARAM, "true");
      }
      setAgentInboxes([]);
      return;
    }

    // Ensure each inbox has a valid ID
    parsedAgentInboxes = parsedAgentInboxes.map((inbox) => ({
      ...inbox,
      id: inbox.id || uuidv4(),
    }));

    logger.log("Agent inbox search param:", agentInboxSearchParam);
    logger.log(
      "Available inboxes:",
      parsedAgentInboxes.map((i) => i.id)
    );

    // Handle case with no search param - select the first inbox or one that's already selected
    if (!agentInboxSearchParam) {
      // Find already selected inbox or use the first one
      const selectedInbox =
        parsedAgentInboxes.find((inbox) => inbox.selected) ||
        parsedAgentInboxes[0];

      // Mark the selected inbox
      const updatedInboxes = parsedAgentInboxes.map((inbox) => ({
        ...inbox,
        selected: inbox.id === selectedInbox.id,
      }));

      // Update state
      setAgentInboxes(updatedInboxes);
      setItem(AGENT_INBOXES_LOCAL_STORAGE_KEY, JSON.stringify(updatedInboxes));

      // Update URL parameter without causing a re-render cycle
      if (!initialLoadComplete.current) {
        initialLoadComplete.current = true;
        updateQueryParams(AGENT_INBOX_PARAM, selectedInbox.id);
      }

      return;
    }

    // Find inbox by ID - the ID could be a generated UUID or a combined deployment & graph ID
    const selectedInbox = parsedAgentInboxes.find(
      (inbox) => inbox.id === agentInboxSearchParam
    );

    // If not found, select the first inbox
    if (!selectedInbox && parsedAgentInboxes.length > 0) {
      logger.log("Inbox not found with ID:", agentInboxSearchParam);
      logger.log("Selecting first inbox instead");

      const firstInbox = parsedAgentInboxes[0];

      // Update inboxes to select the first one
      const updatedInboxes = parsedAgentInboxes.map((inbox) => ({
        ...inbox,
        selected: inbox.id === firstInbox.id,
      }));

      setAgentInboxes(updatedInboxes);
      setItem(AGENT_INBOXES_LOCAL_STORAGE_KEY, JSON.stringify(updatedInboxes));

      // Update URL parameter
      updateQueryParams(AGENT_INBOX_PARAM, firstInbox.id);
      return;
    }

    // Update all inboxes to reflect the current selection
    const updatedInboxes = parsedAgentInboxes.map((inbox) => ({
      ...inbox,
      selected: selectedInbox ? inbox.id === selectedInbox.id : false,
    }));

    setAgentInboxes(updatedInboxes);
    setItem(AGENT_INBOXES_LOCAL_STORAGE_KEY, JSON.stringify(updatedInboxes));
  }, [
    getSearchParam,
    searchParams,
    getItem,
    setItem,
    toast,
    updateQueryParams,
  ]);

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
        updateQueryParams(AGENT_INBOX_PARAM, newInbox.id);
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
        updateQueryParams(AGENT_INBOX_PARAM, id);
      } else {
        // Use URLSearchParams to construct the URL properly
        const searchParams = new URLSearchParams();
        searchParams.set(AGENT_INBOX_PARAM, id);
        const newUrl = `/?${searchParams.toString()}`;
        router.push(newUrl);
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
