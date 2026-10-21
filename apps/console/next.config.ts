import type { NextConfig } from "next";
import { resolveSite } from "@neton/application-client-runtime/public";
import frontModules from "./client.modules";
import siteConfig from "./site.config";

// 与生成脚本同一份解析规则；这里失败（例如缓存档位比签名媒体地址活得久）直接中断启动与构建
const site = resolveSite(siteConfig, process.env);

const config: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  /**
   * 公开页面的缓存模型（public-routes §8）：`"use cache"` + `cacheTag` + `cacheLife`，整页 ISR；
   * Partial Prefetching 是 Cache Components 的配套开关（公开页面用整页导航，不依赖客户端预取）。
   * 缓存档位的时长在运行时包的 PUBLIC_CACHE_PROFILES，调用处直接传对象（单一来源）。
   */
  cacheComponents: true,
  partialPrefetching: true,
  env: {
    // 客户端代码（apiFetch 的登录跳转、consoleHref）需要知道控制台前缀；构建期常量
    NEXT_PUBLIC_NETON_CONSOLE_BASE_PATH: site.consoleBasePath || "/",
  },
  transpilePackages: [
    "@neton/application-client-contract",
    "@neton/application-front-workspace",
    "@neton/application-client-runtime",
    "@neton/application-client-kit",
    "@neton/application-client-resource",
    ...frontModules,
  ],
};

export default config;
