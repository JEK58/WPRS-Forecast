import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/utils";

const buttonVariants = cva(
  "btn whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-transparent bg-green-500 text-white hover:bg-green-700",
        destructive: "btn-error",
        outline: "btn-outline",
        secondary: "btn-secondary",
        ghost: "btn-ghost",
        link: "btn-link px-1 no-underline hover:underline",
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
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
