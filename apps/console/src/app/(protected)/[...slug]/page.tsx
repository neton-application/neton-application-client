import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getMemberProfile, SESSION_COOKIE } from "@neton/application-client-runtime/server";
import { matchManifestPath } from "@neton/application-client-runtime/menu";
import { installedModules, pageRegistry } from "@/generated/modules.generated";
import { Alert } from "@neton/application-client-kit";

/**
 * 受保护 catch-all：C 端路由完全由已安装模块的 manifest 决定（无后端菜单/RBAC 概念，
 * 页面可见性由产品模块自身与后端 app API 鉴权保证）。
 */
export default async function CatchAllPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");

  const res = await getMemberProfile(token);
  if (res.code !== 0 || !res.data) redirect("/login");

  const pathname = `/${slug.join("/")}`;
  const page = installedModules.flatMap((m) => m.pages).find((p) => matchManifestPath(p.path, pathname));
  if (!page) notFound();

  const loader = pageRegistry[page.key];
  if (!loader) {
    console.warn(`[client] manifest 引用了未注册页面: ${page.key} (${pathname})`);
    return <Alert tone="warning">页面未安装：{page.key}</Alert>;
  }

  const Page = (await loader()).default;
  return <Page />;
}
