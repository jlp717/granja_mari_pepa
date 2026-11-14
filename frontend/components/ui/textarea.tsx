import * as React from "react";
import { cn } from "@/lib/utils";
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea {...props} ref={ref} className={cn("kage-textarea", className)} />
  ),
);
Textarea.displayName = "Textarea";
export { Textarea };
