import { getSiteBrand } from "@/lib/site-brand";

/**
 * 后台「站点语言」的浏览器可读入口：`/api/backend` 代理只放行 `/app/**`（用户端会话属于
 * 账号身份域，不替浏览器访问后台路由组），而 `system.site.locale` 与品牌同为匿名公开配置，
 * 这里借 getSiteBrand 的 30 秒缓存单独回一个 locale 值，供 Providers 运行期对齐全站语言。
 */
export async function GET() {
  const brand = await getSiteBrand();
  return Response.json({ code: 0, message: "OK", data: { locale: brand.locale } });
}
