/**
 * 已删除 URL 集合（public-routes §7.2）。
 *
 * App Router 的页面只能产出 404，不能产出 410：goneAware 路由的 410 由 proxy 先查这个集合返回。
 * 集合的来源是服务端 site 模块的已删除台账——失效端点收到 `gone` / `revived` 时增删；启动时与
 * 每 10 分钟从后端增量同步（gone-sync.ts）。
 *
 * 缺省实现在进程内（单实例部署）。挂在 `globalThis` 上：proxy 与 Route Handler 是不同的打包入口、
 * 各有一份模块实例，只有全局对象是两边共享的。多实例部署用 [setGoneStore] 换成共享存储（如 Redis），
 * 与 Next 的共享缓存处理器放在同一处。
 */

export interface GoneStore {
  has(path: string): Promise<boolean> | boolean;
  add(paths: readonly string[]): Promise<void> | void;
  delete(paths: readonly string[]): Promise<void> | void;
  size(): Promise<number> | number;
  /** 全部地址（死链文件 /sitemaps/gone.txt 用）。 */
  list(): Promise<string[]> | string[];
}

const KEY = Symbol.for("neton.client.site.gone-store");

export class MemoryGoneStore implements GoneStore {
  private readonly paths = new Set<string>();
  has(path: string): boolean { return this.paths.has(path); }
  add(paths: readonly string[]): void { for (const p of paths) this.paths.add(p); }
  delete(paths: readonly string[]): void { for (const p of paths) this.paths.delete(p); }
  size(): number { return this.paths.size; }
  list(): string[] { return [...this.paths].sort(); }
}

type Holder = { [KEY]?: GoneStore };

export function goneStore(): GoneStore {
  const holder = globalThis as Holder;
  return (holder[KEY] ??= new MemoryGoneStore());
}

export function setGoneStore(store: GoneStore): void {
  (globalThis as Holder)[KEY] = store;
}
