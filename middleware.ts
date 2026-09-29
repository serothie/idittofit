import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const path = request.nextUrl.pathname;
  const isProtected =
    path.startsWith("/plan") ||
    path.startsWith("/api/plan") ||
    path.startsWith("/today") ||
    path.startsWith("/week") ||
    path.startsWith("/memo") ||
    path.startsWith("/settings") ||
    path.startsWith("/history") ||
    path.startsWith("/api/log") ||
    path.startsWith("/api/athlete") ||
    path.startsWith("/api/recommend") ||
    path.startsWith("/api/history") ||
    path.startsWith("/api/memo");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    if (isProtected) {
      if (path.startsWith("/api/")) {
        return NextResponse.json({ ok: false, error: "misconfigured" }, { status: 503 });
      }
      return new NextResponse("Service misconfigured", { status: 503 });
    }
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtected && !user) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  if (path === "/login" && user) {
    return NextResponse.redirect(new URL("/today", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/plan/:path*",
    "/api/plan/:path*",
    "/today",
    "/week",
    "/memo",
    "/settings",
    "/history",
    "/api/log/:path*",
    "/api/athlete/:path*",
    "/api/recommend/:path*",
    "/api/history",
    "/api/memo/:path*",
    "/login",
  ],
};
