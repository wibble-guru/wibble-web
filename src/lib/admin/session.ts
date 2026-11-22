import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

/*
 * 어드민 로그인 세션. 비밀번호 하나(ADMIN_PASSWORD)로 들어가고,
 * 만료 시각에 서명한 값을 HttpOnly 쿠키에 담는다. 서명 키는 ADMIN_SESSION_SECRET (없으면 비밀번호에서 만든다).
 */
export const ADMIN_COOKIE = "wibble_admin";
const SESSION_HOURS = 12;

export const adminEnabled = () => Boolean(process.env.ADMIN_PASSWORD);

function secret() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD가 설정되지 않았어요");
  return process.env.ADMIN_SESSION_SECRET || `wibble-admin:${password}`;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(input: string) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  // 길이가 달라도 같은 시간이 걸리도록 해시끼리 비교
  return safeEqual(sign(`pw:${input}`), sign(`pw:${password}`));
}

function isValidToken(token: string | undefined) {
  if (!token || !adminEnabled()) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature || !safeEqual(signature, sign(expires))) return false;
  return Number(expires) > Date.now();
}

export async function startSession() {
  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  (await cookies()).set(ADMIN_COOKIE, `${expires}.${sign(String(expires))}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    expires: new Date(expires),
  });
}

export async function endSession() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
}

export async function isAdmin() {
  await connection(); // 만료 확인에 현재 시각을 쓰므로 요청 때만 판단한다
  return isValidToken((await cookies()).get(ADMIN_COOKIE)?.value);
}

/** 어드민 화면·서버 액션 첫 줄에서 부른다. 로그인 안 했으면 로그인 화면으로 */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
