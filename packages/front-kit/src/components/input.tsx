"use client";
import * as React from "react";
import { cn } from "../cn";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-md border border-[var(--input)] bg-[var(--card)] px-3 py-1 text-sm text-[var(--body-foreground)] shadow-[var(--shadow-xs)] outline-none transition-[border-color,box-shadow,background-color]",
        "placeholder:text-[var(--muted-foreground)] focus-visible:border-[var(--ring)] focus-visible:ring-[3px] focus-visible:ring-[var(--ring)]/20 dark:bg-[var(--input)]/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-semibold text-[var(--foreground)]", className)} {...props} />;
}
