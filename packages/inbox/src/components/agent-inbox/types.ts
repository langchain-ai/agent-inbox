import { BaseMessage } from "@langchain/core/messages";
import { Thread, ThreadStatus } from "@langchain/langgraph-sdk";

export interface HumanInterruptConfig {
  allow_ignore: boolean;
  allow_respond: boolean;
  allow_edit: boolean;
  allow_accept: boolean;
}

export interface ActionRequest {
  action: string;
  args: Record<string, any>;
}

export interface HumanInterrupt {
  action_request: ActionRequest;
  config: HumanInterruptConfig;
  description?: string;
}

export type HumanResponse = {
  type: "accept" | "ignore" | "response" | "edit";
  args: null | string | ActionRequest;
};

export type HumanResponseWithEdits = HumanResponse & ({ acceptAllowed?: false, editsMade?: never } | { acceptAllowed?: true, editsMade?: boolean });

export type Email = {
  id: string;
  thread_id: string;
  from_email: string;
  to_email: string;
  subject: string;
  page_content: string;
  send_time: string | undefined;
  read?: boolean;
  status?: "in-queue" | "processing" | "hitl" | "done";
};

export interface ThreadValues {
  email: Email;
  messages: BaseMessage[];
  triage: {
    logic: string;
    response: string;
  };
}

export type ThreadData<
  ThreadValues extends Record<string, any> = Record<string, any>,
> = {
  thread: Thread<ThreadValues>;
} & (
  | {
      status: "interrupted";
      interrupts: HumanInterrupt[];
    }
  | {
      status: "idle" | "busy" | "error";
      interrupts?: never;
    }
);

export type ThreadStatusWithAll = ThreadStatus | "all";
