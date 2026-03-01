"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserInfo() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2 mt-1">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage
          src={session.user.image ?? undefined}
          alt={session.user.name ?? "User"}
        />
        <AvatarFallback className="text-xs">
          {session.user.name ? getInitials(session.user.name) : "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-medium truncate">
          {session.user.name}
        </span>
        <span className="text-xs text-gray-500 truncate">
          {session.user.email}
        </span>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        title="Sign out"
        className="shrink-0 p-1 rounded-md hover:bg-gray-200 transition-colors"
      >
        <LogOut className="h-4 w-4 text-gray-500" />
      </button>
    </div>
  );
}
