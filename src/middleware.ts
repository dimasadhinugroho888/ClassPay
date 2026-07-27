import { auth } from "@/auth"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isLoginPage = nextUrl.pathname === "/login"

  if (!isLoggedIn) {
    if (!isLoginPage) {
      return Response.redirect(new URL("/login", nextUrl))
    }
    return
  }

  // User is logged in
  if (isLoginPage) {
    return Response.redirect(new URL("/dashboard", nextUrl))
  }

  // Force password change if required
  const mustChange = req.auth?.user?.mustChangePassword
  if (mustChange && nextUrl.pathname !== "/pengaturan" && !nextUrl.pathname.startsWith("/api")) {
    return Response.redirect(new URL("/pengaturan?force=true", nextUrl))
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
