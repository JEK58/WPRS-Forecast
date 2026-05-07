import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/utils";

const buttonVariants = cva(
  "btn rounded-lg border font-semibold whitespace-nowrap shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-green-500 text-white shadow-green-900/10 hover:bg-green-600 focus-visible:ring-green-500",
        destructive: "btn-error focus-visible:ring-red-500",
        outline:
          "border-slate-300 bg-white/80 text-slate-700 hover:border-green-500 hover:bg-green-50 hover:text-green-700 focus-visible:ring-green-500 dark:border-slate-700 dark:bg-cyan-950/40 dark:text-slate-200 dark:hover:border-green-500 dark:hover:bg-green-500/10 dark:hover:text-green-300",
        secondary: "btn-secondary focus-visible:ring-slate-400",
        ghost:
          "btn-ghost border-transparent bg-transparent shadow-none hover:bg-slate-900/5 focus-visible:ring-slate-400 dark:hover:bg-white/10",
        link: "btn-link border-transparent px-1 shadow-none no-underline hover:underline focus-visible:ring-green-500",
      },
      size: {
        default: "",
        sm: "btn-sm",
        lg: "btn-lg",
        icon: "btn-square",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
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
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
