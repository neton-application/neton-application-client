/**
 * 服务端翻译（public-routes §12）：公开页、插槽的服务端部分、sitemap / RSS 里的文案都用它。
 * 读同一份模块语言包（构建期注册表）与宿主静态词条；缺失回退默认语言，再回退 key 本身。
 */
import { formatMessage } from "../format-message";
import type { LocaleRegistry, Messages, StaticCatalogs } from "../i18n";

export interface ServerTranslate {
  (key: string, params?: Record<string, unknown>): string;
  has(key: string): boolean;
  readonly locale: string;
  readonly namespace: string;
}

export interface ServerI18n {
  getServerT(namespace: string, locale: string): Promise<ServerTranslate>;
  /** 一组命名空间在某语言（及默认语言回退）下的全部词条，供公开布局一次性交给客户端岛。 */
  catalogsFor(namespaces: readonly string[], locale: string): Promise<StaticCatalogs>;
}

export function createServerI18n(options: { registry: LocaleRegistry; catalogs: StaticCatalogs; defaultLocale: string }): ServerI18n {
  const cache = new Map<string, Promise<Messages | undefined>>();

  function load(namespace: string, locale: string): Promise<Messages | undefined> {
    const id = `${namespace}:${locale}`;
    let pending = cache.get(id);
    if (!pending) {
      const fromStatic = options.catalogs[namespace]?.[locale];
      const loader = options.registry[namespace]?.[locale];
      pending = fromStatic
        ? Promise.resolve(fromStatic)
        : loader ? loader().then((m) => m.default) : Promise.resolve(undefined);
      cache.set(id, pending);
    }
    return pending;
  }

  async function messagesFor(namespace: string, locale: string): Promise<Messages[]> {
    const chain = locale === options.defaultLocale ? [locale] : [locale, options.defaultLocale];
    return (await Promise.all(chain.map((l) => load(namespace, l)))).filter((m): m is Messages => m !== undefined);
  }

  return {
    async getServerT(namespace, locale) {
      const chain = await messagesFor(namespace, locale);
      const lookup = (key: string) => {
        for (const messages of chain) if (messages[key] !== undefined) return messages[key];
        return undefined;
      };
      const t = ((key: string, params?: Record<string, unknown>) => {
        const template = lookup(key);
        if (template === undefined) {
          if (process.env.NODE_ENV !== "production") console.warn(`[i18n] missing message ${namespace}.${key} (${locale})`);
          return key;
        }
        return formatMessage(template, params, locale);
      }) as ServerTranslate;
      t.has = (key) => lookup(key) !== undefined;
      Object.defineProperty(t, "locale", { value: locale });
      Object.defineProperty(t, "namespace", { value: namespace });
      return t;
    },
    async catalogsFor(namespaces, locale) {
      const out: StaticCatalogs = {};
      for (const ns of new Set(namespaces)) {
        const entries: Record<string, Messages> = {};
        for (const l of locale === options.defaultLocale ? [locale] : [locale, options.defaultLocale]) {
          const messages = await load(ns, l);
          if (messages) entries[l] = messages;
        }
        if (Object.keys(entries).length) out[ns] = entries;
      }
      return out;
    },
  };
}
