import type { Metadata } from "next";
import { StatusPage, statusTitle } from "@/site/status-page";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await statusTitle("gone"), robots: { index: false, follow: true } };
}

/**
 * 410 页（public-routes §7.2）。只能经 proxy 改写到达（状态码 410）；外部直接访问 `/~gone` 由 proxy 拦成 404。
 */
export default function GonePage() {
  return <StatusPage kind="gone" />;
}
