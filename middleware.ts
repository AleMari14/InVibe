import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /protected)
  const path = request.nextUrl.pathname

  // Define paths that require authentication
  const protectedPaths = [
    "/crea-evento",
    "/profile",
    "/prenota",
    "/prenotazioni",
    "/preferiti",
    "/api/events",
    "/api/bookings",
    "/api/favorites",
    "/api/user",
  ]

  // Define public paths that should never be protected
  const publicPaths = [
    "/",
    "/auth/login",
    "/auth/registrati",
    "/auth/password-dimenticata",
    "/termini",
    "/privacy",
    "/api/auth",
    "/api/test-db",
  ]

  // Check if the current path is public
  const isPublicPath = publicPaths.some((publicPath) => path.startsWith(publicPath) || path === publicPath)

  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some((protectedPath) => path.startsWith(protectedPath))

  // If it's a protected path, check for authentication
  if (isProtectedPath) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    // If no token found, redirect to login
    if (!token) {
      const url = new URL("/auth/login", request.url)
      url.searchParams.set("callbackUrl", encodeURI(request.url))
      return NextResponse.redirect(url)
    }
  }

  // Continue with the request
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
