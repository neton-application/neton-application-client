"use client";

import { Languages } from "lucide-react";
import { useLocale, useT } from "@neton/application-client-runtime/i18n";
import { useLocalePreference } from "./use-locale-preference";

/**
 * 语言切换：本地缓存立即写入（下次首帧直接命中），登录后同步持久化到本人偏好
 * （服务端 account preferences 的 locale 命名空间），换浏览器 / 清缓存仍跟随本人选择；
 * 登录页等匿名场景只改本地，不落服务端。
 * 语言名用各自语言书写，切换前后都认得出来。新增语言只需补一行；实际可见的语言由站点配置
 * `site.config.ts` 的 `locales.supported` 决定。
 */
const LANGUAGE_NAMES: Record<string, string> = {
  "zh-CN": "简体中文", // i18n-exempt: 语言自称
  "zh-TW": "繁體中文", // i18n-exempt: 语言自称
  "en-US": "English",
  "ja": "日本語", // i18n-exempt: 语言自称
  "ko": "한국어",
  "fr": "Français",
  "de": "Deutsch",
  "es": "Español",
  "pt-BR": "Português (Brasil)",
  "ru": "Русский",
};

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useT("console");
  const { switchLocale, saving, failed } = useLocalePreference();
  const { locale, locales } = useLocale();
  if (locales.length < 2) return null;
  return (
    <span className="inline-flex flex-col items-stretch gap-1">
      <label className={className ?? "flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-2.5 text-[var(--muted-foreground)] shadow-sm"}>
        <Languages size={14} aria-hidden />
        <span className="sr-only">{t("locale.label")}</span>
        <select
          value={locale}
          disabled={saving}
          onChange={(event) => switchLocale(event.target.value)}
          className="bg-transparent text-xs text-[var(--foreground)] outline-none"
        >
          {locales.map((l) => <option key={l} value={l}>{LANGUAGE_NAMES[l] ?? l}</option>)}
        </select>
      </label>
      {failed && <span role="status" className="text-[11px] leading-none text-[var(--destructive)]">{t("locale.saveFailed")}</span>}
    </span>
  );
}
