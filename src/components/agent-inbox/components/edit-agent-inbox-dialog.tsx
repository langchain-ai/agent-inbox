import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { AgentInbox } from "../types";
import { useInboxes } from "../hooks/use-inboxes";

export function EditAgentInboxDialog({
  agentInbox,
}: {
  /**
   * The agent inbox to edit
   */
  agentInbox: AgentInbox;
}) {
  const { updateAgentInbox } = useInboxes();
  const { toast } = useToast();
  const [graphId, setGraphId] = React.useState(agentInbox.graphId);
  const [deploymentUrl, setDeploymentUrl] = React.useState(
    agentInbox.deploymentUrl
  );
  const [name, setName] = React.useState(agentInbox.name || "");

  // Initialize form values when the component mounts
  React.useEffect(() => {
    setGraphId(agentInbox.graphId);
    setDeploymentUrl(agentInbox.deploymentUrl);
    setName(agentInbox.name || "");
  }, [agentInbox]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      // Update the inbox using the hook's function
      updateAgentInbox({
        ...agentInbox,
        graphId,
        deploymentUrl,
        name,
      });

      toast({
        title: "Success",
        description: "Agent inbox updated successfully",
        duration: 3000,
      });

      // Force a page reload to reflect changes
      window.location.reload();
    } catch (error) {
      console.error("Error updating agent inbox", error);
      toast({
        title: "Error",
        description: "Failed to update agent inbox",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Edit Inbox</DialogTitle>
      </DialogHeader>
      <form
        className="flex flex-col items-center justify-center gap-4 py-4 w-full"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-2 items-start justify-start w-full">
          <Label htmlFor="graph-id" className="text-right">
            Assistant/Graph ID <span className="text-red-500">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">
            This is the ID of the graph (can be the graph name), or assistant to
            fetch threads from, and invoke when actions are taken.
          </p>
          <Input
            id="graph-id"
            placeholder="my_graph"
            className="col-span-3"
            required
            value={graphId}
            onChange={(e) => setGraphId(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 items-start justify-start w-full">
          <Label htmlFor="deployment-url" className="text-right">
            Deployment URL <span className="text-red-500">*</span>
          </Label>
          <p className="text-xs text-muted-foreground">
            This is the URL of your LangGraph deployment. Can be a local, or
            production deployment.
          </p>
          <Input
            id="deployment-url"
            placeholder="https://my-agent.default.us.langgraph.app"
            className="col-span-3"
            required
            value={deploymentUrl}
            onChange={(e) => setDeploymentUrl(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 items-start justify-start w-full">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <p className="text-xs text-muted-foreground">
            Optional name for the inbox. Used in the sidebar.
          </p>
          <Input
            id="name"
            placeholder="My Agent"
            className="col-span-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button variant="brand" type="submit">
            Save
          </Button>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </DialogClose>
        </div>
      </form>
    </DialogContent>
  );
}
