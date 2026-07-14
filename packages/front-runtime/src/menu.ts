import type { MenuNode } from "./types";

export interface NavItem {
  name: string;
  path: string;
  children?: NavItem[];
}

function joinPath(parent: string, own?: string | null): string {
  if (!own) return parent;
  if (own.startsWith("/")) return own;
  return `${parent.replace(/\/$/, "")}/${own}`;
}

/** 菜单树 → { 完整路由路径: 页面 component key }（只收 type=2 的可用菜单）。 */
export function buildRouteMap(menus: MenuNode[]): Record<string, string> {
  const map: Record<string, string> = {};
  const walk = (nodes: MenuNode[], base: string) => {
    for (const n of nodes) {
      if (n.status !== 1) continue;
      const full = joinPath(base, n.path);
      if (n.type === 2 && n.component) map[full] = n.component;
      if (n.children?.length) walk(n.children, full);
    }
  };
  walk(menus, "");
  return map;
}

/** 菜单树 → 侧栏导航（目录+菜单，尊重 visible/status/sort）。 */
export function buildNav(menus: MenuNode[]): NavItem[] {
  const walk = (nodes: MenuNode[], base: string): NavItem[] =>
    nodes
      .filter((n) => n.status === 1 && n.visible && (n.type === 1 || n.type === 2))
      .sort((a, b) => a.sort - b.sort)
      .map((n) => {
        const full = joinPath(base, n.path);
        const children = n.children?.length ? walk(n.children, full) : undefined;
        return { name: n.name, path: full, children: children?.length ? children : undefined };
      });
  return walk(menus, "");
}
