"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoCircledIcon, ReloadIcon } from "@radix-ui/react-icons";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import {
  forceInboxBackfill,
  isBackfillCompleted,
  markBackfillCompleted,
} from "../utils/backfill";
import { logger } from "../utils/logger";

export function BackfillBanner() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  // Only run this check after mounting on the client
  useEffect(() => {
    setMounted(true);
    setShowBanner(!isBackfillCompleted());
  }, []);

  // Don't render anything during SSR or until the component has mounted
  if (!mounted || !showBanner) {
    return null;
  }

  const handleRunBackfill = async () => {
    setIsRunning(true);
    try {
      const result = await forceInboxBackfill();

      if (result.success) {
        toast({
          title: "Success",
          description:
            "Your inbox IDs have been updated. Please refresh the page to see your inboxes.",
          duration: 5000,
        });
        setShowBanner(false);
      } else {
        toast({
          title: "Error",
          description:
            "Failed to update inbox IDs. Please try again or contact support.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      logger.error("Error running backfill:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleDismiss = () => {
    markBackfillCompleted();
    setShowBanner(false);
    toast({
      title: "Dismissed",
      description:
        "The banner has been dismissed. You can still update your inboxes from settings.",
      duration: 3000,
    });
  };

  return (
    <Alert className="mb-4">
      <InfoCircledIcon className="h-4 w-4" />
      <AlertTitle>Update Your Inboxes</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>
          We have updated how inbox IDs are generated to better support sharing
          links across machines. Your existing inboxes need to be updated.
        </p>
        <div className="flex gap-2 mt-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleRunBackfill}
            disabled={isRunning}
          >
            {isRunning && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
            {isRunning ? "Updating..." : "Update Inboxes"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            disabled={isRunning}
          >
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
