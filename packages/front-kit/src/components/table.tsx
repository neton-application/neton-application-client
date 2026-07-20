import * as React from "react";
import { cn } from "../cn";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full border-separate border-spacing-0 text-left text-sm", className)} {...props} />;
}
export function THead(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="bg-[var(--table-header)] text-xs text-[var(--muted-foreground)]" {...props} />;
}
export function TBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-[var(--border)]" {...props} />;
}
export function TR(props: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className="transition-colors hover:bg-[var(--muted)]/70" {...props} />;
}
export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("h-10 border-b border-[var(--border)] px-4 text-left align-middle font-medium whitespace-nowrap", className)} {...props} />;
}
export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("h-12 px-4 align-middle text-[var(--body-foreground)]", className)} {...props} />;
}
