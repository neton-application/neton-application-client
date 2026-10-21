/**
 * 服务启动钩子：配置了站点发布密钥时，启动已删除 URL 集合的同步（public-routes §7.2）。
 * 没配密钥就没有 410（退化为 404）与失效投递，功能正确，只是更新慢。
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { revalidateSecret, startGoneSync } = await import("@neton/application-client-runtime/public-server");
  const secret = revalidateSecret();
  if (!secret) {
    console.info("[site] site.revalidate.disabled: NETON_SITE_REVALIDATE_SECRET is not set (or shorter than 32 bytes)");
    return;
  }
  const { proxyConfig } = await import("@/generated/public-proxy.generated");
  if (!proxyConfig.routes.some((r) => r.goneAware)) return;
  startGoneSync({ secret });
}
