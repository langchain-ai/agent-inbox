"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "../../ui/button";
import { Icons } from "../../ui/icons";
import { useState } from "react";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  onLoginWithOauth: (provider: "google") => Promise<void>;
}

export function UserAuthForm({
  className,
  onLoginWithOauth,
  ...props
}: UserAuthFormProps) {
  const [isGoogleLoading, setGoogleIsLoading] = useState(false);

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Button
        onClick={async () => {
          setGoogleIsLoading(true);
          await onLoginWithOauth("google");
          setGoogleIsLoading(false);
        }}
        variant="outline"
        type="button"
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}{" "}
        Google
      </Button>
    </div>
  );
}
