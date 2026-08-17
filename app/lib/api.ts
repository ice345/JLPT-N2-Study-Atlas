import { getCurrentAppUser } from "@/app/lib/auth";

export async function requireApiUser() {
  const user = await getCurrentAppUser();
  if (!user) return null;
  return user;
}

export function apiUnauthorized() {
  return Response.json({ error: "本地学习不需要登录；登录后才会进行跨设备同步。" }, { status: 401 });
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
