import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";
import { useThreadsContext } from "../contexts/ThreadContext";
import { useToast } from "@/hooks/use-toast";

export function AddAgentInboxDialog({
  closeSettingsPopover,
}: {
  closeSettingsPopover: () => void;
}) {
  const { toast } = useToast();
  const { addAgentInbox } = useThreadsContext();
  const [open, setOpen] = React.useState(false);

  const [graphId, setGraphId] = React.useState("");
  const [deploymentUrl, setDeploymentUrl] = React.useState("");
  const [name, setName] = React.useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addAgentInbox({
      id: uuidv4(),
      graphId,
      deploymentUrl,
      name,
      selected: true,
    });
    toast({
      title: "Success",
      description: "Agent inbox added successfully",
      duration: 3000,
    });
    closeSettingsPopover();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Inbox</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Inbox</DialogTitle>
          <DialogDescription>Add a new agent inbox.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col items-center justify-center gap-4 py-4 w-full"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-2 items-start justify-start w-full">
            <Label htmlFor="graph-id" className="text-right">
              Assistant/Graph ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="graph-id"
              placeholder="email_assistant"
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
            <Input
              id="name"
              placeholder="Email Assistant"
              className="col-span-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="brand" type="submit">
              Submit
            </Button>
            <Button
              variant="outline"
              type="reset"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
