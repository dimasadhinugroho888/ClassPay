import { auth } from "@/auth"
import { redirect } from "next/navigation"

export type AppRole = "KETUA" | "BENDAHARA" | "ANGGOTA"

export async function requireUser() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  return session.user
}

export async function requireRole(...roles: AppRole[]) {
  const user = await requireUser()
  if (!roles.includes(user.role)) redirect("/dashboard")
  return user
}
