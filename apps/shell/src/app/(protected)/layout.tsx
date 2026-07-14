import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPermissionInfo, SESSION_COOKIE } from "@neton/application-front-runtime/server";
import { buildNav } from "@neton/application-front-runtime/menu";
import { SidebarNav } from "@/components/sidebar-nav";
import { LogoutButton } from "@/components/logout-button";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");

  const res = await getPermissionInfo(token);
  if (res.code !== 0 || !res.data) redirect("/login");

  const nav = buildNav(res.data.menus);
  const user = res.data.user;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-4 text-sm font-semibold">Neton Admin</div>
        <SidebarNav items={nav} />
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-6">
          <span className="text-sm text-zinc-500">后端菜单驱动 · 模块构建期组合</span>
          <div className="flex items-center gap-3 text-sm">
            <span>{user.nickname || user.username}</span>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
