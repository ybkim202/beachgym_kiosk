import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { ADMIN } from "./config";

const COOKIE = "bg_admin";

function token(): string {
  const secret = process.env.ADMIN_SECRET ?? "ilsan-beachgym-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(`admin:${ADMIN.password}`)
    .digest("hex");
}

/** 비밀번호 검증 후 세션 쿠키 발급 */
export async function signInAdmin(password: string): Promise<boolean> {
  if (password !== ADMIN.password) return false;
  const jar = await cookies();
  jar.set(COOKIE, token(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12시간
  });
  return true;
}

export async function signOutAdmin(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** 현재 요청이 관리자 인증 상태인지 */
export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(COOKIE)?.value === token();
}
