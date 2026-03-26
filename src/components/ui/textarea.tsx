import * as React from "react";
import { cn } from "@/lib/utils";
import TextareaAutosize, {
  type TextareaAutosizeProps,
} from "react-textarea-autosize";

export interface TextareaProps
  extends Omit<TextareaAutosizeProps, "minRows" | "maxRows"> {
  minRows?: number;
  maxRows?: number;
}

// We keep the same exported name so existing imports continue working.
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
  minRows: incomingMinRows,
  maxRows: incomingMaxRows,
      ...rest
    },
    ref
  ) => {
  const minRows = incomingMinRows ?? 2; // default starting height
  const maxRows = incomingMaxRows ?? 16;
    return (
      <TextareaAutosize
        className={cn(
          "flex w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        minRows={minRows}
        maxRows={maxRows}
        {...rest}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
