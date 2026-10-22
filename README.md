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
pnpm e2e            # 端到端：夹具模块 + 模拟后端 + 真实 next build / next start（见 e2e/run.mts）
pnpm dev            # NETON_BACKEND_URL 默认 http://localhost:8080
pnpm budget         # 首屏 JS 预算（postbuild 自动跑）
pnpm lighthouse <url>…        # Lighthouse 门禁：移动端、devtools 节流、预热后 3 次有效测量的中位数（public-routes §10.6）
pnpm vitals:report <日志>…    # 真实用户 Web Vitals 的 p75 报告与门禁，--days 7 / --since / --until 时间窗（§10.7）
pnpm structured-data <url>…   # 本地结构化数据校验：schema.org 词表 + Google 富媒体规则（§6）
pnpm cdn:rules [--text]       # 由站点配置与公开路由生成 CDN 缓存规则（§8.2a）
```

部署配置（环境变量）：`NETON_BACKEND_URL`（浏览器代理与会话校验用的后端地址）、`NETON_BACKEND_INTERNAL_URL`
（公开页服务端取数，内网直连，缺省回落前者）、`NETON_SITE_ORIGIN`（构建期覆盖站点 origin）、
`NETON_SITE_REVALIDATE_SECRET`（失效端点与已删除台账的共享密钥，≥ 32 字节）、`NETON_SITE_INDEXNOW_KEY`、
`NETON_SITE_VITALS_LOG`（Web Vitals 收集端点的样本日志文件，缺省标准输出）、`NETON_SITE_SELF_URL`（热点预热请求本进程用的地址，
缺省 `http://localhost:$PORT`，§8.7）。CI：`.github/workflows/client-ci.yml`，兄弟仓库按 `scripts/ci/dependencies.lock` 检出
（`scripts/ci/update-dependency-lock.sh` 按本地验证过的提交号重新生成）。
`next build` 不连后端（public-routes §1a）：所有公开页面按需渲染，构建机不需要能访问后端。
`next start` 不要以 IP 字面量绑定（`-H 127.0.0.1` / `HOSTNAME=127.0.0.1`）：Next 16 下 proxy 的改写会落空成 404，
绑 `0.0.0.0` 或 `localhost`，内网隔离交给防火墙 / 反代（public-routes §2.3）。

端到端测试（`pnpm e2e`）是密封的：夹具经 `NETON_CLIENT_MODULES_FILE` / `NETON_SITE_CONFIG_FILE` /
`NETON_PUBLIC_ROUTES_FILE` 选用、构建到 `.next-e2e`，夹具模块只在运行期间复制进 shell，结束后按产品自己的配置
重新生成注册表；端口随机，模拟后端在测试进程内。`E2E_SERVE=1 pnpm e2e` 只构建并启动（排查用）。
产品 fork 合并底座后可以照样跑它，验证底座在自己的依赖版本下仍然成立。
