"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BarChart3 } from "lucide-react";
import React from "react";
import { PillButton } from "@/components/ui/pill-button";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "../analytics/AnalyticsContext";
import type { AnalyticsEventCounts } from "../analytics/types";

const EVENT_LABELS: Record<keyof AnalyticsEventCounts, string> = {
  accept: "Accepted",
  edit: "Edited",
  response: "Responded",
  ignore: "Ignored",
  resolve: "Resolved",
};

export function AnalyticsPopover() {
  const { getEventCounts, clearEvents } = useAnalytics();
  const [counts, setCounts] = React.useState<AnalyticsEventCounts | null>(null);

  const refreshCounts = React.useCallback(() => {
    setCounts(getEventCounts());
  }, [getEventCounts]);

  const handleClear = () => {
    clearEvents();
    refreshCounts();
  };

  const total = counts
    ? Object.values(counts).reduce((sum, n) => sum + n, 0)
    : 0;

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) refreshCounts();
      }}
    >
      <PopoverTrigger asChild>
        <PillButton
          variant="outline"
          className="flex gap-2 items-center justify-center text-gray-800 w-fit"
          size="lg"
        >
          <BarChart3 />
          <span>Analytics</span>
        </PillButton>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Analytics</h4>
            <p className="text-sm text-muted-foreground">
              Interrupt event counts
            </p>
          </div>
          {counts && (
            <div className="flex flex-col gap-2">
              {(
                Object.entries(EVENT_LABELS) as [
                  keyof AnalyticsEventCounts,
                  string,
                ][]
              ).map(([type, label]) => (
                <div
                  key={type}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-mono font-medium">{counts[type]}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm border-t pt-2 mt-1">
                <span className="font-medium">Total</span>
                <span className="font-mono font-medium">{total}</span>
              </div>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleClear}>
            Clear Data
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
