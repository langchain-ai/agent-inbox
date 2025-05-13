import { Button } from "@/components/ui/button";
import { useQueryParams } from "../hooks/use-query-params";
import { Layers, Loader, TriangleAlert, ZapOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { INBOX_PARAM } from "../constants";
import { ThreadStatusWithAll } from "../types";

const idleInboxesSVG = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16.5 17H21.5L16.5 22H21.5M21.9506 13C21.9833 12.6711 22 12.3375 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C12.1677 22 12.3344 21.9959 12.5 21.9877C12.6678 21.9795 12.8345 21.9671 13 21.9506M12 6V12L15.7384 13.8692"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const INBOX_ICON_MAP = {
  all: <Layers />,
  interrupted: <ZapOff />,
  idle: idleInboxesSVG,
  busy: <Loader />,
  error: <TriangleAlert />,
};

function InboxButton({
  label,
  selectedInbox,
  onClick,
}: {
  label: string;
  selectedInbox: string;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "text-[16px] leading-6 font-medium",
        selectedInbox === label.toLowerCase() ? "text-black" : "text-gray-500"
      )}
      variant="ghost"
    >
      {INBOX_ICON_MAP[label.toLowerCase() as keyof typeof INBOX_ICON_MAP]}
      {label}
    </Button>
  );
}

export function InboxButtons({
  changeInbox,
}: {
  changeInbox: (inbox: ThreadStatusWithAll) => void;
}) {
  const { searchParams } = useQueryParams();
  const selectedInbox = searchParams.get(INBOX_PARAM) || "interrupted";

  return (
    <div
      className={
        cn(
          // Mobile: fixed, centered, rounded, shadow, overflow-x-auto
          "flex w-full gap-2 items-center justify-start",
          "sm:static sm:rounded-none sm:shadow-none sm:bg-transparent sm:mx-0 sm:mb-0",
          "fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-xs rounded-full bg-white shadow-lg px-2 py-1 gap-1 mx-2 overflow-x-auto no-scrollbar",
        )
      }
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <InboxButton
        label="All"
        selectedInbox={selectedInbox}
        onClick={() => changeInbox("all")}
      />
      <InboxButton
        label="Interrupted"
        selectedInbox={selectedInbox}
        onClick={() => changeInbox("interrupted")}
      />
      <InboxButton
        label="Idle"
        selectedInbox={selectedInbox}
        onClick={() => changeInbox("idle")}
      />
      <InboxButton
        label="Busy"
        selectedInbox={selectedInbox}
        onClick={() => changeInbox("busy")}
      />
      <InboxButton
        label="Error"
        selectedInbox={selectedInbox}
        onClick={() => changeInbox("error")}
      />
    </div>
  );
}
