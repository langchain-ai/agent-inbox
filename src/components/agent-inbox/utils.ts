import { BaseMessage, isBaseMessage } from "@langchain/core/messages";
import { format } from "date-fns";
import { startCase } from "lodash";
import {
  HumanInterrupt,
  HumanResponseWithEdits,
  SubmitType,
  AgentInbox,
} from "./types";
import { logger } from "./utils/logger";
import { validate } from "uuid";

export function prettifyText(action: string) {
  return startCase(action.replace(/_/g, " "));
}

/**
 * Determines if a URL is a deployed (cloud) URL.
 */
export function isDeployedUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // Simple check: Does it start with https and not contain localhost?
    return (
      parsedUrl.protocol === "https:" &&
      !parsedUrl.hostname.includes("localhost")
    );
  } catch (_e) {
    // If parsing fails, assume it's not a valid deployed URL
    return false;
  }
}

export function isArrayOfMessages(
  value: Record<string, any>[]
): value is BaseMessage[] {
  if (
    value.every(isBaseMessage) ||
    (Array.isArray(value) &&
      value.every(
        (v) =>
          typeof v === "object" &&
          "id" in v &&
          "type" in v &&
          "content" in v &&
          "additional_kwargs" in v
      ))
  ) {
    return true;
  }
  return false;
}

export function baseMessageObject(item: unknown): string {
  if (isBaseMessage(item)) {
    const contentText =
      typeof item.content === "string"
        ? item.content
        : JSON.stringify(item.content, null);
    let toolCallText = "";
    if ("tool_calls" in item) {
      toolCallText = JSON.stringify(item.tool_calls, null);
    }
    if ("type" in item) {
      return `${item.type}:${contentText ? ` ${contentText}` : ""}${toolCallText ? ` - Tool calls: ${toolCallText}` : ""}`;
    } else if ("_getType" in item) {
      return `${item._getType()}:${contentText ? ` ${contentText}` : ""}${toolCallText ? ` - Tool calls: ${toolCallText}` : ""}`;
    }
  } else if (
    typeof item === "object" &&
    item &&
    "type" in item &&
    "content" in item
  ) {
    const contentText =
      typeof item.content === "string"
        ? item.content
        : JSON.stringify(item.content, null);
    let toolCallText = "";
    if ("tool_calls" in item) {
      toolCallText = JSON.stringify(item.tool_calls, null);
    }
    return `${item.type}:${contentText ? ` ${contentText}` : ""}${toolCallText ? ` - Tool calls: ${toolCallText}` : ""}`;
  }

  if (typeof item === "object") {
    return JSON.stringify(item, null);
  } else {
    return item as string;
  }
}

export function unknownToPrettyDate(input: unknown): string | undefined {
  try {
    if (
      Object.prototype.toString.call(input) === "[object Date]" ||
      new Date(input as string)
    ) {
      return format(new Date(input as string), "MM/dd/yyyy hh:mm a");
    }
  } catch (_) {
    // failed to parse date. no-op
  }
  return undefined;
}

export function constructOpenInStudioURL(
  inbox: AgentInbox,
  threadId?: string
): string {
  const smithStudioBaseUrl = "https://smith.langchain.com/studio/thread";

  if (isDeployedUrl(inbox.deploymentUrl)) {
    const projectId = extractProjectId(inbox.id);
    const tenantId = inbox.tenantId;

    if (projectId && tenantId && threadId) {
      const url = new URL(smithStudioBaseUrl);
      url.searchParams.set("organizationId", tenantId);
      url.searchParams.set("hostProjectId", projectId);
      url.searchParams.set("threadId", threadId);
      return url.toString();
    } else {
      // Handle missing data for deployed graph - return a non-functional link or log error
      console.warn(
        "Cannot construct Studio URL for deployed graph: Missing projectId, tenantId, or threadId",
        {
          inboxId: inbox.id,
          hasProjectId: !!projectId,
          hasTenantId: !!tenantId,
          hasThreadId: !!threadId,
        }
      );
      return "#"; // Return a placeholder/non-functional link
    }
  } else {
    // --- Logic for local/non-deployed URLs ---
    const smithStudioURL = new URL(smithStudioBaseUrl);
    const trimmedDeploymentUrl = inbox.deploymentUrl.replace(/\/$/, "");

    if (threadId) {
      smithStudioURL.searchParams.append("threadId", threadId);
    }

    smithStudioURL.searchParams.append("baseUrl", trimmedDeploymentUrl);
    // -----------------------------------------------------

    return smithStudioURL.toString();
  }
}

export function createDefaultHumanResponse(
  interrupts: HumanInterrupt[],
  initialHumanInterruptEditValue: React.MutableRefObject<Record<string, string>>
): {
  responses: HumanResponseWithEdits[];
  defaultSubmitType: SubmitType | undefined;
  hasAccept: boolean;
} {
  const interrupt = interrupts[0];

  const responses: HumanResponseWithEdits[] = [];
  if (interrupt.config.allow_edit) {
    if (interrupt.config.allow_accept) {
      Object.entries(interrupt.action_request.args).forEach(([k, v]) => {
        let stringValue = "";
        if (typeof v === "string") {
          stringValue = v;
        } else {
          stringValue = JSON.stringify(v, null);
        }

        if (
          !initialHumanInterruptEditValue.current ||
          !(k in initialHumanInterruptEditValue.current)
        ) {
          initialHumanInterruptEditValue.current = {
            ...initialHumanInterruptEditValue.current,
            [k]: stringValue,
          };
        } else if (
          k in initialHumanInterruptEditValue.current &&
          initialHumanInterruptEditValue.current[k] !== stringValue
        ) {
          logger.error(
            "KEY AND VALUE FOUND IN initialHumanInterruptEditValue.current THAT DOES NOT MATCH THE ACTION REQUEST",
            {
              key: k,
              value: stringValue,
              expectedValue: initialHumanInterruptEditValue.current[k],
            }
          );
        }
      });
      responses.push({
        type: "edit",
        args: interrupt.action_request,
        acceptAllowed: true,
        editsMade: false,
      });
    } else {
      responses.push({
        type: "edit",
        args: interrupt.action_request,
        acceptAllowed: false,
      });
    }
  }
  if (interrupt.config.allow_respond) {
    responses.push({
      type: "response",
      args: "",
    });
  }

  if (interrupt.config.allow_ignore) {
    responses.push({
      type: "ignore",
      args: null,
    });
  }

  // Set the submit type.
  // Priority: accept > response  > edit
  const acceptAllowedConfig = interrupts.find((i) => i.config.allow_accept);
  const ignoreAllowedConfig = interrupts.find((i) => i.config.allow_ignore);

  const hasResponse = responses.find((r) => r.type === "response");
  const hasAccept =
    responses.find((r) => r.acceptAllowed) || acceptAllowedConfig;
  const hasEdit = responses.find((r) => r.type === "edit");

  let defaultSubmitType: SubmitType | undefined;
  if (hasAccept) {
    defaultSubmitType = "accept";
  } else if (hasResponse) {
    defaultSubmitType = "response";
  } else if (hasEdit) {
    defaultSubmitType = "edit";
  }

  if (acceptAllowedConfig && !responses.find((r) => r.type === "accept")) {
    responses.push({
      type: "accept",
      args: null,
    });
  }
  if (ignoreAllowedConfig && !responses.find((r) => r.type === "ignore")) {
    responses.push({
      type: "ignore",
      args: null,
    });
  }

  return { responses, defaultSubmitType, hasAccept: !!hasAccept };
}

export function haveArgsChanged(
  args: unknown,
  initialValues: Record<string, string>
): boolean {
  if (typeof args !== "object" || !args) {
    return false;
  }

  const currentValues = args as Record<string, string>;

  return Object.entries(currentValues).some(([key, value]) => {
    const valueString = ["string", "number"].includes(typeof value)
      ? value.toString()
      : JSON.stringify(value, null);
    return initialValues[key] !== valueString;
  });
}

/**
 * Interface for deployment info response
 */
export interface DeploymentInfoResponse {
  flags: {
    assistants: boolean;
    crons: boolean;
    langsmith: boolean;
  };
  host: {
    kind: string;
    project_id: string | null;
    revision_id: string;
    tenant_id: string | null;
  };
}

/**
 * Verifies that a deployment URL is reachable by pinging its /info endpoint.
 * Works for both local (localhost) and deployed (cloud) URLs.
 * @param url The deployment URL to verify
 * @param options Optional configuration (e.g. timeout in ms, default 5000)
 */
export async function verifyDeploymentUrl(
  url: string,
  options?: { timeoutMs?: number }
): Promise<{ reachable: boolean; error?: string }> {
  const timeoutMs = options?.timeoutMs ?? 5000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const baseUrl = url.replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/info`, {
      method: "GET",
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        reachable: false,
        error: `Server responded with status ${response.status}`,
      };
    }

    return { reachable: true };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        reachable: false,
        error: "Connection timed out. Make sure the server is running.",
      };
    }
    return {
      reachable: false,
      error: "Could not connect. Make sure the server is running and the URL is correct.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetches information about a deployment from its /info endpoint
 * @param deploymentUrl The URL of the deployment to fetch info from
 */
export async function fetchDeploymentInfo(
  deploymentUrl: string
): Promise<DeploymentInfoResponse | null> {
  try {
    // Ensure deploymentUrl doesn't end with a slash
    const baseUrl = deploymentUrl.replace(/\/$/, "");
    const infoUrl = `${baseUrl}/info`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const response = await fetch(infoUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      logger.error(`Error fetching deployment info: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data as DeploymentInfoResponse;
  } catch (error) {
    logger.error("Error fetching deployment info:", error);
    return null;
  }
}

export function extractProjectId(inboxId: string): string | null {
  if (!inboxId || !inboxId.includes(":")) {
    return null;
  }
  const parts = inboxId.split(":");
  if (parts.length === 2) {
    // Ensure the first part is a valid UUID
    if (validate(parts[0])) {
      return parts[0];
    }
  }
  return null;
}
