"""Human in the loop middleware compatible with agent-inbox."""

from typing import Any, Literal, TypedDict, Union

from langchain.agents.middleware import HumanInTheLoopMiddleware
from langchain.agents.middleware.human_in_the_loop import (
    ActionRequest,
    HITLRequest,
    ReviewConfig,
)
from langchain.agents.middleware.types import (
    AgentState,
    ContextT,
)
from langchain_core.messages import AIMessage, ToolCall, ToolMessage
from langgraph.runtime import Runtime
from langgraph.types import interrupt


class AgentInboxActionRequest(TypedDict):
    """Action request with name and arguments for agent-inbox."""

    action: str
    args: dict


class AgentInboxConfig(TypedDict):
    """Configuration for allowed human responses in agent-inbox."""

    allow_ignore: bool
    allow_respond: bool
    allow_edit: bool
    allow_accept: bool


class AgentInboxInterrupt(TypedDict):
    """Full interrupt payload for agent-inbox."""

    action_request: AgentInboxActionRequest
    config: AgentInboxConfig
    description: str | None


class AgentInboxResponse(TypedDict):
    """Response from human via agent-inbox."""

    type: Literal["accept", "ignore", "response", "edit"]
    args: Union[None, str, AgentInboxActionRequest]


class AgentInboxMiddleware(HumanInTheLoopMiddleware):
    """This middleware behaves exactly like the Langchain HumanInTheLoopMiddleware, but is compatible with the agent-inbox format.

    See https://docs.langchain.com/oss/python/langchain/human-in-the-loop for the base middleware documentation.
    """

    def _to_agent_inbox_format(
        self,
        hitl_request: HITLRequest,
    ) -> list[AgentInboxInterrupt]:
        """Transform HITLRequest to agent-inbox compatible interrupt format.

        Args:
            hitl_request: The HITLRequest from the middleware.

        Returns:
            List of AgentInboxInterrupt payloads for agent-inbox.
        """
        interrupts: list[AgentInboxInterrupt] = []

        for action_request, review_config in zip(
            hitl_request["action_requests"],
            hitl_request["review_configs"],
            strict=True,
        ):
            # Map allowed_decisions to agent-inbox config flags
            allowed_decisions = review_config.get("allowed_decisions", [])

            config: AgentInboxConfig = {
                "allow_accept": "approve" in allowed_decisions,
                "allow_edit": "edit" in allowed_decisions,
                "allow_ignore": False,  # ignore is not supported
                "allow_respond": "reject" in allowed_decisions,
            }
            description = action_request["description"]

            interrupt_payload: AgentInboxInterrupt = {
                "action_request": {
                    "action": action_request["name"],
                    "args": action_request["args"],
                },
                "config": config,
                "description": description,
            }
            interrupts.append(interrupt_payload)

        return interrupts

    def _from_agent_inbox_format(
        self,
        responses: list[AgentInboxResponse],
    ) -> dict[str, list[dict[str, Any]]]:
        """Transform agent-inbox responses to middleware decisions format.

        Args:
            responses: List of AgentInboxResponse from agent-inbox.

        Returns:
            Dict with "decisions" key containing list of middleware-compatible decisions.
        """
        decisions: list[dict[str, Any]] = []

        for response in responses:
            response_type = response["type"]
            args = response.get("args")

            if response_type == "accept":
                decisions.append({"type": "approve"})
            elif response_type == "ignore":
                raise ValueError("Ignore response is not supported.")
            elif response_type == "response":
                # User provided text feedback - maps to reject with their message
                if not isinstance(args, str):
                    raise TypeError(
                        f"Invalid response args: must be a string, got: {type(args)}"
                    )
                decisions.append({"type": "reject", "message": args})
            elif response_type == "edit":
                # User edited the arguments - args contains {action, args}
                if isinstance(args, dict):
                    edited_action = {
                        "name": args.get("action", ""),
                        "args": args.get("args", {}),
                    }
                    decisions.append({"type": "edit", "edited_action": edited_action})
                else:
                    raise ValueError(f"Edit response must have dict args, got: {args}")
            else:
                raise ValueError(f"Invalid agent-inbox response type: {response_type}")

        return {"decisions": decisions}

    def after_model(
        self, state: AgentState[Any], runtime: Runtime[ContextT]
    ) -> dict[str, Any] | None:
        """Trigger interrupt flows for relevant tool calls after an `AIMessage`.

        Args:
            state: The current agent state.
            runtime: The runtime context.

        Returns:
            Updated message with the revised tool calls.

        Raises:
            ValueError: If the number of human decisions does not match the number of
                interrupted tool calls.
        """
        messages = state["messages"]
        if not messages:
            return None

        last_ai_msg = next(
            (msg for msg in reversed(messages) if isinstance(msg, AIMessage)), None
        )
        if not last_ai_msg or not last_ai_msg.tool_calls:
            return None

        # Create action requests and review configs for tools that need approval
        action_requests: list[ActionRequest] = []
        review_configs: list[ReviewConfig] = []
        interrupt_indices: list[int] = []

        for idx, tool_call in enumerate(last_ai_msg.tool_calls):
            if (config := self.interrupt_on.get(tool_call["name"])) is not None:
                action_request, review_config = self._create_action_and_config(
                    tool_call, config, state, runtime
                )
                action_requests.append(action_request)
                review_configs.append(review_config)
                interrupt_indices.append(idx)

        # If no interrupts needed, return early
        if not action_requests:
            return None

        # Create single HITLRequest with all actions and configs
        hitl_request = HITLRequest(
            action_requests=action_requests,
            review_configs=review_configs,
        )

        # Transform to agent-inbox format and send interrupt
        agent_inbox_interrupts = self._to_agent_inbox_format(hitl_request)
        agent_inbox_responses = interrupt(agent_inbox_interrupts)

        # Transform agent-inbox responses back to middleware decisions format
        decisions = self._from_agent_inbox_format(agent_inbox_responses)["decisions"]

        # Validate that the number of decisions matches the number of interrupt tool calls
        if (decisions_len := len(decisions)) != (
            interrupt_count := len(interrupt_indices)
        ):
            msg = (
                f"Number of human decisions ({decisions_len}) does not match "
                f"number of hanging tool calls ({interrupt_count})."
            )
            raise ValueError(msg)

        # Process decisions and rebuild tool calls in original order
        revised_tool_calls: list[ToolCall] = []
        artificial_tool_messages: list[ToolMessage] = []
        decision_idx = 0

        for idx, tool_call in enumerate(last_ai_msg.tool_calls):
            if idx in interrupt_indices:
                # This was an interrupt tool call - process the decision
                config = self.interrupt_on[tool_call["name"]]
                decision = decisions[decision_idx]
                decision_idx += 1

                revised_tool_call, tool_message = self._process_decision(
                    decision, tool_call, config
                )
                if revised_tool_call is not None:
                    revised_tool_calls.append(revised_tool_call)
                if tool_message:
                    artificial_tool_messages.append(tool_message)
            else:
                # This was auto-approved - keep original
                revised_tool_calls.append(tool_call)

        # Update the AI message to only include approved tool calls
        last_ai_msg.tool_calls = revised_tool_calls

        return {"messages": [last_ai_msg, *artificial_tool_messages]}

    async def aafter_model(
        self, state: AgentState[Any], runtime: Runtime[ContextT]
    ) -> dict[str, Any] | None:
        """Async trigger interrupt flows for relevant tool calls after an `AIMessage`.

        Args:
            state: The current agent state.
            runtime: The runtime context.

        Returns:
            Updated message with the revised tool calls.
        """
        return self.after_model(state, runtime)
