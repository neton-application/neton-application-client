"use client";

/** 浏览器侧统一走 shell 的 /api/backend 代理（cookie → Bearer 由 server 补）。 */
import type { Envelope } from "./types";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/backend${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("unauthorized");
  }
  const body = (await res.json()) as Envelope<T>;
  if (body.code !== 0) throw new Error(body.message || `请求失败(code=${body.code})`);
  return body.data as T;
}
