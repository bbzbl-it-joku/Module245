import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        slate:
          "bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 hover:bg-slate-800",
        emerald:
          "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:-translate-y-0.5 hover:bg-emerald-700",
        outline:
          "border border-slate-300 bg-white/60 text-slate-700 hover:border-slate-400",
        ghost: "text-slate-700 hover:text-slate-900",
        link: "text-slate-700 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-9 px-3",
        lg: "h-11 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof buttonVariants>
>(({ className, variant, size, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(buttonVariants({ variant, size, className }))}
    {...props}
  />
));
Button.displayName = "Button";

export { Button, buttonVariants };
