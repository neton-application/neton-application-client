"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { CheckIcon } from "../icons";
import { cn } from "../cn";

export function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-xs border border-[var(--input)] bg-[var(--card)] shadow-[var(--shadow-xs)] outline-none transition-shadow",
        "focus-visible:border-[var(--ring)] focus-visible:ring-[3px] focus-visible:ring-[var(--ring)]/20 disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)] data-[state=checked]:text-[var(--primary-foreground)]",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="grid place-content-center text-current">
        <CheckIcon className="h-3.5 w-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
