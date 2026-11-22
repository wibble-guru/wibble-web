import { NextResponse, type NextRequest } from "next/server";

/*
 * 어드민 낙관적 검사: 로그인 쿠키가 없으면 /admin/login으로 보낸다.
 * 쿠키 서명·만료 확인은 각 화면과 서버 액션의 requireAdmin()이 한다 (src/lib/admin/session.ts).
 */
const ADMIN_COOKIE = "wibble_admin";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login" || request.cookies.has(ADMIN_COOKIE)) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
