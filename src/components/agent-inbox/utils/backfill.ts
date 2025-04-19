/**
 * Agent Inbox Backfill Utilities
 *
 * This file contains utilities for backfilling inbox IDs to a new format.
 * The backfill process updates deployed graph IDs to use a project_id:graphId format,
 * ensuring consistent identification across the application. This is a one-time
 * migration process that runs automatically for users with deployed graphs.
 */

import { AgentInbox } from "../types";
import { isDeployedUrl, fetchDeploymentInfo } from "../utils";
import { AGENT_INBOXES_LOCAL_STORAGE_KEY } from "../constants";
import { logger } from "./logger";

// Key to track if the backfill has been performed
export const INBOX_ID_BACKFILL_COMPLETE_KEY = "inbox:id_backfill_completed";

/**
 * Checks if the backfill has already been completed
 */
export function isBackfillCompleted(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  // For development, we can force the backfill to run always by returning false
  // return false; // Force backfill to run again
  return localStorage.getItem(INBOX_ID_BACKFILL_COMPLETE_KEY) === "true";
}

/**
 * Checks if there are any deployed URLs in the user's inboxes
 * @returns boolean - true if there are deployed inboxes, false otherwise
 */
export function hasDeployedInboxes(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const inboxesStr = localStorage.getItem(AGENT_INBOXES_LOCAL_STORAGE_KEY);
  if (!inboxesStr) {
    return false;
  }

  try {
    const inboxes: AgentInbox[] = JSON.parse(inboxesStr);
    return inboxes.some((inbox) => isDeployedUrl(inbox.deploymentUrl));
  } catch (e) {
    logger.error("Error checking for deployed inboxes:", e);
    return false;
  }
}

/**
 * Marks the backfill as completed
 */
export function markBackfillCompleted(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(INBOX_ID_BACKFILL_COMPLETE_KEY, "true");
}

/**
 * Clears the backfill completed flag to force rerunning the backfill
 */
export function clearBackfillFlag(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(INBOX_ID_BACKFILL_COMPLETE_KEY);
}

/**
 * Backfills inbox IDs for deployed graphs to use the new format based on project_id
 * @param agentInboxes - The array of agent inboxes
 * @returns Promise<{updatedInboxes: AgentInbox[], madeChanges: boolean}> - The updated agent inboxes and whether changes were made
 */
export async function backfillInboxIds(
  agentInboxes: AgentInbox[]
): Promise<{ updatedInboxes: AgentInbox[]; madeChanges: boolean }> {
  if (!agentInboxes.length) {
    logger.log("No inboxes to backfill");
    return { updatedInboxes: [], madeChanges: false };
  }

  logger.log("Starting backfill for inboxes:", agentInboxes);
  const updatedInboxes: AgentInbox[] = [];
  let madeChanges = false;

  for (const inbox of agentInboxes) {
    try {
      // Only process deployed graphs
      if (isDeployedUrl(inbox.deploymentUrl)) {
        logger.log(
          `Processing deployed inbox ${inbox.id} with URL ${inbox.deploymentUrl}`
        );

        // Skip if the ID is already in the new format (contains a colon)
        if (inbox.id && inbox.id.includes(":")) {
          logger.log(`Inbox ${inbox.id} already has new format ID, skipping`);
          updatedInboxes.push(inbox);
          continue;
        }

        try {
          // Fetch deployment info
          const deploymentInfo = await fetchDeploymentInfo(inbox.deploymentUrl);
          logger.log(`Got deployment info for ${inbox.id}:`, deploymentInfo);

          if (
            deploymentInfo &&
            deploymentInfo.host &&
            deploymentInfo.host.project_id
          ) {
            // Update the ID to the new format: project_id:graphId
            const newId = `${deploymentInfo.host.project_id}:${inbox.graphId}`;
            logger.log(`Updating inbox ID from ${inbox.id} to ${newId}`);

            updatedInboxes.push({
              ...inbox,
              id: newId,
              tenantId: deploymentInfo.host.tenant_id || undefined,
            });

            madeChanges = true;
            continue;
          } else {
            logger.log(
              `No project_id found for inbox ${inbox.id}, keeping original ID`
            );
          }
        } catch (error) {
          logger.error(
            `Error fetching deployment info for inbox ${inbox.id}:`,
            error
          );
        }
      } else {
        logger.log(`Inbox ${inbox.id} is a local graph, keeping original ID`);
      }

      // For local graphs or if there was an error, keep the existing ID
      updatedInboxes.push(inbox);
    } catch (e) {
      logger.error(`Unexpected error processing inbox ${inbox.id}:`, e);
      // Keep the original inbox in case of errors
      updatedInboxes.push(inbox);
    }
  }

  logger.log("Backfill completed, updated inboxes:", updatedInboxes);
  return { updatedInboxes, madeChanges };
}

/**
 * Runs the backfill process for all agent inboxes
 * @returns Promise<{success: boolean, updatedInboxes: AgentInbox[]}> - Status and updated inboxes
 */
export async function runInboxBackfill(): Promise<{
  success: boolean;
  updatedInboxes: AgentInbox[];
}> {
  try {
    // Check if backfill has already been completed
    if (isBackfillCompleted()) {
      logger.log("Backfill already completed, skipping");

      // Get current inboxes to return them
      const inboxesStr = localStorage.getItem(AGENT_INBOXES_LOCAL_STORAGE_KEY);
      const currentInboxes = inboxesStr ? JSON.parse(inboxesStr) : [];
      return { success: true, updatedInboxes: currentInboxes };
    }

    // Check if there are any deployed inboxes that need backfilling
    if (!hasDeployedInboxes()) {
      logger.log("No deployed inboxes found, skipping backfill");
      markBackfillCompleted();

      // Get current inboxes to return them
      const inboxesStr = localStorage.getItem(AGENT_INBOXES_LOCAL_STORAGE_KEY);
      const currentInboxes = inboxesStr ? JSON.parse(inboxesStr) : [];
      return { success: true, updatedInboxes: currentInboxes };
    }

    // Get agent inboxes from localStorage
    const inboxesStr = localStorage.getItem(AGENT_INBOXES_LOCAL_STORAGE_KEY);
    logger.log("Running backfill on inboxes from localStorage:", inboxesStr);

    if (!inboxesStr || inboxesStr === "[]") {
      logger.log(
        "No inboxes found in localStorage, marking backfill as completed"
      );
      markBackfillCompleted();
      return { success: true, updatedInboxes: [] };
    }

    let inboxes: AgentInbox[] = [];
    try {
      inboxes = JSON.parse(inboxesStr);
      logger.log("Parsed inboxes:", inboxes);
      if (!inboxes.length) {
        logger.log("Empty inboxes array, marking backfill as completed");
        markBackfillCompleted();
        return { success: true, updatedInboxes: [] };
      }
    } catch (e) {
      logger.error("Error parsing inbox data:", e);
      // Don't mark as completed if we couldn't parse
      return { success: false, updatedInboxes: [] };
    }

    logger.log("Starting backfill for", inboxes.length, "inboxes");

    // Backfill the inboxes
    const { updatedInboxes, madeChanges } = await backfillInboxIds(inboxes);

    // Check if backfill made any changes
    const anyChanges = updatedInboxes.some((updatedInbox, index) => {
      return updatedInbox.id !== inboxes[index].id;
    });

    logger.log("Backfill completed, changes made:", anyChanges || madeChanges);
    logger.log("Updated inboxes:", updatedInboxes);

    // Save the updated inboxes
    localStorage.setItem(
      AGENT_INBOXES_LOCAL_STORAGE_KEY,
      JSON.stringify(updatedInboxes)
    );

    // Only mark as completed if we successfully processed all inboxes
    markBackfillCompleted();

    return { success: true, updatedInboxes };
  } catch (error) {
    logger.error("Error during inbox ID backfill:", error);
    // Don't mark as completed if there was an error
    return { success: false, updatedInboxes: [] };
  }
}

/**
 * Forces the backfill process to run again, even if it was previously completed
 * @returns Promise<{success: boolean, updatedInboxes: AgentInbox[]}> - Status and updated inboxes
 */
export async function forceInboxBackfill(): Promise<{
  success: boolean;
  updatedInboxes: AgentInbox[];
}> {
  try {
    logger.log("Force running inbox backfill...");

    // Clear the backfill completed flag
    clearBackfillFlag();

    // Get agent inboxes from localStorage
    const inboxesStr = localStorage.getItem(AGENT_INBOXES_LOCAL_STORAGE_KEY);
    logger.log("Inboxes from localStorage:", inboxesStr);

    if (!inboxesStr) {
      logger.log("No inboxes found in localStorage");
      return { success: false, updatedInboxes: [] };
    }

    let inboxes: AgentInbox[] = [];
    try {
      inboxes = JSON.parse(inboxesStr);
    } catch (e) {
      logger.error("Error parsing inbox data:", e);
      return { success: false, updatedInboxes: [] };
    }

    if (!inboxes.length) {
      logger.log("Empty inboxes array");
      return { success: false, updatedInboxes: [] };
    }

    logger.log("Force backfilling", inboxes.length, "inboxes");

    // Backfill the inboxes
    const { updatedInboxes } = await backfillInboxIds(inboxes);

    // Save the updated inboxes regardless of changes
    localStorage.setItem(
      AGENT_INBOXES_LOCAL_STORAGE_KEY,
      JSON.stringify(updatedInboxes)
    );

    // Mark as completed
    markBackfillCompleted();

    return { success: true, updatedInboxes };
  } catch (error) {
    logger.error("Error during forced inbox ID backfill:", error);
    return { success: false, updatedInboxes: [] };
  }
}

/**
 * Utility function to debug and reset inbox data if needed
 * Can be called from browser console: window.resetInboxData()
 */
export function debugAndResetInboxData() {
  try {
    if (typeof window === "undefined") {
      logger.log("Not in browser environment");
      return false;
    }

    // Display current data
    const backfillStatus = localStorage.getItem(INBOX_ID_BACKFILL_COMPLETE_KEY);
    const inboxesRaw = localStorage.getItem(AGENT_INBOXES_LOCAL_STORAGE_KEY);

    logger.log("=== INBOX DEBUG INFO ===");
    logger.log("Backfill completed:", backfillStatus);
    logger.log("Raw inbox data:", inboxesRaw);

    if (inboxesRaw) {
      try {
        const parsed = JSON.parse(inboxesRaw);
        logger.log("Parsed inboxes:", parsed);
      } catch (e) {
        logger.error("Failed to parse inbox data:", e);
      }
    }

    // Reset data if confirmed
    if (
      confirm("Do you want to reset inbox data? This will clear all inboxes.")
    ) {
      localStorage.removeItem(AGENT_INBOXES_LOCAL_STORAGE_KEY);
      localStorage.removeItem(INBOX_ID_BACKFILL_COMPLETE_KEY);
      logger.log("Inbox data has been reset");

      if (confirm("Reload page?")) {
        window.location.reload();
      }
      return true;
    }

    return false;
  } catch (error) {
    logger.error("Error in debug function:", error);
    return false;
  }
}

// Expose function to window for console access
if (typeof window !== "undefined") {
  (window as any).resetInboxData = debugAndResetInboxData;
  (window as any).forceBackfill = forceInboxBackfill;
}
