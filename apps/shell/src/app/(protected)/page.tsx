import { cookies } from "next/headers";
import { getPermissionInfo, SESSION_COOKIE } from "@neton/application-front-runtime/server";
import { installedModules } from "@/generated/modules.generated";
import { Card, CardContent, CardHeader, CardTitle } from "@neton/application-front-kit";

export default async function HomePage() {
  const token = (await cookies()).get(SESSION_COOKIE)!.value;
  const res = await getPermissionInfo(token);
  const info = res.data!;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader><CardTitle>欢迎</CardTitle></CardHeader>
        <CardContent className="text-sm text-zinc-600">
          {info.user.nickname || info.user.username}，角色：{info.roles.join("、") || "-"}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>已安装模块</CardTitle></CardHeader>
        <CardContent className="text-sm text-zinc-600">
          {installedModules.map((m) => `${m.id}@${m.contractVersion}`).join("、")}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>权限点</CardTitle></CardHeader>
        <CardContent className="text-sm text-zinc-600">{info.permissions.length} 个</CardContent>
      </Card>
    </div>
  );
}
