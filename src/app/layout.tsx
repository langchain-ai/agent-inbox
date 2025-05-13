import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThreadsProvider } from "@/components/agent-inbox/contexts/ThreadContext";
import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar, AppSidebarTrigger } from "@/components/app-sidebar";
import { BreadCrumb } from "@/components/agent-inbox/components/breadcrumb";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

export const metadata: Metadata = {
  title: "Agent Inbox",
  description: "Agent Inbox UX by LangChain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <React.Suspense fallback={<div>Loading (layout)...</div>}>
          <Toaster />
          <ThreadsProvider>
            <SidebarProvider>
              <AppSidebar />
              <main
                className="flex flex-row md:flex-row flex-col w-full min-h-full md:pt-6 md:pl-6 md:gap-6 pt-1 pl-0 gap-1 max-w-full overflow-x-hidden"
              >
                <AppSidebarTrigger isOutside={true} />
                <div className="flex flex-col md:gap-6 gap-1 w-full min-h-full max-w-full overflow-x-hidden">
                  <BreadCrumb className="md:pl-5 pl-1" />
                  <div
                    className={cn(
                      "h-full bg-white rounded-tl-[58px] md:rounded-tl-[58px] rounded-tl-lg",
                      "overflow-x-auto md:scrollbar-thin md:scrollbar-thumb-gray-300 md:scrollbar-track-gray-100 overflow-x-hidden max-w-full"
                    )}
                  >
                    {children}
                  </div>
                </div>
              </main>
            </SidebarProvider>
          </ThreadsProvider>
        </React.Suspense>
      </body>
    </html>
  );
}
