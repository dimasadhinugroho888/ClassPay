import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      authorize: async (credentials) => {
        const data = z.object({
          username: z.string().min(1),
          password: z.string().min(1)
        }).safeParse(credentials)
        if (!data.success) return null
        const user = await prisma.user.findUnique({ where: { username: data.data.username } })
        if (!user || !(await compare(data.data.password, user.passwordHash))) return null
        return {
          id: user.id,
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    authorized: authConfig.callbacks!.authorized,
    jwt: async ({ token, user }) => {
      if (user) {
        // First sign-in: populate token from user object returned by authorize()
        token.role = (user as { role?: string }).role ?? "ANGGOTA"
        token.mustChangePassword = Boolean((user as { mustChangePassword?: boolean }).mustChangePassword)
        token.id = user.id
      } else if (token.sub && !token.role) {
        // Fallback: re-fetch from DB if role somehow missing
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
        session.user.id = (token.id as string) ?? token.sub!
        session.user.role = (token.role as "KETUA" | "BENDAHARA" | "ANGGOTA") ?? "ANGGOTA"
        session.user.mustChangePassword = Boolean(token.mustChangePassword)
      }
      return session
    },
  },
})
