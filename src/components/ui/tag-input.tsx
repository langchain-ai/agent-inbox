import * as React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  allowDuplicates?: boolean;
  className?: string;
  maxItems?: number;
  validateItem?: (item: string) => string | null; // return error message or null
}

/**
 * A lightweight controlled component for editing a list of strings.
 * - Type and press Enter or comma to add
 * - Backspace with empty input removes last item
 * - Click x to remove specific item
 */
export const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  placeholder = "Add item…",
  disabled,
  allowDuplicates = false,
  className,
  maxItems,
  validateItem,
}) => {
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const add = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    if (maxItems && value.length >= maxItems) return;
    if (!allowDuplicates && value.includes(tag)) {
      setDraft("");
      return;
    }
    if (validateItem) {
      const err = validateItem(tag);
      if (err) {
        setError(err);
        return;
      }
    }
    setError(null);
    onChange([...value, tag]);
    setDraft("");
  };

  const remove = (idx: number) => {
    setError(null);
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      remove(value.length - 1);
    }
  };

  const onPaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
    const text = e.clipboardData.getData("text");
    if (text.includes("\n") || text.includes(",")) {
      e.preventDefault();
      text
        .split(/[\n,]/)
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach(add);
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <div
        className={cn(
          "flex flex-wrap gap-2 rounded-md border border-input bg-transparent p-2 focus-within:ring-1 focus-within:ring-ring min-h-[42px] cursor-text",
          disabled && "opacity-60 cursor-not-allowed",
          error && "border-destructive focus-within:ring-destructive",
          className
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, i) => (
          <Badge
            key={`${tag}-${i}`}
            variant="secondary"
            className="flex items-center gap-1 pr-1"
          >
            <span className="max-w-[160px] truncate" title={tag}>
              {tag}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(i);
              }}
              aria-label={`Remove ${tag}`}
              className="rounded hover:bg-muted/60 p-0.5 focus:outline-none focus:ring-1 focus:ring-ring"
              disabled={disabled}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          disabled={disabled || (maxItems !== undefined && value.length >= maxItems)}
          value={draft}
            placeholder={value.length === 0 ? placeholder : ""}
          onChange={(e) => {
            setError(null);
            setDraft(e.target.value);
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          className="flex-1 min-w-[120px] border-0 shadow-none px-0 py-0 h-auto focus-visible:ring-0 focus-visible:outline-none text-sm"
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};
