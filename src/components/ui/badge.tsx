import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        success: "border-status-success/40 bg-status-success/15 text-status-success",
        running: "border-status-running/40 bg-status-running/15 text-status-running",
        warning: "border-status-warning/40 bg-status-warning/15 text-status-warning",
        error: "border-status-error/40 bg-status-error/15 text-status-error",
        neutral: "border-status-neutral/40 bg-status-neutral/15 text-status-neutral",
        accepted: "border-status-accepted/40 bg-status-accepted/15 text-status-accepted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
