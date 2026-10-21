import * as React from "react";
import { preload } from "react-dom";
import { mediaImageAttributes, type MediaImageOptions } from "./media";

/**
 * 公开页的图片（public-routes §10.4）。服务端渲染、**不带任何客户端 JS**：属性规则在 [mediaImageAttributes]，
 * 长开标签页的过期兜底由公开外框里的一段内联脚本按 `data-neton-media` 处理。
 *
 * `priority` 的图片（详情首图、列表前几张、焦点图第一张——LCP 候选）另外经 React 的 `preload`
 * 在 `<head>` 里输出 `<link rel="preload" as="image" fetchpriority="high">`（带 imagesrcset / imagesizes），
 * 浏览器在解析到 `<img>` 之前就开始下载。
 */
export function MediaImage(props: MediaImageOptions) {
  const attrs = mediaImageAttributes(props);
  if (props.priority) {
    preload(attrs.src, {
      as: "image",
      fetchPriority: "high",
      ...(attrs.srcSet ? { imageSrcSet: attrs.srcSet, imageSizes: attrs.sizes } : {}),
    });
  }
  // eslint-disable-next-line @next/next/no-img-element -- 缩放由 CDN 的图片处理参数完成，不经 Next 的图片优化（CLIENT_SPEC §7）
  return <img {...attrs} />;
}
