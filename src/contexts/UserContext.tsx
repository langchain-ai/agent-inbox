"use client";

import { createSupabaseClient } from "@/lib/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";
import type { Database } from "@/supabase/database.types";

type UserAssistantIdsTable = Database["public"]["Tables"]["user_assistant_ids"];
type UserAssistantIdsRow = UserAssistantIdsTable["Row"];

type UserContextType = {
  loading: boolean;
  user: User | undefined;
  session: Session | undefined;
  addAssistantIdToUserTable: (input: {
    assistantId: string;
    emailId: string;
  }) => Promise<void>;
  getIdsFromUserTable: () => Promise<UserAssistantIdsRow | undefined>;
};

const UserContext = React.createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>();
  const [session, setSession] = useState<Session>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    getUser();
  }, []);

  async function getUser() {
    if (user) {
      setLoading(false);
      return;
    }

    const supabase = createSupabaseClient();

    const {
      data: { user: supabaseUser },
      error: userError,
    } = await supabase.auth.getUser();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (userError || sessionError) {
      // TODO: Handle error better
      setUser(undefined);
      setSession(undefined);
      setLoading(false);
      return;
    }

    setUser(supabaseUser || undefined);
    setSession(session || undefined);
    setLoading(false);
  }

  const addAssistantIdToUserTable = async ({
    assistantId,
    emailId,
  }: {
    assistantId: string;
    emailId: string;
  }): Promise<void> => {
    if (!user) {
      // TODO: Handle error better
      return;
    }

    const supabase = createSupabaseClient();

    const { error } = await supabase.from("user_assistant_ids").insert({
      assistant_id: assistantId,
      email_id: emailId,
      supabase_user_id: user.id,
    });

    if (error) {
      // TODO: Handle error better
      console.error(error);
      throw new Error("Failed to add assistant ID to user table");
    }
  };

  const getIdsFromUserTable = async (): Promise<
    UserAssistantIdsRow | undefined
  > => {
    if (!user) {
      // TODO: Handle error better
      return undefined;
    }

    const supabase = createSupabaseClient<Database>();

    const { data, error } = await supabase
      .from("user_assistant_ids")
      .select()
      .eq("supabase_user_id", user.id)
      .limit(1);

    if (error) {
      // TODO: Handle error better
      console.error(error);
      throw new Error("Failed to get assistant ID from user table");
    }

    return data?.[0];
  };

  const contextValue: UserContextType = {
    loading,
    user,
    session,
    addAssistantIdToUserTable,
    getIdsFromUserTable,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}

export function useUserContext() {
  const context = React.useContext(UserContext) as UserContextType;
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
}
