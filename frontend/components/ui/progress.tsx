"use client";
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, max = 100, ...props }, ref) => {
  const limit = Number.isFinite(max) && max > 0 ? max : 100;
  const resolved =
    typeof value === "number" && Number.isFinite(value)
      ? Math.min(limit, Math.max(0, value))
      : null;
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("kage-progress", className)}
      value={resolved}
      max={limit}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="kage-progress-value"
        style={
          resolved === null
            ? undefined
            : { transform: `scaleX(${resolved / limit})` }
        }
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;
export { Progress };
