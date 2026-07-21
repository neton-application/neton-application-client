import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMemberProfile, SESSION_COOKIE } from "@neton/application-client-runtime/server";
import { AppShell } from "@/components/app-shell";
import { consoleNav } from "@/config/console.nav";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");

  const res = await getMemberProfile(token);
  if (res.code !== 0 || !res.data) redirect("/login");

  const member = res.data;
  const user = {
    userId: String(member.id),
    username: member.username ?? "",
    nickname: member.nickname ?? member.username ?? `用户${member.id}`,
    avatar: member.avatar ?? "",
    homePath: "/",
  };

  return <AppShell items={consoleNav} user={user} roles={[]} permissions={[]}>{children}</AppShell>;
}
