import * as React from "react";
import { cn } from "../cn";

export function Alert({
  className,
  tone = "info",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: "info" | "error" | "warning" }) {
  const tones = {
    info: "border-[var(--border)] bg-[var(--card)] text-[var(--body-foreground)]",
    error: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-400",
    warning: "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-400",
  } as const;
  return <div className={cn("rounded-md border px-4 py-3 text-sm", tones[tone], className)} {...props} />;
}
