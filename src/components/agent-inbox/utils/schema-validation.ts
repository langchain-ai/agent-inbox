import { HumanInterrupt } from "../types";

/**
 * Type guard to check if a value is a valid agent inbox interrupt schema
 * 
 * Checks for the core structure without validating every property
 */
export function isAgentInboxInterruptSchema(
  value: unknown
): value is HumanInterrupt | HumanInterrupt[] {
  // Handle array case
  if (Array.isArray(value)) {
    return value.length > 0 && isAgentInboxInterruptObject(value[0]);
  }
  
  return isAgentInboxInterruptObject(value);
}

/**
 * Helper function to check if an object matches the core HumanInterrupt schema
 * 
 * We only check for the essential properties that define the structure
 * rather than validating every single field
 */
function isAgentInboxInterruptObject(value: unknown): value is HumanInterrupt {
  if (!value || typeof value !== "object") return false;
  
  const obj = value as Record<string, unknown>;
  
  // Check for action_request with action property
  if (!obj.action_request || typeof obj.action_request !== "object") return false;
  const actionRequest = obj.action_request as Record<string, unknown>;
  if (!("action" in actionRequest)) return false;
  
  // Check for config property - we just need this to exist
  if (!obj.config || typeof obj.config !== "object") return false;
  
  return true;
} 