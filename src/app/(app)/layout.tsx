import { AppShell } from "@/components/app-shell"
import { requireUser } from "@/lib/access"
import { redirect } from "next/navigation"

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  // If user must change password, only allow access to /pengaturan
  // This check happens at layout level since middleware now delegates this
  return (
    <AppShell
      role={user.role}
      name={user.name ?? "Pengguna"}
      mustChangePassword={!!user.mustChangePassword}
    >
      {children}
    </AppShell>
  )
}
