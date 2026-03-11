import * as React from "react";
import { VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button"; // Assuming this is your Button component path

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ToggleGroupContextValue extends VariantProps<typeof toggleVariants> {
  type?: "single" | "multiple";
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  disabled?: boolean;
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue>({
  size: "default",
  variant: "default",
});

const ToggleGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof toggleVariants> & {
      type?: "single" | "multiple";
      value?: string | string[];
      onValueChange?: (value: string | string[]) => void;
      disabled?: boolean;
    }
>(
  (
    {
      className,
      variant,
      size,
      children,
      type,
      value,
      onValueChange,
      disabled,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn("flex items-center", className)}
      role={type === "single" ? "radiogroup" : undefined}
      aria-disabled={disabled ? "true" : undefined}
      {...props}
    >
      <ToggleGroupContext.Provider
        value={{ variant, size, type, value, onValueChange, disabled }}
      >
        {children}
      </ToggleGroupContext.Provider>
    </div>
  )
);
ToggleGroup.displayName = "ToggleGroup";

const ToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button> &
    VariantProps<typeof toggleVariants> & {
      value: string;
    }
>(({ className, variant, size, children, value: itemValue, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);

  const isSelected =
    context.type === "single"
      ? context.value === itemValue
      : Array.isArray(context.value) && context.value.includes(itemValue);

  const handleClick = () => {
    if (context.disabled || !context.onValueChange) return;

    if (context.type === "single") {
      context.onValueChange(isSelected ? "" : itemValue);
    } else if (Array.isArray(context.value)) {
      context.onValueChange(
        isSelected
          ? context.value.filter((v) => v !== itemValue)
          : [...context.value, itemValue]
      );
    }
  };

  return (
    <Button
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      variant="ghost" // Base as ghost to allow custom toggle styling; adjust if needed
      data-state={isSelected ? "on" : "off"}
      role={context.type === "single" ? "radio" : "checkbox"}
      aria-checked={isSelected}
      disabled={context.disabled}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
});
ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem };
