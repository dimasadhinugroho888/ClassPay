import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

// This config is EDGE-SAFE: no Prisma, no bcrypt, no heavy imports
// Used ONLY by middleware for route protection
export const authConfig = {
  providers: [
    // Empty credentials provider here - actual authorize logic is in auth.ts
    // We just need to declare it so NextAuth knows the provider exists
    Credentials({
      credentials: { username: {}, password: {} },
      authorize: () => null,
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ auth, request: { nextUrl } }) => {
      const isLoggedIn = !!auth?.user
      const isLoginPage = nextUrl.pathname === "/login"

      if (isLoginPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl))
        }
        return true
      }

      if (!isLoggedIn) {
        return false
      }

      return true
    },
  },
} satisfies NextAuthConfig
