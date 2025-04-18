"use client";

import { Trash2, MoreVertical, Pencil } from "lucide-react";
import React from "react";
import { EditAgentInboxDialog } from "./edit-agent-inbox-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { AgentInbox } from "../types";
// Create a separate component for the dropdown/dialog pair
export function DropdownDialogMenu({
  item,
  deleteAgentInbox,
}: {
  item: AgentInbox;
  deleteAgentInbox: (id: string) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // When dialog opens, close dropdown
  React.useEffect(() => {
    if (dialogOpen) {
      setDropdownOpen(false);
    }
  }, [dialogOpen]);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button className="px-2" variant="ghost">
            <MoreVertical className="w-4 h-4 cursor-pointer text-gray-800 hover:text-gray-600 transition-colors ease-in-out duration-200" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DialogTrigger asChild>
            <DropdownMenuItem
              className="cursor-pointer flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Pencil className="w-4 h-4" />
              <span>Edit</span>
            </DropdownMenuItem>
          </DialogTrigger>
          <DropdownMenuItem
            className="cursor-pointer text-red-500 focus:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              deleteAgentInbox(item.id);
              // Close the dropdown
              setDropdownOpen(false);
            }}
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditAgentInboxDialog agentInbox={item} />
    </Dialog>
  );
}
