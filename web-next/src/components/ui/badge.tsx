import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
  {
    variants: {
      variant: {
        default:
          "border-primary/20 bg-primary/10 text-primary shadow-[0_0_8px_hsl(var(--primary)/0.08)]",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive shadow-[0_0_8px_hsl(var(--destructive)/0.08)]",
        success:
          "border-[hsl(var(--success)/0.2)] bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] shadow-[0_0_8px_hsl(var(--success)/0.08)]",
        warning:
          "border-[hsl(var(--warning)/0.2)] bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]",
        outline:
          "border-border/80 text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
