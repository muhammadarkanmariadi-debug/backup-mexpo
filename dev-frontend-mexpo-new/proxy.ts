// proxy.ts (Next.js 16: Middleware was renamed to Proxy — see node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md)
// Proteksi route berdasarkan sesi login.
// Reads the httpOnly `token` cookie directly from the request — do NOT import
// "use server" modules or `next/headers` here (they are not available in the proxy runtime).

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/organizer", "/profile"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !request.cookies.get("token")?.value) {
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/organizer/:path*", "/profile"],
};
