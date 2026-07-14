import * as React from "react";
import { cn } from "../cn";

export function Alert({
  className,
  tone = "info",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: "info" | "error" | "warning" }) {
  const tones = {
    info: "border-blue-200 bg-blue-50 text-blue-800",
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
  } as const;
  return <div className={cn("rounded-md border px-4 py-3 text-sm", tones[tone], className)} {...props} />;
}
