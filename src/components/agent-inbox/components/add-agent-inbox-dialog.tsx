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
import { useQueryParams } from "../hooks/use-query-params";
import {
  AGENT_INBOX_GITHUB_README_URL,
  NO_INBOXES_FOUND_PARAM,
  LANGCHAIN_API_KEY_LOCAL_STORAGE_KEY,
} from "../constants";
import { PasswordInput } from "@/components/ui/password-input";
import { isDeployedUrl, fetchDeploymentInfo, verifyDeploymentUrl } from "../utils";
import { useLocalStorage } from "../hooks/use-local-storage";
import { LoaderCircle } from "lucide-react";
import { logger } from "../utils/logger";
import { AgentInbox } from "../types";

export function AddAgentInboxDialog({
  hideTrigger,
  langchainApiKey,
  handleChangeLangChainApiKey,
}: {
  /**
   * Whether or not to hide the dialog trigger button.
   */
  hideTrigger?: boolean;
  langchainApiKey?: string;
  handleChangeLangChainApiKey?: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
}) {
  const { searchParams, updateQueryParams } = useQueryParams();
  const { toast } = useToast();
  const { addAgentInbox } = useThreadsContext();
  const { getItem } = useLocalStorage();
  const [open, setOpen] = React.useState(false);
  const [graphId, setGraphId] = React.useState("");
  const [deploymentUrl, setDeploymentUrl] = React.useState("");
  const [name, setName] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const noInboxesFoundParam = searchParams.get(NO_INBOXES_FOUND_PARAM);

  React.useEffect(() => {
    try {
      if (typeof window === "undefined") {
        return;
      }
      if (noInboxesFoundParam === "true") {
        setOpen(true);
      }
    } catch (e) {
      logger.error("Error getting/setting no inboxes found param", e);
    }
  }, [noInboxesFoundParam]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Verify the deployment URL is reachable before proceeding
      const connectionCheck = await verifyDeploymentUrl(deploymentUrl);
      if (!connectionCheck.reachable) {
        setErrorMessage(
          connectionCheck.error ||
            "Could not connect to the deployment URL. Make sure the server is running."
        );
        setIsSubmitting(false);
        return;
      }

      const isDeployed = isDeployedUrl(deploymentUrl);
      let inboxId = uuidv4();
      let fetchedTenantId: string | undefined | null = undefined;

      // For deployed graphs, get the deployment info to generate the ID and fetch tenantId
      if (isDeployed) {
        logger.log(
          "Deployed graph detected, getting info from:",
          deploymentUrl
        );

        // Get the LangChain API key from local storage or props
        const storedApiKey =
          getItem(LANGCHAIN_API_KEY_LOCAL_STORAGE_KEY) || undefined;
        const apiKey = langchainApiKey || storedApiKey;

        if (!apiKey && isDeployed) {
          setErrorMessage(
            "API key is required for deployed LangGraph instances"
          );
          setIsSubmitting(false);
          return;
        }

        // Fetch deployment info
        try {
          const deploymentInfo = await fetchDeploymentInfo(deploymentUrl);
          logger.log("Got deployment info:", deploymentInfo);

          if (deploymentInfo?.host?.project_id) {
            // Generate ID in format: project_id:graphId
            inboxId = `${deploymentInfo.host.project_id}:${graphId}`;
            fetchedTenantId = deploymentInfo.host.tenant_id;
            logger.log(`Created new inbox ID: ${inboxId}`);
            logger.log(`Fetched tenant ID: ${fetchedTenantId}`);
          } else {
            logger.log(
              "No project_id in deployment info, using UUID for inbox ID"
            );
            fetchedTenantId = deploymentInfo?.host?.tenant_id;
            logger.log(
              `Fetched tenant ID (without project_id): ${fetchedTenantId}`
            );
          }
        } catch (error) {
          logger.error("Error fetching deployment info:", error);
          setErrorMessage(
            "Failed to get deployment info. Check your deployment URL."
          );
          setIsSubmitting(false);
          return;
        }
      } else {
        logger.log("Local graph, using UUID for inbox ID");
      }

      // Create the new inbox object fully conforming to AgentInbox
      const newInbox: AgentInbox = {
        id: inboxId,
        graphId,
        deploymentUrl,
        name,
        selected: true,
        createdAt: new Date().toISOString(),
        ...(fetchedTenantId && { tenantId: fetchedTenantId }),
      };

      logger.log("Adding inbox:", newInbox);
      addAgentInbox(newInbox);

      toast({
        title: "Success",
        description: "Agent inbox added successfully",
        duration: 3000,
      });
      updateQueryParams(NO_INBOXES_FOUND_PARAM);

      setGraphId("");
      setDeploymentUrl("");
      setName("");
      setOpen(false);

      // Force page reload to ensure the new inbox appears
      window.location.reload();
    } catch (error) {
      logger.error("Error adding agent inbox:", error);
      setErrorMessage(
        `Failed to add the agent inbox: ${error instanceof Error ? error.message : String(error)}. Please try again or check the console.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDeployedGraph = isDeployedUrl(deploymentUrl);
  const showLangChainApiKeyField =
    (noInboxesFoundParam === "true" || isDeployedGraph) &&
    langchainApiKey !== undefined &&
    handleChangeLangChainApiKey &&
    isDeployedGraph;

  return (
    <Dialog
      open={open}
      onOpenChange={(c) => {
        if (!c) {
          updateQueryParams(NO_INBOXES_FOUND_PARAM);
        }
        setOpen(c);
      }}
    >
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline">Add Inbox</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        {noInboxesFoundParam === "true" ? (
          <DialogHeader>
            <DialogTitle>Welcome to the Agent Inbox!</DialogTitle>
            <DialogDescription>
              <p>To get started, please add an inbox below.</p>
              <p>
                Not sure where to start? Check out our docs
                <a
                  href={AGENT_INBOX_GITHUB_README_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-500 hover:underline ml-1"
                >
                  here
                </a>
                .
              </p>
            </DialogDescription>
          </DialogHeader>
        ) : (
          <DialogHeader>
            <DialogTitle>Add Inbox</DialogTitle>
            <DialogDescription>Add a new agent inbox.</DialogDescription>
          </DialogHeader>
        )}
        <form
          className="flex flex-col items-center justify-center gap-4 py-4 w-full"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-2 items-start justify-start w-full">
            <Label htmlFor="graph-id" className="text-right">
              Assistant/Graph ID <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              This is the ID of the graph (can be the graph name), or assistant
              to fetch threads from, and invoke when actions are taken.
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
          {showLangChainApiKeyField && (
            <div className="flex flex-col items-start gap-2 w-full">
              <div className="flex flex-col gap-1 w-full items-start">
                <Label htmlFor="langchain-api-key">
                  LangSmith API Key <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  This value is stored in your browser&apos;s local storage and
                  is only used to authenticate requests sent to your LangGraph
                  server.
                </p>
              </div>
              <PasswordInput
                id="langchain-api-key"
                placeholder="lsv2_pt_..."
                className="min-w-full"
                required
                value={langchainApiKey}
                onChange={handleChangeLangChainApiKey}
              />
            </div>
          )}

          {errorMessage && (
            <div className="text-red-500 text-sm w-full">{errorMessage}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="w-full"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Inbox"
              )}
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
