import { auth } from "@/auth"
import { redirect } from "next/navigation"

export type AppRole = "KETUA" | "BENDAHARA" | "ANGGOTA"

export async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  return session.user
}

export async function requireRole(...roles: AppRole[]) {
  const user = await requireUser()
  const userRole = (user.role ?? "") as AppRole
  if (!roles.includes(userRole)) redirect("/dashboard")
  return user
}
