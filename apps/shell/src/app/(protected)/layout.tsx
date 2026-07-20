import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPermissionInfo, SESSION_COOKIE } from "@neton/application-front-runtime/server";
import { buildNav } from "@neton/application-front-runtime/menu";
import { AppShell } from "@/components/app-shell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");

  const res = await getPermissionInfo(token);
  if (res.code !== 0 || !res.data) redirect("/login");

  const nav = buildNav(res.data.menus);
  const user = res.data.user;

  return <AppShell items={nav} user={user} roles={res.data.roles} permissions={res.data.permissions}>{children}</AppShell>;
}
