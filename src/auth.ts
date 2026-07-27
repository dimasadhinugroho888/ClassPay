import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Credentials({
    credentials: { username: {}, password: {} },
    authorize: async (credentials) => {
      const data = z.object({ username: z.string().min(1), password: z.string().min(1) }).safeParse(credentials)
      if (!data.success) return null
      const user = await prisma.user.findUnique({ where: { username: data.data.username } })
      if (!user || !(await compare(data.data.password, user.passwordHash))) return null
      return { id: user.id, name: user.name, role: user.role, mustChangePassword: user.mustChangePassword }
    },
  })],
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ auth, request: { nextUrl } }) => {
      const isLoggedIn = !!auth?.user
      const isLoginPage = nextUrl.pathname === "/login"
      
      if (isLoginPage) {
        if (isLoggedIn) {
          // Redirect logged-in users away from login page
          return Response.redirect(new URL("/dashboard", nextUrl))
        }
        return true
      }
      
      // Protect all other routes - redirect to login if not authenticated
      if (!isLoggedIn) {
        return false // NextAuth will redirect to signIn page
      }
      
      return true
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.mustChangePassword = user.mustChangePassword;
      } else if (token.sub) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub }, select: { role: true, mustChangePassword: true } });
        if (dbUser) {
          token.role = dbUser.role;
          token.mustChangePassword = dbUser.mustChangePassword;
        }
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as "KETUA" | "BENDAHARA" | "ANGGOTA";
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
  },
})
