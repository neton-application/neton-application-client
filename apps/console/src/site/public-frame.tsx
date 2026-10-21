import { publicNamespaces } from "@/generated/public.generated";
import { site } from "@/generated/site.generated";
import { getSiteBrand } from "@/lib/site-brand";
import PortalShell from "./portal-shell";
import { PublicProviders } from "./public-providers";
import { serverI18n } from "./server-i18n";

/**
 * 公开页面的外框：客户端 Provider（服务端语言、预载词条、会话水合）+ 门户外壳。
 * `(public)` 布局与站点级 404 共用。不读请求、不读会话——整页缓存的前提。
 */
export async function PublicFrame({ children }: { children: React.ReactNode }) {
  const [brand, preloaded] = await Promise.all([getSiteBrand(), serverI18n.catalogsFor(publicNamespaces, site.locale)]);
  return (
    <PublicProviders locale={site.locale} timeZone={site.timeZone} consoleBasePath={site.consoleBasePath} preloaded={preloaded}>
      <PortalShell brand={brand} locale={site.locale} origin={site.origin} consoleBasePath={site.consoleBasePath}>{children}</PortalShell>
    </PublicProviders>
  );
}
