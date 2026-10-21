import { sitemapIndexResponse } from "@/site/feeds";

/** sitemap 索引（public-routes §11.2）：列出所有贡献的全部分片与 news sitemap。 */
export function GET() {
  return sitemapIndexResponse();
}
