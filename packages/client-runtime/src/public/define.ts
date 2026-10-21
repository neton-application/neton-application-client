/**
 * 公开路由的入口定义（public-routes §4.1）：`load` 取数（缓存单元）、`seo` 由数据生成元数据、
 * `Page` 只拿数据与只读上下文渲染。模块与产品 fork 的公开页面（站点配置 `pages`）是同一个形状。
 */
import type * as React from "react";
import type { PublicParamRule, PublicRouteCache } from "@neton/application-client-contract";
import type { PublicBackend } from "../public-server/backend";
import type { ServerTranslate } from "../public-server/i18n";
import type { PublicCacheProfileName } from "./cache-profiles";
import type { PublicSeo } from "./seo";
import type { ObjectRef, ObjectSummary, PublicCard } from "./types";

/**
 * `load` 的结果。`data` 必须可被 RSC 序列化（普通对象、数组、字符串、数字、布尔、null）——它会
 * 被放进缓存。`tags` 按 §8.3 命名，非 ok 结果也可以带（例如 unavailable 带上 `obj:` 标签，重新上线时
 * 一失效就恢复）。
 */
export type PublicLoadResult<D> =
  | { kind: "ok"; data: D; tags?: string[]; cache?: PublicCacheProfileName }
  | { kind: "not_found"; tags?: string[] }
  | { kind: "unavailable"; tags?: string[] }
  | { kind: "gone"; tags?: string[] }
  | { kind: "redirect"; to: string; permanent: boolean };

export interface PublicSiteInfo {
  origin: string;
  name: string;
  consoleBasePath: string;
  locale: string;
  timeZone: string;
}

/** 取数上下文：只有这些能力。不能读 Cookie、请求头、会话（构建期扫描会拦截）。 */
export interface PublicLoadContext {
  /** 已按规则校验的路径参数 + 实例的固定参数 */
  params: Record<string, string>;
  /** 只含白名单内的查询参数 */
  query: Record<string, string>;
  locale: string;
  site: PublicSiteInfo;
  backend: PublicBackend;
  /** 本模块命名空间的服务端翻译 */
  t: ServerTranslate;
  /** 按站点配置生成另一条公开路由的路径（模块间互链不写死 URL）；路由未装配返回 null。 */
  href(routeKey: string, params?: Record<string, string | number>): string | null;
}

export interface CardRenderOptions {
  /** 挂载的卡片样式（filter 的 cardStyle），按对象类型 */
  styles?: Record<string, string>;
  /** 列表首屏前几张图不懒加载（LCP），缺省 3 */
  eagerImages?: number;
}

/** 渲染上下文：取数能力之外，多了插槽与卡片渲染（底座按构建期注册表分发）。 */
export interface PublicPageContext extends PublicSeoContext {
  /** 渲染一个对象插槽（§10.2）：贡献方只认 ObjectRef，按 capability / objectTypes 过滤 */
  renderSlot(target: string, props: { objectRef: ObjectRef; summary: ObjectSummary }): React.ReactNode;
  /** 按对象类型分发卡片渲染器，没有渲染器的类型用底座的通用卡片（§10.3） */
  renderCards(cards: readonly PublicCard[], options?: CardRenderOptions): React.ReactNode;
}

/** 生成元数据时的上下文：取数上下文去掉 backend（元数据只能由 load 的数据推出，不再取数）。 */
export type PublicSeoContext = Omit<PublicLoadContext, "backend">;

export interface PublicRouteDefinition<D> {
  load(ctx: PublicLoadContext): Promise<PublicLoadResult<D>>;
  seo(data: D, ctx: PublicSeoContext): PublicSeo;
  Page: (props: { data: D; ctx: PublicPageContext }) => React.ReactNode | Promise<React.ReactNode>;
}

export function definePublicRoute<D>(definition: PublicRouteDefinition<D>): PublicRouteDefinition<D> {
  return definition;
}

/** 产品 fork 的公开页面（`src/site/pages/*`，在站点配置 `pages` 里声明）。与模块路由同形。 */
export const definePublicPage = definePublicRoute;

/** 生成脚本写进每个路由文件的静态描述（已合并站点配置的覆盖与实例）。 */
export interface PublicRouteMeta {
  /** 路由 key 或实例 key（`content.item@video`） */
  key: string;
  /** 命名空间（模块 id；fork 页面为 `site`） */
  namespace: string;
  pattern: string;
  params: Record<string, PublicParamRule>;
  query: string[];
  cache: PublicRouteCache;
  indexable: boolean;
  goneAware: boolean;
  fixed: Record<string, string>;
}
