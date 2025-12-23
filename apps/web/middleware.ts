import { type NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "@workspace/auth/utils"

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request, {
    // Optionally pass config if cookie name or prefix is customized in auth config.
    cookiePrefix: "AC", // AgentCal
  })

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  return NextResponse.next()
}
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - sign in
     * - sign up
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!sign-in|sign-up|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
