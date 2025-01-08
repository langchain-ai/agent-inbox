import React from "react";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";

const PillButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <Button
        className={cn(className, "rounded-full px-3 py-1")}
        ref={ref}
        {...props}
      />
    );
  }
);
PillButton.displayName = "PillButton";

export { PillButton };
