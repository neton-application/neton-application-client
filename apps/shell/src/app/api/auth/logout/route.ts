import { cookies } from "next/headers";
import { backendJson, SESSION_COOKIE } from "@neton/application-front-runtime/server";

export async function POST() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await backendJson("/admin/system/auth/logout", token, { method: "POST" });
  store.delete(SESSION_COOKIE);
  return Response.json({ code: 0 });
}
