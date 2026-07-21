"use client";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../cn";
import type { FrontIcon } from "../icons";

export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:border-[var(--ring)] focus-visible:ring-[3px] focus-visible:ring-[var(--ring)]/20 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border border-transparent bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]",
        destructive: "border border-transparent bg-red-600 text-white hover:bg-red-700",
        outline: "border border-[var(--border)] bg-[var(--card)] text-[var(--body-foreground)] shadow-[var(--shadow-xs)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] dark:bg-[var(--input)]/20",
        secondary: "border border-transparent bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)]",
        ghost: "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
        link: "text-[var(--primary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 has-[>svg]:px-3",
        xs: "h-6 gap-1 px-2 text-xs [&_svg]:h-3 [&_svg]:w-3",
        sm: "h-8 gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-10 px-6",
        icon: "h-9 w-9",
        "icon-xs": "h-6 w-6 [&_svg]:h-3 [&_svg]:w-3",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        buttonVariants({ variant, size, className }),
      )}
      {...props}
    />
  );
}

export function IconButton({
  icon: Icon,
  label,
  ...props
}: Omit<ButtonProps, "children"> & { icon: FrontIcon; label: string }) {
  return (
    <Button aria-label={label} title={label} size={props.size ?? "icon-sm"} {...props}>
      <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
    </Button>
  );
}
