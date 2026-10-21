import { siteFeedResponse } from "@/site/feeds";

/** 站点 feed（public-routes §11.3）：没有站点 feed 贡献时 404。 */
export function GET() {
  return siteFeedResponse();
}
