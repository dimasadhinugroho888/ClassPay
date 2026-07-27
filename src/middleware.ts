import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const { nextUrl } = req
  
  // Decrypt the session token directly using next-auth/jwt
  const token = await getToken({ 
    req, 
    secret: process.env.AUTH_SECRET 
  })
  
  const isLoggedIn = !!token
  const isLoginPage = nextUrl.pathname === "/login"

  if (!isLoggedIn) {
    if (!isLoginPage) {
      return NextResponse.redirect(new URL("/login", nextUrl))
    }
    return NextResponse.next()
  }

  // User is logged in
  if (isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  // Force password change if required
  const mustChange = token?.mustChangePassword
  if (mustChange && nextUrl.pathname !== "/pengaturan" && !nextUrl.pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/pengaturan?force=true", nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
