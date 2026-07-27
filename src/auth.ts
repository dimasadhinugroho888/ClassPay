import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      authorize: async (credentials) => {
        const data = z.object({
          username: z.string().min(1),
          password: z.string().min(1)
        }).safeParse(credentials)
        if (!data.success) return null

        const user = await prisma.user.findUnique({
          where: { username: data.data.username }
        })
        if (!user || !(await compare(data.data.password, user.passwordHash))) return null

        // Return all fields explicitly — NextAuth v5 passes this to jwt callback as `user`
        return {
          id: user.id,
          name: user.name,
          email: user.username, // NextAuth expects email field, use username as fallback
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    authorized: authConfig.callbacks!.authorized,
    jwt: async ({ token, user }) => {
      if (user) {
        // First sign-in: `user` is the object returned from authorize()
        // Cast to any to access custom fields
        const u = user as {
          id: string
          role: string
          mustChangePassword: boolean
        }
        token.sub = u.id
        token.role = u.role
        token.mustChangePassword = u.mustChangePassword
      }

      // Always re-fetch from DB to keep role in sync
      // (handles role changes without forcing re-login)
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, mustChangePassword: true }
        })
        if (dbUser) {
          token.role = dbUser.role
          token.mustChangePassword = dbUser.mustChangePassword
        }
      }

      return token
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = (token.role ?? "ANGGOTA") as "KETUA" | "BENDAHARA" | "ANGGOTA"
        session.user.mustChangePassword = Boolean(token.mustChangePassword)
      }
      return session
    },
  },
})
