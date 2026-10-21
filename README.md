# neton-application-client

通用 **C 端用户控制台** base distribution（React 19 + Next.js App Router，SSR），对标云厂商控制台
（阿里云/腾讯云/AWS）的产品形态；与 `neton-application-front`（B 端管理台底座）同构、同维护模式。

与 front 底座的三个关键差异：

| 维度 | neton-application-front（B 端） | neton-application-client（C 端） |
|------|------|------|
| 账号体系 | module-system 管理员，`/admin` 组 | module-member 会员，`/app` 组（HttpOnly Cookie） |
| 导航 | 后端菜单驱动（RBAC） | 静态导航 `apps/console/src/config/console.nav.ts` |
| 路由 | 全部受保护 | 受保护控制台 + `(public)` 公开路由组（产品 fork 自行添加） |

公开路由（匿名可缓存的 SSR 门户页面、SEO、缓存失效、与控制台同域共存）的契约见
[docs/spec/public-routes.md](docs/spec/public-routes.md)（client-contract 1.1.0）。底座缺省是「只有控制台」的
形态（控制台在根路径，与 1.0 行为一致）；内容类产品在 `apps/console/site.config.ts` 设 `consoleBasePath`
（如 `/my`）后装配带 `publicRoutes` 的模块、在 `src/site/` 写门户外壳与页面。

- `apps/console` — Next.js 壳：会员登录（账密 / 短信验证码，`?next=` 跳回）、控制台（`consoleBasePath` 下）、
  门户（`(public)`：外壳、生成的公开路由、robots / sitemap / RSS、`/api/site/revalidate` 失效端点）
- `packages/client-contract` — 模块契约（manifest / 贡献点 / 版本协议）
- `packages/client-runtime` — envelope HTTP client、member 会话、静态导航工具；`public`（公开路由定义、SEO、
  缓存档位与标签、站点配置）、`public-server`（取数、渲染管线、失效与 410）、`public-proxy`、`public-client`
- `packages/client-kit` — UI 组件唯一属地（shadcn/Base UI 只进这里）

模块装配：产品 fork 在 `apps/console/client.modules.ts` 登记 `@neton/application-client-xxx` 模块
（file: 引 canonical sibling 仓，形态同 front 底座）。

```bash
pnpm install
pnpm registry       # 由 client.modules.ts + site.config.ts 生成注册表与路由文件（prebuild 自动跑）
pnpm typecheck      # registry + check:locales + 各包 tsc
pnpm test           # 生成脚本与运行时单测
pnpm dev            # NETON_BACKEND_URL 默认 http://localhost:8080
```

部署配置（环境变量）：`NETON_BACKEND_URL`（浏览器代理与会话校验用的后端地址）、`NETON_BACKEND_INTERNAL_URL`
（公开页服务端取数，内网直连，缺省回落前者）、`NETON_SITE_ORIGIN`（构建期覆盖站点 origin）、
`NETON_SITE_REVALIDATE_SECRET`（失效端点与已删除台账的共享密钥，≥ 32 字节）、`NETON_SITE_INDEXNOW_KEY`。
门户页面在 `next build` 时预渲染无参数的公开页（如首页），构建机需要能访问后端。
