import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:scale-105 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-lg shadow-pink-200/50 hover:bg-primary/90 hover:shadow-pink-300/50",
        destructive:
          "bg-destructive text-destructive-foreground shadow-lg shadow-red-200/50 hover:bg-destructive/90 hover:shadow-red-300/50",
        outline:
          "border-2 border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-primary",
        secondary:
          "bg-secondary text-secondary-foreground shadow-lg shadow-green-200/50 hover:bg-secondary/80 hover:shadow-green-300/50",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-2xl",
        link: "text-primary underline-offset-4 hover:underline",
        brand: "bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 border-pink-400 text-white shadow-lg shadow-pink-200/50 hover:shadow-pink-300/60",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-xl px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
