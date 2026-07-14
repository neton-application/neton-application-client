"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@neton/application-front-runtime/menu";
import { cn } from "@neton/application-front-kit";

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {items.map((dir) => (
        <div key={dir.path}>
          <div className="px-2 py-1.5 text-xs font-semibold uppercase text-zinc-400">{dir.name}</div>
          {(dir.children ?? [dir]).map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "block rounded-md px-2 py-1.5 text-sm",
                pathname === item.path
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-100",
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
