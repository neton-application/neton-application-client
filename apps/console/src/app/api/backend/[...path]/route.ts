import { cookies } from "next/headers";
import { backendUrl, SESSION_COOKIE } from "@neton/application-client-runtime/server";

async function proxy(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return Response.json({ code: 401, message: "未登录" }, { status: 401 });

  const url = new URL(req.url);
  const target = `${backendUrl()}/${path.join("/")}${url.search}`;
  const res = await fetch(target, {
    method: req.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": req.headers.get("content-type") ?? "application/json",
    },
    body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.text(),
    cache: "no-store",
  });
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as DELETE, proxy as PATCH };
