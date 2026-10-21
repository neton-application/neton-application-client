"use client";

import * as React from "react";
import { I18nProvider, type StaticCatalogs } from "@neton/application-client-runtime/i18n";
import { runtimeCatalogs } from "@neton/application-client-runtime/messages";
import { PublicSessionProvider } from "@neton/application-client-runtime/public-client";
import { localeRegistry } from "@/generated/modules.generated";
import { siteCatalogs } from "./messages";

/**
 * 公开页面的客户端 Provider（public-routes §9、§12）：
 * - 语言由服务端决定（站点配置的唯一语言），不读本地偏好——首帧与缓存的 HTML 逐字节一致；
 * - 模块词条由服务端预先给出（`preloaded`），岛屿首帧就有译文，不会先显示 key 再闪成译文；
 * - 会话在水合后取（`/api/session`），服务端 HTML 恒为匿名态。
 */
export function PublicProviders({ locale, timeZone, consoleBasePath, preloaded, children }: {
  locale: string;
  timeZone: string;
  consoleBasePath: string;
  preloaded: StaticCatalogs;
  children: React.ReactNode;
}) {
  const config = React.useMemo(() => ({ locales: [locale], defaultLocale: locale, timeZone }), [locale, timeZone]);
  const catalogs = React.useMemo(() => ({ ...runtimeCatalogs, ...siteCatalogs, ...preloaded }), [preloaded]);
  return (
    <I18nProvider config={config} registry={localeRegistry} catalogs={catalogs} serverLocale>
      <PublicSessionProvider consoleBasePath={consoleBasePath}>{children}</PublicSessionProvider>
    </I18nProvider>
  );
}
