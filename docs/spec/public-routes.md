# 公开路由契约：匿名可缓存的 SSR 页面

> 标识：NETON-APP-CLIENT-PUBLIC
> 日期：2026-10-22 · 状态：Draft r1（待评审，未实现）
> 范围：`neton-application-client` 底座新增「公开路由」贡献点，让模块贡献匿名、可被 CDN 缓存、可被搜索引擎收录的 SSR 页面；产品 fork 提供门户外壳。client-contract 由 1.0.0 升到 **1.1.0**（只增不改）。
> 关联：
> - 后台底座规范 `privchat-docs/spec/07-application/NETON_APPLICATION_FRONT_SPEC.md`（模块契约、构建期注册表、RSC 非契约、贡献点）
> - 套件架构 `neton-docs/docs/zh-hans/spec/application/content-platform-architecture.md` §4（对接标准、定制三分法）
> - 服务端配套：`neton-docs/docs/zh-hans/spec/application/site-module.md`（渲染缓存失效投递、搜索引擎推送、已删除 URL 台账）
> - 首批使用方：`client-content.md`、`client-comment.md`、`client-interaction.md`（同目录）；样板产品 `itwind-docs/CLIENT_SPEC.md`

## 0. 定位

底座目前只有「受保护控制台」：登录后的工作区，全部 `no-store`，路由由模块 manifest 的 `pages` 决定。内容类产品还需要另一半——**匿名访问、首屏即完整 HTML、可缓存、可收录**的门户页面（文章、栏目、标签、作者、榜单、搜索）。

本契约给底座加一套通用机制：

| 谁 | 提供什么 |
| --- | --- |
| 底座（本仓库） | 公开路由的注册、生成与渲染管线；服务端取数客户端；SEO 元数据渲染；状态码语义；sitemap / RSS / robots；缓存与失效端点；会话水合；插槽；与控制台同域共存 |
| 模块（`neton-application-client-<name>`） | 公开页面（取数 + SEO + 渲染）、插槽组件、卡片渲染器、sitemap 与 RSS 贡献 |
| 产品 fork | 门户外壳（页头、页脚、导航、首页、品牌）、站点配置（域名、控制台前缀、路由覆盖、插槽排序、统计） |

按套件的定制三分法（架构 §4.2）：「匿名 SSR 门户」是内容、电商、社区类产品都会遇到的需求，现有扩展点（`pages` 只服务控制台）表达不了，所以**在底座里补通用扩展点**；底座不出现任何产品名或产品分支。

**不做**：多站点 / 多租户；独立移动站（`m.` 域名，响应式单域名即可）；AMP；运行期注册路由；页面级 A/B 实验框架。

## 1. 决议（评审通过后冻结）

1. 公开页面由模块在 manifest 的 `publicRoutes` 里声明，构建期生成**真实的 Next 路由文件**（不是 catch-all），每条路由有自己的元数据、状态码与缓存配置。
2. 公开页面的取数在服务端完成，打的是部署配置里的后端内网地址；**可缓存的渲染不携带任何会员身份**（不转发 Cookie、不带 Authorization、不读 `cookies()` / `headers()`）。
3. 缓存的 HTML 里**没有任何个性化数据**；登录态、收藏状态、我的投票等一律在客户端水合后取。
4. 规范链接（canonical）、站点地址一律取站点配置的 `origin`，**从不取请求的 Host**（防缓存投毒）。
5. 主内容不放进 `Suspense` 流式边界：取数完成、状态码确定之后才开始输出字节。
6. 控制台与门户同域：门户在根路径，控制台在 `consoleBasePath`（产品设 `/my`）；登录页、会话 Cookie 两边共用。
7. 缓存标签（cache tag）的命名是契约的一部分，前后端共用一套（§8.3），服务端 site 模块按它投递失效。
8. 所有面向用户的文案走模块语言包；错误一律按机器码翻译（`useDescribeError`），公开页同样适用。

## 2. URL 空间与共存

| 路径 | 归属 | 缓存 | 说明 |
| --- | --- | --- | --- |
| `/`、模块公开路由、fork 手写的公开页 | `(public)` 路由组 | CDN 可缓存（§8.4） | 匿名渲染 |
| `{consoleBasePath}/*`（如 `/my/*`） | 控制台 | `private, no-store` | 受保护布局，未登录跳登录页 |
| `/login`、`/register`、`/forgot-password` | `(auth)` | `private, no-store` | 门户与控制台共用；支持 `?next=` |
| `/api/*` | Route Handler | `no-store` | 代理、会话、失效端点 |
| `/robots.txt`、`/sitemap.xml`、`/sitemaps/*`、`/rss.xml` 与模块声明的 feed 路径 | 底座 SEO 路由 | 可缓存 | §11 |
| `/_next/*`、`/static/*` | 静态资源 | `immutable` | 构建产物带哈希 |

### 2.1 控制台前缀

- `consoleBasePath` 在站点配置（§3）里设置，**构建期常量**。底座缺省 `/`，保持现有 fork（只有控制台、没有门户的产品）行为不变。
- 只要装配了任何 `publicRoutes`，或 fork 在 `(public)` 下写了根页面，`consoleBasePath` 就**不能是 `/`**，注册表生成失败。
- 控制台的路由文件由注册表生成脚本按前缀生成到 `src/app/(console)/<base>/…`（生成物，不入库）；模块 manifest 里 `pages[].path` 仍写相对路径（如 `/account/profile`），实际地址是 `{consoleBasePath}/account/profile`。模块代码里**禁止**写死控制台前缀，跳转用运行时的 `consoleHref(path)`。
- 工作区宿主需要支持前缀：`createBrowserHistoryHost({ basePath })`。这是 `neton-application-front` 的 `front-workspace` 包的通用改动（admin 线不用时传空），在那边先落。

### 2.2 保留前缀

模块与 fork 的公开路由不得占用：`consoleBasePath`、`/api`、`/login`、`/register`、`/forgot-password`、`/_next`、`/static`、`/robots.txt`、`/sitemap.xml`、`/sitemaps`、`/rss.xml`、`/favicon.ico`、`/.well-known`、`/indexnow-key.txt`。冲突即构建失败。

## 3. 站点配置（fork 的增量文件）

`apps/console/site.config.ts`，纯静态数据（与 `client.modules.ts` 一样会被生成脚本在 Node 里 import）：

```ts
export default defineSite({
  /** 规范来源地址：canonical、sitemap、RSS、JSON-LD 都用它。部署可用 NETON_SITE_ORIGIN 覆盖（构建期读取）。 */
  origin: "https://www.example.com",
  consoleBasePath: "/my",
  locales: { default: "zh-CN", supported: ["zh-CN"], prefix: "none" },   // §12
  routes: {
    /** 改模块路由的 URL 形态（键 = 路由 key）。只能改形态，参数名必须一致。 */
    override: { "content.item": "/article/:id" },
    /** 不装某条路由（模块的其他路由照常）。 */
    disable: ["content.archive"],
    /** 同一入口的额外实例，带固定参数（§4.2）。 */
    instances: [{ key: "content.item@video", of: "content.item", pattern: "/video/:id", fixed: { type: "video" } }],
  },
  slots: { order: { "public.object.toolbar": ["interaction.favorite", "content.share"] }, hide: [] },
  robots: { disallow: ["/search"] },
  verification: { google: "", baidu: "", bing: "" },   // 输出为 <meta name="…-site-verification">
  feeds: { site: { title: "site.feed.title" } },       // 词条 key
});
```

- 密钥不进这个文件：失效端点的共享密钥 `NETON_SITE_REVALIDATE_SECRET`、IndexNow key `NETON_SITE_INDEXNOW_KEY` 走环境变量（运行期读取）。
- 品牌名、描述、版权、备案号等沿用底座现有的品牌配置（`getSiteBrand()`），不进 i18n。
- 门户外壳是固定位置的文件 `apps/console/src/site/portal-shell.tsx`（§10.1），底座给一个最小默认实现，fork 覆盖。

## 4. 契约增量（client-contract 1.1.0）

```ts
export const FRONT_CONTRACT_VERSION = "1.1.0";

export interface FrontModuleManifest {
  // …1.0.0 的字段不变
  publicRoutes?: PublicRouteManifest[];
  slots?: SlotContribution[];            // 公开页与控制台的插槽贡献（§10）
  cardRenderers?: CardRendererManifest[];// 按对象类型渲染卡片（§10.3）
  sitemaps?: SitemapContribution[];      // §11.2
  feeds?: FeedContribution[];            // §11.3
}

export interface PublicRouteManifest {
  /** 全局唯一，`<模块 id>.<名称>`，如 "content.item"。站点配置按它覆盖 / 禁用 / 实例化。 */
  key: string;
  /** 缺省 URL 形态：静态段 + `:name` 参数（整段），不支持可选段与通配。如 "/article/:id"。 */
  pattern: string;
  /** 参数校验：id = 十进制正整数（≤ 19 位），slug = 词条 slug 规则，int，enum。不合法直接 404，不打后端。 */
  params?: Record<string, "id" | "slug" | "int" | { enum: string[] }>;
  /** 允许读取的查询参数白名单；其余参数不进缓存键（统计参数 utm_* 等一律剥掉）。 */
  query?: string[];
  /** `<pkg>/public/<entry>`，服务端模块，导出 definePublicRoute(...) 的结果。 */
  entry: string;
  /** 缓存档位（§8.1）。 */
  cache: "object" | "list" | "static" | "dynamic";
  /** 缺省 robots：false = noindex, follow。页面可按数据再收紧，不能放宽。 */
  indexable: boolean;
  /** 可被站点配置的 instances 复用（带固定参数）。 */
  instantiable?: boolean;
  /** 该路由的对象被彻底删除后返回 410（§7.2）。 */
  goneAware?: boolean;
  /** 旧 URL 形态：底座生成 308 到当前形态，改路由不丢收录（§13）。 */
  legacyPatterns?: string[];
}

export interface SlotContribution {
  /** 插槽 id（§10.2），如 "public.object.after"。 */
  target: string;
  id: string;                               // "<模块 id>.<名称>"
  entry: string;                            // `<pkg>/slots/<entry>`
  rendering: "server" | "client" | "hybrid";
  /** 只在对象具备该能力时渲染（ObjectSummary.capabilities），如 "comment"、"favorite"。 */
  capability?: string;
  /** 只接这些对象类型；省略 = 任意。 */
  objectTypes?: string[];
  order?: number;
}

export interface CardRendererManifest { objectType: string; entry: string; }   // `<pkg>/cards/<entry>`
export interface SitemapContribution { id: string; entry: string; news?: boolean; }   // `<pkg>/sitemaps/<entry>`
export interface FeedContribution { id: string; pattern: string; entry: string; }     // `<pkg>/feeds/<entry>`
```

模块包新增导出子路径：`./public/*`、`./slots/*`、`./cards/*`、`./sitemaps/*`、`./feeds/*`。`./manifest` 仍是纯静态数据。

### 4.1 路由入口

```ts
export default definePublicRoute<Data>({
  /** 服务端取数。只能用 ctx 给的能力；不能读 Cookie、请求头、会话。 */
  async load(ctx): Promise<PublicLoadResult<Data>>,
  /** 由数据生成 SEO 元数据（§6）。 */
  seo(data, ctx): PublicSeo,
  /** 页面组件（服务端组件），只拿 data 与 ctx 的只读部分。 */
  Page,
});

type PublicLoadResult<D> =
  | { kind: "ok"; data: D; tags: string[]; cache?: CacheProfileName }   // tags 见 §8.3
  | { kind: "not_found" }                                               // 404
  | { kind: "unavailable" }                                             // 404 + noindex，短缓存（§7）
  | { kind: "gone" }                                                    // 410
  | { kind: "redirect"; to: string; permanent: boolean }                // 308 / 307

interface PublicRouteContext {
  params: Record<string, string>;   // 已按 params 校验
  query: Record<string, string>;    // 只含白名单内的参数
  locale: string;
  site: { origin: string; name: string; consoleBasePath: string };
  backend: PublicBackend;           // §5
  t: ServerTranslator;              // §12，按模块命名空间
  href(routeKey: string, params: Record<string, string>): string;   // 按站点配置生成路径，模块间互链不写死 URL
}
```

`load` 是缓存单元：底座以 `(路由 key, 规范化 params, 白名单 query, locale)` 为键缓存它的结果，并按返回的 `tags` 打标签。`Page` 不得再自行取数（需要的数据都在 `load` 里取齐，避免一页里出现多个缓存时效不一的主内容）；插槽有各自的缓存单元（§10.2）。

### 4.2 路由实例

`instantiable: true` 的路由可被站点配置复制成多个实例，每个实例有自己的 URL 与固定参数（`fixed`），例如同一个内容详情入口分别服务 `article` 与 `video` 两种类型。实例 key 形如 `content.item@video`。模块用 `ctx.params` 读固定参数，与 URL 参数无差别。

## 5. 服务端取数

`ctx.backend`（运行时 `@neton/application-client-runtime/public-server`）：

| 方面 | 约定 |
| --- | --- |
| 地址 | `NETON_BACKEND_INTERNAL_URL`（部署配置，内网直连后端，不经 CDN）；缺省回落到 `NETON_BACKEND_URL` |
| 身份 | 无。不带 Cookie、Authorization、客户端 IP。只调后端 `/app/*` 下标了匿名可读的接口 |
| 信封 | 与 `backendJson` 同一套解析：`code === 0` 取 `data`；机器码原样上抛为 `PublicBackendError(code, message, status)`，由 `load` 决定映射成 `not_found` / `unavailable` / `gone` 还是抛出 |
| 超时 | 单请求缺省 3 秒，`load` 总预算 5 秒；超时与连不上抛出（走 §7 的 5xx 路径），不吞成空数据 |
| 并行 | `load` 内多个请求用 `Promise.all`；同一渲染内对同一 URL 的 GET 自动去重 |
| 动态路由 | 只有 `cache: "dynamic"` 的路由（如搜索）可以调用 `ctx.backend.withClient()`：转发 `forwardedClientHeaders`（X-Forwarded-For 等），让后端按真实客户端 IP 限流。部署时 Next 服务的出口地址必须在后端 `ratelimit.trusted_proxies` 里 |

**为什么可缓存渲染不转发客户端 IP**：缓存后的结果会发给所有人，取数时是谁触发的无关紧要；把触发者的 IP 带进去只会让后端的限流误伤或被利用。后端对这些匿名只读接口的限流应以「渲染服务」整体为单位考虑（见 site-module §8 的开放项）。

**构建期检查**：生成脚本静态扫描模块的 `public/`、`slots/`（server 部分）、`cards/`、`sitemaps/`、`feeds/` 目录及其相对 import，出现 `next/headers`、`cookies(`、`@neton/application-client-runtime/server`（会话相关导出）、`apiFetch` 即失败。fork 手写的 `(public)` 页面同样受检。

## 6. SEO 元数据

```ts
interface PublicSeo {
  title: string;                         // 页面自身标题；站点模板「%s · 站点名」由底座套
  titleAbsolute?: boolean;               // 首页等不套模板
  description?: string;                  // 底座截到 160 字符（按字素），去换行
  keywords?: string[];                   // 输出 <meta name="keywords">（百度仍参考）
  canonical?: string;                    // 路径或绝对地址；缺省 = 当前路径（不含查询参数）
  robots?: { index?: boolean; follow?: boolean; maxImagePreview?: "large" | "standard" | "none" };
  openGraph?: {
    type: "website" | "article" | "profile";
    images?: { url: string; width?: number; height?: number; alt?: string }[];
    article?: { publishedTime?: string; modifiedTime?: string; section?: string; tags?: string[]; authors?: string[] };
  };
  jsonLd?: object[];                     // schema.org 对象，底座负责序列化与转义
  pagination?: { prev?: string; next?: string };
  alternates?: { languages?: Record<string, string>; feeds?: { title: string; href: string }[] };
}
```

规则：

- **canonical**：相对路径一律拼站点 `origin`；绝对地址只有在与 `origin` 不同站时才保留（编辑明确指定的外站规范链接）。查询参数不进 canonical，带游标的列表页 canonical 指向自己（不指向第一页）。
- **robots**：页面值与路由 `indexable` 取更严的一方；404 / 410 / `unavailable` 恒为 `noindex`；`max-image-preview:large` 缺省开启（资讯类在搜索结果里的大图依赖它）。
- **Open Graph / Twitter**：底座由 `openGraph` 同时生成 `og:*` 与 `twitter:card`（有图 `summary_large_image`，否则 `summary`）；`og:site_name`、`og:locale` 自动填。
- **JSON-LD**：每个对象单独一个 `<script type="application/ld+json">`；底座把 `<` 转义为 `<`，保证不能闭合脚本标签。运行时提供构造器（`seo.newsArticle()`、`seo.breadcrumb()`、`seo.itemList()`、`seo.person()`、`seo.webSite()`），字段规则写在构造器里，模块不手拼。站点级 `WebSite`（含站内搜索 `SearchAction`，有搜索路由时）与 `Organization` 由底座在首页输出。
- **分页**：`pagination` 输出 `<link rel="prev/next">`（React 19 把它提升到 `<head>`）。Google 已不使用它，但百度等仍参考，成本为零。
- **RSS 发现**：`alternates.feeds` 输出 `<link rel="alternate" type="application/rss+xml">`；站点 feed 由底座在所有公开页输出。
- 站点验证（`verification`）输出为对应的 meta 标签。

## 7. 状态语义

### 7.1 映射

| `load` 结果 | HTTP | robots | 缓存 | 典型场景 |
| --- | --- | --- | --- | --- |
| `ok` | 200 | 按 §6 | 按路由档位 | — |
| `not_found` | 404 | noindex | `list` 档（短） | ID 从未存在、参数不合法、类型不匹配 |
| `unavailable` | 404 | noindex | 60 秒 | 对象暂时下线：撤回、归档、进回收站（`ObjectUnavailable(permanent = false)`），之后可能重新发布 |
| `gone` | 410 | noindex | 1 天 | 对象已彻底删除（`ObjectUnavailable(permanent = true)`） |
| `redirect` | 308（permanent）/ 307 | — | 按路由档位 | slug 变化、canonical 与当前 URL 不一致、跳转型内容 |
| 抛出（后端不可用、超时） | 500 | — | 不缓存 | 有旧缓存时先给旧的（§8.2） |

为什么暂时下线用 404 而不是 410：410 会让搜索引擎更快、更彻底地丢弃 URL，只该在确定不会回来时使用；撤回后重新发布在资讯站很常见。

### 7.2 410 的实现

App Router 的页面只能产出 404（`notFound()`）与重定向，不能产出 410。底座的做法：

- `goneAware` 路由由底座的 `proxy.ts`（Next 16 的请求代理）先查**已删除 URL 集合**，命中即直接返回 410 页（静态 HTML，`noindex`），不进入页面渲染。
- 集合的来源是服务端 site 模块的已删除台账：失效端点收到 `gone` 条目时加入（§8.5）；Next 服务启动时、以及每 10 分钟，从后端 `GET /platform/site/gone?since=` 增量同步（签名鉴权，site-module §6）。
- 多实例部署时集合放在共享缓存里（与 §8.6 的共享缓存同一处）；单实例放进程内。
- 页面 `load` 在后端返回「已删除」机器码时也返回 `gone`——此时底座以 404 输出（页面层做不到 410），并把路径加入集合，下一个请求起就是 410。

## 8. 缓存与失效

### 8.1 档位

两层缓存：Next 的渲染 / 数据缓存（Cache Components：`"use cache"` + `cacheTag` + `cacheLife`），以及 CDN 的 HTML 缓存。档位是契约，具体时长是底座缺省、站点可调：

| 档位 | 用途 | Next 缓存（stale / revalidate / expire） | CDN（`Cache-Control`） |
| --- | --- | --- | --- |
| `object` | 详情页（文章、作者） | 60 秒 / 1 小时 / 7 天，**事件驱动失效为主** | `public, s-maxage=60, stale-while-revalidate=600, stale-if-error=86400` |
| `list` | 栏目、标签、榜单、首页楼层、sitemap 分片 | 30 秒 / 60 秒 / 1 小时 | `public, s-maxage=30, stale-while-revalidate=300, stale-if-error=86400` |
| `static` | 单页、关于、协议 | 1 小时 / 1 天 / 30 天 | `public, s-maxage=300, stale-while-revalidate=86400` |
| `dynamic` | 搜索 | 不缓存 | `private, no-store` |

- CDN 层的 `s-maxage` 刻意短：CDN 刷新（site 模块的 CDN 端口）是可选能力，没有它时，短 TTL 是兜底的新鲜度上限。
- 控制台、登录页、`/api/*` 恒为 `private, no-store`。

### 8.2 缓存安全

- 公开路由的响应**绝不 `Set-Cookie`**，不 `Vary: Cookie`；CDN 的缓存键忽略 Cookie，并剥掉白名单外的查询参数（与 §4 的 `query` 一致）。
- 渲染失败时：Next 缓存里有旧版本就继续给旧版本（stale-if-error），CDN 同理；5xx 不进缓存。
- `origin` 来自站点配置，`X-Forwarded-Host` / `Host` 只用于 CSRF 同源判断，不参与任何 URL 生成。

### 8.3 标签命名（前后端共用）

| 标签 | 含义 | 谁打 | 谁失效 |
| --- | --- | --- | --- |
| `obj:{type}:{id}` | 某对象的公开表示 | 渲染了该对象的任何缓存单元（详情页、卡片所在的列表、评论区里的每条评论） | 对象可见性变化、线上版本变化 |
| `feed:{type}` | 含该类型对象的所有列表 | 列表、首页楼层、sitemap 分片、RSS | 该类型有对象上线或下线（合并，见下） |
| `node:{nodeType}:{nodeId}` | 某个列表节点自身（栏目、标签、频道、楼层、合集） | 节点页、用到节点名称的面包屑与导航 | 节点改名、改设置、改挂载 |
| `thread:{type}:{id}` | 某对象的评论区第一页 | 评论区插槽 | 一般不主动失效，靠 `list` 档短 TTL；评论被隐藏 / 删除时走 `obj:comment.comment:{id}` |
| `site:nav` | 全站导航、栏目树 | 门户外壳 | 栏目树变化、频道列表变化 |
| `site:config` | 站点级配置 | 外壳 | 手动 |

- `type` 是 `ObjectRef.type`（如 `content.item`、`comment.comment`），`id` 原样。标签总长 ≤ 256，超出不打。
- 列表缓存单元除了 `feed:{type}`，还要给列表里的**每个对象**打 `obj:` 标签：对象被撤回时，所有展示过它的列表立即失效，不必等 `feed` 的合并窗口。
- 评论区插槽给渲染出的每条评论打 `obj:comment.comment:{id}`：管理员隐藏一条评论，只失效包含它的评论区。

### 8.4 失效端点

`POST /api/site/revalidate`（底座实现；服务端 site 模块调用，site-module §5）：

```json
{ "eventId": "01JB…", "items": [ { "tag": "obj:content.item:1024", "mode": "expire" }, { "tag": "feed:content.item", "mode": "refresh" } ],
  "gone": [ "/article/998" ], "revived": [ "/article/1001" ] }
```

| 方面 | 约定 |
| --- | --- |
| 鉴权 | 头 `X-Neton-Signature: t=<epoch 秒>,v1=<hex>`，`v1 = HMAC-SHA256(NETON_SITE_REVALIDATE_SECRET, t + "." + 原始 body)`，常数时间比较；`|now - t| > 300` 拒绝。失败 401，信封 `message = SIGNATURE_INVALID` / `SIGNATURE_EXPIRED` |
| `mode` | `refresh` = `revalidateTag(tag, "max")`（先给旧的、后台刷新，用于上线与更新）；`expire` = 立即过期（`revalidateTag(tag, { expire: 0 })`，用于下线：撤回的内容不能再被任何人看到） |
| `gone` / `revived` | 加入 / 移出已删除 URL 集合（§7.2）；路径必须以 `/` 开头且不在保留前缀里 |
| 幂等 | 按 `eventId` 记最近 10 000 条，重复请求直接 200；即使不去重，标签失效本身也是幂等的 |
| 限额 | 单次 ≤ 500 个标签、≤ 500 条路径；超出 400 `REVALIDATE_TOO_LARGE`，由调用方拆批 |
| 响应 | `{ code: 0, data: { applied: n } }`；不访问后端、不渲染页面，单次处理 < 100 ms |
| 暴露面 | 部署时只对内网开放（反代不把 `/api/site/*` 暴露到公网，或按来源地址放行）；签名是第二道门 |

### 8.5 失效顺序

服务端先调失效端点、成功后再刷新 CDN（site-module §5.3）。反过来会出现「CDN 已刷新、回源又拿到 Next 里的旧缓存再缓存一轮」。

### 8.6 多实例

`revalidateTag` 只作用于本实例的缓存。多实例部署必须配置共享的缓存处理器（`cacheHandlers`，如 Redis），否则失效端点要对每个实例各调一次（site 模块支持配置多个目标，但不推荐）。单实例部署不需要。

## 9. 个性化与水合

### 9.1 会话

- 会话 Cookie 仍是 `neton_client_session`（HttpOnly、`SameSite=Lax`、`path=/`），门户与控制台天然共享。
- 公开布局挂 `<PublicSessionProvider>`：水合后请求 `GET /api/session`（`private, no-store`）→ `{ authenticated, user?: { userId, nickname, avatar } }`。页头的用户菜单、评论框、收藏按钮都从这里读。服务端渲染一律按「未登录」出 HTML。
- `GET /api/session` 用现有的 `getMemberProfile`；会话失效时清 Cookie 并返回 `authenticated: false`（不是 401，避免公开页上触发跳转）。

### 9.2 匿名到登录

- 需要登录的操作（收藏、发评论、投票、举报）在匿名时调用运行时的 `requireLogin({ returnTo })`：跳 `/login?next=<当前路径 + 锚点>`。
- 登录 / 注册 / 短信登录的 Route Handler 成功后按 `next` 跳回。`next` 必须是本站相对路径：以 `/` 开头、不以 `//` 或 `/\` 开头、不进 `/api/`，解码后再检查一次；不合格一律回 `consoleBasePath`。
- 退出登录（`/api/auth/logout`）支持 `next`，门户上退出留在当前页。
- 登录弹层（不离开页面）作为开放项（§16），默认整页跳转——简单、对密码管理器与验证码最友好。

### 9.3 运行时调整

| 现状 | 调整 |
| --- | --- |
| `/api/backend` 代理没有 Cookie 时直接 401 | 没有 Cookie 时**不带 Authorization 转发**，是否允许匿名由后端接口决定（`@AllowAnonymous`）；仍只放行 `/app/*`，写请求仍过 CSRF 检查 |
| `apiFetch` 遇到登录失效就 `location.href = "/login"` | 区分场景：控制台内跳 `/login?next=`；公开页内**不跳转**，抛出 `ApiError(kind = "unauthorized")`，由组件调用 `requireLogin` 或提示 |
| i18n 在客户端从 localStorage / 浏览器偏好选语言 | 公开页用服务端确定的语言初始化，不读 localStorage（否则水合不一致），§12 |

### 9.4 批量状态

一页上常有多个需要「我的状态」的组件（收藏按钮、点赞、评论区里每条评论的我的投票）。运行时提供 `ObjectStateBatcher`：同一渲染帧内的请求按接口合并成一次（如 interaction 的 `POST state` 一次带上全页的对象），结果按对象分发。模块注册自己的批量加载器，不互相认识。

### 9.5 水合一致性

- 客户端组件的首次渲染必须与服务端 HTML 相同（匿名态），拿到会话与状态后再更新。
- 相对时间（「3 小时前」）服务端输出绝对时间的 `<time datetime>`，客户端水合后再换成相对时间。
- 公开页不使用工作区（页签、持久化）。

## 10. 外壳与插槽

### 10.1 门户外壳

```
src/app/(public)/layout.tsx          底座：会话提供者、主题、站点级 JSON-LD；渲染 <PortalShell>
src/site/portal-shell.tsx            fork：页头、导航、页脚（底座给最小默认）
src/app/(public)/page.tsx            fork：首页（底座不提供首页）
src/app/(public)/(modules)/…         生成：模块公开路由（不入库）
src/app/(public)/<fork 手写页>        fork：产品特有页面（如频道页）
```

- `PortalShell` 的入参：`{ children, nav, slots }`。`nav` 由外壳自己在服务端取（打 `site:nav` 标签）；`slots` 是全局插槽（§10.2）的渲染结果。
- fork 手写的公开页面用同一套运行时能力（`definePublicPage`，与 `definePublicRoute` 相同的 load / seo / Page 结构），遵守同样的禁止项（§5 构建期检查）。

### 10.2 插槽

插槽 id 由**声明方**定义；对象类插槽一律以 `ObjectRef` 为参数，这样贡献方（评论、互动）只认对象，不认识具体模块的页面。

| 插槽 | 声明方 | 参数 | 典型贡献 |
| --- | --- | --- | --- |
| `public.head` | 底座 | `{ route }` | 统计脚本、额外 meta |
| `public.header.actions` | 底座（外壳渲染） | — | 用户菜单（底座）、「回复我的」红点（comment） |
| `public.sidebar` | 底座（外壳决定放不放） | `{ route }` | 热榜、热评 |
| `public.object.toolbar` | 对象详情页（如 client-content） | `{ ref, summary }` | 收藏（interaction）、分享（content） |
| `public.object.after` | 对象详情页 | `{ ref, summary }` | 评论区（comment）、相关内容 |
| `public.object.aside` | 对象详情页 | `{ ref, summary }` | 同栏目最新、作者其他文章 |
| `console.header.actions` | 底座（控制台） | — | 「回复我的」红点 |

- `summary` 是对象详情里取到的对外信息（`capabilities`、计数、`link.web`），贡献方据 `capability` 过滤，**不能**拿它代替后端的授权检查。
- 渲染方式：`server` 是服务端组件，自己是一个缓存单元（自己的 `load` 与 `tags`）；`client` 是客户端岛；`hybrid` 是服务端出首屏（可收录）+ 客户端岛以服务端数据为初始值接管交互。
- 一个插槽里多个贡献按 `order`，站点配置 `slots.order` / `slots.hide` 可覆盖。贡献的服务端部分失败只影响自己（错误边界内显示空），不让整页 500。

### 10.3 卡片渲染器

列表、首页楼层、筛选器卡片流（`/app/channel/{code}` 返回的 `Card`）里的对象按 `ref.type` 选渲染器：模块用 `cardRenderers` 注册（content 注册 `content.item`，comment 注册 `comment.comment`），没有渲染器的类型退回底座的 `ObjectSummary` 通用卡片。渲染器是服务端组件，入参 `{ card, style }`（`style` 来自挂载的 `cardStyle`）。

## 11. robots、sitemap、RSS

### 11.1 robots.txt

底座生成：`Allow: /`；`Disallow:` 控制台前缀、`/api/`、登录注册页、站点配置的 `robots.disallow`；末尾 `Sitemap: {origin}/sitemap.xml`。不按搜索引擎分别写规则（需要时站点配置扩展）。

### 11.2 sitemap

- `/sitemap.xml` 是**索引**，列出所有贡献的全部分片：`/sitemaps/{贡献 id}-{分片 id}.xml`，以及有 news 贡献时的 `/sitemaps/news.xml`。
- 贡献入口导出：

```ts
export default defineSitemap({
  async shards(ctx): Promise<{ id: string; lastmod?: string }[]>,         // 分片要稳定：已有分片的 id 不随新内容变化
  async urls(shardId, ctx): Promise<{ loc: string; lastmod?: string; images?: { loc: string }[] }[]>,  // ≤ 50 000 条
  async news?(ctx): Promise<{ loc: string; title: string; publishedAt: string; language: string }[]>,  // 近 48 小时，≤ 1000 条
});
```

- 底座负责：拼 `origin`、XML 转义、单文件 50 000 条 / 50 MB 上限检查（超出构建期不可知，运行时截断并记错误日志）、`lastmod` 用 W3C 时间格式；不输出 `changefreq` / `priority`。
- 缓存：索引与分片走 `list` 档，打 `feed:{type}`；历史分片（如按月分片的往月）由贡献方标 `immutable`，走 `static` 档。
- news sitemap 的 `<news:publication>` 名称与语言取站点品牌与语言配置。

### 11.3 RSS

- 站点 feed `/rss.xml`（底座，聚合所有声明了 `site: true` 的 feed 贡献，按时间合并，前 50 条）；模块 feed 按 `pattern`（如 `/category/:slug/rss.xml`）。
- RSS 2.0，带 `atom:link rel="self"`；条目 `title`、`link`（规范地址）、`guid`（同 link，`isPermaLink="true"`）、`pubDate`、`description`（摘要，不输出全文，开放项 §16）、`category`。
- 缓存走 `list` 档。

### 11.4 IndexNow 密钥文件

环境变量 `NETON_SITE_INDEXNOW_KEY` 有值时，底座输出 `/indexnow-key.txt`（内容即密钥，`text/plain`，`static` 档）；服务端推送时 `keyLocation` 填 `{origin}/indexnow-key.txt`。没有设置时该路径 404。`/indexnow-key.txt` 一并列入保留路径。

### 11.5 死链文件（可选）

站点配置 `robots.deadLinkFile = true` 时输出 `/sitemaps/gone.txt`：已删除 URL 集合（§7.2）的纯文本列表，每行一个绝对地址，供提交到百度资源平台的死链工具。`list` 档缓存。

## 12. 国际化

- 第一版：公开页**每个部署一种语言**（`locales.prefix = "none"`），即站点配置的 `locales.default`；`<html lang>` 由服务端设置。
- 服务端翻译：运行时新增 `getServerT(namespace, locale)`（读同一份模块语言包与宿主静态词条），公开页、插槽的服务端部分、sitemap / RSS 里的文案都用它。模块里不得出现硬编码中文（与控制台同一条检查）。
- 客户端岛：公开布局用服务端语言初始化 `I18nProvider`，不读 localStorage；只有一种语言时不显示语言切换。
- 预留：`prefix: "non-default"` 时非默认语言加前缀（`/en/...`），每条路由按语言生成、输出 `hreflang` 备选。契约里的 `ctx.locale`、`alternates.languages` 现在就有，到时不改接口。
- 错误：公开页上的客户端岛同样用 `useDescribeError("<模块 id>")`；服务端 `load` 的错误不显示给用户（映射成状态码或抛出）。

## 13. 版本

- client-contract 1.1.0 只增字段；1.0.0 的模块不受影响。
- 注册表生成脚本的兼容规则从「major 相同」改为「major 相同且模块 minor ≤ 底座 minor」：用到 `publicRoutes` 等字段的模块声明 `contractVersion: "1.1.0"`，装在 1.0 底座上直接构建失败，而不是静默忽略字段。
- 路由 key、插槽 id、标签命名（§8.3）、失效端点的请求格式是契约，变更按 semver。
- **改 URL 形态是 SEO 层面的破坏性变更**：模块改缺省 `pattern`、或 fork 改 `override` 时，旧形态必须写进 `legacyPatterns`（模块）或站点配置的 `routes.legacy`（fork），底座生成 308；构建期比对上次构建的路由清单（`src/generated/public-routes.json` 入库），发现形态消失而没有 legacy 声明即失败。

## 14. 构建期检查（注册表生成脚本）

1. 路由 key 全局唯一；实例 key 不与模块路由重名。
2. 覆盖后的 `pattern` 两两不冲突（同形态、或静态段与参数段在同一位置互相遮挡）、不占保留前缀、不与 fork 手写的 `(public)` 页面冲突。
3. `override` 只改形态：参数名集合不变。
4. 有公开路由时 `consoleBasePath ≠ "/"`。
5. `entry` 都能解析；`slots`、`cardRenderers`、`sitemaps`、`feeds` 的入口同理；插槽 `target` 必须是已声明的插槽。
6. §5 的禁止 import 扫描。
7. §13 的 URL 形态回归检查。
8. contract 版本兼容（§13）。

## 15. 实施分期（底座部分）

| 期 | 内容 | 验收 |
| --- | --- | --- |
| P1 | 契约类型 1.1.0；`consoleBasePath` 与控制台路由生成；`front-workspace` 前缀支持（上游）；`(public)` 布局、外壳文件、`definePublicRoute` / `definePublicPage`；`ctx.backend`；§6 元数据渲染与 JSON-LD 构造器；状态映射（不含 410）；会话水合、`requireLogin`、`next` 跳回；代理匿名转发；服务端翻译；构建期检查 1–6、8 | 一个只装 client-account 的 fork 行为不变；一个示例模块的公开页匿名可访问、HTML 含完整主内容与元数据、Lighthouse SEO 100 |
| P2 | 缓存档位与 CDN 头；标签；失效端点；插槽与卡片渲染器；`ObjectStateBatcher` | 改一篇内容后 5 秒内（不含 CDN）页面更新；撤回后立即 404；带 Cookie 访问公开页的响应字节与匿名一致 |
| P3 | robots / sitemap / RSS；410（proxy + 已删除集合同步）；URL 形态回归检查 | sitemap 通过 Search Console 与百度资源平台校验；删除的 URL 返回 410 |

## 16. 开放项

| 项 | 默认 |
| --- | --- |
| 登录用整页跳转还是弹层 | 整页跳转（§9.2）；弹层以后作为可选外壳能力 |
| RSS 是否输出全文 | 只输出摘要（防整站被聚合器转载） |
| 410 是否值得 proxy 的成本 | 值得：只对 `goneAware` 路由生效，集合在内存里查，CDN 命中时不经过 proxy |
| 共享缓存处理器选型 | 第一版单实例，不需要；扩容时用 Redis |
| 是否需要按语言前缀的多语言门户 | 第一版不做，契约预留（§12） |
| `/api/site/revalidate` 的网络隔离由谁保证 | 部署（反代不暴露）+ 签名，两道都要 |
