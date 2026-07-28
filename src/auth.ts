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

        return {
          id: user.id,
          name: user.name,
          // NextAuth needs email; use username as stand-in
          email: user.username,
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
        // On sign-in: copy custom fields from authorize() return value into token
        token.sub = user.id
        token.role = (user as unknown as { role: string }).role
        token.mustChangePassword = (user as unknown as { mustChangePassword: boolean }).mustChangePassword
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
