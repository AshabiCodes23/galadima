import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/employees/:path*", "/departments/:path*", "/kpis/:path*", "/submissions/:path*", "/alerts/:path*", "/audit/:path*", "/broadcast/:path*", "/profile/:path*", "/admin/:path*", "/login"],
};

const COOKIE_NAME = "galadima_token";
const PROTECTED_PREFIXES = ["/dashboard", "/employees", "/departments", "/kpis", "/submissions", "/alerts", "/audit", "/broadcast", "/profile", "/admin"];

export function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? verifyToken(token) : null;
  const isOnLoginPage = request.nextUrl.pathname === "/login";
  const isOnProtectedPage = PROTECTED_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p));

  if (!session && isOnProtectedPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && isOnLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}