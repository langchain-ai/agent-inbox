"use client";

import { AgentInbox } from "@/components/agent-inbox";
import { BreadCrumb } from "@/components/agent-inbox/components/breadcrumb";
import { ThreadsProvider } from "@/components/agent-inbox/contexts/ThreadContext";
import { AppSidebar, AppSidebarTrigger } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import React from "react";

export default function DemoPage(): React.ReactNode {
  return (
    <React.Suspense fallback={<div>Loading (layout)...</div>}>
      <Toaster />
      <UserProvider>
        <ThreadsProvider>
          <SidebarProvider>
            <AppSidebar />
            <main className="flex flex-row w-full min-h-full pt-6 pl-6 gap-6">
              <AppSidebarTrigger isOutside={true} />
              <div className="flex flex-col gap-6 w-full min-h-full">
                <BreadCrumb className="pl-5" />
                <div
                  className={cn(
                    "h-full bg-white rounded-tl-[58px]",
                    "overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                  )}
                >
                  <div className="flex flex-col w-full h-full">
                    <AgentInbox />
                  </div>
                </div>
              </div>
            </main>
          </SidebarProvider>
        </ThreadsProvider>
      </UserProvider>
    </React.Suspense>
  );
}
