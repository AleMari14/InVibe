import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Skip middleware for WebSocket connections and Next.js internal routes
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/favicon.ico") ||
    request.nextUrl.pathname.startsWith("/public") ||
    request.headers.get("upgrade") === "websocket" ||
    request.nextUrl.pathname.includes("webpack-hmr") ||
    request.nextUrl.pathname.includes("_next/webpack-hmr")
  ) {
    return NextResponse.next()
  }

  // Public pages that don't require authentication
  const publicPages = ["/", "/auth/login", "/auth/registrati", "/auth/password-dimenticata", "/privacy", "/termini"]

  const isPublicPage = publicPages.some(
    (page) => request.nextUrl.pathname === page || request.nextUrl.pathname.startsWith("/evento/"),
  )

  if (isPublicPage) {
    return NextResponse.next()
  }

  try {
    const token = await getToken({ req: request })
    const isAuth = !!token
    const isAuthPage = request.nextUrl.pathname.startsWith("/auth")

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/", request.url))
      }
      return NextResponse.next()
    }

    if (!isAuth) {
      let from = request.nextUrl.pathname
      if (request.nextUrl.search) {
        from += request.nextUrl.search
      }

      return NextResponse.redirect(new URL(`/auth/login?from=${encodeURIComponent(from)}`, request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error:", error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
