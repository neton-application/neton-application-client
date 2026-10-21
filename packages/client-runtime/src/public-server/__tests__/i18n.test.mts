import assert from "node:assert/strict";
import { test } from "node:test";
import { createServerI18n } from "../i18n";

const i18n = createServerI18n({
  defaultLocale: "zh-CN",
  catalogs: { site: { "zh-CN": { hello: "你好，{name}", only: "仅中文" }, "en-US": { hello: "Hello, {name}" } } },
  registry: { filter: { "zh-CN": async () => ({ default: { count: "{n, plural, other {# 条}}" } }) } },
});

test("server translation with fallback to the default locale and to the key", async () => {
  const en = await i18n.getServerT("site", "en-US");
  assert.equal(en("hello", { name: "Ada" }), "Hello, Ada");
  assert.equal(en("only"), "仅中文");
  assert.equal(en("missing"), "missing");
  assert.equal(en.has("missing"), false);
  const zh = await i18n.getServerT("filter", "zh-CN");
  assert.equal(zh("count", { n: 3 }), "3 条");
});

test("catalogsFor returns what client islands need for first paint", async () => {
  assert.deepEqual(await i18n.catalogsFor(["filter", "site", "unknown"], "zh-CN"), {
    filter: { "zh-CN": { count: "{n, plural, other {# 条}}" } },
    site: { "zh-CN": { hello: "你好，{name}", only: "仅中文" } },
  });
});
