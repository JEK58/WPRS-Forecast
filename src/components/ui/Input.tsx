import * as React from "react";

import { cn } from "@/utils/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "input input-bordered w-full rounded-lg border-slate-300 bg-white/95 shadow-sm transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:outline-none dark:border-slate-700 dark:bg-cyan-950/70 dark:text-slate-100 dark:placeholder:text-slate-500",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
