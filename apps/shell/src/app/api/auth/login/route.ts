import { cookies } from "next/headers";
import { backendJson, SESSION_COOKIE } from "@neton/application-front-runtime/server";
import type { LoginResponse } from "@neton/application-front-runtime/types";

export async function POST(req: Request) {
  const body = await req.text();
  const res = await backendJson<LoginResponse>("/admin/system/auth/login", undefined, {
    method: "POST",
    body,
  });
  if (res.code !== 0 || !res.data) {
    return Response.json({ code: res.code || -1, message: res.message || "登录失败" }, { status: 401 });
  }
  const maxAge = Math.max(60, Math.floor((res.data.expiresTime - Date.now()) / 1000) || 8 * 3600);
  (await cookies()).set(SESSION_COOKIE, res.data.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  return Response.json({ code: 0, data: { username: res.data.username, nickname: res.data.nickname } });
}
