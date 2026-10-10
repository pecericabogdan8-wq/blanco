import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Old English URLs → Ukrainian
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace(/^\/en/, "/uk") || "/uk";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin")) {
    const session = req.cookies.get("blanco_session");
    if (!session?.value) {
      const url = req.nextUrl.clone();
      url.pathname = "/uk/auth/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
