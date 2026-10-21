/**
 * sitemap（public-routes §11.2）与 RSS 2.0（§11.3）的 XML 生成：转义、W3C 时间、条数上限都在这里。
 */

export const SITEMAP_MAX_URLS = 50_000;
export const SITEMAP_MAX_BYTES = 50 * 1024 * 1024;
export const NEWS_SITEMAP_MAX_URLS = 1000;
export const SITE_FEED_ITEMS = 50;

export function escapeXml(text: string): string {
  return text.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!)
    // XML 1.0 不允许的控制字符直接去掉（标题里混进来的 \u0000 之类会让整份 sitemap 无效）
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, "");
}

/** 秒、毫秒时间戳或 ISO 字符串 → W3C Datetime（UTC，秒精度）。认不出返回 undefined。 */
export function w3cDate(value: number | string | undefined | null): string | undefined {
  if (value === undefined || value === null || value === "" || value === 0) return undefined;
  const ms = typeof value === "number" ? (value < 10_000_000_000 ? value * 1000 : value) : Date.parse(value);
  if (!Number.isFinite(ms)) return undefined;
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function rfc822Date(value: number | string | undefined | null): string | undefined {
  const iso = w3cDate(value);
  return iso ? new Date(iso).toUTCString() : undefined;
}

export interface SitemapUrl { loc: string; lastmod?: number | string; images?: { loc: string }[] }
export interface SitemapIndexEntry { loc: string; lastmod?: number | string }
export interface NewsUrl { loc: string; title: string; publishedAt: number | string; language: string }

export function sitemapIndexXml(entries: readonly SitemapIndexEntry[]): string {
  const body = entries.map((e) => {
    const lastmod = w3cDate(e.lastmod);
    return `<sitemap><loc>${escapeXml(e.loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</sitemap>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>\n`;
}

/** 超过 50 000 条截断并报告（构建期不可知，运行时截断，调用方记错误日志）。 */
export function sitemapUrlsetXml(urls: readonly SitemapUrl[]): { xml: string; truncated: boolean } {
  const kept = urls.slice(0, SITEMAP_MAX_URLS);
  const hasImages = kept.some((u) => u.images?.length);
  const body = kept.map((u) => {
    const lastmod = w3cDate(u.lastmod);
    const images = (u.images ?? []).map((i) => `<image:image><image:loc>${escapeXml(i.loc)}</image:loc></image:image>`).join("");
    return `<url><loc>${escapeXml(u.loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}${images}</url>`;
  }).join("");
  const ns = `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${hasImages ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ""}`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset ${ns}>${body}</urlset>\n`;
  return { xml, truncated: urls.length > SITEMAP_MAX_URLS || Buffer.byteLength(xml) > SITEMAP_MAX_BYTES };
}

export function newsSitemapXml(urls: readonly NewsUrl[], publication: { name: string; language: string }): string {
  const body = urls.slice(0, NEWS_SITEMAP_MAX_URLS).map((u) => `<url><loc>${escapeXml(u.loc)}</loc><news:news><news:publication><news:name>${escapeXml(publication.name)}</news:name><news:language>${escapeXml(u.language || publication.language)}</news:language></news:publication><news:publication_date>${w3cDate(u.publishedAt) ?? ""}</news:publication_date><news:title>${escapeXml(u.title)}</news:title></news:news></url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${body}</urlset>\n`;
}

export interface FeedItem { title: string; link: string; publishedAt: number | string; description?: string; categories?: string[] }
export interface FeedChannel { title: string; link: string; selfLink: string; description: string; language: string; items: readonly FeedItem[] }

/** RSS 2.0，带 `atom:link rel="self"`；guid = 规范地址（isPermaLink）。只输出摘要。 */
export function rssXml(channel: FeedChannel): string {
  const items = channel.items.map((item) => {
    const pubDate = rfc822Date(item.publishedAt);
    const categories = (item.categories ?? []).map((c) => `<category>${escapeXml(c)}</category>`).join("");
    return `<item><title>${escapeXml(item.title)}</title><link>${escapeXml(item.link)}</link><guid isPermaLink="true">${escapeXml(item.link)}</guid>${pubDate ? `<pubDate>${pubDate}</pubDate>` : ""}${item.description ? `<description>${escapeXml(item.description)}</description>` : ""}${categories}</item>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escapeXml(channel.title)}</title><link>${escapeXml(channel.link)}</link><description>${escapeXml(channel.description)}</description><language>${escapeXml(channel.language)}</language><atom:link href="${escapeXml(channel.selfLink)}" rel="self" type="application/rss+xml"/>${items}</channel></rss>\n`;
}

/** robots.txt（§11.1）。 */
export function robotsTxt(input: { origin: string; disallow: readonly string[] }): string {
  const disallow = [...new Set(input.disallow)];
  // 全站禁止（只有控制台的产品）时不给 Allow 与 sitemap
  if (disallow.includes("/")) return "User-agent: *\nDisallow: /\n";
  const lines = ["User-agent: *", "Allow: /", ...disallow.map((p) => `Disallow: ${p}`), "", `Sitemap: ${input.origin}/sitemap.xml`, ""];
  return lines.join("\n");
}
