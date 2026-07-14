import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getPermissionInfo, SESSION_COOKIE } from "@neton/application-front-runtime/server";
import { buildRouteMap } from "@neton/application-front-runtime/menu";
import { pageRegistry } from "@/generated/modules.generated";
import { Alert } from "@neton/application-front-kit";

/**
 * 受保护 catch-all（spec §5）：后端菜单 component key → 构建期注册表 → 页面。
 * 后端菜单引用了未安装页面 → warn + 友好提示（不白屏，spec §10）。
 */
export default async function CatchAllPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");

  const res = await getPermissionInfo(token);
  if (res.code !== 0 || !res.data) redirect("/login");

  const pathname = `/${slug.join("/")}`;
  const componentKey = buildRouteMap(res.data.menus)[pathname];
  if (!componentKey) notFound();

  const loader = pageRegistry[componentKey];
  if (!loader) {
    console.warn(`[front] 后端菜单引用了未安装页面: ${componentKey} (${pathname})`);
    return <Alert tone="warning">页面未安装：{componentKey}（该菜单由后端下发，但当前发行版未装对应前端模块）</Alert>;
  }

  const Page = (await loader()).default;
  return <Page />;
}
