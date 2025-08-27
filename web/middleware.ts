import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  const access = req.cookies.get("access")?.value;
  const { pathname } = req.nextUrl;

  const needsAuth = pathname.startsWith("/chat") || pathname.startsWith("/settings");
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (!access && needsAuth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (access && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/chat";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/settings", "/login", "/signup"],
};
