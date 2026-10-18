/* 自动生成：pnpm registry（scripts/generate-registry.mts）。禁止手改。 */
import type { FrontModuleManifest } from "@neton/application-client-contract";
import type { LocaleRegistry } from "@neton/application-client-runtime/i18n";
import type * as React from "react";

export const installedModules: FrontModuleManifest[] = [];

export const pageRegistry: Record<string, () => Promise<{ default: React.ComponentType }>> = {

};

/** 模块语言包：命名空间（模块 id）→ 语言 → loader。随模块懒加载。 */
export const localeRegistry: LocaleRegistry = {

};
