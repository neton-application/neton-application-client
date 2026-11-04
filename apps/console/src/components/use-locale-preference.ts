"use client";

import * as React from "react";
import { useLocale } from "@neton/application-client-runtime/i18n";
import { isSuperseded, saveUserLocale } from "@/lib/locale-preference";

/**
 * Switch the active language and, when signed in, persist it to the account preference.
 *
 * Both language controls (the login-page select and the console account menu) must go through this:
 * `setLocale` alone only writes the local cache, so an authenticated user's choice would be lost on
 * another browser. `switchLocale` optimistically applies the locale, then saves; a genuine save
 * failure rolls the UI back to the last known-good language and raises `failed` for the caller to
 * surface. A rejection caused by the identity switching mid-flight is silently dropped — the provider
 * has already re-read for the new subject, so neither rolling back nor warning is correct there.
 */
export interface LocalePreferenceAction {
  switchLocale: (next: string) => void;
  saving: boolean;
  failed: boolean;
}

export function useLocalePreference(): LocalePreferenceAction {
  const { locale, setLocale } = useLocale();
  const [saving, setSaving] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const switchLocale = React.useCallback((next: string) => {
    const previous = locale;
    setFailed(false);
    if (next === previous) return;
    setLocale(next); // 内部已写 localStorage：下次首帧直接命中
    setSaving(true);
    setFailed(false);
    void saveUserLocale(next)
      .catch((error: unknown) => {
        if (isSuperseded(error)) return; // 身份已切换：新主体的重读负责界面，不回滚也不提示
        setLocale(previous); // 保存失败：回滚到上一个已知可用的语言
        setFailed(true);
      })
      .finally(() => setSaving(false));
  }, [locale, setLocale]);
  return { switchLocale, saving, failed };
}
