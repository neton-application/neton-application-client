"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { I18nProvider, type I18nConfig } from "@neton/application-client-runtime/i18n";
import { runtimeCatalogs } from "@neton/application-client-runtime/messages";
import { localeRegistry } from "@/generated/modules.generated";
import { site } from "@/generated/site.generated";
import { consoleCatalogs } from "@/messages";
import { isSuperseded, loadUserLocale, setActiveSubject } from "@/lib/locale-preference";

/** 控制台与登录注册页可选的语言 = 站点配置的 locales（与门户同一份来源）；时区跟随浏览器。 */
const config: I18nConfig = { locales: site.supportedLocales, defaultLocale: site.locale };
const catalogs = { ...runtimeCatalogs, ...consoleCatalogs };

let siteLocalePromise: Promise<string | undefined> | null = null;

/**
 * 后台「站点语言」（配置管理里的 system.site.locale，经匿名公开接口）：只取一次，
 * 失败当没配过（回退本地记住的语言 / 浏览器偏好）。合法性交给 I18nProvider 校验。
 */
function loadSiteLocale(): Promise<string | undefined> {
  siteLocalePromise ??= fetch("/api/site-locale")
    .then((res) => (res.ok ? res.json() : null))
    .then((body: { code?: number; data?: { locale?: string } } | null) =>
      body?.code === 0 ? body.data?.locale?.trim() || undefined : undefined)
    .catch(() => undefined);
  return siteLocalePromise;
}

/**
 * 根部的客户端 Provider：国际化。运行时词条（通用错误说明 `errors`）与宿主词条（`console`）静态打入，
 * 模块词条（manifest 的 `locales`，命名空间 = 模块 id）随模块懒加载。
 * 登录用户以本人偏好为准，无偏好回站点默认；匿名使用手选 > 浏览器语言 > 站点默认。
 * 默认值经公开接口读取，改配置刷新即生效，不依赖 SSR。
 *
 * `subjectKey` 是受保护布局从已认证身份（服务端 `member.id`）同步传入的稳定主体键：它以它（而非 pathname）为刷新
 * 时机。偏好只在客户端加载，不为当前无 SSR 需求的产品增加服务端语言查询。
 */
export function Providers({
  children,
  subjectKey,
}: {
  children: React.ReactNode;
  subjectKey?: string;
}) {
  const [siteLocale, setSiteLocale] = React.useState<string | undefined>(undefined);
  const pathname = usePathname();
  const router = useRouter();
  const [refresh, refreshIdentity] = React.useReducer((n) => n + 1, 0);
  // undefined is anonymous; null is an authenticated subject without a preference.
  const [userLocale, setUserLocale] = React.useState<string | null | undefined>(subjectKey ? null : undefined);
  React.useEffect(() => {
    loadSiteLocale().then(setSiteLocale);
  }, []);
  React.useEffect(() => {
    // Cookies are HttpOnly: revalidate on return from another tab even if the path did not change.
    const changed = () => { router.refresh(); refreshIdentity(); };
    window.addEventListener("focus", changed);
    return () => window.removeEventListener("focus", changed);
  }, [router]);
  React.useEffect(() => {
    // Identity change (login / logout / same-path account switch) re-reads and drops the previous
    // subject's in-flight load/save.
    setActiveSubject(subjectKey);
    setUserLocale(subjectKey ? null : undefined);
    let active = true;
    loadUserLocale().then((value) => {
      if (!active) return;
      setUserLocale(value);
    }).catch((error) => { if (active && !isSuperseded(error)) setUserLocale(null); });
    return () => { active = false; };
  }, [subjectKey, pathname, refresh]);
  return (
    <I18nProvider key={subjectKey ?? "anonymous"} config={config} registry={localeRegistry} catalogs={catalogs} siteLocale={siteLocale} userLocale={userLocale}>
      {children}
    </I18nProvider>
  );
}
